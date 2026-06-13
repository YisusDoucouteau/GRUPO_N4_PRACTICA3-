const express = require('express');
const cors = require('cors');
const morgan = require('morgan');

const facturasRoutes = require('./routes/facturas.routes');

const app = express();

app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

app.get('/health', (req, res) => {
  res.json({
    servicio: 'billing-service',
    estado: 'OK',
    mensaje: 'Microservicio de facturación funcionando correctamente'
  });
});

app.use('/api/billing/facturas', facturasRoutes);

app.use((req, res) => {
  res.status(404).json({
    mensaje: 'Ruta no encontrada'
  });
});

module.exports = app;
