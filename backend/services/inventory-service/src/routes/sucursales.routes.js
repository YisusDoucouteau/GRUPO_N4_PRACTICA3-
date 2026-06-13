const express = require('express');
const router = express.Router();

const {
  obtenerSucursales,
  obtenerSucursalPorId,
  crearSucursal,
  actualizarSucursal,
  eliminarSucursal
} = require('../controllers/sucursales.controller');

router.get('/', obtenerSucursales);
router.get('/:id', obtenerSucursalPorId);
router.post('/', crearSucursal);
router.put('/:id', actualizarSucursal);
router.delete('/:id', eliminarSucursal);

module.exports = router;
