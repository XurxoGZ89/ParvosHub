const { Pool } = require('pg');
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

async function migrateTipos() {
  const client = await pool.connect();
  
  try {
    console.log('🔄 Iniciando migración de tipos legacy...\n');
    
    // Ver cuántos registros legacy tenemos
    const countLegacy = await client.query(`
      SELECT 
        tipo, 
        COUNT(*) as cantidad,
        MIN(fecha) as fecha_mas_antigua,
        MAX(fecha) as fecha_mas_reciente
      FROM operaciones 
      WHERE tipo IN ('Ahorro', 'Retirada')
      GROUP BY tipo
    `);
    
    console.log('📊 Registros legacy encontrados:');
    if (countLegacy.rows.length === 0) {
      console.log('   ✅ No hay registros legacy que migrar\n');
    } else {
      countLegacy.rows.forEach(row => {
        console.log(`   - ${row.tipo}: ${row.cantidad} registros`);
        console.log(`     Desde: ${row.fecha_mas_antigua} hasta ${row.fecha_mas_reciente}`);
      });
      console.log('');
    }
    
    // Actualizar 'Ahorro' a 'hucha'
    const updateAhorro = await client.query(`
      UPDATE operaciones 
      SET tipo = 'hucha' 
      WHERE tipo = 'Ahorro'
    `);
    console.log(`✅ Actualizados ${updateAhorro.rowCount} registros de 'Ahorro' -> 'hucha'`);
    
    // Actualizar 'Retirada' a 'retirada-hucha'
    const updateRetirada = await client.query(`
      UPDATE operaciones 
      SET tipo = 'retirada-hucha' 
      WHERE tipo = 'Retirada'
    `);
    console.log(`✅ Actualizados ${updateRetirada.rowCount} registros de 'Retirada' -> 'retirada-hucha'\n`);
    
    // Verificar que no queden tipos legacy
    const verifyLegacy = await client.query(`
      SELECT 
        tipo, 
        COUNT(*) as cantidad
      FROM operaciones 
      WHERE tipo IN ('Ahorro', 'Retirada')
      GROUP BY tipo
    `);
    
    if (verifyLegacy.rows.length === 0) {
      console.log('✅ Verificación exitosa: No quedan tipos legacy\n');
    } else {
      console.log('⚠️  ADVERTENCIA: Aún quedan tipos legacy:');
      verifyLegacy.rows.forEach(row => {
        console.log(`   - ${row.tipo}: ${row.cantidad} registros`);
      });
      console.log('');
    }
    
    // Mostrar resumen de tipos actuales
    const summary = await client.query(`
      SELECT 
        tipo, 
        COUNT(*) as cantidad
      FROM operaciones 
      GROUP BY tipo
      ORDER BY tipo
    `);
    
    console.log('📊 Resumen de tipos actuales en la tabla operaciones:');
    summary.rows.forEach(row => {
      console.log(`   - ${row.tipo}: ${row.cantidad} registros`);
    });
    
    console.log('\n✅ Migración completada exitosamente!');
    
  } catch (error) {
    console.error('❌ Error durante la migración:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

migrateTipos()
  .then(() => process.exit(0))
  .catch(error => {
    console.error('Error fatal:', error);
    process.exit(1);
  });
