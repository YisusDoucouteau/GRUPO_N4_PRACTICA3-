const pool = require('../config/db');

const obtenerSucursales = async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT id, nombre, direccion, telefono, estado, creado_en, actualizado_en
      FROM sucursales
      WHERE estado = 1
      ORDER BY id DESC
    `);

    res.json(rows);
  } catch (error) {
    res.status(500).json({
      mensaje: 'Error al obtener sucursales',
      error: error.message
    });
  }
};

const obtenerSucursalPorId = async (req, res) => {
  try {
    const { id } = req.params;

    const [rows] = await pool.query(`
      SELECT id, nombre, direccion, telefono, estado, creado_en, actualizado_en
      FROM sucursales
      WHERE id = ? AND estado = 1
    `, [id]);

    if (rows.length === 0) {
      return res.status(404).json({ mensaje: 'Sucursal no encontrada' });
    }

    res.json(rows[0]);
  } catch (error) {
    res.status(500).json({
      mensaje: 'Error al obtener sucursal',
      error: error.message
    });
  }
};

const crearSucursal = async (req, res) => {
  try {
    const { nombre, direccion, telefono } = req.body;

    if (!nombre) {
      return res.status(400).json({
        mensaje: 'El nombre de la sucursal es obligatorio'
      });
    }

    const [result] = await pool.query(`
      INSERT INTO sucursales (nombre, direccion, telefono)
      VALUES (?, ?, ?)
    `, [nombre, direccion || null, telefono || null]);

    res.status(201).json({
      mensaje: 'Sucursal creada correctamente',
      id: result.insertId
    });
  } catch (error) {
    res.status(500).json({
      mensaje: 'Error al crear sucursal',
      error: error.message
    });
  }
};

const actualizarSucursal = async (req, res) => {
  try {
    const { id } = req.params;
    const { nombre, direccion, telefono } = req.body;

    if (!nombre) {
      return res.status(400).json({
        mensaje: 'El nombre de la sucursal es obligatorio'
      });
    }

    const [result] = await pool.query(`
      UPDATE sucursales
      SET nombre = ?, direccion = ?, telefono = ?
      WHERE id = ? AND estado = 1
    `, [nombre, direccion || null, telefono || null, id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ mensaje: 'Sucursal no encontrada' });
    }

    res.json({ mensaje: 'Sucursal actualizada correctamente' });
  } catch (error) {
    res.status(500).json({
      mensaje: 'Error al actualizar sucursal',
      error: error.message
    });
  }
};

const eliminarSucursal = async (req, res) => {
  try {
    const { id } = req.params;

    const [result] = await pool.query(`
      UPDATE sucursales
      SET estado = 0
      WHERE id = ?
    `, [id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ mensaje: 'Sucursal no encontrada' });
    }

    res.json({ mensaje: 'Sucursal eliminada correctamente' });
  } catch (error) {
    res.status(500).json({
      mensaje: 'Error al eliminar sucursal',
      error: error.message
    });
  }
};

module.exports = {
  obtenerSucursales,
  obtenerSucursalPorId,
  crearSucursal,
  actualizarSucursal,
  eliminarSucursal
};
