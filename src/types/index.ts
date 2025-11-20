export interface Item {
  code: string;
  uom: string | undefined;
  unit_price: number;
  stock_quantity: number;
  id: number;
  business_id: number;
  item_name: string;
  quantity: number;
  rate: number;
  unit?: string;
  description?: string;
  amount: number;
  created_at: string;
  updated_at: string;
}

export interface InvoiceLine {
  id?: number;
  item_id: number;
  code: string;
  description: string;
  quantity: number;
  unit_price: number;
  uom?: string;
  total: number;
}

export interface Invoice {
  id: number;
  business_id: number;
  invoice_number: string;
  customer_name: string;
  customer_address?: string;
  customer_pin?: string;
  subtotal: number;
  vat: number;
  total: number;
  status: 'draft' | 'sent' | 'paid';
  created_at: string;
  updated_at: string;
}

export interface DatabaseItem {
  id: number;
  code: string;
  description: string;
  unit_price: number;
  uom?: string;
  stock_quantity?: number;
}

export interface User {
  id: number;
  business_id: number;
  email: string;
  first_name: string;
  last_name: string;
  role: 'owner' | 'employee';
  status: 'active' | 'inactive';
  created_at: string;
  updated_at: string;
}

export interface Business {
  id: number;
  name: string;
  email: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  zip_code?: string;
  country?: string;
  logo_url?: string;
  status: 'active' | 'inactive';
  created_at: string;
  updated_at: string;
}

export interface AuthResponse {
  success: boolean;
  message: string;
  data: {
    user: User;
    business: Business;
    token: string;
  };
}

export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
}

// PDF Service types
export interface PdfGenerationOptions {
  customerName: string;
  customerAddress?: string;
  customerPin?: string;
  items: InvoiceLine[];
}

export interface ShareOptions {
  title: string;
  message: string;
  url: string;
}

// Salon Module Types
export interface SalonUser {
  id: string;
  user_id: string;
  business_id: string;
  role: 'admin' | 'cashier' | 'employee';
  commission_rate: number;
  is_active: boolean;
  name?: string;
  email?: string;
  phone_number?: string;
  created_at: string;
  updated_at: string;
}

export interface SalonService {
  id: string;
  business_id: string;
  name: string;
  description?: string;
  base_price: number;
  duration_minutes?: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface SalonProduct {
  id: string;
  business_id: string;
  name: string;
  description?: string;
  unit: string;
  current_stock: number;
  min_stock_level: number;
  unit_cost: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface SalonShift {
  id: string;
  business_id: string;
  user_id: string;
  user_name?: string;
  email?: string;
  clock_in: string;
  clock_out?: string;
  starting_float: number;
  total_sales: number;
  cash_sales: number;
  mpesa_sales: number;
  card_sales: number;
  expected_cash: number;
  actual_cash: number;
  difference: number;
  notes?: string;
  status: 'open' | 'closed';
  created_at: string;
  updated_at: string;
}

export interface SalonTransaction {
  id: string;
  business_id: string;
  shift_id?: string;
  employee_id: string;
  employee_name?: string;
  cashier_id: string;
  cashier_name?: string;
  service_id: string;
  service_name?: string;
  customer_name?: string;
  customer_phone?: string;
  amount_paid: number;
  payment_method: 'cash' | 'mpesa' | 'card' | 'other';
  employee_earnings: number;
  transaction_date: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface ProductUsage {
  id: string;
  transaction_id: string;
  product_id: string;
  product_name?: string;
  unit?: string;
  quantity_used: number;
  cost: number;
  created_at: string;
}

export interface EmployeePerformance {
  employee_id: string;
  employee_name: string;
  email: string;
  commission_rate: number;
  total_clients: number;
  total_revenue: number;
  total_earnings: number;
}

export interface SalonDashboardStats {
  revenue: {
    total_transactions: number;
    total_revenue: number;
    cash_revenue: number;
    mpesa_revenue: number;
    card_revenue: number;
  };
  top_services: {
    name: string;
    service_count: number;
    total_revenue: number;
  }[];
  active_employees: number;
  low_stock_count: number;
}