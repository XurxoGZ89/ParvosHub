# 🔧 Solución de Problemas - Conexión a Supabase

## Error: ENOTFOUND db.anygelretukppegrpeag.supabase.co

Este error indica que el backend no puede conectarse a la base de datos de Supabase.

## ✅ Solución: Verificar y Actualizar DATABASE_URL

### 1. Obtener la URL correcta de Supabase

1. Ve a [supabase.com](https://supabase.com) y haz login
2. Selecciona tu proyecto
3. En el menú lateral, ve a **Settings** ⚙️
4. Selecciona **Database**
5. En la sección **Connection string**, copia la **URI** (Connection Pooling)
6. Formato: `postgresql://postgres.[referencia]:[PASSWORD]@aws-0-eu-central-1.pooler.supabase.com:6543/postgres`

### 2. Actualizar el archivo .env

Edita `/Users/xurxo/Documents/ParvosHub/backend/.env`:

```env
DATABASE_URL=postgresql://postgres.[TU_REFERENCIA]:[TU_PASSWORD]@[HOST_CORRECTO]:6543/postgres
```

**Importante:** 
- Reemplaza `[TU_PASSWORD]` con tu contraseña real
- Si la contraseña tiene caracteres especiales, codifícalos:
  - `@` → `%40`
  - `#` → `%23`
  - `$` → `%24`
  - Etc.

### 3. Verificar el proyecto de Supabase

Si el proyecto está **pausado**:
1. Ve a tu proyecto en Supabase
2. Click en **Resume project** si está pausado
3. Espera 1-2 minutos a que se active

### 4. Reiniciar el servidor backend

```bash
# Detener el servidor actual (Ctrl+C en la terminal donde corre)
# Luego:
cd /Users/xurxo/Documents/ParvosHub/backend
node index.js
```

Deberías ver:
```
Creando usuarios iniciales...
Conexión a PostgreSQL establecida
Tabla operaciones lista
Tabla presupuestos lista
...
✅ Usuario Xurxo creado
✅ Usuario Sonia creado
...
Servidor backend escuchando en puerto 3001
```

---

## 🧪 Probar la Conexión Manualmente

Puedes probar la conexión con:

```bash
cd /Users/xurxo/Documents/ParvosHub/backend
node -e "const { Pool } = require('pg'); const pool = new Pool({ connectionString: process.env.DATABASE_URL }); pool.query('SELECT NOW()').then(r => console.log('✅ Conexión OK:', r.rows[0])).catch(e => console.error('❌ Error:', e.message));"
```

---

## 📞 Si el problema persiste

1. Verifica que tienes conexión a internet
2. Comprueba que el proyecto de Supabase está activo
3. Revisa que la contraseña sea correcta
4. Asegúrate de que el firewall no esté bloqueando la conexión

---

**Próximo paso:** Una vez conectado correctamente, el backend creará automáticamente los usuarios Xurxo y Sonia.
