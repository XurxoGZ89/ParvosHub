require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

const sql = `
ALTER TABLE user_accounts 
ADD COLUMN IF NOT EXISTS initial_balance DECIMAL(10,2) DEFAULT 0.00;

UPDATE user_accounts 
SET initial_balance = 0.00 
WHERE initial_balance IS NULL;
`;

pool.query(sql)
  .then(() => {
    console.log('✅ Campo initial_balance agregado correctamente');
    pool.end();
  })
  .catch(err => {
    console.error('❌ Error:', err.message);
    pool.end();
    process.exit(1);
  });
