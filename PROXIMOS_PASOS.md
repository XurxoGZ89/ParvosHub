# 🎯 Próximos pasos - Plan de acción

Guía paso a paso para llevar tu app de desarrollo a producción.

---

## 📋 Checklist completo

### ✅ Fase 1: Desarrollo (YA HECHO)

- ✅ Backend con PostgreSQL
- ✅ Frontend con React
- ✅ Variables de entorno configuradas
- ✅ PostgreSQL funcionando localmente
- ✅ Scripts de inicio (`start-dev.sh`)
- ✅ READMEs completos

### 🔄 Fase 2: Git & Repositorio (SIGUIENTE)

- ⬜ Crear cuenta en GitHub
- ⬜ Crear nuevo repositorio
- ⬜ Hacer `git init` en tu proyecto
- ⬜ Hacer primer commit
- ⬜ Hacer push a GitHub

### 🚀 Fase 3: Despliegue (DESPUÉS)

- ⬜ Crear cuenta en Render
- ⬜ Provisionar PostgreSQL en Render
- ⬜ Desplegar backend
- ⬜ Desplegar frontend
- ⬜ Registrar dominio (opcional)
- ⬜ Configurar DNS (opcional)

### 🎉 Fase 4: Mantenimiento (LUEGO)

- ⬜ Configurar backups automáticos
- ⬜ Monitoreo de logs
- ⬜ Escalado si es necesario

---

## 📌 Fase 2: Git & GitHub (AHORA)

### Paso 1: Crear cuenta en GitHub

1. Ir a https://github.com
2. Sign up (registrarse)
3. Completar formulario
4. Verificar email

**Tiempo:** 2 minutos

---

### Paso 2: Crear repositorio

1. Ir a https://github.com/new
2. Nombre: `ProyectoApp` (o como quieras)
3. Descripción: "Gestor de gastos familiares"
4. Privado o público: **Tu elección**
   - Público: Cualquiera ve el código
   - Privado: Solo tú
5. Inicializar con README: **NO** (ya tienes)
6. Click en "Create repository"

**Resultado:** Tendrás una URL como `https://github.com/tuusuario/ProyectoApp`

**Tiempo:** 1 minuto

---

### Paso 3: Preparar tu código

En tu Mac, desde la raíz del proyecto:

```bash
cd /Users/xurxo/Documents/ProyectoApp

# Inicializar Git
git init

# Ver archivos que Git va a trackear
git status
```

Deberías ver archivos de backend y frontend.

---

### Paso 4: Ignorar archivos sensibles

Git ya tiene `.gitignore` en backend/frontend, pero vamos a añadir uno en la raíz:

```bash
# Desde la raíz del ProyectoApp
cat > .gitignore << 'EOF'
# Dependencias
node_modules/
package-lock.json

# Variables de entorno
.env
.env.local
.env.production.local

# Logs
logs/
*.log

# IDE
.vscode/
.idea/

# Build
build/
dist/

# Base de datos local
database.sqlite
*.db

# macOS
.DS_Store

# Electron
release/
EOF
```

**Importante:** Git ignorará archivos secretos (`.env`, `node_modules`, etc.)

---

### Paso 5: Primer commit

```bash
# Añadir todos los archivos
git add .

# Verificar qué va a committear
git status

# Crear primer commit
git commit -m "Initial commit: ProyectoApp con PostgreSQL"

# Ver el commit
git log
```

**Tiempo:** 1 minuto

---

### Paso 6: Conectar a GitHub

Ahora conectas tu repositorio local con GitHub:

```bash
# Reemplaza "tuusuario" con tu usuario de GitHub
git remote add origin https://github.com/tuusuario/ProyectoApp.git

# Ver que se conectó
git remote -v

# Cambiar rama a "main" (por defecto en GitHub)
git branch -M main

# Hacer push (subir al servidor)
git push -u origin main
```

Verás:

```
Enumerating objects: 123, done.
Counting objects: 100% (123/123), done.
...
To https://github.com/tuusuario/ProyectoApp.git
 * [new branch]      main -> main
Branch 'main' set up to track remote branch 'main' from 'origin'.
```

**¡Listo!** Tu código está en GitHub.

---

### Paso 7: Verificar en GitHub

1. Ir a https://github.com/tuusuario/ProyectoApp
2. Deberías ver tu código
3. Ver `.gitignore` — `/node_modules` no aparece ✅
4. Ver `backend/` y `frontend/` — Aparecen ✅
5. Ver `.env` — No aparece (secreto) ✅

---

## 📱 Próximas veces (Git workflow)

Después de cambios:

```bash
# Ver qué cambió
git status

# Añadir cambios
git add .

# Commit
git commit -m "Descripción de cambios"

# Push a GitHub (también dispara deploy en Render)
git push
```

**¡Cada push = deploy automático en Render!** 🚀

---

## 🚀 Fase 3: Despliegue en Render (DESPUÉS DE GIT)

Una vez que tu código esté en GitHub:

1. Crear cuenta en Render.com
2. Crear PostgreSQL database
3. Crear Web Service para backend
4. Crear Static Site para frontend
5. Configurar variables de entorno
6. ✅ Listo

**Ver:** [DESPLIEGUE.md](DESPLIEGUE.md) para pasos detallados

**Tiempo:** 15-20 minutos

---

## 📊 Timeline estimado

```
Hoy (28 de diciembre):
├─ 10 min: Crear GitHub + Push código ✅
└─ 15 min: Crear Render + Deploy ✅
  → Total: 25 minutos

Resultado: Tu app en vivo en 25 minutos 🎉
```

---

## ⚠️ Errores comunes

### "fatal: not a git repository"

Solución:
```bash
cd /Users/xurxo/Documents/ProyectoApp
git init
```

### "fatal: 'origin' does not appear to be a 'git' repository"

Solución:
```bash
git remote add origin https://github.com/tuusuario/ProyectoApp.git
```

### "Permission denied (publickey)"

Solución (SSH key):
```bash
# Generar clave
ssh-keygen -t ed25519 -C "tuemail@gmail.com"

# Añadir a GitHub
# Ir a Settings → SSH and GPG keys
# Click "New SSH key"
# Pegar contenido de ~/.ssh/id_ed25519.pub
```

O simplemente **usa HTTPS** en lugar de SSH.

---

## 🎯 Resumen rápido

| Paso | Comando | Tiempo |
|------|---------|--------|
| 1. GitHub account | Ir a github.com | 2 min |
| 2. Crear repo | github.com/new | 1 min |
| 3. Git init | `git init` | 30 seg |
| 4. Add files | `git add .` | 30 seg |
| 5. Commit | `git commit -m "..."` | 1 min |
| 6. Push | `git push -u origin main` | 2 min |
| 7. Verificar | Ver en github.com | 1 min |
| **TOTAL** | | **8 minutos** ⏱️ |

---

## 🎉 ¿Listo para empezar?

1. ✅ Tu código ya está en `/Users/xurxo/Documents/ProyectoApp`
2. ✅ Backend migrado a PostgreSQL
3. ✅ Frontend con variables de entorno
4. ⬜ **Ahora:** Subir a GitHub
5. ⬜ Luego: Desplegar en Render

**¿Empezamos?** 🚀

---

**Última actualización:** 28 de diciembre de 2025
