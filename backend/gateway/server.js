require('dotenv').config();

const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const http = require('http');
const https = require('https');
const { URL } = require('url');

const app = express();
const PORT = process.env.PORT || 3000;

const services = {
  catalog: process.env.CATALOG_SERVICE_URL || 'http://localhost:3001',
  inventory: process.env.INVENTORY_SERVICE_URL || 'http://localhost:3002',
  sales: process.env.SALES_SERVICE_URL || 'http://localhost:3003',
  purchases: process.env.PURCHASES_SERVICE_URL || 'http://localhost:3004',
  payments: process.env.PAYMENTS_SERVICE_URL || 'http://localhost:3005',
  billing: process.env.BILLING_SERVICE_URL || 'http://localhost:3006',
  operations: process.env.OPERATIONS_SERVICE_URL || 'http://localhost:3007',
  users: process.env.USERS_SERVICE_URL || 'http://localhost:3008'
};

app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(morgan('dev'));

app.get('/', (req, res) => {
  res.json({
    proyecto: 'OmniCommerce - Tienda de la Abuela Serafina',
    servicio: 'api-gateway',
    version: '1.2.0',
    estado: 'OK',
    mensaje: 'API Gateway funcionando correctamente',
    rutas: {
      catalogo: '/api/catalog',
      inventario: '/api/inventory',
      ventas: '/api/sales',
      compras: '/api/purchases',
      pagos: '/api/payments',
      facturacion: '/api/billing',
      operaciones: '/api/operations',
      usuarios: '/api/users'
    }
  });
});

app.get('/health', (req, res) => {
  res.json({
    servicio: 'api-gateway',
    version: '1.2.0',
    estado: 'OK',
    servicios: {
      catalog: services.catalog,
      inventory: services.inventory,
      sales: services.sales,
      purchases: services.purchases,
      payments: services.payments,
      billing: services.billing,
      operations: services.operations,
      users: services.users
    }
  });
});

function proxyRequest(req, res, targetBaseUrl, serviceName) {
  const targetUrl = new URL(req.originalUrl, targetBaseUrl);
  const client = targetUrl.protocol === 'https:' ? https : http;

  const headers = { ...req.headers };
  delete headers.host;
  delete headers['content-length'];

  let body = null;
  if (!['GET', 'HEAD'].includes(req.method.toUpperCase()) && req.body && Object.keys(req.body).length > 0) {
    body = JSON.stringify(req.body);
    headers['content-type'] = 'application/json';
    headers['content-length'] = Buffer.byteLength(body);
  }

  const options = {
    protocol: targetUrl.protocol,
    hostname: targetUrl.hostname,
    port: targetUrl.port,
    path: `${targetUrl.pathname}${targetUrl.search}`,
    method: req.method,
    headers
  };

  const proxy = client.request(options, (proxyRes) => {
    res.status(proxyRes.statusCode || 500);

    Object.entries(proxyRes.headers).forEach(([key, value]) => {
      if (value !== undefined) res.setHeader(key, value);
    });

    proxyRes.pipe(res);
  });

  proxy.on('error', (err) => {
    res.status(502).json({
      mensaje: 'Error al conectar con el microservicio',
      servicio: serviceName,
      servicio_destino: targetBaseUrl,
      ruta_enviada: targetUrl.toString(),
      error: err.message
    });
  });

  if (body) proxy.write(body);
  proxy.end();
}

app.use('/api/catalog', (req, res) => proxyRequest(req, res, services.catalog, 'catalog-service'));
app.use('/api/inventory', (req, res) => proxyRequest(req, res, services.inventory, 'inventory-service'));
app.use('/api/sales', (req, res) => proxyRequest(req, res, services.sales, 'sales-service'));
app.use('/api/purchases', (req, res) => proxyRequest(req, res, services.purchases, 'purchases-service'));
app.use('/api/payments', (req, res) => proxyRequest(req, res, services.payments, 'payments-service'));
app.use('/api/billing', (req, res) => proxyRequest(req, res, services.billing, 'billing-service'));
app.use('/api/operations', (req, res) => proxyRequest(req, res, services.operations, 'operations-service'));
app.use('/api/users', (req, res) => proxyRequest(req, res, services.users, 'users-service'));

app.use((req, res) => {
  res.status(404).json({
    mensaje: 'Ruta no encontrada en API Gateway',
    ruta_solicitada: req.originalUrl
  });
});

app.listen(PORT, () => {
  console.log(`API Gateway ejecutándose en http://localhost:${PORT}`);
  console.log('Versión corregida: 1.2.0');
  console.log('Servicios conectados:');
  console.log(`Catalog Service: ${services.catalog}`);
  console.log(`Inventory Service: ${services.inventory}`);
  console.log(`Sales Service: ${services.sales}`);
  console.log(`Purchases Service: ${services.purchases}`);
  console.log(`Payments Service: ${services.payments}`);
  console.log(`Billing Service: ${services.billing}`);
  console.log(`Operations Service: ${services.operations}`);
  console.log(`Users Service: ${services.users}`);
});
