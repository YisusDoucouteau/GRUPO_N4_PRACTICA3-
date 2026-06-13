const express = require('express');
const cors = require('cors');
const morgan = require('morgan');

const clientesRoutes = require('./routes/clientes.routes');
const ventasRoutes = require('./routes/ventas.routes');

const app = express();

app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

app.get('/health', (req, res) => {
  res.json({
    servicio: 'sales-service',
    estado: 'OK',
    mensaje: 'Microservicio de ventas funcionando correctamente'
  });
});

app.use('/api/sales/clientes', clientesRoutes);
app.use('/api/sales/ventas', ventasRoutes);

app.use((req, res) => {
  res.status(404).json({
    mensaje: 'Ruta no encontrada'
  });
});

module.exports = app;
