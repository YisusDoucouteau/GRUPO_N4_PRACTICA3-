const pool = require('../config/db');

const generarNumeroFactura = () => {
  const fecha = new Date();
  const yyyy = fecha.getFullYear();
  const mm = String(fecha.getMonth() + 1).padStart(2, '0');
  const dd = String(fecha.getDate()).padStart(2, '0');
  const hh = String(fecha.getHours()).padStart(2, '0');
  const mi = String(fecha.getMinutes()).padStart(2, '0');
  const ss = String(fecha.getSeconds()).padStart(2, '0');
  const rand = Math.floor(Math.random() * 900 + 100);
  return `FAC-${yyyy}${mm}${dd}-${hh}${mi}${ss}-${rand}`;
};

const obtenerFacturas = async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT 
        f.id,
        f.venta_id,
        v.codigo AS codigo_venta,
        COALESCE(c.nombre, 'Sin cliente') AS cliente,
        v.total AS total_venta,
        f.numero_factura,
        f.nit_cliente,
        f.razon_social,
        f.url_pdf,
        f.fecha_emision,
        f.estado
      FROM facturas f
      INNER JOIN ventas v ON f.venta_id = v.id
      LEFT JOIN clientes c ON v.cliente_id = c.id
      WHERE f.estado = 1
      ORDER BY f.fecha_emision DESC
    `);

    res.json(rows);
  } catch (error) {
    res.status(500).json({
      mensaje: 'Error al obtener facturas',
      error: error.message
    });
  }
};

const obtenerFacturaPorId = async (req, res) => {
  try {
    const { id } = req.params;

    const [facturaRows] = await pool.query(`
      SELECT 
        f.id,
        f.venta_id,
        v.codigo AS codigo_venta,
        COALESCE(c.nombre, 'Sin cliente') AS cliente,
        v.total AS total_venta,
        f.numero_factura,
        f.nit_cliente,
        f.razon_social,
        f.url_pdf,
        f.fecha_emision,
        f.estado
      FROM facturas f
      INNER JOIN ventas v ON f.venta_id = v.id
      LEFT JOIN clientes c ON v.cliente_id = c.id
      WHERE f.id = ? AND f.estado = 1
    `, [id]);

    if (facturaRows.length === 0) {
      return res.status(404).json({
        mensaje: 'Factura no encontrada'
      });
    }

    const [detalles] = await pool.query(`
      SELECT
        dv.id,
        p.sku,
        p.nombre AS producto,
        dv.cantidad,
        dv.precio_unitario,
        dv.descuento,
        dv.subtotal
      FROM detalles_venta dv
      INNER JOIN productos p ON dv.producto_id = p.id
      WHERE dv.venta_id = ? AND dv.estado = 1
    `, [facturaRows[0].venta_id]);

    res.json({
      ...facturaRows[0],
      detalles
    });
  } catch (error) {
    res.status(500).json({
      mensaje: 'Error al obtener factura',
      error: error.message
    });
  }
};

const obtenerVentasSinFactura = async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT
        v.id,
        v.codigo,
        COALESCE(c.nombre, 'Sin cliente') AS cliente,
        c.nit_ci,
        v.total,
        v.fecha,
        v.estado_pago
      FROM ventas v
      LEFT JOIN clientes c ON v.cliente_id = c.id
      LEFT JOIN facturas f ON f.venta_id = v.id AND f.estado = 1
      WHERE v.estado = 1
        AND v.estado_venta = 'COMPLETADA'
        AND f.id IS NULL
      ORDER BY v.fecha DESC
    `);

    res.json(rows);
  } catch (error) {
    res.status(500).json({
      mensaje: 'Error al obtener ventas sin factura',
      error: error.message
    });
  }
};

const crearFactura = async (req, res) => {
  const connection = await pool.getConnection();

  try {
    const {
      venta_id,
      numero_factura,
      nit_cliente,
      razon_social,
      url_pdf
    } = req.body;

    if (!venta_id) {
      return res.status(400).json({
        mensaje: 'venta_id es obligatorio'
      });
    }

    await connection.beginTransaction();

    const [ventaRows] = await connection.query(`
      SELECT 
        v.id,
        v.codigo,
        v.cliente_id,
        v.total,
        COALESCE(c.nombre, 'Sin cliente') AS cliente,
        c.nit_ci
      FROM ventas v
      LEFT JOIN clientes c ON v.cliente_id = c.id
      WHERE v.id = ? AND v.estado = 1 AND v.estado_venta = 'COMPLETADA'
      FOR UPDATE
    `, [venta_id]);

    if (ventaRows.length === 0) {
      await connection.rollback();
      return res.status(404).json({
        mensaje: 'Venta no encontrada o no está completada'
      });
    }

    const [facturaExistente] = await connection.query(`
      SELECT id
      FROM facturas
      WHERE venta_id = ? AND estado = 1
    `, [venta_id]);

    if (facturaExistente.length > 0) {
      await connection.rollback();
      return res.status(400).json({
        mensaje: 'La venta ya tiene una factura registrada'
      });
    }

    const venta = ventaRows[0];
    const numeroFinal = numero_factura || generarNumeroFactura();

    const [result] = await connection.query(`
      INSERT INTO facturas (
        venta_id,
        numero_factura,
        nit_cliente,
        razon_social,
        url_pdf
      )
      VALUES (?, ?, ?, ?, ?)
    `, [
      venta_id,
      numeroFinal,
      nit_cliente || venta.nit_ci || '0',
      razon_social || venta.cliente || 'Consumidor Final',
      url_pdf || null
    ]);

    await connection.commit();

    res.status(201).json({
      mensaje: 'Factura creada correctamente',
      factura_id: result.insertId,
      venta_id,
      numero_factura: numeroFinal
    });
  } catch (error) {
    await connection.rollback();

    res.status(500).json({
      mensaje: 'Error al crear factura',
      error: error.message
    });
  } finally {
    connection.release();
  }
};

const anularFactura = async (req, res) => {
  try {
    const { id } = req.params;

    const [result] = await pool.query(`
      UPDATE facturas
      SET estado = 0
      WHERE id = ?
    `, [id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({
        mensaje: 'Factura no encontrada'
      });
    }

    res.json({
      mensaje: 'Factura anulada correctamente'
    });
  } catch (error) {
    res.status(500).json({
      mensaje: 'Error al anular factura',
      error: error.message
    });
  }
};

const obtenerFacturaPorVenta = async (req, res) => {
  try {
    const { venta_id } = req.params;

    const [rows] = await pool.query(`
      SELECT
        f.id,
        f.venta_id,
        v.codigo AS codigo_venta,
        COALESCE(c.nombre, 'Consumidor Final') AS cliente,
        v.subtotal,
        v.descuento,
        v.total AS total_venta,
        v.condicion_pago,
        v.estado_pago,
        f.numero_factura,
        f.nit_cliente,
        f.razon_social,
        f.fecha_emision
      FROM facturas f
      INNER JOIN ventas v ON f.venta_id = v.id
      LEFT JOIN clientes c ON v.cliente_id = c.id
      WHERE f.venta_id = ? AND f.estado = 1
      LIMIT 1
    `, [venta_id]);

    if (rows.length === 0) {
      return res.status(404).json({ mensaje: 'No hay factura para esta venta' });
    }

    res.json(rows[0]);
  } catch (error) {
    res.status(500).json({ mensaje: 'Error al obtener factura por venta', error: error.message });
  }
};

module.exports = {
  obtenerFacturas,
  obtenerFacturaPorId,
  obtenerVentasSinFactura,
  crearFactura,
  anularFactura,
  obtenerFacturaPorVenta
};
