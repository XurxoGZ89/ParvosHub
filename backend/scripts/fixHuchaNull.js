const { Pool } = require('pg');
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

async function fixHuchaOperations() {
  const client = await pool.connect();
  
  try {
    console.log('🔄 Arreglando operaciones de hucha con cuenta=null...\n');
    
    // Encontrar operaciones hucha con cuenta null
    const huchasNull = await client.query(`
      SELECT id, fecha, tipo, cantidad, info, usuario
      FROM operaciones 
      WHERE tipo = 'hucha' AND cuenta IS NULL
      ORDER BY fecha
    `);
    
    console.log(`📊 Encontradas ${huchasNull.rows.length} operaciones de hucha sin cuenta asignada\n`);
    
    if (huchasNull.rows.length === 0) {
      console.log('✅ No hay operaciones que arreglar');
      return;
    }
    
    // Para cada operación, actualizarla para que tenga cuenta='Ahorro'
    for (const op of huchasNull.rows) {
      await client.query(`
        UPDATE operaciones
        SET cuenta = 'Ahorro'
        WHERE id = $1
      `, [op.id]);
      
      console.log(`✅ Actualizada operación ID ${op.id}:`);
      console.log(`   Fecha: ${op.fecha}, Cantidad: ${op.cantidad}, Info: ${op.info}`);
    }
    
    console.log(`\n✅ Total: ${huchasNull.rows.length} operaciones actualizadas`);
    
    // Verificar resultado
    const verify = await client.query(`
      SELECT COUNT(*) as count
      FROM operaciones 
      WHERE tipo = 'hucha' AND cuenta IS NULL
    `);
    
    console.log(`\n📊 Operaciones de hucha con cuenta=null restantes: ${verify.rows[0].count}`);
    
    // Mostrar resumen final
    const summary = await client.query(`
      SELECT cuenta, COUNT(*) as cantidad
      FROM operaciones 
      WHERE tipo = 'hucha'
      GROUP BY cuenta
      ORDER BY cuenta
    `);
    
    console.log('\n📊 Resumen de operaciones tipo hucha por cuenta:');
    summary.rows.forEach(row => {
      console.log(`   - Cuenta "${row.cuenta || 'NULL'}": ${row.cantidad} registros`);
    });
    
  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

fixHuchaOperations()
  .then(() => {
    console.log('\n✅ Proceso completado exitosamente!');
    process.exit(0);
  })
  .catch(error => {
    console.error('Error fatal:', error);
    process.exit(1);
  });
