-- Script de migración para añadir columna de notas a comidas_planificadas
-- Ejecutar solo si la tabla ya existe sin la columna notas

ALTER TABLE comidas_planificadas 
ADD COLUMN IF NOT EXISTS notas TEXT;