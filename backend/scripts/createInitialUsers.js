const bcrypt = require('bcryptjs');
const db = require('../db');

/**
 * Script para crear usuarios iniciales: Sonia y Xurxo
 * Ejecutar después de crear las tablas
 */
async function createInitialUsers() {
  try {
    console.log('Creando usuarios iniciales...');

    // Verificar si ya existen usuarios
    const existingUsers = await db.query('SELECT COUNT(*) FROM users');
    if (parseInt(existingUsers.rows[0].count) > 0) {
      console.log('⚠️  Ya existen usuarios en la base de datos. Saltando creación inicial.');
      return;
    }

    // Hash de contraseñas (cambiar en producción)
    const xurxoPassword = await bcrypt.hash('xurxo123', 10);
    const soniaPassword = await bcrypt.hash('sonia123', 10);

    // Crear usuario Xurxo
    const xurxoResult = await db.query(
      `INSERT INTO users (username, email, password_hash, full_name) 
       VALUES ($1, $2, $3, $4) RETURNING id`,
      ['xurxo', 'xurxo@parvoshub.com', xurxoPassword, 'Xurxo']
    );
    const xurxoId = xurxoResult.rows[0].id;
    console.log('✅ Usuario Xurxo creado');

    // Crear usuario Sonia
    const soniaResult = await db.query(
      `INSERT INTO users (username, email, password_hash, full_name) 
       VALUES ($1, $2, $3, $4) RETURNING id`,
      ['sonia', 'sonia@parvoshub.com', soniaPassword, 'Sonia']
    );
    const soniaId = soniaResult.rows[0].id;
    console.log('✅ Usuario Sonia creado');

    // Crear cuentas bancarias de Xurxo
    await db.query(
      `INSERT INTO user_accounts (user_id, account_name, account_type) VALUES 
       ($1, 'Santander', 'checking'),
       ($1, 'Ahorro', 'savings')`,
      [xurxoId]
    );
    console.log('✅ Cuentas de Xurxo creadas: Santander, Ahorro');

    // Crear cuentas bancarias de Sonia
    await db.query(
      `INSERT INTO user_accounts (user_id, account_name, account_type) VALUES 
       ($1, 'BBVA', 'checking'),
       ($1, 'Virtual', 'checking')`,
      [soniaId]
    );
    console.log('✅ Cuentas de Sonia creadas: BBVA, Virtual');

    console.log('\n🎉 Usuarios y cuentas iniciales creados correctamente!\n');
    console.log('📝 Credenciales de acceso:');
    console.log('   Xurxo -> usuario: xurxo, password: xurxo123');
    console.log('   Sonia -> usuario: sonia, password: sonia123');
    console.log('\n⚠️  IMPORTANTE: Cambia las contraseñas en producción!\n');

  } catch (error) {
    console.error('⚠️  Advertencia al crear usuarios iniciales:', error.message);
    // No lanzar el error para no bloquear el arranque del servidor
  }
}

module.exports = { createInitialUsers };
