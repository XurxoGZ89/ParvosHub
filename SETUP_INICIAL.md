# Guía de Configuración Inicial - ParvosHub V2

## 1. Configurar Base de Datos en Supabase

### Ejecutar migraciones

1. Ve a tu proyecto en Supabase
2. Accede al **SQL Editor**
3. Ejecuta el siguiente script en orden:

```sql
-- Archivo: backend/migrations/create_user_tables.sql
```

Copia y pega todo el contenido del archivo `backend/migrations/create_user_tables.sql`

### Verificar tablas creadas

```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name LIKE 'user%';
```

Deberías ver:
- user_accounts
- user_budgets
- user_categories
- user_operations
- user_sessions
- users

## 2. Configurar Variables de Entorno

### Backend (.env)

Crea/edita el archivo `.env` en `/backend`:

```env
NODE_ENV=development
DATABASE_URL=postgresql://[USER]:[PASSWORD]@[HOST]:5432/[DATABASE]?sslmode=require
JWT_SECRET=tu-secreto-super-seguro-cambiar-en-produccion
PORT=3001
```

**Obtener DATABASE_URL de Supabase:**
1. Ve a Project Settings > Database
2. Copia la Connection String (URI mode)
3. Reemplaza `[YOUR-PASSWORD]` con tu contraseña

### Frontend (.env.development)

Edita el archivo `.env.development` en `/frontend`:

```env
REACT_APP_API_URL=http://localhost:3001
```

Para producción (`.env.production`):

```env
REACT_APP_API_URL=https://tu-backend-url.render.com
```

## 3. Instalar Dependencias

### Backend

```bash
cd backend
npm install
```

### Frontend

```bash
cd frontend
npm install
```

## 4. Iniciar Servidores

### Opción 1: Iniciar ambos desde la raíz

```bash
cd /Users/xurxo/Documents/ParvosHub
chmod +x start-dev.sh
./start-dev.sh
```

### Opción 2: Iniciar por separado

**Terminal 1 - Backend:**
```bash
cd backend
npm start
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm start
```

## 5. Crear Usuarios Iniciales

El backend creará automáticamente los usuarios al iniciar si no existen.

**Usuarios creados:**
- **Usuario:** xurxo | **Contraseña:** xurxo123
- **Usuario:** sonia | **Contraseña:** sonia123

⚠️ **IMPORTANTE:** Cambiar estas contraseñas en producción

## 6. Probar la Aplicación

1. Abre el navegador en `http://localhost:3000`
2. Deberías ver la página de login
3. Ingresa con:
   - Usuario: `xurxo`
   - Contraseña: `xurxo123`
4. Si todo funciona, verás el dashboard

## 7. Troubleshooting

### Error: No se puede conectar a la base de datos

- Verifica que el `DATABASE_URL` en `.env` sea correcto
- Asegúrate de que Supabase permite conexiones desde tu IP
- Revisa que las tablas estén creadas

### Error: CORS

- Verifica que `REACT_APP_API_URL` apunte al backend correcto
- El backend debe estar corriendo en el puerto 3001

### Error: Token inválido

- Limpia las cookies del navegador
- Cierra sesión y vuelve a iniciar

### Las dependencias de Shadcn UI no se instalan

```bash
cd frontend
npm install lucide-react class-variance-authority
```

## 8. Siguiente Paso

Una vez verificado que todo funciona:
- ✅ FASE 1 completada
- ⏭️ Continuar con FASE 2: Implementar Dashboard (Home)

---

**Fecha:** 25 de enero de 2026  
**ParvosHub V2** - Sistema de autenticación funcionando ✨
