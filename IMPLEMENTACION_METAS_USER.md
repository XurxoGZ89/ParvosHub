# Sistema de Metas de Ahorro - UserAccount

## 📋 Resumen de Implementación

Se ha implementado un sistema completo de metas de ahorro personal para usuarios, similar al sistema de ParvosAccount pero independiente y personalizado.

## 🗄️ Base de Datos

### Tabla: `user_goals`

```sql
CREATE TABLE user_goals (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  nombre VARCHAR(100) NOT NULL,
  cantidad_objetivo DECIMAL(10,2) NOT NULL,
  cantidad_actual DECIMAL(10,2) DEFAULT 0.00,
  fecha_inicio DATE NOT NULL,
  fecha_objetivo DATE,
  categoria VARCHAR(50) DEFAULT 'Personal',
  notas TEXT,
  completada BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**Índices:**
- `idx_user_goals_user_id` - Búsqueda por usuario
- `idx_user_goals_completada` - Filtrado por estado
- `idx_user_goals_fecha_objetivo` - Ordenamiento por fecha objetivo

### Migración

Archivo: `backend/migrations/create_user_goals_table.sql`

**Ejecutar:**
```bash
cd backend
PGPASSWORD="tu_password" psql -h host -U user -d database -f migrations/create_user_goals_table.sql
```

## 🔌 API Endpoints

Base URL: `http://localhost:3001/api/user`

Todos los endpoints requieren autenticación con JWT token en el header:
```
Authorization: Bearer <token>
```

### 1. Obtener todas las metas

**GET** `/goals`

**Response 200:**
```json
[
  {
    "id": 1,
    "user_id": 2,
    "nombre": "Vacaciones en Japón",
    "cantidad_objetivo": 3000.00,
    "cantidad_actual": 500.00,
    "fecha_inicio": "2026-02-05",
    "fecha_objetivo": "2026-12-31",
    "categoria": "Viajes",
    "notas": "Ahorro para viaje familiar",
    "completada": false,
    "created_at": "2026-02-05T10:00:00.000Z",
    "updated_at": "2026-02-05T10:00:00.000Z"
  }
]
```

### 2. Crear nueva meta

**POST** `/goals`

**Body:**
```json
{
  "nombre": "Coche nuevo",
  "cantidad_objetivo": 10000,
  "cantidad_actual": 0,
  "fecha_inicio": "2026-02-05",
  "fecha_objetivo": "2027-06-30",
  "categoria": "Personal",
  "notas": "Ahorro para comprar un coche eléctrico",
  "completada": false
}
```

**Campos requeridos:**
- `nombre` (string, max 100 chars)
- `cantidad_objetivo` (number, > 0)
- `fecha_inicio` (date, YYYY-MM-DD)

**Campos opcionales:**
- `cantidad_actual` (number, default: 0)
- `fecha_objetivo` (date, YYYY-MM-DD)
- `categoria` (string, default: 'Personal')
- `notas` (text)
- `completada` (boolean, default: false)

**Response 201:**
```json
{
  "id": 2,
  "user_id": 2,
  "nombre": "Coche nuevo",
  "cantidad_objetivo": 10000.00,
  ...
}
```

### 3. Actualizar meta

**PUT** `/goals/:id`

**Body:** (misma estructura que POST)

**Response 200:** Meta actualizada

**Response 404:** Meta no encontrada o no pertenece al usuario

### 4. Eliminar meta

**DELETE** `/goals/:id`

**Response 204:** Eliminada exitosamente

**Response 404:** Meta no encontrada o no pertenece al usuario

## 🎨 Frontend - Componentes

### Estructura de UserAccount.jsx

#### 1. **Estados nuevos:**
```javascript
const [metas, setMetas] = useState([]);
const [actividad, setActividad] = useState([]);
const [modalEditarMeta, setModalEditarMeta] = useState({ abierto: false, meta: null });
```

#### 2. **Función cargarDatos actualizada:**
- Carga metas desde `/api/user/goals`
- Carga actividad reciente (últimas 5 operaciones)
- Mantiene todas las operaciones para cálculos

#### 3. **Widgets añadidos:**

**Widget de Actividad Reciente:**
- Timeline visual con últimas 5 operaciones
- Indicadores de color por tipo de operación
- Fecha y hora formateadas
- Categoría visible

**Widget de Meta Personal:**
- Barra de progreso visual
- Etiqueta personalizada con nombre de usuario
- Botón para editar meta
- Opción de crear meta si no existe

**Modal de Meta:**
- Formulario completo CRUD
- Campos: nombre, cantidad objetivo, cantidad actual, fechas, categoría, notas
- Validación de campos requeridos

#### 4. **Mejoras visuales:**

**Tarjetas de Balance:**
- Diseño compacto similar a ParvosAccount
- Saldo del mes anterior visible
- Logos personalizados:
  - Xurxo: Santander + logo personalizado
  - Sonia: BBVA + logo personalizado

**Gráfico de Barras:**
- Líneas de presupuesto horizontales con border-dashed
- Tooltips con valor de presupuesto
- Etiquetas con fondo para mejor legibilidad

**Filtros mejorados:**
- Indicadores visuales de filtros activos (color morado)
- Botón de limpiar filtros con icono X
- Diseño responsive

## 📁 Archivos Modificados/Creados

### Backend:
1. ✅ `backend/migrations/create_user_goals_table.sql` - Nueva migración
2. ✅ `backend/controllers/userController.js` - 4 funciones nuevas
3. ✅ `backend/routes/user.routes.js` - 4 rutas nuevas
4. ✅ `backend/scripts/test_goals_endpoints.sh` - Script de pruebas

### Frontend:
1. ✅ `frontend/src/components/user/UserAccount.jsx` - Actualizado completamente
2. ✅ `frontend/src/assets/santander.png` - Logo de Santander

## 🧪 Testing

### Probar endpoints manualmente:

1. **Obtener token de autenticación:**
```bash
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "tu@email.com", "password": "tu_password"}'
```

2. **Usar el script de pruebas:**
```bash
cd backend/scripts
chmod +x test_goals_endpoints.sh
# Editar el script y añadir tu token
./test_goals_endpoints.sh
```

### Verificar en el frontend:

1. Iniciar sesión en la aplicación
2. Navegar a "Mi Cuenta Personal"
3. Verificar que aparece el widget de "Meta {username}"
4. Crear una nueva meta
5. Verificar la barra de progreso
6. Editar la meta
7. Ver la actividad reciente

## 🔐 Seguridad

- ✅ Todos los endpoints requieren autenticación JWT
- ✅ Cada usuario solo puede ver/modificar sus propias metas
- ✅ Validación de pertenencia en cada operación
- ✅ Validación de datos en el backend
- ✅ Protección contra SQL injection (parametrized queries)

## 📊 Características Implementadas

- ✅ Sistema de metas completamente funcional
- ✅ Widget de actividad reciente con timeline
- ✅ Líneas de presupuesto en gráfico de barras
- ✅ Saldo del mes anterior en tarjetas
- ✅ Filtros mejorados con indicadores visuales
- ✅ Logos personalizados por usuario
- ✅ Modales para crear/editar metas
- ✅ Validación completa de formularios
- ✅ Cálculos de progreso en tiempo real
- ✅ Diseño responsive móvil/desktop
- ✅ Estados de carga y error manejados

## 🚀 Próximos Pasos (Opcional)

- [ ] Notificaciones cuando se alcanza una meta
- [ ] Estadísticas de metas (completadas vs activas)
- [ ] Integración con calendario para recordatorios
- [ ] Gráficos de evolución de ahorro en el tiempo
- [ ] Compartir metas familiares (opcional)
- [ ] Exportar metas a PDF/Excel

## 📝 Notas

- El sistema es completamente independiente del sistema de metas de ParvosAccount
- Cada usuario tiene sus propias metas personalizadas
- El label "Meta {username}" se muestra dinámicamente
- Las metas completadas se ordenan al final
- El backend está corriendo en el puerto 3001
- La base de datos está en Supabase (PostgreSQL)

---

**Desarrollado para ParvosHub V2** 🚀
**Fecha:** 5 de febrero de 2026
