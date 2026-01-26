require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

async function checkMealColumns() {
  try {
    const columnsQuery = await pool.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'comidas_planificadas'
      ORDER BY ordinal_position
    `);
    
    console.log('\n📋 Columnas de comidas_planificadas:');
    columnsQuery.rows.forEach(row => {
      console.log(`  - ${row.column_name} (${row.data_type})`);
    });
    
    // Mostrar un registro de ejemplo
    const exampleQuery = await pool.query('SELECT * FROM comidas_planificadas LIMIT 1');
    if (exampleQuery.rows.length > 0) {
      console.log('\n📝 Ejemplo de registro:');
      console.log(JSON.stringify(exampleQuery.rows[0], null, 2));
    }
    
    pool.end();
  } catch (error) {
    console.error('❌ Error:', error.message);
    pool.end();
  }
}

checkMealColumns();
