const express = require('express');
const cors = require('cors');
const morgan = require('morgan');

const pagosRoutes = require('./routes/pagos.routes');
const cuentasCobrarRoutes = require('./routes/cuentas-cobrar.routes');
const cuentasPagarRoutes = require('./routes/cuentas-pagar.routes');
const resumenRoutes = require('./routes/resumen.routes');

const app = express();

app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

app.get('/health', (req, res) => {
  res.json({
    servicio: 'payments-service',
    estado: 'OK',
    mensaje: 'Microservicio de pagos funcionando correctamente'
  });
});

app.use('/api/payments/pagos', pagosRoutes);
app.use('/api/payments/cuentas-cobrar', cuentasCobrarRoutes);
app.use('/api/payments/cuentas-pagar', cuentasPagarRoutes);
app.use('/api/payments/resumen', resumenRoutes);

app.use((req, res) => {
  res.status(404).json({
    mensaje: 'Ruta no encontrada'
  });
});

module.exports = app;
