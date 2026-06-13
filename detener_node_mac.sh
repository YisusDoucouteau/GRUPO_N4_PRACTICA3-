#!/bin/bash

ROOT_DIR="$(cd "$(dirname "$0")" && pwd)"
PID_FILE="$ROOT_DIR/.omnicommerce_pids"

echo "======================================================"
echo "DETENIENDO OMNICOMMERCE EN MAC"
echo "======================================================"

if [ -f "$PID_FILE" ]; then
  while IFS='|' read -r pid name; do
    if [ -n "$pid" ] && kill -0 "$pid" 2>/dev/null; then
      echo "Deteniendo $name con PID $pid..."
      kill "$pid" 2>/dev/null || true
    fi
  done < "$PID_FILE"
  rm -f "$PID_FILE"
else
  echo "No se encontro archivo de PIDs. Se intentara cerrar procesos comunes de Node usados por el proyecto."
fi

# Limpieza adicional de procesos que pudieron quedar abiertos en los puertos del proyecto.
for port in 3000 3001 3002 3003 3004 3005 3006 3007 3008 5173; do
  pid=$(lsof -ti tcp:$port 2>/dev/null)
  if [ -n "$pid" ]; then
    echo "Cerrando proceso en puerto $port: $pid"
    kill $pid 2>/dev/null || true
  fi
done

echo ""
echo "Servicios detenidos."
