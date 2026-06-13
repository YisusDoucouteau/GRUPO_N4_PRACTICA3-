-- ============================================================
-- DB OMNICOMMERCE V3 COMPATIBLE - Lista para importar y programar
-- Proyecto: Tienda de la Abuela Serafina / Omnicommerce
-- Motor recomendado: MySQL 8+ / MariaDB compatible con phpMyAdmin
-- ============================================================

CREATE DATABASE IF NOT EXISTS db_omnicommerce
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE db_omnicommerce;

SET FOREIGN_KEY_CHECKS = 0;

DROP TABLE IF EXISTS transformacion_resultados;
DROP TABLE IF EXISTS transformacion_insumos;
DROP TABLE IF EXISTS transformaciones;
DROP TABLE IF EXISTS devoluciones_bajas;
DROP TABLE IF EXISTS facturas;
DROP TABLE IF EXISTS pagos;
DROP TABLE IF EXISTS cuentas_por_pagar;
DROP TABLE IF EXISTS cuentas_por_cobrar;
DROP TABLE IF EXISTS detalles_compra;
DROP TABLE IF EXISTS compras;
DROP TABLE IF EXISTS detalles_venta;
DROP TABLE IF EXISTS ventas;
DROP TABLE IF EXISTS promociones_sucursales;
DROP TABLE IF EXISTS promociones_categorias;
DROP TABLE IF EXISTS promociones_productos;
DROP TABLE IF EXISTS promociones;
DROP TABLE IF EXISTS movimientos_inventario;
DROP TABLE IF EXISTS inventario;
DROP TABLE IF EXISTS productos;
DROP TABLE IF EXISTS categorias;
DROP TABLE IF EXISTS almacenes;
DROP TABLE IF EXISTS sucursales;
DROP TABLE IF EXISTS proveedores;
DROP TABLE IF EXISTS clientes;
DROP TABLE IF EXISTS usuarios;
DROP TABLE IF EXISTS roles;

SET FOREIGN_KEY_CHECKS = 1;

-- ============================================================
-- 1. SEGURIDAD
-- ============================================================

CREATE TABLE roles (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(50) NOT NULL UNIQUE,
    descripcion VARCHAR(255),
    estado TINYINT(1) NOT NULL DEFAULT 1,
    creado_en TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    actualizado_en TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE usuarios (
    id INT AUTO_INCREMENT PRIMARY KEY,
    rol_id INT NOT NULL,
    nombre VARCHAR(150) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    telefono VARCHAR(20),
    estado TINYINT(1) NOT NULL DEFAULT 1,
    creado_en TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    actualizado_en TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_usuarios_roles
        FOREIGN KEY (rol_id) REFERENCES roles(id)
        ON UPDATE CASCADE ON DELETE RESTRICT
) ENGINE=InnoDB;

CREATE INDEX idx_usuarios_rol_id ON usuarios(rol_id);

-- ============================================================
-- 2. CLIENTES Y PROVEEDORES
-- ============================================================

CREATE TABLE clientes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(150) NOT NULL,
    nit_ci VARCHAR(50),
    direccion VARCHAR(255),
    telefono VARCHAR(20),
    correo VARCHAR(100),
    estado TINYINT(1) NOT NULL DEFAULT 1,
    creado_en TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    actualizado_en TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE INDEX idx_clientes_nombre ON clientes(nombre);

CREATE TABLE proveedores (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(150) NOT NULL,
    nit_rut VARCHAR(50) UNIQUE,
    direccion VARCHAR(255),
    telefono VARCHAR(20),
    correo VARCHAR(100),
    estado TINYINT(1) NOT NULL DEFAULT 1,
    creado_en TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    actualizado_en TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE INDEX idx_proveedores_nombre ON proveedores(nombre);

-- ============================================================
-- 3. SUCURSALES Y ALMACENES
-- ============================================================

CREATE TABLE sucursales (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL UNIQUE,
    direccion VARCHAR(255),
    telefono VARCHAR(20),
    estado TINYINT(1) NOT NULL DEFAULT 1,
    creado_en TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    actualizado_en TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE almacenes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    sucursal_id INT NOT NULL,
    nombre VARCHAR(100) NOT NULL,
    descripcion VARCHAR(255),
    estado TINYINT(1) NOT NULL DEFAULT 1,
    creado_en TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    actualizado_en TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT uq_almacen_sucursal_nombre UNIQUE (sucursal_id, nombre),
    CONSTRAINT fk_almacenes_sucursales
        FOREIGN KEY (sucursal_id) REFERENCES sucursales(id)
        ON UPDATE CASCADE ON DELETE RESTRICT
) ENGINE=InnoDB;

CREATE INDEX idx_almacenes_sucursal_id ON almacenes(sucursal_id);

-- ============================================================
-- 4. CATALOGO DE PRODUCTOS
-- ============================================================

CREATE TABLE categorias (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL UNIQUE,
    descripcion VARCHAR(255),
    estado TINYINT(1) NOT NULL DEFAULT 1,
    creado_en TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    actualizado_en TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE productos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    categoria_id INT NOT NULL,
    sku VARCHAR(50) NOT NULL UNIQUE,
    nombre VARCHAR(150) NOT NULL,
    descripcion TEXT,
    unidad_medida ENUM('UNIDAD', 'KG', 'GRAMO', 'LITRO', 'ML', 'CAJA', 'PAQUETE') NOT NULL DEFAULT 'UNIDAD',
    precio_compra_referencia DECIMAL(10,2) NOT NULL DEFAULT 0,
    precio_venta DECIMAL(10,2) NOT NULL,
    stock_minimo DECIMAL(10,2) NOT NULL DEFAULT 0,
    estado TINYINT(1) NOT NULL DEFAULT 1,
    creado_en TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    actualizado_en TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_productos_categorias
        FOREIGN KEY (categoria_id) REFERENCES categorias(id)
        ON UPDATE CASCADE ON DELETE RESTRICT
) ENGINE=InnoDB;

CREATE INDEX idx_productos_categoria_id ON productos(categoria_id);
CREATE INDEX idx_productos_nombre ON productos(nombre);

-- ============================================================
-- 5. INVENTARIO
-- ============================================================

CREATE TABLE inventario (
    id INT AUTO_INCREMENT PRIMARY KEY,
    producto_id INT NOT NULL,
    almacen_id INT NOT NULL,
    cantidad DECIMAL(10,2) NOT NULL DEFAULT 0,
    ultima_actualizacion TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    estado TINYINT(1) NOT NULL DEFAULT 1,
    CONSTRAINT uq_inventario_producto_almacen UNIQUE (producto_id, almacen_id),
    CONSTRAINT fk_inventario_productos
        FOREIGN KEY (producto_id) REFERENCES productos(id)
        ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT fk_inventario_almacenes
        FOREIGN KEY (almacen_id) REFERENCES almacenes(id)
        ON UPDATE CASCADE ON DELETE RESTRICT
) ENGINE=InnoDB;

CREATE INDEX idx_inventario_producto_id ON inventario(producto_id);
CREATE INDEX idx_inventario_almacen_id ON inventario(almacen_id);

CREATE TABLE movimientos_inventario (
    id INT AUTO_INCREMENT PRIMARY KEY,
    inventario_id INT NOT NULL,
    tipo_movimiento ENUM(
        'ENTRADA_COMPRA',
        'SALIDA_VENTA',
        'DEVOLUCION_CLIENTE',
        'BAJA_VENCIMIENTO',
        'BAJA_PERDIDA',
        'BAJA_ROBO',
        'AJUSTE_ENTRADA',
        'AJUSTE_SALIDA',
        'TRANSFORMACION_ENTRADA',
        'TRANSFORMACION_SALIDA'
    ) NOT NULL,
    referencia_tipo ENUM('COMPRA', 'VENTA', 'DEVOLUCION_BAJA', 'AJUSTE', 'TRANSFORMACION') NOT NULL,
    referencia_id INT NULL,
    cantidad DECIMAL(10,2) NOT NULL,
    stock_anterior DECIMAL(10,2) NOT NULL DEFAULT 0,
    stock_nuevo DECIMAL(10,2) NOT NULL DEFAULT 0,
    observacion VARCHAR(255),
    fecha TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    estado TINYINT(1) NOT NULL DEFAULT 1,
    CONSTRAINT fk_movimientos_inventario
        FOREIGN KEY (inventario_id) REFERENCES inventario(id)
        ON UPDATE CASCADE ON DELETE RESTRICT
) ENGINE=InnoDB;

CREATE INDEX idx_movimientos_inventario_id ON movimientos_inventario(inventario_id);
CREATE INDEX idx_movimientos_referencia ON movimientos_inventario(referencia_tipo, referencia_id);

-- ============================================================
-- 6. PROMOCIONES
-- ============================================================

CREATE TABLE promociones (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    tipo_descuento ENUM('PORCENTAJE', 'MONTO_FIJO', 'BONIFICACION') NOT NULL,
    valor DECIMAL(10,2) NOT NULL,
    fecha_inicio DATETIME NOT NULL,
    fecha_fin DATETIME NOT NULL,
    codigo_cupon VARCHAR(50) UNIQUE,
    estado TINYINT(1) NOT NULL DEFAULT 1,
    creado_en TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    actualizado_en TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE promociones_productos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    promocion_id INT NOT NULL,
    producto_id INT NOT NULL,
    estado TINYINT(1) NOT NULL DEFAULT 1,
    CONSTRAINT uq_promocion_producto UNIQUE (promocion_id, producto_id),
    CONSTRAINT fk_promo_prod_promociones
        FOREIGN KEY (promocion_id) REFERENCES promociones(id)
        ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT fk_promo_prod_productos
        FOREIGN KEY (producto_id) REFERENCES productos(id)
        ON UPDATE CASCADE ON DELETE RESTRICT
) ENGINE=InnoDB;

CREATE TABLE promociones_categorias (
    id INT AUTO_INCREMENT PRIMARY KEY,
    promocion_id INT NOT NULL,
    categoria_id INT NOT NULL,
    estado TINYINT(1) NOT NULL DEFAULT 1,
    CONSTRAINT uq_promocion_categoria UNIQUE (promocion_id, categoria_id),
    CONSTRAINT fk_promo_cat_promociones
        FOREIGN KEY (promocion_id) REFERENCES promociones(id)
        ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT fk_promo_cat_categorias
        FOREIGN KEY (categoria_id) REFERENCES categorias(id)
        ON UPDATE CASCADE ON DELETE RESTRICT
) ENGINE=InnoDB;

CREATE TABLE promociones_sucursales (
    id INT AUTO_INCREMENT PRIMARY KEY,
    promocion_id INT NOT NULL,
    sucursal_id INT NOT NULL,
    estado TINYINT(1) NOT NULL DEFAULT 1,
    CONSTRAINT uq_promocion_sucursal UNIQUE (promocion_id, sucursal_id),
    CONSTRAINT fk_promo_suc_promociones
        FOREIGN KEY (promocion_id) REFERENCES promociones(id)
        ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT fk_promo_suc_sucursales
        FOREIGN KEY (sucursal_id) REFERENCES sucursales(id)
        ON UPDATE CASCADE ON DELETE RESTRICT
) ENGINE=InnoDB;

-- ============================================================
-- 7. VENTAS
-- ============================================================

CREATE TABLE ventas (
    id INT AUTO_INCREMENT PRIMARY KEY,
    codigo VARCHAR(30) NOT NULL UNIQUE,
    cliente_id INT NULL,
    usuario_id INT NOT NULL,
    sucursal_id INT NOT NULL,
    promocion_id INT NULL,
    subtotal DECIMAL(10,2) NOT NULL DEFAULT 0,
    descuento DECIMAL(10,2) NOT NULL DEFAULT 0,
    total DECIMAL(10,2) NOT NULL DEFAULT 0,
    condicion_pago ENUM('CONTADO', 'PARCIAL', 'CREDITO') NOT NULL DEFAULT 'CONTADO',
    estado_pago ENUM('PENDIENTE', 'PARCIAL', 'PAGADO') NOT NULL DEFAULT 'PAGADO',
    estado_venta ENUM('BORRADOR', 'COMPLETADA', 'ANULADA') NOT NULL DEFAULT 'COMPLETADA',
    observacion VARCHAR(255),
    fecha TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    estado TINYINT(1) NOT NULL DEFAULT 1,
    CONSTRAINT fk_ventas_clientes
        FOREIGN KEY (cliente_id) REFERENCES clientes(id)
        ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT fk_ventas_usuarios
        FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
        ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT fk_ventas_sucursales
        FOREIGN KEY (sucursal_id) REFERENCES sucursales(id)
        ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT fk_ventas_promociones
        FOREIGN KEY (promocion_id) REFERENCES promociones(id)
        ON UPDATE CASCADE ON DELETE RESTRICT
) ENGINE=InnoDB;

CREATE INDEX idx_ventas_cliente_id ON ventas(cliente_id);
CREATE INDEX idx_ventas_usuario_id ON ventas(usuario_id);
CREATE INDEX idx_ventas_sucursal_id ON ventas(sucursal_id);
CREATE INDEX idx_ventas_fecha ON ventas(fecha);

CREATE TABLE detalles_venta (
    id INT AUTO_INCREMENT PRIMARY KEY,
    venta_id INT NOT NULL,
    producto_id INT NOT NULL,
    almacen_id INT NOT NULL,
    promocion_id INT NULL,
    cantidad DECIMAL(10,2) NOT NULL,
    precio_unitario DECIMAL(10,2) NOT NULL,
    descuento DECIMAL(10,2) NOT NULL DEFAULT 0,
    subtotal DECIMAL(10,2) NOT NULL,
    estado TINYINT(1) NOT NULL DEFAULT 1,
    CONSTRAINT fk_det_venta_ventas
        FOREIGN KEY (venta_id) REFERENCES ventas(id)
        ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT fk_det_venta_productos
        FOREIGN KEY (producto_id) REFERENCES productos(id)
        ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT fk_det_venta_almacenes
        FOREIGN KEY (almacen_id) REFERENCES almacenes(id)
        ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT fk_det_venta_promociones
        FOREIGN KEY (promocion_id) REFERENCES promociones(id)
        ON UPDATE CASCADE ON DELETE RESTRICT
) ENGINE=InnoDB;

CREATE INDEX idx_det_venta_venta_id ON detalles_venta(venta_id);
CREATE INDEX idx_det_venta_producto_id ON detalles_venta(producto_id);
CREATE INDEX idx_det_venta_almacen_id ON detalles_venta(almacen_id);

-- ============================================================
-- 8. COMPRAS
-- ============================================================

CREATE TABLE compras (
    id INT AUTO_INCREMENT PRIMARY KEY,
    codigo VARCHAR(30) NOT NULL UNIQUE,
    proveedor_id INT NOT NULL,
    usuario_id INT NOT NULL,
    sucursal_id INT NOT NULL,
    numero_documento VARCHAR(50),
    subtotal DECIMAL(10,2) NOT NULL DEFAULT 0,
    descuento DECIMAL(10,2) NOT NULL DEFAULT 0,
    total DECIMAL(10,2) NOT NULL DEFAULT 0,
    condicion_pago ENUM('CONTADO', 'PARCIAL', 'CREDITO') NOT NULL DEFAULT 'CONTADO',
    estado_pago ENUM('PENDIENTE', 'PARCIAL', 'PAGADO') NOT NULL DEFAULT 'PAGADO',
    estado_compra ENUM('BORRADOR', 'PROCESADA', 'ANULADA') NOT NULL DEFAULT 'PROCESADA',
    observacion VARCHAR(255),
    fecha TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    estado TINYINT(1) NOT NULL DEFAULT 1,
    CONSTRAINT fk_compras_proveedores
        FOREIGN KEY (proveedor_id) REFERENCES proveedores(id)
        ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT fk_compras_usuarios
        FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
        ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT fk_compras_sucursales
        FOREIGN KEY (sucursal_id) REFERENCES sucursales(id)
        ON UPDATE CASCADE ON DELETE RESTRICT
) ENGINE=InnoDB;

CREATE INDEX idx_compras_proveedor_id ON compras(proveedor_id);
CREATE INDEX idx_compras_usuario_id ON compras(usuario_id);
CREATE INDEX idx_compras_sucursal_id ON compras(sucursal_id);
CREATE INDEX idx_compras_fecha ON compras(fecha);

CREATE TABLE detalles_compra (
    id INT AUTO_INCREMENT PRIMARY KEY,
    compra_id INT NOT NULL,
    producto_id INT NOT NULL,
    almacen_id INT NOT NULL,
    cantidad DECIMAL(10,2) NOT NULL,
    cantidad_bonificada DECIMAL(10,2) NOT NULL DEFAULT 0,
    precio_costo DECIMAL(10,2) NOT NULL,
    descuento DECIMAL(10,2) NOT NULL DEFAULT 0,
    subtotal DECIMAL(10,2) NOT NULL,
    estado TINYINT(1) NOT NULL DEFAULT 1,
    CONSTRAINT fk_det_compra_compras
        FOREIGN KEY (compra_id) REFERENCES compras(id)
        ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT fk_det_compra_productos
        FOREIGN KEY (producto_id) REFERENCES productos(id)
        ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT fk_det_compra_almacenes
        FOREIGN KEY (almacen_id) REFERENCES almacenes(id)
        ON UPDATE CASCADE ON DELETE RESTRICT
) ENGINE=InnoDB;

CREATE INDEX idx_det_compra_compra_id ON detalles_compra(compra_id);
CREATE INDEX idx_det_compra_producto_id ON detalles_compra(producto_id);
CREATE INDEX idx_det_compra_almacen_id ON detalles_compra(almacen_id);

-- ============================================================
-- 9. CUENTAS POR COBRAR / PAGAR
-- ============================================================

CREATE TABLE cuentas_por_cobrar (
    id INT AUTO_INCREMENT PRIMARY KEY,
    cliente_id INT NOT NULL,
    venta_id INT NOT NULL UNIQUE,
    monto_total DECIMAL(10,2) NOT NULL,
    saldo_pendiente DECIMAL(10,2) NOT NULL,
    fecha_vencimiento DATE NULL,
    estado_cobro ENUM('PENDIENTE', 'PARCIAL', 'PAGADO', 'VENCIDO', 'ANULADO') NOT NULL DEFAULT 'PENDIENTE',
    fecha_creacion TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    estado TINYINT(1) NOT NULL DEFAULT 1,
    CONSTRAINT fk_cxc_clientes
        FOREIGN KEY (cliente_id) REFERENCES clientes(id)
        ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT fk_cxc_ventas
        FOREIGN KEY (venta_id) REFERENCES ventas(id)
        ON UPDATE CASCADE ON DELETE RESTRICT
) ENGINE=InnoDB;

CREATE INDEX idx_cxc_cliente_id ON cuentas_por_cobrar(cliente_id);

CREATE TABLE cuentas_por_pagar (
    id INT AUTO_INCREMENT PRIMARY KEY,
    proveedor_id INT NOT NULL,
    compra_id INT NOT NULL UNIQUE,
    monto_total DECIMAL(10,2) NOT NULL,
    saldo_pendiente DECIMAL(10,2) NOT NULL,
    fecha_vencimiento DATE NULL,
    estado_pago ENUM('PENDIENTE', 'PARCIAL', 'PAGADO', 'VENCIDO', 'ANULADO') NOT NULL DEFAULT 'PENDIENTE',
    fecha_creacion TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    estado TINYINT(1) NOT NULL DEFAULT 1,
    CONSTRAINT fk_cxp_proveedores
        FOREIGN KEY (proveedor_id) REFERENCES proveedores(id)
        ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT fk_cxp_compras
        FOREIGN KEY (compra_id) REFERENCES compras(id)
        ON UPDATE CASCADE ON DELETE RESTRICT
) ENGINE=InnoDB;

CREATE INDEX idx_cxp_proveedor_id ON cuentas_por_pagar(proveedor_id);

-- ============================================================
-- 10. PAGOS
-- Regla de negocio:
-- Un pago debe estar relacionado solamente con una venta, compra,
-- cuenta por cobrar o cuenta por pagar.
-- Esta validacion se debe controlar en el backend para evitar error #3823
-- de MySQL al combinar CHECK con columnas usadas en FOREIGN KEY.
-- ============================================================

CREATE TABLE pagos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    venta_id INT NULL,
    compra_id INT NULL,
    cuenta_cobrar_id INT NULL,
    cuenta_pagar_id INT NULL,
    monto_pagado DECIMAL(10,2) NOT NULL,
    tipo_flujo ENUM('INGRESO', 'EGRESO') NOT NULL,
    metodo_pago ENUM('EFECTIVO', 'TARJETA', 'TRANSFERENCIA', 'QR', 'OTRO') NOT NULL,
    numero_operacion VARCHAR(100),
    observacion VARCHAR(255),
    fecha TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    estado TINYINT(1) NOT NULL DEFAULT 1,
    CONSTRAINT fk_pagos_ventas
        FOREIGN KEY (venta_id) REFERENCES ventas(id)
        ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT fk_pagos_compras
        FOREIGN KEY (compra_id) REFERENCES compras(id)
        ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT fk_pagos_cxc
        FOREIGN KEY (cuenta_cobrar_id) REFERENCES cuentas_por_cobrar(id)
        ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT fk_pagos_cxp
        FOREIGN KEY (cuenta_pagar_id) REFERENCES cuentas_por_pagar(id)
        ON UPDATE CASCADE ON DELETE RESTRICT
) ENGINE=InnoDB;

CREATE INDEX idx_pagos_venta_id ON pagos(venta_id);
CREATE INDEX idx_pagos_compra_id ON pagos(compra_id);
CREATE INDEX idx_pagos_cuenta_cobrar_id ON pagos(cuenta_cobrar_id);
CREATE INDEX idx_pagos_cuenta_pagar_id ON pagos(cuenta_pagar_id);
CREATE INDEX idx_pagos_fecha ON pagos(fecha);

-- ============================================================
-- 11. FACTURACION
-- ============================================================

CREATE TABLE facturas (
    id INT AUTO_INCREMENT PRIMARY KEY,
    venta_id INT NOT NULL UNIQUE,
    numero_factura VARCHAR(50) NOT NULL UNIQUE,
    nit_cliente VARCHAR(50),
    razon_social VARCHAR(150),
    url_pdf VARCHAR(255),
    fecha_emision TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    estado TINYINT(1) NOT NULL DEFAULT 1,
    CONSTRAINT fk_facturas_ventas
        FOREIGN KEY (venta_id) REFERENCES ventas(id)
        ON UPDATE CASCADE ON DELETE RESTRICT
) ENGINE=InnoDB;

CREATE INDEX idx_facturas_fecha_emision ON facturas(fecha_emision);

-- ============================================================
-- 12. DEVOLUCIONES Y BAJAS
-- ============================================================

CREATE TABLE devoluciones_bajas (
    id INT AUTO_INCREMENT PRIMARY KEY,
    producto_id INT NOT NULL,
    almacen_id INT NOT NULL,
    usuario_id INT NOT NULL,
    venta_id INT NULL,
    detalle_venta_id INT NULL,
    tipo_registro ENUM('DEVOLUCION_CLIENTE', 'BAJA_VENCIMIENTO', 'BAJA_PERDIDA', 'BAJA_ROBO') NOT NULL,
    cantidad DECIMAL(10,2) NOT NULL,
    motivo TEXT NOT NULL,
    fecha TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    estado TINYINT(1) NOT NULL DEFAULT 1,
    CONSTRAINT fk_dev_bajas_productos
        FOREIGN KEY (producto_id) REFERENCES productos(id)
        ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT fk_dev_bajas_almacenes
        FOREIGN KEY (almacen_id) REFERENCES almacenes(id)
        ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT fk_dev_bajas_usuarios
        FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
        ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT fk_dev_bajas_ventas
        FOREIGN KEY (venta_id) REFERENCES ventas(id)
        ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT fk_dev_bajas_det_ventas
        FOREIGN KEY (detalle_venta_id) REFERENCES detalles_venta(id)
        ON UPDATE CASCADE ON DELETE RESTRICT
) ENGINE=InnoDB;

CREATE INDEX idx_dev_bajas_producto_id ON devoluciones_bajas(producto_id);
CREATE INDEX idx_dev_bajas_almacen_id ON devoluciones_bajas(almacen_id);
CREATE INDEX idx_dev_bajas_venta_id ON devoluciones_bajas(venta_id);

-- ============================================================
-- 13. TRANSFORMACION DE PRODUCTOS
-- Ejemplo: materia prima -> producto elaborado.
-- ============================================================

CREATE TABLE transformaciones (
    id INT AUTO_INCREMENT PRIMARY KEY,
    codigo VARCHAR(30) NOT NULL UNIQUE,
    usuario_id INT NOT NULL,
    sucursal_id INT NOT NULL,
    observacion VARCHAR(255),
    estado_transformacion ENUM('BORRADOR', 'PROCESADA', 'ANULADA') NOT NULL DEFAULT 'BORRADOR',
    fecha TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    estado TINYINT(1) NOT NULL DEFAULT 1,
    CONSTRAINT fk_transformaciones_usuarios
        FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
        ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT fk_transformaciones_sucursales
        FOREIGN KEY (sucursal_id) REFERENCES sucursales(id)
        ON UPDATE CASCADE ON DELETE RESTRICT
) ENGINE=InnoDB;

CREATE INDEX idx_transformaciones_usuario_id ON transformaciones(usuario_id);
CREATE INDEX idx_transformaciones_sucursal_id ON transformaciones(sucursal_id);

CREATE TABLE transformacion_insumos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    transformacion_id INT NOT NULL,
    producto_id INT NOT NULL,
    almacen_id INT NOT NULL,
    cantidad DECIMAL(10,2) NOT NULL,
    costo_unitario DECIMAL(10,2) NOT NULL DEFAULT 0,
    estado TINYINT(1) NOT NULL DEFAULT 1,
    CONSTRAINT fk_trans_insumos_transformaciones
        FOREIGN KEY (transformacion_id) REFERENCES transformaciones(id)
        ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT fk_trans_insumos_productos
        FOREIGN KEY (producto_id) REFERENCES productos(id)
        ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT fk_trans_insumos_almacenes
        FOREIGN KEY (almacen_id) REFERENCES almacenes(id)
        ON UPDATE CASCADE ON DELETE RESTRICT
) ENGINE=InnoDB;

CREATE INDEX idx_trans_insumos_transformacion_id ON transformacion_insumos(transformacion_id);

CREATE TABLE transformacion_resultados (
    id INT AUTO_INCREMENT PRIMARY KEY,
    transformacion_id INT NOT NULL,
    producto_id INT NOT NULL,
    almacen_id INT NOT NULL,
    cantidad DECIMAL(10,2) NOT NULL,
    costo_estimado DECIMAL(10,2) NOT NULL DEFAULT 0,
    estado TINYINT(1) NOT NULL DEFAULT 1,
    CONSTRAINT fk_trans_resultados_transformaciones
        FOREIGN KEY (transformacion_id) REFERENCES transformaciones(id)
        ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT fk_trans_resultados_productos
        FOREIGN KEY (producto_id) REFERENCES productos(id)
        ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT fk_trans_resultados_almacenes
        FOREIGN KEY (almacen_id) REFERENCES almacenes(id)
        ON UPDATE CASCADE ON DELETE RESTRICT
) ENGINE=InnoDB;

CREATE INDEX idx_trans_resultados_transformacion_id ON transformacion_resultados(transformacion_id);

-- ============================================================
-- 14. DATOS INICIALES PARA DESARROLLO
-- ============================================================

INSERT INTO roles (nombre, descripcion) VALUES
('ADMIN', 'Administrador general del sistema'),
('GERENTE', 'Gestiona sucursales, reportes y operaciones'),
('CAJERO', 'Registra ventas y pagos'),
('ALMACENERO', 'Gestiona inventario, compras, bajas y transformaciones');

-- Nota: password_hash es de prueba. En backend debe reemplazarse por hash real con bcrypt/argon2.
INSERT INTO usuarios (rol_id, nombre, email, password_hash, telefono) VALUES
(1, 'Administrador Demo', 'admin@omnicommerce.com', '$2b$10$CAMBIAR_HASH_EN_BACKEND_ADMIN123', '70000001'),
(2, 'Gerente Demo', 'gerente@omnicommerce.com', '$2b$10$CAMBIAR_HASH_EN_BACKEND_ADMIN123', '70000002'),
(3, 'Cajero Demo', 'cajero@omnicommerce.com', '$2b$10$CAMBIAR_HASH_EN_BACKEND_ADMIN123', '70000003');

INSERT INTO clientes (nombre, nit_ci, direccion, telefono, correo) VALUES
('Cliente General', '0', 'Sin direccion', '00000000', 'cliente.general@demo.com'),
('Maria Lopez', '1234567', 'Zona Central', '70111111', 'maria.lopez@demo.com'),
('Juan Perez', '7654321', 'Zona Norte', '70222222', 'juan.perez@demo.com');

INSERT INTO proveedores (nombre, nit_rut, direccion, telefono, correo) VALUES
('Proveedor General', '1000001', 'Zona Comercial', '70333333', 'proveedor.general@demo.com'),
('Distribuidora Andina', '1000002', 'Av. Principal', '70444444', 'ventas@andina.demo'),
('Alimentos del Valle', '1000003', 'Mercado Central', '70555555', 'contacto@valle.demo');

INSERT INTO sucursales (nombre, direccion, telefono) VALUES
('Sucursal Central', 'Direccion central', '70666666'),
('Sucursal Norte', 'Direccion norte', '70777777');

INSERT INTO almacenes (sucursal_id, nombre, descripcion) VALUES
(1, 'Almacen Principal Central', 'Almacen principal de sucursal central'),
(1, 'Almacen Secundario Central', 'Almacen secundario de sucursal central'),
(2, 'Almacen Principal Norte', 'Almacen principal de sucursal norte');

INSERT INTO categorias (nombre, descripcion) VALUES
('Abarrotes', 'Productos de consumo basico'),
('Bebidas', 'Bebidas y refrescos'),
('Limpieza', 'Productos de limpieza'),
('Panaderia', 'Productos elaborados o de panaderia');

INSERT INTO productos (categoria_id, sku, nombre, descripcion, unidad_medida, precio_compra_referencia, precio_venta, stock_minimo) VALUES
(1, 'ABR-001', 'Arroz 1kg', 'Arroz seleccionado por kilo', 'KG', 7.50, 10.00, 10),
(1, 'ABR-002', 'Azucar 1kg', 'Azucar blanca por kilo', 'KG', 6.50, 9.00, 10),
(2, 'BEB-001', 'Gaseosa 2L', 'Gaseosa familiar', 'UNIDAD', 8.00, 12.00, 5),
(3, 'LIM-001', 'Detergente 1kg', 'Detergente en polvo', 'UNIDAD', 14.00, 20.00, 5),
(4, 'PAN-001', 'Pan especial', 'Producto elaborado de panaderia', 'UNIDAD', 0.50, 1.00, 50);

INSERT INTO inventario (producto_id, almacen_id, cantidad) VALUES
(1, 1, 50),
(2, 1, 40),
(3, 1, 30),
(4, 1, 20),
(5, 1, 100),
(1, 3, 25),
(2, 3, 20),
(3, 3, 15);

-- ============================================================
-- FIN DEL SCRIPT
-- ============================================================