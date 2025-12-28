const { Pool } = require('pg');
require('dotenv').config();

// Configurar la conexión desde variable de entorno o valores locales
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || `postgresql://${process.env.DB_USER || 'postgres'}:${process.env.DB_PASSWORD || 'password'}@${process.env.DB_HOST || 'localhost'}:${process.env.DB_PORT || 5432}/${process.env.DB_NAME || 'gastos_db'}`
});

pool.on('error', (err) => {
  console.error('Error inesperado en la conexión a PostgreSQL:', err);
});

pool.on('connect', () => {
  console.log('Conexión a PostgreSQL establecida');
});

// Función para inicializar la tabla
async function initDatabase() {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS operaciones (
        id SERIAL PRIMARY KEY,
        fecha TEXT NOT NULL,
        tipo TEXT NOT NULL,
        cantidad REAL NOT NULL,
        info TEXT,
        categoria TEXT,
        usuario TEXT,
        cuenta TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('Tabla operaciones lista');
  } catch (err) {
    console.error('Error al crear tabla:', err.message);
  }
}

// Inicializar BD al cargar el módulo
initDatabase();

module.exports = pool;
