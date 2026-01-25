# Referencia de Diseños Stitch - ParvosHub V2

## 📂 Ubicación
`/Users/xurxo/Downloads/stitch_annual_summary_desktop/`

## 🎨 Diseños Disponibles

### 1. Login Desktop
**Archivo:** `parvoshub_login_desktop/code.html`

**Características del diseño:**
- Fondo: Gradient azul claro (#F8FAFC)
- Card centrada con sombra suave
- Icono de candado en círculo azul
- Título: "ParvosHub V2"
- Inputs con iconos (person, lock)
- Checkbox "Recordar sesión"
- Botón azul primario (#2563eb)
- Modo oscuro incluido
- Fuente: Inter

**Estado:** ✅ Implementado en `frontend/src/components/auth/Login.jsx`

---

### 2. Dashboard Desktop
**Archivo:** `parvoshub_dashboard_desktop/code.html`

**Características del diseño:**
- Sidebar morado/rosa gradient (#7C3AED)
- Iconos: Material Symbols Rounded
- Saludo: "¡Hola, [Usuario]! 👋"
- Fecha actual visible
- Selector de idioma (ES/GL)
- Grid de 4 accesos directos
- 2 widgets de situación (Usuario + Parvos)
- Calendario de comidas semanal
- Calendario de gastos mensual
- Fuente: Plus Jakarta Sans

**Colores:**
- Primary: #7C3AED (Morado)
- Pink: #EC4899
- Blue: #3B82F6
- Green: #10B981
- Orange: #F59E0B

**Estado:** 🚧 Pendiente implementación completa

---

### 3. Dashboard Mobile
**Archivo:** `parvoshub_dashboard_mobile/code.html`

**Características del diseño:**
- Hamburger menu
- Todo en stack vertical
- Accesos directos en grid 2x2
- Widgets full width
- Bottom navigation
- Optimizado para táctil

**Estado:** 🚧 Pendiente

---

### 4. Cuenta Personal Desktop
**Archivo:** `personal_account_desktop/code.html`

**Características del diseño:**
- Mini sidebar colapsado (80px)
- Header con título "Mi Cuenta"
- Selector de mes
- Botón "Nueva Operación"
- Grid de 4 tarjetas de resumen:
  * Total Disponible (con %)
  * Santander
  * Ahorro
  * Ingresos/Gastos
- Gráfico de gastos por categoría
- Tabla de operaciones
- Fuente: Inter
- Color primario: #6366f1 (Indigo)

**Estado:** 🚧 Pendiente (FASE 3)

---

### 5. Cuenta Familiar Desktop
**Archivo:** `family_account_desktop/code.html`

**Características:**
- Similar a Cuenta Personal
- Pero con cuentas BBVA e Imagin
- Campo "Usuario" adicional
- Colores diferenciados

**Estado:** 🚧 Pendiente (FASE 5)

---

### 6. Resumen Anual Desktop
**Archivo:** `annual_summary_desktop/code.html`

**Características:**
- Selector de año grande
- Grid 4x3 de 12 meses
- Cada mes muestra:
  * Ingresos (verde)
  * Gastos (rojo)
  * Balance
- Gráfico de línea anual
- Gráfico de dona por categorías

**Estado:** 🚧 Pendiente (FASE 4)

---

### 7. Calendario Gastos Desktop
**Archivo:** `expense_calendar_desktop/code.html`

**Características:**
- Vista mensual calendario
- Eventos recurrentes por día
- Colores por categoría
- Panel lateral con lista eventos

**Estado:** 🚧 Pendiente (FASE 6)

---

### 8. Calendario Comidas Desktop
**Archivo:** `food_calendar_desktop/code.html`

**Características:**
- Vista semanal (L-D)
- 3 filas: Comida, Cena, Congeladas
- Drag & drop
- Panel recetario lateral
- Buscador de recetas

**Estado:** 🚧 Pendiente (FASE 6)

---

## 🎯 Observaciones de Diseño

### Paleta de Colores Global
Los diseños usan diferentes primarios:
- **Login:** #2563eb (Azul)
- **Dashboard:** #7C3AED (Morado)
- **Cuentas:** #6366f1 (Indigo)

**Decisión:** Unificar con **#3B82F6** (azul Shadcn) como primario global para consistencia.

### Fuentes
- Login/Cuentas: **Inter**
- Dashboard: **Plus Jakarta Sans**

**Decisión:** Usar **Inter** globalmente (ya configurado en index.css)

### Iconos
Stitch usa Material Icons/Symbols. 

**Implementación:** Usamos **Lucide React** (más ligero, mejor con React)

### Modo Oscuro
Todos los diseños incluyen dark mode.

**Estado:** ✅ Configurado en Tailwind

---

## 📝 Notas de Implementación

1. **Fase 1 (✅):** Login y layout base implementados
2. **Fase 2 (⏭️):** Dashboard home con widgets - usar diseño de `parvoshub_dashboard_desktop`
3. **Fase 3 (⏭️):** Cuenta usuario - usar diseño de `personal_account_desktop`
4. **Fase 4 (⏭️):** Resumen anual usuario - usar `annual_summary_desktop`
5. **Fase 5 (⏭️):** Adaptar páginas Parvos con nuevos diseños
6. **Fase 6 (⏭️):** Calendarios con diseños de Stitch

---

**Última actualización:** 25 enero 2026
