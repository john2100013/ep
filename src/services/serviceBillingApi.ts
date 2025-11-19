// Service Billing API Service
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api';

export const serviceBillingApi = axios.create({
  baseURL: `${API_BASE_URL}/service-billing`,
  headers: { 'Content-Type': 'application/json' },
});

serviceBillingApi.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export const ServiceBillingAPI = {
  // Services
  getServices: () => serviceBillingApi.get('/services'),
  createService: (data: any) => serviceBillingApi.post('/services', data),
  updateService: (id: number, data: any) => serviceBillingApi.put(`/services/${id}`, data),
  deleteService: (id: number) => serviceBillingApi.delete(`/services/${id}`),

  // Customers
  getCustomers: () => serviceBillingApi.get('/customers'),
  createCustomer: (data: any) => serviceBillingApi.post('/customers', data),
  updateCustomer: (id: number, data: any) => serviceBillingApi.put(`/customers/${id}`, data),

  // Employees
  getEmployees: () => serviceBillingApi.get('/employees'),
  createEmployee: (data: any) => serviceBillingApi.post('/employees', data),
  updateEmployee: (id: number, data: any) => serviceBillingApi.put(`/employees/${id}`, data),

  // Bookings
  getBookings: (params?: any) => serviceBillingApi.get('/bookings', { params }),
  createBooking: (data: any) => serviceBillingApi.post('/bookings', data),
  assignEmployee: (bookingServiceId: number, employeeId: number) =>
    serviceBillingApi.post(`/bookings/services/${bookingServiceId}/assign`, { employee_id: employeeId }),
  completeService: (bookingServiceId: number) =>
    serviceBillingApi.post(`/bookings/services/${bookingServiceId}/complete`),

  // Invoices
  createServiceInvoice: (data: any) => serviceBillingApi.post('/invoices', data),
  getServiceInvoices: () => serviceBillingApi.get('/invoices'),

  // Commission
  getCommissionSettings: () => serviceBillingApi.get('/commission/settings'),
  updateCommissionSettings: (data: any) => serviceBillingApi.post('/commission/settings', data),
  calculateCommissions: (periodStart: string, periodEnd: string) =>
    serviceBillingApi.post('/commission/calculate', { period_start: periodStart, period_end: periodEnd }),
  getEmployeeCommissions: (employeeId?: number) =>
    serviceBillingApi.get('/commission', { params: employeeId ? { employee_id: employeeId } : {} }),

  // Customer Assignments
  getAssignments: (params?: any) => serviceBillingApi.get('/assignments', { params }),
  createAssignment: (data: any) => serviceBillingApi.post('/assignments', data),
  completeAssignment: (assignmentId: number) =>
    serviceBillingApi.post(`/assignments/${assignmentId}/complete`),
  getAssignmentsForBilling: () => serviceBillingApi.get('/assignments/billing'),
  createInvoiceFromAssignments: (data: any) => serviceBillingApi.post('/assignments/invoice', data),
};
