const pool = require('../config/db');

const obtenerRoles = async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT id, nombre, descripcion, estado, creado_en, actualizado_en
      FROM roles
      WHERE estado = 1
      ORDER BY id ASC
    `);

    res.json(rows);
  } catch (error) {
    res.status(500).json({
      mensaje: 'Error al obtener roles',
      error: error.message
    });
  }
};

const crearRol = async (req, res) => {
  try {
    const { nombre, descripcion } = req.body;

    if (!nombre) {
      return res.status(400).json({
        mensaje: 'El nombre del rol es obligatorio'
      });
    }

    const [result] = await pool.query(`
      INSERT INTO roles (nombre, descripcion)
      VALUES (?, ?)
    `, [nombre, descripcion || null]);

    res.status(201).json({
      mensaje: 'Rol creado correctamente',
      id: result.insertId
    });
  } catch (error) {
    res.status(500).json({
      mensaje: 'Error al crear rol',
      error: error.message
    });
  }
};

module.exports = {
  obtenerRoles,
  crearRol
};
