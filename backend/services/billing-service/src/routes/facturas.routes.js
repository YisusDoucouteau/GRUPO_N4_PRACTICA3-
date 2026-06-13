const express = require('express');
const router = express.Router();

const {
  obtenerFacturas,
  obtenerFacturaPorId,
  obtenerVentasSinFactura,
  crearFactura,
  anularFactura,
  obtenerFacturaPorVenta
} = require('../controllers/facturas.controller');

router.get('/', obtenerFacturas);
router.get('/ventas-sin-factura', obtenerVentasSinFactura);
router.get('/por-venta/:venta_id', obtenerFacturaPorVenta);
router.get('/:id', obtenerFacturaPorId);
router.post('/', crearFactura);
router.delete('/:id', anularFactura);

module.exports = router;
