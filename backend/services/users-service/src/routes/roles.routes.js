const express = require('express');
const router = express.Router();

const {
  obtenerRoles,
  crearRol
} = require('../controllers/roles.controller');

router.get('/', obtenerRoles);
router.post('/', crearRol);

module.exports = router;
