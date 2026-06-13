const pool = require('../config/db');

const obtenerDevolucionesBajas = async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT
        db.id,
        db.producto_id,
        p.nombre AS producto,
        db.almacen_id,
        a.nombre AS almacen,
        s.nombre AS sucursal,
        db.usuario_id,
        u.nombre AS usuario,
        db.venta_id,
        v.codigo AS codigo_venta,
        db.detalle_venta_id,
        db.tipo_registro,
        db.cantidad,
        db.motivo,
        db.fecha
      FROM devoluciones_bajas db
      INNER JOIN productos p ON db.producto_id = p.id
      INNER JOIN almacenes a ON db.almacen_id = a.id
      INNER JOIN sucursales s ON a.sucursal_id = s.id
      INNER JOIN usuarios u ON db.usuario_id = u.id
      LEFT JOIN ventas v ON db.venta_id = v.id
      WHERE db.estado = 1
      ORDER BY db.fecha DESC
    `);

    res.json(rows);
  } catch (error) {
    res.status(500).json({
      mensaje: 'Error al obtener devoluciones y bajas',
      error: error.message
    });
  }
};

const registrarDevolucionBaja = async (req, res) => {
  const connection = await pool.getConnection();

  try {
    const {
      producto_id,
      almacen_id,
      usuario_id,
      venta_id,
      detalle_venta_id,
      tipo_registro,
      cantidad,
      motivo
    } = req.body;

    const cantidadNum = Number(cantidad);

    const tiposPermitidos = [
      'DEVOLUCION_CLIENTE',
      'BAJA_VENCIMIENTO',
      'BAJA_PERDIDA',
      'BAJA_ROBO'
    ];

    if (!producto_id || !almacen_id || !usuario_id || !tipo_registro || !cantidadNum || cantidadNum <= 0 || !motivo) {
      return res.status(400).json({
        mensaje: 'producto_id, almacen_id, usuario_id, tipo_registro, cantidad mayor a 0 y motivo son obligatorios'
      });
    }

    if (!tiposPermitidos.includes(tipo_registro)) {
      return res.status(400).json({
        mensaje: 'tipo_registro no válido',
        tipos_permitidos: tiposPermitidos
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
      if (tipo_registro !== 'DEVOLUCION_CLIENTE') {
        await connection.rollback();
        return res.status(404).json({
          mensaje: 'No existe inventario para registrar una baja'
        });
      }

      const [insertInv] = await connection.query(`
        INSERT INTO inventario (producto_id, almacen_id, cantidad)
        VALUES (?, ?, 0)
      `, [producto_id, almacen_id]);

      inventarioId = insertInv.insertId;
    } else {
      inventarioId = inventarioRows[0].id;
      stockAnterior = Number(inventarioRows[0].cantidad);
    }

    let stockNuevo = stockAnterior;

    if (tipo_registro === 'DEVOLUCION_CLIENTE') {
      stockNuevo = stockAnterior + cantidadNum;
    } else {
      if (stockAnterior < cantidadNum) {
        await connection.rollback();
        return res.status(400).json({
          mensaje: 'Stock insuficiente para registrar la baja',
          stock_actual: stockAnterior,
          cantidad_solicitada: cantidadNum
        });
      }

      stockNuevo = stockAnterior - cantidadNum;
    }

    const [registro] = await connection.query(`
      INSERT INTO devoluciones_bajas (
        producto_id,
        almacen_id,
        usuario_id,
        venta_id,
        detalle_venta_id,
        tipo_registro,
        cantidad,
        motivo
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      producto_id,
      almacen_id,
      usuario_id,
      venta_id || null,
      detalle_venta_id || null,
      tipo_registro,
      cantidadNum,
      motivo
    ]);

    const devolucionBajaId = registro.insertId;

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
      VALUES (?, ?, 'DEVOLUCION_BAJA', ?, ?, ?, ?, ?)
    `, [
      inventarioId,
      tipo_registro,
      devolucionBajaId,
      cantidadNum,
      stockAnterior,
      stockNuevo,
      motivo
    ]);

    await connection.commit();

    res.status(201).json({
      mensaje: 'Registro creado correctamente',
      devolucion_baja_id: devolucionBajaId,
      tipo_registro,
      stock_anterior: stockAnterior,
      stock_nuevo: stockNuevo
    });
  } catch (error) {
    await connection.rollback();

    res.status(500).json({
      mensaje: 'Error al registrar devolución o baja',
      error: error.message
    });
  } finally {
    connection.release();
  }
};

module.exports = {
  obtenerDevolucionesBajas,
  registrarDevolucionBaja
};
