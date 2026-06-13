const pool = require('../config/db');

const obtenerResumenFinanciero = async (req, res) => {
  try {
    const [[ingresos]] = await pool.query(`
      SELECT COALESCE(SUM(monto_pagado), 0) AS total_ingresos
      FROM pagos
      WHERE tipo_flujo = 'INGRESO' AND estado = 1
    `);

    const [[egresos]] = await pool.query(`
      SELECT COALESCE(SUM(monto_pagado), 0) AS total_egresos
      FROM pagos
      WHERE tipo_flujo = 'EGRESO' AND estado = 1
    `);

    const [[cobrar]] = await pool.query(`
      SELECT COALESCE(SUM(saldo_pendiente), 0) AS total_por_cobrar
      FROM cuentas_por_cobrar
      WHERE estado = 1 AND estado_cobro IN ('PENDIENTE', 'PARCIAL', 'VENCIDO')
    `);

    const [[pagar]] = await pool.query(`
      SELECT COALESCE(SUM(saldo_pendiente), 0) AS total_por_pagar
      FROM cuentas_por_pagar
      WHERE estado = 1 AND estado_pago IN ('PENDIENTE', 'PARCIAL', 'VENCIDO')
    `);

    const totalIngresos = Number(ingresos.total_ingresos);
    const totalEgresos = Number(egresos.total_egresos);

    res.json({
      total_ingresos: totalIngresos,
      total_egresos: totalEgresos,
      utilidad_caja: totalIngresos - totalEgresos,
      total_por_cobrar: Number(cobrar.total_por_cobrar),
      total_por_pagar: Number(pagar.total_por_pagar)
    });
  } catch (error) {
    res.status(500).json({
      mensaje: 'Error al obtener resumen financiero',
      error: error.message
    });
  }
};

module.exports = {
  obtenerResumenFinanciero
};
