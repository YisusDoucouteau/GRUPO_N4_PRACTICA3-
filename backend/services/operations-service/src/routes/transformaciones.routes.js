const express = require('express');
const router = express.Router();

const {
  obtenerTransformaciones,
  obtenerTransformacionPorId,
  crearTransformacion
} = require('../controllers/transformaciones.controller');

router.get('/', obtenerTransformaciones);
router.get('/:id', obtenerTransformacionPorId);
router.post('/', crearTransformacion);

module.exports = router;
