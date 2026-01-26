require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

async function checkTables() {
  try {
    // Verificar columnas de user_accounts
    const accountsColumns = await pool.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'user_accounts'
      ORDER BY ordinal_position
    `);
    
    console.log('\n📋 Columnas de user_accounts:');
    accountsColumns.rows.forEach(row => {
      console.log(`  - ${row.column_name} (${row.data_type})`);
    });
    
    // Verificar columnas de user_operations
    const operationsColumns = await pool.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'user_operations'
      ORDER BY ordinal_position
    `);
    
    console.log('\n📋 Columnas de user_operations:');
    operationsColumns.rows.forEach(row => {
      console.log(`  - ${row.column_name} (${row.data_type})`);
    });
    
    // Contar registros
    const accountsCount = await pool.query('SELECT COUNT(*) FROM user_accounts');
    const operationsCount = await pool.query('SELECT COUNT(*) FROM user_operations');
    
    console.log(`\n📊 Total de cuentas: ${accountsCount.rows[0].count}`);
    console.log(`📊 Total de operaciones: ${operationsCount.rows[0].count}`);
    
    pool.end();
  } catch (error) {
    console.error('❌ Error:', error.message);
    pool.end();
  }
}

checkTables();
