# Instrucciones para aplicar la migración de notas

## Opción 1: Ejecutar directamente con psql (Local)

```bash
psql -U postgres -d gastos_db -f backend/migrations/add_notas_column.sql
```

O si tienes variables de entorno configuradas:

```bash
psql $DATABASE_URL -f backend/migrations/add_notas_column.sql
```

## Opción 2: Ejecutar desde Node.js

```bash
cd backend
node -e "
const pool = require('./db');
const fs = require('fs');
const sql = fs.readFileSync('./migrations/add_notas_column.sql', 'utf8');
pool.query(sql).then(() => {
  console.log('✅ Migración ejecutada exitosamente');
  process.exit(0);
}).catch(err => {
  console.error('❌ Error:', err.message);
  process.exit(1);
});
"
```

## Opción 3: Ejecutar en Supabase (si usas Render)

1. Accede a tu base de datos Supabase
2. Abre el SQL Editor
3. Copia y ejecuta el contenido de `backend/migrations/add_notas_column.sql`

## Verificar que la migración se aplicó correctamente

```sql
-- Ver estructura de comidas_congeladas
\d comidas_congeladas

-- Ver estructura de comidas_planificadas
\d comidas_planificadas

-- Ambas deberían tener ahora la columna 'notas' de tipo TEXT
```
