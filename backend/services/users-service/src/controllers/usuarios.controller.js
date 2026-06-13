const bcrypt = require('bcryptjs');
const pool = require('../config/db');

const obtenerUsuarios = async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT
        u.id,
        u.rol_id,
        r.nombre AS rol,
        u.nombre,
        u.email,
        u.telefono,
        u.estado,
        u.creado_en,
        u.actualizado_en
      FROM usuarios u
      INNER JOIN roles r ON u.rol_id = r.id
      WHERE u.estado = 1
      ORDER BY u.id DESC
    `);

    res.json(rows);
  } catch (error) {
    res.status(500).json({
      mensaje: 'Error al obtener usuarios',
      error: error.message
    });
  }
};

const obtenerUsuarioPorId = async (req, res) => {
  try {
    const { id } = req.params;

    const [rows] = await pool.query(`
      SELECT
        u.id,
        u.rol_id,
        r.nombre AS rol,
        u.nombre,
        u.email,
        u.telefono,
        u.estado,
        u.creado_en,
        u.actualizado_en
      FROM usuarios u
      INNER JOIN roles r ON u.rol_id = r.id
      WHERE u.id = ? AND u.estado = 1
    `, [id]);

    if (rows.length === 0) {
      return res.status(404).json({
        mensaje: 'Usuario no encontrado'
      });
    }

    res.json(rows[0]);
  } catch (error) {
    res.status(500).json({
      mensaje: 'Error al obtener usuario',
      error: error.message
    });
  }
};

const crearUsuario = async (req, res) => {
  try {
    const { rol_id, nombre, email, password, telefono } = req.body;

    if (!rol_id || !nombre || !email || !password) {
      return res.status(400).json({
        mensaje: 'rol_id, nombre, email y password son obligatorios'
      });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const [result] = await pool.query(`
      INSERT INTO usuarios (rol_id, nombre, email, password_hash, telefono)
      VALUES (?, ?, ?, ?, ?)
    `, [
      rol_id,
      nombre,
      email,
      passwordHash,
      telefono || null
    ]);

    res.status(201).json({
      mensaje: 'Usuario creado correctamente',
      id: result.insertId
    });
  } catch (error) {
    res.status(500).json({
      mensaje: 'Error al crear usuario',
      error: error.message
    });
  }
};

const actualizarUsuario = async (req, res) => {
  try {
    const { id } = req.params;
    const { rol_id, nombre, email, password, telefono } = req.body;

    if (!rol_id || !nombre || !email) {
      return res.status(400).json({
        mensaje: 'rol_id, nombre y email son obligatorios'
      });
    }

    if (password) {
      const passwordHash = await bcrypt.hash(password, 10);

      const [result] = await pool.query(`
        UPDATE usuarios
        SET rol_id = ?, nombre = ?, email = ?, password_hash = ?, telefono = ?
        WHERE id = ? AND estado = 1
      `, [
        rol_id,
        nombre,
        email,
        passwordHash,
        telefono || null,
        id
      ]);

      if (result.affectedRows === 0) {
        return res.status(404).json({
          mensaje: 'Usuario no encontrado'
        });
      }
    } else {
      const [result] = await pool.query(`
        UPDATE usuarios
        SET rol_id = ?, nombre = ?, email = ?, telefono = ?
        WHERE id = ? AND estado = 1
      `, [
        rol_id,
        nombre,
        email,
        telefono || null,
        id
      ]);

      if (result.affectedRows === 0) {
        return res.status(404).json({
          mensaje: 'Usuario no encontrado'
        });
      }
    }

    res.json({
      mensaje: 'Usuario actualizado correctamente'
    });
  } catch (error) {
    res.status(500).json({
      mensaje: 'Error al actualizar usuario',
      error: error.message
    });
  }
};

const eliminarUsuario = async (req, res) => {
  try {
    const { id } = req.params;

    const [result] = await pool.query(`
      UPDATE usuarios
      SET estado = 0
      WHERE id = ?
    `, [id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({
        mensaje: 'Usuario no encontrado'
      });
    }

    res.json({
      mensaje: 'Usuario eliminado correctamente'
    });
  } catch (error) {
    res.status(500).json({
      mensaje: 'Error al eliminar usuario',
      error: error.message
    });
  }
};

module.exports = {
  obtenerUsuarios,
  obtenerUsuarioPorId,
  crearUsuario,
  actualizarUsuario,
  eliminarUsuario
};
