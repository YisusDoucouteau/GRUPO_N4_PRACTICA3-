const express = require('express');
const router = express.Router();

const {
  obtenerPagos
} = require('../controllers/pagos.controller');

router.get('/', obtenerPagos);

module.exports = router;
