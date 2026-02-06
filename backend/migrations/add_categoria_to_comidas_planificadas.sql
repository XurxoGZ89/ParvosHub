-- Añadir campo categoria a comidas_planificadas para poder clasificar
-- Categorías: pescado, carne, vegetariano, otros
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'comidas_planificadas' AND column_name = 'categoria'
  ) THEN
    ALTER TABLE comidas_planificadas ADD COLUMN categoria VARCHAR(50) DEFAULT NULL;
  END IF;
END $$;

-- Asegurar que comidas_congeladas tiene las columnas necesarias
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'comidas_congeladas' AND column_name = 'tachada'
  ) THEN
    ALTER TABLE comidas_congeladas ADD COLUMN tachada BOOLEAN DEFAULT false;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'comidas_congeladas' AND column_name = 'fecha_tachada'
  ) THEN
    ALTER TABLE comidas_congeladas ADD COLUMN fecha_tachada TIMESTAMP DEFAULT NULL;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'comidas_congeladas' AND column_name = 'fecha_caducidad'
  ) THEN
    ALTER TABLE comidas_congeladas ADD COLUMN fecha_caducidad DATE DEFAULT NULL;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'comidas_congeladas' AND column_name = 'cantidad'
  ) THEN
    ALTER TABLE comidas_congeladas ADD COLUMN cantidad INTEGER DEFAULT 1;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'comidas_congeladas' AND column_name = 'fecha_creacion'
  ) THEN
    ALTER TABLE comidas_congeladas ADD COLUMN fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
  END IF;
END $$;
