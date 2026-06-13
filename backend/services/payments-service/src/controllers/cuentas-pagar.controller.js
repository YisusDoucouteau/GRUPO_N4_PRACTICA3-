const pool = require('../config/db');

const obtenerCuentasPagar = async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT
        cxp.id,
        cxp.proveedor_id,
        pr.nombre AS proveedor,
        cxp.compra_id,
        c.codigo AS codigo_compra,
        cxp.monto_total,
        cxp.saldo_pendiente,
        cxp.fecha_vencimiento,
        cxp.estado_pago,
        cxp.fecha_creacion
      FROM cuentas_por_pagar cxp
      INNER JOIN proveedores pr ON cxp.proveedor_id = pr.id
      INNER JOIN compras c ON cxp.compra_id = c.id
      WHERE cxp.estado = 1
      ORDER BY cxp.fecha_creacion DESC
    `);

    res.json(rows);
  } catch (error) {
    res.status(500).json({
      mensaje: 'Error al obtener cuentas por pagar',
      error: error.message
    });
  }
};

const pagarCuentaPagar = async (req, res) => {
  const connection = await pool.getConnection();

  try {
    const { id } = req.params;
    const { monto_pagado, metodo_pago, numero_operacion, observacion } = req.body;

    const monto = Number(monto_pagado);

    if (!monto || monto <= 0) {
      return res.status(400).json({
        mensaje: 'El monto_pagado debe ser mayor a 0'
      });
    }

    await connection.beginTransaction();

    const [cuentaRows] = await connection.query(`
      SELECT id, compra_id, saldo_pendiente, estado_pago
      FROM cuentas_por_pagar
      WHERE id = ? AND estado = 1
      FOR UPDATE
    `, [id]);

    if (cuentaRows.length === 0) {
      await connection.rollback();
      return res.status(404).json({
        mensaje: 'Cuenta por pagar no encontrada'
      });
    }

    const cuenta = cuentaRows[0];

    if (cuenta.estado_pago === 'PAGADO') {
      await connection.rollback();
      return res.status(400).json({
        mensaje: 'La cuenta por pagar ya está pagada'
      });
    }

    const saldoActual = Number(cuenta.saldo_pendiente);

    if (monto > saldoActual) {
      await connection.rollback();
      return res.status(400).json({
        mensaje: 'El monto pagado no puede ser mayor al saldo pendiente',
        saldo_pendiente: saldoActual
      });
    }

    const saldoNuevo = saldoActual - monto;
    const nuevoEstado = saldoNuevo === 0 ? 'PAGADO' : 'PARCIAL';

    await connection.query(`
      INSERT INTO pagos (
        cuenta_pagar_id,
        monto_pagado,
        tipo_flujo,
        metodo_pago,
        numero_operacion,
        observacion
      )
      VALUES (?, ?, 'EGRESO', ?, ?, ?)
    `, [
      id,
      monto,
      metodo_pago || 'EFECTIVO',
      numero_operacion || null,
      observacion || 'Pago de cuenta por pagar'
    ]);

    await connection.query(`
      UPDATE cuentas_por_pagar
      SET saldo_pendiente = ?, estado_pago = ?
      WHERE id = ?
    `, [saldoNuevo, nuevoEstado, id]);

    await connection.query(`
      UPDATE compras
      SET estado_pago = ?
      WHERE id = ?
    `, [nuevoEstado === 'PAGADO' ? 'PAGADO' : 'PARCIAL', cuenta.compra_id]);

    await connection.commit();

    res.status(201).json({
      mensaje: 'Pago registrado correctamente',
      cuenta_pagar_id: id,
      saldo_anterior: saldoActual,
      monto_pagado: monto,
      saldo_nuevo: saldoNuevo,
      estado_pago: nuevoEstado
    });
  } catch (error) {
    await connection.rollback();

    res.status(500).json({
      mensaje: 'Error al pagar cuenta por pagar',
      error: error.message
    });
  } finally {
    connection.release();
  }
};

module.exports = {
  obtenerCuentasPagar,
  pagarCuentaPagar
};
