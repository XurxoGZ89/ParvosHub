# 🔌 Backend - API REST de Gastos

Backend Node.js + Express que proporciona una API REST para gestionar gastos familiares.

---

## 📋 Tabla de contenidos

- [Instalación](#instalación)
- [Ejecutar](#ejecutar)
- [Endpoints](#endpoints)
- [Variables de entorno](#variables-de-entorno)
- [Estructura](#estructura)
- [Troubleshooting](#troubleshooting)

---

## 📦 Instalación

```bash
cd backend
npm install
```

Esto instala las dependencias:

- **express** — Framework web
- **cors** — Permitir solicitudes desde el frontend
- **pg** — Driver de PostgreSQL
- **dotenv** — Cargar variables de entorno
- **csv-parser** — Importar datos desde CSV

---

## 🚀 Ejecutar

### Opción 1: Script automático (Recomendado)

```bash
cd /Users/xurxo/Documents/ProyectoApp
./start-dev.sh
```

### Opción 2: Manualmente

```bash
cd backend

# Asegúrate de que PostgreSQL está corriendo
brew services start postgresql@15

# Iniciar el servidor
NODE_ENV=development node index.js
```

Deberías ver:

```
Conexión a PostgreSQL establecida
Tabla operaciones lista
Servidor backend escuchando en puerto 3001
```

---

## 📡 Endpoints

### 1. Health Check

```bash
GET /
```

**Respuesta:**
```
API de gastos familiares funcionando
```

---

### 2. Obtener todas las operaciones

```bash
GET /operaciones
```

**Con filtros (todos opcionales):**

```bash
GET /operaciones?categoria=Alimentación&tipo=gasto&usuario=Xurxo&cuenta=BBVA
```

**Respuesta:**

```json
[
  {
    "id": 1,
    "fecha": "2025-12-28",
    "tipo": "gasto",
    "cantidad": 45.50,
    "info": "Supermercado",
    "categoria": "Alimentación",
    "usuario": "Xurxo",
    "cuenta": "BBVA",
    "concepto": "Supermercado",
    "created_at": "2025-12-28T10:30:00.000Z"
  }
]
```

---

### 3. Crear operación

```bash
POST /operaciones
Content-Type: application/json

{
  "fecha": "2025-12-28",
  "tipo": "gasto",
  "cantidad": 50,
  "concepto": "Compra",
  "categoria": "Alimentación",
  "usuario": "Xurxo",
  "cuenta": "BBVA"
}
```

**Campos obligatorios:**
- `fecha` (formato: YYYY-MM-DD)
- `tipo` (gasto, ingreso, hucha, retirada-hucha)
- `cantidad` (número positivo)

**Respuesta (201):**

```json
{
  "id": 42
}
```

---

### 4. Actualizar operación

```bash
PUT /operaciones/:id
Content-Type: application/json

{
  "fecha": "2025-12-28",
  "tipo": "gasto",
  "cantidad": 60,
  "concepto": "Compra actualizada",
  "categoria": "Hogar",
  "usuario": "Xurxo",
  "cuenta": "BBVA"
}
```

**Respuesta (200):**

```json
{
  "success": true
}
```

---

### 5. Eliminar operación

```bash
DELETE /operaciones/:id
```

**Respuesta (200):**

```json
{
  "success": true
}
```

---

## 🔐 Variables de entorno

Crea un archivo `.env` en la carpeta `backend`:

```env
# Base de datos
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=password
DB_NAME=gastos_db

# Servidor
PORT=3001
NODE_ENV=development
```

### Para producción (Render)

```env
DATABASE_URL=postgresql://user:password@host:5432/gastos_db
PORT=3001
NODE_ENV=production
```

Render proporciona automáticamente la `DATABASE_URL` cuando provisiones PostgreSQL.

---

## 📁 Estructura

```
backend/
├── index.js           # Archivo principal con todos los endpoints
├── db.js             # Conexión a PostgreSQL
├── importar_csv.js   # Script para importar datos
├── package.json      # Dependencias
├── .env              # Variables de entorno (NO subir a Git)
├── .gitignore        # Archivos a ignorar
└── node_modules/     # Dependencias instaladas
```

### db.js

Configura la conexión a PostgreSQL. Crea automáticamente la tabla `operaciones` cuando se carga.

### index.js

Contiene:
- Configuración de Express
- CORS habilitado
- Todos los endpoints (GET, POST, PUT, DELETE)
- Inicialización del servidor

### importar_csv.js

Script para importar datos desde un CSV:

```bash
node importar_csv.js
```

Lee [Migración.csv](../Migración.csv) e inserta los datos en PostgreSQL.

---

## 🗄️ Base de datos

### Tabla `operaciones`

```sql
CREATE TABLE operaciones (
  id SERIAL PRIMARY KEY,
  fecha TEXT NOT NULL,
  tipo TEXT NOT NULL,
  cantidad REAL NOT NULL,
  info TEXT,
  categoria TEXT,
  usuario TEXT,
  cuenta TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Consultas útiles

```bash
# Conectarse a la BD
psql -d gastos_db

# Ver todas las operaciones
SELECT * FROM operaciones ORDER BY fecha DESC;

# Contar operaciones
SELECT COUNT(*) FROM operaciones;

# Eliminar operaciones antiguas
DELETE FROM operaciones WHERE fecha < '2025-01-01';

# Salir
\q
```

---

## 🛠️ Troubleshooting

### ❌ Error: "connect ECONNREFUSED 127.0.0.1:5432"

PostgreSQL no está corriendo.

```bash
brew services start postgresql@15
```

### ❌ Error: "role 'postgres' does not exist"

El usuario no existe. Intenta conectar como usuario actual:

```bash
# En db.js, usa:
connectionString: "postgresql://localhost/gastos_db"
```

### ❌ Error: "duplicate key value violates unique constraint"

Intenta limpiar la tabla:

```bash
psql -d gastos_db
DELETE FROM operaciones;
```

### ❌ Error: "EADDRINUSE :::3001"

El puerto ya está en uso.

```bash
# Ver qué usa el puerto
lsof -i :3001

# Matar el proceso
kill -9 PID
```

---

## 🚀 Despliegue

Para desplegar en Render:

1. Commitear los cambios a GitHub
2. Crear servicio Web en Render.com
3. Conectar el repositorio
4. Configurar:
   - Build Command: `npm install`
   - Start Command: `node index.js`
   - Environment: `DATABASE_URL` (de Render PostgreSQL)

Ver [DESPLIEGUE.md](../DESPLIEGUE.md) para detalles.

---

**Versión:** 2.0  
**Última actualización:** 28 de diciembre de 2025
