-- ============================================
-- PARVOSHUB - USER GOALS TABLE
-- Tabla de metas de ahorro personales
-- ============================================

-- Crear tabla de metas de ahorro para usuarios
CREATE TABLE IF NOT EXISTS user_goals (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  nombre VARCHAR(100) NOT NULL,
  cantidad_objetivo DECIMAL(10,2) NOT NULL,
  cantidad_actual DECIMAL(10,2) DEFAULT 0.00,
  fecha_inicio DATE NOT NULL,
  fecha_objetivo DATE,
  categoria VARCHAR(50) DEFAULT 'Personal',
  notas TEXT,
  completada BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Índices para mejorar el rendimiento
CREATE INDEX IF NOT EXISTS idx_user_goals_user_id ON user_goals(user_id);
CREATE INDEX IF NOT EXISTS idx_user_goals_completada ON user_goals(completada);
CREATE INDEX IF NOT EXISTS idx_user_goals_fecha_objetivo ON user_goals(fecha_objetivo);

-- Comentarios descriptivos
COMMENT ON TABLE user_goals IS 'Metas de ahorro personales de usuarios';
COMMENT ON COLUMN user_goals.nombre IS 'Nombre descriptivo de la meta';
COMMENT ON COLUMN user_goals.cantidad_objetivo IS 'Monto total que se desea ahorrar';
COMMENT ON COLUMN user_goals.cantidad_actual IS 'Monto actualmente ahorrado';
COMMENT ON COLUMN user_goals.fecha_inicio IS 'Fecha en la que se estableció la meta';
COMMENT ON COLUMN user_goals.fecha_objetivo IS 'Fecha límite para alcanzar la meta (opcional)';
COMMENT ON COLUMN user_goals.completada IS 'Indica si la meta ha sido completada';
