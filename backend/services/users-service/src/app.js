const express = require('express');
const cors = require('cors');
const morgan = require('morgan');

const rolesRoutes = require('./routes/roles.routes');
const usuariosRoutes = require('./routes/usuarios.routes');
const authRoutes = require('./routes/auth.routes');

const app = express();

app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

app.get('/health', (req, res) => {
  res.json({
    servicio: 'users-service',
    estado: 'OK',
    mensaje: 'Microservicio de usuarios funcionando correctamente'
  });
});

app.use('/api/users/roles', rolesRoutes);
app.use('/api/users/usuarios', usuariosRoutes);
app.use('/api/users/auth', authRoutes);

app.use((req, res) => {
  res.status(404).json({
    mensaje: 'Ruta no encontrada'
  });
});

module.exports = app;
