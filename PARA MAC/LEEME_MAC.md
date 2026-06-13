# Ejecución del proyecto en Mac

Estos scripts son equivalentes a los `.bat` de Windows.

## 1. Dar permisos

Desde la raíz del proyecto:

```bash
chmod +x instalar_todo_mac.sh iniciar_todo_mac.sh detener_node_mac.sh
```

## 2. Instalar dependencias

```bash
./instalar_todo_mac.sh
```

## 3. Iniciar el sistema

```bash
./iniciar_todo_mac.sh
```

El sistema abrirá:

```text
Frontend: http://127.0.0.1:5173
Gateway:  http://localhost:3000/health
```

## 4. Detener el sistema

```bash
./detener_node_mac.sh
```

## Importante

Antes de iniciar, MySQL debe estar encendido y la base de datos debe estar importada:

```text
database/db_omnicommerce_v3_compatible.sql
```

Si MySQL tiene contraseña, revisar los archivos `.env` de cada servicio y cambiar:

```text
DB_PASSWORD=tu_contraseña
```
