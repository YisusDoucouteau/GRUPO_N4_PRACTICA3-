# OmniCommerce - Tienda de la Abuela Serafina

Sistema web desarrollado con arquitectura de microservicios para la gestión de catálogo, clientes, proveedores, sucursales, almacenes, inventario, compras, ventas, pagos, facturación, operaciones y usuarios.

## Tecnologías utilizadas

- Frontend: React + Vite
- Backend: Node.js + Express
- Base de datos: MySQL
- Arquitectura: Microservicios + API Gateway

## Estructura general

```text
PRACTICA_3_INICIO/
├── backend/
│   ├── gateway/
│   └── services/
│       ├── catalog-service/
│       ├── inventory-service/
│       ├── sales-service/
│       ├── purchases-service/
│       ├── payments-service/
│       ├── billing-service/
│       ├── operations-service/
│       └── users-service/
├── frontend/
├── database/
├── instalar_todo_final.bat
├── iniciar_todo_final.bat
└── detener_node.bat
```

## Microservicios

| Puerto | Servicio | Función |
|---|---|---|
| 3000 | api-gateway | Entrada principal del sistema |
| 3001 | catalog-service | Categorías, productos y catálogo |
| 3002 | inventory-service | Sucursales, almacenes, stock y movimientos |
| 3003 | sales-service | Clientes y ventas |
| 3004 | purchases-service | Proveedores y compras |
| 3005 | payments-service | Pagos, cuentas por cobrar y cuentas por pagar |
| 3006 | billing-service | Facturación |
| 3007 | operations-service | Devoluciones, bajas y transformaciones |
| 3008 | users-service | Usuarios, roles y login básico |
| 5173 | frontend | Interfaz web en React |

## Instalación

### 1. Importar base de datos

Importar en MySQL el archivo:

```text
database/db_omnicommerce_v3_compatible.sql
```

La base de datos debe llamarse:

```text
db_omnicommerce
```

### 2. Instalar dependencias

Ejecutar:

```text
instalar_todo_final.bat
```

### 3. Iniciar sistema

Ejecutar:

```text
iniciar_todo_final.bat
```

### 4. Abrir sistema

Frontend:

```text
http://127.0.0.1:5173
```

Gateway:

```text
http://localhost:3000/health
```

## Pruebas rápidas

Abrir en navegador:

```text
http://localhost:3000/api/catalog/productos
http://localhost:3000/api/inventory/stock
http://localhost:3000/api/sales/clientes
http://localhost:3000/api/purchases/proveedores
http://localhost:3000/api/payments/resumen
```

## Nota

No se debe subir `node_modules` al repositorio. Cada integrante debe ejecutar `npm install` o usar el archivo `instalar_todo_final.bat`.
