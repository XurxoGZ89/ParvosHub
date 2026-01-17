-- Tablas para el Calendario de Comidas

-- Tabla de comidas congeladas (inventario)
CREATE TABLE IF NOT EXISTS comidas_congeladas (
    id SERIAL PRIMARY KEY,
    nombre TEXT NOT NULL,
    notas TEXT,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    tachada BOOLEAN DEFAULT false,
    fecha_tachada TIMESTAMP
);

-- Tabla de comidas planificadas (calendario)
CREATE TABLE IF NOT EXISTS comidas_planificadas (
    id SERIAL PRIMARY KEY,
    comida_id INTEGER REFERENCES comidas_congeladas(id) ON DELETE SET NULL,
    comida_nombre TEXT NOT NULL,
    fecha DATE NOT NULL,
    tipo_comida TEXT NOT NULL CHECK (tipo_comida IN ('comida', 'cena')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Índices para mejorar rendimiento
CREATE INDEX IF NOT EXISTS idx_comidas_planificadas_fecha ON comidas_planificadas(fecha);
CREATE INDEX IF NOT EXISTS idx_comidas_congeladas_tachada ON comidas_congeladas(tachada);
