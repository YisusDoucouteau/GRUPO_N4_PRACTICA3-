const express = require('express');
const cors = require('cors');
const morgan = require('morgan');

const devolucionesBajasRoutes = require('./routes/devoluciones-bajas.routes');
const transformacionesRoutes = require('./routes/transformaciones.routes');

const app = express();

app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

app.get('/health', (req, res) => {
  res.json({
    servicio: 'operations-service',
    estado: 'OK',
    mensaje: 'Microservicio de operaciones funcionando correctamente'
  });
});

app.use('/api/operations/devoluciones-bajas', devolucionesBajasRoutes);
app.use('/api/operations/transformaciones', transformacionesRoutes);

app.use((req, res) => {
  res.status(404).json({
    mensaje: 'Ruta no encontrada'
  });
});

module.exports = app;
