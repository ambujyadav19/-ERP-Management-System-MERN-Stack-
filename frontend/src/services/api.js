const API_URL = '/api';

export const request = async (endpoint, options = {}) => {
  const token = localStorage.getItem('erp_token');
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };

  const config = {
    ...options,
    headers,
  };

  try {
    const response = await fetch(`${API_URL}${endpoint}`, config);
    const data = await response.json();

    if (!response.ok) {
      if (response.status === 401 && !endpoint.includes('/login')) {
        localStorage.removeItem('erp_token');
        localStorage.removeItem('erp_user');
        window.location.href = '/login';
      }
      throw new Error(data.message || 'API request failed');
    }

    return data;
  } catch (err) {
    throw err;
  }
};

export const api = {
  // Auth
  login: (credentials) => request('/login', { method: 'POST', body: JSON.stringify(credentials) }),
  register: (userData) => request('/register', { method: 'POST', body: JSON.stringify(userData) }),
  getMe: () => request('/me'),

  // Dashboard
  getDashboardStats: () => request('/dashboard/stats'),

  // Products
  getProducts: (params = '') => request(`/products?${params}`),
  getProduct: (id) => request(`/products/${id}`),
  createProduct: (data) => request('/products', { method: 'POST', body: JSON.stringify(data) }),
  updateProduct: (id, data) => request(`/products/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteProduct: (id) => request(`/products/${id}`, { method: 'DELETE' }),

  // Customers
  getCustomers: (params = '') => request(`/customers?${params}`),
  getCustomer: (id) => request(`/customers/${id}`),
  createCustomer: (data) => request('/customers', { method: 'POST', body: JSON.stringify(data) }),
  updateCustomer: (id, data) => request(`/customers/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteCustomer: (id) => request(`/customers/${id}`, { method: 'DELETE' }),

  // Suppliers
  getSuppliers: (params = '') => request(`/suppliers?${params}`),
  getSupplier: (id) => request(`/suppliers/${id}`),
  createSupplier: (data) => request('/suppliers', { method: 'POST', body: JSON.stringify(data) }),
  updateSupplier: (id, data) => request(`/suppliers/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteSupplier: (id) => request(`/suppliers/${id}`, { method: 'DELETE' }),

  // Sales Orders
  getSalesOrders: (params = '') => request(`/sales-orders?${params}`),
  getSalesOrder: (id) => request(`/sales-orders/${id}`),
  createSalesOrder: (data) => request('/sales-orders', { method: 'POST', body: JSON.stringify(data) }),
  updateSalesOrder: (id, data) => request(`/sales-orders/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteSalesOrder: (id) => request(`/sales-orders/${id}`, { method: 'DELETE' }),

  // Purchase Orders
  getPurchaseOrders: (params = '') => request(`/purchase-orders?${params}`),
  getPurchaseOrder: (id) => request(`/purchase-orders/${id}`),
  createPurchaseOrder: (data) => request('/purchase-orders', { method: 'POST', body: JSON.stringify(data) }),
  updatePurchaseOrder: (id, data) => request(`/purchase-orders/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deletePurchaseOrder: (id) => request(`/purchase-orders/${id}`, { method: 'DELETE' }),

  // Goods Receipt Notes (GRN)
  getGRNs: (params = '') => request(`/grn?${params}`),
  getGRN: (id) => request(`/grn/${id}`),
  createGRN: (data) => request('/grn', { method: 'POST', body: JSON.stringify(data) }),

  // Invoices
  getInvoices: (params = '') => request(`/invoices?${params}`),
  getInvoice: (id) => request(`/invoices/${id}`),
  createInvoice: (data) => request('/invoices', { method: 'POST', body: JSON.stringify(data) }),
  updateInvoice: (id, data) => request(`/invoices/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteInvoice: (id) => request(`/invoices/${id}`, { method: 'DELETE' }),

  // Users (Admin)
  getUsers: (params = '') => request(`/users?${params}`),
  createUser: (data) => request('/users', { method: 'POST', body: JSON.stringify(data) }),
  updateUser: (id, data) => request(`/users/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteUser: (id) => request(`/users/${id}`, { method: 'DELETE' }),
};
