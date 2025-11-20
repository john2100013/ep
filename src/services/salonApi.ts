import api from './api';

// Salon Users
export const getSalonUsers = () => api.get('/salon/users');
export const createSalonUser = (data: any) => api.post('/salon/users', data);
export const updateSalonUser = (id: string, data: any) => api.put(`/salon/users/${id}`, data);

// Services
export const getServices = () => api.get('/salon/services');
export const createService = (data: any) => api.post('/salon/services', data);
export const updateService = (id: string, data: any) => api.put(`/salon/services/${id}`, data);

// Products
export const getProducts = () => api.get('/salon/products');
export const createProduct = (data: any) => api.post('/salon/products', data);
export const updateProduct = (id: string, data: any) => api.put(`/salon/products/${id}`, data);
export const getLowStockProducts = () => api.get('/salon/products/low-stock');

// Shifts
export const startShift = (data: any) => api.post('/salon/shifts/start', data);
export const getCurrentShift = () => api.get('/salon/shifts/current');
export const closeShift = (id: string, data: any) => api.post(`/salon/shifts/${id}/close`, data);
export const getShifts = (params?: any) => api.get('/salon/shifts', { params });
export const getShiftDetails = (id: string) => api.get(`/salon/shifts/${id}`);

// Transactions
export const recordTransaction = (data: any) => api.post('/salon/transactions', data);
export const getTransactions = (params?: any) => api.get('/salon/transactions', { params });
export const getTransactionDetails = (id: string) => api.get(`/salon/transactions/${id}`);

// Performance & Analytics
export const getEmployeePerformance = (params?: any) => api.get('/salon/performance/employees', { params });
export const getDashboardStats = (params?: any) => api.get('/salon/dashboard/stats', { params });
