const pool = require('../config/db');

const obtenerAlmacenes = async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT 
        a.id,
        a.sucursal_id,
        s.nombre AS sucursal,
        a.nombre,
        a.descripcion,
        a.estado,
        a.creado_en,
        a.actualizado_en
      FROM almacenes a
      INNER JOIN sucursales s ON a.sucursal_id = s.id
      WHERE a.estado = 1
      ORDER BY a.id DESC
    `);

    res.json(rows);
  } catch (error) {
    res.status(500).json({
      mensaje: 'Error al obtener almacenes',
      error: error.message
    });
  }
};

const obtenerAlmacenPorId = async (req, res) => {
  try {
    const { id } = req.params;

    const [rows] = await pool.query(`
      SELECT 
        a.id,
        a.sucursal_id,
        s.nombre AS sucursal,
        a.nombre,
        a.descripcion,
        a.estado,
        a.creado_en,
        a.actualizado_en
      FROM almacenes a
      INNER JOIN sucursales s ON a.sucursal_id = s.id
      WHERE a.id = ? AND a.estado = 1
    `, [id]);

    if (rows.length === 0) {
      return res.status(404).json({ mensaje: 'Almacén no encontrado' });
    }

    res.json(rows[0]);
  } catch (error) {
    res.status(500).json({
      mensaje: 'Error al obtener almacén',
      error: error.message
    });
  }
};

const crearAlmacen = async (req, res) => {
  try {
    const { sucursal_id, nombre, descripcion } = req.body;

    if (!sucursal_id || !nombre) {
      return res.status(400).json({
        mensaje: 'sucursal_id y nombre son obligatorios'
      });
    }

    const [result] = await pool.query(`
      INSERT INTO almacenes (sucursal_id, nombre, descripcion)
      VALUES (?, ?, ?)
    `, [sucursal_id, nombre, descripcion || null]);

    res.status(201).json({
      mensaje: 'Almacén creado correctamente',
      id: result.insertId
    });
  } catch (error) {
    res.status(500).json({
      mensaje: 'Error al crear almacén',
      error: error.message
    });
  }
};

const actualizarAlmacen = async (req, res) => {
  try {
    const { id } = req.params;
    const { sucursal_id, nombre, descripcion } = req.body;

    if (!sucursal_id || !nombre) {
      return res.status(400).json({
        mensaje: 'sucursal_id y nombre son obligatorios'
      });
    }

    const [result] = await pool.query(`
      UPDATE almacenes
      SET sucursal_id = ?, nombre = ?, descripcion = ?
      WHERE id = ? AND estado = 1
    `, [sucursal_id, nombre, descripcion || null, id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ mensaje: 'Almacén no encontrado' });
    }

    res.json({ mensaje: 'Almacén actualizado correctamente' });
  } catch (error) {
    res.status(500).json({
      mensaje: 'Error al actualizar almacén',
      error: error.message
    });
  }
};

const eliminarAlmacen = async (req, res) => {
  try {
    const { id } = req.params;

    const [result] = await pool.query(`
      UPDATE almacenes
      SET estado = 0
      WHERE id = ?
    `, [id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ mensaje: 'Almacén no encontrado' });
    }

    res.json({ mensaje: 'Almacén eliminado correctamente' });
  } catch (error) {
    res.status(500).json({
      mensaje: 'Error al eliminar almacén',
      error: error.message
    });
  }
};

module.exports = {
  obtenerAlmacenes,
  obtenerAlmacenPorId,
  crearAlmacen,
  actualizarAlmacen,
  eliminarAlmacen
};
