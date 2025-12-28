# 📋 Guía de Despliegue a Render - ProyectoApp

## Paso 1: Preparar el entorno local

### 1.1 Instalar PostgreSQL en Mac
```bash
# Con Homebrew (si tienes)
brew install postgresql@15

# Iniciar PostgreSQL
brew services start postgresql@15

# Crear base de datos local
createdb gastos_db

# Verificar (debería mostrar tu BD)
psql -U postgres -l
```

### 1.2 Instalar dependencias del backend
```bash
cd /Users/xurxo/Documents/ProyectoApp/backend
npm install
```

### 1.3 Probar localmente que funciona
```bash
# Desde la carpeta backend
NODE_ENV=development node index.js
# Deberías ver: "Servidor backend escuchando en puerto 3001"
```

### 1.4 Importar datos desde SQLite (si tienes datos viejos)
```bash
# Exportar SQLite a CSV
sqlite3 ../database.sqlite ".mode csv" ".output datos.csv" "SELECT * FROM operaciones;"

# Luego importar a PostgreSQL
psql -U postgres -d gastos_db -c "\COPY operaciones(fecha, tipo, cantidad, info, categoria, usuario, cuenta) FROM 'datos.csv' WITH (FORMAT csv);"
```

---

## Paso 2: Crear cuenta en Render y desplegar

### 2.1 Crear cuenta en Render
1. Ir a https://render.com
2. Sign up con GitHub (recomendado)
3. Verificar email

### 2.2 Crear PostgreSQL en Render
1. Dashboard → New → PostgreSQL
2. Darle nombre: `gastos-db`
3. Región: `eu-west-1` (más cercana a España)
4. Copiar la `External Database URL` (se verá así):
   ```
   postgresql://user:password@host:5432/gastos_db
   ```

### 2.3 Desplegar Backend
1. Dashboard → New → Web Service
2. Conectar con tu repositorio GitHub
3. Configurar:
   - **Name:** `gastos-app-backend`
   - **Build Command:** `npm install`
   - **Start Command:** `node index.js`
4. Añadir variable de entorno:
   - Key: `DATABASE_URL`
   - Value: (pega la URL de PostgreSQL que copiaste)
5. Deploy

### 2.4 Desplegar Frontend
1. Dashboard → New → Static Site (o Web Service)
2. Conectar repo
3. Configurar:
   - **Build Command:** `cd frontend && npm install && npm run build`
   - **Publish directory:** `frontend/build`
4. En el frontend, cambiar la URL de la API:
   - Desde: `http://localhost:3001`
   - A: `https://gastos-app-backend.onrender.com` (ajusta el nombre)
5. Deploy

---

## Paso 3: Registrar dominio (opcional)

1. Registrar en Namecheap, Google Domains o GoDaddy
2. En Render, añadir Custom Domain al frontend
3. Seguir instrucciones DNS de Render (copiar registros)

---

## Variables de entorno que Render necesita

**Backend:**
```
DATABASE_URL=postgresql://user:password@host:5432/gastos_db
PORT=3001
NODE_ENV=production
```

**Frontend:**
```
REACT_APP_API_URL=https://gastos-app-backend.onrender.com
```

---

## Comandos útiles para troubleshooting

```bash
# Ver logs del backend en Render
render logs <service-id>

# Conectar a PostgreSQL en Render
psql postgresql://user:password@host:5432/gastos_db

# Verificar que frontend llama API correctamente
curl https://gastos-app-backend.onrender.com/operaciones
```
