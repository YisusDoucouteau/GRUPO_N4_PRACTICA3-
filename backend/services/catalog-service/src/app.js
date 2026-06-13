const express = require('express');
const cors = require('cors');
const morgan = require('morgan');

const categoriasRoutes = require('./routes/categorias.routes');
const productosRoutes = require('./routes/productos.routes');

const app = express();

app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

app.get('/health', (req, res) => {
  res.json({
    servicio: 'catalog-service',
    estado: 'OK',
    mensaje: 'Microservicio de catálogo funcionando correctamente'
  });
});

app.use('/api/catalog/categorias', categoriasRoutes);
app.use('/api/catalog/productos', productosRoutes);

app.use((req, res) => {
  res.status(404).json({
    mensaje: 'Ruta no encontrada'
  });
});

module.exports = app;
