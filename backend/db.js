const { Pool } = require('pg');
require('dotenv').config();

// Configurar la conexión desde variable de entorno o valores locales
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || `postgresql://${process.env.DB_USER || 'postgres'}:${process.env.DB_PASSWORD || 'password'}@${process.env.DB_HOST || 'localhost'}:${process.env.DB_PORT || 5432}/${process.env.DB_NAME || 'gastos_db'}`,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
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
    
    await pool.query(`
      CREATE TABLE IF NOT EXISTS presupuestos (
        id SERIAL PRIMARY KEY,
        mes TEXT NOT NULL,
        categoria TEXT NOT NULL,
        cantidad REAL NOT NULL DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(mes, categoria)
      );
    `);
    console.log('Tabla presupuestos lista');

    await pool.query(`
      CREATE TABLE IF NOT EXISTS calendar_events (
        id SERIAL PRIMARY KEY,
        nombre TEXT NOT NULL,
        dia_mes INTEGER NOT NULL CHECK (dia_mes >= 1 AND dia_mes <= 31),
        cantidad_min REAL NOT NULL,
        cantidad_max REAL,
        categoria TEXT NOT NULL,
        recurrencia JSONB NOT NULL,
        activo BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('Tabla calendar_events lista');

    await pool.query(`
      CREATE TABLE IF NOT EXISTS dismissed_warnings (
        id SERIAL PRIMARY KEY,
        evento_id INTEGER NOT NULL REFERENCES calendar_events(id) ON DELETE CASCADE,
        mes_ano TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(evento_id, mes_ano)
      );
    `);
    console.log('Tabla dismissed_warnings lista');
  } catch (err) {
    console.error('Error al crear tabla:', err.message);
  }
}

// Inicializar BD al cargar el módulo
initDatabase();

module.exports = pool;
