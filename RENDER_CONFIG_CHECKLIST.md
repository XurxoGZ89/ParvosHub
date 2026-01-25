# Configuración Completa de Render - Checklist

## ⚠️ Problema Actual
```
curl https://parvoshub-api.onrender.com/health
{"status":"error","message":"Error de conexión a base de datos"}
```

La BD de Supabase no está siendo alcanzada desde Render.

---

## ✅ Checklist: Pasos Exactos en Render

### Paso 1: Acceder al Dashboard de Render
1. Ve a https://dashboard.render.com
2. Selecciona tu proyecto **parvoshub-api**
3. Click en **Settings** (esquina superior derecha)

### Paso 2: Configurar Variables de Entorno
1. Ir a **Settings → Environment**
2. Verifica/Actualiza estas variables:

```
DATABASE_URL
postgresql://postgres.anygelretukppegrpeag:xurxoysonia1989@aws-1-eu-west-1.pooler.supabase.com:5432/postgres

JWT_SECRET
[GENERA AQUÍ: node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"]

NODE_ENV
production

PORT
3001
```

**Importante:** Copia exactamente el DATABASE_URL de arriba. No cambies nada.

### Paso 3: Verificar DATABASE_URL es Correcto
El string debe ser exactamente:
```
postgresql://postgres.anygelretukppegrpeag:xurxoysonia1989@aws-1-eu-west-1.pooler.supabase.com:5432/postgres
```

Sin cambios de ningún tipo.

### Paso 4: Guardar y Deploy

1. Click en **Save**
2. Render debería mostrar "Deployment in progress"
3. Espera a que termine (2-5 minutos)
4. Verás un check ✅ verde cuando esté listo

### Paso 5: Verificar Conexión

Espera 30 segundos después del deploy, luego prueba:

```bash
curl https://parvoshub-api.onrender.com/health
```

**Respuesta esperada:**
```json
{
  "status": "ok",
  "message": "Backend funcionando correctamente",
  "database": "conectada",
  "timestamp": "2026-01-25T..."
}
```

Si ves `"status":"ok"` ✅ → **Funciona!**

---

## 🔧 Si Aún No Funciona

### Prueba 1: Verificar que la BD está accesible
```bash
curl -X POST https://parvoshub-api.onrender.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"xurxo","password":"xurxo123"}'
```

Busca el error exacto en la respuesta.

### Prueba 2: Revisar Logs en Render

1. En Render Dashboard → **parvoshub-api**
2. Click en **Logs** (superior derecho)
3. Busca líneas que empiezan con:
   - `❌ Error al conectar`
   - `✅ Conexión a PostgreSQL`
   - `⚠️ DATABASE_URL no configurado`

### Prueba 3: Problemas Comunes

| Error | Solución |
|-------|----------|
| `Cannot find module 'pg'` | npm install no corrió. Click Redeploy. |
| `CONNECTION REFUSED` | DATABASE_URL inválida o Supabase caído |
| `ENOTFOUND` | El host no existe. Verifica URL exacta |
| `Authentication failed` | Contraseña de BD incorrecta |
| `relation "operaciones" does not exist` | Las tablas se crean automáticamente, espera más |

---

## 📋 Variables de Entorno CORRECTAS

Si tienes dudas, aquí están las variables que DEBEN estar en Render:

```env
# Supabase PostgreSQL
DATABASE_URL=postgresql://postgres.anygelretukppegrpeag:xurxoysonia1989@aws-1-eu-west-1.pooler.supabase.com:5432/postgres

# JWT (GENERA UNO NUEVO)
JWT_SECRET=a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6a7b8c9d0e1f2g3h4i5j6k7l8m9n0o1p2q3r4s5t6u7v8w9x0y1z

# Node environment
NODE_ENV=production

# Puerto
PORT=3001
```

---

## 🚀 Después de que Funcione

1. Intenta login: https://parvoshub-web.onrender.com
   - Usuario: `xurxo`
   - Contraseña: `xurxo123`

2. Verifica que ves:
   - ✅ Dashboard carga
   - ✅ Operaciones se muestran
   - ✅ Puedes ver presupuestos

3. Si algo falla, revisa la consola del navegador (F12)

---

## 📞 Soporte

Si persiste el error después de configurar todo:

1. **Verifica que Supabase está online:** https://status.supabase.com
2. **Revisa logs en Render** bajo **Logs**
3. **Força un redeploy:** Settings → Redeploy latest commit
4. **Regenera JWT_SECRET** (a veces ayuda)

---

**Actualizado:** 25 enero 2026  
**Estado:** Listo para ser configurado en Render
