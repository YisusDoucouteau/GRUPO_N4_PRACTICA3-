import React, { useState } from 'react';

export function Layout({ currentPage, pages, onPageChange, children }) {
  const isPos = currentPage === 'caja';
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const closeSidebar = () => setSidebarOpen(false);

  return (
    <div className="layout">
      {/* Overlay móvil */}
      {sidebarOpen && <div className="sidebar-overlay" onClick={closeSidebar} />}

      {/* Sidebar */}
      <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <button className="close-btn" onClick={closeSidebar}>✕</button>
          <div className="brand">
            <div className="brand-icon">OS</div>
            <div className="brand-text">
              <h1>OmniCommerce</h1>
              <p>Tienda de la Abuela Serafina</p>
            </div>
          </div>
        </div>

        <nav className="sidebar-nav">
          {pages.map(([id, label]) => (
            <button
              key={id}
              className={`nav-btn ${currentPage === id ? 'active' : ''}`}
              onClick={() => {
                onPageChange(id);
                closeSidebar();
              }}
            >
              {label}
            </button>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div className="gateway-info">
            <span>API Gateway</span>
            <strong>localhost:3000</strong>
          </div>
        </div>
      </aside>

      {/* Header con hamburger menu */}
      <div className="layout-wrapper">
        <header className="top-header">
          <button className="hamburger-btn" onClick={() => setSidebarOpen(!sidebarOpen)}>
            <span></span>
            <span></span>
            <span></span>
          </button>
        </header>

        {/* Contenido principal */}
        <main className={`content${isPos ? ' content-pos' : ''}`}>
          {children}
        </main>
      </div>
    </div>
  );
}
