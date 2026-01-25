# 📋 ESPECIFICACIÓN TÉCNICA - ParvosHub V2

**Versión:** 2.0  
**Fecha:** 25 de enero de 2026  
**Estado:** En diseño (Stitch)

---

## **1. STACK TECNOLÓGICO RECOMENDADO**

### Frontend

- **React 18** (mantener, no Next.js para simplificar con Render)
- **Shadcn UI** + **Tailwind CSS** (diseño minimalista)
- **React Router v6** (navegación)
- **Axios** (HTTP client)
- **Recharts** (gráficos)
- **date-fns** (manejo de fechas)
- **React Hook Form** + **Zod** (formularios y validación)
- **Zustand** (state management, más simple que Redux)
- **js-cookie** (gestión de sesiones)

### Backend

- **Express.js** (mantener)
- **PostgreSQL** (Supabase)
- **bcrypt** (hash de contraseñas)
- **jsonwebtoken** (JWT para autenticación)
- **express-validator** (validación de datos)

---

## **2. ESTRUCTURA DE BASE DE DATOS**

### Nuevas Tablas (en inglés)

#### `users`
```sql
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  username VARCHAR(50) UNIQUE NOT NULL,
  email VARCHAR(100) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  full_name VARCHAR(100) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### `user_accounts`
```sql
CREATE TABLE user_accounts (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  account_name VARCHAR(50) NOT NULL,
  account_type VARCHAR(20),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**Cuentas por usuario:**
- Xurxo: Santander, Ahorro
- Sonia: BBVA, Virtual

#### `user_operations`
```sql
CREATE TABLE user_operations (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  account_id INTEGER REFERENCES user_accounts(id),
  date DATE NOT NULL,
  type VARCHAR(20) NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  description TEXT,
  category VARCHAR(50),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**Tipos de operaciones:**
- `income` (ingreso)
- `expense` (gasto)
- `savings` (ahorro)
- `savings_withdrawal` (retirada de ahorro)

**Categorías iniciales (mismo que Parvos, pero tabla separada):**
- Alimentación
- Deporte
- Extra
- Hogar
- Movilidad
- Ocio
- Vacaciones

#### `user_categories`
```sql
CREATE TABLE user_categories (
  id SERIAL PRIMARY KEY,
  name VARCHAR(50) NOT NULL,
  color VARCHAR(7),
  icon VARCHAR(50),
  is_active BOOLEAN DEFAULT true
);
```

#### `user_budgets`
```sql
CREATE TABLE user_budgets (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  month VARCHAR(7) NOT NULL,
  category VARCHAR(50) NOT NULL,
  amount DECIMAL(10,2) DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, month, category)
);
```

#### `user_sessions`
```sql
CREATE TABLE user_sessions (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  token VARCHAR(500) NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Tablas Existentes (PARVOS - Sin cambios)

- `operaciones` (gastos familiares)
- `presupuestos` (presupuestos familiares)
- `calendar_events` (eventos recurrentes)
- `dismissed_warnings`
- `comidas_congeladas`
- `comidas_planificadas`

---

## **3. REQUISITOS FUNCIONALES**

### Autenticación

- ✅ Login con usuario/contraseña
- ✅ Cookies de sesión hasta cerrar sesión (sin expiración de tiempo)
- ✅ Usuarios predefinidos: Sonia y Xurxo
- ✅ Sin sistema de roles (acceso igual para ambos)
- ✅ JWT + Sesiones en base de datos

### Usuarios Específicos

**Xurxo:**
- Cuentas: Santander, Ahorro

**Sonia:**
- Cuentas: BBVA, Virtual

### Separación de Datos

| Aspecto | Usuario Personal | Parvos Familiar |
|---------|-----------------|-----------------|
| Operaciones | `user_operations` | `operaciones` |
| Categorías | Separadas (futuro) | `presupuestos` |
| Presupuestos | `user_budgets` | Existentes |
| Calendario Eventos | No aplica | `calendar_events` |
| Calendario Comidas | N/A (compartido) | Compartido |
| Acceso | Solo usuario logueado | Ambos usuarios |

---

## **4. ARQUITECTURA DE CARPETAS**

```
frontend/
├── src/
│   ├── components/
│   │   ├── ui/                          # Componentes Shadcn UI
│   │   │   ├── button.jsx
│   │   │   ├── card.jsx
│   │   │   ├── input.jsx
│   │   │   └── ...
│   │   ├── auth/
│   │   │   ├── LoginForm.jsx
│   │   │   └── ProtectedRoute.jsx
│   │   ├── layout/
│   │   │   ├── AppLayout.jsx
│   │   │   ├── Sidebar.jsx
│   │   │   └── MobileNav.jsx
│   │   ├── dashboard/
│   │   │   ├── Home.jsx
│   │   │   ├── UserStatsWidget.jsx
│   │   │   ├── ParvosStatsWidget.jsx
│   │   │   ├── WeeklyMealsCalendar.jsx
│   │   │   └── MonthlyExpensesCalendar.jsx
│   │   ├── user/
│   │   │   ├── UserAccount.jsx
│   │   │   └── UserAnnualSummary.jsx
│   │   ├── parvos/
│   │   │   ├── ParvosAccount.jsx
│   │   │   └── ParvosAnnualSummary.jsx
│   │   ├── calendar/
│   │   │   ├── ExpensesCalendar.jsx
│   │   │   └── MealsCalendar.jsx
│   │   └── shared/
│   │       ├── Header.jsx
│   │       └── LanguageSelector.jsx
│   ├── hooks/
│   │   ├── useAuth.js
│   │   ├── useUserOperations.js
│   │   └── useParvosOperations.js
│   ├── stores/
│   │   ├── authStore.js
│   │   └── appStore.js
│   ├── lib/
│   │   ├── api.js
│   │   └── utils.js
│   ├── contexts/
│   │   ├── CalendarEventsContext.js
│   │   ├── LanguageContext.js
│   │   └── AuthContext.js
│   └── styles/
│       ├── globals.css
│       └── pagination.css

backend/
├── middleware/
│   ├── auth.js
│   └── validation.js
├── routes/
│   ├── auth.routes.js
│   ├── user.routes.js
│   └── parvos.routes.js
├── controllers/
│   ├── authController.js
│   ├── userController.js
│   └── parvosController.js
├── models/
│   ├── User.js
│   └── UserOperation.js
├── db.js
└── index.js
```

---

## **5. ESPECIFICACIÓN DE DISEÑO UI/UX**

### Estilo Visual

- **Inspiración:** Factorial HR (interfaz clean, espaciosa y profesional)
- **Tipografía:** Inter o similar, sans-serif moderna
- **Espaciado:** Generoso, respiración visual
- **Bordes:** Redondeados suaves (8-12px)
- **Sombras:** Sutiles, elegantes
- **Colores:** Pasteles para estados, evitar colores saturados

### Paleta de Colores

- **Principal:** Azul suave (#3B82F6)
- **Secundario:** Gris neutro (#64748B)
- **Éxito/Positivo:** Verde pastel (#10B981)
- **Peligro/Negativo:** Rojo suave (#EF4444)
- **Advertencia:** Amarillo/naranja suave (#F59E0B)
- **Fondo:** Blanco (#FFFFFF) y gris muy claro (#F8FAFC)
- **Textos:** Gris oscuro (#1E293B), gris medio (#475569)

### Diseño Responsive

**Desktop (1920px, 1440px, 1024px):**
- Sidebar colapsable en izquierda
- Layouts multi-columna
- Gráficos grandes

**Tablet (768px):**
- Sidebar oculta por defecto
- Layouts 2 columnas
- Gráficos adaptados

**Mobile (390px, 360px):**
- Menú hamburguesa
- Stack vertical
- Bottom navigation
- Gráficos full-width

---

## **6. ESTRUCTURA DE PÁGINAS**

### 1. Login
- Centrado, tarjeta elevada
- Logo/título "ParvosHub"
- Campos: usuario, contraseña
- Checkbox "Recordar sesión"
- Botón principal llamativo

### 2. Home/Dashboard
- Sidebar con menú navegación
- Header con saludo, fecha, idioma
- 4 accesos directos (tarjetas pequeñas)
- Widget Situación Global Usuario
- Widget Situación Global Parvos
- Calendario Comidas Semanal
- Calendario Gastos Mensual

### 3. Cuenta Usuario
- Resumen financiero por cuenta
- Formulario para agregar operaciones
- Gráfico de gastos por categoría
- Tabla/listado de operaciones

### 4. Cuenta Parvos
- Igual a Cuenta Usuario
- Cuentas: BBVA, Imagin
- Campo usuario adicional (Sonia/Xurxo)

### 5. Resumen Anual Usuario
- Selector de año
- Grid de 12 meses
- Gráfico anual de evolución
- Gráfico de gastos por categoría

### 6. Resumen Anual Parvos
- Igual a Resumen Anual Usuario
- Datos familiares

### 7. Calendario Gastos
- Vista mensual tipo calendario
- Eventos recurrentes por día
- Colores por categoría
- Opciones editar/eliminar

### 8. Calendario Comidas
- Vista semanal (lunes a domingo)
- 3 filas: Comida, Cena, Congeladas
- Drag & drop para planificar
- Recetario con buscador

---

## **7. ENDPOINTS API (Backend)**

### Autenticación

```
POST   /api/auth/login              - Login usuario
POST   /api/auth/logout             - Logout
GET    /api/auth/verify             - Verificar token actual
POST   /api/auth/refresh            - Refresh token
```

### Usuarios (Personal)

```
GET    /api/user/profile            - Perfil usuario logueado
GET    /api/user/accounts           - Cuentas bancarias usuario
GET    /api/user/operations         - Operaciones usuario (con filtros)
POST   /api/user/operations         - Crear operación
PUT    /api/user/operations/:id     - Actualizar operación
DELETE /api/user/operations/:id     - Eliminar operación
GET    /api/user/summary/:year      - Resumen anual usuario
GET    /api/user/categories         - Categorías usuario
GET    /api/user/budgets/:month     - Presupuestos mes usuario
```

### Parvos (Familiar)

```
GET    /api/parvos/operations       - Operaciones Parvos (con filtros)
POST   /api/parvos/operations       - Crear operación
PUT    /api/parvos/operations/:id   - Actualizar operación
DELETE /api/parvos/operations/:id   - Eliminar operación
GET    /api/parvos/summary/:year    - Resumen anual Parvos
GET    /api/parvos/budgets/:month   - Presupuestos mes Parvos
```

### Calendarios

```
GET    /api/calendar/events         - Eventos recurrentes
POST   /api/calendar/events         - Crear evento
PUT    /api/calendar/events/:id     - Actualizar evento
DELETE /api/calendar/events/:id     - Eliminar evento

GET    /api/meals/week              - Comidas semana
POST   /api/meals/plan              - Planificar comida
GET    /api/meals/frozen            - Comidas congeladas
```

---

## **8. PLAN DE IMPLEMENTACIÓN (FASES)**

### FASE 1: Setup y Autenticación ✅ COMPLETADA
- [x] Configurar Shadcn UI + Tailwind
- [x] Sistema de autenticación (backend)
- [x] Crear usuarios iniciales (Sonia, Xurxo)
- [x] Crear tablas de usuarios en BD
- [x] Login frontend con cookies
- [x] Layout base con sidebar/mobile nav
- [x] ProtectedRoute para rutas privadas

**Archivos creados:**
- `frontend/src/components/ui/` (button, card, input, label)
- `frontend/src/lib/utils.js` y `api.js`
- `frontend/src/stores/authStore.js`
- `frontend/src/components/auth/Login.jsx`
- `frontend/src/components/auth/ProtectedRoute.jsx`
- `frontend/src/components/layout/AppLayout.jsx`
- `backend/middleware/auth.js` y `validation.js`
- `backend/controllers/authController.js`
- `backend/routes/auth.routes.js`
- `backend/migrations/create_user_tables.sql`
- `backend/scripts/createInitialUsers.js`

**Configuración:**
- Tailwind CSS + PostCSS configurado
- Shadcn UI base instalada
- Zustand para state management
- JWT + bcrypt para autenticación
- Cookies para sesión persistente

### FASE 2: Dashboard (Home) ✅ COMPLETADA
- [x] Crear estructura Home
- [x] Widget situación global usuario
- [x] Widget situación global Parvos
- [x] Calendario comidas semanal (vista resumida)
- [x] Calendario gastos mensual (vista resumida)
- [x] 4 accesos directos
- [x] Header con saludo, fecha, idioma
- [x] Modal para agregar movimientos (desktop + mobile)
- [x] Endpoint POST /operaciones para crear movimientos
- [x] Filtrado dinámico por fecha (hoy + mañana)
- [x] Marcado de días con eventos en calendario
- [x] Integración de iconos Lucide React

**Archivos creados/modificados:**
- `frontend/src/components/Home.js` (completo, con modal integrado)
- `frontend/src/components/Home_OLD.js` (backup)
- `frontend/src/components/Home_PREV.js` (backup)
- `backend/index.js` (endpoint POST actualizado)

**Funcionalidades implementadas:**
- Modal responsive con formularios para agregar movimientos
- Soporte para operaciones personales (Santander, Ahorro) y Parvos (BBVA, Imagin)
- Selector de tipo de operación (Ingreso, Gasto, Ahorro, Retirada)
- Filtrado dinámico de comidas por fecha exacta
- Marcado visual de días con eventos en calendario
- Todos los iconos usando Lucide React (Calendar, Euro, FileText, Tag, CreditCard, User, X)
- Validación de datos en formulario
- Logging para debugging

### FASE 3: Cuenta Usuario Personal
- [ ] Crear página UserAccount.jsx
- [ ] Migrar lógica ExpenseTracker a UserAccount
- [ ] Adaptar para cuentas personales (Santander, Ahorro)
- [ ] Formularios de operaciones (reutilizar modal de Home)
- [ ] Gráficos y estadísticas
- [ ] Tabla/listado de operaciones
- [ ] Filtros y búsqueda
- [ ] Endpoint GET /api/user/operations (con filtros)
- [ ] Endpoint PUT /api/user/operations/:id
- [ ] Endpoint DELETE /api/user/operations/:id

**Tareas pendientes:**
1. Crear componente `UserAccount.jsx` con:
   - Vista detallada de cuentas personales (Santander, Ahorro)
   - Tabla de operaciones con paginación
   - Filtros por tipo, categoría, rango de fechas
   - Resumen de ingresos/gastos del mes
   - Gráfico de evolución de saldo
   - Gráfico de gastos por categoría (pie chart)
   - Formulario para agregar/editar/eliminar operaciones

2. Backend endpoints:
   - GET `/api/user/operations` (con filtros opcionales: tipo, categoría, fecha_desde, fecha_hasta)
   - PUT `/api/user/operations/:id` (actualizar operación)
   - DELETE `/api/user/operations/:id` (eliminar operación)
   - GET `/api/user/accounts` (listar cuentas del usuario logueado)

3. Frontend hooks:
   - `useUserOperations()` para gestionar operaciones personales
   - `useUserAccounts()` para listar cuentas

4. UI Components:
   - Reutilizar modal de FASE 2 para agregar/editar
   - Tabla de operaciones con actions (edit, delete)
   - Card para resumen de cuenta
   - Charts usando Recharts

### FASE 4: Resumen Anual Usuario
- [ ] Crear página UserAnnualSummary
- [ ] Selector de año
- [ ] Grid de 12 meses
- [ ] Gráfico anual de evolución
- [ ] Gráfico de gastos por categoría

### FASE 5: Migrar Páginas Parvos ✅ COMPLETADA
- [x] Refactorizar ExpenseTracker → ParvosAccount
- [x] Mantener funcionalidad actual
- [x] Aplicar nuevo diseño Shadcn UI
- [x] Resumen Anual Parvos con nuevo diseño (pendiente)

**Archivos creados/modificados:**
- `frontend/src/components/parvos/ParvosAccount.jsx` (completo con diseño Stitch)
- `frontend/src/App.js` (actualizada ruta de gastos)

**Funcionalidades implementadas:**
- Página de Cuenta Parvos con diseño Stitch moderno
- Balance total y tarjetas de cuentas (BBVA, Imagin)
- Gráfico de barras de gastos por categoría
- Tabla de presupuesto vs real
- Listado de movimientos con filtros (tipo, categoría, cuenta)
- Paginación de movimientos
- Formulario para crear nueva operación
- Card de meta familiar (Viaje a Japón)
- Timeline de actividad reciente
- Iconos de Lucide React
- Totalmente responsive

### FASE 6: Calendarios
- [ ] Calendario Gastos (mantener funcionalidad)
- [ ] Calendario Comidas (mantener funcionalidad)
- [ ] Aplicar nuevo diseño Shadcn UI

### FASE 7: Pulido y Testing
- [ ] Responsive final (desktop, tablet, mobile)
- [ ] Optimizaciones de rendimiento
- [ ] Testing completo
- [ ] Despliegue en Render + Supabase

---

## **9. CONFIGURACIÓN INICIAL**

### Variables de Entorno

**Backend (.env):**
```
NODE_ENV=production
DATABASE_URL=<supabase_connection_string>
JWT_SECRET=<secret_key>
FRONTEND_URL=<frontend_deployed_url>
PORT=3001
```

**Frontend (.env.production):**
```
REACT_APP_API_URL=<backend_url>
```

### Usuarios Predefinidos

```javascript
// Datos para crear en BD
const users = [
  {
    username: "xurxo",
    email: "xurxo@example.com",
    password_hash: hash("password123"),
    full_name: "Xurxo"
  },
  {
    username: "sonia",
    email: "sonia@example.com",
    password_hash: hash("password456"),
    full_name: "Sonia"
  }
];

// Cuentas de Xurxo
const xurxoAccounts = [
  { user_id: 1, account_name: "Santander" },
  { user_id: 1, account_name: "Ahorro" }
];

// Cuentas de Sonia
const soniaAccounts = [
  { user_id: 2, account_name: "BBVA" },
  { user_id: 2, account_name: "Virtual" }
];
```

---

## **10. CONSIDERACIONES TÉCNICAS**

### Seguridad

- ✅ Hash de contraseñas con bcrypt
- ✅ JWT para autenticación stateless
- ✅ CORS configurado correctamente
- ✅ Validación de datos en frontend y backend
- ✅ Cookies seguras (httpOnly, secure en producción)

### Performance

- ✅ Lazy loading de componentes
- ✅ Memoización de componentes React
- ✅ Caching de datos en Zustand
- ✅ Compresión de assets
- ✅ Code splitting con React Router

### Internacionalización

- ✅ Soporte ES/GL (mantener LanguageContext)
- ✅ Fechas con date-fns localizadas
- ✅ Moneda en formato europeo

---

## **SIGUIENTE PASO**

Mientras Stitch diseña las interfaces:
1. ✅ Especificación técnica (este documento)
2. ⏳ Diseños visuales en Stitch
3. Empezar FASE 1 (Setup + Autenticación)
4. Ir página por página siguiendo los diseños de Stitch

