#!/usr/bin/env node
/**
 * TechZone API smoke test — exercises the full user + admin flow.
 * Usage: node scripts/smoke-test.js  (API must be running on :5000)
 */
const BASE = process.env.API_URL || 'http://localhost:5000/api';

let passed = 0;
let failed = 0;
const ok = (name, cond, extra = '') => {
  if (cond) {
    passed++;
    console.log(`  ✔ ${name}`);
  } else {
    failed++;
    console.log(`  ✖ ${name} ${extra}`);
  }
};

const req = async (method, path, { token, body } = {}) => {
  const headers = {};
  if (body) headers['Content-Type'] = 'application/json';
  if (token) headers.Authorization = `Bearer ${token}`;
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  let data = {};
  try {
    data = await res.json();
  } catch {}
  return { status: res.status, data };
};

(async () => {
  console.log('\n== HEALTH ==');
  const h = await req('GET', '/../api/health'.replace('/../api', ''));
  ok('health endpoint', h.status === 200);

  console.log('\n== CATALOG ==');
  const list = await req('GET', '/products?limit=30');
  ok('GET /products', list.status === 200 && list.data.products.length >= 20);
  ok('discountPercent virtual present', list.data.products.every((p) => 'discountPercent' in p));
  const search = await req('GET', '/products?search=laptop');
  ok('search works', search.status === 200 && search.data.products.length > 0);
  const filtered = await req('GET', '/products?category=Audio&minPrice=1000&maxPrice=8000&inStock=true&sort=price-asc');
  ok(
    'filters + sort work',
    filtered.status === 200 &&
      filtered.data.products.length > 0 &&
      filtered.data.products.every((p) => p.category === 'Audio' && p.price >= 1000 && p.price <= 8000 && p.stock > 0)
  );
  const meta = await req('GET', '/products/meta');
  ok('meta categories/brands', meta.status === 200 && meta.data.categories.length > 0 && meta.data.brands.length > 0);

  const pid = list.data.products[0]._id;
  const single = await req('GET', `/products/${pid}`);
  ok('GET /products/:id', single.status === 200 && single.data.product._id === pid);
  const badId = await req('GET', '/products/000000000000000000000000');
  ok('404 for unknown product', badId.status === 404);

  console.log('\n== AUTH ==');
  const email = `smoke${Date.now()}@test.dev`;
  const reg = await req('POST', '/auth/register', { body: { name: 'Smoke Tester', email, password: 'Secret1' } });
  ok('register returns token + user', reg.status === 201 && reg.data.token && reg.data.user.role === 'user');
  const userTok = reg.data.token;

  const dupe = await req('POST', '/auth/register', { body: { name: 'Dup Tester', email, password: 'Secret1' } });
  ok('duplicate email rejected', dupe.status === 409);

  const badLogin = await req('POST', '/auth/login', { body: { email, password: 'wrongpass' } });
  ok('wrong password rejected (401)', badLogin.status === 401);

  const login = await req('POST', '/auth/login', { body: { email, password: 'Secret1' } });
  ok('login works', login.status === 200 && login.data.token);

  const me = await req('GET', '/auth/me', { token: userTok });
  ok('GET /auth/me with token', me.status === 200 && me.data.user.email === email);
  const meNoTok = await req('GET', '/auth/me');
  ok('/auth/me blocked without token', meNoTok.status === 401);

  const adminLogin = await req('POST', '/auth/login', { body: { email: 'admin@techzone.com', password: 'Admin@123' } });
  ok('demo admin login', adminLogin.status === 200 && adminLogin.data.user.role === 'admin');
  const adminTok = adminLogin.data.token;

  console.log('\n== ORDERS (user) ==');
  const stockBefore = (await req('GET', `/products/${pid}`)).data.product.stock;
  const order = await req('POST', '/orders', {
    token: userTok,
    body: {
      items: [{ product: pid, qty: 2 }],
      customer: {
        fullName: 'Smoke Tester',
        phone: '9876543210',
        addressLine: '1 Test Lane, Unit 5',
        city: 'Hyderabad',
        state: 'Telangana',
        pincode: '500081',
      },
    },
  });
  ok('place order (COD)', order.status === 201 && order.data.order.status === 'Placed');
  ok('order totals computed', order.data.order.totalAmount === order.data.order.itemsPrice + order.data.order.deliveryCharge);
  const orderId = order.data.order._id;

  const stockAfter = (await req('GET', `/products/${pid}`)).data.product.stock;
  ok('stock decremented by 2', stockAfter === stockBefore - 2, `(${stockBefore} → ${stockAfter})`);

  const overOrder = await req('POST', '/orders', {
    token: userTok,
    body: {
      items: [{ product: pid, qty: 9999 }],
      customer: { fullName: 'S', phone: '9876543210', addressLine: '1 Test Lane', city: 'Hyderabad', state: 'TS', pincode: '500081' },
    },
  });
  ok('oversell blocked', overOrder.status === 400);

  const mine = await req('GET', '/orders/mine', { token: userTok });
  ok('GET /orders/mine', mine.status === 200 && mine.data.orders.some((o) => o._id === orderId));

  const otherUserOrder = await req('GET', `/orders/${orderId}`, { token: adminTok });
  ok('admin can view user order', otherUserOrder.status === 200);

  const cancel = await req('PUT', `/orders/${orderId}/cancel`, { token: userTok });
  ok('user cancels own order', cancel.status === 200 && cancel.data.order.status === 'Cancelled');
  const stockRestored = (await req('GET', `/products/${pid}`)).data.product.stock;
  ok('stock restored after cancel', stockRestored === stockBefore, `(${stockRestored} vs ${stockBefore})`);

  console.log('\n== ADMIN AUTHORIZATION ==');
  const noAuth = await req('GET', '/orders');
  ok('orders list requires token', noAuth.status === 401);
  const userBlocked = await req('GET', '/orders', { token: userTok });
  ok('non-admin blocked from all orders (403)', userBlocked.status === 403);
  const userBlockedProducts = await req('POST', '/products', {
    token: userTok,
    body: { name: 'Hack', brand: 'X', category: 'Y', price: 1, description: 'test test test test', stock: 1 },
  });
  ok('non-admin blocked from product create (403)', userBlockedProducts.status === 403);

  console.log('\n== ADMIN PRODUCTS ==');
  const created = await req('POST', '/products', {
    token: adminTok,
    body: {
      name: 'Smoke Test Device',
      brand: 'TestBrand',
      category: 'Gaming',
      price: 1234,
      originalPrice: 1999,
      description: 'A device created by the automated smoke test.',
      stock: 7,
      rating: 4.2,
      specifications: [{ label: 'Test', value: 'Yes' }],
    },
  });
  ok('admin creates product', created.status === 201 && created.data.product.name === 'Smoke Test Device');
  const newId = created.data.product._id;

  const updated = await req('PUT', `/products/${newId}`, {
    token: adminTok,
    body: {
      name: 'Smoke Test Device v2',
      brand: 'TestBrand',
      category: 'Gaming',
      price: 1500,
      description: 'Updated by the automated smoke test.',
      stock: 5,
    },
  });
  ok('admin updates product', updated.status === 200 && updated.data.product.price === 1500);

  const stocked = await req('PATCH', `/products/${newId}/stock`, { token: adminTok, body: { stock: 42 } });
  ok('admin quick stock update', stocked.status === 200 && stocked.data.product.stock === 42);

  const badProduct = await req('POST', '/products', {
    token: adminTok,
    body: { name: '', brand: '', category: '', price: -5, description: '', stock: -1 },
  });
  ok('product validation errors', badProduct.status === 400 && badProduct.data.errors);

  const deleted = await req('DELETE', `/products/${newId}`, { token: adminTok });
  ok('admin deletes product', deleted.status === 200);

  console.log('\n== ADMIN ORDERS ==');
  const allOrders = await req('GET', '/orders', { token: adminTok });
  ok('admin lists all orders', allOrders.status === 200 && allOrders.data.orders.length >= 5);
  // Place a fresh order so the status-transition test is repeatable
  const shipTarget = await req('POST', '/orders', {
    token: userTok,
    body: {
      items: [{ product: pid, qty: 1 }],
      customer: {
        fullName: 'Smoke Tester',
        phone: '9876543210',
        addressLine: '1 Test Lane, Unit 5',
        city: 'Hyderabad',
        state: 'Telangana',
        pincode: '500081',
      },
    },
  });
  const placedId = shipTarget.data?.order?._id;
  if (placedId) {
    const ship = await req('PUT', `/orders/${placedId}/status`, { token: adminTok, body: { status: 'Shipped' } });
    ok('admin updates order status', ship.status === 200 && ship.data.order.status === 'Shipped');
    const badStatus = await req('PUT', `/orders/${placedId}/status`, { token: adminTok, body: { status: 'Teleported' } });
    ok('invalid status rejected', badStatus.status === 400);
  } else {
    ok('admin updates order status', false, '(could not create target order)');
  }

  console.log('\n== ADMIN CUSTOMERS ==');
  const customers = await req('GET', '/customers', { token: adminTok });
  ok('admin lists customers with order stats', customers.status === 200 && customers.data.customers.length >= 2 && 'orderCount' in customers.data.customers[0]);
  const custBlocked = await req('GET', '/customers', { token: userTok });
  ok('non-admin blocked from customers (403)', custBlocked.status === 403);

  console.log(`\n======== RESULT: ${passed} passed, ${failed} failed ========\n`);
  process.exit(failed ? 1 : 0);
})().catch((e) => {
  console.error('Smoke test crashed:', e.message);
  process.exit(1);
});
