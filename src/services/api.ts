import axios from 'axios';
// Electron type definitions are automatically included via tsconfig

// Detect if running in Electron
const isElectron = (): boolean => {
  return typeof window !== 'undefined' && window.electronAPI !== undefined;
};

// Get API base URL - prioritize Electron local backend, then env var, then default
// For Electron, default to localhost, for web use env var or Vercel URL
const getApiBaseUrl = (): string => {
  if (isElectron()) {
    // In Electron, always use localhost backend
    return 'http://localhost:3001/api';
  }
  return import.meta.env.VITE_API_BASE_URL || 'https://erp-backend-beryl.vercel.app/api';
};

const API_BASE_URL = getApiBaseUrl();

// Log the API URL being used for debugging (always enabled)
console.log('🔗 API Base URL:', API_BASE_URL);
console.log('🏗️ Environment:', isElectron() ? 'electron' : (import.meta.env.VITE_APP_ENV || 'production'));

// Create axios instance with dynamic base URL
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Update base URL dynamically if in Electron (after window loads)
if (isElectron() && typeof window !== 'undefined') {
  window.electronAPI?.getBackendUrl().then((url: string) => {
    api.defaults.baseURL = `${url}/api`;
    console.log('🔗 Updated API Base URL for Electron:', api.defaults.baseURL);
  }).catch(() => {
    // Already set to localhost:3001/api, so this is fine
  });
}

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
    // Handle both 401 (Unauthorized) and 403 (Forbidden) as auth errors
    if (error.response?.status === 401 || error.response?.status === 403) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      localStorage.removeItem('business');
      // Only redirect if not already on login page
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
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

  static async requestPasswordReset(email: string) {
    const response = await api.post('/auth/forgot-password', { email });
    return response.data;
  }

  static async verifyPasswordResetOTP(email: string, otp: string) {
    const response = await api.post('/auth/verify-otp', { email, otp });
    return response.data;
  }

  static async resetPassword(email: string, otp: string, new_password: string, token?: string) {
    const response = await api.post('/auth/reset-password', { email, otp, new_password, token });
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
    category_1_id?: number;
    category_2_id?: number;
    reorder_level?: number;
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
    category_id?: number | null;
    category_1_id?: number | null;
    category_2_id?: number | null;
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

  static async getItemsByExpiry(params: {
    filter?: 'expired' | 'today' | 'week' | 'month' | 'custom';
    startDate?: string;
    endDate?: string;
  }) {
    const response = await api.get('/items/expiry', { params });
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
    console.log('🟡 [API SERVICE] updateQuotationStatus called:', { id, status });
    console.log('🟡 [API SERVICE] URL:', `/quotations/${id}/status`);
    console.log('🟡 [API SERVICE] Method: PATCH');
    console.log('🟡 [API SERVICE] Body:', { status });
    try {
    const response = await api.patch(`/quotations/${id}/status`, { status });
      console.log('🟡 [API SERVICE] Response received:', response.data);
    return response.data;
    } catch (error: any) {
      console.error('❌ [API SERVICE] updateQuotationStatus error:', error);
      console.error('❌ [API SERVICE] Error response:', error.response);
      throw error;
    }
  }

  static async convertQuotationToInvoice(id: number) {
    const response = await api.post(`/quotations/${id}/convert-to-invoice`);
    return response.data;
  }

  static async deleteQuotation(id: number) {
    console.log('🟠 [API SERVICE] deleteQuotation called:', { id });
    console.log('🟠 [API SERVICE] URL:', `/quotations/${id}`);
    console.log('🟠 [API SERVICE] Method: DELETE');
    try {
    const response = await api.delete(`/quotations/${id}`);
      console.log('🟠 [API SERVICE] Response received:', response.data);
    return response.data;
    } catch (error: any) {
      console.error('❌ [API SERVICE] deleteQuotation error:', error);
      console.error('❌ [API SERVICE] Error response:', error.response);
      throw error;
    }
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
    discount_amount?: number;
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
    discount_amount?: number;
  }) {
    const response = await api.put(`/invoices/${id}`, invoiceData);
    return response.data;
  }

  static async updateInvoiceStatus(id: number, status: string) {
    console.log('🔵 [API SERVICE] updateInvoiceStatus called:', { id, status });
    console.log('🔵 [API SERVICE] URL:', `/invoices/${id}/status`);
    console.log('🔵 [API SERVICE] Method: PATCH');
    console.log('🔵 [API SERVICE] Body:', { status });
    try {
    const response = await api.patch(`/invoices/${id}/status`, { status });
      console.log('🔵 [API SERVICE] Response received:', response.data);
    return response.data;
    } catch (error: any) {
      console.error('❌ [API SERVICE] updateInvoiceStatus error:', error);
      console.error('❌ [API SERVICE] Error response:', error.response);
      throw error;
    }
  }

  static async deleteInvoice(id: number) {
    console.log('🔴 [API SERVICE] deleteInvoice called:', { id });
    console.log('🔴 [API SERVICE] URL:', `/invoices/${id}`);
    console.log('🔴 [API SERVICE] Method: DELETE');
    try {
    const response = await api.delete(`/invoices/${id}`);
      console.log('🔴 [API SERVICE] Response received:', response.data);
    return response.data;
    } catch (error: any) {
      console.error('❌ [API SERVICE] deleteInvoice error:', error);
      console.error('❌ [API SERVICE] Error response:', error.response);
      throw error;
    }
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

  static async getAccountTransactionHistory(params: {
    accountId?: number;
    filter?: 'today' | 'week' | 'month' | 'custom';
    startDate?: string;
    endDate?: string;
  }) {
    const response = await api.get('/financial-accounts/transactions/history', { params });
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

  // Business settings
  static async getBusinessSettings() {
    const response = await api.get('/business-settings');
    return response.data;
  }

  static async updateBusinessSettings(settings: {
    businessName: string;
    street?: string;
    city?: string;
    email: string;
    telephone: string;
    pin?: string;
    createdBy?: string;
    approvedBy?: string;
    createdBySignature?: string;
    approvedBySignature?: string;
    logo?: string;
  }) {
    const response = await api.post('/business-settings', settings);
    return response.data;
  }

  // Business custom category names
  static async getBusinessCategoryNames() {
    const response = await api.get('/item-categories/business/names');
    return response.data;
  }

  static async updateBusinessCategoryNames(data: { category_name?: string; category_1_name?: string; category_2_name?: string }) {
    const response = await api.put('/item-categories/business/names', data);
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

  // ============ DATABASE SYNC ENDPOINTS ============
  
  // Get database sync status
  static async getSyncStatus() {
    const response = await api.get('/sync/status');
    return response.data;
  }

  // Switch database mode (local or neon)
  static async switchDatabaseMode(mode: 'local' | 'neon') {
    const response = await api.post('/sync/mode', { mode });
    return response.data;
  }

  // Sync all data from local to Neon
  static async syncAllData() {
    const response = await api.post('/sync/sync-all');
    return response.data;
  }

  // Sync specific table from local to Neon
  static async syncTable(tableName: string) {
    const response = await api.post('/sync/sync-table', { tableName });
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
    tests: Array<{ test_name: string; test_type?: string; category?: string; others?: string; price?: number }>;
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

  static async getLabTestResults(doctor_visit_id?: number, allResults?: boolean) {
    const params: any = {};
    if (doctor_visit_id) params.doctor_visit_id = doctor_visit_id;
    if (allResults) params.all_results = 'true';
    const response = await api.get('/hospital/lab-tests/results', { params });
    return response.data;
  }

  static async markLabResultViewed(lab_test_id: number) {
    const response = await api.post('/hospital/lab-tests/mark-viewed', { lab_test_id });
    return response.data;
  }

  static async getDoctorPatients(search?: string) {
    const params: any = {};
    if (search) params.search = search;
    const response = await api.get('/hospital/doctor/patients', { params });
    return response.data;
  }

  static async getPatientConsultationHistory(patientId?: number, nationalId?: string) {
    const params: any = {};
    if (patientId) params.patient_id = patientId;
    if (nationalId) params.national_id = nationalId;
    const response = await api.get('/hospital/patient/history', { params });
    return response.data;
  }

  // Lab endpoints
  static async getPendingLabTests() {
    const response = await api.get('/hospital/lab-tests/pending');
    return response.data;
  }

  static async getGroupedPendingLabTests() {
    const response = await api.get('/hospital/lab-tests/pending/grouped');
    return response.data;
  }

  static async getAllLabTests(search?: string, status?: string) {
    const params: any = {};
    if (search) params.search = search;
    if (status) params.status = status;
    const response = await api.get('/hospital/lab-tests/all', { params });
    return response.data;
  }

  static async updateLabTestResult(
    lab_test_id: number, 
    test_result: string, 
    attachment_url?: string, 
    attachment_filename?: string
  ) {
    const response = await api.put(`/hospital/lab-tests/${lab_test_id}/result`, { 
      lab_test_id, 
      test_result,
      attachment_url,
      attachment_filename
    });
    return response.data;
  }

  // Pharmacy endpoints
  static async getPendingPrescriptions() {
    const response = await api.get('/hospital/prescriptions/pending');
    return response.data;
  }

  static async getAllPrescriptions(params?: {
    status?: string;
    startDate?: string;
    endDate?: string;
    search?: string;
  }) {
    const response = await api.get('/hospital/prescriptions', { params });
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
        // Try POST fallback (some APIs expect an ID in the request body)
        try {
          const postFallback = await api.post('/hospital/prescriptions/items', { prescription_id });
          console.warn('getPrescriptionItems POST fallback succeeded');
          return postFallback.data;
        } catch (err3: any) {
          console.error('getPrescriptionItems POST fallback failed:', err3?.response?.status, err3?.response?.data);
          // Re-throw original error to be handled by caller
          throw err;
        }
      }
    }
  }

  static async fulfillPrescription(prescription_id: number, data: {
    prescription_id?: number;
    items: Array<{ prescription_item_id: number; quantity_fulfilled: number; is_available: boolean }>;
    financial_account_id?: number;
  }) {
    const response = await api.post(`/hospital/prescriptions/${prescription_id}/fulfill`, data);
    return response.data;
  }

  // M-Pesa C2B Confirmation endpoints
  static async getPendingMpesaConfirmations() {
    const response = await api.get('/mpesa/confirmations/pending');
    return response.data;
  }

  static async getAllMpesaConfirmations(params?: { linked?: boolean; limit?: number }) {
    const response = await api.get('/mpesa/confirmations', { params });
    return response.data;
  }

  static async linkMpesaConfirmation(confirmationId: number, invoiceId: number) {
    const response = await api.post(`/mpesa/confirmations/${confirmationId}/link`, { invoice_id: invoiceId });
    return response.data;
  }

  static async searchMpesaConfirmationByCode(code: string) {
    const response = await api.get(`/mpesa/confirmations/search/${encodeURIComponent(code)}`);
    return response.data;
  }

  static async saveManualMpesaConfirmation(data: {
    trans_id: string;
    trans_amount?: number;
    msisdn?: string;
    first_name?: string;
    middle_name?: string;
    last_name?: string;
    trans_time?: string;
  }) {
    const response = await api.post('/mpesa/confirmations/manual', data);
    return response.data;
  }

  // Pharmacy lab test endpoints
  static async getPendingLabTestsForPharmacy() {
    const response = await api.get('/hospital/lab-tests/pharmacy/pending');
    return response.data;
  }

  static async getGroupedPendingLabTestsForPharmacy() {
    const response = await api.get('/hospital/lab-tests/pharmacy/pending/grouped');
    return response.data;
  }

  static async getAllLabTestsForPharmacy(params?: {
    status?: string;
    startDate?: string;
    endDate?: string;
    search?: string;
    payment_status?: string;
  }) {
    const response = await api.get('/hospital/lab-tests/pharmacy/all', { params });
    return response.data;
  }

  static async billLabTests(data: {
    lab_test_ids: number[];
    amount_paid?: number;
    financial_account_id?: number;
  }) {
    const response = await api.post('/hospital/lab-tests/pharmacy/bill', data);
    return response.data;
  }

  // Lab test analytics
  static async getLabTestAnalytics(params?: {
    startDate?: string;
    endDate?: string;
  }) {
    const response = await api.get('/hospital/lab-tests/analytics', { params });
    return response.data;
  }

  // Hospital analytics
  static async getHospitalAnalytics(params?: {
    startDate?: string;
    endDate?: string;
  }) {
    const response = await api.get('/hospital/analytics', { params });
    return response.data;
  }
}

export default ApiService;
export { api };