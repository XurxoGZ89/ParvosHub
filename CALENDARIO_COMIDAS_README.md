# Calendario de Comidas - Instrucciones de Instalación

## 1. Ejecutar el script SQL

Necesitas ejecutar el archivo `comidas_tables.sql` en tu base de datos PostgreSQL.

### Opción A: Desde la línea de comandos
```bash
psql -U tu_usuario -d nombre_base_datos -f comidas_tables.sql
```

### Opción B: Desde Render/Supabase/otro servicio cloud
1. Accede al panel de control de tu base de datos
2. Abre el SQL Editor o Query Editor
3. Copia y pega el contenido del archivo `comidas_tables.sql`
4. Ejecuta el script

## 2. Reiniciar el backend (si está en ejecución)

El backend ya tiene todos los endpoints necesarios, pero si estaba en ejecución, reinícialo para asegurar que todo funcione correctamente.

## 3. Acceder a la nueva funcionalidad

Una vez ejecutado el SQL:
- Ve a la Home de la aplicación
- Verás dos iconos de calendario:
  - 📅 **Calendario de Gastos** (el anterior, ahora con texto)
  - 🍽️ **Calendario de Comidas** (el nuevo)

## Características del Calendario de Comidas

### Inventario de Comidas Congeladas
- Añade comidas al inventario con un nombre
- Haz clic en una comida para expandir y añadir notas (estilo iOS)
- Las comidas se pueden arrastrar al calendario
- Cuando se planifican, se tachan automáticamente
- Se eliminan automáticamente cuando pasa la semana

### Calendario Bisemanal
- Muestra 2 semanas completas (lunes a domingo)
- Navegación con botones Anterior/Siguiente (de 2 en 2 semanas)
- Cada día tiene 2 espacios: Comida (🍽️) y Cena (🌙)
- Drag & Drop desde el inventario al calendario
- Al soltar, pregunta si es comida o cena
- Las comidas planificadas se pueden mover dentro del calendario
- Se pueden eliminar (con opción de volver al listado o borrar completamente)

### Diseño Responsive
- En móvil: el inventario aparece arriba del calendario
- En desktop: inventario a la izquierda, calendario a la derecha
- El calendario tiene scroll horizontal en móvil si es necesario

## Traducciones

Todas las traducciones están implementadas en:
- **Catalán** (ca)
- **Gallego** (gl)
- **Español** (es)

La aplicación cambia automáticamente según el idioma seleccionado.
