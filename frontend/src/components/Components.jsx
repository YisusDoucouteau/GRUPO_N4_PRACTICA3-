import React from 'react';

export function Page({ title, subtitle, children }) {
  return (
    <>
      <header className="page-header">
        <div className="page-header-content">
          <h2>{title}</h2>
          {subtitle && <p className="subtitle">{subtitle}</p>}
        </div>
      </header>
      {children}
    </>
  );
}

export function Alert({ type = 'info', children }) {
  if (!children) return null;
  return (
    <div className={`alert alert-${type}`} role="alert">
      <span className="alert-icon">
        {type === 'error' ? '✕' : type === 'success' ? '✓' : 'ℹ'}
      </span>
      <span>{children}</span>
    </div>
  );
}

export function Card({ title, value, icon, trend, onClick }) {
  const cls = onClick ? 'card card-interactive' : 'card';
  return (
    <div
      className={cls}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={onClick ? (e) => e.key === 'Enter' && onClick() : undefined}
    >
      {icon && <div className="card-icon">{icon}</div>}
      <div className="card-content">
        <span className="card-label">{title}</span>
        <strong className="card-value">{value}</strong>
        {trend && (
          <small className={`card-trend ${trend > 0 ? 'positive' : 'negative'}`}>
            {trend > 0 ? '↑' : '↓'} {Math.abs(trend)}%
          </small>
        )}
      </div>
      {onClick && <div className="card-arrow">→</div>}
    </div>
  );
}

export function Field({ label, error, children, required }) {
  return (
    <label className="field">
      <div className="field-header">
        <span className="field-label">{label}</span>
        {required && <span className="required">*</span>}
      </div>
      {children}
      {error && <span className="field-error">{error}</span>}
    </label>
  );
}

export function Table({ columns, rows, loading, empty = 'No hay datos para mostrar.' }) {
  const data = Array.isArray(rows) ? rows : [];
  if (loading) return <div className="table-loading">Cargando...</div>;
  if (data.length === 0) return <p className="empty-state">{empty}</p>;
  return (
    <div className="table-responsive">
      <table className="data-table">
        <thead>
          <tr>{columns.map((col) => <th key={col}>{col}</th>)}</tr>
        </thead>
        <tbody>
          {data.map((row, i) => (
            <tr key={i}>
              {row.map((cell, j) => (
                <td key={j} data-label={columns[j]}>{cell ?? '-'}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function CrudPanel({ title, subtitle, fields, form, setForm, editingId, onSubmit, onCancel }) {
  return (
    <section className="panel">
      <div className="panel-header">
        <h3>{title}</h3>
        {subtitle && <p className="panel-subtitle">{subtitle}</p>}
      </div>
      <form className="form-grid" onSubmit={onSubmit}>
        {fields.map((field) => (
          <Field key={field.name} label={field.label} required={field.required}>
            {field.type === 'select' ? (
              <select
                className="form-input"
                value={form[field.name] ?? ''}
                onChange={(e) => setForm({ ...form, [field.name]: e.target.value })}
                required={field.required}
              >
                <option value="">Seleccione...</option>
                {Array.isArray(field.options) && field.options.map((op) => (
                  <option key={op.value} value={op.value}>{op.label}</option>
                ))}
              </select>
            ) : (
              <input
                className="form-input"
                type={field.type || 'text'}
                placeholder={field.placeholder || field.label}
                value={form[field.name] ?? ''}
                onChange={(e) => setForm({ ...form, [field.name]: e.target.value })}
                required={field.required}
              />
            )}
          </Field>
        ))}
        <div className="form-actions">
          <button className="btn btn-primary" type="submit">
            {editingId ? 'Actualizar' : 'Guardar'}
          </button>
          {editingId && (
            <button type="button" className="btn btn-secondary" onClick={onCancel}>
              Cancelar
            </button>
          )}
        </div>
      </form>
    </section>
  );
}

/* ─── Modal genérico ─────────────────────────────────────────── */
export function Modal({ isOpen, title, children, onClose, onConfirm, confirmText = 'Confirmar' }) {
  if (!isOpen) return null;
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{title}</h2>
          <button className="modal-close" type="button" onClick={onClose}>✕</button>
        </div>
        <div className="modal-body">{children}</div>
        <div className="modal-footer">
          <button className="btn btn-secondary" type="button" onClick={onClose}>Cancelar</button>
          <button className="btn btn-primary" type="button" onClick={onConfirm}>{confirmText}</button>
        </div>
      </div>
    </div>
  );
}

/* ─── CrudModal ──────────────────────────────────────────────── */
export function CrudModal({ isOpen, title, fields, form, setForm, editingId, onSubmit, onClose }) {
  if (!isOpen) return null;

  const renderInput = (field) => {
    if (field.type === 'select') {
      return (
        <select
          className="form-input"
          value={form[field.name] ?? ''}
          onChange={(e) => setForm({ ...form, [field.name]: e.target.value })}
          required={field.required}
        >
          <option value="">Seleccione...</option>
          {Array.isArray(field.options) && field.options.map((op) => (
            <option key={op.value} value={op.value}>{op.label}</option>
          ))}
        </select>
      );
    }
    return (
      <input
        className="form-input"
        type={field.type || 'text'}
        placeholder={field.placeholder || field.label}
        value={form[field.name] ?? ''}
        onChange={(e) => setForm({ ...form, [field.name]: e.target.value })}
        required={field.required}
      />
    );
  };

  return (
    /* El modal es HIJO del overlay — el overlay lo centra con flexbox */
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{title}</h2>
          <button className="modal-close" type="button" onClick={onClose}>✕</button>
        </div>
        <form className="modal-body" onSubmit={onSubmit}>
          {fields.map((field) => (
            <Field key={field.name} label={field.label} required={field.required}>
              {renderInput(field)}
            </Field>
          ))}
        </form>
        <div className="modal-footer">
          <button className="btn btn-secondary" type="button" onClick={onClose}>Cancelar</button>
          <button className="btn btn-primary" type="button" onClick={onSubmit}>
            {editingId ? 'Actualizar' : 'Crear'}
          </button>
        </div>
      </div>
    </div>
  );
}

export function Badge({ text, variant = 'primary' }) {
  return <span className={`badge badge-${variant}`}>{text}</span>;
}

export function Loading() {
  return (
    <div className="loading-spinner">
      <div className="spinner"></div>
      <p>Cargando...</p>
    </div>
  );
}
