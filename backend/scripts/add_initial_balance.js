const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function addInitialBalance() {
  try {
    // Obtener user_id de xurxo
    const userResult = await pool.query('SELECT id FROM users WHERE username = $1', ['xurxo']);
    if (userResult.rows.length === 0) {
      console.log('❌ Usuario xurxo no encontrado');
      return;
    }
    const userId = userResult.rows[0].id;
    console.log('✅ Usuario xurxo encontrado con ID:', userId);

    // Insertar 1300€ en Ahorro
    await pool.query(
      'INSERT INTO user_operations (user_id, account_name, date, type, amount, description, category) VALUES ($1, $2, $3, $4, $5, $6, $7)',
      [userId, 'Ahorro', '2026-01-01', 'income', 1300, 'Saldo inicial cuenta ahorro', '']
    );
    console.log('✅ 1300€ añadidos a Ahorro');

    // Insertar 250€ en Prepago
    await pool.query(
      'INSERT INTO user_operations (user_id, account_name, date, type, amount, description, category) VALUES ($1, $2, $3, $4, $5, $6, $7)',
      [userId, 'Prepago', '2026-01-01', 'income', 250, 'Saldo inicial cuenta prepago', '']
    );
    console.log('✅ 250€ añadidos a Prepago');

    console.log('\n✅ Saldos iniciales añadidos correctamente');
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await pool.end();
  }
}

addInitialBalance();
