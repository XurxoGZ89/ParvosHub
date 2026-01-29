-- ============================================
-- Migración: Actualizar tipos de operaciones de usuario
-- Fecha: 29-01-2026
-- Descripción: Cambiar tipos de español a inglés en user_operations
-- ============================================

-- Primero, eliminar el constraint existente
ALTER TABLE user_operations DROP CONSTRAINT IF EXISTS user_operations_type_check;

-- Actualizar los tipos existentes de español a inglés
UPDATE user_operations SET type = 'income' WHERE type = 'ingreso';
UPDATE user_operations SET type = 'expense' WHERE type = 'gasto';
UPDATE user_operations SET type = 'savings' WHERE type = 'ahorro';
UPDATE user_operations SET type = 'savings_withdrawal' WHERE type = 'retirada-ahorro';

-- Añadir el nuevo constraint con tipos en inglés
ALTER TABLE user_operations 
ADD CONSTRAINT user_operations_type_check 
CHECK (type IN ('income', 'expense', 'savings', 'savings_withdrawal'));
