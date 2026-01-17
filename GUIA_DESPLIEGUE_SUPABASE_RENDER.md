# 🚀 Guía de Despliegue - Supabase + Render

## ✅ Pre-requisitos Verificados

- ✅ **Código sin errores**
- ✅ **Todas las traducciones en CA/GL** (español solo interno)
- ✅ **Base de datos**: Supabase
- ✅ **Backend**: Render
- ✅ **Frontend**: Render

---

## 📋 PASO 1: Base de Datos (Supabase) - HACER PRIMERO

### 1.1 Acceder a Supabase
1. Ve a [https://supabase.com](https://supabase.com)
2. Inicia sesión
3. Selecciona tu proyecto de ParvosHub

### 1.2 Ejecutar el Script SQL
1. En el menú lateral, ve a **SQL Editor**
2. Crea una nueva query
3. Copia TODO el contenido del archivo `comidas_tables.sql`
4. Pega en el editor
5. Haz clic en **RUN** (o presiona Ctrl/Cmd + Enter)

**Contenido del archivo `comidas_tables.sql`:**
```sql
-- Tablas para el Calendario de Comidas

-- Tabla de comidas congeladas (inventario)
CREATE TABLE IF NOT EXISTS comidas_congeladas (
    id SERIAL PRIMARY KEY,
    nombre TEXT NOT NULL,
    notas TEXT,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    tachada BOOLEAN DEFAULT false,
    fecha_tachada TIMESTAMP
);

-- Tabla de comidas planificadas (calendario)
CREATE TABLE IF NOT EXISTS comidas_planificadas (
    id SERIAL PRIMARY KEY,
    comida_id INTEGER REFERENCES comidas_congeladas(id) ON DELETE SET NULL,
    comida_nombre TEXT NOT NULL,
    fecha DATE NOT NULL,
    tipo_comida TEXT NOT NULL CHECK (tipo_comida IN ('comida', 'cena')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Índices para mejorar rendimiento
CREATE INDEX IF NOT EXISTS idx_comidas_planificadas_fecha ON comidas_planificadas(fecha);
CREATE INDEX IF NOT EXISTS idx_comidas_congeladas_tachada ON comidas_congeladas(tachada);
```

### 1.3 Verificar Tablas Creadas
1. Ve a **Table Editor** en el menú lateral
2. Deberías ver las nuevas tablas:
   - ✅ `comidas_congeladas`
   - ✅ `comidas_planificadas`
3. Haz clic en cada una para verificar la estructura

✅ **Base de datos lista**

---

## 📋 PASO 2: Backend (Render)

### 2.1 Preparar el código
Desde tu terminal local:

```bash
cd /Users/xurxo/Documents/ParvosHub

# Asegurarte de que estás en la rama correcta
git status

# Añadir todos los cambios
git add .

# Commit con mensaje descriptivo
git commit -m "feat: Añadir calendario de comidas y mejoras en ExpenseTracker

- Calendario de comidas con drag & drop
- Warnings de calendario en gastos
- Dropdowns ordenados alfabéticamente
- Ordenación por fecha y hora
- Líneas de presupuesto en gráfico
- Traducciones completas en CA/GL"

# Subir a GitHub
git push origin main
```

### 2.2 Desplegar en Render (Backend)

**Opción A: Deploy Automático (si está configurado)**
1. Ve a [https://dashboard.render.com](https://dashboard.render.com)
2. Encuentra tu servicio de backend (ParvosHub Backend o similar)
3. Si tienes auto-deploy activado, el deploy se hará automáticamente
4. Espera a que termine (verás "Live" en verde)

**Opción B: Deploy Manual**
1. Ve a tu servicio de backend en Render
2. Haz clic en **Manual Deploy**
3. Selecciona **Deploy latest commit**
4. Espera a que termine

### 2.3 Verificar Logs del Backend
1. En Render, ve a **Logs**
2. Verifica que no haya errores
3. Deberías ver: `Servidor backend escuchando en puerto 3001` (o el puerto que uses)

✅ **Backend desplegado**

---

## 📋 PASO 3: Frontend (Render)

### 3.1 Desplegar en Render (Frontend)

**Opción A: Deploy Automático**
1. Ve a tu servicio de frontend en Render
2. Si tienes auto-deploy, se desplegará automáticamente
3. Espera a que termine (puede tardar 2-5 minutos)

**Opción B: Deploy Manual**
1. Ve a tu servicio de frontend en Render
2. Haz clic en **Manual Deploy**
3. Selecciona **Deploy latest commit**
4. Espera a que termine el build

### 3.2 Verificar Build
Durante el build verás:
```
Installing dependencies...
Building...
Creating optimized production build...
Build complete!
```

✅ **Frontend desplegado**

---

## 📋 PASO 4: Verificación Final

### 4.1 Acceder a la Aplicación
1. Abre tu URL de producción (ej: `https://parvoshub.onrender.com`)
2. Espera a que cargue (primer acceso puede tardar si estaba en sleep)

### 4.2 Checklist de Pruebas

#### Home
- ✅ Ver 2 iconos de calendario:
  - 📅 **Calendari de Despeses** (en catalán)
  - 🍽️ **Calendari de Menjars** (en catalán)

#### Calendario de Gastos
- ✅ Ver warnings de eventos del calendario (si hay eventos este mes)
- ✅ Poder descartar warnings (mensaje en catalán)
- ✅ Ver dropdowns ordenados alfabéticamente
- ✅ Ver línea roja en barras que superan presupuesto

#### Calendario de Comidas (NUEVO)
- ✅ Ver inventario lateral vacío
- ✅ Añadir una comida de prueba
- ✅ Click en la comida para expandir notas
- ✅ Arrastrar comida al calendario
- ✅ Confirmar si es comida o cena (mensaje en catalán)
- ✅ Ver comida en el calendario
- ✅ Mover comida dentro del calendario
- ✅ Eliminar comida (opciones en catalán)

#### Cambio de Idioma
- ✅ Cambiar a gallego
- ✅ Verificar textos en gallego
- ✅ Cambiar a catalán
- ✅ Verificar textos en catalán

---

## 🐛 Solución de Problemas

### Error: "Cannot find module"
**Problema**: Falta instalar dependencias en Render
**Solución**:
1. Ve a Render > Settings > Build Command
2. Verifica que sea: `npm install && npm run build`
3. Redeploy

### Error: "Database connection failed"
**Problema**: Variables de entorno incorrectas
**Solución**:
1. Ve a Render > Environment
2. Verifica `DATABASE_URL` apunta a Supabase
3. Formato: `postgresql://usuario:password@host:port/database`

### Error: "Table does not exist"
**Problema**: No se ejecutó el SQL en Supabase
**Solución**:
1. Ve a Supabase SQL Editor
2. Ejecuta el script `comidas_tables.sql` de nuevo
3. Verifica en Table Editor que existan las tablas

### Calendario de Comidas no carga
**Problema**: Backend no tiene los endpoints o tablas no existen
**Solución**:
1. Verifica logs del backend en Render
2. Verifica que las tablas existan en Supabase
3. Haz un redeploy del backend

### Los warnings no aparecen
**Problema**: No hay eventos en el calendario para este mes
**Solución**:
1. Ve a la página de Calendario (gastos)
2. Crea un evento para el mes actual
3. Vuelve a Registro de Gastos
4. Deberías ver el warning

---

## 📊 Resumen de Cambios Desplegados

### ExpenseTracker
- Dropdowns ordenados alfabéticamente
- Ordenación de registros por fecha + hora
- Líneas de presupuesto en gráfico
- Warnings de calendario
- Mejoras en móvil

### CalendarioComidas (NUEVO)
- Inventario de comidas congeladas
- Calendario bisemanal
- Drag & drop funcional
- Sistema de tachado automático
- Limpieza automática semanal

### Traducciones
- ✅ 100% traducido al catalán
- ✅ 100% traducido al gallego
- Español solo para desarrollo

---

## ✅ Checklist Post-Despliegue

- [ ] SQL ejecutado en Supabase
- [ ] Tablas verificadas en Supabase
- [ ] Backend desplegado en Render
- [ ] Frontend desplegado en Render
- [ ] Home carga correctamente
- [ ] Calendario de Gastos funciona
- [ ] Calendario de Comidas funciona
- [ ] Drag & drop funciona
- [ ] Idiomas cambian correctamente
- [ ] Mensajes en catalán/gallego

---

## 🎉 ¡Despliegue Completado!

Si todos los checks están verdes, **el despliegue ha sido exitoso**.

### Próximos Pasos (Opcional)
- Prueba crear comidas en el inventario
- Planifica comidas para la semana
- Añade eventos al calendario
- Verifica warnings en diferentes meses

---

## 📞 Contacto

Si hay algún problema durante el despliegue, revisa:
1. **Logs de Render** (Backend y Frontend)
2. **Console del navegador** (F12)
3. **Network tab** para ver errores de API

**¡Todo listo para producción!** 🚀
