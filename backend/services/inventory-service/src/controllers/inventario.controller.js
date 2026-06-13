const pool = require('../config/db');

const obtenerInventario = async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT 
        i.id,
        i.producto_id,
        p.sku,
        p.nombre AS producto,
        c.nombre AS categoria,
        i.almacen_id,
        a.nombre AS almacen,
        s.id AS sucursal_id,
        s.nombre AS sucursal,
        i.cantidad,
        p.stock_minimo,
        CASE 
          WHEN i.cantidad <= p.stock_minimo THEN 'BAJO'
          ELSE 'NORMAL'
        END AS estado_stock,
        i.ultima_actualizacion
      FROM inventario i
      INNER JOIN productos p ON i.producto_id = p.id
      INNER JOIN categorias c ON p.categoria_id = c.id
      INNER JOIN almacenes a ON i.almacen_id = a.id
      INNER JOIN sucursales s ON a.sucursal_id = s.id
      WHERE i.estado = 1
      ORDER BY s.nombre, a.nombre, p.nombre
    `);

    res.json(rows);
  } catch (error) {
    res.status(500).json({
      mensaje: 'Error al obtener inventario',
      error: error.message
    });
  }
};

const obtenerInventarioPorId = async (req, res) => {
  try {
    const { id } = req.params;

    const [rows] = await pool.query(`
      SELECT 
        i.id,
        i.producto_id,
        p.sku,
        p.nombre AS producto,
        c.nombre AS categoria,
        i.almacen_id,
        a.nombre AS almacen,
        s.id AS sucursal_id,
        s.nombre AS sucursal,
        i.cantidad,
        p.stock_minimo,
        CASE 
          WHEN i.cantidad <= p.stock_minimo THEN 'BAJO'
          ELSE 'NORMAL'
        END AS estado_stock,
        i.ultima_actualizacion
      FROM inventario i
      INNER JOIN productos p ON i.producto_id = p.id
      INNER JOIN categorias c ON p.categoria_id = c.id
      INNER JOIN almacenes a ON i.almacen_id = a.id
      INNER JOIN sucursales s ON a.sucursal_id = s.id
      WHERE i.id = ? AND i.estado = 1
    `, [id]);

    if (rows.length === 0) {
      return res.status(404).json({ mensaje: 'Registro de inventario no encontrado' });
    }

    res.json(rows[0]);
  } catch (error) {
    res.status(500).json({
      mensaje: 'Error al obtener inventario',
      error: error.message
    });
  }
};

const obtenerMovimientos = async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT 
        m.id,
        m.inventario_id,
        p.nombre AS producto,
        a.nombre AS almacen,
        s.nombre AS sucursal,
        m.tipo_movimiento,
        m.referencia_tipo,
        m.referencia_id,
        m.cantidad,
        m.stock_anterior,
        m.stock_nuevo,
        m.observacion,
        m.fecha
      FROM movimientos_inventario m
      INNER JOIN inventario i ON m.inventario_id = i.id
      INNER JOIN productos p ON i.producto_id = p.id
      INNER JOIN almacenes a ON i.almacen_id = a.id
      INNER JOIN sucursales s ON a.sucursal_id = s.id
      WHERE m.estado = 1
      ORDER BY m.fecha DESC
      LIMIT 100
    `);

    res.json(rows);
  } catch (error) {
    res.status(500).json({
      mensaje: 'Error al obtener movimientos de inventario',
      error: error.message
    });
  }
};

const ajusteEntrada = async (req, res) => {
  const connection = await pool.getConnection();

  try {
    const { producto_id, almacen_id, cantidad, observacion } = req.body;

    if (!producto_id || !almacen_id || !cantidad || Number(cantidad) <= 0) {
      return res.status(400).json({
        mensaje: 'producto_id, almacen_id y cantidad mayor a 0 son obligatorios'
      });
    }

    await connection.beginTransaction();

    let [inventarioRows] = await connection.query(`
      SELECT id, cantidad
      FROM inventario
      WHERE producto_id = ? AND almacen_id = ? AND estado = 1
      FOR UPDATE
    `, [producto_id, almacen_id]);

    let inventarioId;
    let stockAnterior = 0;

    if (inventarioRows.length === 0) {
      const [insertInv] = await connection.query(`
        INSERT INTO inventario (producto_id, almacen_id, cantidad)
        VALUES (?, ?, 0)
      `, [producto_id, almacen_id]);

      inventarioId = insertInv.insertId;
    } else {
      inventarioId = inventarioRows[0].id;
      stockAnterior = Number(inventarioRows[0].cantidad);
    }

    const stockNuevo = stockAnterior + Number(cantidad);

    await connection.query(`
      UPDATE inventario
      SET cantidad = ?
      WHERE id = ?
    `, [stockNuevo, inventarioId]);

    await connection.query(`
      INSERT INTO movimientos_inventario (
        inventario_id,
        tipo_movimiento,
        referencia_tipo,
        referencia_id,
        cantidad,
        stock_anterior,
        stock_nuevo,
        observacion
      )
      VALUES (?, 'AJUSTE_ENTRADA', 'AJUSTE', NULL, ?, ?, ?, ?)
    `, [inventarioId, cantidad, stockAnterior, stockNuevo, observacion || 'Ajuste de entrada']);

    await connection.commit();

    res.status(201).json({
      mensaje: 'Ajuste de entrada registrado correctamente',
      inventario_id: inventarioId,
      stock_anterior: stockAnterior,
      stock_nuevo: stockNuevo
    });
  } catch (error) {
    await connection.rollback();

    res.status(500).json({
      mensaje: 'Error al registrar ajuste de entrada',
      error: error.message
    });
  } finally {
    connection.release();
  }
};

const ajusteSalida = async (req, res) => {
  const connection = await pool.getConnection();

  try {
    const { producto_id, almacen_id, cantidad, observacion } = req.body;

    if (!producto_id || !almacen_id || !cantidad || Number(cantidad) <= 0) {
      return res.status(400).json({
        mensaje: 'producto_id, almacen_id y cantidad mayor a 0 son obligatorios'
      });
    }

    await connection.beginTransaction();

    const [inventarioRows] = await connection.query(`
      SELECT id, cantidad
      FROM inventario
      WHERE producto_id = ? AND almacen_id = ? AND estado = 1
      FOR UPDATE
    `, [producto_id, almacen_id]);

    if (inventarioRows.length === 0) {
      await connection.rollback();
      return res.status(404).json({
        mensaje: 'No existe inventario para ese producto y almacén'
      });
    }

    const inventarioId = inventarioRows[0].id;
    const stockAnterior = Number(inventarioRows[0].cantidad);
    const cantidadSalida = Number(cantidad);

    if (stockAnterior < cantidadSalida) {
      await connection.rollback();
      return res.status(400).json({
        mensaje: 'Stock insuficiente',
        stock_actual: stockAnterior,
        cantidad_solicitada: cantidadSalida
      });
    }

    const stockNuevo = stockAnterior - cantidadSalida;

    await connection.query(`
      UPDATE inventario
      SET cantidad = ?
      WHERE id = ?
    `, [stockNuevo, inventarioId]);

    await connection.query(`
      INSERT INTO movimientos_inventario (
        inventario_id,
        tipo_movimiento,
        referencia_tipo,
        referencia_id,
        cantidad,
        stock_anterior,
        stock_nuevo,
        observacion
      )
      VALUES (?, 'AJUSTE_SALIDA', 'AJUSTE', NULL, ?, ?, ?, ?)
    `, [inventarioId, cantidadSalida, stockAnterior, stockNuevo, observacion || 'Ajuste de salida']);

    await connection.commit();

    res.status(201).json({
      mensaje: 'Ajuste de salida registrado correctamente',
      inventario_id: inventarioId,
      stock_anterior: stockAnterior,
      stock_nuevo: stockNuevo
    });
  } catch (error) {
    await connection.rollback();

    res.status(500).json({
      mensaje: 'Error al registrar ajuste de salida',
      error: error.message
    });
  } finally {
    connection.release();
  }
};

module.exports = {
  obtenerInventario,
  obtenerInventarioPorId,
  obtenerMovimientos,
  ajusteEntrada,
  ajusteSalida
};
