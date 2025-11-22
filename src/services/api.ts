import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api';

// Log the API URL being used for debugging
console.log('🔗 API Base URL:', API_BASE_URL);
console.log('🏗️ Environment:', import.meta.env.VITE_APP_ENV || 'development');

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      localStorage.removeItem('business');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export class ApiService {
  // Auth endpoints
  static async register(userData: {
    email: string;
    password: string;
    first_name: string;
    last_name: string;
    business_name: string;
  }) {
    const response = await api.post('/auth/register', userData);
    return response.data;
  }

  static async login(email: string, password: string) {
    const response = await api.post('/auth/login', { email, password });
    return response.data;
  }

  static async logout() {
    const response = await api.post('/auth/logout');
    return response.data;
  }

  static async getProfile() {
    const response = await api.get('/auth/profile');
    return response.data;
  }

  static async updatePassword(current_password: string, new_password: string) {
    const response = await api.put('/auth/password', { current_password, new_password });
    return response.data;
  }

  // Item endpoints
  static async getItems(params?: {
    page?: number;
    limit?: number;
    search?: string;
    sortBy?: string;
    sortOrder?: 'ASC' | 'DESC';
  }) {
    const response = await api.get('/items', { params });
    return response.data;
  }

  static async createItem(itemData: {
    item_name: string;
    quantity: number;
    buying_price: number;
    selling_price: number;
    rate: number;
    unit?: string;
    description?: string;
    category_id?: number;
    manufacturing_date?: string;
    expiry_date?: string;
  }) {
    const response = await api.post('/items', itemData);
    return response.data;
  }

  static async getItem(id: number) {
    const response = await api.get(`/items/${id}`);
    return response.data;
  }

  static async updateItem(id: number, itemData: {
    item_name?: string;
    quantity?: number;
    rate?: number;
    unit?: string;
    description?: string;
  }) {
    const response = await api.put(`/items/${id}`, itemData);
    return response.data;
  }

  static async deleteItem(id: number) {
    const response = await api.delete(`/items/${id}`);
    return response.data;
  }

  static async getItemStats() {
    const response = await api.get('/items/stats');
    return response.data;
  }

  // Quotation endpoints
  static async getQuotations(params?: {
    page?: number;
    limit?: number;
    search?: string;
    status?: string;
  }) {
    const response = await api.get('/quotations', { params });
    return response.data;
  }

  static async createQuotation(quotationData: {
    customer_name: string;
    customer_address?: string;
    customer_pin?: string;
    lines: Array<{
      item_id?: number;
      quantity: number;
      unit_price: number;
      description: string;
      code?: string;
      uom?: string;
    }>;
    notes?: string;
    valid_until: string;
  }) {
    const response = await api.post('/quotations', quotationData);
    return response.data;
  }

  static async getQuotation(id: number) {
    const response = await api.get(`/quotations/${id}`);
    return response.data;
  }

  static async updateQuotationStatus(id: number, status: string) {
    const response = await api.patch(`/quotations/${id}/status`, { status });
    return response.data;
  }

  static async convertQuotationToInvoice(id: number) {
    const response = await api.post(`/quotations/${id}/convert-to-invoice`);
    return response.data;
  }

  static async deleteQuotation(id: number) {
    const response = await api.delete(`/quotations/${id}`);
    return response.data;
  }

  // Invoice endpoints
  static async getInvoices(params?: {
    page?: number;
    limit?: number;
    search?: string;
    status?: string;
  }) {
    const response = await api.get('/invoices', { params });
    return response.data;
  }

  static async getNextInvoiceNumber() {
    const response = await api.get('/invoices/next-invoice-number');
    return response.data;
  }

  static async createInvoice(invoiceData: {
    customer_name: string;
    customer_address?: string;
    customer_pin?: string;
    lines: Array<{
      item_id?: number;
      quantity: number;
      unit_price: number;
      description: string;
      code?: string;
      uom?: string;
    }>;
    notes?: string;
    due_date: string;
    payment_terms?: string;
  }) {
    const response = await api.post('/invoices', invoiceData);
    return response.data;
  }

  static async getInvoice(id: number) {
    const response = await api.get(`/invoices/${id}`);
    return response.data;
  }

  static async updateInvoice(id: number, invoiceData: {
    customer_name: string;
    customer_address?: string;
    customer_pin?: string;
    lines: Array<{
      item_id?: number;
      quantity: number;
      unit_price: number;
      description: string;
      code?: string;
      uom?: string;
    }>;
    notes?: string;
    due_date: string;
    payment_terms?: string;
    quotation_id?: number | null;
  }) {
    const response = await api.put(`/invoices/${id}`, invoiceData);
    return response.data;
  }

  static async updateInvoiceStatus(id: number, status: string) {
    const response = await api.patch(`/invoices/${id}/status`, { status });
    return response.data;
  }

  static async deleteInvoice(id: number) {
    const response = await api.delete(`/invoices/${id}`);
    return response.data;
  }

  // Financial Account endpoints
  static async getFinancialAccounts(params?: {
    page?: number;
    limit?: number;
    search?: string;
    sortBy?: string;
    sortOrder?: 'ASC' | 'DESC';
  }) {
    const response = await api.get('/financial-accounts', { params });
    return response.data;
  }

  static async createFinancialAccount(accountData: {
    account_name: string;
    account_type: 'cash' | 'bank' | 'mobile_money';
    account_number?: string;
    balance: number;
  }) {
    const response = await api.post('/financial-accounts', accountData);
    return response.data;
  }

  static async getFinancialAccount(id: number) {
    const response = await api.get(`/financial-accounts/${id}`);
    return response.data;
  }

  static async updateFinancialAccount(id: number, accountData: {
    account_name?: string;
    account_type?: 'cash' | 'bank' | 'mobile_money';
    account_number?: string;
    balance?: number;
    is_active?: boolean;
  }) {
    const response = await api.put(`/financial-accounts/${id}`, accountData);
    return response.data;
  }

  static async deleteFinancialAccount(id: number) {
    const response = await api.delete(`/financial-accounts/${id}`);
    return response.data;
  }

  static async getAccountBalance(id: number) {
    const response = await api.get(`/financial-accounts/${id}/balance`);
    return response.data;
  }

  // Customer endpoints
  static async getCustomers(search?: string) {
    const response = await api.get('/customers', { params: { search } });
    return response.data;
  }

  static async getCustomer(id: number) {
    const response = await api.get(`/customers/${id}`);
    return response.data;
  }

  static async createCustomer(customerData: any) {
    const response = await api.post('/customers', customerData);
    return response.data;
  }

  static async updateCustomer(id: number, customerData: any) {
    const response = await api.put(`/customers/${id}`, customerData);
    return response.data;
  }

  static async deleteCustomer(id: number) {
    const response = await api.delete(`/customers/${id}`);
    return response.data;
  }

  static async getCustomerInvoices(id: number) {
    const response = await api.get(`/customers/${id}/invoices`);
    return response.data;
  }

  // Item Categories
  static async getItemCategories() {
    const response = await api.get('/item-categories');
    return response.data;
  }

  static async getItemCategory(id: number) {
    const response = await api.get(`/item-categories/${id}`);
    return response.data;
  }

  static async createItemCategory(categoryData: { name: string; description?: string }) {
    const response = await api.post('/item-categories', categoryData);
    return response.data;
  }

  static async updateItemCategory(id: number, categoryData: { name: string; description?: string }) {
    const response = await api.put(`/item-categories/${id}`, categoryData);
    return response.data;
  }

  static async deleteItemCategory(id: number) {
    const response = await api.delete(`/item-categories/${id}`);
    return response.data;
  }

  // Generic API method for custom requests
  static async get(endpoint: string, params?: any) {
    const response = await api.get(endpoint, { params });
    return response.data;
  }

  static async post(endpoint: string, data?: any) {
    const response = await api.post(endpoint, data);
    return response.data;
  }

  static async put(endpoint: string, data?: any) {
    const response = await api.put(endpoint, data);
    return response.data;
  }

  static async delete(endpoint: string) {
    const response = await api.delete(endpoint);
    return response.data;
  }

  static async request(method: string, endpoint: string, data?: any) {
    const response = await api.request({
      method,
      url: endpoint,
      data
    });
    return response.data;
  }

  // Health check
  static async healthCheck() {
    const response = await api.get('/health');
    return response.data;
  }

  // ============ HOSPITAL MANAGEMENT ENDPOINTS ============
  
  // Receptionist endpoints
  static async createOrGetPatient(patientData: {
    patient_name: string;
    national_id?: string;
    location?: string;
    age?: number;
    phone_number?: string;
    email?: string;
    is_first_visit?: boolean;
  }) {
    const response = await api.post('/hospital/patients', patientData);
    return response.data;
  }

  static async createConsultation(consultationData: {
    patient_id: number;
    consultation_fee?: number;
  }) {
    const response = await api.post('/hospital/consultations', consultationData);
    return response.data;
  }

  static async getPendingConsultations(status?: string) {
    const response = await api.get('/hospital/consultations/pending', { params: { status } });
    return response.data;
  }

  // Doctor endpoints
  static async getDoctorVisitByConsultation(consultation_id: number) {
    const response = await api.get('/hospital/doctor-visits', { params: { consultation_id } });
    return response.data;
  }

  static async createOrUpdateDoctorVisit(visitData: {
    consultation_id: number;
    symptoms?: string;
    blood_pressure?: string;
    temperature?: number;
    heart_rate?: number;
    other_analysis?: string;
    disease_diagnosis?: string;
    notes?: string;
  }) {
    const response = await api.post('/hospital/doctor-visits', visitData);
    return response.data;
  }

  static async requestLabTests(data: {
    doctor_visit_id: number;
    tests: Array<{ test_name: string; test_type?: string }>;
  }) {
    const response = await api.post('/hospital/lab-tests/request', data);
    return response.data;
  }

  static async createPrescription(prescriptionData: {
    doctor_visit_id: number;
    items: Array<{ item_id: number; quantity_prescribed: number; unit_price?: number }>;
  }) {
    const response = await api.post('/hospital/prescriptions', prescriptionData);
    return response.data;
  }

  static async getLabTestResults(doctor_visit_id?: number) {
    const response = await api.get('/hospital/lab-tests/results', { params: { doctor_visit_id } });
    return response.data;
  }

  // Lab endpoints
  static async getPendingLabTests() {
    const response = await api.get('/hospital/lab-tests/pending');
    return response.data;
  }

  static async updateLabTestResult(lab_test_id: number, test_result: string) {
    const response = await api.put(`/hospital/lab-tests/${lab_test_id}/result`, { lab_test_id, test_result });
    return response.data;
  }

  // Pharmacy endpoints
  static async getPendingPrescriptions() {
    const response = await api.get('/hospital/prescriptions/pending');
    return response.data;
  }

  static async getPrescriptionItems(prescription_id: number) {
    try {
      const response = await api.get(`/hospital/prescriptions/${prescription_id}/items`);
      return response.data;
    } catch (err: any) {
      console.error('getPrescriptionItems primary request failed:', err?.response?.status, err?.response?.data);
      // If backend expects a different pattern (query param or different route), try a fallback for diagnosis
      try {
        const fallback = await api.get('/hospital/prescriptions/items', { params: { prescription_id } });
        console.warn('getPrescriptionItems fallback (query param) succeeded');
        return fallback.data;
      } catch (err2: any) {
        console.error('getPrescriptionItems fallback failed:', err2?.response?.status, err2?.response?.data);
        // Re-throw original error to be handled by caller
        throw err;
      }
    }
  }

  static async fulfillPrescription(prescription_id: number, data: {
    items: Array<{ prescription_item_id: number; quantity_fulfilled: number; is_available: boolean }>;
    financial_account_id?: number;
  }) {
    const response = await api.post(`/hospital/prescriptions/${prescription_id}/fulfill`, data);
    return response.data;
  }
}

export default ApiService;
export { api };