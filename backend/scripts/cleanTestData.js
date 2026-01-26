require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

async function cleanTestData() {
  try {
    // Borrar operaciones de prueba (las que tienen "prueba" en la descripción)
    const result = await pool.query(
      "DELETE FROM user_operations WHERE description ILIKE '%prueba%' RETURNING *"
    );
    
    console.log(`🗑️  ${result.rows.length} operaciones de prueba eliminadas`);
    
    if (result.rows.length > 0) {
      result.rows.forEach(op => {
        console.log(`   - ${op.description} (${op.amount}€ - ${op.date})`);
      });
    }
    
    pool.end();
  } catch (error) {
    console.error('❌ Error:', error.message);
    pool.end();
    process.exit(1);
  }
}

cleanTestData();
