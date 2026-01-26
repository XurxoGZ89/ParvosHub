require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

const sql = `
ALTER TABLE user_operations 
ADD COLUMN IF NOT EXISTS account_name VARCHAR(50);

UPDATE user_operations uo
SET account_name = ua.account_name
FROM user_accounts ua
WHERE uo.account_id = ua.id AND uo.account_name IS NULL;
`;

pool.query(sql)
  .then(() => {
    console.log('✅ Campo account_name agregado correctamente a user_operations');
    pool.end();
  })
  .catch(err => {
    console.error('❌ Error:', err.message);
    pool.end();
    process.exit(1);
  });
