@echo off
echo ======================================================
echo INICIANDO OMNICOMMERCE FINAL
echo ======================================================
echo Se abriran varias ventanas de consola.
echo No cierres esas ventanas mientras uses el sistema.
echo.

start "catalog-service 3001" cmd /k "pushd ""%~dp0backend\services\catalog-service"" && npm run dev"
timeout /t 2 > nul

start "inventory-service 3002" cmd /k "pushd ""%~dp0backend\services\inventory-service"" && npm run dev"
timeout /t 2 > nul

start "sales-service 3003" cmd /k "pushd ""%~dp0backend\services\sales-service"" && npm run dev"
timeout /t 2 > nul

start "purchases-service 3004" cmd /k "pushd ""%~dp0backend\services\purchases-service"" && npm run dev"
timeout /t 2 > nul

start "payments-service 3005" cmd /k "pushd ""%~dp0backend\services\payments-service"" && npm run dev"
timeout /t 2 > nul

start "billing-service 3006" cmd /k "pushd ""%~dp0backend\services\billing-service"" && npm run dev"
timeout /t 2 > nul

start "operations-service 3007" cmd /k "pushd ""%~dp0backend\services\operations-service"" && npm run dev"
timeout /t 2 > nul

start "users-service 3008" cmd /k "pushd ""%~dp0backend\services\users-service"" && npm run dev"
timeout /t 2 > nul

start "api-gateway 3000" cmd /k "pushd ""%~dp0backend\gateway"" && npm run dev"
timeout /t 2 > nul

start "frontend 5173" cmd /k "pushd ""%~dp0frontend"" && npm run dev -- --host 127.0.0.1 --port 5173"
timeout /t 2 > nul

echo ======================================================
echo SISTEMA INICIANDO
echo ======================================================
echo Gateway:  http://localhost:3000
echo Frontend: http://127.0.0.1:5173
echo.
pause
