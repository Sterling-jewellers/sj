import axios from 'axios';

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api',
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('sj_token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && typeof window !== 'undefined') {
      localStorage.removeItem('sj_token');
      window.location.href = '/sign-in';
    }
    return Promise.reject(error);
  }
);

export default api;

// API helpers
export const productsApi = {
  getAll: (params?: Record<string, string | number>) => api.get('/products', { params }),
  getBySlug: (slug: string) => api.get(`/products/${slug}`),
  getFeatured: () => api.get('/products/featured'),
  getBestsellers: () => api.get('/products/bestsellers'),
  getRelated: (id: string) => api.get(`/products/${id}/related`),
};

export const categoriesApi = {
  getAll: () => api.get('/categories'),
  getBySlug: (slug: string) => api.get(`/categories/${slug}`),
};

export const diamondsApi = {
  getAll: (params?: Record<string, string | number>) => api.get('/diamonds', { params }),
  getById: (id: string) => api.get(`/diamonds/${id}`),
};

export const ordersApi = {
  create: (data: unknown) => api.post('/orders', data),
  getMyOrders: () => api.get('/orders/my-orders'),
  getById: (id: string) => api.get(`/orders/${id}`),
};

export const authApi = {
  register: (data: unknown) => api.post('/auth/register', data),
  login: (data: unknown) => api.post('/auth/login', data),
  getMe: () => api.get('/auth/me'),
};

export const reviewsApi = {
  getByProduct: (productId: string) => api.get(`/reviews/product/${productId}`),
  create: (data: unknown) => api.post('/reviews', data),
};

export const paymentApi = {
  createIntent: (data: unknown) => api.post('/payment/create-intent', data),
  validateCoupon: (code: string) => api.post('/payment/validate-coupon', { code }),
};

export const adminApi = {
  getDashboard: (range?: number) => api.get('/admin/dashboard', { params: { range } }),

  // Products
  getProducts: (params?: Record<string, unknown>) => api.get('/admin/products', { params }),
  getProduct: (id: string) => api.get(`/admin/products/${id}`),
  createProduct: (data: unknown) => api.post('/admin/products', data),
  updateProduct: (id: string, data: unknown) => api.put(`/admin/products/${id}`, data),
  deleteProduct: (id: string) => api.delete(`/admin/products/${id}`),

  // Diamonds
  getDiamonds: (params?: Record<string, unknown>) => api.get('/admin/diamonds', { params }),
  getDiamond: (id: string) => api.get(`/admin/diamonds/${id}`),
  createDiamond: (data: unknown) => api.post('/admin/diamonds', data),
  updateDiamond: (id: string, data: unknown) => api.put(`/admin/diamonds/${id}`, data),
  deleteDiamond: (id: string) => api.delete(`/admin/diamonds/${id}`),

  // Orders
  getOrders: (params?: Record<string, unknown>) => api.get('/admin/orders', { params }),
  getOrder: (id: string) => api.get(`/admin/orders/${id}`),
  updateOrderStatus: (id: string, data: unknown) => api.patch(`/admin/orders/${id}/status`, data),

  // Customers
  getCustomers: (params?: Record<string, unknown>) => api.get('/admin/customers', { params }),
  getCustomer: (id: string) => api.get(`/admin/customers/${id}`),
  createCustomer: (data: unknown) => api.post('/admin/customers', data),
  updateCustomer: (id: string, data: unknown) => api.put(`/admin/customers/${id}`, data),
  deleteCustomer: (id: string) => api.delete(`/admin/customers/${id}`),

  // Users
  updateUserRole: (id: string, role: string) => api.patch(`/admin/users/${id}/role`, { role }),

  // Coupons
  getCoupons: () => api.get('/admin/coupons'),
  createCoupon: (data: unknown) => api.post('/admin/coupons', data),
  updateCoupon: (id: string, data: unknown) => api.put(`/admin/coupons/${id}`, data),
  deleteCoupon: (id: string) => api.delete(`/admin/coupons/${id}`),
};
