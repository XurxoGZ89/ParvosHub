-- Agregar campo initial_balance a user_accounts
ALTER TABLE user_accounts 
ADD COLUMN IF NOT EXISTS initial_balance DECIMAL(10,2) DEFAULT 0.00;

-- Actualizar las cuentas existentes con balance inicial 0
UPDATE user_accounts 
SET initial_balance = 0.00 
WHERE initial_balance IS NULL;
