const pool = require('../config/db');

const generarCodigoTransformacion = () => {
  const fecha = new Date();
  const yyyy = fecha.getFullYear();
  const mm = String(fecha.getMonth() + 1).padStart(2, '0');
  const dd = String(fecha.getDate()).padStart(2, '0');
  const hh = String(fecha.getHours()).padStart(2, '0');
  const mi = String(fecha.getMinutes()).padStart(2, '0');
  const ss = String(fecha.getSeconds()).padStart(2, '0');
  const rand = Math.floor(Math.random() * 900 + 100);
  return `TRF-${yyyy}${mm}${dd}-${hh}${mi}${ss}-${rand}`;
};

const obtenerTransformaciones = async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT
        t.id,
        t.codigo,
        t.usuario_id,
        u.nombre AS usuario,
        t.sucursal_id,
        s.nombre AS sucursal,
        t.observacion,
        t.estado_transformacion,
        t.fecha
      FROM transformaciones t
      INNER JOIN usuarios u ON t.usuario_id = u.id
      INNER JOIN sucursales s ON t.sucursal_id = s.id
      WHERE t.estado = 1
      ORDER BY t.fecha DESC
    `);

    res.json(rows);
  } catch (error) {
    res.status(500).json({
      mensaje: 'Error al obtener transformaciones',
      error: error.message
    });
  }
};

const obtenerTransformacionPorId = async (req, res) => {
  try {
    const { id } = req.params;

    const [transformacionRows] = await pool.query(`
      SELECT
        t.id,
        t.codigo,
        t.usuario_id,
        u.nombre AS usuario,
        t.sucursal_id,
        s.nombre AS sucursal,
        t.observacion,
        t.estado_transformacion,
        t.fecha
      FROM transformaciones t
      INNER JOIN usuarios u ON t.usuario_id = u.id
      INNER JOIN sucursales s ON t.sucursal_id = s.id
      WHERE t.id = ? AND t.estado = 1
    `, [id]);

    if (transformacionRows.length === 0) {
      return res.status(404).json({
        mensaje: 'Transformación no encontrada'
      });
    }

    const [insumos] = await pool.query(`
      SELECT
        ti.id,
        ti.producto_id,
        p.nombre AS producto,
        ti.almacen_id,
        a.nombre AS almacen,
        ti.cantidad,
        ti.costo_unitario
      FROM transformacion_insumos ti
      INNER JOIN productos p ON ti.producto_id = p.id
      INNER JOIN almacenes a ON ti.almacen_id = a.id
      WHERE ti.transformacion_id = ? AND ti.estado = 1
    `, [id]);

    const [resultados] = await pool.query(`
      SELECT
        tr.id,
        tr.producto_id,
        p.nombre AS producto,
        tr.almacen_id,
        a.nombre AS almacen,
        tr.cantidad,
        tr.costo_estimado
      FROM transformacion_resultados tr
      INNER JOIN productos p ON tr.producto_id = p.id
      INNER JOIN almacenes a ON tr.almacen_id = a.id
      WHERE tr.transformacion_id = ? AND tr.estado = 1
    `, [id]);

    res.json({
      ...transformacionRows[0],
      insumos,
      resultados
    });
  } catch (error) {
    res.status(500).json({
      mensaje: 'Error al obtener transformación',
      error: error.message
    });
  }
};

const crearTransformacion = async (req, res) => {
  const connection = await pool.getConnection();

  try {
    const {
      codigo,
      usuario_id,
      sucursal_id,
      observacion,
      insumos,
      resultados
    } = req.body;

    if (!usuario_id || !sucursal_id) {
      return res.status(400).json({
        mensaje: 'usuario_id y sucursal_id son obligatorios'
      });
    }

    if (!Array.isArray(insumos) || insumos.length === 0) {
      return res.status(400).json({
        mensaje: 'Debe enviar al menos un insumo'
      });
    }

    if (!Array.isArray(resultados) || resultados.length === 0) {
      return res.status(400).json({
        mensaje: 'Debe enviar al menos un producto resultante'
      });
    }

    await connection.beginTransaction();

    const codigoFinal = codigo || generarCodigoTransformacion();

    const [transformacionResult] = await connection.query(`
      INSERT INTO transformaciones (
        codigo,
        usuario_id,
        sucursal_id,
        observacion,
        estado_transformacion
      )
      VALUES (?, ?, ?, ?, 'PROCESADA')
    `, [
      codigoFinal,
      usuario_id,
      sucursal_id,
      observacion || null
    ]);

    const transformacionId = transformacionResult.insertId;

    for (const item of insumos) {
      const productoId = item.producto_id;
      const almacenId = item.almacen_id;
      const cantidad = Number(item.cantidad);
      const costoUnitario = Number(item.costo_unitario || 0);

      if (!productoId || !almacenId || !cantidad || cantidad <= 0) {
        await connection.rollback();
        return res.status(400).json({
          mensaje: 'Cada insumo debe tener producto_id, almacen_id y cantidad mayor a 0'
        });
      }

      const [inventarioRows] = await connection.query(`
        SELECT id, cantidad
        FROM inventario
        WHERE producto_id = ? AND almacen_id = ? AND estado = 1
        FOR UPDATE
      `, [productoId, almacenId]);

      if (inventarioRows.length === 0) {
        await connection.rollback();
        return res.status(404).json({
          mensaje: `No existe inventario para el insumo producto_id ${productoId}`
        });
      }

      const inventarioId = inventarioRows[0].id;
      const stockAnterior = Number(inventarioRows[0].cantidad);

      if (stockAnterior < cantidad) {
        await connection.rollback();
        return res.status(400).json({
          mensaje: `Stock insuficiente para insumo producto_id ${productoId}`,
          stock_actual: stockAnterior,
          cantidad_solicitada: cantidad
        });
      }

      const stockNuevo = stockAnterior - cantidad;

      await connection.query(`
        INSERT INTO transformacion_insumos (
          transformacion_id,
          producto_id,
          almacen_id,
          cantidad,
          costo_unitario
        )
        VALUES (?, ?, ?, ?, ?)
      `, [
        transformacionId,
        productoId,
        almacenId,
        cantidad,
        costoUnitario
      ]);

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
        VALUES (?, 'TRANSFORMACION_SALIDA', 'TRANSFORMACION', ?, ?, ?, ?, ?)
      `, [
        inventarioId,
        transformacionId,
        cantidad,
        stockAnterior,
        stockNuevo,
        `Salida por transformación ${codigoFinal}`
      ]);
    }

    for (const item of resultados) {
      const productoId = item.producto_id;
      const almacenId = item.almacen_id;
      const cantidad = Number(item.cantidad);
      const costoEstimado = Number(item.costo_estimado || 0);

      if (!productoId || !almacenId || !cantidad || cantidad <= 0) {
        await connection.rollback();
        return res.status(400).json({
          mensaje: 'Cada resultado debe tener producto_id, almacen_id y cantidad mayor a 0'
        });
      }

      let [inventarioRows] = await connection.query(`
        SELECT id, cantidad
        FROM inventario
        WHERE producto_id = ? AND almacen_id = ? AND estado = 1
        FOR UPDATE
      `, [productoId, almacenId]);

      let inventarioId;
      let stockAnterior = 0;

      if (inventarioRows.length === 0) {
        const [insertInv] = await connection.query(`
          INSERT INTO inventario (producto_id, almacen_id, cantidad)
          VALUES (?, ?, 0)
        `, [productoId, almacenId]);

        inventarioId = insertInv.insertId;
      } else {
        inventarioId = inventarioRows[0].id;
        stockAnterior = Number(inventarioRows[0].cantidad);
      }

      const stockNuevo = stockAnterior + cantidad;

      await connection.query(`
        INSERT INTO transformacion_resultados (
          transformacion_id,
          producto_id,
          almacen_id,
          cantidad,
          costo_estimado
        )
        VALUES (?, ?, ?, ?, ?)
      `, [
        transformacionId,
        productoId,
        almacenId,
        cantidad,
        costoEstimado
      ]);

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
        VALUES (?, 'TRANSFORMACION_ENTRADA', 'TRANSFORMACION', ?, ?, ?, ?, ?)
      `, [
        inventarioId,
        transformacionId,
        cantidad,
        stockAnterior,
        stockNuevo,
        `Entrada por transformación ${codigoFinal}`
      ]);
    }

    await connection.commit();

    res.status(201).json({
      mensaje: 'Transformación registrada correctamente',
      transformacion_id: transformacionId,
      codigo: codigoFinal
    });
  } catch (error) {
    await connection.rollback();

    res.status(500).json({
      mensaje: 'Error al crear transformación',
      error: error.message
    });
  } finally {
    connection.release();
  }
};

module.exports = {
  obtenerTransformaciones,
  obtenerTransformacionPorId,
  crearTransformacion
};
