const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function fixInitialBalanceTypes() {
  try {
    // Obtener user_id de xurxo
    const userResult = await pool.query('SELECT id FROM users WHERE username = $1', ['xurxo']);
    if (userResult.rows.length === 0) {
      console.log('❌ Usuario xurxo no encontrado');
      return;
    }
    const userId = userResult.rows[0].id;
    console.log('✅ Usuario xurxo encontrado con ID:', userId);

    // Actualizar el tipo de la operación de Ahorro a 'savings'
    const result1 = await pool.query(
      'UPDATE user_operations SET type = $1 WHERE user_id = $2 AND account_name = $3 AND description = $4',
      ['savings', userId, 'Ahorro', 'Saldo inicial cuenta ahorro']
    );
    console.log('✅ Actualizado tipo de operación Ahorro a "savings":', result1.rowCount, 'filas');

    // La operación de Prepago debe permanecer como 'income' porque es saldo disponible
    console.log('✅ Operación Prepago mantiene tipo "income"');

    console.log('\n✅ Tipos de operaciones corregidos correctamente');
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await pool.end();
  }
}

fixInitialBalanceTypes();
