const express = require('express');
const router = express.Router();

const {
  obtenerCuentasPagar,
  pagarCuentaPagar
} = require('../controllers/cuentas-pagar.controller');

router.get('/', obtenerCuentasPagar);
router.post('/:id/pagar', pagarCuentaPagar);

module.exports = router;
