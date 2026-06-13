const pool = require('../config/db');

const obtenerCategorias = async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT id, nombre, descripcion, estado, creado_en, actualizado_en
      FROM categorias
      WHERE estado = 1
      ORDER BY id DESC
    `);

    res.json(rows);
  } catch (error) {
    res.status(500).json({
      mensaje: 'Error al obtener categorías',
      error: error.message
    });
  }
};

const obtenerCategoriaPorId = async (req, res) => {
  try {
    const { id } = req.params;

    const [rows] = await pool.query(`
      SELECT id, nombre, descripcion, estado, creado_en, actualizado_en
      FROM categorias
      WHERE id = ? AND estado = 1
    `, [id]);

    if (rows.length === 0) {
      return res.status(404).json({ mensaje: 'Categoría no encontrada' });
    }

    res.json(rows[0]);
  } catch (error) {
    res.status(500).json({
      mensaje: 'Error al obtener categoría',
      error: error.message
    });
  }
};

const crearCategoria = async (req, res) => {
  try {
    const { nombre, descripcion } = req.body;

    if (!nombre) {
      return res.status(400).json({
        mensaje: 'El nombre de la categoría es obligatorio'
      });
    }

    const [result] = await pool.query(`
      INSERT INTO categorias (nombre, descripcion)
      VALUES (?, ?)
    `, [nombre, descripcion || null]);

    res.status(201).json({
      mensaje: 'Categoría creada correctamente',
      id: result.insertId
    });
  } catch (error) {
    res.status(500).json({
      mensaje: 'Error al crear categoría',
      error: error.message
    });
  }
};

const actualizarCategoria = async (req, res) => {
  try {
    const { id } = req.params;
    const { nombre, descripcion } = req.body;

    if (!nombre) {
      return res.status(400).json({
        mensaje: 'El nombre de la categoría es obligatorio'
      });
    }

    const [result] = await pool.query(`
      UPDATE categorias
      SET nombre = ?, descripcion = ?
      WHERE id = ? AND estado = 1
    `, [nombre, descripcion || null, id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ mensaje: 'Categoría no encontrada' });
    }

    res.json({ mensaje: 'Categoría actualizada correctamente' });
  } catch (error) {
    res.status(500).json({
      mensaje: 'Error al actualizar categoría',
      error: error.message
    });
  }
};

const eliminarCategoria = async (req, res) => {
  try {
    const { id } = req.params;

    const [result] = await pool.query(`
      UPDATE categorias
      SET estado = 0
      WHERE id = ?
    `, [id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ mensaje: 'Categoría no encontrada' });
    }

    res.json({ mensaje: 'Categoría eliminada correctamente' });
  } catch (error) {
    res.status(500).json({
      mensaje: 'Error al eliminar categoría',
      error: error.message
    });
  }
};

module.exports = {
  obtenerCategorias,
  obtenerCategoriaPorId,
  crearCategoria,
  actualizarCategoria,
  eliminarCategoria
};
