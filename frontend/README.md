# 🎨 Frontend - Interfaz React

Aplicación React moderna e interactiva para gestionar gastos familiares.

---

## 📋 Tabla de contenidos

- [Instalación](#instalación)
- [Ejecutar](#ejecutar)
- [Estructura](#estructura)
- [Componentes](#componentes)
- [Configuración](#configuración)
- [Troubleshooting](#troubleshooting)

---

## 📦 Instalación

```bash
cd frontend
npm install
```

---

## 🚀 Ejecutar

### Desarrollo

```bash
npm start
```

Abre automáticamente: **http://localhost:3000**

### Build para producción

```bash
npm run build
```

Genera carpeta `build/` con archivos optimizados.

---

## 📁 Estructura

```
frontend/
├── public/               # Archivos estáticos
├── src/
│   ├── components/       # Componentes React
│   │   ├── Home.js      # Dashboard
│   │   ├── ExpenseTracker.js  # Gestor de gastos
│   │   └── ResumenAnual.js    # Resumen anual
│   ├── assets/           # Imágenes
│   ├── styles/           # Estilos CSS
│   └── App.js            # Componente principal
└── package.json
```

---

## 🧩 Componentes principales

### Home.js
Dashboard con gráfico de gastos por categoría y mes.

### ExpenseTracker.js
Tabla para agregar, editar y eliminar operaciones con filtros.

### ResumenAnual.js
Resumen tabular de gastos por mes y categoría.

---

## 🔐 Variables de entorno

Archivo `.env`:

```env
# Desarrollo
REACT_APP_API_URL=http://localhost:3001

# Producción
REACT_APP_API_URL=https://tu-dominio.com
```

---

## 🛠️ Troubleshooting

| Error | Solución |
|-------|----------|
| Puerto 3000 en uso | `lsof -i :3000` y `kill -9 PID` |
| Backend no responde | Inicia el backend: `./start-dev.sh` |
| CORS error | Verifica que el backend tiene `app.use(cors())` |

---

**Para documentación completa, ver [README.md](../README.md) en la raíz del proyecto.**

You can learn more in the [Create React App documentation](https://facebook.github.io/create-react-app/docs/getting-started).

To learn React, check out the [React documentation](https://reactjs.org/).

### Code Splitting

This section has moved here: [https://facebook.github.io/create-react-app/docs/code-splitting](https://facebook.github.io/create-react-app/docs/code-splitting)

### Analyzing the Bundle Size

This section has moved here: [https://facebook.github.io/create-react-app/docs/analyzing-the-bundle-size](https://facebook.github.io/create-react-app/docs/analyzing-the-bundle-size)

### Making a Progressive Web App

This section has moved here: [https://facebook.github.io/create-react-app/docs/making-a-progressive-web-app](https://facebook.github.io/create-react-app/docs/making-a-progressive-web-app)

### Advanced Configuration

This section has moved here: [https://facebook.github.io/create-react-app/docs/advanced-configuration](https://facebook.github.io/create-react-app/docs/advanced-configuration)

### Deployment

This section has moved here: [https://facebook.github.io/create-react-app/docs/deployment](https://facebook.github.io/create-react-app/docs/deployment)

### `npm run build` fails to minify

This section has moved here: [https://facebook.github.io/create-react-app/docs/troubleshooting#npm-run-build-fails-to-minify](https://facebook.github.io/create-react-app/docs/troubleshooting#npm-run-build-fails-to-minify)
