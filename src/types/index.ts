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