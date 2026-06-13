const pool = require('../config/db');

const generarCodigoVenta = () => {
  const fecha = new Date();
  const yyyy = fecha.getFullYear();
  const mm = String(fecha.getMonth() + 1).padStart(2, '0');
  const dd = String(fecha.getDate()).padStart(2, '0');
  const hh = String(fecha.getHours()).padStart(2, '0');
  const mi = String(fecha.getMinutes()).padStart(2, '0');
  const ss = String(fecha.getSeconds()).padStart(2, '0');
  const rand = Math.floor(Math.random() * 900 + 100);
  return `VTA-${yyyy}${mm}${dd}-${hh}${mi}${ss}-${rand}`;
};

const obtenerVentas = async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT 
        v.id,
        v.codigo,
        v.cliente_id,
        COALESCE(c.nombre, 'Sin cliente') AS cliente,
        v.usuario_id,
        u.nombre AS usuario,
        v.sucursal_id,
        s.nombre AS sucursal,
        v.subtotal,
        v.descuento,
        v.total,
        v.condicion_pago,
        v.estado_pago,
        v.estado_venta,
        v.observacion,
        v.fecha
      FROM ventas v
      LEFT JOIN clientes c ON v.cliente_id = c.id
      INNER JOIN usuarios u ON v.usuario_id = u.id
      INNER JOIN sucursales s ON v.sucursal_id = s.id
      WHERE v.estado = 1
      ORDER BY v.fecha DESC
    `);

    res.json(rows);
  } catch (error) {
    res.status(500).json({
      mensaje: 'Error al obtener ventas',
      error: error.message
    });
  }
};

const obtenerVentaPorId = async (req, res) => {
  try {
    const { id } = req.params;

    const [ventaRows] = await pool.query(`
      SELECT 
        v.id,
        v.codigo,
        v.cliente_id,
        COALESCE(c.nombre, 'Sin cliente') AS cliente,
        v.usuario_id,
        u.nombre AS usuario,
        v.sucursal_id,
        s.nombre AS sucursal,
        v.subtotal,
        v.descuento,
        v.total,
        v.condicion_pago,
        v.estado_pago,
        v.estado_venta,
        v.observacion,
        v.fecha
      FROM ventas v
      LEFT JOIN clientes c ON v.cliente_id = c.id
      INNER JOIN usuarios u ON v.usuario_id = u.id
      INNER JOIN sucursales s ON v.sucursal_id = s.id
      WHERE v.id = ? AND v.estado = 1
    `, [id]);

    if (ventaRows.length === 0) {
      return res.status(404).json({ mensaje: 'Venta no encontrada' });
    }

    const [detalles] = await pool.query(`
      SELECT
        dv.id,
        dv.producto_id,
        p.sku,
        p.nombre AS producto,
        dv.almacen_id,
        a.nombre AS almacen,
        dv.cantidad,
        dv.precio_unitario,
        dv.descuento,
        dv.subtotal
      FROM detalles_venta dv
      INNER JOIN productos p ON dv.producto_id = p.id
      INNER JOIN almacenes a ON dv.almacen_id = a.id
      WHERE dv.venta_id = ? AND dv.estado = 1
    `, [id]);

    res.json({
      ...ventaRows[0],
      detalles
    });
  } catch (error) {
    res.status(500).json({
      mensaje: 'Error al obtener venta',
      error: error.message
    });
  }
};

const crearVenta = async (req, res) => {
  const connection = await pool.getConnection();

  try {
    const {
      cliente_id,
      usuario_id,
      sucursal_id,
      condicion_pago,
      metodo_pago,
      monto_pagado,
      descuento,
      observacion,
      detalles
    } = req.body;

    if (!usuario_id || !sucursal_id) {
      return res.status(400).json({
        mensaje: 'usuario_id y sucursal_id son obligatorios'
      });
    }

    if (!Array.isArray(detalles) || detalles.length === 0) {
      return res.status(400).json({
        mensaje: 'Debe enviar al menos un detalle de venta'
      });
    }

    const condicionPago = condicion_pago || 'CONTADO';
    const descuentoGeneral = Number(descuento || 0);
    const montoPagadoInicial = Number(monto_pagado || 0);

    if ((condicionPago === 'CREDITO' || condicionPago === 'PARCIAL') && !cliente_id) {
      return res.status(400).json({
        mensaje: 'Para ventas a crédito o parcial debe seleccionar un cliente'
      });
    }

    await connection.beginTransaction();

    let subtotalVenta = 0;
    const detallesCalculados = [];

    for (const item of detalles) {
      const productoId = item.producto_id;
      const almacenId = item.almacen_id;
      const cantidad = Number(item.cantidad);
      const descuentoDetalle = Number(item.descuento || 0);

      if (!productoId || !almacenId || !cantidad || cantidad <= 0) {
        await connection.rollback();
        return res.status(400).json({
          mensaje: 'Cada detalle debe tener producto_id, almacen_id y cantidad mayor a 0'
        });
      }

      const [productoRows] = await connection.query(`
        SELECT id, nombre, precio_venta
        FROM productos
        WHERE id = ? AND estado = 1
      `, [productoId]);

      if (productoRows.length === 0) {
        await connection.rollback();
        return res.status(404).json({
          mensaje: `Producto no encontrado: ${productoId}`
        });
      }

      const precioUnitario = item.precio_unitario !== undefined
        ? Number(item.precio_unitario)
        : Number(productoRows[0].precio_venta);

      const [inventarioRows] = await connection.query(`
        SELECT id, cantidad
        FROM inventario
        WHERE producto_id = ? AND almacen_id = ? AND estado = 1
        FOR UPDATE
      `, [productoId, almacenId]);

      if (inventarioRows.length === 0) {
        await connection.rollback();
        return res.status(404).json({
          mensaje: `No existe inventario para el producto ${productoId} en el almacén ${almacenId}`
        });
      }

      const stockActual = Number(inventarioRows[0].cantidad);

      if (stockActual < cantidad) {
        await connection.rollback();
        return res.status(400).json({
          mensaje: `Stock insuficiente para ${productoRows[0].nombre}`,
          stock_actual: stockActual,
          cantidad_solicitada: cantidad
        });
      }

      const subtotalDetalle = (cantidad * precioUnitario) - descuentoDetalle;
      subtotalVenta += subtotalDetalle;

      detallesCalculados.push({
        producto_id: productoId,
        almacen_id: almacenId,
        inventario_id: inventarioRows[0].id,
        stock_anterior: stockActual,
        stock_nuevo: stockActual - cantidad,
        cantidad,
        precio_unitario: precioUnitario,
        descuento: descuentoDetalle,
        subtotal: subtotalDetalle
      });
    }

    const totalVenta = subtotalVenta - descuentoGeneral;

    if (totalVenta < 0) {
      await connection.rollback();
      return res.status(400).json({
        mensaje: 'El total de la venta no puede ser negativo'
      });
    }

    let estadoPago = 'PAGADO';

    if (condicionPago === 'CREDITO') {
      estadoPago = 'PENDIENTE';
    } else if (condicionPago === 'PARCIAL') {
      estadoPago = montoPagadoInicial >= totalVenta ? 'PAGADO' : 'PARCIAL';
    }

    const codigo = generarCodigoVenta();

    const [ventaResult] = await connection.query(`
      INSERT INTO ventas (
        codigo,
        cliente_id,
        usuario_id,
        sucursal_id,
        subtotal,
        descuento,
        total,
        condicion_pago,
        estado_pago,
        estado_venta,
        observacion
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'COMPLETADA', ?)
    `, [
      codigo,
      cliente_id || null,
      usuario_id,
      sucursal_id,
      subtotalVenta,
      descuentoGeneral,
      totalVenta,
      condicionPago,
      estadoPago,
      observacion || null
    ]);

    const ventaId = ventaResult.insertId;

    for (const item of detallesCalculados) {
      await connection.query(`
        INSERT INTO detalles_venta (
          venta_id,
          producto_id,
          almacen_id,
          cantidad,
          precio_unitario,
          descuento,
          subtotal
        )
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `, [
        ventaId,
        item.producto_id,
        item.almacen_id,
        item.cantidad,
        item.precio_unitario,
        item.descuento,
        item.subtotal
      ]);

      await connection.query(`
        UPDATE inventario
        SET cantidad = ?
        WHERE id = ?
      `, [item.stock_nuevo, item.inventario_id]);

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
        VALUES (?, 'SALIDA_VENTA', 'VENTA', ?, ?, ?, ?, ?)
      `, [
        item.inventario_id,
        ventaId,
        item.cantidad,
        item.stock_anterior,
        item.stock_nuevo,
        `Salida por venta ${codigo}`
      ]);
    }

    let cuentaCobrarId = null;

    if (condicionPago === 'CREDITO' || condicionPago === 'PARCIAL') {
      const saldoPendiente = condicionPago === 'CREDITO'
        ? totalVenta
        : Math.max(totalVenta - montoPagadoInicial, 0);

      if (saldoPendiente > 0) {
        const [cxcResult] = await connection.query(`
          INSERT INTO cuentas_por_cobrar (
            cliente_id,
            venta_id,
            monto_total,
            saldo_pendiente,
            estado_cobro
          )
          VALUES (?, ?, ?, ?, ?)
        `, [
          cliente_id,
          ventaId,
          totalVenta,
          saldoPendiente,
          saldoPendiente === totalVenta ? 'PENDIENTE' : 'PARCIAL'
        ]);

        cuentaCobrarId = cxcResult.insertId;
      }
    }

    if (condicionPago === 'CONTADO') {
      await connection.query(`
        INSERT INTO pagos (
          venta_id,
          monto_pagado,
          tipo_flujo,
          metodo_pago,
          observacion
        )
        VALUES (?, ?, 'INGRESO', ?, ?)
      `, [
        ventaId,
        totalVenta,
        metodo_pago || 'EFECTIVO',
        `Pago de venta ${codigo}`
      ]);
    } else if (condicionPago === 'PARCIAL' && montoPagadoInicial > 0) {
      await connection.query(`
        INSERT INTO pagos (
          cuenta_cobrar_id,
          monto_pagado,
          tipo_flujo,
          metodo_pago,
          observacion
        )
        VALUES (?, ?, 'INGRESO', ?, ?)
      `, [
        cuentaCobrarId,
        montoPagadoInicial,
        metodo_pago || 'EFECTIVO',
        `Pago parcial de venta ${codigo}`
      ]);
    }

    await connection.commit();

    res.status(201).json({
      mensaje: 'Venta registrada correctamente',
      venta_id: ventaId,
      codigo,
      subtotal: subtotalVenta,
      descuento: descuentoGeneral,
      total: totalVenta,
      condicion_pago: condicionPago,
      estado_pago: estadoPago,
      cuenta_cobrar_id: cuentaCobrarId
    });
  } catch (error) {
    await connection.rollback();

    res.status(500).json({
      mensaje: 'Error al registrar venta',
      error: error.message
    });
  } finally {
    connection.release();
  }
};

module.exports = {
  obtenerVentas,
  obtenerVentaPorId,
  crearVenta
};
