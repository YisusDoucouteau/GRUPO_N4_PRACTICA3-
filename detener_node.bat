@echo off
echo ======================================================
echo DETENER SERVICIOS NODE
echo ======================================================
echo Esto cerrara procesos node.exe abiertos en tu equipo.
echo Usalo solamente cuando quieras detener el sistema.
echo.
pause
taskkill /F /IM node.exe
echo Servicios detenidos.
pause
