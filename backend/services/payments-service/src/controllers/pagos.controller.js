const pool = require('../config/db');

const obtenerPagos = async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT
        p.id,
        p.venta_id,
        v.codigo AS codigo_venta,
        p.compra_id,
        c.codigo AS codigo_compra,
        p.cuenta_cobrar_id,
        p.cuenta_pagar_id,
        p.monto_pagado,
        p.tipo_flujo,
        p.metodo_pago,
        p.numero_operacion,
        p.observacion,
        p.fecha
      FROM pagos p
      LEFT JOIN ventas v ON p.venta_id = v.id
      LEFT JOIN compras c ON p.compra_id = c.id
      WHERE p.estado = 1
      ORDER BY p.fecha DESC
    `);

    res.json(rows);
  } catch (error) {
    res.status(500).json({
      mensaje: 'Error al obtener pagos',
      error: error.message
    });
  }
};

module.exports = {
  obtenerPagos
};
