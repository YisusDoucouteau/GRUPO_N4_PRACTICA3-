const express = require('express');
const router = express.Router();

const {
  obtenerDevolucionesBajas,
  registrarDevolucionBaja
} = require('../controllers/devoluciones-bajas.controller');

router.get('/', obtenerDevolucionesBajas);
router.post('/', registrarDevolucionBaja);

module.exports = router;
