const pool = require('../config/db');

const generarCodigoCompra = () => {
  const fecha = new Date();
  const yyyy = fecha.getFullYear();
  const mm = String(fecha.getMonth() + 1).padStart(2, '0');
  const dd = String(fecha.getDate()).padStart(2, '0');
  const hh = String(fecha.getHours()).padStart(2, '0');
  const mi = String(fecha.getMinutes()).padStart(2, '0');
  const ss = String(fecha.getSeconds()).padStart(2, '0');
  const rand = Math.floor(Math.random() * 900 + 100);
  return `CMP-${yyyy}${mm}${dd}-${hh}${mi}${ss}-${rand}`;
};

const obtenerCompras = async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT 
        c.id,
        c.codigo,
        c.proveedor_id,
        p.nombre AS proveedor,
        c.usuario_id,
        u.nombre AS usuario,
        c.sucursal_id,
        s.nombre AS sucursal,
        c.numero_documento,
        c.subtotal,
        c.descuento,
        c.total,
        c.condicion_pago,
        c.estado_pago,
        c.estado_compra,
        c.observacion,
        c.fecha
      FROM compras c
      INNER JOIN proveedores p ON c.proveedor_id = p.id
      INNER JOIN usuarios u ON c.usuario_id = u.id
      INNER JOIN sucursales s ON c.sucursal_id = s.id
      WHERE c.estado = 1
      ORDER BY c.fecha DESC
    `);

    res.json(rows);
  } catch (error) {
    res.status(500).json({
      mensaje: 'Error al obtener compras',
      error: error.message
    });
  }
};

const obtenerCompraPorId = async (req, res) => {
  try {
    const { id } = req.params;

    const [compraRows] = await pool.query(`
      SELECT 
        c.id,
        c.codigo,
        c.proveedor_id,
        p.nombre AS proveedor,
        c.usuario_id,
        u.nombre AS usuario,
        c.sucursal_id,
        s.nombre AS sucursal,
        c.numero_documento,
        c.subtotal,
        c.descuento,
        c.total,
        c.condicion_pago,
        c.estado_pago,
        c.estado_compra,
        c.observacion,
        c.fecha
      FROM compras c
      INNER JOIN proveedores p ON c.proveedor_id = p.id
      INNER JOIN usuarios u ON c.usuario_id = u.id
      INNER JOIN sucursales s ON c.sucursal_id = s.id
      WHERE c.id = ? AND c.estado = 1
    `, [id]);

    if (compraRows.length === 0) {
      return res.status(404).json({ mensaje: 'Compra no encontrada' });
    }

    const [detalles] = await pool.query(`
      SELECT 
        dc.id,
        dc.producto_id,
        pr.sku,
        pr.nombre AS producto,
        dc.almacen_id,
        a.nombre AS almacen,
        dc.cantidad,
        dc.cantidad_bonificada,
        dc.precio_costo,
        dc.descuento,
        dc.subtotal
      FROM detalles_compra dc
      INNER JOIN productos pr ON dc.producto_id = pr.id
      INNER JOIN almacenes a ON dc.almacen_id = a.id
      WHERE dc.compra_id = ? AND dc.estado = 1
    `, [id]);

    res.json({
      ...compraRows[0],
      detalles
    });
  } catch (error) {
    res.status(500).json({
      mensaje: 'Error al obtener compra',
      error: error.message
    });
  }
};

const crearCompra = async (req, res) => {
  const connection = await pool.getConnection();

  try {
    const {
      proveedor_id,
      usuario_id,
      sucursal_id,
      numero_documento,
      condicion_pago,
      metodo_pago,
      monto_pagado,
      descuento,
      observacion,
      detalles
    } = req.body;

    if (!proveedor_id || !usuario_id || !sucursal_id) {
      return res.status(400).json({
        mensaje: 'proveedor_id, usuario_id y sucursal_id son obligatorios'
      });
    }

    if (!Array.isArray(detalles) || detalles.length === 0) {
      return res.status(400).json({
        mensaje: 'Debe enviar al menos un detalle de compra'
      });
    }

    const condicionPago = condicion_pago || 'CONTADO';
    const descuentoGeneral = Number(descuento || 0);
    const montoPagadoInicial = Number(monto_pagado || 0);

    await connection.beginTransaction();

    let subtotalCompra = 0;
    const detallesCalculados = [];

    for (const item of detalles) {
      const productoId = item.producto_id;
      const almacenId = item.almacen_id;
      const cantidad = Number(item.cantidad);
      const cantidadBonificada = Number(item.cantidad_bonificada || 0);
      const precioCosto = Number(item.precio_costo);
      const descuentoDetalle = Number(item.descuento || 0);

      if (!productoId || !almacenId || !cantidad || cantidad <= 0 || precioCosto < 0 || Number.isNaN(precioCosto)) {
        await connection.rollback();
        return res.status(400).json({
          mensaje: 'Cada detalle debe tener producto_id, almacen_id, cantidad mayor a 0 y precio_costo'
        });
      }

      const [productoRows] = await connection.query(`
        SELECT id, nombre
        FROM productos
        WHERE id = ? AND estado = 1
      `, [productoId]);

      if (productoRows.length === 0) {
        await connection.rollback();
        return res.status(404).json({
          mensaje: `Producto no encontrado: ${productoId}`
        });
      }

      const subtotalDetalle = (cantidad * precioCosto) - descuentoDetalle;
      subtotalCompra += subtotalDetalle;

      detallesCalculados.push({
        producto_id: productoId,
        almacen_id: almacenId,
        cantidad,
        cantidad_bonificada: cantidadBonificada,
        cantidad_entrada: cantidad + cantidadBonificada,
        precio_costo: precioCosto,
        descuento: descuentoDetalle,
        subtotal: subtotalDetalle
      });
    }

    const totalCompra = subtotalCompra - descuentoGeneral;

    if (totalCompra < 0) {
      await connection.rollback();
      return res.status(400).json({
        mensaje: 'El total de la compra no puede ser negativo'
      });
    }

    if (montoPagadoInicial > totalCompra) {
      await connection.rollback();
      return res.status(400).json({
        mensaje: 'El monto pagado no puede ser mayor al total de la compra'
      });
    }

    let estadoPago = 'PAGADO';

    if (condicionPago === 'CREDITO') {
      estadoPago = 'PENDIENTE';
    } else if (condicionPago === 'PARCIAL') {
      estadoPago = montoPagadoInicial >= totalCompra ? 'PAGADO' : 'PARCIAL';
    }

    const codigo = generarCodigoCompra();

    const [compraResult] = await connection.query(`
      INSERT INTO compras (
        codigo,
        proveedor_id,
        usuario_id,
        sucursal_id,
        numero_documento,
        subtotal,
        descuento,
        total,
        condicion_pago,
        estado_pago,
        estado_compra,
        observacion
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'PROCESADA', ?)
    `, [
      codigo,
      proveedor_id,
      usuario_id,
      sucursal_id,
      numero_documento || null,
      subtotalCompra,
      descuentoGeneral,
      totalCompra,
      condicionPago,
      estadoPago,
      observacion || null
    ]);

    const compraId = compraResult.insertId;

    for (const item of detallesCalculados) {
      await connection.query(`
        INSERT INTO detalles_compra (
          compra_id,
          producto_id,
          almacen_id,
          cantidad,
          cantidad_bonificada,
          precio_costo,
          descuento,
          subtotal
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        compraId,
        item.producto_id,
        item.almacen_id,
        item.cantidad,
        item.cantidad_bonificada,
        item.precio_costo,
        item.descuento,
        item.subtotal
      ]);

      let [inventarioRows] = await connection.query(`
        SELECT id, cantidad
        FROM inventario
        WHERE producto_id = ? AND almacen_id = ? AND estado = 1
        FOR UPDATE
      `, [item.producto_id, item.almacen_id]);

      let inventarioId;
      let stockAnterior = 0;

      if (inventarioRows.length === 0) {
        const [insertInv] = await connection.query(`
          INSERT INTO inventario (producto_id, almacen_id, cantidad)
          VALUES (?, ?, 0)
        `, [item.producto_id, item.almacen_id]);

        inventarioId = insertInv.insertId;
      } else {
        inventarioId = inventarioRows[0].id;
        stockAnterior = Number(inventarioRows[0].cantidad);
      }

      const stockNuevo = stockAnterior + item.cantidad_entrada;

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
        VALUES (?, 'ENTRADA_COMPRA', 'COMPRA', ?, ?, ?, ?, ?)
      `, [
        inventarioId,
        compraId,
        item.cantidad_entrada,
        stockAnterior,
        stockNuevo,
        `Entrada por compra ${codigo}`
      ]);
    }

    let cuentaPagarId = null;

    if (condicionPago === 'CREDITO' || condicionPago === 'PARCIAL') {
      const saldoPendiente = condicionPago === 'CREDITO'
        ? totalCompra
        : Math.max(totalCompra - montoPagadoInicial, 0);

      if (saldoPendiente > 0) {
        const [cxpResult] = await connection.query(`
          INSERT INTO cuentas_por_pagar (
            proveedor_id,
            compra_id,
            monto_total,
            saldo_pendiente,
            estado_pago
          )
          VALUES (?, ?, ?, ?, ?)
        `, [
          proveedor_id,
          compraId,
          totalCompra,
          saldoPendiente,
          saldoPendiente === totalCompra ? 'PENDIENTE' : 'PARCIAL'
        ]);

        cuentaPagarId = cxpResult.insertId;
      }
    }

    if (condicionPago === 'CONTADO') {
      await connection.query(`
        INSERT INTO pagos (
          compra_id,
          monto_pagado,
          tipo_flujo,
          metodo_pago,
          observacion
        )
        VALUES (?, ?, 'EGRESO', ?, ?)
      `, [
        compraId,
        totalCompra,
        metodo_pago || 'EFECTIVO',
        `Pago de compra ${codigo}`
      ]);
    } else if (condicionPago === 'PARCIAL' && montoPagadoInicial > 0) {
      if (cuentaPagarId) {
        await connection.query(`
          INSERT INTO pagos (
            cuenta_pagar_id,
            monto_pagado,
            tipo_flujo,
            metodo_pago,
            observacion
          )
          VALUES (?, ?, 'EGRESO', ?, ?)
        `, [
          cuentaPagarId,
          montoPagadoInicial,
          metodo_pago || 'EFECTIVO',
          `Pago parcial de compra ${codigo}`
        ]);
      } else {
        await connection.query(`
          INSERT INTO pagos (
            compra_id,
            monto_pagado,
            tipo_flujo,
            metodo_pago,
            observacion
          )
          VALUES (?, ?, 'EGRESO', ?, ?)
        `, [
          compraId,
          montoPagadoInicial,
          metodo_pago || 'EFECTIVO',
          `Pago de compra ${codigo}`
        ]);
      }
    }

    await connection.commit();

    res.status(201).json({
      mensaje: 'Compra registrada correctamente',
      compra_id: compraId,
      codigo,
      subtotal: subtotalCompra,
      descuento: descuentoGeneral,
      total: totalCompra,
      condicion_pago: condicionPago,
      estado_pago: estadoPago,
      cuenta_pagar_id: cuentaPagarId
    });
  } catch (error) {
    await connection.rollback();

    res.status(500).json({
      mensaje: 'Error al registrar compra',
      error: error.message
    });
  } finally {
    connection.release();
  }
};

module.exports = {
  obtenerCompras,
  obtenerCompraPorId,
  crearCompra
};
