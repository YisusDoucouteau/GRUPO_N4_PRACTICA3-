# OmniCommerce Frontend

React 18 + Vite frontend para la gestión de "Tienda de la Abuela Serafina".  
Se conecta al API Gateway en `localhost:3000` que enruta a 8 microservicios Node.js/Express.

## Inicio rápido

```bash
cd frontend
npm install
npm run dev        # http://127.0.0.1:5173
```

## Módulos y estado

| Módulo | Backend | UI/CRUD | Notas |
|--------|---------|---------|-------|
| Dashboard | OK | OK | Cards clicables con datos en tiempo real |
| Caja / POS | OK | OK | Punto de venta: carrito, búsqueda SKU/nombre, sucursal/almacén, condición/método de pago, ventas recientes |
| Clientes | OK | OK | CRUD con CrudModal |
| Proveedores | OK | OK | CRUD con CrudModal |
| Catálogo | OK | OK | CRUD categorías + productos con CrudModal |
| Sucursales / Almacenes | OK | OK | CRUD con CrudModal; almacenes filtrados por sucursal |
| Inventario | OK | OK | Ajuste entrada/salida con dropdowns reales de productos y almacenes |
| Ventas | OK | OK | Dropdowns reales, auto-fill precio al seleccionar producto |
| Compras | OK | OK | Dropdowns reales, auto-fill precio de costo |
| Finanzas | OK | OK | CxC, CxP, amortizaciones, resumen financiero |
| Facturación | OK | OK | Generación de facturas por venta |
| Operaciones | OK | OK | Devoluciones/bajas y transformaciones con dropdowns |
| Usuarios | OK | OK | CRUD completo con roles |

## Arquitectura

```
src/
├── App.jsx              — Todas las páginas/componentes
├── api.js               — getJSON / postJSON / putJSON / deleteJSON
├── main.jsx             — Punto de entrada React
├── styles.css           — Design system + estilos POS
└── components/
    ├── Layout.jsx        — Sidebar responsivo; modo POS sin padding (content-pos)
    └── Components.jsx    — Page, Alert, Card, Field, Table, CrudModal, Badge, Loading
```

## Patrones clave

### CrudModal
Todos los módulos CRUD declaran `<CrudModal>` **fuera** de `<Page>`, como hermano en un fragmento `<>`. Si se coloca dentro de Page, el `overflow-y: auto` del contenedor corta el overlay `position: fixed`.

```jsx
return (
  <>
    <Page title="...">
      {/* tabla + boton Nuevo */}
    </Page>
    <CrudModal isOpen={open} ... />   {/* SIEMPRE fuera de Page */}
  </>
);
```

### Caja / POS
Cuando `currentPage === 'caja'`, Layout aplica `.content-pos` (padding 0, overflow hidden). El componente Caja ocupa el 100% del alto con layout de tres columnas: acciones | carrito | panel de pago.

### useLoad
Hook para peticiones GET: `{ data, error, loading, reload }`. El async loader se ejecuta al montar; `reload()` lo repite.

## Endpoints por servicio

| Puerto | Servicio | Rutas principales |
|--------|----------|-------------------|
| 3001 | Catalog   | `/api/catalog/categorias`, `/api/catalog/productos` |
| 3002 | Inventory | `/api/inventory/sucursales`, `/api/inventory/almacenes`, `/api/inventory/stock` |
| 3003 | Sales     | `/api/sales/clientes`, `/api/sales/ventas` |
| 3004 | Purchases | `/api/purchases/proveedores`, `/api/purchases/compras` |
| 3005 | Payments  | `/api/payments/resumen`, `/api/payments/cuentas-cobrar`, `/api/payments/cuentas-pagar` |
| 3006 | Billing   | `/api/billing/facturas` |
| 3007 | Operations| `/api/operations/devoluciones-bajas`, `/api/operations/transformaciones` |
| 3008 | Users     | `/api/users/usuarios`, `/api/users/roles`, `/api/auth/login` |

## Responsividad

- Desktop (>768px): sidebar fijo 280px
- Movil (<768px): hamburger + drawer con overlay

## Troubleshooting

| Problema | Solucion |
|----------|----------|
| 500 / "No database selected" | `require('dotenv').config()` debe ser la primera linea en `server.js` de cada servicio |
| CORS errors | El gateway debe estar corriendo en `localhost:3000` |
| Puerto ocupado | `npm run dev -- --port 5174` |
| Cambios no reflejan | Ctrl+Shift+R (hard refresh) |
