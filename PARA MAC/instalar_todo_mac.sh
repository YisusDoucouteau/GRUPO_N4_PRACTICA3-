#!/bin/bash

set -e

ROOT_DIR="$(cd "$(dirname "$0")" && pwd)"

echo "======================================================"
echo "INSTALANDO DEPENDENCIAS - OMNICOMMERCE EN MAC"
echo "======================================================"
echo "Ruta del proyecto: $ROOT_DIR"
echo ""

install_service() {
  local name="$1"
  local path="$2"
  echo ""
  echo "Instalando $name..."
  cd "$ROOT_DIR/$path"
  npm install
}

install_service "catalog-service" "backend/services/catalog-service"
install_service "inventory-service" "backend/services/inventory-service"
install_service "sales-service" "backend/services/sales-service"
install_service "purchases-service" "backend/services/purchases-service"
install_service "payments-service" "backend/services/payments-service"
install_service "billing-service" "backend/services/billing-service"
install_service "operations-service" "backend/services/operations-service"
install_service "users-service" "backend/services/users-service"
install_service "api-gateway" "backend/gateway"
install_service "frontend" "frontend"

cd "$ROOT_DIR"

echo ""
echo "======================================================"
echo "INSTALACION COMPLETADA"
echo "======================================================"
echo "Ahora puedes ejecutar: ./iniciar_todo_mac.sh"
