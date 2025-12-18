import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Table,
  TableBody,
  TableCell,
  TableRow,
  TableContainer,
  TableHead,
  Chip,
  IconButton,
  Checkbox,
  FormControlLabel,
  Divider,
  useMediaQuery,
  useTheme,
  Tabs,
  Tab,
} from '@mui/material';
import { Add, Delete, Search as SearchIcon, Print as PrintIcon, Category as CategoryIcon, People as PeopleIcon, Visibility as ViewIcon, Edit as EditIcon } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import * as salonApi from '../../services/salonApi';
import ApiService, { api } from '../../services/api';
import type { SalonService, SalonUser, SalonProduct, SalonShift } from '../../types';

interface ServiceItem {
  service_id: string;
  service_name: string;
  amount: number;
  employee_id?: string;
  employee_name?: string;
}

interface ProductItem {
  product_id: string;
  product_name: string;
  quantity_used: number;
  cost: number;
}

interface BillItem {
  id: string;
  type: 'service' | 'product';
  name: string;
  quantity: number;
  unit_price: number;
  total: number;
  employee_id?: string;
  employee_name?: string;
  service_id?: string;
  product_id?: string;
}

const SalonPOS: React.FC = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [currentShift, setCurrentShift] = useState<SalonShift | null>(null);
  const [employees, setEmployees] = useState<SalonUser[]>([]);
  const [services, setServices] = useState<SalonService[]>([]);
  const [products, setProducts] = useState<any[]>([]); // Changed to any[] to match items from main table
  const [includeVAT, setIncludeVAT] = useState(true); // VAT checkbox state
  const [discount, setDiscount] = useState<number>(0); // Discount amount
  
  const [selectedEmployee, setSelectedEmployee] = useState('');
  const [selectedService, setSelectedService] = useState('');
  const [customAmount, setCustomAmount] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'mpesa' | 'card' | 'other'>('cash');
  const [mpesaCode, setMpesaCode] = useState('');
  const [mpesaModalOpen, setMpesaModalOpen] = useState(false);
  const [mpesaConfirmations, setMpesaConfirmations] = useState<any[]>([]);
  const [mpesaTabValue, setMpesaTabValue] = useState(0);
  const [manualMpesaCode, setManualMpesaCode] = useState('');
  const [searchingCode, setSearchingCode] = useState(false);
  const [codeSearchResult, setCodeSearchResult] = useState<{ found: boolean; confirmation: any } | null>(null);
  const [mpesaMessage, setMpesaMessage] = useState('');
  const [generateInvoice, setGenerateInvoice] = useState(true);
  const [selectedAccount, setSelectedAccount] = useState<string>('');
  const [accounts, setAccounts] = useState<any[]>([]);
  const [accountsOpen, setAccountsOpen] = useState(false);
  
  // Billing cart
  const [billItems, setBillItems] = useState<BillItem[]>([]);
  const [showProductBillingDialog, setShowProductBillingDialog] = useState(false);
  const [selectedBillingProduct, setSelectedBillingProduct] = useState('');
  const [billingProductQuantity, setBillingProductQuantity] = useState('');
  const [billingProductPrice, setBillingProductPrice] = useState('');
  const [billingProductDiscount, setBillingProductDiscount] = useState('');
  const [selectedProductInfo, setSelectedProductInfo] = useState<any>(null);
  
  const [amountPaid, setAmountPaid] = useState<number>(0);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [invoiceSearchQuery, setInvoiceSearchQuery] = useState('');
  const [invoiceSearchOpen, setInvoiceSearchOpen] = useState(false);
  const [editingInvoice, setEditingInvoice] = useState<any>(null);
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [createdInvoiceId, setCreatedInvoiceId] = useState<number | null>(null);
  const [lastTransactionData, setLastTransactionData] = useState<any>(null);

  useEffect(() => {
    loadData();
    fetchFinancialAccounts();
  }, []);

  // Fetch financial accounts
  const fetchFinancialAccounts = async () => {
    try {
      const response = await ApiService.getFinancialAccounts();
      const data = response.data?.accounts || response.accounts || [];
      setAccounts(data);
      if (Array.isArray(data) && data.length > 0) {
        setSelectedAccount(String(data[0].id));
      }
    } catch (err: any) {
      console.error('Failed to fetch accounts:', err);
    }
  };

  // Fetch pending M-Pesa confirmations
  const fetchMpesaConfirmations = async () => {
    try {
      setLoading(true);
      // Try to get pending confirmations
      const response = await api.get('/mpesa/confirmations/pending');
      const confirmations = response.data?.confirmations || response.data?.data || [];
      setMpesaConfirmations(confirmations);
    } catch (error) {
      console.error('Failed to fetch M-Pesa confirmations:', error);
      setMpesaConfirmations([]);
    } finally {
      setLoading(false);
    }
  };

  // Handle M-Pesa confirmation selection
  const handleMpesaConfirmationSelect = (confirmation: any) => {
    setMpesaCode(confirmation.trans_id);
    setAmountPaid(parseFloat(confirmation.trans_amount) || 0);
    setMpesaModalOpen(false);
  };

  // Search M-Pesa confirmation by code
  const handleSearchMpesaCode = async () => {
    if (!manualMpesaCode.trim()) {
      setError('Please enter a transaction code');
      return;
    }

    try {
      setSearchingCode(true);
      setError('');
      const response = await ApiService.searchMpesaConfirmationByCode(manualMpesaCode.trim());
      
      if (response.success && response.data.found) {
        const confirmation = response.data.confirmation;
        setCodeSearchResult({ found: true, confirmation });
        setMpesaCode(confirmation.trans_id);
        setAmountPaid(parseFloat(confirmation.trans_amount) || 0);
        setSuccess('M-Pesa confirmation found and amount populated!');
        setTimeout(() => setSuccess(''), 3000);
      } else {
        setCodeSearchResult({ found: false, confirmation: null });
        // Ask user if they want to save the code
        const shouldSave = window.confirm(
          `M-Pesa confirmation with code "${manualMpesaCode.trim()}" not found. Do you want to save this code for future reference?`
        );
        
        if (shouldSave) {
          await handleSaveManualMpesaCode();
        }
      }
    } catch (err: any) {
      console.error('Error searching M-Pesa code:', err);
      setError(err.response?.data?.message || 'Failed to search M-Pesa confirmation');
    } finally {
      setSearchingCode(false);
    }
  };

  // Parse M-Pesa message to extract transaction code and amount
  const parseMpesaMessage = (message: string) => {
    try {
      // Extract transaction code - usually alphanumeric code before "Confirmed"
      // Pattern: alphanumeric code (usually uppercase, 8-12 characters) followed by "Confirmed"
      // Also try pattern without space: "CODEConfirmed"
      let codeMatch = message.match(/([A-Z0-9]{8,12})\s+Confirmed/i);
      if (!codeMatch) {
        // Try pattern without space
        codeMatch = message.match(/([A-Z0-9]{8,12})Confirmed/i);
      }
      const extractedCode = codeMatch ? codeMatch[1].trim() : null;

      // Extract amount - look for "Ksh" or "KES" followed by number
      // Pattern: "Ksh" or "KES" followed by number with optional commas and decimals
      // Try multiple patterns to handle variations
      let amountMatch = message.match(/(?:Ksh|KES)\s*([\d,]+\.?\d*)/i);
      if (!amountMatch) {
        // Try pattern with "received" keyword: "received Ksh1,000.00"
        amountMatch = message.match(/received\s+(?:Ksh|KES)\s*([\d,]+\.?\d*)/i);
      }
      if (!amountMatch) {
        // Try pattern: "Ksh1,000.00" (no space)
        amountMatch = message.match(/(?:Ksh|KES)([\d,]+\.?\d*)/i);
      }
      
      let extractedAmount = 0;
      if (amountMatch) {
        // Remove commas and parse the number
        const amountStr = amountMatch[1].replace(/,/g, '');
        extractedAmount = parseFloat(amountStr) || 0;
        // Round to nearest whole number
        extractedAmount = Math.round(extractedAmount);
      }

      return {
        code: extractedCode,
        amount: extractedAmount
      };
    } catch (err) {
      console.error('Error parsing M-Pesa message:', err);
      return {
        code: null,
        amount: 0
      };
    }
  };

  // Save manual M-Pesa confirmation
  const handleSaveManualMpesaCode = async () => {
    if (!manualMpesaCode.trim()) {
      setError('Please enter a transaction code');
      return;
    }

    try {
      setLoading(true);
      setError('');
      const response = await ApiService.saveManualMpesaConfirmation({
        trans_id: manualMpesaCode.trim(),
        trans_amount: amountPaid || 0,
      });

      if (response.success) {
        setMpesaCode(manualMpesaCode.trim());
        setSuccess('M-Pesa confirmation code saved successfully!');
        setMpesaModalOpen(false);
        setMpesaTabValue(0);
        setManualMpesaCode('');
        setCodeSearchResult(null);
        setTimeout(() => setSuccess(''), 3000);
      } else {
        throw new Error(response.message || 'Failed to save confirmation code');
      }
    } catch (err: any) {
      console.error('Error saving manual M-Pesa code:', err);
      setError(err.response?.data?.message || 'Failed to save M-Pesa confirmation code');
    } finally {
      setLoading(false);
    }
  };

  const loadData = async () => {
    try {
      console.log('🔄 Loading POS data...');
      const [shiftRes, employeesRes, servicesRes, itemsRes] = await Promise.all([
        salonApi.getCurrentShift(),
        salonApi.getSalonUsers(),
        salonApi.getServices(),
        ApiService.getItems(), // Fetch from main items table instead of salon products
      ]);

      console.log('📥 Shift response:', shiftRes.data);
      console.log('📥 Employees response:', employeesRes.data);
      console.log('📥 Services response:', servicesRes.data);
      console.log('📥 Items response:', itemsRes);

      // Handle shift response - check multiple formats
      let shiftData = null;
      
      // Check if data exists and is not null/undefined
      const responseData = shiftRes.data?.data;
      const hasData = responseData !== null && responseData !== undefined && Object.keys(responseData || {}).length > 0;
      
      if (shiftRes.data?.success && hasData) {
        shiftData = responseData;
      } else if (shiftRes.data && hasData) {
        shiftData = responseData;
      } else if (shiftRes.data && Array.isArray(shiftRes.data) && shiftRes.data.length > 0) {
        // Direct array response
        shiftData = shiftRes.data[0];
      } else if (shiftRes.data && typeof shiftRes.data === 'object' && shiftRes.data.id && shiftRes.data.status) {
        // Direct object response (not wrapped) - check for shift properties
        shiftData = shiftRes.data;
      }
      
      if (shiftData && shiftData.id && shiftData.status === 'open') {
        setCurrentShift(shiftData);
      } else {
        setCurrentShift(null);
      }

      // Handle employees response
      let employeesData: SalonUser[] = [];
      if (Array.isArray(employeesRes.data)) {
        employeesData = employeesRes.data;
      } else if (employeesRes.data?.success && Array.isArray(employeesRes.data.data)) {
        employeesData = employeesRes.data.data;
      } else if (employeesRes.data?.data && Array.isArray(employeesRes.data.data)) {
        employeesData = employeesRes.data.data;
      }
      setEmployees(employeesData.filter((u: SalonUser) => u.role === 'employee' && u.is_active));

      // Handle services response
      let servicesData: SalonService[] = [];
      if (Array.isArray(servicesRes.data)) {
        servicesData = servicesRes.data;
      } else if (servicesRes.data?.success && Array.isArray(servicesRes.data.data)) {
        servicesData = servicesRes.data.data;
      } else if (servicesRes.data?.data && Array.isArray(servicesRes.data.data)) {
        servicesData = servicesRes.data.data;
      }
      setServices(servicesData);

      // Handle items response (from main items table)
      let itemsData: any[] = [];
      if (Array.isArray(itemsRes)) {
        itemsData = itemsRes;
      } else if (itemsRes?.success && Array.isArray(itemsRes.data?.items)) {
        itemsData = itemsRes.data.items;
      } else if (itemsRes?.items && Array.isArray(itemsRes.items)) {
        itemsData = itemsRes.items;
      } else if (itemsRes?.data && Array.isArray(itemsRes.data)) {
        itemsData = itemsRes.data;
      }
      // Filter only active items with stock > 0
      setProducts(itemsData.filter((item: any) => item.quantity > 0));
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load data');
    }
  };

  // Add service to billing cart
  const handleBillService = () => {
    if (!selectedEmployee || !selectedService) {
      setError('Please select employee and service');
      return;
    }

    const service = services.find(s => s.id === selectedService);
    if (!service) return;

    const employee = employees.find(e => e.user_id === selectedEmployee);
    const servicePrice = typeof service.base_price === 'string' 
      ? parseFloat(service.base_price) 
      : service.base_price || 0;
    const amount = customAmount ? parseFloat(customAmount) : servicePrice;

    if (!amount || amount <= 0) {
      setError('Invalid amount');
      return;
    }

    const billItem: BillItem = {
      id: `service-${Date.now()}`,
      type: 'service',
      name: service.name,
      quantity: 1,
      unit_price: amount,
      total: amount,
      employee_id: selectedEmployee,
      employee_name: employee?.name || '',
      service_id: selectedService,
    };

    setBillItems([...billItems, billItem]);
    setSuccess('Service added to bill');
    setTimeout(() => setSuccess(''), 2000);
  };

  // Add product to billing cart
  const handleBillProduct = () => {
    if (!selectedBillingProduct || !billingProductQuantity) {
      setError('Please select product and quantity');
      return;
    }

    const product = products.find(p => p.id === selectedBillingProduct);
    if (!product) return;

    const quantity = parseFloat(billingProductQuantity);
    // Use selling_price from main items table, fallback to price or unit_cost
    const defaultPrice = product.selling_price || product.price || 
      (typeof product.unit_cost === 'string' ? parseFloat(product.unit_cost) : product.unit_cost || 0);
    const price = billingProductPrice ? parseFloat(billingProductPrice) : defaultPrice;
    const total = quantity * price;

    if (quantity <= 0 || price <= 0) {
      setError('Invalid quantity or price');
      return;
    }

    // Calculate discount
    const discount = billingProductDiscount ? parseFloat(billingProductDiscount) : 0;
    const discountAmount = (total * discount) / 100;
    const finalTotal = total - discountAmount;

    const billItem: BillItem = {
      id: `product-${Date.now()}`,
      type: 'product',
      name: product.item_name || product.name || 'Product',
      quantity: quantity,
      unit_price: price,
      total: finalTotal,
      product_id: selectedBillingProduct,
    };

    setBillItems([...billItems, billItem]);
    setSuccess('Product added to bill');
    setTimeout(() => setSuccess(''), 2000);
    
    // Reset product billing form
    setSelectedBillingProduct('');
    setBillingProductQuantity('');
    setBillingProductPrice('');
    setBillingProductDiscount('');
    setSelectedProductInfo(null);
    setShowProductBillingDialog(false);
  };

  // Remove item from bill
  const handleRemoveBillItem = (id: string) => {
    setBillItems(billItems.filter(item => item.id !== id));
  };

  // Calculate bill totals
  const calculateBillTotals = () => {
    const subtotal = billItems.reduce((sum, item) => sum + item.total, 0);
    const vat = includeVAT ? subtotal * 0.16 : 0; // 16% VAT if enabled
    const totalBeforeDiscount = subtotal + vat;
    const discountAmount = Number(discount) || 0;
    const total = Math.max(0, totalBeforeDiscount - discountAmount); // Ensure total doesn't go negative
    const balanceDue = Math.max(0, total - amountPaid);
    const paymentStatus = amountPaid >= total ? 'paid' : amountPaid > 0 ? 'partial' : 'unpaid';
    return { subtotal, vat, discountAmount, total, balanceDue, paymentStatus };
  };

  // Fetch salon invoices
  const fetchSalonInvoices = async () => {
    try {
      setLoading(true);
      setError('');
      console.log('🔍 Fetching salon invoices...');
      const response = await ApiService.getInvoices({ limit: 100 });
      console.log('📥 Invoice API response:', response);
      
      // Handle different response structures
      let allInvoices: any[] = [];
      if (response.success && response.data?.invoices) {
        allInvoices = response.data.invoices;
      } else if (response.data?.invoices) {
        allInvoices = response.data.invoices;
      } else if (response.invoices) {
        allInvoices = response.invoices;
      } else if (Array.isArray(response)) {
        allInvoices = response;
      } else if (Array.isArray(response.data)) {
        allInvoices = response.data;
      }
      
      console.log('📋 All invoices:', allInvoices);
      
      // Filter salon invoices by checking:
      // 1. Invoice number starts with SALON_INV (if using custom prefix)
      // 2. Notes contain "Salon Bill" (the identifier we use when creating salon invoices)
      const salonInvoices = allInvoices.filter((inv: any) => {
        const hasSalonPrefix = inv.invoice_number && inv.invoice_number.startsWith('SALON_INV');
        const hasSalonNotes = inv.notes && inv.notes.includes('Salon Bill');
        return hasSalonPrefix || hasSalonNotes;
      });
      
      console.log('✨ Filtered salon invoices:', salonInvoices);
      setInvoices(salonInvoices);
      
      if (salonInvoices.length === 0 && allInvoices.length > 0) {
        console.warn('⚠️ No salon invoices found. Total invoices:', allInvoices.length);
        console.warn('📝 Sample invoice notes:', allInvoices.slice(0, 3).map((inv: any) => ({ 
          number: inv.invoice_number, 
          notes: inv.notes 
        })));
      }
    } catch (error: any) {
      console.error('❌ Failed to fetch invoices:', error);
      setError(error.response?.data?.message || error.message || 'Failed to load invoices');
    } finally {
      setLoading(false);
    }
  };

  // Handle invoice search
  const handleInvoiceSearch = () => {
    fetchSalonInvoices();
    setInvoiceSearchOpen(true);
  };

  // Handle view invoice receipt
  const handleViewInvoice = (invoice: any) => {
    // Set the invoice data for receipt generation
    setLastTransactionData({
      items: invoice.lines || [],
      customerName: invoice.customer_name,
      customerPhone: invoice.customer_address?.replace('Phone: ', '') || '',
      paymentMethod: invoice.payment_method?.toLowerCase() || 'cash',
      mpesaCode: invoice.mpesa_code || '',
      employee: null,
      invoiceNumber: invoice.invoice_number,
      total: invoice.total_amount || invoice.total || 0,
      subtotal: invoice.subtotal || 0,
      vat: invoice.vat || 0,
    });
    setCreatedInvoiceId(invoice.id);
    generateReceipt();
    setInvoiceSearchOpen(false);
  };

  // Handle edit invoice
  const handleEditInvoice = async (invoice: any) => {
    try {
      setLoading(true);
      setError('');
      console.log('✏️ Loading invoice for edit:', invoice.id);
      // Fetch full invoice details
      const response = await ApiService.getInvoice(invoice.id);
      console.log('📥 Invoice response:', response);
      
      // Handle different response structures
      let fullInvoice: any = null;
      if (response.success && response.data) {
        fullInvoice = response.data;
      } else if (response.data) {
        fullInvoice = response.data;
      } else if (response.invoice) {
        fullInvoice = response.invoice;
      } else {
        fullInvoice = response;
      }
      
      console.log('📋 Full invoice data:', fullInvoice);
      
      setEditingInvoice(fullInvoice);
      // Prefill form with invoice data
      setCustomerName(fullInvoice.customer_name || '');
      setCustomerPhone(fullInvoice.customer_address?.replace('Phone: ', '') || '');
      setPaymentMethod((fullInvoice.payment_method?.toLowerCase() || 'cash') as any);
      setMpesaCode(fullInvoice.mpesa_code || '');
      
      // Convert amountPaid to number (handle string from database)
      const amountPaidValue = parseFloat(String(fullInvoice.amount_paid || fullInvoice.total_amount || 0));
      setAmountPaid(amountPaidValue);
      
      // Check if VAT is included (vat_amount > 0 or vat > 0)
      const vatAmount = parseFloat(String(fullInvoice.vat_amount || fullInvoice.vat || 0));
      setIncludeVAT(vatAmount > 0);
      
      // Convert invoice lines to bill items
      const items: BillItem[] = (fullInvoice.lines || []).map((line: any, index: number) => {
        // Convert all numeric values from strings to numbers
        const quantity = parseFloat(String(line.quantity || 1));
        const unitPrice = parseFloat(String(line.unit_price || 0));
        const lineTotal = parseFloat(String(line.total || (quantity * unitPrice) || 0));
        
        return {
          id: `item-${index}-${Date.now()}`,
          type: line.uom === 'service' ? 'service' : 'product',
          name: line.description || 'Item',
          quantity: quantity,
          unit_price: unitPrice,
          total: lineTotal,
          service_id: line.service_id,
          product_id: line.product_id || line.item_id,
        };
      });
      setBillItems(items);
      
      // Set account if available
      if (fullInvoice.payment_method_id) {
        setSelectedAccount(String(fullInvoice.payment_method_id));
      } else if (fullInvoice.payment_method) {
        // Try to find account by payment method name
        const account = accounts.find(acc => 
          acc.account_name.toLowerCase().includes(fullInvoice.payment_method?.toLowerCase() || '')
        );
        if (account) {
          setSelectedAccount(String(account.id));
        }
      }
      
      // Close invoice search modal and use main billing screen for editing
      setInvoiceSearchOpen(false);
      setSuccess('Invoice loaded for editing. Make your changes and click "Complete Bill" to save.');
      setTimeout(() => setSuccess(''), 5000);
    } catch (err: any) {
      console.error('Error loading invoice:', err);
      setError('Failed to load invoice details');
    } finally {
      setLoading(false);
    }
  };


  // Generate invoice number
  const generateInvoiceNumber = async () => {
    try {
      const response = await ApiService.getInvoices({ limit: 1 });
      const invoices = response.data?.invoices || response.invoices || [];
      
      let nextNumber = 1;
      if (invoices.length > 0) {
        const lastInvoice = invoices[0];
        const lastNumber = lastInvoice.invoice_number;
        
        if (lastNumber && lastNumber.startsWith('SALON_INV')) {
          const numPart = lastNumber.replace('SALON_INV', '');
          nextNumber = parseInt(numPart) + 1;
        }
      }
      
      return `SALON_INV${String(nextNumber).padStart(5, '0')}`;
    } catch (error) {
      console.error('Error generating invoice number:', error);
      return `SALON_INV${Date.now()}`;
    }
  };

  // Generate invoice for service
  const generateInvoiceForService = async (serviceAmount: number, transactionData?: any) => {
    try {
      if (!selectedAccount) {
        console.warn('No account selected, skipping invoice generation');
      return;
    }

      const invoiceNumber = await generateInvoiceNumber();
      const currentDate = new Date().toISOString().split('T')[0];
      const vatAmount = includeVAT ? serviceAmount * 0.16 : 0; // 16% VAT if enabled
      const subtotal = serviceAmount;
      const total = subtotal + vatAmount;

    const service = services.find(s => s.id === selectedService);
      const employee = employees.find(e => e.user_id === selectedEmployee);

      const invoiceData: any = {
        customer_name: customerName || 'Walk-in Customer',
        customer_address: customerPhone ? `Phone: ${customerPhone}` : '',
        lines: [{
          quantity: 1,
          unit_price: serviceAmount,
          description: service?.name || 'Salon Service',
          code: '',
          uom: 'service',
        }],
        notes: `Salon Service - Employee: ${employee?.name || 'N/A'}, Shift: ${currentShift?.id || 'N/A'}`,
        due_date: currentDate,
        payment_terms: paymentMethod === 'mpesa' ? 'M-Pesa' : paymentMethod === 'card' ? 'Card' : 'Cash',
        payment_method: paymentMethod === 'mpesa' ? 'M-Pesa' : paymentMethod === 'card' ? 'Card' : 'Cash',
        mpesa_code: paymentMethod === 'mpesa' && mpesaCode ? mpesaCode : '',
        amountPaid: total,
        paymentMethod: selectedAccount || null,
      };

      const result = await ApiService.createInvoice(invoiceData);
      const createdInvoice = result.data?.invoice || result.invoice;

      if (createdInvoice?.id) {
        // Update invoice status to paid
        await api.patch(`/invoices/${createdInvoice.id}/status`, { 
          status: 'paid'
        });

        // Link M-Pesa confirmation if M-Pesa code is provided
        if (paymentMethod === 'mpesa' && mpesaCode) {
          try {
            const confirmationsResponse = await api.get('/mpesa/confirmations?linked=false');
            const confirmations = confirmationsResponse.data?.confirmations || [];
            const matchingConfirmation = confirmations.find((c: any) => c.trans_id === mpesaCode);
            
            if (matchingConfirmation) {
              await api.post(`/mpesa/confirmations/${matchingConfirmation.id}/link`, {
                invoice_id: createdInvoice.id
              });
            }
          } catch (linkError) {
            console.error('⚠️ Failed to link M-Pesa confirmation:', linkError);
          }
        }

        setCreatedInvoiceId(createdInvoice.id);
        setSuccess(`Service recorded and invoice ${invoiceNumber} generated successfully!`);
      }
    } catch (err: any) {
      console.error('Error generating invoice:', err);
      setError('Service recorded but failed to generate invoice: ' + (err.response?.data?.message || err.message));
    }
  };

  // Generate receipt
  const generateReceipt = async () => {
    if (billItems.length === 0 && !lastTransactionData) {
      setError('No items to generate receipt for. Please complete a bill first.');
      return;
    }

    const itemsToPrint = billItems.length > 0 ? billItems : (lastTransactionData?.items || []);
    if (itemsToPrint.length === 0) {
      setError('No items to print');
      return;
    }

    // Fetch business settings from API
    let businessSettings: any = {};
    try {
      const response = await ApiService.getBusinessSettings();
      if (response.success && response.data) {
        businessSettings = response.data;
      }
    } catch (err) {
      console.error('Error fetching business settings:', err);
      // Fallback to localStorage
      const savedSettings = localStorage.getItem('businessSettings');
      if (savedSettings) {
        businessSettings = JSON.parse(savedSettings);
      }
    }
    
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    
    // Build full address from street and city
    const fullAddress = [businessSettings.street, businessSettings.city]
      .filter(Boolean)
      .join(', ') || 'Business Address';
    const { subtotal, vat, discountAmount, total } = billItems.length > 0 
      ? calculateBillTotals() 
      : (() => {
          const st = itemsToPrint.reduce((sum: number, item: any) => sum + (item.total || item.unit_price || 0), 0);
          const v = st * 0.16;
          const d = 0; // No discount for historical receipts
          return { subtotal: st, vat: v, discountAmount: d, total: st + v - d };
        })();
    
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert('Please allow popups to print receipt');
      return;
    }
    
    const customerNameToPrint = customerName || lastTransactionData?.customerName || '';
    const customerPhoneToPrint = customerPhone || lastTransactionData?.customerPhone || '';
    const paymentMethodToPrint = paymentMethod || lastTransactionData?.paymentMethod || 'cash';
    const mpesaCodeToPrint = mpesaCode || lastTransactionData?.mpesaCode || '';
    const employeeToPrint = employees.find(e => e.user_id === selectedEmployee) || lastTransactionData?.employee;

    const receiptHTML = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Salon Receipt</title>
        <style>
          @media print {
            @page { margin: 0.5cm; size: 80mm auto; }
            body {
              width: 80mm !important;
              margin: 0 auto !important;
              padding: 10px !important;
            }
          }
          @media screen {
            body {
              width: 100%;
              max-width: 80mm;
              margin: 0 auto;
            }
          }
          body {
            font-family: 'Courier New', monospace;
            width: 80mm;
            margin: 0 auto;
            padding: 10px;
            font-size: 12px;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          .header {
            text-align: center;
            border-bottom: 2px dashed #000;
            padding-bottom: 10px;
            margin-bottom: 10px;
          }
          .header h2 {
            margin: 5px 0;
            font-size: 18px;
          }
          .header p {
            margin: 3px 0;
            font-size: 11px;
          }
          .info {
            margin: 10px 0;
            font-size: 11px;
          }
          .items {
            width: 100%;
            margin: 10px 0;
            border-collapse: collapse;
          }
          .items th {
            border-bottom: 1px solid #000;
            padding: 5px 2px;
            text-align: left;
            font-size: 11px;
          }
          .items td {
            padding: 5px 2px;
            font-size: 11px;
          }
          .items tr {
            border-bottom: 1px dashed #ccc;
          }
          .totals {
            margin-top: 10px;
            padding-top: 10px;
            border-top: 2px dashed #000;
          }
          .totals-row {
            display: flex;
            justify-content: space-between;
            padding: 3px 0;
            font-size: 12px;
          }
          .total-final {
            font-weight: bold;
            font-size: 14px;
            border-top: 1px solid #000;
            margin-top: 5px;
            padding-top: 5px;
          }
          .footer {
            text-align: center;
            margin-top: 15px;
            padding-top: 10px;
            border-top: 2px dashed #000;
            font-size: 11px;
          }
          .text-right { text-align: right; }
          .text-center { text-align: center; }
        </style>
      </head>
      <body>
        <div class="header">
          <h2>${businessSettings.businessName || 'Invoice App'}</h2>
          <p>${fullAddress}</p>
          <p>Phone Number: ${businessSettings.telephone || 'N/A'}</p>
          <p>Email: ${businessSettings.email || user.email || 'N/A'}</p>
          <p>PIN: ${businessSettings.pin || 'N/A'}</p>
        </div>
        
        <div class="info">
          <div style="display: flex; justify-content: space-between; margin-bottom: 5px;">
            <span>Date:</span>
            <span>${new Date().toLocaleString()}</span>
          </div>
          <div style="display: flex; justify-content: space-between;">
            <span>Cashier:</span>
            <span>${businessSettings.createdBy || `${user.first_name || 'N/A'} ${user.last_name || ''}`}</span>
          </div>
          ${employeeToPrint ? `<div style="display: flex; justify-content: space-between;"><span>Employee:</span><span>${employeeToPrint.name || 'N/A'}</span></div>` : ''}
          ${customerNameToPrint ? `<div style="display: flex; justify-content: space-between;"><span>Customer:</span><span>${customerNameToPrint}</span></div>` : ''}
          ${customerPhoneToPrint ? `<div style="display: flex; justify-content: space-between;"><span>Phone:</span><span>${customerPhoneToPrint}</span></div>` : ''}
          <div style="display: flex; justify-content: space-between;">
            <span>Payment:</span>
            <span>${paymentMethodToPrint.toUpperCase()}</span>
          </div>
          ${paymentMethodToPrint === 'mpesa' && mpesaCodeToPrint ? `<div style="display: flex; justify-content: space-between;"><span>M-Pesa Code:</span><span>${mpesaCodeToPrint}</span></div>` : ''}
        </div>
        
        <table class="items">
          <thead>
            <tr>
              <th>Item</th>
              <th class="text-center">Qty</th>
              <th class="text-right">Price</th>
              <th class="text-right">Total</th>
            </tr>
          </thead>
          <tbody>
            ${itemsToPrint.map((item: any) => `
              <tr>
                <td>${item.name || item.service_name || item.product_name}</td>
                <td class="text-center">${item.quantity || 1}</td>
                <td class="text-right">${Number(item.unit_price || item.amount || 0).toFixed(2)}</td>
                <td class="text-right">${Number(item.total || item.unit_price || item.amount || 0).toFixed(2)}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
        
        <div class="totals">
          <div class="totals-row">
            <span>Subtotal:</span>
            <span>KES ${Number(subtotal).toFixed(2)}</span>
          </div>
          ${includeVAT ? `
          <div class="totals-row">
            <span>VAT (16%):</span>
            <span>KES ${Number(vat).toFixed(2)}</span>
          </div>
          ` : ''}
          ${discountAmount > 0 ? `
          <div class="totals-row" style="color: #d32f2f;">
            <span>Discount:</span>
            <span>-KES ${Number(discountAmount).toFixed(2)}</span>
          </div>
          ` : ''}
          <div class="totals-row total-final">
            <span>TOTAL:</span>
            <span>KES ${Number(total).toFixed(2)}</span>
          </div>
        </div>
        
        <div class="footer">
          <p>Thank you for your business!</p>
          <p>Powered by ${businessSettings.businessName || 'Invoice App'}</p>
        </div>
        
        <script>
          window.onload = function() {
            // Delay print to ensure content is loaded, especially on mobile
            setTimeout(function() {
              window.print();
              // On mobile, don't auto-close - let user close manually
              if (window.innerWidth > 768) {
                setTimeout(function() {
                  window.close();
                }, 100);
              }
            }, 500);
          };
        </script>
      </body>
      </html>
    `;
    
    printWindow.document.write(receiptHTML);
    printWindow.document.close();
  };

  // Record all items in the bill
  const handleCompleteBill = async () => {
    // If editing an invoice, update it instead of creating new transactions
    if (editingInvoice) {
    try {
      setLoading(true);
      setError('');
        
        const { subtotal, vat, discountAmount, total } = calculateBillTotals();
        const currentDate = new Date().toISOString().split('T')[0];
        
        const invoiceData: any = {
          customer_name: customerName || 'Walk-in Customer',
          customer_address: customerPhone ? `Phone: ${customerPhone}` : '',
          lines: billItems.map(item => ({
            item_id: item.product_id || item.service_id || null,
            quantity: item.quantity,
            unit_price: item.unit_price,
            description: `${item.type === 'service' ? 'Service' : 'Product'}: ${item.name}`,
            code: '',
            uom: item.type === 'service' ? 'service' : 'unit',
          })),
          notes: `Salon Bill - Updated`,
          due_date: currentDate,
          payment_terms: paymentMethod === 'mpesa' ? 'M-Pesa' : paymentMethod === 'card' ? 'Card' : 'Cash',
          payment_method: paymentMethod === 'mpesa' ? 'M-Pesa' : paymentMethod === 'card' ? 'Card' : 'Cash',
          mpesa_code: paymentMethod === 'mpesa' && mpesaCode ? mpesaCode : '',
          amountPaid: amountPaid,
          paymentMethod: selectedAccount ? (isNaN(Number(selectedAccount)) ? null : Number(selectedAccount)) : null,
        };

        await ApiService.updateInvoice(editingInvoice.id, invoiceData);
        
        // Update invoice status based on amount paid
        const paymentStatus = amountPaid >= total ? 'paid' : amountPaid > 0 ? 'partial' : 'pending';
        await api.patch(`/invoices/${editingInvoice.id}/status`, { 
          status: paymentStatus
        });

        setSuccess('Invoice updated successfully!');
        setEditingInvoice(null);
        
        // Clear form and bill
        setBillItems([]);
        setSelectedEmployee('');
        setSelectedService('');
        setCustomAmount('');
        setCustomerName('');
        setCustomerPhone('');
        setPaymentMethod('cash');
        setMpesaCode('');
        setAmountPaid(0);
        setDiscount(0);
        
        // Refresh invoices list
        await fetchSalonInvoices();
        
        setTimeout(() => setSuccess(''), 5000);
      } catch (err: any) {
        console.error('Error updating invoice:', err);
        setError(err.response?.data?.message || 'Failed to update invoice');
      } finally {
        setLoading(false);
      }
      return;
    }

    // Original logic for creating new bill
    if (!currentShift) {
      setError('No active shift. Please start a shift first.');
      return;
    }

    if (billItems.length === 0) {
      setError('Please add at least one item to the bill');
      return;
    }

    try {
      setLoading(true);
      setError('');

      // Record each service in the bill
      const serviceItems = billItems.filter(item => item.type === 'service');
      for (const item of serviceItems) {
        if (!item.employee_id || !item.service_id) continue;

      const data = {
        shift_id: currentShift.id,
          employee_id: item.employee_id,
          service_id: item.service_id,
        customer_name: customerName || undefined,
        customer_phone: customerPhone || undefined,
          service_price: item.unit_price,
        payment_method: paymentMethod,
        };

        await salonApi.recordTransaction(data);
      }

      // Generate invoice for entire bill if enabled
      let invoiceId = null;
      if (generateInvoice && selectedAccount) {
        invoiceId = await generateInvoiceForBill();
      }

      // Update invoice status based on amount paid
      const { total } = calculateBillTotals();
      if (invoiceId && amountPaid >= total) {
        try {
          await api.patch(`/invoices/${invoiceId}/status`, { 
            status: 'paid'
          });
        } catch (err) {
          console.error('Failed to update invoice status:', err);
        }
      }

      setLastTransactionData({
        items: billItems,
        customerName,
        customerPhone,
        paymentMethod,
        mpesaCode,
        employee: employees.find(e => e.user_id === selectedEmployee),
      });

      setSuccess('Bill completed successfully!');
      
      // Clear form and bill
      setBillItems([]);
        setSelectedEmployee('');
        setSelectedService('');
        setCustomAmount('');
        setCustomerName('');
        setCustomerPhone('');
        setPaymentMethod('cash');
      setMpesaCode('');
      setAmountPaid(0);
      setDiscount(0);
      setCreatedInvoiceId(null);
      
      // Refresh invoices list
      await fetchSalonInvoices();

      setTimeout(() => setSuccess(''), 5000);
    } catch (err: any) {
      console.error('Error completing bill:', err);
      setError(err.response?.data?.message || 'Failed to complete bill');
    } finally {
      setLoading(false);
    }
  };

  // Generate invoice for entire bill
  const generateInvoiceForBill = async () => {
    try {
      if (!selectedAccount) {
        console.warn('No account selected, skipping invoice generation');
        return;
      }

      const invoiceNumber = await generateInvoiceNumber();
      const currentDate = new Date().toISOString().split('T')[0];
      const { subtotal, vat, discountAmount, total } = calculateBillTotals();
      
      // Only include VAT in invoice if VAT is enabled
      const invoiceVAT = includeVAT ? vat : 0;
      const invoiceTotal = total; // Total already includes discount

      const employee = employees.find(e => e.user_id === selectedEmployee);

      const invoiceData: any = {
        customer_name: customerName || 'Walk-in Customer',
        customer_address: customerPhone ? `Phone: ${customerPhone}` : '',
        lines: billItems.map(item => ({
          item_id: item.product_id || item.service_id || null,
          quantity: item.quantity,
          unit_price: item.unit_price,
          description: `${item.type === 'service' ? 'Service' : 'Product'}: ${item.name}`,
          code: '',
          uom: item.type === 'service' ? 'service' : 'unit',
        })),
        notes: `Salon Bill - Employee: ${employee?.name || 'N/A'}, Shift: ${currentShift?.id || 'N/A'}`,
        due_date: currentDate,
        payment_terms: paymentMethod === 'mpesa' ? 'M-Pesa' : paymentMethod === 'card' ? 'Card' : 'Cash',
        payment_method: paymentMethod === 'mpesa' ? 'M-Pesa' : paymentMethod === 'card' ? 'Card' : 'Cash',
        mpesa_code: paymentMethod === 'mpesa' && mpesaCode ? mpesaCode : '',
        amountPaid: amountPaid || invoiceTotal,
        paymentMethod: selectedAccount ? (isNaN(Number(selectedAccount)) ? null : Number(selectedAccount)) : null,
      };

      const result = await ApiService.createInvoice(invoiceData);
      const createdInvoice = result.data?.invoice || result.invoice;

      if (createdInvoice?.id) {
        // Update status based on amount paid
        const paymentStatus = amountPaid >= invoiceTotal ? 'paid' : amountPaid > 0 ? 'partial' : 'pending';
        await api.patch(`/invoices/${createdInvoice.id}/status`, { 
          status: paymentStatus
        });
        
        setCreatedInvoiceId(createdInvoice.id);
        return createdInvoice.id;

        if (paymentMethod === 'mpesa' && mpesaCode) {
          try {
            const confirmationsResponse = await api.get('/mpesa/confirmations?linked=false');
            const confirmations = confirmationsResponse.data?.confirmations || [];
            const matchingConfirmation = confirmations.find((c: any) => c.trans_id === mpesaCode);
            
            if (matchingConfirmation) {
              await api.post(`/mpesa/confirmations/${matchingConfirmation.id}/link`, {
                invoice_id: createdInvoice.id
              });
            }
          } catch (linkError) {
            console.error('⚠️ Failed to link M-Pesa confirmation:', linkError);
          }
        }

        setCreatedInvoiceId(createdInvoice.id);
      }
    } catch (err: any) {
      console.error('Error generating invoice:', err);
      setError('Bill completed but failed to generate invoice: ' + (err.response?.data?.message || err.message));
    }
  };

  if (!currentShift) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="warning" sx={{ mb: 2 }}>
          No active shift found. Please start a shift from the dashboard or shifts page to record services.
        </Alert>
        <Button 
          variant="contained" 
          onClick={() => navigate('/salon/shifts')}
          sx={{ mt: 2 }}
        >
          Go to Shifts Page
        </Button>
      </Box>
    );
  }

  const selectedServiceData = services.find(s => s.id === selectedService);
  // Convert base_price to number if it's a string
  const servicePrice = selectedServiceData 
    ? (typeof selectedServiceData.base_price === 'string' 
        ? parseFloat(selectedServiceData.base_price) 
        : selectedServiceData.base_price || 0)
    : 0;
  const amount = customAmount ? parseFloat(customAmount) : servicePrice;

  return (
    <Box sx={{ 
      p: { xs: 2, md: 3 },
    }}>
      <Box sx={{ 
        display: 'flex', 
        flexDirection: { xs: 'column', sm: 'row' },
        justifyContent: 'space-between', 
        alignItems: { xs: 'stretch', sm: 'center' },
        gap: { xs: 2, sm: 1 },
        mb: 3 
      }}>
        <Typography variant="h4" fontWeight="bold" sx={{ fontSize: { xs: '1.5rem', md: '2.125rem' } }}>
          Salon POS
      </Typography>
        <Box sx={{ 
          display: 'flex', 
          flexWrap: 'wrap',
          gap: 1,
          width: { xs: '100%', sm: 'auto' }
        }}>
          <Button
            variant="outlined"
            startIcon={<SearchIcon />}
            onClick={handleInvoiceSearch}
            size="small"
            sx={{ width: { xs: '100%', sm: 'auto' } }}
            color="primary"
          >
            Search Invoices
          </Button>
          <Button
            variant="outlined"
            startIcon={<CategoryIcon />}
            onClick={() => navigate('/item-categories')}
            size="small"
            sx={{ width: { xs: '100%', sm: 'auto' } }}
          >
            Categories
          </Button>
          <Button
            variant="outlined"
            startIcon={<PeopleIcon />}
            onClick={() => navigate('/customers')}
            size="small"
            sx={{ width: { xs: '100%', sm: 'auto' } }}
          >
            Customers
          </Button>
          <Button
            variant="outlined"
            startIcon={<Add />}
            onClick={() => navigate('/add-item')}
            size="small"
            sx={{ width: { xs: '100%', sm: 'auto' } }}
          >
            Add Product
          </Button>
        </Box>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess('')}>
          {success}
        </Alert>
      )}

      {editingInvoice && (
        <Alert 
          severity="info" 
          sx={{ mb: 2 }} 
          onClose={() => {
            setEditingInvoice(null);
            setBillItems([]);
            setCustomerName('');
            setCustomerPhone('');
            setAmountPaid(0);
          }}
          action={
            <Button 
              size="small" 
              onClick={() => {
                setEditingInvoice(null);
                setBillItems([]);
                setCustomerName('');
                setCustomerPhone('');
                setAmountPaid(0);
              }}
            >
              Cancel Edit
            </Button>
          }
        >
          Editing Invoice: {editingInvoice.invoice_number}. Make your changes and click "Update Invoice" to save.
        </Alert>
      )}

      <Grid container spacing={2}>
        {/* Left: Service Details */}
        <Grid size={{ xs: 12, md: 8 }}>
          <Card sx={{ mb: 2 }}>
            <CardContent>
              <Typography variant="h6" fontWeight="bold" gutterBottom>
                Service Details
              </Typography>

              <Grid container spacing={2}>
                <Grid size={{ xs: 12, md: 6 }}>
                  <FormControl fullWidth>
                    <InputLabel>Employee/Barber *</InputLabel>
                    <Select
                      value={selectedEmployee}
                      onChange={(e) => setSelectedEmployee(e.target.value)}
                      label="Employee/Barber *"
                    >
                      {employees.map((emp) => (
                        <MenuItem key={emp.id} value={emp.user_id}>
                          {emp.name} ({emp.commission_rate}% commission)
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>

                <Grid size={{ xs: 12, md: 6 }}>
                  <FormControl fullWidth>
                    <InputLabel>Service *</InputLabel>
                    <Select
                      value={selectedService}
                      onChange={(e) => setSelectedService(e.target.value)}
                      label="Service *"
                    >
                      {services.map((srv) => {
                        const price = typeof srv.base_price === 'string' 
                          ? parseFloat(srv.base_price) 
                          : srv.base_price || 0;
                        return (
                        <MenuItem key={srv.id} value={srv.id}>
                            {srv.name} - KES {price.toFixed(2)}
                        </MenuItem>
                        );
                      })}
                    </Select>
                  </FormControl>
                </Grid>

                <Grid size={{ xs: 12, md: 6 }}>
                  <TextField
                    fullWidth
                    label="Customer Name (Optional)"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                  />
                </Grid>

                <Grid size={{ xs: 12, md: 6 }}>
                  <TextField
                    fullWidth
                    label="Customer Phone (Optional)"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                  />
                </Grid>

                <Grid size={{ xs: 12, md: 6 }}>
                  <TextField
                    fullWidth
                    type="number"
                    label="Custom Amount (Optional)"
                    value={customAmount}
                    onChange={(e) => setCustomAmount(e.target.value)}
                    placeholder={selectedServiceData ? `Default: ${(typeof selectedServiceData.base_price === 'string' ? parseFloat(selectedServiceData.base_price) : selectedServiceData.base_price || 0).toFixed(2)}` : ''}
                  />
                </Grid>

                <Grid size={{ xs: 12, md: 6 }}>
                  <FormControl fullWidth>
                    <InputLabel>Payment Method *</InputLabel>
                    <Select
                      value={paymentMethod}
                      onChange={(e) => {
                        setPaymentMethod(e.target.value as any);
                        if (e.target.value !== 'mpesa') {
                          setMpesaCode('');
                        }
                      }}
                      label="Payment Method *"
                    >
                      <MenuItem value="cash">Cash</MenuItem>
                      <MenuItem value="mpesa">M-Pesa</MenuItem>
                      <MenuItem value="card">Card</MenuItem>
                      <MenuItem value="other">Other</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>

                {paymentMethod === 'mpesa' && (
                <Grid size={{ xs: 12 }}>
                    <TextField
                      fullWidth
                      label="M-Pesa Transaction Code"
                      value={mpesaCode}
                      onChange={(e) => setMpesaCode(e.target.value)}
                      onClick={() => {
                        fetchMpesaConfirmations();
                        setMpesaModalOpen(true);
                      }}
                      placeholder="Click to select from confirmations or enter manually..."
                      InputProps={{
                        endAdornment: (
                          <IconButton
                            size="small"
                            onClick={(e) => {
                              e.stopPropagation();
                              fetchMpesaConfirmations();
                              setMpesaModalOpen(true);
                            }}
                          >
                            <SearchIcon fontSize="small" />
                          </IconButton>
                        )
                      }}
                    />
                  </Grid>
                )}

              </Grid>

              <Box sx={{ mt: 3, display: 'flex', gap: 2 }}>
                <Button
                  variant="contained"
                  color="primary"
                  onClick={handleBillService}
                  disabled={!selectedEmployee || !selectedService}
                  sx={{ flex: 1 }}
                >
                  Bill Service
                </Button>
                    <Button
                      variant="outlined"
                  color="secondary"
                  onClick={() => setShowProductBillingDialog(true)}
                  sx={{ flex: 1 }}
                >
                  Bill Product
                    </Button>
                  </Box>
            </CardContent>
          </Card>

          {/* Billing Cart */}
          <Card>
            <CardContent>
              <Typography variant="h6" fontWeight="bold" gutterBottom>
                Current Bill
              </Typography>
              {billItems.length === 0 ? (
                <Typography color="text.secondary" variant="body2" sx={{ py: 2 }}>
                  No items in bill. Add services or products to create a bill.
                    </Typography>
                  ) : (
                <>
                  <TableContainer>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell><strong>Item</strong></TableCell>
                          <TableCell align="center"><strong>Qty</strong></TableCell>
                          <TableCell align="right"><strong>Price</strong></TableCell>
                          <TableCell align="right"><strong>Total</strong></TableCell>
                          <TableCell align="center"><strong>Action</strong></TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {billItems.map((item) => (
                          <TableRow key={item.id}>
                            <TableCell>
                              <Chip 
                                label={item.type === 'service' ? 'Service' : 'Product'} 
                                size="small" 
                                color={item.type === 'service' ? 'primary' : 'secondary'}
                                sx={{ mr: 1 }}
                              />
                              {item.name}
                              {item.employee_name && (
                                <Typography variant="caption" color="text.secondary" display="block">
                                  Employee: {item.employee_name}
                                </Typography>
                              )}
                            </TableCell>
                            <TableCell align="center">{item.quantity}</TableCell>
                            <TableCell align="right">KES {Number(item.unit_price || 0).toFixed(2)}</TableCell>
                            <TableCell align="right">
                              <strong>KES {Number(item.total || 0).toFixed(2)}</strong>
                            </TableCell>
                            <TableCell align="center">
                              <IconButton size="small" onClick={() => handleRemoveBillItem(item.id)}>
                                <Delete fontSize="small" />
                              </IconButton>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                  <Divider sx={{ my: 2 }} />
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="body2">Subtotal:</Typography>
                    <Typography variant="body2" fontWeight="bold">
                      KES {calculateBillTotals().subtotal.toFixed(2)}
                    </Typography>
                  </Box>
                  {includeVAT && (
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Typography variant="body2">VAT (16%):</Typography>
                      <Typography variant="body2" fontWeight="bold">
                        KES {calculateBillTotals().vat.toFixed(2)}
                      </Typography>
                    </Box>
                  )}
                  {discount > 0 && (
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Typography variant="body2" color="error.main">Discount:</Typography>
                      <Typography variant="body2" fontWeight="bold" color="error.main">
                        -KES {calculateBillTotals().discountAmount.toFixed(2)}
                      </Typography>
                    </Box>
                  )}
                  <Divider sx={{ my: 1 }} />
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="h6" fontWeight="bold">Total:</Typography>
                    <Typography variant="h6" fontWeight="bold" color="primary.main">
                      KES {calculateBillTotals().total.toFixed(2)}
                    </Typography>
                  </Box>
                </>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Right: Summary */}
        <Grid size={{ xs: 12, md: 4 }}>
          <Card>
            <CardContent>
              <Typography variant="h6" fontWeight="bold" gutterBottom>
                Summary
              </Typography>

              <Table size="small">
                <TableBody>
                  <TableRow>
                    <TableCell>Items in Bill</TableCell>
                    <TableCell align="right">
                      <Chip label={billItems.length} color="primary" size="small" />
                    </TableCell>
                  </TableRow>
                  {billItems.length > 0 && (
                    <>
                      <TableRow>
                        <TableCell>Subtotal</TableCell>
                        <TableCell align="right">
                          KES {calculateBillTotals().subtotal.toFixed(2)}
                        </TableCell>
                      </TableRow>
                      {includeVAT && (
                        <TableRow>
                          <TableCell>VAT (16%)</TableCell>
                          <TableCell align="right">
                            KES {calculateBillTotals().vat.toFixed(2)}
                          </TableCell>
                        </TableRow>
                      )}
                      {discount > 0 && (
                        <TableRow>
                          <TableCell sx={{ color: 'error.main' }}>Discount</TableCell>
                          <TableCell align="right" sx={{ color: 'error.main' }}>
                            -KES {calculateBillTotals().discountAmount.toFixed(2)}
                          </TableCell>
                        </TableRow>
                      )}
                      <TableRow>
                        <TableCell><strong>Total</strong></TableCell>
                        <TableCell align="right">
                          <Typography variant="h6" color="primary.main" fontWeight="bold">
                            KES {calculateBillTotals().total.toFixed(2)}
                          </Typography>
                        </TableCell>
                      </TableRow>
                    </>
                  )}
                  {billItems.length === 0 && selectedServiceData && (
                    <>
                  <TableRow>
                    <TableCell>Service</TableCell>
                    <TableCell align="right">
                      {selectedServiceData?.name || '-'}
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>Employee</TableCell>
                    <TableCell align="right">
                      {employees.find(e => e.user_id === selectedEmployee)?.name || '-'}
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>Payment</TableCell>
                    <TableCell align="right">
                      <Chip label={paymentMethod.toUpperCase()} size="small" />
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell><strong>Amount</strong></TableCell>
                    <TableCell align="right">
                      <Typography variant="h6" color="primary.main">
                        KES {amount.toFixed(2)}
                      </Typography>
                    </TableCell>
                  </TableRow>
                    </>
                  )}
                </TableBody>
              </Table>

              <Divider sx={{ my: 2 }} />
              
              <Box sx={{ mb: 2 }}>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={includeVAT}
                      onChange={(e) => setIncludeVAT(e.target.checked)}
                    />
                  }
                  label="Include VAT (16%)"
                />
              </Box>

              {/* Discount Field */}
              <Box sx={{ mb: 2 }}>
                <TextField
                  fullWidth
                  label="Discount Amount (KES)"
                  type="number"
                  size="small"
                  value={discount}
                  onChange={(e) => setDiscount(Math.max(0, parseFloat(e.target.value) || 0))}
                  inputProps={{ 
                    min: 0,
                    step: 0.01
                  }}
                  helperText="Enter discount amount to apply to total"
                />
              </Box>

              <Box sx={{ mb: 2 }}>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={generateInvoice}
                      onChange={(e) => setGenerateInvoice(e.target.checked)}
                    />
                  }
                  label="Generate Invoice"
                />
              </Box>

              {billItems.length > 0 && (
                <>
                  <Divider sx={{ my: 2 }} />
                  <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
                    Payment Information
                  </Typography>
                  <TextField
                    fullWidth
                    type="number"
                    label="Amount Paid (KES)"
                    value={amountPaid}
                    onChange={(e) => {
                      const paid = parseFloat(e.target.value) || 0;
                      setAmountPaid(paid);
                    }}
                    sx={{ mb: 2 }}
                    inputProps={{ min: 0, step: 0.01 }}
                  />
                  <Box sx={{ mb: 2, p: 1.5, bgcolor: '#f5f5f5', borderRadius: 1 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Typography variant="body2">Total Amount:</Typography>
                      <Typography variant="body2" fontWeight="bold">
                        KES {calculateBillTotals().total.toFixed(2)}
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Typography variant="body2">Amount Paid:</Typography>
                      <Typography variant="body2" fontWeight="bold" color="primary.main">
                        KES {amountPaid.toFixed(2)}
                      </Typography>
                    </Box>
                    <Divider sx={{ my: 1 }} />
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Typography variant="body2" fontWeight="bold">Balance Due:</Typography>
                      <Typography 
                        variant="body2" 
                        fontWeight="bold"
                        color={calculateBillTotals().balanceDue > 0 ? 'error.main' : 'success.main'}
                      >
                        KES {calculateBillTotals().balanceDue.toFixed(2)}
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 1 }}>
                      <Typography variant="body2">Status:</Typography>
                      <Chip 
                        label={calculateBillTotals().paymentStatus.toUpperCase()} 
                        color={
                          calculateBillTotals().paymentStatus === 'paid' ? 'success' :
                          calculateBillTotals().paymentStatus === 'partial' ? 'warning' : 'error'
                        }
                        size="small"
                      />
                    </Box>
                  </Box>
                </>
              )}

              {generateInvoice && (
                <Box sx={{ mb: 2 }}>
                  <FormControl fullWidth size="small">
                    <InputLabel>Financial Account *</InputLabel>
                    <Select
                      value={selectedAccount}
                      onChange={(e) => setSelectedAccount(e.target.value)}
                      label="Financial Account *"
                    >
                      {accounts.length === 0 ? (
                        <MenuItem disabled>No accounts available</MenuItem>
                      ) : (
                        accounts.map((account) => (
                          <MenuItem key={account.id} value={account.id}>
                            {account.account_name} - Balance: KES {Number(account.current_balance || account.balance || 0).toFixed(2)}
                          </MenuItem>
                        ))
                      )}
                    </Select>
                  </FormControl>
                  {accounts.length === 0 && (
                    <Button
                      size="small"
                      onClick={() => setAccountsOpen(true)}
                      sx={{ mt: 1 }}
                    >
                      Manage Accounts
                    </Button>
                  )}
                </Box>
              )}

              <Button
                fullWidth
                variant="contained"
                size="large"
                color="success"
                onClick={handleCompleteBill}
                disabled={loading || billItems.length === 0 || (generateInvoice && !selectedAccount)}
                sx={{ mt: 1, mb: 1 }}
              >
                {loading ? 'Processing...' : editingInvoice ? 'Update Invoice' : 'Complete Bill'}
              </Button>

              <Button
                fullWidth
                variant="outlined"
                startIcon={<PrintIcon />}
                onClick={generateReceipt}
                disabled={billItems.length === 0 && !lastTransactionData}
                sx={{ mt: 1, mb: 1 }}
              >
                Generate Receipt
              </Button>

              <Button
                fullWidth
                variant="outlined"
                color="error"
                onClick={() => {
                  setBillItems([]);
                  setError('');
                }}
                disabled={billItems.length === 0}
                sx={{ mt: 1 }}
              >
                Clear Bill
              </Button>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* M-Pesa Confirmations Modal */}
      <Dialog open={mpesaModalOpen} onClose={() => {
        setMpesaModalOpen(false);
        setMpesaTabValue(0);
        setManualMpesaCode('');
        setCodeSearchResult(null);
      }} maxWidth="md" fullWidth>
        <DialogTitle sx={{ backgroundColor: '#00A859', color: 'white', fontWeight: 'bold' }}>
          📱 M-Pesa Confirmation
        </DialogTitle>
        <DialogContent sx={{ pt: 2, px: { xs: 1, sm: 3 }, pb: { xs: 1, sm: 3 } }}>
          <Tabs 
            value={mpesaTabValue} 
            onChange={(_, newValue) => {
              setMpesaTabValue(newValue);
              setCodeSearchResult(null);
            }} 
            variant="scrollable"
            scrollButtons="auto"
            allowScrollButtonsMobile
            sx={{ 
              mb: 2,
              '& .MuiTabs-scrollButtons': {
                display: { xs: 'flex', sm: 'none' }
              }
            }}
          >
            <Tab label="Link to Customer" />
            <Tab label="Enter Confirmation Code" />
            <Tab label="Enter M-Pesa Message" />
          </Tabs>

          {mpesaTabValue === 0 ? (
            // Tab 1: Link to Customer (existing functionality)
            <>
          {loading ? (
            <Typography>Loading confirmations...</Typography>
          ) : mpesaConfirmations.length > 0 ? (
            <TableContainer 
              sx={{ 
                maxHeight: { xs: '50vh', sm: 400 },
                overflowX: 'auto',
                overflowY: 'auto'
              }}
            >
              <Table stickyHeader size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Transaction ID</TableCell>
                    <TableCell>Amount</TableCell>
                    <TableCell>Phone Number</TableCell>
                    <TableCell>Name</TableCell>
                    <TableCell>Date</TableCell>
                    <TableCell align="center">Action</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {mpesaConfirmations.map((confirmation) => (
                    <TableRow 
                      key={confirmation.id} 
                      hover
                      sx={{ cursor: 'pointer' }}
                    >
                      <TableCell sx={{ fontWeight: 'bold' }}>{confirmation.trans_id}</TableCell>
                      <TableCell sx={{ fontWeight: 'bold', color: '#00A859' }}>
                        KES {Number(confirmation.trans_amount || 0).toFixed(2)}
                      </TableCell>
                      <TableCell>{confirmation.msisdn || 'N/A'}</TableCell>
                      <TableCell>
                        {[confirmation.first_name, confirmation.middle_name, confirmation.last_name]
                          .filter(Boolean).join(' ') || 'N/A'}
                      </TableCell>
                      <TableCell>
                        {confirmation.trans_time 
                          ? new Date(confirmation.trans_time).toLocaleString() 
                          : new Date(confirmation.created_at).toLocaleString()}
                      </TableCell>
                      <TableCell align="center">
                        <Button
                          size="small"
                          variant="contained"
                          onClick={() => handleMpesaConfirmationSelect(confirmation)}
                          sx={{ backgroundColor: '#00A859', '&:hover': { backgroundColor: '#008547' } }}
                        >
                          Select
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          ) : (
            <Typography color="textSecondary" sx={{ textAlign: 'center', py: 4 }}>
              No pending M-Pesa confirmations found. You can enter the code manually.
            </Typography>
              )}
            </>
          ) : mpesaTabValue === 1 ? (
            // Tab 2: Enter Confirmation Code
            <Box sx={{ pt: 2 }}>
              <TextField
                fullWidth
                label="M-Pesa Transaction Code"
                value={manualMpesaCode}
                onChange={(e) => {
                  setManualMpesaCode(e.target.value);
                  setCodeSearchResult(null);
                }}
                placeholder="Enter transaction code (e.g., QGH123456789)"
                sx={{ mb: 2 }}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    handleSearchMpesaCode();
                  }
                }}
              />
              
              {codeSearchResult && codeSearchResult.found && (
                <Alert severity="success" sx={{ mb: 2 }}>
                  <Typography variant="body2" fontWeight="bold">
                    ✅ Confirmation Found!
                  </Typography>
                  <Typography variant="body2">
                    Amount: KES {Number(codeSearchResult.confirmation.trans_amount || 0).toFixed(2)}
                  </Typography>
                  <Typography variant="body2">
                    Phone: {codeSearchResult.confirmation.msisdn || 'N/A'}
                  </Typography>
                  <Typography variant="body2">
                    Name: {[codeSearchResult.confirmation.first_name, codeSearchResult.confirmation.middle_name, codeSearchResult.confirmation.last_name]
                      .filter(Boolean).join(' ') || 'N/A'}
                  </Typography>
                </Alert>
              )}

              {codeSearchResult && !codeSearchResult.found && (
                <Alert severity="warning" sx={{ mb: 2 }}>
                  <Typography variant="body2">
                    M-Pesa confirmation not found. You can save this code for future reference.
                  </Typography>
                </Alert>
              )}

              <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
                <Button
                  variant="outlined"
                  onClick={() => {
                    setManualMpesaCode('');
                    setCodeSearchResult(null);
                  }}
                >
                  Clear
                </Button>
                <Button
                  variant="contained"
                  onClick={handleSearchMpesaCode}
                  disabled={!manualMpesaCode.trim() || searchingCode}
                  sx={{ backgroundColor: '#00A859', '&:hover': { backgroundColor: '#008547' } }}
                >
                  {searchingCode ? 'Searching...' : 'Search'}
                </Button>
                {codeSearchResult && !codeSearchResult.found && (
                  <Button
                    variant="contained"
                    onClick={handleSaveManualMpesaCode}
                    disabled={loading}
                    sx={{ backgroundColor: '#1976d2' }}
                  >
                    {loading ? 'Saving...' : 'Save Code'}
                  </Button>
                )}
              </Box>
            </Box>
          ) : (
            // Tab 3: Enter M-Pesa Message
            <Box sx={{ pt: 2 }}>
              <TextField
                fullWidth
                label="Paste M-Pesa SMS Message"
                multiline
                rows={6}
                value={mpesaMessage}
                onChange={(e) => {
                  const message = e.target.value;
                  setMpesaMessage(message);
                  // Auto-parse when message is pasted or typed (only if message is substantial)
                  if (message.length > 20) {
                    const parsed = parseMpesaMessage(message);
                    if (parsed.code) {
                      setMpesaCode(parsed.code);
                    }
                    if (parsed.amount > 0) {
                      setAmountPaid(parsed.amount);
                    }
                  }
                }}
                placeholder="Paste the full M-Pesa SMS message here, e.g., TLE6T0YZIX Confirmed. You have received Ksh1,000.00 from IM BANK LIMITED- APP on 14/12/25 at 4:45 PM..."
                sx={{ mb: 2 }}
              />
              
              {mpesaCode && (
                <Alert severity="info" sx={{ mb: 2 }}>
                  <Typography variant="body2" fontWeight="bold">
                    Extracted Information:
                  </Typography>
                  <Typography variant="body2">
                    Transaction Code: <strong>{mpesaCode}</strong>
                  </Typography>
                  {amountPaid > 0 && (
                    <Typography variant="body2">
                      Amount: <strong>KES {amountPaid.toFixed(0)}</strong> (rounded to nearest whole number)
                    </Typography>
                  )}
                </Alert>
              )}

              <Box sx={{ mb: 2 }}>
                <TextField
                  fullWidth
                  label="Transaction Code"
                  value={mpesaCode}
                  onChange={(e) => setMpesaCode(e.target.value)}
                  size="small"
                  sx={{ mb: 1 }}
                  helperText="You can edit the extracted code if needed"
                />
                <TextField
                  fullWidth
                  label="Amount Paid (KES)"
                  type="number"
                  value={amountPaid}
                  onChange={(e) => setAmountPaid(Math.round(parseFloat(e.target.value) || 0))}
                  size="small"
                  inputProps={{ 
                    min: 0,
                    step: 1
                  }}
                  helperText="You can edit the extracted amount if needed (will be rounded to whole number)"
                />
              </Box>

              <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: 2, justifyContent: 'flex-end' }}>
                <Button
                  variant="outlined"
                  onClick={() => {
                    setMpesaMessage('');
                    setMpesaCode('');
                    setAmountPaid(0);
                  }}
                  fullWidth={false}
                  sx={{ width: { xs: '100%', sm: 'auto' } }}
                >
                  Clear
                </Button>
                <Button
                  variant="contained"
                  onClick={() => {
                    if (mpesaCode && amountPaid > 0) {
                      setSuccess('M-Pesa information extracted and populated!');
                      setMpesaModalOpen(false);
                      setTimeout(() => setSuccess(''), 3000);
                    } else {
                      setError('Please ensure both transaction code and amount are extracted from the message.');
                    }
                  }}
                  disabled={!mpesaCode || amountPaid <= 0}
                  sx={{ 
                    backgroundColor: '#00A859', 
                    '&:hover': { backgroundColor: '#008547' },
                    width: { xs: '100%', sm: 'auto' }
                  }}
                >
                  Use This Information
                </Button>
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => {
            setMpesaModalOpen(false);
            setMpesaTabValue(0);
            setManualMpesaCode('');
            setCodeSearchResult(null);
            setMpesaMessage('');
          }}>Close</Button>
          {mpesaTabValue === 0 && (
          <Button 
            onClick={() => {
              fetchMpesaConfirmations();
            }}
            variant="outlined"
          >
            Refresh
          </Button>
          )}
          </DialogActions>
        </Dialog>

      {/* Product Billing Dialog */}
      <Dialog 
        open={showProductBillingDialog} 
        onClose={() => {
          setShowProductBillingDialog(false);
          setSelectedBillingProduct('');
          setBillingProductQuantity('');
          setBillingProductPrice('');
          setBillingProductDiscount('');
          setSelectedProductInfo(null);
        }} 
        maxWidth="md" 
        fullWidth
      >
        <DialogTitle sx={{ backgroundColor: '#1976d2', color: 'white', fontWeight: 'bold' }}>
          Bill Product
        </DialogTitle>
        <DialogContent sx={{ pt: 3 }}>
          <Grid container spacing={2}>
            {/* Product Selection */}
            <Grid size={{ xs: 12, md: 6 }}>
            <FormControl fullWidth sx={{ mb: 2 }}>
                <InputLabel>Select Product *</InputLabel>
              <Select
                  value={selectedBillingProduct}
                  onChange={(e) => {
                    setSelectedBillingProduct(e.target.value);
                    const product = products.find(p => p.id === e.target.value);
                    if (product) {
                      setSelectedProductInfo(product);
                      // Use selling_price from main items table, fallback to price or unit_cost
                      const defaultPrice = product.selling_price || product.price || 
                        (typeof product.unit_cost === 'string' ? parseFloat(product.unit_cost) : product.unit_cost || 0);
                      setBillingProductPrice(defaultPrice.toString());
                      setBillingProductQuantity('1');
                      setBillingProductDiscount('0');
                    }
                  }}
                  label="Select Product *"
                >
                  {products.map((prod) => {
                    const stock = prod.quantity || prod.current_stock || 0;
                    const stockNum = typeof stock === 'string' ? parseFloat(stock) : stock;
                    const unit = prod.unit || 'PCS';
                    const price = prod.selling_price || prod.price || 0;
                    return (
                  <MenuItem key={prod.id} value={prod.id}>
                        {prod.item_name || prod.name} ({stockNum} {unit} available) - KES {Number(price).toFixed(2)}
                  </MenuItem>
                    );
                  })}
              </Select>
            </FormControl>
            </Grid>

            {/* Product Information Display */}
            {selectedProductInfo && (
              <>
                <Grid size={{ xs: 12, md: 6 }}>
                  <Box sx={{ p: 2, bgcolor: '#f5f5f5', borderRadius: 1, mb: 2 }}>
                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                      Product Information
                    </Typography>
                    <Typography variant="body2" sx={{ mb: 0.5 }}>
                      <strong>Name:</strong> {selectedProductInfo.item_name || selectedProductInfo.name || 'N/A'}
                    </Typography>
                    <Typography variant="body2" sx={{ mb: 0.5 }}>
                      <strong>Category:</strong> {selectedProductInfo.category?.name || selectedProductInfo.category_name || 'N/A'}
                    </Typography>
                    <Typography variant="body2" sx={{ mb: 0.5 }}>
                      <strong>Unit:</strong> {selectedProductInfo.unit || 'PCS'}
                    </Typography>
                    <Typography variant="body2" sx={{ mb: 0.5 }}>
                      <strong>Stock:</strong> {selectedProductInfo.quantity || selectedProductInfo.current_stock || 0} {selectedProductInfo.unit || 'PCS'}
                    </Typography>
                    <Typography variant="body2">
                      <strong>Default Price:</strong> KES {Number(selectedProductInfo.selling_price || selectedProductInfo.price || 0).toFixed(2)}
                    </Typography>
                  </Box>
                </Grid>

                {/* Quantity */}
                <Grid size={{ xs: 12, md: 4 }}>
            <TextField
              fullWidth
              type="number"
                    label="Quantity *"
                    value={billingProductQuantity}
                    onChange={(e) => setBillingProductQuantity(e.target.value)}
                    inputProps={{ min: 0.01, step: 0.01 }}
                  />
                </Grid>

                {/* Selling Price */}
                <Grid size={{ xs: 12, md: 4 }}>
                  <TextField
                    fullWidth
                    type="number"
                    label="Selling Price (KES) *"
                    value={billingProductPrice}
                    onChange={(e) => setBillingProductPrice(e.target.value)}
                    inputProps={{ min: 0, step: 0.01 }}
                  />
                </Grid>

                {/* Discount */}
                <Grid size={{ xs: 12, md: 4 }}>
                  <TextField
                    fullWidth
                    type="number"
                    label="Discount (%)"
                    value={billingProductDiscount}
                    onChange={(e) => setBillingProductDiscount(e.target.value)}
                    inputProps={{ min: 0, max: 100, step: 0.01 }}
                    helperText={billingProductDiscount ? `Discount: KES ${((parseFloat(billingProductQuantity || '0') * parseFloat(billingProductPrice || '0')) * parseFloat(billingProductDiscount || '0') / 100).toFixed(2)}` : ''}
                  />
                </Grid>

                {/* Total Preview */}
                {billingProductQuantity && billingProductPrice && (
                  <Grid size={{ xs: 12 }}>
                    <Box sx={{ p: 2, bgcolor: '#e3f2fd', borderRadius: 1, mt: 1 }}>
                      <Typography variant="subtitle2" gutterBottom>
                        Total Calculation
                      </Typography>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                        <Typography variant="body2">Subtotal:</Typography>
                        <Typography variant="body2" fontWeight="bold">
                          KES {(parseFloat(billingProductQuantity) * parseFloat(billingProductPrice)).toFixed(2)}
                        </Typography>
          </Box>
                      {billingProductDiscount && parseFloat(billingProductDiscount || '0') > 0 && (
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                          <Typography variant="body2" color="error">Discount ({billingProductDiscount}%):</Typography>
                          <Typography variant="body2" fontWeight="bold" color="error">
                            -KES {((parseFloat(billingProductQuantity || '0') * parseFloat(billingProductPrice || '0')) * parseFloat(billingProductDiscount || '0') / 100).toFixed(2)}
                          </Typography>
                        </Box>
                      )}
                      <Divider sx={{ my: 1 }} />
                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography variant="h6" fontWeight="bold">Total:</Typography>
                        <Typography variant="h6" fontWeight="bold" color="primary.main">
                          KES {(
                            (parseFloat(billingProductQuantity || '0') * parseFloat(billingProductPrice || '0')) - 
                            (billingProductDiscount ? ((parseFloat(billingProductQuantity || '0') * parseFloat(billingProductPrice || '0')) * parseFloat(billingProductDiscount || '0') / 100) : 0)
                          ).toFixed(2)}
                        </Typography>
                      </Box>
                    </Box>
                  </Grid>
                )}
              </>
            )}
          </Grid>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button 
            onClick={() => {
              setShowProductBillingDialog(false);
              setSelectedBillingProduct('');
              setBillingProductQuantity('');
              setBillingProductPrice('');
              setBillingProductDiscount('');
              setSelectedProductInfo(null);
            }}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleBillProduct} 
            variant="contained"
            disabled={!selectedBillingProduct || !billingProductQuantity || !billingProductPrice}
            sx={{ minWidth: 120 }}
          >
            Add to Bill
          </Button>
        </DialogActions>
      </Dialog>

      {/* Financial Accounts Modal */}
      <Dialog open={accountsOpen} onClose={() => setAccountsOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ backgroundColor: '#1976d2', color: 'white', fontWeight: 'bold' }}>
          💳 Select Financial Account
        </DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          <FormControl fullWidth>
            <InputLabel>Financial Account</InputLabel>
            <Select 
              value={selectedAccount} 
              onChange={(e) => setSelectedAccount(e.target.value)} 
              label="Financial Account"
            >
              {accounts.map((account) => (
                <MenuItem key={account.id} value={account.id}>
                  {account.account_name} ({account.account_type}) - Balance: KES {Number(account.current_balance || account.balance || 0).toFixed(2)}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => setAccountsOpen(false)}
            variant="contained"
            sx={{ backgroundColor: '#1976d2' }}
          >
            Done
          </Button>
        </DialogActions>
      </Dialog>
      {/* Invoice Search Modal */}
      <Dialog open={invoiceSearchOpen} onClose={() => setInvoiceSearchOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle sx={{ backgroundColor: '#1976d2', color: 'white', fontWeight: 'bold' }}>
          🔍 Search Salon Invoices
        </DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
              {error}
            </Alert>
          )}
          <TextField
            fullWidth
            placeholder="Search by invoice number or customer name..."
            value={invoiceSearchQuery}
            onChange={(e) => setInvoiceSearchQuery(e.target.value)}
            sx={{ mb: 2 }}
            InputProps={{
              startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />,
            }}
          />
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', py: 4 }}>
              <Typography>Loading invoices...</Typography>
            </Box>
          ) : invoices.length > 0 ? (
            <TableContainer sx={{ maxHeight: 400 }}>
              <Table stickyHeader>
                <TableHead>
                  <TableRow>
                    <TableCell>Invoice #</TableCell>
                    <TableCell>Customer</TableCell>
                    <TableCell>Date</TableCell>
                    <TableCell align="right">Total</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell align="center">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {invoices
                    .filter(inv => 
                      !invoiceSearchQuery || 
                      inv.invoice_number?.toLowerCase().includes(invoiceSearchQuery.toLowerCase()) ||
                      inv.customer_name?.toLowerCase().includes(invoiceSearchQuery.toLowerCase())
                    )
                    .map((invoice) => (
                      <TableRow key={invoice.id} hover>
                        <TableCell sx={{ fontWeight: 'bold' }}>{invoice.invoice_number}</TableCell>
                        <TableCell>{invoice.customer_name || 'N/A'}</TableCell>
                        <TableCell>{new Date(invoice.created_at).toLocaleDateString()}</TableCell>
                        <TableCell align="right">
                          KES {Number(invoice.total_amount || invoice.total || 0).toFixed(2)}
                        </TableCell>
                        <TableCell>
                          <Chip 
                            label={invoice.status?.toUpperCase() || 'PENDING'} 
                            color={
                              invoice.status === 'paid' ? 'success' :
                              invoice.status === 'partial' ? 'warning' : 'error'
                            }
                            size="small"
                          />
                        </TableCell>
                        <TableCell align="center">
                          <IconButton
                            size="small"
                            onClick={() => handleViewInvoice(invoice)}
                            color="primary"
                            title="View Receipt"
                          >
                            <ViewIcon fontSize="small" />
                          </IconButton>
                          <IconButton
                            size="small"
                            onClick={() => handleEditInvoice(invoice)}
                            color="secondary"
                            title="Edit Invoice"
                          >
                            <EditIcon fontSize="small" />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))}
                </TableBody>
              </Table>
            </TableContainer>
          ) : (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <Typography color="textSecondary" sx={{ mb: 1 }}>
                {error ? 'Error loading invoices' : 'No salon invoices found'}
              </Typography>
              {!error && (
                <Typography variant="body2" color="text.secondary">
                  Salon invoices (with "Salon Bill" in notes) will appear here
                </Typography>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setInvoiceSearchOpen(false)}>Close</Button>
          <Button onClick={fetchSalonInvoices} variant="outlined">Refresh</Button>
        </DialogActions>
      </Dialog>

    </Box>
  );
};

export default SalonPOS;
