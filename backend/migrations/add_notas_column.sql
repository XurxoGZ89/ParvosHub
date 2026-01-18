-- Migración: Agregar columna 'notas' a las tablas de comidas
-- Fecha: 2026-01-18

-- Agregar columna notas a comidas_congeladas (si no existe)
DO $$ 
BEGIN 
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='comidas_congeladas' AND column_name='notas') THEN 
    ALTER TABLE comidas_congeladas ADD COLUMN notas TEXT DEFAULT NULL;
    CREATE INDEX idx_comidas_congeladas_notas ON comidas_congeladas (notas) WHERE notas IS NOT NULL;
    RAISE NOTICE 'Columna notas agregada a comidas_congeladas';
  ELSE
    RAISE NOTICE 'Columna notas ya existe en comidas_congeladas';
  END IF;
END $$;

-- Agregar columna notas a comidas_planificadas (si no existe)
DO $$ 
BEGIN 
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='comidas_planificadas' AND column_name='notas') THEN 
    ALTER TABLE comidas_planificadas ADD COLUMN notas TEXT DEFAULT NULL;
    CREATE INDEX idx_comidas_planificadas_notas ON comidas_planificadas (notas) WHERE notas IS NOT NULL;
    RAISE NOTICE 'Columna notas agregada a comidas_planificadas';
  ELSE
    RAISE NOTICE 'Columna notas ya existe en comidas_planificadas';
  END IF;
END $$;
