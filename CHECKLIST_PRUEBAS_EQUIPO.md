# Checklist de pruebas del sistema

## 1. Verificación inicial

- [ ] MySQL está encendido.
- [ ] La base `db_omnicommerce` existe.
- [ ] El Gateway responde en `http://localhost:3000/health`.
- [ ] El frontend abre en `http://127.0.0.1:5173`.

## 2. Catálogo

- [ ] Registrar categoría.
- [ ] Registrar producto.
- [ ] Editar producto.
- [ ] Eliminar producto.

## 3. Clientes y proveedores

- [ ] Registrar cliente.
- [ ] Editar cliente.
- [ ] Eliminar cliente.
- [ ] Registrar proveedor.
- [ ] Editar proveedor.
- [ ] Eliminar proveedor.

## 4. Sucursales y almacenes

- [ ] Registrar sucursal.
- [ ] Registrar almacén.
- [ ] Ver almacenes asociados a sucursales.

## 5. Inventario

- [ ] Registrar entrada de inventario.
- [ ] Registrar salida de inventario.
- [ ] Ver movimientos de inventario.

## 6. Compras

- [ ] Registrar compra al contado.
- [ ] Registrar compra con bonificación.
- [ ] Registrar compra a crédito.
- [ ] Ver que el inventario suba.
- [ ] Ver cuenta por pagar si corresponde.

## 7. Ventas

- [ ] Registrar venta al contado.
- [ ] Registrar venta a crédito.
- [ ] Registrar venta parcial.
- [ ] Ver que el inventario baje.
- [ ] Ver cuenta por cobrar si corresponde.

## 8. Pagos

- [ ] Pagar cuenta por cobrar.
- [ ] Pagar cuenta por pagar.
- [ ] Ver resumen financiero.

## 9. Facturación

- [ ] Ver ventas sin factura.
- [ ] Generar factura.
- [ ] Ver listado de facturas.

## 10. Operaciones

- [ ] Registrar devolución de cliente.
- [ ] Registrar baja por vencimiento o pérdida.
- [ ] Registrar transformación.
