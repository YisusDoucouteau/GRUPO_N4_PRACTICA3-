const express = require('express');
const router = express.Router();

const {
  obtenerProveedores,
  obtenerProveedorPorId,
  crearProveedor,
  actualizarProveedor,
  eliminarProveedor
} = require('../controllers/proveedores.controller');

router.get('/', obtenerProveedores);
router.get('/:id', obtenerProveedorPorId);
router.post('/', crearProveedor);
router.put('/:id', actualizarProveedor);
router.delete('/:id', eliminarProveedor);

module.exports = router;
