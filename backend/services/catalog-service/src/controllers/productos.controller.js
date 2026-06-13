const pool = require('../config/db');

const obtenerProductos = async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT 
        p.id,
        p.categoria_id,
        c.nombre AS categoria,
        p.sku,
        p.nombre,
        p.descripcion,
        p.unidad_medida,
        p.precio_compra_referencia,
        p.precio_venta,
        p.stock_minimo,
        p.estado,
        p.creado_en,
        p.actualizado_en
      FROM productos p
      INNER JOIN categorias c ON p.categoria_id = c.id
      WHERE p.estado = 1
      ORDER BY p.id DESC
    `);

    res.json(rows);
  } catch (error) {
    res.status(500).json({
      mensaje: 'Error al obtener productos',
      error: error.message
    });
  }
};

const obtenerProductoPorId = async (req, res) => {
  try {
    const { id } = req.params;

    const [rows] = await pool.query(`
      SELECT 
        p.id,
        p.categoria_id,
        c.nombre AS categoria,
        p.sku,
        p.nombre,
        p.descripcion,
        p.unidad_medida,
        p.precio_compra_referencia,
        p.precio_venta,
        p.stock_minimo,
        p.estado,
        p.creado_en,
        p.actualizado_en
      FROM productos p
      INNER JOIN categorias c ON p.categoria_id = c.id
      WHERE p.id = ? AND p.estado = 1
    `, [id]);

    if (rows.length === 0) {
      return res.status(404).json({ mensaje: 'Producto no encontrado' });
    }

    res.json(rows[0]);
  } catch (error) {
    res.status(500).json({
      mensaje: 'Error al obtener producto',
      error: error.message
    });
  }
};

const crearProducto = async (req, res) => {
  try {
    const {
      categoria_id,
      sku,
      nombre,
      descripcion,
      unidad_medida,
      precio_compra_referencia,
      precio_venta,
      stock_minimo
    } = req.body;

    if (!categoria_id || !sku || !nombre || precio_venta === undefined) {
      return res.status(400).json({
        mensaje: 'categoria_id, sku, nombre y precio_venta son obligatorios'
      });
    }

    const [result] = await pool.query(`
      INSERT INTO productos (
        categoria_id,
        sku,
        nombre,
        descripcion,
        unidad_medida,
        precio_compra_referencia,
        precio_venta,
        stock_minimo
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      categoria_id,
      sku,
      nombre,
      descripcion || null,
      unidad_medida || 'UNIDAD',
      precio_compra_referencia || 0,
      precio_venta,
      stock_minimo || 0
    ]);

    res.status(201).json({
      mensaje: 'Producto creado correctamente',
      id: result.insertId
    });
  } catch (error) {
    res.status(500).json({
      mensaje: 'Error al crear producto',
      error: error.message
    });
  }
};

const actualizarProducto = async (req, res) => {
  try {
    const { id } = req.params;

    const {
      categoria_id,
      sku,
      nombre,
      descripcion,
      unidad_medida,
      precio_compra_referencia,
      precio_venta,
      stock_minimo
    } = req.body;

    if (!categoria_id || !sku || !nombre || precio_venta === undefined) {
      return res.status(400).json({
        mensaje: 'categoria_id, sku, nombre y precio_venta son obligatorios'
      });
    }

    const [result] = await pool.query(`
      UPDATE productos
      SET 
        categoria_id = ?,
        sku = ?,
        nombre = ?,
        descripcion = ?,
        unidad_medida = ?,
        precio_compra_referencia = ?,
        precio_venta = ?,
        stock_minimo = ?
      WHERE id = ? AND estado = 1
    `, [
      categoria_id,
      sku,
      nombre,
      descripcion || null,
      unidad_medida || 'UNIDAD',
      precio_compra_referencia || 0,
      precio_venta,
      stock_minimo || 0,
      id
    ]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ mensaje: 'Producto no encontrado' });
    }

    res.json({ mensaje: 'Producto actualizado correctamente' });
  } catch (error) {
    res.status(500).json({
      mensaje: 'Error al actualizar producto',
      error: error.message
    });
  }
};

const eliminarProducto = async (req, res) => {
  try {
    const { id } = req.params;

    const [result] = await pool.query(`
      UPDATE productos
      SET estado = 0
      WHERE id = ?
    `, [id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ mensaje: 'Producto no encontrado' });
    }

    res.json({ mensaje: 'Producto eliminado correctamente' });
  } catch (error) {
    res.status(500).json({
      mensaje: 'Error al eliminar producto',
      error: error.message
    });
  }
};

module.exports = {
  obtenerProductos,
  obtenerProductoPorId,
  crearProducto,
  actualizarProducto,
  eliminarProducto
};
