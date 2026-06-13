const express = require('express');
const router = express.Router();

const {
  obtenerFacturas,
  obtenerFacturaPorId,
  obtenerVentasSinFactura,
  crearFactura,
  anularFactura
} = require('../controllers/facturas.controller');

router.get('/', obtenerFacturas);
router.get('/ventas-sin-factura', obtenerVentasSinFactura);
router.get('/:id', obtenerFacturaPorId);
router.post('/', crearFactura);
router.delete('/:id', anularFactura);

module.exports = router;
