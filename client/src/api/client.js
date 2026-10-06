const API_URL = import.meta.env.VITE_API_URL || (import.meta.env.PROD ? 'https://techzone-1bgq.onrender.com' : '');
const BASE = `${API_URL}/api`;

const TOKEN_KEY = 'tz_token';

export const getToken = () => localStorage.getItem(TOKEN_KEY);
export const setToken = (token) => {
  if (token) localStorage.setItem(TOKEN_KEY, token);
  else localStorage.removeItem(TOKEN_KEY);
};

// Subscribers notified when a 401 means "please log in again"
let onAuthExpired = null;
export const setAuthExpiredHandler = (fn) => {
  onAuthExpired = fn;
};

const buildUrl = (path, params) => {
  const url = new URL(`${BASE}${path}`, window.location.origin);
  if (params) {
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '') url.searchParams.set(k, v);
    });
  }
  return url.pathname + url.search;
};

const request = async (path, { method = 'GET', body, params } = {}) => {
  const headers = {};
  if (body !== undefined) headers['Content-Type'] = 'application/json';

  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;

  let res;
  try {
    res = await fetch(buildUrl(path, params), {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new Error('Cannot reach the TechZone server. Is the backend running?');
  }

  let data = {};
  try {
    data = await res.json();
  } catch {
    /* non-JSON response */
  }

  if (!res.ok) {
    if (res.status === 401 && onAuthExpired && getToken()) {
      onAuthExpired();
    }
    const err = new Error(data.message || `Request failed (${res.status})`);
    err.status = res.status;
    err.errors = data.errors;
    throw err;
  }
  return data;
};

export const api = {
  // ---- auth ----
  register: (payload) => request('/auth/register', { method: 'POST', body: payload }),
  login: (payload) => request('/auth/login', { method: 'POST', body: payload }),
  me: () => request('/auth/me'),

  // ---- products ----
  getProducts: (params) => request('/products', { params }),
  getProductMeta: () => request('/products/meta'),
  getProduct: (id) => request(`/products/${id}`),
  getFeatured: () => request('/products/featured'),
  getTrending: () => request('/products/trending'),
  getRecommended: () => request('/products/recommended'),
  createProduct: (payload) => request('/products', { method: 'POST', body: payload }),
  updateProduct: (id, payload) => request(`/products/${id}`, { method: 'PUT', body: payload }),
  updateStock: (id, stock) => request(`/products/${id}/stock`, { method: 'PATCH', body: { stock } }),
  deleteProduct: (id) => request(`/products/${id}`, { method: 'DELETE' }),

  // ---- orders ----
  createOrder: (payload) => request('/orders', { method: 'POST', body: payload }),
  getMyOrders: () => request('/orders/mine'),
  getOrder: (id) => request(`/orders/${id}`),
  cancelOrder: (id) => request(`/orders/${id}/cancel`, { method: 'PUT' }),
  getAllOrders: (params) => request('/orders', { params }),
  updateOrderStatus: (id, status) =>
    request(`/orders/${id}/status`, { method: 'PUT', body: { status } }),

  // ---- customers (admin) ----
  getCustomers: () => request('/customers'),
  getCustomer: (id) => request(`/customers/${id}`),
};

export default api;
