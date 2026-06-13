#!/bin/bash

ROOT_DIR="$(cd "$(dirname "$0")" && pwd)"
LOG_DIR="$ROOT_DIR/logs"
PID_FILE="$ROOT_DIR/.omnicommerce_pids"

mkdir -p "$LOG_DIR"
: > "$PID_FILE"

echo "======================================================"
echo "INICIANDO OMNICOMMERCE EN MAC"
echo "======================================================"
echo "Los servicios se ejecutaran en segundo plano."
echo "Logs: $LOG_DIR"
echo ""

start_service() {
  local name="$1"
  local path="$2"
  local command="$3"

  echo "Iniciando $name..."
  cd "$ROOT_DIR/$path" || exit 1
  nohup bash -c "$command" > "$LOG_DIR/$name.log" 2>&1 &
  local pid=$!
  echo "$pid|$name" >> "$PID_FILE"
  echo "  PID $pid - Log: logs/$name.log"
  sleep 1
}

start_service "catalog-service-3001" "backend/services/catalog-service" "npm run dev"
start_service "inventory-service-3002" "backend/services/inventory-service" "npm run dev"
start_service "sales-service-3003" "backend/services/sales-service" "npm run dev"
start_service "purchases-service-3004" "backend/services/purchases-service" "npm run dev"
start_service "payments-service-3005" "backend/services/payments-service" "npm run dev"
start_service "billing-service-3006" "backend/services/billing-service" "npm run dev"
start_service "operations-service-3007" "backend/services/operations-service" "npm run dev"
start_service "users-service-3008" "backend/services/users-service" "npm run dev"
start_service "api-gateway-3000" "backend/gateway" "npm run dev"
start_service "frontend-5173" "frontend" "npm run dev -- --host 127.0.0.1 --port 5173"

cd "$ROOT_DIR"

echo ""
echo "======================================================"
echo "SISTEMA INICIADO"
echo "======================================================"
echo "Gateway:  http://localhost:3000/health"
echo "Frontend: http://127.0.0.1:5173"
echo ""
echo "Para detener todo ejecuta: ./detener_node_mac.sh"
echo ""

if command -v open >/dev/null 2>&1; then
  open "http://127.0.0.1:5173" >/dev/null 2>&1 || true
fi
