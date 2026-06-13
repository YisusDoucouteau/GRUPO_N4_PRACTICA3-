import React, { useEffect, useMemo, useState } from 'react';
import { API_URL, getJSON, postJSON, putJSON, deleteJSON } from './api';

const pages = [
  ['dashboard', 'Dashboard'],
  ['clientes', 'Clientes'],
  ['proveedores', 'Proveedores'],
  ['catalogo', 'Catálogo'],
  ['sucursales', 'Sucursales / Almacenes'],
  ['inventario', 'Inventario'],
  ['ventas', 'Ventas'],
  ['compras', 'Compras'],
  ['finanzas', 'Finanzas'],
  ['facturacion', 'Facturación'],
  ['operaciones', 'Operaciones'],
  ['usuarios', 'Usuarios']
];

const money = (value) => `Bs ${Number(value || 0).toFixed(2)}`;
const arr = (value) => Array.isArray(value) ? value : [];
const num = (value) => Number(value || 0);

const emptyCliente = { nombre: '', nit_ci: '', direccion: '', telefono: '', correo: '' };
const emptyProveedor = { nombre: '', nit_rut: '', direccion: '', telefono: '', correo: '' };
const emptySucursal = { nombre: '', direccion: '', telefono: '' };
const emptyAlmacen = { sucursal_id: '', nombre: '', descripcion: '' };
const emptyCategoria = { nombre: '', descripcion: '' };
const emptyProducto = { categoria_id: '', sku: '', nombre: '', descripcion: '', unidad_medida: 'UNIDAD', precio_compra_referencia: 0, precio_venta: 0, stock_minimo: 0 };
const emptyUsuario = { rol_id: '', nombre: '', email: '', password: '', telefono: '' };

function App() {
  const [page, setPage] = useState('dashboard');

  return (
    <div className="layout">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-icon">OS</div>
          <div>
            <h1>OmniCommerce</h1>
            <p>Tienda de la Abuela Serafina</p>
          </div>
        </div>

        <nav>
          {pages.map(([id, label]) => (
            <button key={id} className={page === id ? 'active' : ''} onClick={() => setPage(id)}>
              {label}
            </button>
          ))}
        </nav>

        <div className="gateway">
          <span>API Gateway</span>
          <strong>{API_URL}</strong>
        </div>
      </aside>

      <main className="content">
        {page === 'dashboard' && <Dashboard />}
        {page === 'clientes' && <Clientes />}
        {page === 'proveedores' && <Proveedores />}
        {page === 'catalogo' && <Catalogo />}
        {page === 'sucursales' && <SucursalesAlmacenes />}
        {page === 'inventario' && <Inventario />}
        {page === 'ventas' && <Ventas />}
        {page === 'compras' && <Compras />}
        {page === 'finanzas' && <Finanzas />}
        {page === 'facturacion' && <Facturacion />}
        {page === 'operaciones' && <Operaciones />}
        {page === 'usuarios' && <Usuarios />}
      </main>
    </div>
  );
}

function Page({ title, subtitle, children }) {
  return (
    <>
      <header className="page-header">
        <div>
          <h2>{title}</h2>
          <p>{subtitle}</p>
        </div>
      </header>
      {children}
    </>
  );
}

function Alert({ type = 'info', children }) {
  if (!children) return null;
  return <div className={`alert ${type}`}>{children}</div>;
}

function Card({ title, value }) {
  return (
    <div className="card">
      <span>{title}</span>
      <strong>{value}</strong>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <label className="field">
      <span>{label}</span>
      {children}
    </label>
  );
}

function Table({ columns, rows }) {
  const data = arr(rows);
  if (data.length === 0) return <p className="empty">No hay datos para mostrar.</p>;

  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>{columns.map((c) => <th key={c}>{c}</th>)}</tr>
        </thead>
        <tbody>
          {data.map((row, i) => (
            <tr key={i}>{row.map((cell, j) => <td key={j}>{cell ?? '-'}</td>)}</tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function useLoad(loader, deps = []) {
  const [data, setData] = useState({});
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const load = async () => {
    try {
      setLoading(true);
      setError('');
      const result = await loader();
      setData(result || {});
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, deps);

  return { data, error, loading, reload: load };
}

function Dashboard() {
  const { data, error, loading } = useLoad(async () => {
    const [resumen, productos, stock, clientes, proveedores, facturas, usuarios] = await Promise.all([
      getJSON('/api/payments/resumen'),
      getJSON('/api/catalog/productos'),
      getJSON('/api/inventory/stock'),
      getJSON('/api/sales/clientes'),
      getJSON('/api/purchases/proveedores'),
      getJSON('/api/billing/facturas'),
      getJSON('/api/users/usuarios')
    ]);

    return { resumen, productos, stock, clientes, proveedores, facturas, usuarios };
  });

  return (
    <Page title="Dashboard" subtitle="Resumen general del sistema y consultas del administrador">
      <Alert type="error">{error}</Alert>
      <Alert type="info">{loading ? 'Cargando información del sistema...' : ''}</Alert>
      <section className="cards">
        <Card title="Productos registrados" value={arr(data.productos).length} />
        <Card title="Clientes" value={arr(data.clientes).length} />
        <Card title="Proveedores" value={arr(data.proveedores).length} />
        <Card title="Items con stock" value={arr(data.stock).length} />
        <Card title="Facturas" value={arr(data.facturas).length} />
        <Card title="Usuarios" value={arr(data.usuarios).length} />
        <Card title="Ingresos" value={money(data.resumen?.total_ingresos)} />
        <Card title="Egresos" value={money(data.resumen?.total_egresos)} />
        <Card title="Por cobrar" value={money(data.resumen?.total_por_cobrar)} />
        <Card title="Por pagar" value={money(data.resumen?.total_por_pagar)} />
      </section>
      <section className="panel">
        <h3>Estado de módulos</h3>
        <Table
          columns={['Módulo', 'Función cubierta', 'Estado']}
          rows={[
            ['Catálogo', 'Productos, categorías y precios', 'Activo'],
            ['Inventario', 'Stock por almacén, entradas, salidas y movimientos', 'Activo'],
            ['Compras', 'Compras a proveedores y bonificaciones', 'Activo'],
            ['Ventas', 'Venta, detalle, total y descuento de stock', 'Activo'],
            ['Pagos', 'Contado, parcial, cuentas por cobrar y pagar', 'Activo'],
            ['Operaciones', 'Devoluciones, bajas y transformaciones', 'Activo'],
            ['Notificaciones', 'WhatsApp/correo', 'Pendiente / futuro']
          ]}
        />
      </section>
    </Page>
  );
}

function CrudPanel({ title, subtitle, fields, form, setForm, editingId, setEditingId, onSubmit, onCancel }) {
  return (
    <section className="panel">
      <h3>{title}</h3>
      {subtitle && <p className="muted">{subtitle}</p>}
      <form className="form-grid" onSubmit={onSubmit}>
        {fields.map((field) => (
          <Field key={field.name} label={field.label}>
            {field.type === 'select' ? (
              <select value={form[field.name] ?? ''} onChange={(e) => setForm({ ...form, [field.name]: e.target.value })} required={field.required}>
                <option value="">Seleccione...</option>
                {arr(field.options).map((op) => <option key={op.value} value={op.value}>{op.label}</option>)}
              </select>
            ) : (
              <input
                type={field.type || 'text'}
                placeholder={field.placeholder || field.label}
                value={form[field.name] ?? ''}
                onChange={(e) => setForm({ ...form, [field.name]: e.target.value })}
                required={field.required}
              />
            )}
          </Field>
        ))}
        <div className="actions end">
          <button>{editingId ? 'Actualizar' : 'Guardar'}</button>
          {editingId && <button type="button" className="secondary" onClick={onCancel}>Cancelar</button>}
        </div>
      </form>
    </section>
  );
}

function Clientes() {
  const { data, error, reload } = useLoad(async () => ({ clientes: await getJSON('/api/sales/clientes') }));
  const [form, setForm] = useState(emptyCliente);
  const [editingId, setEditingId] = useState(null);
  const [msg, setMsg] = useState('');

  const save = async (e) => {
    e.preventDefault();
    try {
      setMsg('');
      if (editingId) await putJSON(`/api/sales/clientes/${editingId}`, form);
      else await postJSON('/api/sales/clientes', form);
      setForm(emptyCliente);
      setEditingId(null);
      setMsg(editingId ? 'Cliente actualizado correctamente' : 'Cliente registrado correctamente');
      reload();
    } catch (err) { setMsg(err.message); }
  };

  const edit = (c) => { setEditingId(c.id); setForm({ nombre: c.nombre || '', nit_ci: c.nit_ci || '', direccion: c.direccion || '', telefono: c.telefono || '', correo: c.correo || '' }); };
  const remove = async (id) => { if (!confirm('¿Eliminar cliente?')) return; await deleteJSON(`/api/sales/clientes/${id}`); reload(); };

  return (
    <Page title="Clientes" subtitle="Registro de clientes para ventas, fiados, WhatsApp, correo y alertas">
      <Alert type="error">{error}</Alert><Alert type={msg.includes('Error') ? 'error' : 'success'}>{msg}</Alert>
      <CrudPanel title="Formulario de cliente" form={form} setForm={setForm} editingId={editingId} setEditingId={setEditingId} onSubmit={save} onCancel={() => { setEditingId(null); setForm(emptyCliente); }} fields={[
        { name: 'nombre', label: 'Nombre completo', required: true },
        { name: 'nit_ci', label: 'NIT / CI' },
        { name: 'direccion', label: 'Dirección' },
        { name: 'telefono', label: 'Teléfono / WhatsApp' },
        { name: 'correo', label: 'Correo electrónico', type: 'email' }
      ]} />
      <section className="panel">
        <h3>Clientes registrados</h3>
        <Table columns={['ID', 'Nombre', 'NIT/CI', 'Dirección', 'Teléfono', 'Correo', 'Acciones']} rows={arr(data.clientes).map(c => [c.id, c.nombre, c.nit_ci, c.direccion, c.telefono, c.correo, <div className="actions"><button className="small" onClick={() => edit(c)}>Editar</button><button className="small danger" onClick={() => remove(c.id)}>Eliminar</button></div>])} />
      </section>
    </Page>
  );
}

function Proveedores() {
  const { data, error, reload } = useLoad(async () => ({ proveedores: await getJSON('/api/purchases/proveedores') }));
  const [form, setForm] = useState(emptyProveedor);
  const [editingId, setEditingId] = useState(null);
  const [msg, setMsg] = useState('');

  const save = async (e) => {
    e.preventDefault();
    try {
      setMsg('');
      if (editingId) await putJSON(`/api/purchases/proveedores/${editingId}`, form);
      else await postJSON('/api/purchases/proveedores', form);
      setForm(emptyProveedor);
      setEditingId(null);
      setMsg(editingId ? 'Proveedor actualizado correctamente' : 'Proveedor registrado correctamente');
      reload();
    } catch (err) { setMsg(err.message); }
  };

  const edit = (p) => { setEditingId(p.id); setForm({ nombre: p.nombre || '', nit_rut: p.nit_rut || '', direccion: p.direccion || '', telefono: p.telefono || '', correo: p.correo || '' }); };
  const remove = async (id) => { if (!confirm('¿Eliminar proveedor?')) return; await deleteJSON(`/api/purchases/proveedores/${id}`); reload(); };

  return (
    <Page title="Proveedores" subtitle="Registro de proveedores para compras, cuentas por pagar y abastecimiento">
      <Alert type="error">{error}</Alert><Alert type={msg.includes('Error') ? 'error' : 'success'}>{msg}</Alert>
      <CrudPanel title="Formulario de proveedor" form={form} setForm={setForm} editingId={editingId} setEditingId={setEditingId} onSubmit={save} onCancel={() => { setEditingId(null); setForm(emptyProveedor); }} fields={[
        { name: 'nombre', label: 'Nombre / Razón social', required: true },
        { name: 'nit_rut', label: 'NIT / RUT' },
        { name: 'direccion', label: 'Dirección' },
        { name: 'telefono', label: 'Teléfono' },
        { name: 'correo', label: 'Correo electrónico', type: 'email' }
      ]} />
      <section className="panel">
        <h3>Proveedores registrados</h3>
        <Table columns={['ID', 'Nombre', 'NIT/RUT', 'Dirección', 'Teléfono', 'Correo', 'Acciones']} rows={arr(data.proveedores).map(p => [p.id, p.nombre, p.nit_rut, p.direccion, p.telefono, p.correo, <div className="actions"><button className="small" onClick={() => edit(p)}>Editar</button><button className="small danger" onClick={() => remove(p.id)}>Eliminar</button></div>])} />
      </section>
    </Page>
  );
}

function Catalogo() {
  const { data, error, reload } = useLoad(async () => ({
    categorias: await getJSON('/api/catalog/categorias'),
    productos: await getJSON('/api/catalog/productos')
  }));
  const [catForm, setCatForm] = useState(emptyCategoria);
  const [prodForm, setProdForm] = useState(emptyProducto);
  const [editingCat, setEditingCat] = useState(null);
  const [editingProd, setEditingProd] = useState(null);
  const [msg, setMsg] = useState('');

  const categoriasOptions = useMemo(() => arr(data.categorias).map(c => ({ value: c.id, label: c.nombre })), [data.categorias]);

  const saveCategoria = async (e) => {
    e.preventDefault();
    try {
      if (editingCat) await putJSON(`/api/catalog/categorias/${editingCat}`, catForm);
      else await postJSON('/api/catalog/categorias', catForm);
      setMsg(editingCat ? 'Categoría actualizada' : 'Categoría creada');
      setEditingCat(null); setCatForm(emptyCategoria); reload();
    } catch (err) { setMsg(err.message); }
  };

  const saveProducto = async (e) => {
    e.preventDefault();
    try {
      const body = { ...prodForm, categoria_id: num(prodForm.categoria_id), precio_compra_referencia: num(prodForm.precio_compra_referencia), precio_venta: num(prodForm.precio_venta), stock_minimo: num(prodForm.stock_minimo) };
      if (editingProd) await putJSON(`/api/catalog/productos/${editingProd}`, body);
      else await postJSON('/api/catalog/productos', body);
      setMsg(editingProd ? 'Producto actualizado' : 'Producto creado');
      setEditingProd(null); setProdForm(emptyProducto); reload();
    } catch (err) { setMsg(err.message); }
  };

  return (
    <Page title="Catálogo" subtitle="CRUD de categorías, productos, precios y stock mínimo">
      <Alert type="error">{error}</Alert><Alert type="success">{msg}</Alert>
      <CrudPanel title="Categoría" form={catForm} setForm={setCatForm} editingId={editingCat} setEditingId={setEditingCat} onSubmit={saveCategoria} onCancel={() => { setEditingCat(null); setCatForm(emptyCategoria); }} fields={[{ name: 'nombre', label: 'Nombre', required: true }, { name: 'descripcion', label: 'Descripción' }]} />
      <CrudPanel title="Producto" form={prodForm} setForm={setProdForm} editingId={editingProd} setEditingId={setEditingProd} onSubmit={saveProducto} onCancel={() => { setEditingProd(null); setProdForm(emptyProducto); }} fields={[
        { name: 'categoria_id', label: 'Categoría', type: 'select', options: categoriasOptions, required: true },
        { name: 'sku', label: 'SKU / Código', required: true },
        { name: 'nombre', label: 'Producto', required: true },
        { name: 'descripcion', label: 'Descripción' },
        { name: 'unidad_medida', label: 'Unidad' },
        { name: 'precio_compra_referencia', label: 'Precio compra ref.', type: 'number' },
        { name: 'precio_venta', label: 'Precio venta', type: 'number', required: true },
        { name: 'stock_minimo', label: 'Stock mínimo', type: 'number' }
      ]} />
      <section className="panel"><h3>Categorías</h3><Table columns={['ID', 'Nombre', 'Descripción', 'Acciones']} rows={arr(data.categorias).map(c => [c.id, c.nombre, c.descripcion, <div className="actions"><button className="small" onClick={() => { setEditingCat(c.id); setCatForm({ nombre: c.nombre || '', descripcion: c.descripcion || '' }); }}>Editar</button><button className="small danger" onClick={async () => { if(confirm('¿Eliminar categoría?')) { await deleteJSON(`/api/catalog/categorias/${c.id}`); reload(); } }}>Eliminar</button></div>])} /></section>
      <section className="panel"><h3>Productos</h3><Table columns={['ID', 'SKU', 'Producto', 'Categoría', 'Unidad', 'Compra ref.', 'Venta', 'Stock mín.', 'Acciones']} rows={arr(data.productos).map(p => [p.id, p.sku, p.nombre, p.categoria, p.unidad_medida, money(p.precio_compra_referencia), money(p.precio_venta), p.stock_minimo, <div className="actions"><button className="small" onClick={() => { setEditingProd(p.id); setProdForm({ categoria_id: p.categoria_id || '', sku: p.sku || '', nombre: p.nombre || '', descripcion: p.descripcion || '', unidad_medida: p.unidad_medida || 'UNIDAD', precio_compra_referencia: p.precio_compra_referencia || 0, precio_venta: p.precio_venta || 0, stock_minimo: p.stock_minimo || 0 }); }}>Editar</button><button className="small danger" onClick={async () => { if(confirm('¿Eliminar producto?')) { await deleteJSON(`/api/catalog/productos/${p.id}`); reload(); } }}>Eliminar</button></div>])} /></section>
    </Page>
  );
}

function SucursalesAlmacenes() {
  const { data, error, reload } = useLoad(async () => ({ sucursales: await getJSON('/api/inventory/sucursales'), almacenes: await getJSON('/api/inventory/almacenes') }));
  const [sucForm, setSucForm] = useState(emptySucursal);
  const [almForm, setAlmForm] = useState(emptyAlmacen);
  const [editingSuc, setEditingSuc] = useState(null);
  const [editingAlm, setEditingAlm] = useState(null);
  const [msg, setMsg] = useState('');
  const sucOptions = useMemo(() => arr(data.sucursales).map(s => ({ value: s.id, label: s.nombre })), [data.sucursales]);

  const saveSucursal = async (e) => { e.preventDefault(); try { if (editingSuc) await putJSON(`/api/inventory/sucursales/${editingSuc}`, sucForm); else await postJSON('/api/inventory/sucursales', sucForm); setMsg(editingSuc ? 'Sucursal actualizada' : 'Sucursal creada'); setEditingSuc(null); setSucForm(emptySucursal); reload(); } catch(err) { setMsg(err.message); } };
  const saveAlmacen = async (e) => { e.preventDefault(); try { const body = { ...almForm, sucursal_id: num(almForm.sucursal_id) }; if (editingAlm) await putJSON(`/api/inventory/almacenes/${editingAlm}`, body); else await postJSON('/api/inventory/almacenes', body); setMsg(editingAlm ? 'Almacén actualizado' : 'Almacén creado'); setEditingAlm(null); setAlmForm(emptyAlmacen); reload(); } catch(err) { setMsg(err.message); } };

  return (
    <Page title="Sucursales y almacenes" subtitle="Control multisucursal y stock por ubicación">
      <Alert type="error">{error}</Alert><Alert type="success">{msg}</Alert>
      <CrudPanel title="Sucursal" form={sucForm} setForm={setSucForm} editingId={editingSuc} setEditingId={setEditingSuc} onSubmit={saveSucursal} onCancel={() => { setEditingSuc(null); setSucForm(emptySucursal); }} fields={[{ name: 'nombre', label: 'Nombre', required: true }, { name: 'direccion', label: 'Dirección' }, { name: 'telefono', label: 'Teléfono' }]} />
      <CrudPanel title="Almacén" form={almForm} setForm={setAlmForm} editingId={editingAlm} setEditingId={setEditingAlm} onSubmit={saveAlmacen} onCancel={() => { setEditingAlm(null); setAlmForm(emptyAlmacen); }} fields={[{ name: 'sucursal_id', label: 'Sucursal', type: 'select', options: sucOptions, required: true }, { name: 'nombre', label: 'Nombre almacén', required: true }, { name: 'descripcion', label: 'Descripción' }]} />
      <section className="panel"><h3>Sucursales</h3><Table columns={['ID', 'Nombre', 'Dirección', 'Teléfono', 'Acciones']} rows={arr(data.sucursales).map(s => [s.id, s.nombre, s.direccion, s.telefono, <div className="actions"><button className="small" onClick={() => { setEditingSuc(s.id); setSucForm({ nombre: s.nombre || '', direccion: s.direccion || '', telefono: s.telefono || '' }); }}>Editar</button><button className="small danger" onClick={async () => { if(confirm('¿Eliminar sucursal?')) { await deleteJSON(`/api/inventory/sucursales/${s.id}`); reload(); } }}>Eliminar</button></div>])} /></section>
      <section className="panel"><h3>Almacenes</h3><Table columns={['ID', 'Almacén', 'Sucursal', 'Descripción', 'Acciones']} rows={arr(data.almacenes).map(a => [a.id, a.nombre, a.sucursal, a.descripcion, <div className="actions"><button className="small" onClick={() => { setEditingAlm(a.id); setAlmForm({ sucursal_id: a.sucursal_id || '', nombre: a.nombre || '', descripcion: a.descripcion || '' }); }}>Editar</button><button className="small danger" onClick={async () => { if(confirm('¿Eliminar almacén?')) { await deleteJSON(`/api/inventory/almacenes/${a.id}`); reload(); } }}>Eliminar</button></div>])} /></section>
    </Page>
  );
}

function Inventario() {
  const { data, error, reload } = useLoad(async () => ({ stock: await getJSON('/api/inventory/stock'), movimientos: await getJSON('/api/inventory/stock/movimientos') }));
  const [form, setForm] = useState({ producto_id: 1, almacen_id: 1, cantidad: 1, observacion: '' });
  const [msg, setMsg] = useState('');

  const ajuste = async (tipo) => {
    try {
      await postJSON(`/api/inventory/stock/ajuste-${tipo}`, { producto_id: num(form.producto_id), almacen_id: num(form.almacen_id), cantidad: num(form.cantidad), usuario_id: 1, observacion: form.observacion });
      setMsg(tipo === 'entrada' ? 'Entrada registrada' : 'Salida registrada');
      reload();
    } catch (err) { setMsg(err.message); }
  };

  return (
    <Page title="Inventario" subtitle="Stock por almacén, entradas, salidas y movimientos">
      <Alert type="error">{error}</Alert><Alert type="success">{msg}</Alert>
      <section className="panel"><h3>Ajuste rápido de inventario</h3><div className="form-row"><input type="number" placeholder="Producto ID" value={form.producto_id} onChange={e => setForm({ ...form, producto_id: e.target.value })} /><input type="number" placeholder="Almacén ID" value={form.almacen_id} onChange={e => setForm({ ...form, almacen_id: e.target.value })} /><input type="number" placeholder="Cantidad" value={form.cantidad} onChange={e => setForm({ ...form, cantidad: e.target.value })} /><input placeholder="Observación" value={form.observacion} onChange={e => setForm({ ...form, observacion: e.target.value })} /><button onClick={() => ajuste('entrada')}>Entrada</button><button className="danger" onClick={() => ajuste('salida')}>Salida</button></div></section>
      <section className="panel"><h3>Stock actual</h3><Table columns={['ID', 'Producto', 'SKU', 'Almacén', 'Sucursal', 'Cantidad', 'Stock mínimo']} rows={arr(data.stock).map(s => [s.id, s.producto, s.sku, s.almacen, s.sucursal, s.cantidad, s.stock_minimo])} /></section>
      <section className="panel"><h3>Últimos movimientos</h3><Table columns={['ID', 'Tipo', 'Producto', 'Almacén', 'Cantidad', 'Referencia', 'Fecha']} rows={arr(data.movimientos).slice(0, 15).map(m => [m.id, m.tipo_movimiento, m.producto, m.almacen, m.cantidad, `${m.referencia_tipo || ''} ${m.referencia_id || ''}`, m.fecha])} /></section>
    </Page>
  );
}

function Ventas() {
  const { data, error, reload } = useLoad(async () => ({ clientes: await getJSON('/api/sales/clientes'), productos: await getJSON('/api/catalog/productos'), ventas: await getJSON('/api/sales/ventas') }));
  const [form, setForm] = useState({ cliente_id: 1, sucursal_id: 1, usuario_id: 1, producto_id: 1, almacen_id: 1, cantidad: 1, precio_unitario: 10, descuento: 0, condicion_pago: 'CONTADO', metodo_pago: 'EFECTIVO', monto_pagado: 0, observacion: '' });
  const [msg, setMsg] = useState('');
  const total = num(form.cantidad) * num(form.precio_unitario) - num(form.descuento);

  const save = async (e) => { e.preventDefault(); try { await postJSON('/api/sales/ventas', { cliente_id: num(form.cliente_id), usuario_id: num(form.usuario_id), sucursal_id: num(form.sucursal_id), condicion_pago: form.condicion_pago, metodo_pago: form.metodo_pago, monto_pagado: num(form.monto_pagado), observacion: form.observacion, detalles: [{ producto_id: num(form.producto_id), almacen_id: num(form.almacen_id), cantidad: num(form.cantidad), precio_unitario: num(form.precio_unitario), descuento: num(form.descuento) }] }); setMsg('Venta registrada, stock descontado y pago/deuda procesado'); reload(); } catch(err) { setMsg(err.message); } };

  return (
    <Page title="Ventas" subtitle="Registra ventas, detalle, total, pago contado/parcial o fiado">
      <Alert type="error">{error}</Alert><Alert type="success">{msg}</Alert>
      <section className="panel"><h3>Nueva venta rápida</h3><form className="form-grid" onSubmit={save}><Field label="Cliente ID"><input type="number" value={form.cliente_id} onChange={e => setForm({ ...form, cliente_id: e.target.value })} /></Field><Field label="Producto ID"><input type="number" value={form.producto_id} onChange={e => setForm({ ...form, producto_id: e.target.value })} /></Field><Field label="Almacén ID"><input type="number" value={form.almacen_id} onChange={e => setForm({ ...form, almacen_id: e.target.value })} /></Field><Field label="Cantidad"><input type="number" value={form.cantidad} onChange={e => setForm({ ...form, cantidad: e.target.value })} /></Field><Field label="Precio unitario"><input type="number" value={form.precio_unitario} onChange={e => setForm({ ...form, precio_unitario: e.target.value })} /></Field><Field label="Descuento"><input type="number" value={form.descuento} onChange={e => setForm({ ...form, descuento: e.target.value })} /></Field><Field label="Condición"><select value={form.condicion_pago} onChange={e => setForm({ ...form, condicion_pago: e.target.value })}><option>CONTADO</option><option>CREDITO</option><option>PARCIAL</option></select></Field><Field label="Método pago"><select value={form.metodo_pago} onChange={e => setForm({ ...form, metodo_pago: e.target.value })}><option>EFECTIVO</option><option>TARJETA</option><option>TRANSFERENCIA</option><option>QR</option><option>OTRO</option></select></Field><Field label="Monto pagado parcial"><input type="number" value={form.monto_pagado} onChange={e => setForm({ ...form, monto_pagado: e.target.value })} /></Field><Field label="Observación"><input value={form.observacion} onChange={e => setForm({ ...form, observacion: e.target.value })} /></Field><div className="total-box">Total: <strong>{money(total)}</strong></div><button>Registrar venta</button></form></section>
      <section className="panel"><h3>Ventas registradas</h3><Table columns={['ID', 'Cliente', 'Sucursal', 'Total', 'Condición', 'Fecha']} rows={arr(data.ventas).map(v => [v.id, v.cliente, v.sucursal, money(v.total), v.condicion_pago, v.fecha])} /></section>
      <section className="panel"><h3>Ayuda rápida</h3><p className="muted">Clientes disponibles: {arr(data.clientes).map(c => `${c.id}-${c.nombre}`).slice(0, 5).join(', ') || 'Sin clientes'}</p><p className="muted">Productos disponibles: {arr(data.productos).map(p => `${p.id}-${p.nombre}`).slice(0, 5).join(', ') || 'Sin productos'}</p></section>
    </Page>
  );
}

function Compras() {
  const { data, error, reload } = useLoad(async () => ({ proveedores: await getJSON('/api/purchases/proveedores'), productos: await getJSON('/api/catalog/productos'), compras: await getJSON('/api/purchases/compras') }));
  const [form, setForm] = useState({ proveedor_id: 1, sucursal_id: 1, usuario_id: 1, producto_id: 1, almacen_id: 1, cantidad: 10, cantidad_bonificada: 0, precio_costo: 7.5, descuento: 0, numero_documento: 'FAC-001', condicion_pago: 'CONTADO', metodo_pago: 'EFECTIVO', monto_pagado: 0, observacion: '' });
  const [msg, setMsg] = useState('');
  const total = num(form.cantidad) * num(form.precio_costo) - num(form.descuento);

  const save = async (e) => { e.preventDefault(); try { await postJSON('/api/purchases/compras', { proveedor_id: num(form.proveedor_id), usuario_id: num(form.usuario_id), sucursal_id: num(form.sucursal_id), numero_documento: form.numero_documento, condicion_pago: form.condicion_pago, metodo_pago: form.metodo_pago, monto_pagado: num(form.monto_pagado), observacion: form.observacion, detalles: [{ producto_id: num(form.producto_id), almacen_id: num(form.almacen_id), cantidad: num(form.cantidad), cantidad_bonificada: num(form.cantidad_bonificada), precio_costo: num(form.precio_costo), descuento: num(form.descuento) }] }); setMsg('Compra registrada, stock aumentado y pago/deuda procesado'); reload(); } catch(err) { setMsg(err.message); } };

  return (
    <Page title="Compras" subtitle="Registra compras a proveedores y bonificaciones">
      <Alert type="error">{error}</Alert><Alert type="success">{msg}</Alert>
      <section className="panel"><h3>Nueva compra rápida</h3><form className="form-grid" onSubmit={save}><Field label="Proveedor ID"><input type="number" value={form.proveedor_id} onChange={e => setForm({ ...form, proveedor_id: e.target.value })} /></Field><Field label="Documento"><input value={form.numero_documento} onChange={e => setForm({ ...form, numero_documento: e.target.value })} /></Field><Field label="Producto ID"><input type="number" value={form.producto_id} onChange={e => setForm({ ...form, producto_id: e.target.value })} /></Field><Field label="Almacén ID"><input type="number" value={form.almacen_id} onChange={e => setForm({ ...form, almacen_id: e.target.value })} /></Field><Field label="Cantidad comprada"><input type="number" value={form.cantidad} onChange={e => setForm({ ...form, cantidad: e.target.value })} /></Field><Field label="Bonificación"><input type="number" value={form.cantidad_bonificada} onChange={e => setForm({ ...form, cantidad_bonificada: e.target.value })} /></Field><Field label="Costo unitario"><input type="number" value={form.precio_costo} onChange={e => setForm({ ...form, precio_costo: e.target.value })} /></Field><Field label="Descuento"><input type="number" value={form.descuento} onChange={e => setForm({ ...form, descuento: e.target.value })} /></Field><Field label="Condición"><select value={form.condicion_pago} onChange={e => setForm({ ...form, condicion_pago: e.target.value })}><option>CONTADO</option><option>CREDITO</option><option>PARCIAL</option></select></Field><Field label="Método pago"><select value={form.metodo_pago} onChange={e => setForm({ ...form, metodo_pago: e.target.value })}><option>EFECTIVO</option><option>TARJETA</option><option>TRANSFERENCIA</option><option>QR</option><option>OTRO</option></select></Field><div className="total-box">Total compra: <strong>{money(total)}</strong><br />Entrada real: <strong>{num(form.cantidad) + num(form.cantidad_bonificada)}</strong></div><button>Registrar compra</button></form></section>
      <section className="panel"><h3>Compras registradas</h3><Table columns={['ID', 'Proveedor', 'Documento', 'Total', 'Condición', 'Fecha']} rows={arr(data.compras).map(c => [c.id, c.proveedor, c.numero_documento, money(c.total), c.condicion_pago, c.fecha])} /></section>
    </Page>
  );
}

function Finanzas() {
  const { data, error, reload } = useLoad(async () => ({ pagos: await getJSON('/api/payments/pagos'), cxc: await getJSON('/api/payments/cuentas-cobrar'), cxp: await getJSON('/api/payments/cuentas-pagar'), resumen: await getJSON('/api/payments/resumen') }));
  const [pagoCxc, setPagoCxc] = useState({ id: '', monto_pagado: '', metodo_pago: 'EFECTIVO', observacion: '' });
  const [pagoCxp, setPagoCxp] = useState({ id: '', monto_pagado: '', metodo_pago: 'EFECTIVO', observacion: '' });
  const [msg, setMsg] = useState('');
  const pagar = async (tipo) => { try { const form = tipo === 'cxc' ? pagoCxc : pagoCxp; const url = tipo === 'cxc' ? `/api/payments/cuentas-cobrar/${form.id}/pagar` : `/api/payments/cuentas-pagar/${form.id}/pagar`; await postJSON(url, { monto_pagado: num(form.monto_pagado), metodo_pago: form.metodo_pago, observacion: form.observacion }); setMsg('Pago registrado correctamente'); reload(); } catch(err) { setMsg(err.message); } };

  return (
    <Page title="Finanzas" subtitle="Pagos, cuentas por cobrar, cuentas por pagar y amortizaciones">
      <Alert type="error">{error}</Alert><Alert type="success">{msg}</Alert>
      <section className="cards"><Card title="Ingresos" value={money(data.resumen?.total_ingresos)} /><Card title="Egresos" value={money(data.resumen?.total_egresos)} /><Card title="Saldo por cobrar" value={money(data.resumen?.total_por_cobrar)} /><Card title="Saldo por pagar" value={money(data.resumen?.total_por_pagar)} /></section>
      <section className="panel"><h3>Amortizar cuenta por cobrar</h3><div className="form-row"><input placeholder="ID CxC" value={pagoCxc.id} onChange={e => setPagoCxc({ ...pagoCxc, id: e.target.value })} /><input placeholder="Monto" type="number" value={pagoCxc.monto_pagado} onChange={e => setPagoCxc({ ...pagoCxc, monto_pagado: e.target.value })} /><select value={pagoCxc.metodo_pago} onChange={e => setPagoCxc({ ...pagoCxc, metodo_pago: e.target.value })}><option>EFECTIVO</option><option>QR</option><option>TRANSFERENCIA</option></select><input placeholder="Observación" value={pagoCxc.observacion} onChange={e => setPagoCxc({ ...pagoCxc, observacion: e.target.value })} /><button onClick={() => pagar('cxc')}>Registrar abono</button></div></section>
      <section className="panel"><h3>Amortizar cuenta por pagar</h3><div className="form-row"><input placeholder="ID CxP" value={pagoCxp.id} onChange={e => setPagoCxp({ ...pagoCxp, id: e.target.value })} /><input placeholder="Monto" type="number" value={pagoCxp.monto_pagado} onChange={e => setPagoCxp({ ...pagoCxp, monto_pagado: e.target.value })} /><select value={pagoCxp.metodo_pago} onChange={e => setPagoCxp({ ...pagoCxp, metodo_pago: e.target.value })}><option>EFECTIVO</option><option>QR</option><option>TRANSFERENCIA</option></select><input placeholder="Observación" value={pagoCxp.observacion} onChange={e => setPagoCxp({ ...pagoCxp, observacion: e.target.value })} /><button onClick={() => pagar('cxp')}>Registrar pago</button></div></section>
      <section className="panel"><h3>Cuentas por cobrar</h3><Table columns={['ID', 'Cliente', 'Venta', 'Total', 'Saldo', 'Estado']} rows={arr(data.cxc).map(c => [c.id, c.cliente, c.venta_id, money(c.monto_total), money(c.saldo_pendiente), c.estado_cobro])} /></section>
      <section className="panel"><h3>Cuentas por pagar</h3><Table columns={['ID', 'Proveedor', 'Compra', 'Total', 'Saldo', 'Estado']} rows={arr(data.cxp).map(c => [c.id, c.proveedor, c.compra_id, money(c.monto_total), money(c.saldo_pendiente), c.estado_pago])} /></section>
      <section className="panel"><h3>Pagos registrados</h3><Table columns={['ID', 'Tipo', 'Monto', 'Método', 'Fecha']} rows={arr(data.pagos).map(p => [p.id, p.tipo_flujo, money(p.monto_pagado), p.metodo_pago, p.fecha])} /></section>
    </Page>
  );
}

function Facturacion() {
  const { data, error, reload } = useLoad(async () => ({ facturas: await getJSON('/api/billing/facturas'), ventasSinFactura: await getJSON('/api/billing/facturas/ventas-sin-factura') }));
  const [form, setForm] = useState({ venta_id: '', nit_cliente: '', razon_social: '', url_pdf: '' });
  const [msg, setMsg] = useState('');
  const save = async (e) => { e.preventDefault(); try { await postJSON('/api/billing/facturas', { venta_id: num(form.venta_id), nit_cliente: form.nit_cliente, razon_social: form.razon_social, url_pdf: form.url_pdf || null }); setMsg('Factura generada correctamente'); setForm({ venta_id: '', nit_cliente: '', razon_social: '', url_pdf: '' }); reload(); } catch(err) { setMsg(err.message); } };

  return (
    <Page title="Facturación" subtitle="Generación de factura o comprobante por venta">
      <Alert type="error">{error}</Alert><Alert type="success">{msg}</Alert>
      <section className="panel"><h3>Nueva factura</h3><form className="form-row" onSubmit={save}><input placeholder="Venta ID" value={form.venta_id} onChange={e => setForm({ ...form, venta_id: e.target.value })} /><input placeholder="NIT cliente" value={form.nit_cliente} onChange={e => setForm({ ...form, nit_cliente: e.target.value })} /><input placeholder="Razón social" value={form.razon_social} onChange={e => setForm({ ...form, razon_social: e.target.value })} /><input placeholder="URL PDF opcional" value={form.url_pdf} onChange={e => setForm({ ...form, url_pdf: e.target.value })} /><button>Generar</button></form></section>
      <section className="panel"><h3>Ventas sin factura</h3><Table columns={['Venta ID', 'Cliente', 'Total', 'Fecha']} rows={arr(data.ventasSinFactura).map(v => [v.id, v.cliente, money(v.total), v.fecha])} /></section>
      <section className="panel"><h3>Facturas</h3><Table columns={['ID', 'Venta', 'NIT', 'Razón social', 'Número', 'Estado', 'Fecha']} rows={arr(data.facturas).map(f => [f.id, f.venta_id, f.nit_cliente, f.razon_social, f.numero_factura, f.estado, f.fecha_emision])} /></section>
    </Page>
  );
}

function Operaciones() {
  const { data, error, reload } = useLoad(async () => ({ devoluciones: await getJSON('/api/operations/devoluciones-bajas'), transformaciones: await getJSON('/api/operations/transformaciones') }));
  const [dev, setDev] = useState({ producto_id: 1, almacen_id: 1, usuario_id: 1, tipo_registro: 'DEVOLUCION_CLIENTE', cantidad: 1, motivo: '' });
  const [trf, setTrf] = useState({ insumo_producto_id: 1, insumo_almacen_id: 1, insumo_cantidad: 1, resultado_producto_id: 2, resultado_almacen_id: 1, resultado_cantidad: 1, observacion: '' });
  const [msg, setMsg] = useState('');
  const saveDev = async () => { try { await postJSON('/api/operations/devoluciones-bajas', { ...dev, producto_id: num(dev.producto_id), almacen_id: num(dev.almacen_id), usuario_id: num(dev.usuario_id), cantidad: num(dev.cantidad) }); setMsg('Operación registrada'); reload(); } catch(err) { setMsg(err.message); } };
  const saveTrf = async () => { try { await postJSON('/api/operations/transformaciones', { usuario_id: 1, sucursal_id: 1, observacion: trf.observacion, insumos: [{ producto_id: num(trf.insumo_producto_id), almacen_id: num(trf.insumo_almacen_id), cantidad: num(trf.insumo_cantidad), costo_unitario: 1 }], resultados: [{ producto_id: num(trf.resultado_producto_id), almacen_id: num(trf.resultado_almacen_id), cantidad: num(trf.resultado_cantidad), costo_estimado: 1 }] }); setMsg('Transformación registrada'); reload(); } catch(err) { setMsg(err.message); } };

  return (
    <Page title="Operaciones" subtitle="Devoluciones, bajas, pérdidas, vencimientos y transformaciones">
      <Alert type="error">{error}</Alert><Alert type="success">{msg}</Alert>
      <section className="panel"><h3>Devolución o baja</h3><div className="form-row"><input type="number" placeholder="Producto ID" value={dev.producto_id} onChange={e => setDev({ ...dev, producto_id: e.target.value })} /><input type="number" placeholder="Almacén ID" value={dev.almacen_id} onChange={e => setDev({ ...dev, almacen_id: e.target.value })} /><select value={dev.tipo_registro} onChange={e => setDev({ ...dev, tipo_registro: e.target.value })}><option>DEVOLUCION_CLIENTE</option><option>BAJA_VENCIMIENTO</option><option>BAJA_PERDIDA</option><option>BAJA_ROBO</option></select><input type="number" placeholder="Cantidad" value={dev.cantidad} onChange={e => setDev({ ...dev, cantidad: e.target.value })} /><input placeholder="Motivo" value={dev.motivo} onChange={e => setDev({ ...dev, motivo: e.target.value })} /><button onClick={saveDev}>Registrar</button></div></section>
      <section className="panel"><h3>Transformación rápida</h3><div className="form-row"><input type="number" placeholder="Insumo producto ID" value={trf.insumo_producto_id} onChange={e => setTrf({ ...trf, insumo_producto_id: e.target.value })} /><input type="number" placeholder="Cantidad insumo" value={trf.insumo_cantidad} onChange={e => setTrf({ ...trf, insumo_cantidad: e.target.value })} /><input type="number" placeholder="Resultado producto ID" value={trf.resultado_producto_id} onChange={e => setTrf({ ...trf, resultado_producto_id: e.target.value })} /><input type="number" placeholder="Cantidad resultado" value={trf.resultado_cantidad} onChange={e => setTrf({ ...trf, resultado_cantidad: e.target.value })} /><input placeholder="Observación" value={trf.observacion} onChange={e => setTrf({ ...trf, observacion: e.target.value })} /><button onClick={saveTrf}>Transformar</button></div></section>
      <section className="panel"><h3>Devoluciones y bajas</h3><Table columns={['ID', 'Tipo', 'Producto', 'Almacén', 'Cantidad', 'Motivo', 'Fecha']} rows={arr(data.devoluciones).map(d => [d.id, d.tipo_registro, d.producto, d.almacen, d.cantidad, d.motivo, d.fecha])} /></section>
      <section className="panel"><h3>Transformaciones</h3><Table columns={['ID', 'Código', 'Sucursal', 'Usuario', 'Estado', 'Fecha']} rows={arr(data.transformaciones).map(t => [t.id, t.codigo, t.sucursal, t.usuario, t.estado_transformacion, t.fecha])} /></section>
    </Page>
  );
}

function Usuarios() {
  const { data, error, reload } = useLoad(async () => ({ roles: await getJSON('/api/users/roles'), usuarios: await getJSON('/api/users/usuarios') }));
  const [form, setForm] = useState(emptyUsuario);
  const [editingId, setEditingId] = useState(null);
  const [msg, setMsg] = useState('');
  const rolesOptions = useMemo(() => arr(data.roles).map(r => ({ value: r.id, label: r.nombre })), [data.roles]);
  const save = async (e) => { e.preventDefault(); try { const body = { ...form, rol_id: num(form.rol_id) }; if (editingId) await putJSON(`/api/users/usuarios/${editingId}`, body); else await postJSON('/api/users/usuarios', body); setMsg(editingId ? 'Usuario actualizado' : 'Usuario creado'); setEditingId(null); setForm(emptyUsuario); reload(); } catch(err) { setMsg(err.message); } };
  return (
    <Page title="Usuarios" subtitle="Usuarios, roles y acceso administrativo básico">
      <Alert type="error">{error}</Alert><Alert type="success">{msg}</Alert>
      <CrudPanel title="Usuario" form={form} setForm={setForm} editingId={editingId} setEditingId={setEditingId} onSubmit={save} onCancel={() => { setEditingId(null); setForm(emptyUsuario); }} fields={[{ name: 'rol_id', label: 'Rol', type: 'select', options: rolesOptions, required: true }, { name: 'nombre', label: 'Nombre', required: true }, { name: 'email', label: 'Correo', type: 'email', required: true }, { name: 'password', label: editingId ? 'Nueva contraseña opcional' : 'Contraseña', type: 'password' }, { name: 'telefono', label: 'Teléfono' }]} />
      <section className="panel"><h3>Usuarios registrados</h3><Table columns={['ID', 'Nombre', 'Correo', 'Rol', 'Teléfono', 'Acciones']} rows={arr(data.usuarios).map(u => [u.id, u.nombre, u.email, u.rol, u.telefono, <div className="actions"><button className="small" onClick={() => { setEditingId(u.id); setForm({ rol_id: u.rol_id || '', nombre: u.nombre || '', email: u.email || '', password: '', telefono: u.telefono || '' }); }}>Editar</button><button className="small danger" onClick={async () => { if(confirm('¿Eliminar usuario?')) { await deleteJSON(`/api/users/usuarios/${u.id}`); reload(); } }}>Eliminar</button></div>])} /></section>
      <section className="panel"><h3>Roles</h3><Table columns={['ID', 'Rol', 'Descripción']} rows={arr(data.roles).map(r => [r.id, r.nombre, r.descripcion])} /></section>
    </Page>
  );
}

export default App;
