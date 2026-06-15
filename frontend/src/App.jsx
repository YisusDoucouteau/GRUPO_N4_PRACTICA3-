import React, { useEffect, useMemo, useRef, useState } from 'react';
import { getJSON, postJSON, putJSON, deleteJSON } from './api';
import { Layout } from './components/Layout';
import { Page, Alert, Card, Field, Table, CrudModal, Loading } from './components/Components';

const pages = [
  ['dashboard', 'Dashboard'],
  ['caja', 'Caja / POS'],
  ['clientes', 'Clientes'],
  ['proveedores', 'Proveedores'],
  ['catalogo', 'Catálogo'],
  ['sucursales', 'Sucursales / Almacenes'],
  ['inventario', 'Inventario'],
  ['compras', 'Compras'],
  ['finanzas', 'Finanzas / Ventas'],
  ['facturacion', 'Facturación'],
  ['operaciones', 'Operaciones'],
  ['usuarios', 'Usuarios'],
];

const money = (v) => `Bs ${Number(v || 0).toFixed(2)}`;
const arr = (v) => (Array.isArray(v) ? v : []);
const num = (v) => Number(v || 0);

const emptyCliente    = { nombre: '', nit_ci: '', direccion: '', telefono: '', correo: '' };
const emptyProveedor  = { nombre: '', nit_rut: '', direccion: '', telefono: '', correo: '' };
const emptySucursal   = { nombre: '', direccion: '', telefono: '' };
const emptyAlmacen    = { sucursal_id: '', nombre: '', descripcion: '' };
const emptyCategoria  = { nombre: '', descripcion: '' };
const emptyProducto   = { categoria_id: '', sku: '', nombre: '', descripcion: '', unidad_medida: 'UNIDAD', precio_compra_referencia: 0, precio_venta: 0, stock_minimo: 0 };
const emptyUsuario    = { rol_id: '', nombre: '', email: '', password: '', telefono: '' };

/* Helper reutilizable para selects con opciones — definido fuera de cualquier componente */
function SelectField({ label, val, onChange, opts, required }) {
  return (
    <Field label={label} required={required}>
      <select className="form-input" value={val} onChange={e => onChange(e.target.value)}>
        <option value="">Seleccione...</option>
        {opts.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </Field>
  );
}

/* ─── Comprobante / Receipt Modal ────────────────────────────── */
function ComprobanteModal({ isOpen, onClose, venta, factura, metodoPago, montoPagadoAmt, closeLabel = 'Cerrar' }) {
  if (!isOpen || !venta) return null;

  const esDiferido = venta.condicion_pago === 'CREDITO' || venta.condicion_pago === 'PARCIAL';
  const metodo = metodoPago || venta.metodo_pago || '';
  const pagado = num(montoPagadoAmt);
  const saldo  = venta.condicion_pago === 'CREDITO'
    ? num(venta.total)
    : Math.max(num(venta.total) - pagado, 0);

  const fecha = venta.fecha
    ? new Date(venta.fecha).toLocaleString('es-BO', { dateStyle: 'short', timeStyle: 'short' })
    : '';

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal modal-comprobante" onClick={e => e.stopPropagation()}>
        <div className="modal-header no-print">
          <h2>Comprobante de Venta</h2>
          <button className="modal-close" type="button" onClick={onClose}>✕</button>
        </div>
        <div className="modal-body">
          <div className="recibo" id="recibo-print">
            {/* Header */}
            <div className="recibo-top">
              <div className="recibo-logo-box">OS</div>
              <div className="recibo-empresa">
                <strong>Tienda de la Abuela Serafina</strong>
                <span>OmniCommerce POS</span>
                {venta.sucursal && <span>{venta.sucursal}</span>}
              </div>
            </div>
            <div className="recibo-sep" />

            {/* Meta */}
            <div className="recibo-meta">
              {factura?.numero_factura && (
                <div><span>Factura Nro:</span><strong>{factura.numero_factura}</strong></div>
              )}
              <div><span>Código venta:</span><strong>{venta.codigo}</strong></div>
              <div><span>Fecha:</span><strong>{fecha}</strong></div>
            </div>
            <div className="recibo-sep" />

            {/* Cliente */}
            <div className="recibo-cliente">
              <div>
                <span>Cliente:</span>
                <strong>{factura?.razon_social || venta.cliente || 'Consumidor Final'}</strong>
              </div>
              <div><span>NIT/CI:</span><strong>{factura?.nit_cliente || '0'}</strong></div>
            </div>
            <div className="recibo-sep" />

            {/* Productos */}
            <table className="recibo-tbl">
              <thead>
                <tr>
                  <th>Producto</th>
                  <th>Cant.</th>
                  <th>Precio</th>
                  <th>Subtotal</th>
                </tr>
              </thead>
              <tbody>
                {arr(venta.detalles).map((d, i) => (
                  <tr key={i}>
                    <td>
                      <div>{d.producto}</div>
                      {d.sku && <small>{d.sku}</small>}
                    </td>
                    <td style={{ textAlign: 'center' }}>{d.cantidad}</td>
                    <td>{money(d.precio_unitario)}</td>
                    <td>{money(d.subtotal)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="recibo-sep" />

            {/* Totales */}
            <div className="recibo-totales">
              <div className="recibo-tot-row"><span>Subtotal:</span><span>{money(venta.subtotal)}</span></div>
              {num(venta.descuento) > 0 && (
                <div className="recibo-tot-row recibo-desc"><span>Descuento:</span><span>−{money(venta.descuento)}</span></div>
              )}
              <div className="recibo-tot-row recibo-total-main"><span>TOTAL:</span><span>{money(venta.total)}</span></div>
            </div>
            <div className="recibo-sep" />

            {/* Pago */}
            <div className="recibo-pago">
              <div><span>Condición:</span><strong>{venta.condicion_pago}</strong></div>
              {metodo && <div><span>Método:</span><strong>{metodo}</strong></div>}
              {esDiferido && (
                <>
                  <div><span>Monto pagado:</span><strong>{money(pagado)}</strong></div>
                  <div className={`recibo-tot-row${saldo > 0 ? ' recibo-saldo' : ''}`}>
                    <span>Saldo pendiente:</span><strong>{money(saldo)}</strong>
                  </div>
                </>
              )}
              {!esDiferido && (
                <div><span>Estado:</span><strong style={{ color: 'green' }}>PAGADO</strong></div>
              )}
            </div>
            <div className="recibo-sep" />

            {/* Footer */}
            <div className="recibo-footer">
              <p>¡Gracias por su compra!</p>
              <p>Tienda de la Abuela Serafina</p>
            </div>
          </div>
        </div>
        <div className="modal-footer no-print">
          <button className="btn btn-secondary" type="button" onClick={() => window.print()}>
            Imprimir
          </button>
          <button className="btn btn-primary" type="button" onClick={onClose}>
            {closeLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

function App() {
  const [page, setPage] = useState('dashboard');
  return (
    <Layout currentPage={page} pages={pages} onPageChange={setPage}>
      {page === 'dashboard'  && <Dashboard onNavigate={setPage} />}
      {page === 'caja'       && <Caja />}
      {page === 'clientes'   && <Clientes />}
      {page === 'proveedores'&& <Proveedores />}
      {page === 'catalogo'   && <Catalogo />}
      {page === 'sucursales' && <SucursalesAlmacenes />}
      {page === 'inventario' && <Inventario />}
      {page === 'compras'    && <Compras />}
      {page === 'finanzas'   && <Finanzas onNavigate={setPage} />}
      {page === 'facturacion'&& <Facturacion />}
      {page === 'operaciones'&& <Operaciones />}
      {page === 'usuarios'   && <Usuarios />}
    </Layout>
  );
}

/* ─── Hook genérico de carga ─────────────────────────────────── */
function useLoad(loader, deps = []) {
  const [data, setData]     = useState({});
  const [error, setError]   = useState('');
  const [loading, setLoading] = useState(false);
  const load = async () => {
    try { setLoading(true); setError(''); setData((await loader()) || {}); }
    catch (err) { setError(err.message); }
    finally { setLoading(false); }
  };
  useEffect(() => { load(); }, deps);
  return { data, error, loading, reload: load };
}

/* ─── Dashboard ──────────────────────────────────────────────── */
function Dashboard({ onNavigate }) {
  const { data, error, loading } = useLoad(async () => {
    const [resumen, productos, stock, clientes, proveedores, facturas, usuarios] = await Promise.all([
      getJSON('/api/payments/resumen'),
      getJSON('/api/catalog/productos'),
      getJSON('/api/inventory/stock'),
      getJSON('/api/sales/clientes'),
      getJSON('/api/purchases/proveedores'),
      getJSON('/api/billing/facturas'),
      getJSON('/api/users/usuarios'),
    ]);
    return { resumen, productos, stock, clientes, proveedores, facturas, usuarios };
  });

  return (
    <Page title="Dashboard" subtitle="Resumen general — haz clic en cualquier tarjeta para ir al módulo">
      <Alert type="error">{error}</Alert>
      {loading && <Loading />}
      <section className="cards">
        <Card title="Productos"     value={arr(data.productos).length}  icon="📦" onClick={() => onNavigate('catalogo')} />
        <Card title="Clientes"      value={arr(data.clientes).length}   icon="👥" onClick={() => onNavigate('clientes')} />
        <Card title="Proveedores"   value={arr(data.proveedores).length} icon="🏢" onClick={() => onNavigate('proveedores')} />
        <Card title="Items en stock" value={arr(data.stock).length}     icon="📊" onClick={() => onNavigate('inventario')} />
        <Card title="Facturas"      value={arr(data.facturas).length}   icon="📄" onClick={() => onNavigate('facturacion')} />
        <Card title="Usuarios"      value={arr(data.usuarios).length}   icon="👤" onClick={() => onNavigate('usuarios')} />
        <Card title="Ingresos"      value={money(data.resumen?.total_ingresos)}   icon="💰" onClick={() => onNavigate('finanzas')} />
        <Card title="Egresos"       value={money(data.resumen?.total_egresos)}    icon="💸" onClick={() => onNavigate('finanzas')} />
        <Card title="Por cobrar"    value={money(data.resumen?.total_por_cobrar)} icon="📈" onClick={() => onNavigate('finanzas')} />
        <Card title="Por pagar"     value={money(data.resumen?.total_por_pagar)}  icon="📉" onClick={() => onNavigate('finanzas')} />
      </section>
      <section className="panel">
        <div className="panel-header">
          <h3>Estado de módulos</h3>
          <p className="panel-subtitle">Acceso rápido a cada sección</p>
        </div>
        <Table
          columns={['Módulo', 'Función', 'Acción']}
          rows={[
            ['Caja / POS',   'Punto de venta en tiempo real',           <button className="btn btn-primary btn-small" onClick={() => onNavigate('caja')}>Abrir</button>],
            ['Catálogo',     'Productos, categorías y precios',          <button className="btn btn-primary btn-small" onClick={() => onNavigate('catalogo')}>Abrir</button>],
            ['Inventario',   'Stock por almacén y movimientos',          <button className="btn btn-primary btn-small" onClick={() => onNavigate('inventario')}>Abrir</button>],
            ['Compras',      'Compras a proveedores',                    <button className="btn btn-primary btn-small" onClick={() => onNavigate('compras')}>Abrir</button>],
            ['Ventas / Finanzas', 'Historial de ventas y cuentas',        <button className="btn btn-primary btn-small" onClick={() => onNavigate('finanzas')}>Abrir</button>],
            ['Operaciones',  'Devoluciones y transformaciones',          <button className="btn btn-primary btn-small" onClick={() => onNavigate('operaciones')}>Abrir</button>],
          ]}
        />
      </section>
    </Page>
  );
}

/* ─── Caja / POS ─────────────────────────────────────────────── */
function Caja() {
  const [carrito, setCarrito]       = useState([]);
  const [searchQ, setSearchQ]       = useState('');
  const [searchRes, setSearchRes]   = useState([]);
  const [sucursalId, setSucursalId] = useState('');
  const [almacenId, setAlmacenId]   = useState('');
  const [clienteId, setClienteId]   = useState('');
  const [nitCliente, setNitCliente] = useState('0');
  const [descuento, setDescuento]   = useState(0);
  const [condicion, setCondicion]   = useState('CONTADO');
  const [metodo, setMetodo]         = useState('EFECTIVO');
  const [observacion, setObservacion] = useState('');
  const [clock, setClock]           = useState('');
  const [msg, setMsg]               = useState({ text: '', type: 'success' });
  const [busy, setBusy]             = useState(false);
  const [mobileTab, setMobileTab]   = useState('cart'); // 'cart' | 'pay'
  const [montoPagado, setMontoPagado] = useState('');
  const [comprobante, setComprobante] = useState(null);
  const searchRef = useRef(null);

  const { data, reload } = useLoad(async () => ({
    sucursales: await getJSON('/api/inventory/sucursales'),
    almacenes:  await getJSON('/api/inventory/almacenes'),
    clientes:   await getJSON('/api/sales/clientes'),
    productos:  await getJSON('/api/catalog/productos'),
    stock:      await getJSON('/api/inventory/stock'),
    ventas:     await getJSON('/api/sales/ventas'),
  }));

  useEffect(() => {
    const tick = () => {
      const now = new Date();
      setClock(now.toLocaleTimeString('es-BO', { hour: '2-digit', minute: '2-digit', hour12: true }));
    };
    tick();
    const t = setInterval(tick, 1000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    if (arr(data.sucursales).length && !sucursalId)
      setSucursalId(String(data.sucursales[0].id));
  }, [data.sucursales]);

  useEffect(() => {
    const alms = arr(data.almacenes).filter(a => !sucursalId || String(a.sucursal_id) === sucursalId);
    if (alms.length && (!almacenId || !alms.find(a => String(a.id) === almacenId)))
      setAlmacenId(String(alms[0]?.id || ''));
  }, [sucursalId, data.almacenes]);

  const almsFiltrados = useMemo(() =>
    arr(data.almacenes).filter(a => !sucursalId || String(a.sucursal_id) === sucursalId),
    [data.almacenes, sucursalId]
  );

  /* Stock del almacén activo — indexado por producto_id */
  const stockAlmacen = useMemo(() =>
    Object.fromEntries(
      arr(data.stock)
        .filter(s => String(s.almacen_id) === almacenId)
        .map(s => [String(s.producto_id), num(s.cantidad)])
    ),
    [data.stock, almacenId]
  );
  const getStock = (pid) => stockAlmacen[String(pid)] ?? null; // null = sin registro

  const buscar = (q) => {
    setSearchQ(q);
    if (!q.trim()) return setSearchRes([]);
    const ql = q.toLowerCase();
    setSearchRes(arr(data.productos).filter(p =>
      p.nombre?.toLowerCase().includes(ql) || p.sku?.toLowerCase().includes(ql)
    ).slice(0, 8));
  };

  const addToCart = (p) => {
    if (!almacenId) { setMsg({ text: 'Selecciona un almacén primero', type: 'error' }); return; }
    const stockDisp = getStock(p.id);
    if (stockDisp === null) {
      setMsg({ text: `"${p.nombre}" no tiene inventario en este almacén`, type: 'error' });
      return;
    }
    const enCarrito = carrito.find(i => i.id === p.id)?.qty ?? 0;
    if (stockDisp <= 0) {
      setMsg({ text: `Sin stock: "${p.nombre}"`, type: 'error' });
      return;
    }
    if (enCarrito >= stockDisp) {
      setMsg({ text: `Máximo disponible: ${stockDisp} unid. de "${p.nombre}"`, type: 'error' });
      return;
    }
    setMsg({ text: '', type: 'success' });
    setCarrito(prev => {
      const ex = prev.find(i => i.id === p.id);
      if (ex) return prev.map(i => i.id === p.id ? { ...i, qty: i.qty + 1 } : i);
      return [...prev, { id: p.id, nombre: p.nombre, sku: p.sku, precio: num(p.precio_venta), qty: 1, stockMax: stockDisp }];
    });
    setSearchQ(''); setSearchRes([]);
    setTimeout(() => searchRef.current?.focus(), 50);
  };

  const updateQty = (id, qty) => {
    if (qty <= 0) return setCarrito(prev => prev.filter(i => i.id !== id));
    const item = carrito.find(i => i.id === id);
    const max  = item?.stockMax ?? Infinity;
    if (qty > max) { setMsg({ text: `Stock máximo: ${max} unidades`, type: 'error' }); return; }
    setCarrito(prev => prev.map(i => i.id === id ? { ...i, qty } : i));
  };

  const nuevaVenta = () => {
    setCarrito([]); setDescuento(0); setNitCliente('0');
    setClienteId(''); setObservacion(''); setMsg({ text: '', type: 'success' });
    setMontoPagado('');
    setTimeout(() => searchRef.current?.focus(), 50);
  };

  const cerrarComprobante = () => {
    setComprobante(null);
    nuevaVenta();
  };

  const subtotal  = carrito.reduce((s, i) => s + i.qty * i.precio, 0);
  const descMonto = subtotal * num(descuento) / 100;
  const total     = subtotal - descMonto;

  const cobrar = async () => {
    if (!carrito.length)           { setMsg({ text: 'Agrega productos al carrito', type: 'error' }); return; }
    if (!sucursalId || !almacenId) { setMsg({ text: 'Selecciona sucursal y almacén', type: 'error' }); return; }
    if ((condicion === 'CREDITO' || condicion === 'PARCIAL') && !clienteId) {
      setMsg({ text: `Para ventas a ${condicion.toLowerCase()} debes seleccionar un cliente`, type: 'error' }); return;
    }
    if (condicion === 'PARCIAL') {
      if (!montoPagado || num(montoPagado) <= 0) { setMsg({ text: 'Ingresa el monto que paga ahora', type: 'error' }); return; }
      if (num(montoPagado) > total)              { setMsg({ text: 'El monto pagado no puede superar el total', type: 'error' }); return; }
    }
    setBusy(true);
    try {
      const montoAhora = condicion === 'CREDITO' ? 0 : condicion === 'PARCIAL' ? num(montoPagado) : total;
      const ventaRes = await postJSON('/api/sales/ventas', {
        cliente_id:     clienteId ? num(clienteId) : null,
        usuario_id:     1,
        sucursal_id:    num(sucursalId),
        condicion_pago: condicion,
        metodo_pago:    metodo,
        monto_pagado:   montoAhora,
        descuento:      descMonto,
        observacion,
        detalles: carrito.map(i => ({
          producto_id:     i.id,
          almacen_id:      num(almacenId),
          cantidad:        i.qty,
          precio_unitario: i.precio,
          descuento:       0,
        })),
      });

      // Auto-generar factura/comprobante
      const clienteObj = arr(data.clientes).find(c => String(c.id) === clienteId);
      let facturaDetalle = null;
      try {
        const facturaRes = await postJSON('/api/billing/facturas', {
          venta_id:     ventaRes.venta_id,
          nit_cliente:  nitCliente || '0',
          razon_social: clienteObj?.nombre || 'Consumidor Final',
        });
        facturaDetalle = await getJSON(`/api/billing/facturas/${facturaRes.factura_id}`);
      } catch (_) {}

      // Obtener detalles completos de la venta para el comprobante
      const ventaDetalle = await getJSON(`/api/sales/ventas/${ventaRes.venta_id}`);

      setComprobante({ venta: ventaDetalle, factura: facturaDetalle, metodoPago: metodo, montoPagadoAmt: montoAhora });
      reload();
    } catch (err) {
      setMsg({ text: err.message, type: 'error' });
    } finally { setBusy(false); }
  };

  /* Keyboard shortcuts — refs avoid stale closure */
  const cobrarRef    = useRef(cobrar);
  const nuevaRef     = useRef(nuevaVenta);
  cobrarRef.current  = cobrar;
  nuevaRef.current   = nuevaVenta;
  useEffect(() => {
    const handler = (e) => {
      if (e.key === 'F9')  { e.preventDefault(); cobrarRef.current(); }
      if (e.key === 'F12') { e.preventDefault(); nuevaRef.current(); }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  const ventasRec = arr(data.ventas).slice(0, 6);

  return (
    <>
    <div className="pos-wrap">
      {/* ── Header ───────────────────────────────────────────── */}
      <header className="pos-hdr">
        <div className="pos-hdr-brand">
          <div className="pos-logo">OS</div>
          <div>
            <div className="pos-hdr-title">OmniCommerce POS</div>
            <div className="pos-hdr-sub">Tienda de la Abuela Serafina</div>
          </div>
        </div>

        <div className="pos-hdr-selects">
          <div className="pos-ctrl-grp">
            <label>Sucursal</label>
            <select className="pos-ctrl-sel" value={sucursalId} onChange={e => setSucursalId(e.target.value)}>
              {arr(data.sucursales).map(s => <option key={s.id} value={s.id}>{s.nombre}</option>)}
            </select>
          </div>
          <div className="pos-ctrl-grp">
            <label>Almacén</label>
            <select className="pos-ctrl-sel" value={almacenId} onChange={e => setAlmacenId(e.target.value)}>
              {almsFiltrados.map(a => <option key={a.id} value={a.id}>{a.nombre}</option>)}
            </select>
          </div>
        </div>

        <button className="pos-hdr-new" onClick={nuevaVenta}>+ Nueva venta</button>
        <div className="pos-clock">{clock}</div>
      </header>

      {/* ── Mobile tabs ──────────────────────────────────────── */}
      <div className="pos-tabs">
        <button className={`pos-tab${mobileTab === 'cart' ? ' on' : ''}`} onClick={() => setMobileTab('cart')}>
          🛒 Carrito
          {carrito.length > 0 && <span className="pos-tab-badge">{carrito.length}</span>}
        </button>
        <button className={`pos-tab pos-tab-pay${mobileTab === 'pay' ? ' on' : ''}`} onClick={() => setMobileTab('pay')}>
          💳 Cobrar
          {total > 0 && <span className="pos-tab-total">{money(total)}</span>}
        </button>
      </div>

      {/* ── Body ─────────────────────────────────────────────── */}
      <div className="pos-body">

        {/* Left: cart column */}
        <div className={`pos-left${mobileTab !== 'cart' ? ' mobile-hidden' : ''}`}>
          {/* Search */}
          <div className="pos-search-bar">
            <span className="pos-si">🔍</span>
            <input
              ref={searchRef}
              className="pos-si-input"
              autoFocus
              placeholder="Escanear SKU o escribir nombre del producto..."
              value={searchQ}
              onChange={e => buscar(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter' && searchRes.length) addToCart(searchRes[0]);
                if (e.key === 'Escape') { setSearchQ(''); setSearchRes([]); }
              }}
            />
            {searchQ && (
              <button className="pos-si-clear" onClick={() => { setSearchQ(''); setSearchRes([]); searchRef.current?.focus(); }}>✕</button>
            )}
            {searchRes.length > 0 && (
              <div className="pos-results">
                {searchRes.map(p => {
                  const stk = getStock(p.id);
                  const sinStock = stk !== null && stk <= 0;
                  return (
                    <div key={p.id} className={`pos-result${sinStock ? ' no-stock' : ''}`}
                      onClick={() => !sinStock && addToCart(p)}>
                      <span className="pos-result-sku">{p.sku || `#${p.id}`}</span>
                      <span className="pos-result-name">{p.nombre}</span>
                      {stk !== null && (
                        <span className={`pos-result-stock${stk <= 0 ? ' zero' : stk <= 5 ? ' low' : ''}`}>
                          {stk <= 0 ? 'Sin stock' : `${stk} uds`}
                        </span>
                      )}
                      <span className="pos-result-price">{money(p.precio_venta)}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Cart */}
          <div className="pos-cart">
            {carrito.length === 0 ? (
              <div className="pos-empty">
                <div className="pos-empty-ico">🛒</div>
                <strong>Carrito vacío</strong>
                <span>Busca o escanea un producto para agregarlo</span>
              </div>
            ) : (
              <table className="pos-tbl">
                <thead>
                  <tr>
                    <th>Producto</th>
                    <th style={{ width: 105 }}>Precio</th>
                    <th style={{ width: 136 }}>Cantidad</th>
                    <th style={{ width: 110 }}>Subtotal</th>
                    <th style={{ width: 36 }}></th>
                  </tr>
                </thead>
                <tbody>
                  {carrito.map(item => (
                    <tr key={item.id}>
                      <td>
                        <div className="pos-prod-name">{item.nombre}</div>
                        {item.sku && <div className="pos-prod-sku">{item.sku}</div>}
                      </td>
                      <td className="pos-prod-price">{money(item.precio)}</td>
                      <td>
                        <div className="pos-qty">
                          <button className="pos-qty-btn" onClick={() => updateQty(item.id, item.qty - 1)}>−</button>
                          <input className="pos-qty-num" type="number" min="1" value={item.qty}
                            onChange={e => updateQty(item.id, num(e.target.value))} />
                          <button className="pos-qty-btn" onClick={() => updateQty(item.id, item.qty + 1)}>+</button>
                        </div>
                      </td>
                      <td className="pos-prod-sub">{money(item.qty * item.precio)}</td>
                      <td>
                        <button className="pos-remove" onClick={() => setCarrito(p => p.filter(i => i.id !== item.id))}>✕</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* Cart bar */}
          <div className="pos-cart-bar">
            <span>{carrito.length} productos · {carrito.reduce((s, i) => s + i.qty, 0)} unidades</span>
            {msg.text && <span className={`pos-msg ${msg.type === 'error' ? 'err' : 'ok'}`}>{msg.text}</span>}
            {carrito.length > 0 && (
              <button className="pos-goto-pay" onClick={() => setMobileTab('pay')}>
                {money(total)} →
              </button>
            )}
          </div>
        </div>

        {/* Right: payment panel */}
        <div className={`pos-right${mobileTab !== 'pay' ? ' mobile-hidden' : ''}`}>
          {/* Customer */}
          <div className="pos-sec">
            <label className="pos-lbl">Cliente</label>
            <select className="pos-inp pos-inp-sel" value={clienteId} onChange={e => {
              setClienteId(e.target.value);
              const c = arr(data.clientes).find(c => String(c.id) === e.target.value);
              setNitCliente(c?.nit_ci || '0');
            }}>
              <option value="">Consumidor final</option>
              {arr(data.clientes).map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
            </select>
          </div>

          <div className="pos-sec pos-sec-row">
            <div className="pos-sec-half">
              <label className="pos-lbl">NIT / CI</label>
              <input className="pos-inp" value={nitCliente} onChange={e => setNitCliente(e.target.value)} />
            </div>
            <div className="pos-sec-half">
              <label className="pos-lbl">Descuento %</label>
              <input className="pos-inp" type="number" min="0" max="100" value={descuento}
                onChange={e => setDescuento(e.target.value)} />
            </div>
          </div>

          {/* Totals */}
          <div className="pos-totals">
            <div className="pos-tot-row"><span>Subtotal</span><span>{money(subtotal)}</span></div>
            {num(descuento) > 0 && (
              <div className="pos-tot-row pos-disc"><span>Dcto. {descuento}%</span><span>−{money(descMonto)}</span></div>
            )}
            <div className="pos-tot-main">
              <span>TOTAL A COBRAR</span>
              <span>{money(total)}</span>
            </div>
          </div>

          {/* Payment method */}
          <div className="pos-sec">
            <label className="pos-lbl">Método de pago</label>
            <div className="pos-methods">
              {[
                { key: 'EFECTIVO',      icon: '💵', label: 'Efectivo',      cls: 'g' },
                { key: 'TARJETA',       icon: '💳', label: 'Tarjeta',       cls: 'b' },
                { key: 'QR',            icon: '📱', label: 'QR / Tigo',     cls: 'v' },
                { key: 'TRANSFERENCIA', icon: '🏦', label: 'Transferencia', cls: 'o' },
              ].map(m => (
                <button key={m.key}
                  className={`pos-method pos-method-${m.cls}${metodo === m.key ? ' on' : ''}`}
                  onClick={() => setMetodo(m.key)}>
                  <span className="pos-method-ico">{m.icon}</span>
                  <span>{m.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Condition */}
          <div className="pos-sec">
            <label className="pos-lbl">Condición de pago</label>
            <div className="pos-cond">
              {['CONTADO', 'CREDITO', 'PARCIAL'].map(c => (
                <button key={c} className={`pos-cond-btn${condicion === c ? ' on' : ''}`}
                  onClick={() => setCondicion(c)}>{c}</button>
              ))}
            </div>
          </div>

          {/* Monto parcial — solo visible en condición PARCIAL */}
          {condicion === 'PARCIAL' && (
            <div className="pos-sec">
              <label className="pos-lbl">Monto que paga ahora</label>
              <input className="pos-inp" type="number" step="0.01" min="0"
                value={montoPagado} onChange={e => setMontoPagado(e.target.value)}
                placeholder={`Máx. ${money(total)}`} />
              {num(montoPagado) > 0 && num(montoPagado) < total && (
                <div className="pos-cxc-preview">
                  Queda en CxC: <strong>{money(total - num(montoPagado))}</strong>
                </div>
              )}
            </div>
          )}

          {/* Observation */}
          <div className="pos-sec">
            <label className="pos-lbl">Observación</label>
            <textarea className="pos-inp" rows={2} placeholder="Nota opcional..."
              value={observacion} onChange={e => setObservacion(e.target.value)} />
          </div>

          {/* Cobrar */}
          <div className="pos-pay">
            <button
              className={`pos-cobrar${!carrito.length ? ' off' : ''}${busy ? ' busy' : ''}`}
              onClick={cobrar}
              disabled={busy || !carrito.length}
            >
              <span className="pos-cobrar-ico">✓</span>
              <span className="pos-cobrar-lbl">{busy ? 'Procesando...' : 'Cobrar'}</span>
              <span className="pos-cobrar-amt">{money(total)}</span>
              <kbd>F9</kbd>
            </button>
            <button className="pos-new-btn" onClick={nuevaVenta}>
              🔄 Nueva venta <kbd>F12</kbd>
            </button>
          </div>
        </div>
      </div>

      {/* ── Status bar ───────────────────────────────────────── */}
      <div className="pos-bar">
        <span className="pos-dot on"></span>
        <span>Conectado</span>
        <span className="pos-sep">·</span>
        <span>{arr(data.sucursales).find(s => String(s.id) === sucursalId)?.nombre || 'Caja Principal'}</span>
        {ventasRec.length > 0 && (
          <>
            <span className="pos-sep">·</span>
            <span>Últimas ventas:</span>
            <div className="pos-chips">
              {ventasRec.map(v => (
                <div key={v.id} className="pos-chip">
                  <span className="pos-chip-id">#{v.id}</span>
                  <span className="pos-chip-total">{money(v.total)}</span>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
    <ComprobanteModal
      isOpen={!!comprobante}
      onClose={cerrarComprobante}
      venta={comprobante?.venta}
      factura={comprobante?.factura}
      metodoPago={comprobante?.metodoPago}
      montoPagadoAmt={comprobante?.montoPagadoAmt}
      closeLabel="Finalizar y nueva venta"
    />
    </>
  );
}

/* ─── Clientes ───────────────────────────────────────────────── */
function Clientes() {
  const { data, error, reload } = useLoad(async () => ({ clientes: await getJSON('/api/sales/clientes') }));
  const [form, setForm]         = useState(emptyCliente);
  const [editingId, setEditingId] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [msg, setMsg]           = useState('');

  const save = async (e) => {
    e.preventDefault();
    try {
      setMsg('');
      if (editingId) await putJSON(`/api/sales/clientes/${editingId}`, form);
      else           await postJSON('/api/sales/clientes', form);
      setForm(emptyCliente); setEditingId(null); setModalOpen(false);
      setMsg(editingId ? 'Cliente actualizado' : 'Cliente registrado');
      reload();
    } catch (err) { setMsg(err.message); }
  };

  const openCreate = () => { setEditingId(null); setForm(emptyCliente); setModalOpen(true); };
  const openEdit   = (c)  => { setEditingId(c.id); setForm(c); setModalOpen(true); };
  const closeModal = ()   => { setModalOpen(false); setForm(emptyCliente); setEditingId(null); };
  const remove     = async (id) => { if (!confirm('¿Eliminar cliente?')) return; await deleteJSON(`/api/sales/clientes/${id}`); reload(); };

  return (
    <>
      <Page title="Clientes" subtitle="Registro de clientes para ventas">
        <Alert type="error">{error}</Alert>
        <Alert type={msg.includes('Error') ? 'error' : 'success'}>{msg}</Alert>
        <section className="panel">
          <div className="panel-header">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3>Clientes registrados</h3>
              <button className="btn btn-primary" onClick={openCreate}>+ Nuevo cliente</button>
            </div>
          </div>
          <Table columns={['ID', 'Nombre', 'NIT/CI', 'Dirección', 'Teléfono', 'Correo', 'Acciones']}
            rows={arr(data.clientes).map(c => [c.id, c.nombre, c.nit_ci, c.direccion, c.telefono, c.correo,
              <div className="actions">
                <button className="btn btn-primary btn-small" onClick={() => openEdit(c)}>Editar</button>
                <button className="btn btn-danger btn-small" onClick={() => remove(c.id)}>Eliminar</button>
              </div>])} />
        </section>
      </Page>
      <CrudModal isOpen={modalOpen} title={editingId ? 'Editar cliente' : 'Nuevo cliente'}
        fields={[
          { name: 'nombre',   label: 'Nombre completo', required: true },
          { name: 'nit_ci',   label: 'NIT / CI' },
          { name: 'direccion',label: 'Dirección' },
          { name: 'telefono', label: 'Teléfono' },
          { name: 'correo',   label: 'Correo', type: 'email' },
        ]}
        form={form} setForm={setForm} editingId={editingId} onSubmit={save} onClose={closeModal} />
    </>
  );
}

/* ─── Proveedores ────────────────────────────────────────────── */
function Proveedores() {
  const { data, error, reload } = useLoad(async () => ({ proveedores: await getJSON('/api/purchases/proveedores') }));
  const [form, setForm]         = useState(emptyProveedor);
  const [editingId, setEditingId] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [msg, setMsg]           = useState('');

  const save = async (e) => {
    e.preventDefault();
    try {
      setMsg('');
      if (editingId) await putJSON(`/api/purchases/proveedores/${editingId}`, form);
      else           await postJSON('/api/purchases/proveedores', form);
      setForm(emptyProveedor); setEditingId(null); setModalOpen(false);
      setMsg(editingId ? 'Proveedor actualizado' : 'Proveedor registrado');
      reload();
    } catch (err) { setMsg(err.message); }
  };

  const openCreate = () => { setEditingId(null); setForm(emptyProveedor); setModalOpen(true); };
  const openEdit   = (p)  => { setEditingId(p.id); setForm(p); setModalOpen(true); };
  const closeModal = ()   => { setModalOpen(false); setForm(emptyProveedor); setEditingId(null); };
  const remove     = async (id) => { if (!confirm('¿Eliminar proveedor?')) return; await deleteJSON(`/api/purchases/proveedores/${id}`); reload(); };

  return (
    <>
      <Page title="Proveedores" subtitle="Gestión de proveedores">
        <Alert type="error">{error}</Alert>
        <Alert type={msg.includes('Error') ? 'error' : 'success'}>{msg}</Alert>
        <section className="panel">
          <div className="panel-header">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3>Proveedores registrados</h3>
              <button className="btn btn-primary" onClick={openCreate}>+ Nuevo proveedor</button>
            </div>
          </div>
          <Table columns={['ID', 'Nombre', 'NIT/RUT', 'Dirección', 'Teléfono', 'Correo', 'Acciones']}
            rows={arr(data.proveedores).map(p => [p.id, p.nombre, p.nit_rut, p.direccion, p.telefono, p.correo,
              <div className="actions">
                <button className="btn btn-primary btn-small" onClick={() => openEdit(p)}>Editar</button>
                <button className="btn btn-danger btn-small" onClick={() => remove(p.id)}>Eliminar</button>
              </div>])} />
        </section>
      </Page>
      <CrudModal isOpen={modalOpen} title={editingId ? 'Editar proveedor' : 'Nuevo proveedor'}
        fields={[
          { name: 'nombre',   label: 'Nombre / Razón social', required: true },
          { name: 'nit_rut',  label: 'NIT / RUT' },
          { name: 'direccion',label: 'Dirección' },
          { name: 'telefono', label: 'Teléfono' },
          { name: 'correo',   label: 'Correo', type: 'email' },
        ]}
        form={form} setForm={setForm} editingId={editingId} onSubmit={save} onClose={closeModal} />
    </>
  );
}

/* ─── Catálogo ───────────────────────────────────────────────── */
function Catalogo() {
  const { data, error, reload } = useLoad(async () => ({
    categorias: await getJSON('/api/catalog/categorias'),
    productos:  await getJSON('/api/catalog/productos'),
  }));

  const [catModal, setCatModal]   = useState(false);
  const [catForm, setCatForm]     = useState(emptyCategoria);
  const [editingCat, setEditingCat] = useState(null);

  const [prodModal, setProdModal]   = useState(false);
  const [prodForm, setProdForm]     = useState(emptyProducto);
  const [editingProd, setEditingProd] = useState(null);

  const [msg, setMsg] = useState('');

  const catOpts = useMemo(() => arr(data.categorias).map(c => ({ value: c.id, label: c.nombre })), [data.categorias]);

  const saveCat = async (e) => {
    e.preventDefault();
    try {
      if (editingCat) await putJSON(`/api/catalog/categorias/${editingCat}`, catForm);
      else            await postJSON('/api/catalog/categorias', catForm);
      setMsg(editingCat ? 'Categoría actualizada' : 'Categoría creada');
      setCatModal(false); setEditingCat(null); setCatForm(emptyCategoria); reload();
    } catch (err) { setMsg(err.message); }
  };

  const saveProd = async (e) => {
    e.preventDefault();
    try {
      const body = { ...prodForm, categoria_id: num(prodForm.categoria_id), precio_compra_referencia: num(prodForm.precio_compra_referencia), precio_venta: num(prodForm.precio_venta), stock_minimo: num(prodForm.stock_minimo) };
      if (editingProd) await putJSON(`/api/catalog/productos/${editingProd}`, body);
      else             await postJSON('/api/catalog/productos', body);
      setMsg(editingProd ? 'Producto actualizado' : 'Producto creado');
      setProdModal(false); setEditingProd(null); setProdForm(emptyProducto); reload();
    } catch (err) { setMsg(err.message); }
  };

  const removeCat  = async (id) => { if (!confirm('¿Eliminar categoría?')) return; await deleteJSON(`/api/catalog/categorias/${id}`); reload(); };
  const removeProd = async (id) => { if (!confirm('¿Eliminar producto?'))  return; await deleteJSON(`/api/catalog/productos/${id}`);  reload(); };

  return (
    <>
      <Page title="Catálogo" subtitle="Gestión de categorías y productos">
        <Alert type="error">{error}</Alert>
        <Alert type={msg.includes('Error') ? 'error' : 'success'}>{msg}</Alert>

        <section className="panel">
          <div className="panel-header">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3>Categorías</h3>
              <button className="btn btn-primary" onClick={() => { setEditingCat(null); setCatForm(emptyCategoria); setCatModal(true); }}>+ Nueva categoría</button>
            </div>
          </div>
          <Table columns={['ID', 'Nombre', 'Descripción', 'Acciones']}
            rows={arr(data.categorias).map(c => [c.id, c.nombre, c.descripcion,
              <div className="actions">
                <button className="btn btn-primary btn-small" onClick={() => { setEditingCat(c.id); setCatForm(c); setCatModal(true); }}>Editar</button>
                <button className="btn btn-danger btn-small" onClick={() => removeCat(c.id)}>Eliminar</button>
              </div>])} />
        </section>

        <section className="panel">
          <div className="panel-header">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3>Productos</h3>
              <button className="btn btn-primary" onClick={() => { setEditingProd(null); setProdForm(emptyProducto); setProdModal(true); }}>+ Nuevo producto</button>
            </div>
          </div>
          <Table columns={['ID', 'SKU', 'Producto', 'Categoría', 'Precio venta', 'Stock mín.', 'Acciones']}
            rows={arr(data.productos).map(p => [p.id, p.sku, p.nombre, p.categoria, money(p.precio_venta), p.stock_minimo,
              <div className="actions">
                <button className="btn btn-primary btn-small" onClick={() => { setEditingProd(p.id); setProdForm(p); setProdModal(true); }}>Editar</button>
                <button className="btn btn-danger btn-small" onClick={() => removeProd(p.id)}>Eliminar</button>
              </div>])} />
        </section>
      </Page>

      <CrudModal isOpen={catModal} title={editingCat ? 'Editar categoría' : 'Nueva categoría'}
        fields={[{ name: 'nombre', label: 'Nombre', required: true }, { name: 'descripcion', label: 'Descripción' }]}
        form={catForm} setForm={setCatForm} editingId={editingCat} onSubmit={saveCat}
        onClose={() => { setCatModal(false); setEditingCat(null); setCatForm(emptyCategoria); }} />

      <CrudModal isOpen={prodModal} title={editingProd ? 'Editar producto' : 'Nuevo producto'}
        fields={[
          { name: 'categoria_id', label: 'Categoría', type: 'select', options: catOpts, required: true },
          { name: 'sku',          label: 'SKU / Código', required: true },
          { name: 'nombre',       label: 'Producto', required: true },
          { name: 'descripcion',  label: 'Descripción' },
          { name: 'unidad_medida',label: 'Unidad' },
          { name: 'precio_compra_referencia', label: 'Precio compra ref.', type: 'number' },
          { name: 'precio_venta', label: 'Precio venta', type: 'number', required: true },
          { name: 'stock_minimo', label: 'Stock mínimo', type: 'number' },
        ]}
        form={prodForm} setForm={setProdForm} editingId={editingProd} onSubmit={saveProd}
        onClose={() => { setProdModal(false); setEditingProd(null); setProdForm(emptyProducto); }} />
    </>
  );
}

/* ─── Sucursales / Almacenes ─────────────────────────────────── */
function SucursalesAlmacenes() {
  const { data, error, reload } = useLoad(async () => ({
    sucursales: await getJSON('/api/inventory/sucursales'),
    almacenes:  await getJSON('/api/inventory/almacenes'),
  }));

  const [sucModal, setSucModal]     = useState(false);
  const [sucForm, setSucForm]       = useState(emptySucursal);
  const [editingSuc, setEditingSuc] = useState(null);

  const [almModal, setAlmModal]     = useState(false);
  const [almForm, setAlmForm]       = useState(emptyAlmacen);
  const [editingAlm, setEditingAlm] = useState(null);

  const [msg, setMsg] = useState('');
  const sucOpts = useMemo(() => arr(data.sucursales).map(s => ({ value: s.id, label: s.nombre })), [data.sucursales]);

  const saveSuc = async (e) => {
    e.preventDefault();
    try {
      if (editingSuc) await putJSON(`/api/inventory/sucursales/${editingSuc}`, sucForm);
      else            await postJSON('/api/inventory/sucursales', sucForm);
      setMsg(editingSuc ? 'Sucursal actualizada' : 'Sucursal creada');
      setSucModal(false); setEditingSuc(null); setSucForm(emptySucursal); reload();
    } catch (err) { setMsg(err.message); }
  };

  const saveAlm = async (e) => {
    e.preventDefault();
    try {
      const body = { ...almForm, sucursal_id: num(almForm.sucursal_id) };
      if (editingAlm) await putJSON(`/api/inventory/almacenes/${editingAlm}`, body);
      else            await postJSON('/api/inventory/almacenes', body);
      setMsg(editingAlm ? 'Almacén actualizado' : 'Almacén creado');
      setAlmModal(false); setEditingAlm(null); setAlmForm(emptyAlmacen); reload();
    } catch (err) { setMsg(err.message); }
  };

  return (
    <>
      <Page title="Sucursales y Almacenes" subtitle="Control multisucursal">
        <Alert type="error">{error}</Alert>
        <Alert type={msg.includes('Error') ? 'error' : 'success'}>{msg}</Alert>

        <section className="panel">
          <div className="panel-header">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3>Sucursales</h3>
              <button className="btn btn-primary" onClick={() => { setEditingSuc(null); setSucForm(emptySucursal); setSucModal(true); }}>+ Nueva sucursal</button>
            </div>
          </div>
          <Table columns={['ID', 'Nombre', 'Dirección', 'Teléfono', 'Acciones']}
            rows={arr(data.sucursales).map(s => [s.id, s.nombre, s.direccion, s.telefono,
              <div className="actions">
                <button className="btn btn-primary btn-small" onClick={() => { setEditingSuc(s.id); setSucForm(s); setSucModal(true); }}>Editar</button>
                <button className="btn btn-danger btn-small" onClick={async () => { if (confirm('¿Eliminar?')) { await deleteJSON(`/api/inventory/sucursales/${s.id}`); reload(); } }}>Eliminar</button>
              </div>])} />
        </section>

        <section className="panel">
          <div className="panel-header">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3>Almacenes</h3>
              <button className="btn btn-primary" onClick={() => { setEditingAlm(null); setAlmForm(emptyAlmacen); setAlmModal(true); }}>+ Nuevo almacén</button>
            </div>
          </div>
          <Table columns={['ID', 'Almacén', 'Sucursal', 'Descripción', 'Acciones']}
            rows={arr(data.almacenes).map(a => [a.id, a.nombre, a.sucursal, a.descripcion,
              <div className="actions">
                <button className="btn btn-primary btn-small" onClick={() => { setEditingAlm(a.id); setAlmForm(a); setAlmModal(true); }}>Editar</button>
                <button className="btn btn-danger btn-small" onClick={async () => { if (confirm('¿Eliminar?')) { await deleteJSON(`/api/inventory/almacenes/${a.id}`); reload(); } }}>Eliminar</button>
              </div>])} />
        </section>
      </Page>

      <CrudModal isOpen={sucModal} title={editingSuc ? 'Editar sucursal' : 'Nueva sucursal'}
        fields={[{ name: 'nombre', label: 'Nombre', required: true }, { name: 'direccion', label: 'Dirección' }, { name: 'telefono', label: 'Teléfono' }]}
        form={sucForm} setForm={setSucForm} editingId={editingSuc} onSubmit={saveSuc}
        onClose={() => { setSucModal(false); setEditingSuc(null); setSucForm(emptySucursal); }} />

      <CrudModal isOpen={almModal} title={editingAlm ? 'Editar almacén' : 'Nuevo almacén'}
        fields={[
          { name: 'sucursal_id', label: 'Sucursal', type: 'select', options: sucOpts, required: true },
          { name: 'nombre',      label: 'Nombre almacén', required: true },
          { name: 'descripcion', label: 'Descripción' },
        ]}
        form={almForm} setForm={setAlmForm} editingId={editingAlm} onSubmit={saveAlm}
        onClose={() => { setAlmModal(false); setEditingAlm(null); setAlmForm(emptyAlmacen); }} />
    </>
  );
}

/* ─── Inventario ─────────────────────────────────────────────── */
function Inventario() {
  const { data, error, reload } = useLoad(async () => ({
    stock:       await getJSON('/api/inventory/stock'),
    movimientos: await getJSON('/api/inventory/stock/movimientos'),
    productos:   await getJSON('/api/catalog/productos'),
    almacenes:   await getJSON('/api/inventory/almacenes'),
  }));
  const [form, setForm] = useState({ producto_id: '', almacen_id: '', cantidad: 1, observacion: '' });
  const [msg, setMsg]   = useState('');

  const prodOpts = useMemo(() => arr(data.productos).map(p => ({ value: p.id, label: `${p.sku || p.id} - ${p.nombre}` })), [data.productos]);
  const almOpts  = useMemo(() => arr(data.almacenes).map(a => ({ value: a.id, label: a.nombre })), [data.almacenes]);

  const ajuste = async (tipo) => {
    if (!form.producto_id || !form.almacen_id) { setMsg('Seleccione producto y almacén'); return; }
    try {
      await postJSON(`/api/inventory/stock/ajuste-${tipo}`, {
        producto_id: num(form.producto_id), almacen_id: num(form.almacen_id),
        cantidad: num(form.cantidad), usuario_id: 1, observacion: form.observacion,
      });
      setMsg(tipo === 'entrada' ? 'Entrada registrada' : 'Salida registrada');
      reload();
    } catch (err) { setMsg(err.message); }
  };

  return (
    <Page title="Inventario" subtitle="Stock por almacén y movimientos">
      <Alert type="error">{error}</Alert>
      <Alert type={msg.includes('Error') ? 'error' : 'success'}>{msg}</Alert>
      <section className="panel">
        <div className="panel-header"><h3>Ajuste rápido de stock</h3></div>
        <div className="form-grid">
          <Field label="Producto" required>
            <select className="form-input" value={form.producto_id} onChange={e => setForm({ ...form, producto_id: e.target.value })}>
              <option value="">Seleccione un producto...</option>
              {prodOpts.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </Field>
          <Field label="Almacén" required>
            <select className="form-input" value={form.almacen_id} onChange={e => setForm({ ...form, almacen_id: e.target.value })}>
              <option value="">Seleccione un almacén...</option>
              {almOpts.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </Field>
          <Field label="Cantidad">
            <input className="form-input" type="number" min="1" value={form.cantidad} onChange={e => setForm({ ...form, cantidad: e.target.value })} />
          </Field>
          <Field label="Observación">
            <input className="form-input" placeholder="Motivo del ajuste" value={form.observacion} onChange={e => setForm({ ...form, observacion: e.target.value })} />
          </Field>
          <div className="actions end" style={{ gridColumn: '1 / -1' }}>
            <button className="btn btn-success" onClick={() => ajuste('entrada')}>+ Entrada</button>
            <button className="btn btn-danger"  onClick={() => ajuste('salida')}>− Salida</button>
          </div>
        </div>
      </section>
      <section className="panel">
        <div className="panel-header"><h3>Stock actual</h3></div>
        <Table columns={['ID', 'Producto', 'Almacén', 'Cantidad', 'Stock mín.']}
          rows={arr(data.stock).map(s => [s.id, s.producto, s.almacen, s.cantidad, s.stock_minimo])} />
      </section>
      <section className="panel">
        <div className="panel-header"><h3>Últimos movimientos</h3></div>
        <Table columns={['ID', 'Tipo', 'Producto', 'Cantidad', 'Fecha']}
          rows={arr(data.movimientos).slice(0, 10).map(m => [m.id, m.tipo_movimiento, m.producto, m.cantidad, m.fecha])} />
      </section>
    </Page>
  );
}


/* ─── Compras ────────────────────────────────────────────────── */
function Compras() {
  const { data, error, reload } = useLoad(async () => ({
    proveedores: await getJSON('/api/purchases/proveedores'),
    productos:   await getJSON('/api/catalog/productos'),
    almacenes:   await getJSON('/api/inventory/almacenes'),
    compras:     await getJSON('/api/purchases/compras'),
  }));
  const [form, setForm] = useState({
    proveedor_id: '', producto_id: '', almacen_id: '', numero_documento: '',
    cantidad: 10, cantidad_bonificada: 0, precio_costo: '', descuento: 0,
    condicion_pago: 'CONTADO', metodo_pago: 'EFECTIVO', monto_pagado: 0, observacion: '',
  });
  const [msg, setMsg] = useState('');

  const provOpts     = useMemo(() => arr(data.proveedores).map(p => ({ value: p.id, label: p.nombre })), [data.proveedores]);
  const productoOpts = useMemo(() => arr(data.productos).map(p => ({ value: p.id, label: `${p.sku || p.id} - ${p.nombre}` })), [data.productos]);
  const almacenOpts  = useMemo(() => arr(data.almacenes).map(a => ({ value: a.id, label: a.nombre })), [data.almacenes]);

  const handleProd = (e) => {
    const pid  = e.target.value;
    const prod = arr(data.productos).find(p => String(p.id) === pid);
    setForm(f => ({ ...f, producto_id: pid, precio_costo: prod?.precio_compra_referencia ?? f.precio_costo }));
  };

  const total = num(form.cantidad) * num(form.precio_costo) - num(form.descuento);

  const save = async (e) => {
    e.preventDefault();
    try {
      await postJSON('/api/purchases/compras', {
        proveedor_id: num(form.proveedor_id), usuario_id: 1, sucursal_id: 1,
        numero_documento: form.numero_documento,
        condicion_pago: form.condicion_pago, metodo_pago: form.metodo_pago,
        monto_pagado: num(form.monto_pagado), observacion: form.observacion,
        detalles: [{ producto_id: num(form.producto_id), almacen_id: num(form.almacen_id), cantidad: num(form.cantidad), cantidad_bonificada: num(form.cantidad_bonificada), precio_costo: num(form.precio_costo), descuento: num(form.descuento) }],
      });
      setMsg('Compra registrada, stock aumentado');
      setForm(f => ({ ...f, producto_id: '', cantidad: 10, descuento: 0, observacion: '' }));
      reload();
    } catch (err) { setMsg(err.message); }
  };

  return (
    <Page title="Compras" subtitle="Registro de compras a proveedores">
      <Alert type="error">{error}</Alert>
      <Alert type={msg.includes('Error') ? 'error' : 'success'}>{msg}</Alert>
      <section className="panel">
        <div className="panel-header"><h3>Nueva compra</h3></div>
        <form className="form-grid" onSubmit={save}>
          <Field label="Proveedor" required>
            <select className="form-input" value={form.proveedor_id} onChange={e => setForm({ ...form, proveedor_id: e.target.value })} required>
              <option value="">Seleccione proveedor...</option>
              {provOpts.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </Field>
          <Field label="Número documento">
            <input className="form-input" placeholder="FAC-001" value={form.numero_documento} onChange={e => setForm({ ...form, numero_documento: e.target.value })} />
          </Field>
          <Field label="Producto" required>
            <select className="form-input" value={form.producto_id} onChange={handleProd} required>
              <option value="">Seleccione producto...</option>
              {productoOpts.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </Field>
          <Field label="Almacén" required>
            <select className="form-input" value={form.almacen_id} onChange={e => setForm({ ...form, almacen_id: e.target.value })} required>
              <option value="">Seleccione almacén...</option>
              {almacenOpts.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </Field>
          <Field label="Cantidad comprada">
            <input className="form-input" type="number" min="1" value={form.cantidad} onChange={e => setForm({ ...form, cantidad: e.target.value })} />
          </Field>
          <Field label="Bonificación (unid.)">
            <input className="form-input" type="number" min="0" value={form.cantidad_bonificada} onChange={e => setForm({ ...form, cantidad_bonificada: e.target.value })} />
          </Field>
          <Field label="Precio costo unitario">
            <input className="form-input" type="number" step="0.01" value={form.precio_costo} onChange={e => setForm({ ...form, precio_costo: e.target.value })} />
          </Field>
          <Field label="Descuento (Bs)">
            <input className="form-input" type="number" min="0" value={form.descuento} onChange={e => setForm({ ...form, descuento: e.target.value })} />
          </Field>
          <Field label="Condición pago">
            <select className="form-input" value={form.condicion_pago} onChange={e => setForm({ ...form, condicion_pago: e.target.value })}>
              <option>CONTADO</option><option>CREDITO</option><option>PARCIAL</option>
            </select>
          </Field>
          <Field label="Método pago">
            <select className="form-input" value={form.metodo_pago} onChange={e => setForm({ ...form, metodo_pago: e.target.value })}>
              <option>EFECTIVO</option><option>TARJETA</option><option>TRANSFERENCIA</option><option>QR</option>
            </select>
          </Field>
          <div className="total-box">
            Total: <strong>{money(total)}</strong>
            <br />Entrada real: <strong>{num(form.cantidad) + num(form.cantidad_bonificada)} unidades</strong>
          </div>
          <button className="btn btn-primary" type="submit">Registrar compra</button>
        </form>
      </section>
      <section className="panel">
        <div className="panel-header"><h3>Compras registradas</h3></div>
        <Table columns={['ID', 'Proveedor', 'Documento', 'Total', 'Condición', 'Fecha']}
          rows={arr(data.compras).map(c => [c.id, c.proveedor, c.numero_documento, money(c.total), c.condicion_pago, c.fecha])} />
      </section>
    </Page>
  );
}

/* ─── Finanzas / Ventas ──────────────────────────────────────── */
function Finanzas({ onNavigate }) {
  const { data, error, reload } = useLoad(async () => ({
    pagos:   await getJSON('/api/payments/pagos'),
    cxc:     await getJSON('/api/payments/cuentas-cobrar'),
    cxp:     await getJSON('/api/payments/cuentas-pagar'),
    resumen: await getJSON('/api/payments/resumen'),
    ventas:  await getJSON('/api/sales/ventas'),
  }));
  const [pagoCxc, setPagoCxc] = useState({ id: '', monto_pagado: '', metodo_pago: 'EFECTIVO', observacion: '' });
  const [pagoCxp, setPagoCxp] = useState({ id: '', monto_pagado: '', metodo_pago: 'EFECTIVO', observacion: '' });
  const [msg, setMsg] = useState('');
  const [ventaModal, setVentaModal] = useState(null); // { venta, factura }

  const pagar = async (tipo) => {
    try {
      const f   = tipo === 'cxc' ? pagoCxc : pagoCxp;
      const url = tipo === 'cxc'
        ? `/api/payments/cuentas-cobrar/${f.id}/pagar`
        : `/api/payments/cuentas-pagar/${f.id}/pagar`;
      await postJSON(url, { monto_pagado: num(f.monto_pagado), metodo_pago: f.metodo_pago, observacion: f.observacion });
      setMsg('Pago registrado'); reload();
    } catch (err) { setMsg(err.message); }
  };

  const verComprobante = async (ventaId) => {
    try {
      const venta = await getJSON(`/api/sales/ventas/${ventaId}`);
      let factura = null;
      try { factura = await getJSON(`/api/billing/facturas/por-venta/${ventaId}`); } catch (_) {}
      setVentaModal({ venta, factura });
    } catch (err) { setMsg(err.message); }
  };

  const estadoBadge = (e) => {
    const color = e === 'PAGADO' ? 'var(--color-success,#16a34a)' : e === 'PENDIENTE' ? 'var(--color-warning,#d97706)' : 'var(--color-primary,#2563eb)';
    return <span style={{ color, fontWeight: 700, fontSize: 12 }}>{e}</span>;
  };

  return (
    <>
    <Page title="Finanzas / Ventas" subtitle="Historial de ventas, cuentas por cobrar y pagar">
      <Alert type="error">{error}</Alert>
      <Alert type={msg.includes('Error') || msg.includes('error') ? 'error' : 'success'}>{msg}</Alert>

      {/* Resumen financiero */}
      <section className="cards">
        <Card title="Ingresos"         value={money(data.resumen?.total_ingresos)}   icon="💰" />
        <Card title="Egresos"          value={money(data.resumen?.total_egresos)}    icon="💸" />
        <Card title="Saldo por cobrar" value={money(data.resumen?.total_por_cobrar)} icon="📈" />
        <Card title="Saldo por pagar"  value={money(data.resumen?.total_por_pagar)}  icon="📉" />
      </section>

      {/* Historial de ventas */}
      <section className="panel">
        <div className="panel-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h3>Historial de ventas</h3>
            <p className="panel-subtitle">Haz clic en "Ver comprobante" para ver o reimprimir el recibo</p>
          </div>
          <button className="btn btn-primary btn-small" onClick={() => onNavigate('caja')}>
            + Nueva venta (Caja)
          </button>
        </div>
        <Table
          columns={['Código', 'Cliente', 'Total', 'Condición', 'Método', 'Estado', 'Fecha', 'Comprobante']}
          rows={arr(data.ventas).map(v => [
            v.codigo,
            v.cliente || 'Consumidor final',
            money(v.total),
            v.condicion_pago,
            v.metodo_pago || '—',
            estadoBadge(v.estado_pago),
            v.fecha ? new Date(v.fecha).toLocaleString('es-BO', { dateStyle: 'short', timeStyle: 'short' }) : '—',
            <button key={v.id} className="btn btn-secondary btn-small" onClick={() => verComprobante(v.id)}>
              Ver comprobante
            </button>,
          ])}
          empty="No hay ventas registradas aún."
        />
      </section>

      {/* Cuentas por cobrar — abono */}
      <section className="panel">
        <div className="panel-header"><h3>Registrar abono en cuenta por cobrar</h3></div>
        <div className="form-grid">
          <Field label="Cuenta por cobrar" required>
            <select className="form-input" value={pagoCxc.id} onChange={e => setPagoCxc({ ...pagoCxc, id: e.target.value })} required>
              <option value="">Seleccione CxC pendiente...</option>
              {arr(data.cxc).filter(c => c.estado_cobro !== 'PAGADO').map(c => (
                <option key={c.id} value={c.id}>
                  CxC #{c.id} · {c.cliente} · Saldo: {money(c.saldo_pendiente)}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Monto a abonar">
            <input className="form-input" type="number" step="0.01" min="0" placeholder="0.00"
              value={pagoCxc.monto_pagado} onChange={e => setPagoCxc({ ...pagoCxc, monto_pagado: e.target.value })} />
          </Field>
          <Field label="Método">
            <select className="form-input" value={pagoCxc.metodo_pago} onChange={e => setPagoCxc({ ...pagoCxc, metodo_pago: e.target.value })}>
              <option>EFECTIVO</option><option>QR</option><option>TRANSFERENCIA</option><option>TARJETA</option>
            </select>
          </Field>
          <Field label="Observación">
            <input className="form-input" placeholder="Nota del abono" value={pagoCxc.observacion}
              onChange={e => setPagoCxc({ ...pagoCxc, observacion: e.target.value })} />
          </Field>
          <div className="actions end" style={{ gridColumn: '1 / -1' }}>
            <button className="btn btn-success" onClick={() => pagar('cxc')} disabled={!pagoCxc.id}>Registrar abono</button>
          </div>
        </div>
      </section>

      {/* Cuentas por pagar — pago */}
      <section className="panel">
        <div className="panel-header"><h3>Registrar pago en cuenta por pagar</h3></div>
        <div className="form-grid">
          <Field label="Cuenta por pagar" required>
            <select className="form-input" value={pagoCxp.id} onChange={e => setPagoCxp({ ...pagoCxp, id: e.target.value })} required>
              <option value="">Seleccione CxP pendiente...</option>
              {arr(data.cxp).filter(c => c.estado_pago !== 'PAGADO').map(c => (
                <option key={c.id} value={c.id}>
                  CxP #{c.id} · {c.proveedor} · Saldo: {money(c.saldo_pendiente)}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Monto a pagar">
            <input className="form-input" type="number" step="0.01" min="0" placeholder="0.00"
              value={pagoCxp.monto_pagado} onChange={e => setPagoCxp({ ...pagoCxp, monto_pagado: e.target.value })} />
          </Field>
          <Field label="Método">
            <select className="form-input" value={pagoCxp.metodo_pago} onChange={e => setPagoCxp({ ...pagoCxp, metodo_pago: e.target.value })}>
              <option>EFECTIVO</option><option>QR</option><option>TRANSFERENCIA</option><option>TARJETA</option>
            </select>
          </Field>
          <Field label="Observación">
            <input className="form-input" placeholder="Nota del pago" value={pagoCxp.observacion}
              onChange={e => setPagoCxp({ ...pagoCxp, observacion: e.target.value })} />
          </Field>
          <div className="actions end" style={{ gridColumn: '1 / -1' }}>
            <button className="btn btn-success" onClick={() => pagar('cxp')} disabled={!pagoCxp.id}>Registrar pago</button>
          </div>
        </div>
      </section>

      <section className="panel">
        <div className="panel-header"><h3>Cuentas por cobrar</h3></div>
        <Table columns={['ID', 'Cliente', 'Venta', 'Total', 'Saldo', 'Estado']}
          rows={arr(data.cxc).map(c => [c.id, c.cliente, c.codigo_venta || c.venta_id, money(c.monto_total), money(c.saldo_pendiente), estadoBadge(c.estado_cobro)])} />
      </section>
      <section className="panel">
        <div className="panel-header"><h3>Cuentas por pagar</h3></div>
        <Table columns={['ID', 'Proveedor', 'Compra', 'Total', 'Saldo', 'Estado']}
          rows={arr(data.cxp).map(c => [c.id, c.proveedor, c.compra_id, money(c.monto_total), money(c.saldo_pendiente), estadoBadge(c.estado_pago)])} />
      </section>
      <section className="panel">
        <div className="panel-header"><h3>Pagos registrados</h3></div>
        <Table columns={['ID', 'Tipo', 'Monto', 'Método', 'Fecha']}
          rows={arr(data.pagos).map(p => [p.id, p.tipo_flujo, money(p.monto_pagado), p.metodo_pago, p.fecha])} />
      </section>
    </Page>
    <ComprobanteModal
      isOpen={!!ventaModal}
      onClose={() => setVentaModal(null)}
      venta={ventaModal?.venta}
      factura={ventaModal?.factura}
      metodoPago={ventaModal?.venta?.metodo_pago}
      montoPagadoAmt={null}
    />
    </>
  );
}

/* ─── Facturación ────────────────────────────────────────────── */
function Facturacion() {
  const { data, error, reload } = useLoad(async () => ({
    facturas:         await getJSON('/api/billing/facturas'),
    ventasSinFactura: await getJSON('/api/billing/facturas/ventas-sin-factura'),
  }));
  const [form, setForm] = useState({ venta_id: '', nit_cliente: '', razon_social: '', url_pdf: '' });
  const [msg, setMsg]   = useState('');

  const ventaOpts = useMemo(() =>
    arr(data.ventasSinFactura).map(v => ({ value: v.id, label: `Venta #${v.id} · ${v.cliente || 'Consumidor final'} · ${money(v.total)}` })),
    [data.ventasSinFactura]
  );

  const handleVenta = (e) => {
    const vid  = e.target.value;
    const venta = arr(data.ventasSinFactura).find(v => String(v.id) === vid);
    setForm(f => ({ ...f, venta_id: vid, nit_cliente: '', razon_social: venta?.cliente || '' }));
  };

  const save = async (e) => {
    e.preventDefault();
    try {
      await postJSON('/api/billing/facturas', {
        venta_id: num(form.venta_id), nit_cliente: form.nit_cliente,
        razon_social: form.razon_social, url_pdf: form.url_pdf || null,
      });
      setMsg('Factura generada');
      setForm({ venta_id: '', nit_cliente: '', razon_social: '', url_pdf: '' });
      reload();
    } catch (err) { setMsg(err.message); }
  };

  return (
    <Page title="Facturación" subtitle="Generación de facturas por venta">
      <Alert type="error">{error}</Alert>
      <Alert type={msg.includes('Error') ? 'error' : 'success'}>{msg}</Alert>
      <section className="panel">
        <div className="panel-header"><h3>Nueva factura</h3></div>
        <form className="form-grid" onSubmit={save}>
          <Field label="Venta a facturar" required>
            <select className="form-input" value={form.venta_id} onChange={handleVenta} required>
              <option value="">Seleccione una venta sin factura...</option>
              {ventaOpts.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </Field>
          <Field label="NIT cliente">
            <input className="form-input" placeholder="NIT o CI del cliente" value={form.nit_cliente}
              onChange={e => setForm({ ...form, nit_cliente: e.target.value })} />
          </Field>
          <Field label="Razón social">
            <input className="form-input" placeholder="Nombre o razón social" value={form.razon_social}
              onChange={e => setForm({ ...form, razon_social: e.target.value })} />
          </Field>
          <Field label="URL PDF">
            <input className="form-input" placeholder="Enlace al PDF (opcional)" value={form.url_pdf}
              onChange={e => setForm({ ...form, url_pdf: e.target.value })} />
          </Field>
          <div style={{ gridColumn: '1 / -1' }}>
            <button className="btn btn-primary" type="submit" disabled={!form.venta_id}>
              Generar factura
            </button>
          </div>
        </form>
      </section>
      <section className="panel">
        <div className="panel-header"><h3>Ventas pendientes de facturar</h3></div>
        <Table columns={['Venta ID', 'Cliente', 'Total', 'Fecha']}
          rows={arr(data.ventasSinFactura).map(v => [v.id, v.cliente || 'Consumidor final', money(v.total), v.fecha])}
          empty="Todas las ventas ya tienen factura." />
      </section>
      <section className="panel">
        <div className="panel-header"><h3>Facturas emitidas</h3></div>
        <Table columns={['ID', 'Venta', 'NIT', 'Razón social', 'Número', 'Estado', 'Fecha']}
          rows={arr(data.facturas).map(f => [f.id, f.venta_id, f.nit_cliente, f.razon_social, f.numero_factura, f.estado, f.fecha_emision])} />
      </section>
    </Page>
  );
}

/* ─── Operaciones ────────────────────────────────────────────── */
function Operaciones() {
  const { data, error, reload } = useLoad(async () => ({
    devoluciones:    await getJSON('/api/operations/devoluciones-bajas'),
    transformaciones: await getJSON('/api/operations/transformaciones'),
    productos:       await getJSON('/api/catalog/productos'),
    almacenes:       await getJSON('/api/inventory/almacenes'),
  }));
  const [dev, setDev] = useState({ producto_id: '', almacen_id: '', usuario_id: 1, tipo_registro: 'DEVOLUCION_CLIENTE', cantidad: 1, motivo: '' });
  const [trf, setTrf] = useState({ insumo_producto_id: '', insumo_almacen_id: '', insumo_cantidad: 1, resultado_producto_id: '', resultado_almacen_id: '', resultado_cantidad: 1, observacion: '' });
  const [msg, setMsg] = useState('');

  const prodOpts = useMemo(() => arr(data.productos).map(p => ({ value: p.id, label: `${p.sku || p.id} - ${p.nombre}` })), [data.productos]);
  const almOpts  = useMemo(() => arr(data.almacenes).map(a => ({ value: a.id, label: a.nombre })), [data.almacenes]);

  const saveDev = async () => {
    try {
      await postJSON('/api/operations/devoluciones-bajas', { ...dev, producto_id: num(dev.producto_id), almacen_id: num(dev.almacen_id), cantidad: num(dev.cantidad), usuario_id: 1 });
      setMsg('Operación registrada'); reload();
    } catch (err) { setMsg(err.message); }
  };
  const saveTrf = async () => {
    try {
      await postJSON('/api/operations/transformaciones', { usuario_id: 1, sucursal_id: 1, observacion: trf.observacion, insumos: [{ producto_id: num(trf.insumo_producto_id), almacen_id: num(trf.insumo_almacen_id), cantidad: num(trf.insumo_cantidad), costo_unitario: 1 }], resultados: [{ producto_id: num(trf.resultado_producto_id), almacen_id: num(trf.resultado_almacen_id), cantidad: num(trf.resultado_cantidad), costo_estimado: 1 }] });
      setMsg('Transformación registrada'); reload();
    } catch (err) { setMsg(err.message); }
  };

  return (
    <Page title="Operaciones" subtitle="Devoluciones, bajas y transformaciones">
      <Alert type="error">{error}</Alert>
      <Alert type={msg.includes('Error') ? 'error' : 'success'}>{msg}</Alert>
      <section className="panel">
        <div className="panel-header"><h3>Devolución / Baja</h3></div>
        <div className="form-grid">
          <SelectField label="Producto" val={dev.producto_id} onChange={v => setDev({ ...dev, producto_id: v })} opts={prodOpts} required />
          <SelectField label="Almacén"  val={dev.almacen_id}  onChange={v => setDev({ ...dev, almacen_id: v })}  opts={almOpts}  required />
          <Field label="Cantidad"><input className="form-input" type="number" min="1" value={dev.cantidad} onChange={e => setDev({ ...dev, cantidad: e.target.value })} /></Field>
          <Field label="Tipo">
            <select className="form-input" value={dev.tipo_registro} onChange={e => setDev({ ...dev, tipo_registro: e.target.value })}>
              <option>DEVOLUCION_CLIENTE</option><option>BAJA</option><option>PERDIDA</option>
            </select>
          </Field>
          <Field label="Motivo"><input className="form-input" value={dev.motivo} onChange={e => setDev({ ...dev, motivo: e.target.value })} /></Field>
          <div className="actions end"><button className="btn btn-primary" onClick={saveDev}>Registrar</button></div>
        </div>
      </section>
      <section className="panel">
        <div className="panel-header"><h3>Transformación de insumos</h3></div>
        <div className="form-grid">
          <SelectField label="Insumo Producto"   val={trf.insumo_producto_id}   onChange={v => setTrf({ ...trf, insumo_producto_id: v })}   opts={prodOpts} required />
          <SelectField label="Insumo Almacén"    val={trf.insumo_almacen_id}    onChange={v => setTrf({ ...trf, insumo_almacen_id: v })}    opts={almOpts}  required />
          <Field label="Cantidad insumo"><input className="form-input" type="number" min="1" value={trf.insumo_cantidad} onChange={e => setTrf({ ...trf, insumo_cantidad: e.target.value })} /></Field>
          <SelectField label="Resultado Producto" val={trf.resultado_producto_id} onChange={v => setTrf({ ...trf, resultado_producto_id: v })} opts={prodOpts} required />
          <SelectField label="Resultado Almacén"  val={trf.resultado_almacen_id}  onChange={v => setTrf({ ...trf, resultado_almacen_id: v })}  opts={almOpts}  required />
          <Field label="Cantidad resultado"><input className="form-input" type="number" min="1" value={trf.resultado_cantidad} onChange={e => setTrf({ ...trf, resultado_cantidad: e.target.value })} /></Field>
          <Field label="Observación"><input className="form-input" value={trf.observacion} onChange={e => setTrf({ ...trf, observacion: e.target.value })} /></Field>
          <div className="actions end"><button className="btn btn-primary" onClick={saveTrf}>Registrar</button></div>
        </div>
      </section>
      <section className="panel"><div className="panel-header"><h3>Devoluciones / Bajas</h3></div>
        <Table columns={['ID', 'Producto', 'Tipo', 'Cantidad', 'Motivo', 'Fecha']}
          rows={arr(data.devoluciones).map(d => [d.id, d.producto, d.tipo_registro, d.cantidad, d.motivo, d.fecha])} />
      </section>
      <section className="panel"><div className="panel-header"><h3>Transformaciones</h3></div>
        <Table columns={['ID', 'Insumo', 'Resultado', 'Cantidad', 'Observación', 'Fecha']}
          rows={arr(data.transformaciones).map(t => [t.id, t.insumo_producto, t.resultado_producto, t.resultado_cantidad, t.observacion, t.fecha])} />
      </section>
    </Page>
  );
}

/* ─── Usuarios ───────────────────────────────────────────────── */
function Usuarios() {
  const { data, error, reload } = useLoad(async () => ({
    usuarios: await getJSON('/api/users/usuarios'),
    roles:    await getJSON('/api/users/roles'),
  }));
  const [form, setForm]         = useState(emptyUsuario);
  const [editingId, setEditingId] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [msg, setMsg]           = useState('');

  const rolesOpts = useMemo(() => arr(data.roles).map(r => ({ value: r.id, label: r.nombre })), [data.roles]);

  const save = async (e) => {
    e.preventDefault();
    try {
      setMsg('');
      const body = { ...form, rol_id: num(form.rol_id) };
      if (editingId) await putJSON(`/api/users/usuarios/${editingId}`, body);
      else           await postJSON('/api/users/usuarios', body);
      setForm(emptyUsuario); setEditingId(null); setModalOpen(false);
      setMsg(editingId ? 'Usuario actualizado' : 'Usuario creado');
      reload();
    } catch (err) { setMsg(err.message); }
  };

  const openCreate = () => { setEditingId(null); setForm(emptyUsuario); setModalOpen(true); };
  const openEdit   = (u)  => { setEditingId(u.id); setForm({ ...u, password: '' }); setModalOpen(true); };
  const closeModal = ()   => { setModalOpen(false); setForm(emptyUsuario); setEditingId(null); };
  const remove     = async (id) => { if (!confirm('¿Eliminar usuario?')) return; await deleteJSON(`/api/users/usuarios/${id}`); reload(); };

  return (
    <>
      <Page title="Usuarios" subtitle="Gestión de usuarios y roles del sistema">
        <Alert type="error">{error}</Alert>
        <Alert type={msg.includes('Error') ? 'error' : 'success'}>{msg}</Alert>
        <section className="panel">
          <div className="panel-header">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3>Usuarios registrados</h3>
              <button className="btn btn-primary" onClick={openCreate}>+ Nuevo usuario</button>
            </div>
          </div>
          <Table columns={['ID', 'Nombre', 'Email', 'Rol', 'Teléfono', 'Acciones']}
            rows={arr(data.usuarios).map(u => [u.id, u.nombre, u.email, u.rol || u.rol_nombre, u.telefono,
              <div className="actions">
                <button className="btn btn-primary btn-small" onClick={() => openEdit(u)}>Editar</button>
                <button className="btn btn-danger btn-small" onClick={() => remove(u.id)}>Eliminar</button>
              </div>])} />
        </section>
      </Page>
      <CrudModal isOpen={modalOpen} title={editingId ? 'Editar usuario' : 'Nuevo usuario'}
        fields={[
          { name: 'nombre',   label: 'Nombre completo', required: true },
          { name: 'email',    label: 'Email', type: 'email', required: true },
          { name: 'password', label: editingId ? 'Nueva contraseña (dejar vacío para no cambiar)' : 'Contraseña', type: 'password', required: !editingId },
          { name: 'rol_id',   label: 'Rol', type: 'select', options: rolesOpts, required: true },
          { name: 'telefono', label: 'Teléfono' },
        ]}
        form={form} setForm={setForm} editingId={editingId} onSubmit={save} onClose={closeModal} />
    </>
  );
}

export default App;
