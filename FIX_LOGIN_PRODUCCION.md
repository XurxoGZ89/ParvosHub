# Solución: Error 500 en Login - Producción

## Problema
```
POST https://parvoshub-api.onrender.com/api/auth/login 500 (Internal Server Error)
```

## Causa
El `JWT_SECRET` no está configurado en las variables de entorno de Render, causando que el servidor no pueda generar tokens JWT correctamente.

## Solución

### 1. En el Dashboard de Render

1. Ir a tu servicio backend (parvoshub-api)
2. Click en **Settings**
3. Bajar a **Environment**
4. Agregar las siguientes variables:

```
JWT_SECRET = [GENERAR ABAJO]
NODE_ENV = production
DATABASE_URL = postgresql://postgres.anygelretukppegrpeag:xurxoysonia1989@aws-1-eu-west-1.pooler.supabase.com:5432/postgres
```

### 2. Generar JWT_SECRET Seguro

**Opción A: Usar Node.js localmente**
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

**Opción B: OpenSSL**
```bash
openssl rand -hex 32
```

**Copiar el resultado y pegarlo como valor de `JWT_SECRET`**

### 3. Configuración Completa en Render

En tu archivo **Environment Variables** en Render, debería verse así:

```env
JWT_SECRET=a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6... (64 caracteres hex)
NODE_ENV=production
DATABASE_URL=postgresql://postgres.anygelretukppegrpeag:xurxoysonia1989@aws-1-eu-west-1.pooler.supabase.com:5432/postgres
```

### 4. Deploy y Reiniciar

1. Después de guardar las variables, Render debería automáticamente:
   - Redeployear el backend
   - Reiniciar el servidor

2. Si no lo hace automáticamente, manualmente:
   - Click en **Manual Deploy**
   - Click en **Deploy latest commit**

### 5. Verificar que Funciona

Prueba el health check:
```bash
curl https://parvoshub-api.onrender.com/health
```

Debería responder:
```json
{"status":"ok","message":"Backend funcionando correctamente"}
```

Prueba el login:
```bash
curl -X POST https://parvoshub-api.onrender.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"xurxo","password":"xurxo123"}'
```

## Cambios Implementados en el Código

✅ **Mejor manejo de JWT_SECRET:**
- Si no está configurado, se genera automáticamente (pero con advertencia)
- En producción, muestra un error claro si no está configurado

✅ **Mejor logging:**
- Stack trace completo en caso de error
- Mensaje de error más descriptivo

✅ **Health check endpoint:**
- `GET /health` para verificar que el backend está listo
- Verifica conexión a base de datos

✅ **Validación de inputs:**
- Verifica que username y password no estén vacíos

## Pasos Siguientes

Después de configurar JWT_SECRET en Render:

1. ✅ Intenta hacer login en https://parvoshub-web.onrender.com
2. ✅ Verifica que los datos se cargan correctamente
3. ✅ Prueba crear un nuevo movimiento
4. ✅ Verifica que aparece en Presupuesto vs Real

## Troubleshooting

**Si aún falla después de configurar JWT_SECRET:**

1. Verifica que el deploy en Render completó correctamente
2. Revisa los logs en Render: **Settings → Logs**
3. Busca mensajes como:
   - `Error en login:` - problemas de base de datos
   - `Table users not found` - tablas no existen (pero se crean automáticamente)
   - `CRÍTICO: JWT_SECRET no está configurado` - falta la variable de entorno

**Si las tablas no existen:**
- Asegúrate que `DATABASE_URL` está correcta
- El backend crea las tablas automáticamente al iniciar (`db.js`)
- Revisa que conecta a la BD de Supabase correcta

---

**Fecha de Fix:** 25 de enero de 2026  
**Commit:** 0c6a9a0  
**Estado:** Listo para producción
