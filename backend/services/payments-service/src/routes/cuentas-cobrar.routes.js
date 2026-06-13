const express = require('express');
const router = express.Router();

const {
  obtenerCuentasCobrar,
  pagarCuentaCobrar
} = require('../controllers/cuentas-cobrar.controller');

router.get('/', obtenerCuentasCobrar);
router.post('/:id/pagar', pagarCuentaCobrar);

module.exports = router;
