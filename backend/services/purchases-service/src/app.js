const express = require('express');
const cors = require('cors');
const morgan = require('morgan');

const proveedoresRoutes = require('./routes/proveedores.routes');
const comprasRoutes = require('./routes/compras.routes');

const app = express();

app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

app.get('/health', (req, res) => {
  res.json({
    servicio: 'purchases-service',
    estado: 'OK',
    mensaje: 'Microservicio de compras funcionando correctamente'
  });
});

app.use('/api/purchases/proveedores', proveedoresRoutes);
app.use('/api/purchases/compras', comprasRoutes);

app.use((req, res) => {
  res.status(404).json({
    mensaje: 'Ruta no encontrada'
  });
});

module.exports = app;
