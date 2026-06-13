const pool = require('../config/db');

const obtenerClientes = async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT id, nombre, nit_ci, direccion, telefono, correo, estado, creado_en, actualizado_en
      FROM clientes
      WHERE estado = 1
      ORDER BY id DESC
    `);

    res.json(rows);
  } catch (error) {
    res.status(500).json({
      mensaje: 'Error al obtener clientes',
      error: error.message
    });
  }
};

const obtenerClientePorId = async (req, res) => {
  try {
    const { id } = req.params;

    const [rows] = await pool.query(`
      SELECT id, nombre, nit_ci, direccion, telefono, correo, estado, creado_en, actualizado_en
      FROM clientes
      WHERE id = ? AND estado = 1
    `, [id]);

    if (rows.length === 0) {
      return res.status(404).json({ mensaje: 'Cliente no encontrado' });
    }

    res.json(rows[0]);
  } catch (error) {
    res.status(500).json({
      mensaje: 'Error al obtener cliente',
      error: error.message
    });
  }
};

const crearCliente = async (req, res) => {
  try {
    const { nombre, nit_ci, direccion, telefono, correo } = req.body;

    if (!nombre) {
      return res.status(400).json({
        mensaje: 'El nombre del cliente es obligatorio'
      });
    }

    const [result] = await pool.query(`
      INSERT INTO clientes (nombre, nit_ci, direccion, telefono, correo)
      VALUES (?, ?, ?, ?, ?)
    `, [
      nombre,
      nit_ci || null,
      direccion || null,
      telefono || null,
      correo || null
    ]);

    res.status(201).json({
      mensaje: 'Cliente creado correctamente',
      id: result.insertId
    });
  } catch (error) {
    res.status(500).json({
      mensaje: 'Error al crear cliente',
      error: error.message
    });
  }
};

const actualizarCliente = async (req, res) => {
  try {
    const { id } = req.params;
    const { nombre, nit_ci, direccion, telefono, correo } = req.body;

    if (!nombre) {
      return res.status(400).json({
        mensaje: 'El nombre del cliente es obligatorio'
      });
    }

    const [result] = await pool.query(`
      UPDATE clientes
      SET nombre = ?, nit_ci = ?, direccion = ?, telefono = ?, correo = ?
      WHERE id = ? AND estado = 1
    `, [
      nombre,
      nit_ci || null,
      direccion || null,
      telefono || null,
      correo || null,
      id
    ]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ mensaje: 'Cliente no encontrado' });
    }

    res.json({ mensaje: 'Cliente actualizado correctamente' });
  } catch (error) {
    res.status(500).json({
      mensaje: 'Error al actualizar cliente',
      error: error.message
    });
  }
};

const eliminarCliente = async (req, res) => {
  try {
    const { id } = req.params;

    const [result] = await pool.query(`
      UPDATE clientes
      SET estado = 0
      WHERE id = ?
    `, [id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ mensaje: 'Cliente no encontrado' });
    }

    res.json({ mensaje: 'Cliente eliminado correctamente' });
  } catch (error) {
    res.status(500).json({
      mensaje: 'Error al eliminar cliente',
      error: error.message
    });
  }
};

module.exports = {
  obtenerClientes,
  obtenerClientePorId,
  crearCliente,
  actualizarCliente,
  eliminarCliente
};
