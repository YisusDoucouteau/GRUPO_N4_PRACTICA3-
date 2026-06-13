@echo off
echo ======================================================
echo INSTALANDO DEPENDENCIAS - OMNICOMMERCE FINAL
echo ======================================================

echo.
echo Instalando catalog-service...
cd /d "%~dp0backend\services\catalog-service"
call npm install
echo.
echo Instalando inventory-service...
cd /d "%~dp0backend\services\inventory-service"
call npm install
echo.
echo Instalando sales-service...
cd /d "%~dp0backend\services\sales-service"
call npm install
echo.
echo Instalando purchases-service...
cd /d "%~dp0backend\services\purchases-service"
call npm install
echo.
echo Instalando payments-service...
cd /d "%~dp0backend\services\payments-service"
call npm install
echo.
echo Instalando billing-service...
cd /d "%~dp0backend\services\billing-service"
call npm install
echo.
echo Instalando operations-service...
cd /d "%~dp0backend\services\operations-service"
call npm install
echo.
echo Instalando users-service...
cd /d "%~dp0backend\services\users-service"
call npm install
echo.
echo Instalando api-gateway...
cd /d "%~dp0backend\gateway"
call npm install
echo.
echo Instalando frontend...
cd /d "%~dp0frontend"
call npm install

echo.
echo ======================================================
echo INSTALACION COMPLETADA
echo ======================================================
pause