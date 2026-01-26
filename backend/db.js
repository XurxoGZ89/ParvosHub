const { Pool } = require('pg');
require('dotenv').config();

// Configurar la conexión desde variable de entorno o valores locales
const connectionConfig = {
  connectionString: process.env.DATABASE_URL || `postgresql://${process.env.DB_USER || 'postgres'}:${process.env.DB_PASSWORD || 'password'}@${process.env.DB_HOST || 'localhost'}:${process.env.DB_PORT || 5432}/${process.env.DB_NAME || 'gastos_db'}`,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
};

console.log('📦 Inicializando conexión a PostgreSQL...');
if (process.env.DATABASE_URL) {
  console.log('✅ Usando DATABASE_URL de variables de entorno');
} else {
  console.log('⚠️  DATABASE_URL no configurado, usando valores locales');
}

const pool = new Pool(connectionConfig);

pool.on('error', (err) => {
  console.error('❌ Error inesperado en la conexión a PostgreSQL:', err.message);
});

pool.on('connect', () => {
  console.log('✅ Conexión a PostgreSQL establecida');
});

// Verificar conexión inicial
pool.connect((err, client, release) => {
  if (err) {
    console.error('❌ Error al conectar a la base de datos:', err.message);
    console.error('Stack:', err.stack);
  } else {
    console.log('✅ Conexión inicial a PostgreSQL verificada');
    release();
  }
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

    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username VARCHAR(50) UNIQUE NOT NULL,
        email VARCHAR(100) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        full_name VARCHAR(100) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('Tabla users lista');

    await pool.query(`
      CREATE TABLE IF NOT EXISTS user_accounts (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        account_name VARCHAR(50) NOT NULL,
        account_type VARCHAR(20) DEFAULT 'checking',
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT unique_user_account UNIQUE(user_id, account_name)
      );
    `);
    console.log('Tabla user_accounts lista');

    await pool.query(`
      CREATE TABLE IF NOT EXISTS user_sessions (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        token VARCHAR(500) NOT NULL UNIQUE,
        expires_at TIMESTAMP NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('Tabla user_sessions lista');

    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_user_sessions_token ON user_sessions(token);
    `);
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id ON user_sessions(user_id);
    `);
    console.log('Índices de user_sessions listos');

    await pool.query(`
      CREATE TABLE IF NOT EXISTS user_budgets (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        mes TEXT NOT NULL,
        categoria TEXT NOT NULL,
        cantidad REAL NOT NULL DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(user_id, mes, categoria)
      );
    `);
    console.log('Tabla user_budgets lista');

    await pool.query(`
      CREATE TABLE IF NOT EXISTS comidas_planificadas (
        id SERIAL PRIMARY KEY,
        comida_id INTEGER,
        comida_nombre VARCHAR(255),
        fecha DATE NOT NULL,
        tipo_comida VARCHAR(50),
        notas TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('Tabla comidas_planificadas lista');

    await pool.query(`
      CREATE TABLE IF NOT EXISTS comidas_congeladas (
        id SERIAL PRIMARY KEY,
        nombre VARCHAR(255) NOT NULL,
        categoria VARCHAR(100),
        fecha_congelacion DATE,
        notas TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('Tabla comidas_congeladas lista');

    await pool.query(`
      CREATE TABLE IF NOT EXISTS metas (
        id SERIAL PRIMARY KEY,
        nombre VARCHAR(255) NOT NULL,
        cantidad_objetivo REAL NOT NULL,
        cantidad_actual REAL DEFAULT 0,
        fecha_inicio DATE NOT NULL,
        fecha_objetivo DATE,
        categoria VARCHAR(100),
        notas TEXT,
        completada BOOLEAN DEFAULT false,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('Tabla metas lista');

    await pool.query(`
      CREATE TABLE IF NOT EXISTS actividad_reciente (
        id SERIAL PRIMARY KEY,
        tipo VARCHAR(50) NOT NULL,
        descripcion TEXT NOT NULL,
        usuario_id INTEGER REFERENCES users(id),
        metadata JSONB,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('Tabla actividad_reciente lista');
  } catch (err) {
    console.error('Error al crear tabla:', err.message);
  }
}

// Inicializar BD al cargar el módulo
initDatabase();

module.exports = pool;
