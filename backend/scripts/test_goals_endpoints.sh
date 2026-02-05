#!/bin/bash

# Script de prueba para verificar los endpoints de metas de usuario
# Asegúrate de tener el backend corriendo en el puerto 3001

echo "🧪 Probando endpoints de metas de usuario..."
echo ""

# Variables
BASE_URL="http://localhost:3001/api/user"
TOKEN=""  # Añadir tu token JWT aquí

# Verificar si se proporcionó un token
if [ -z "$TOKEN" ]; then
  echo "❌ Error: Debes configurar un TOKEN JWT en este script"
  echo "   Primero inicia sesión y copia el token de autenticación"
  exit 1
fi

echo "1️⃣  GET /api/user/goals - Obtener todas las metas"
curl -X GET "${BASE_URL}/goals" \
  -H "Authorization: Bearer ${TOKEN}" \
  -H "Content-Type: application/json"
echo -e "\n"

echo "2️⃣  POST /api/user/goals - Crear nueva meta"
curl -X POST "${BASE_URL}/goals" \
  -H "Authorization: Bearer ${TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{
    "nombre": "Vacaciones en Japón",
    "cantidad_objetivo": 3000,
    "cantidad_actual": 500,
    "fecha_inicio": "2026-02-05",
    "fecha_objetivo": "2026-12-31",
    "categoria": "Viajes",
    "notas": "Ahorro para viaje familiar a Japón",
    "completada": false
  }'
echo -e "\n"

echo "3️⃣  GET /api/user/goals - Verificar que se creó la meta"
curl -X GET "${BASE_URL}/goals" \
  -H "Authorization: Bearer ${TOKEN}" \
  -H "Content-Type: application/json"
echo -e "\n"

echo ""
echo "✅ Pruebas completadas"
echo "💡 Para actualizar o eliminar, usa:"
echo "   PUT ${BASE_URL}/goals/:id"
echo "   DELETE ${BASE_URL}/goals/:id"
