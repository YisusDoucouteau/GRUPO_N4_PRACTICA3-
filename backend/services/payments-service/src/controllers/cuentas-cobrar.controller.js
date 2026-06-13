const pool = require('../config/db');

const obtenerCuentasCobrar = async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT
        cxc.id,
        cxc.cliente_id,
        cl.nombre AS cliente,
        cxc.venta_id,
        v.codigo AS codigo_venta,
        cxc.monto_total,
        cxc.saldo_pendiente,
        cxc.fecha_vencimiento,
        cxc.estado_cobro,
        cxc.fecha_creacion
      FROM cuentas_por_cobrar cxc
      INNER JOIN clientes cl ON cxc.cliente_id = cl.id
      INNER JOIN ventas v ON cxc.venta_id = v.id
      WHERE cxc.estado = 1
      ORDER BY cxc.fecha_creacion DESC
    `);

    res.json(rows);
  } catch (error) {
    res.status(500).json({
      mensaje: 'Error al obtener cuentas por cobrar',
      error: error.message
    });
  }
};

const pagarCuentaCobrar = async (req, res) => {
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
      SELECT id, venta_id, saldo_pendiente, estado_cobro
      FROM cuentas_por_cobrar
      WHERE id = ? AND estado = 1
      FOR UPDATE
    `, [id]);

    if (cuentaRows.length === 0) {
      await connection.rollback();
      return res.status(404).json({
        mensaje: 'Cuenta por cobrar no encontrada'
      });
    }

    const cuenta = cuentaRows[0];

    if (cuenta.estado_cobro === 'PAGADO') {
      await connection.rollback();
      return res.status(400).json({
        mensaje: 'La cuenta por cobrar ya está pagada'
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
        cuenta_cobrar_id,
        monto_pagado,
        tipo_flujo,
        metodo_pago,
        numero_operacion,
        observacion
      )
      VALUES (?, ?, 'INGRESO', ?, ?, ?)
    `, [
      id,
      monto,
      metodo_pago || 'EFECTIVO',
      numero_operacion || null,
      observacion || 'Pago de cuenta por cobrar'
    ]);

    await connection.query(`
      UPDATE cuentas_por_cobrar
      SET saldo_pendiente = ?, estado_cobro = ?
      WHERE id = ?
    `, [saldoNuevo, nuevoEstado, id]);

    await connection.query(`
      UPDATE ventas
      SET estado_pago = ?
      WHERE id = ?
    `, [nuevoEstado === 'PAGADO' ? 'PAGADO' : 'PARCIAL', cuenta.venta_id]);

    await connection.commit();

    res.status(201).json({
      mensaje: 'Pago registrado correctamente',
      cuenta_cobrar_id: id,
      saldo_anterior: saldoActual,
      monto_pagado: monto,
      saldo_nuevo: saldoNuevo,
      estado_cobro: nuevoEstado
    });
  } catch (error) {
    await connection.rollback();

    res.status(500).json({
      mensaje: 'Error al pagar cuenta por cobrar',
      error: error.message
    });
  } finally {
    connection.release();
  }
};

module.exports = {
  obtenerCuentasCobrar,
  pagarCuentaCobrar
};
