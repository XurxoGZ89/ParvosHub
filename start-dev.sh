#!/bin/bash

# Script para iniciar PostgreSQL y el backend en desarrollo

export PATH="/opt/homebrew/opt/postgresql@15/bin:$PATH"

echo "🚀 Iniciando ambiente de desarrollo..."
echo ""

# 1. Verificar que PostgreSQL está corriendo
echo "✅ Verificando PostgreSQL..."
if ! pgrep -q postgres; then
    echo "   PostgreSQL no está corriendo. Iniciando..."
    brew services start postgresql@15
else
    echo "   PostgreSQL ya está corriendo."
fi

echo ""
echo "📦 Iniciando backend en puerto 3001..."
cd /Users/xurxo/Documents/ProyectoApp/backend
NODE_ENV=development node index.js &
BACKEND_PID=$!

echo ""
echo "🎨 En otra terminal, inicia el frontend con:"
echo "   cd /Users/xurxo/Documents/ProyectoApp/frontend && npm start"
echo ""
echo "📱 Frontend: http://localhost:3000"
echo "🔌 Backend API: http://localhost:3001"
echo ""
echo "Backend PID: $BACKEND_PID"
echo "Para detener el backend: kill $BACKEND_PID"
echo ""

wait $BACKEND_PID
