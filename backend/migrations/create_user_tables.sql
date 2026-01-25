-- ============================================
-- PARVOSHUB V2 - DATABASE SCHEMA
-- Script de creación de tablas para usuarios
-- ============================================

-- 1. Tabla de usuarios
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  username VARCHAR(50) UNIQUE NOT NULL,
  email VARCHAR(100) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  full_name VARCHAR(100) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Cuentas bancarias personales de usuarios
CREATE TABLE IF NOT EXISTS user_accounts (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  account_name VARCHAR(50) NOT NULL,
  account_type VARCHAR(20) DEFAULT 'checking',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT unique_user_account UNIQUE(user_id, account_name)
);

-- 3. Operaciones personales de usuarios
CREATE TABLE IF NOT EXISTS user_operations (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  account_id INTEGER REFERENCES user_accounts(id) ON DELETE SET NULL,
  date DATE NOT NULL,
  type VARCHAR(20) NOT NULL CHECK (type IN ('income', 'expense', 'savings', 'savings_withdrawal')),
  amount DECIMAL(10,2) NOT NULL,
  description TEXT,
  category VARCHAR(50),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Índices para mejorar el rendimiento de user_operations
CREATE INDEX IF NOT EXISTS idx_user_operations_user_id ON user_operations(user_id);
CREATE INDEX IF NOT EXISTS idx_user_operations_date ON user_operations(date);
CREATE INDEX IF NOT EXISTS idx_user_operations_type ON user_operations(type);
CREATE INDEX IF NOT EXISTS idx_user_operations_category ON user_operations(category);

-- 4. Categorías personales de usuarios
CREATE TABLE IF NOT EXISTS user_categories (
  id SERIAL PRIMARY KEY,
  name VARCHAR(50) NOT NULL UNIQUE,
  color VARCHAR(7) DEFAULT '#3B82F6',
  icon VARCHAR(50),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 5. Presupuestos personales por usuario
CREATE TABLE IF NOT EXISTS user_budgets (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  month VARCHAR(7) NOT NULL,
  category VARCHAR(50) NOT NULL,
  amount DECIMAL(10,2) DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT unique_user_budget UNIQUE(user_id, month, category)
);

-- Índices para user_budgets
CREATE INDEX IF NOT EXISTS idx_user_budgets_user_month ON user_budgets(user_id, month);

-- 6. Sesiones de usuario para autenticación
CREATE TABLE IF NOT EXISTS user_sessions (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token VARCHAR(500) NOT NULL UNIQUE,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Índice para búsqueda rápida de tokens
CREATE INDEX IF NOT EXISTS idx_user_sessions_token ON user_sessions(token);
CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id ON user_sessions(user_id);

-- ============================================
-- DATOS INICIALES
-- ============================================

-- Insertar categorías iniciales (mismas que Parvos pero separadas)
INSERT INTO user_categories (name, color, icon) VALUES
  ('Alimentación', '#FFB400', 'utensils'),
  ('Deporte', '#5AC8FA', 'dumbbell'),
  ('Extra', '#AF52DE', 'sparkles'),
  ('Hogar', '#34C759', 'home'),
  ('Movilidad', '#007AFF', 'car'),
  ('Ocio', '#FF3B30', 'smile'),
  ('Vacaciones', '#FF9500', 'plane')
ON CONFLICT (name) DO NOTHING;

-- ============================================
-- NOTA: Los usuarios (Sonia y Xurxo) se crearán 
-- mediante el script de inicialización del backend
-- con contraseñas hasheadas usando bcrypt
-- ============================================

-- Para verificar las tablas creadas:
-- SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_name LIKE 'user%';
