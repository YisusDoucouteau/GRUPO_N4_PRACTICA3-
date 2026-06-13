const express = require('express');
const router = express.Router();

const {
  obtenerAlmacenes,
  obtenerAlmacenPorId,
  crearAlmacen,
  actualizarAlmacen,
  eliminarAlmacen
} = require('../controllers/almacenes.controller');

router.get('/', obtenerAlmacenes);
router.get('/:id', obtenerAlmacenPorId);
router.post('/', crearAlmacen);
router.put('/:id', actualizarAlmacen);
router.delete('/:id', eliminarAlmacen);

module.exports = router;
