const express = require('express');
const router = express.Router();

const {
  obtenerCompras,
  obtenerCompraPorId,
  crearCompra
} = require('../controllers/compras.controller');

router.get('/', obtenerCompras);
router.get('/:id', obtenerCompraPorId);
router.post('/', crearCompra);

module.exports = router;
