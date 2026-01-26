require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

async function deleteAhorroAccount() {
  try {
    const result = await pool.query(`
      DELETE FROM user_accounts 
      WHERE account_name = 'Ahorro' 
      AND user_id = (SELECT id FROM users WHERE username = 'xurxo')
      RETURNING *
    `);
    
    if (result.rowCount > 0) {
      console.log('✅ Cuenta "Ahorro" eliminada correctamente');
      console.log('   Cuenta eliminada:', result.rows[0].account_name);
    } else {
      console.log('ℹ️  No se encontró cuenta "Ahorro" para eliminar');
    }
    
    pool.end();
  } catch (error) {
    console.error('❌ Error:', error.message);
    pool.end();
  }
}

deleteAhorroAccount();
