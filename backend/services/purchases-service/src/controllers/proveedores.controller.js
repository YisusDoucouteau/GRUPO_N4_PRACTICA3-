const pool = require('../config/db');

const obtenerProveedores = async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT id, nombre, nit_rut, direccion, telefono, correo, estado, creado_en, actualizado_en
      FROM proveedores
      WHERE estado = 1
      ORDER BY id DESC
    `);

    res.json(rows);
  } catch (error) {
    res.status(500).json({
      mensaje: 'Error al obtener proveedores',
      error: error.message
    });
  }
};

const obtenerProveedorPorId = async (req, res) => {
  try {
    const { id } = req.params;

    const [rows] = await pool.query(`
      SELECT id, nombre, nit_rut, direccion, telefono, correo, estado, creado_en, actualizado_en
      FROM proveedores
      WHERE id = ? AND estado = 1
    `, [id]);

    if (rows.length === 0) {
      return res.status(404).json({ mensaje: 'Proveedor no encontrado' });
    }

    res.json(rows[0]);
  } catch (error) {
    res.status(500).json({
      mensaje: 'Error al obtener proveedor',
      error: error.message
    });
  }
};

const crearProveedor = async (req, res) => {
  try {
    const { nombre, nit_rut, direccion, telefono, correo } = req.body;

    if (!nombre) {
      return res.status(400).json({
        mensaje: 'El nombre del proveedor es obligatorio'
      });
    }

    const [result] = await pool.query(`
      INSERT INTO proveedores (nombre, nit_rut, direccion, telefono, correo)
      VALUES (?, ?, ?, ?, ?)
    `, [
      nombre,
      nit_rut || null,
      direccion || null,
      telefono || null,
      correo || null
    ]);

    res.status(201).json({
      mensaje: 'Proveedor creado correctamente',
      id: result.insertId
    });
  } catch (error) {
    res.status(500).json({
      mensaje: 'Error al crear proveedor',
      error: error.message
    });
  }
};

const actualizarProveedor = async (req, res) => {
  try {
    const { id } = req.params;
    const { nombre, nit_rut, direccion, telefono, correo } = req.body;

    if (!nombre) {
      return res.status(400).json({
        mensaje: 'El nombre del proveedor es obligatorio'
      });
    }

    const [result] = await pool.query(`
      UPDATE proveedores
      SET nombre = ?, nit_rut = ?, direccion = ?, telefono = ?, correo = ?
      WHERE id = ? AND estado = 1
    `, [
      nombre,
      nit_rut || null,
      direccion || null,
      telefono || null,
      correo || null,
      id
    ]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ mensaje: 'Proveedor no encontrado' });
    }

    res.json({ mensaje: 'Proveedor actualizado correctamente' });
  } catch (error) {
    res.status(500).json({
      mensaje: 'Error al actualizar proveedor',
      error: error.message
    });
  }
};

const eliminarProveedor = async (req, res) => {
  try {
    const { id } = req.params;

    const [result] = await pool.query(`
      UPDATE proveedores
      SET estado = 0
      WHERE id = ?
    `, [id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ mensaje: 'Proveedor no encontrado' });
    }

    res.json({ mensaje: 'Proveedor eliminado correctamente' });
  } catch (error) {
    res.status(500).json({
      mensaje: 'Error al eliminar proveedor',
      error: error.message
    });
  }
};

module.exports = {
  obtenerProveedores,
  obtenerProveedorPorId,
  crearProveedor,
  actualizarProveedor,
  eliminarProveedor
};
