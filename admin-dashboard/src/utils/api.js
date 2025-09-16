import axios from 'axios';

// Compute backend baseURL from env. Prefer VITE_API_BASE_URL; otherwise build from protocol/host/port.
const env = (typeof import.meta !== 'undefined' && import.meta.env) || {};
const apiProtocol = env.VITE_API_PROTOCOL || 'http';
const apiHost = env.VITE_API_HOST || 'localhost';
const apiPort = env.VITE_API_PORT || '4000';
const computedBase = env.VITE_API_BASE_URL || `${apiProtocol}://${apiHost}:${apiPort}`;

const api = axios.create({
  baseURL: computedBase,
  withCredentials: false,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('adminToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;

// Categorized API helpers
export const usersApi = {
  // Admin list with pagination
  list: (page = 1, limit = 50, type) => api.get(`/api/admin/users?page=${page}&limit=${limit}${type ? `&type=${encodeURIComponent(type)}` : ''}`),
  // Rich detail
  detail: (id) => api.get(`/api/users/${id}`),
  addPaymentMethod: (id, body) => api.post(`/api/users/${id}/payment-methods`, body),
  updatePaymentMethod: (id, pmId, body) => api.put(`/api/users/${id}/payment-methods/${pmId}`, body),
  deletePaymentMethod: (id, pmId) => api.delete(`/api/users/${id}/payment-methods/${pmId}`),
  // Notes
  listNotes: (id) => api.get(`/api/users/${id}/notes`),
  createNote: (id, body) => api.post(`/api/users/${id}/notes`, body),
  deleteNote: (id, noteId) => api.delete(`/api/users/${id}/notes/${noteId}`),
};

export const adminApi = {
  drivers: (page = 1, limit = 50) => api.get(`/api/admin/drivers?page=${page}&limit=${limit}`),
  employees: (page = 1, limit = 50) => api.get(`/api/admin/employees?page=${page}&limit=${limit}`),
  createClient: (body) => api.post('/api/admin/users/clients', body),
  createEmployee: (body) => api.post('/api/admin/users/employees', body),
  createVendorOwner: (body) => api.post('/api/admin/users/vendor-owners', body),
  createDriver: (body) => api.post('/api/admin/users/drivers', body),
  vendors: (page = 1, limit = 50) => api.get(`/api/admin/vendors?page=${page}&limit=${limit}`),
};
export const categoriesApi = {
  list: () => api.get('/api/category'),
  detail: (id) => api.get(`/api/category/${id}`),
  create: ({ name, description, files }) => {
    const form = new FormData();
    form.append('name', name);
    form.append('description', description);
    files?.forEach(f => form.append('category_pictures', f));
    return api.post('/api/category', form, { headers: { 'Content-Type': 'multipart/form-data' } });
  },
  updateWithImages: ({ id, name, description, keepImages, files }) => {
    const form = new FormData();
    form.append('name', name);
    form.append('description', description);
    form.append('keepImages', JSON.stringify(keepImages || []));
    files?.forEach(f => form.append('category_pictures', f));
    return api.put(`/api/category/${id}`, form, { headers: { 'Content-Type': 'multipart/form-data' } });
  },
  remove: (id) => api.delete(`/api/category/${id}`),
  subcategories: (id) => api.get(`/api/category/${id}/subcategories`),
};

export const subcategoriesApi = {
  list: () => api.get('/api/subcategory'),
  detail: (id) => api.get(`/api/subcategory/${id}`),
  create: ({ name, category_id, files }) => {
    const form = new FormData();
    form.append('name', name);
    form.append('category_id', String(category_id));
    files?.forEach(f => form.append('subcategory_pictures', f));
    return api.post('/api/subcategory', form, { headers: { 'Content-Type': 'multipart/form-data' } });
  },
  updateWithImages: ({ id, name, category_id, keepImages, files }) => {
    const form = new FormData();
    form.append('name', name);
    form.append('category_id', String(category_id));
    form.append('keepImages', JSON.stringify(keepImages || []));
    files?.forEach(f => form.append('subcategory_pictures', f));
    return api.put(`/api/subcategory/${id}`, form, { headers: { 'Content-Type': 'multipart/form-data' } });
  },
  remove: (id) => api.delete(`/api/subcategory/${id}`),
  deleted: () => api.get('/api/subcategory/admin/deleted/list'),
  restore: (id) => api.post(`/api/subcategory/admin/deleted/${id}/restore`),
  purge: (id) => api.delete(`/api/subcategory/admin/deleted/${id}`),
};

export const subscriptionsApi = {
  list: () => api.get('/api/subscription'),
  detail: (id) => api.get(`/api/subscription/${id}/details`),
  create: ({ plan, amount, start_date, end_date, status }) =>
    api.post('/api/subscription', { plan, amount, start_date, end_date, status }),
  update: ({ id, plan, amount, start_date, end_date, status }) =>
    api.put(`/api/subscription/${id}`, { plan, amount, start_date, end_date, status }),
  remove: (id) => api.delete(`/api/subscription/${id}`),
};

export const vendorNotesApi = {
  list: (vendorId) => api.get(`/api/vendors/${vendorId}/notes`),
  create: (vendorId, { title, description }) => api.post(`/api/vendors/${vendorId}/notes`, { title, description }),
  remove: (vendorId, noteId) => api.delete(`/api/vendors/${vendorId}/notes/${noteId}`),
};

export const vendorPaymentsApi = {
  add: (vendorId, body) => api.post(`/api/vendors/${vendorId}/payment-methods`, body),
  remove: (vendorId, pmId) => api.delete(`/api/vendors/${vendorId}/payment-methods/${pmId}`),
};

export const walletApi = {
  getByUserId: (id, isVendor = false) => api.get(`/api/wallet/${id}${isVendor ? '?isVendor=true' : ''}`),
  getTransactions: (id, page = 1, limit = 20, isVendor = false) =>
    api.get(`/api/wallet/${id}/transactions?page=${page}&limit=${limit}${isVendor ? '&isVendor=true' : ''}`),
  addFunds: (id, body, isVendor = false) =>
    api.post(`/api/wallet/${id}/add-funds${isVendor ? '?isVendor=true' : ''}`, body),
  deductFunds: (id, body, isVendor = false) =>
    api.post(`/api/wallet/${id}/deduct-funds${isVendor ? '?isVendor=true' : ''}`, body),
  getBalance: (id, isVendor = false) =>
    api.get(`/api/wallet/${id}/balance${isVendor ? '?isVendor=true' : ''}`),
  getTransaction: (transactionId) => api.get(`/api/wallet/transaction/${transactionId}`),
  exportCsv: (id, isVendor = false) =>
    api.get(`/api/wallet/${id}/export/csv${isVendor ? '?isVendor=true' : ''}`, { responseType: 'blob' }),
  listAll: (page = 1, limit = 50) => api.get(`/api/wallet?page=${page}&limit=${limit}`),
};

// Analytics
export const analyticsApi = {
  approvedVendors: (page = 1, limit = 20) => api.get(`/api/analytics/vendors/approved?page=${page}&limit=${limit}`),
  summary: () => api.get('/api/analytics/summary'),
};

// Vendors create helpers (multipart)
export const vendorsApi = {
  createIndividual: ({ name, description, category_ids, payment_method, subscription_id, cover_image, fayda_image, owner_user_id }) => {
    const form = new FormData();
    form.append('name', name || '');
    if (description) form.append('description', description);
    form.append('category_ids', JSON.stringify(category_ids || []));
    form.append('payment_method', JSON.stringify(payment_method || {}));
    form.append('subscription_id', String(subscription_id));
    if (owner_user_id !== undefined && owner_user_id !== null && owner_user_id !== '') {
      const idStr = String(parseInt(owner_user_id, 10));
      form.append('owner_user_id', idStr);
    }
    if (cover_image) form.append('cover_image', cover_image);
    if (fayda_image) form.append('fayda_image', fayda_image);
    return api.post('/api/vendors/individual', form, { headers: { 'Content-Type': 'multipart/form-data' } });
  },
  createBusiness: ({ name, description, category_ids, payment_method, subscription_id, cover_image, business_license_image, owner_user_id }) => {
    const form = new FormData();
    form.append('name', name || '');
    if (description) form.append('description', description);
    form.append('category_ids', JSON.stringify(category_ids || []));
    form.append('payment_method', JSON.stringify(payment_method || {}));
    form.append('subscription_id', String(subscription_id));
    if (owner_user_id !== undefined && owner_user_id !== null && owner_user_id !== '') {
      const idStr = String(parseInt(owner_user_id, 10));
      form.append('owner_user_id', idStr);
    }
    if (cover_image) form.append('cover_image', cover_image);
    if (business_license_image) form.append('business_license_image', business_license_image);
    return api.post('/api/vendors/business', form, { headers: { 'Content-Type': 'multipart/form-data' } });
  },
};

