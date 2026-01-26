require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

async function checkAccounts() {
  try {
    const result = await pool.query(`
      SELECT ua.*, u.username 
      FROM user_accounts ua
      JOIN users u ON ua.user_id = u.id
      ORDER BY u.username, ua.id
    `);
    
    console.log('\n📋 Cuentas de usuario:');
    result.rows.forEach(row => {
      console.log(`  ${row.username}: ${row.account_name} (${row.account_type}) - Activa: ${row.is_active}`);
    });
    
    pool.end();
  } catch (error) {
    console.error('❌ Error:', error.message);
    pool.end();
  }
}

checkAccounts();
