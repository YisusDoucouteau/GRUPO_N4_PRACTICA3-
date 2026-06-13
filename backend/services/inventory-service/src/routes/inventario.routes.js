const express = require('express');
const router = express.Router();

const {
  obtenerInventario,
  obtenerInventarioPorId,
  obtenerMovimientos,
  ajusteEntrada,
  ajusteSalida
} = require('../controllers/inventario.controller');

router.get('/', obtenerInventario);
router.get('/movimientos', obtenerMovimientos);
router.get('/:id', obtenerInventarioPorId);

router.post('/ajuste-entrada', ajusteEntrada);
router.post('/ajuste-salida', ajusteSalida);

module.exports = router;
