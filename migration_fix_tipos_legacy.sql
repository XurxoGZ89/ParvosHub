-- Migración para actualizar tipos legacy de operaciones
-- Fecha: 2026-01-28
-- Descripción: Actualizar 'Ahorro' -> 'hucha' y 'Retirada' -> 'retirada-hucha'

BEGIN;

-- Ver cuántos registros legacy tenemos
SELECT 
    tipo, 
    COUNT(*) as cantidad,
    MIN(fecha) as fecha_mas_antigua,
    MAX(fecha) as fecha_mas_reciente
FROM operaciones 
WHERE tipo IN ('Ahorro', 'Retirada')
GROUP BY tipo;

-- Actualizar 'Ahorro' a 'hucha'
UPDATE operaciones 
SET tipo = 'hucha' 
WHERE tipo = 'Ahorro';

-- Actualizar 'Retirada' a 'retirada-hucha'
UPDATE operaciones 
SET tipo = 'retirada-hucha' 
WHERE tipo = 'Retirada';

-- Verificar que no queden tipos legacy
SELECT 
    tipo, 
    COUNT(*) as cantidad
FROM operaciones 
WHERE tipo IN ('Ahorro', 'Retirada')
GROUP BY tipo;

-- Mostrar resumen de tipos actuales
SELECT 
    tipo, 
    COUNT(*) as cantidad
FROM operaciones 
GROUP BY tipo
ORDER BY tipo;

COMMIT;
