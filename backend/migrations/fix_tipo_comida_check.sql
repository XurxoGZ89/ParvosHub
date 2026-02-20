-- Eliminar el CHECK constraint restrictivo que solo permite 'comida' y 'cena'
-- y reemplazarlo con uno que también permite 'desayuno'
ALTER TABLE comidas_planificadas DROP CONSTRAINT IF EXISTS comidas_planificadas_tipo_comida_check;
ALTER TABLE comidas_planificadas ADD CONSTRAINT comidas_planificadas_tipo_comida_check 
  CHECK (tipo_comida IN ('desayuno', 'comida', 'cena'));
