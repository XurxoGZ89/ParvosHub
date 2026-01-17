-- Mejoras para el calendario de comidas/despensa
-- Ejecutar en Supabase SQL Editor

-- 1. Añadir columnas a comidas_congeladas
ALTER TABLE comidas_congeladas 
ADD COLUMN IF NOT EXISTS categoria VARCHAR(50) DEFAULT 'otros',
ADD COLUMN IF NOT EXISTS fecha_caducidad DATE,
ADD COLUMN IF NOT EXISTS cantidad INTEGER DEFAULT 1;

-- 2. Crear índice para búsquedas por categoría
CREATE INDEX IF NOT EXISTS idx_comidas_congeladas_categoria ON comidas_congeladas(categoria);

-- 3. Crear índice para alertas de caducidad
CREATE INDEX IF NOT EXISTS idx_comidas_congeladas_caducidad ON comidas_congeladas(fecha_caducidad) WHERE fecha_caducidad IS NOT NULL;

-- 4. Comentarios descriptivos
COMMENT ON COLUMN comidas_congeladas.categoria IS 'Categoría del producto: carne, pescado, verdura, legumbre, fruta, lacteo, otros';
COMMENT ON COLUMN comidas_congeladas.fecha_caducidad IS 'Fecha de caducidad o congelación del producto';
COMMENT ON COLUMN comidas_congeladas.cantidad IS 'Cantidad de unidades disponibles';

-- 5. Actualizar productos existentes con categoría por defecto
UPDATE comidas_congeladas SET categoria = 'otros' WHERE categoria IS NULL;
UPDATE comidas_congeladas SET cantidad = 1 WHERE cantidad IS NULL;
