const express = require('express');
const cors = require('cors');
const morgan = require('morgan');

const sucursalesRoutes = require('./routes/sucursales.routes');
const almacenesRoutes = require('./routes/almacenes.routes');
const inventarioRoutes = require('./routes/inventario.routes');

const app = express();

app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

app.get('/health', (req, res) => {
  res.json({
    servicio: 'inventory-service',
    estado: 'OK',
    mensaje: 'Microservicio de inventario funcionando correctamente'
  });
});

app.use('/api/inventory/sucursales', sucursalesRoutes);
app.use('/api/inventory/almacenes', almacenesRoutes);
app.use('/api/inventory/stock', inventarioRoutes);

app.use((req, res) => {
  res.status(404).json({
    mensaje: 'Ruta no encontrada'
  });
});

module.exports = app;
