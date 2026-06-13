const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../config/db');

const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        mensaje: 'email y password son obligatorios'
      });
    }

    const [rows] = await pool.query(`
      SELECT
        u.id,
        u.rol_id,
        r.nombre AS rol,
        u.nombre,
        u.email,
        u.password_hash,
        u.telefono
      FROM usuarios u
      INNER JOIN roles r ON u.rol_id = r.id
      WHERE u.email = ? AND u.estado = 1
    `, [email]);

    if (rows.length === 0) {
      return res.status(401).json({
        mensaje: 'Credenciales incorrectas'
      });
    }

    const usuario = rows[0];
    const passwordValido = await bcrypt.compare(password, usuario.password_hash);

    if (!passwordValido) {
      return res.status(401).json({
        mensaje: 'Credenciales incorrectas'
      });
    }

    const token = jwt.sign(
      {
        id: usuario.id,
        rol_id: usuario.rol_id,
        rol: usuario.rol,
        email: usuario.email
      },
      process.env.JWT_SECRET || 'omnicommerce_secret_dev',
      {
        expiresIn: process.env.JWT_EXPIRES_IN || '8h'
      }
    );

    res.json({
      mensaje: 'Login correcto',
      token,
      usuario: {
        id: usuario.id,
        rol_id: usuario.rol_id,
        rol: usuario.rol,
        nombre: usuario.nombre,
        email: usuario.email,
        telefono: usuario.telefono
      }
    });
  } catch (error) {
    res.status(500).json({
      mensaje: 'Error al iniciar sesión',
      error: error.message
    });
  }
};

module.exports = {
  login
};
