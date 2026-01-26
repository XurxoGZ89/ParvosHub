require('dotenv').config();
const { Pool } = require('pg');
const fs = require('fs');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

const sql = fs.readFileSync('./migrations/create_user_tables.sql', 'utf8');

pool.query(sql)
  .then(() => {
    console.log('✅ Migración ejecutada correctamente');
    console.log('✅ Tablas user_operations y user_accounts creadas');
    console.log('✅ Cuentas predefinidas insertadas');
    pool.end();
  })
  .catch(err => {
    console.error('❌ Error en migración:', err.message);
    pool.end();
    process.exit(1);
  });
