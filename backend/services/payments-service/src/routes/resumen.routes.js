const express = require('express');
const router = express.Router();

const {
  obtenerResumenFinanciero
} = require('../controllers/resumen.controller');

router.get('/', obtenerResumenFinanciero);

module.exports = router;
