import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Card,
  Alert,
  Chip,
  Checkbox,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  IconButton,
  Divider,
  Pagination,
  CircularProgress,
  Tabs,
  Tab,
} from '@mui/material';
import { 
  Receipt as ReceiptIcon, 
  Delete as DeleteIcon, 
  Add as AddIcon, 
  Search as SearchIcon,
  Edit as EditIcon,
  Visibility as ViewIcon,
  Close as CloseIcon
} from '@mui/icons-material';
import { ServiceBillingAPI } from '../../services/serviceBillingApi';
import { ApiService, api } from '../../services/api';
import FormControlLabel from '@mui/material/FormControlLabel';

interface ProductItem {
  id: string;
  product_id: string;
  product_name: string;
  quantity: number;
  unit_price: number;
  total: number;
  discount?: number;
}

const ServiceBillingPOSTab: React.FC = () => {
  const [assignments, setAssignments] = useState<any[]>([]);
  const [selectedAssignments, setSelectedAssignments] = useState<number[]>([]);
  const [groupedByCustomer, setGroupedByCustomer] = useState<Map<number, any[]>>(new Map());
  const [openBilling, setOpenBilling] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  
  // Product billing state
  const [products, setProducts] = useState<any[]>([]);
  const [selectedProducts, setSelectedProducts] = useState<Map<number, ProductItem>>(new Map());
  const [showProductDialog, setShowProductDialog] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [productQuantity, setProductQuantity] = useState('');
  const [productPrice, setProductPrice] = useState('');
  const [productDiscount, setProductDiscount] = useState('');
  const [loadingProducts, setLoadingProducts] = useState(false);
  
  // Payment and VAT state
  const [includeVAT, setIncludeVAT] = useState(true);
  const [discount, setDiscount] = useState<number>(0); // Discount amount
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'mpesa' | 'card' | 'cheque'>('cash');
  const [mpesaCode, setMpesaCode] = useState('');
  const [mpesaModalOpen, setMpesaModalOpen] = useState(false);
  const [mpesaConfirmations, setMpesaConfirmations] = useState<any[]>([]);
  const [mpesaTabValue, setMpesaTabValue] = useState(0);
  const [manualMpesaCode, setManualMpesaCode] = useState('');
  const [searchingCode, setSearchingCode] = useState(false);
  const [codeSearchResult, setCodeSearchResult] = useState<{ found: boolean; confirmation: any } | null>(null);
  const [amountPaid, setAmountPaid] = useState<number>(0);
  const [selectedAccount, setSelectedAccount] = useState<string>('');
  const [accounts, setAccounts] = useState<any[]>([]);
  const [accountsOpen, setAccountsOpen] = useState(false);
  
  // Invoice search and management state
  const [invoiceSearchOpen, setInvoiceSearchOpen] = useState(false);
  const [invoiceSearchQuery, setInvoiceSearchQuery] = useState('');
  const [invoices, setInvoices] = useState<any[]>([]);
  const [invoicePage, setInvoicePage] = useState(1);
  const [invoiceTotalPages, setInvoiceTotalPages] = useState(1);
  const [invoiceTotal, setInvoiceTotal] = useState(0);
  const [loadingInvoices, setLoadingInvoices] = useState(false);
  const [editingInvoice, setEditingInvoice] = useState<any>(null);
  const [viewingInvoice, setViewingInvoice] = useState<any>(null);

  useEffect(() => {
    loadData();
    loadProducts();
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
      setError('');
      const response = await ServiceBillingAPI.getAssignmentsForBilling();
      console.log('📋 [ServiceBillingPOSTab] getAssignmentsForBilling response:', response);
      
      // Handle different response structures
      const responseData = (response as any)?.data || response;
      const assignmentsData = responseData?.data?.assignments || 
                              responseData?.assignments || 
                              [];
      
      console.log('📋 [ServiceBillingPOSTab] Parsed assignments:', assignmentsData);
      
      if (!Array.isArray(assignmentsData)) {
        console.error('❌ [ServiceBillingPOSTab] Assignments data is not an array:', assignmentsData);
        setError('Invalid response format from server');
        setAssignments([]);
        setGroupedByCustomer(new Map());
        return;
      }
      
      setAssignments(assignmentsData);
      
      // Group assignments by customer
      const grouped = new Map<number, any[]>();
      assignmentsData.forEach((assignment: any) => {
        if (assignment && assignment.customer_id) {
          const customerId = assignment.customer_id;
          if (!grouped.has(customerId)) {
            grouped.set(customerId, []);
          }
          grouped.get(customerId)!.push(assignment);
        }
      });
      setGroupedByCustomer(grouped);
      
      console.log('✅ [ServiceBillingPOSTab] Loaded', assignmentsData.length, 'assignments, grouped into', grouped.size, 'customers');
    } catch (err: any) {
      console.error('❌ [ServiceBillingPOSTab] Failed to load billing data:', err);
      const errorMessage = err.response?.data?.message || err.message || 'Failed to load billing data';
      setError(errorMessage);
      setAssignments([]);
      setGroupedByCustomer(new Map());
    }
  };

  const loadProducts = async () => {
    try {
      setLoadingProducts(true);
      const response = await ApiService.getItems({ limit: 1000 });
      const itemsData = response.data?.items || response.items || [];
      const availableProducts = (itemsData || []).filter((item: any) => {
        if (!item || !item.id) return false;
        const qty = item.quantity || item.stock_quantity || 0;
        return parseFloat(String(qty)) > 0;
      });
      setProducts(availableProducts);
    } catch (err: any) {
      console.error('Failed to load products:', err);
      setError('Failed to load products. Please refresh the page.');
      setProducts([]);
    } finally {
      setLoadingProducts(false);
    }
  };

  const getStatusChip = (status: string) => {
    const statusMap: any = {
      in_progress: { label: 'In Progress', color: 'warning' },
      completed: { label: 'Completed', color: 'success' },
    };
    const config = statusMap[status] || { label: status, color: 'default' };
    return <Chip label={config.label} color={config.color} size="small" />;
  };

  const handleSelectAssignment = (assignmentId: number) => {
    setSelectedAssignments(prev => {
      if (prev.includes(assignmentId)) {
        return prev.filter(id => id !== assignmentId);
      } else {
        return [...prev, assignmentId];
      }
    });
  };

  const handleSelectAllForCustomer = (customerId: number) => {
    const customerAssignments = groupedByCustomer.get(customerId) || [];
    const customerAssignmentIds = customerAssignments.map(a => a.id);
    
    const allSelected = customerAssignmentIds.every(id => selectedAssignments.includes(id));
    
    if (allSelected) {
      setSelectedAssignments(prev => prev.filter(id => !customerAssignmentIds.includes(id)));
    } else {
      setSelectedAssignments(prev => [...new Set([...prev, ...customerAssignmentIds])]);
    }
  };

  const handleOpenBilling = (customerId: number) => {
    const customerAssignments = groupedByCustomer.get(customerId) || [];
    if (customerAssignments.length === 0) return;
    
    // Filter to only include selected assignments
    const selectedCustomerAssignments = customerAssignments.filter(a => selectedAssignments.includes(a.id));
    
    // Ensure we have at least services or products to bill
    if (selectedCustomerAssignments.length === 0 && selectedProducts.size === 0) {
      setError('Please select at least one service or product to bill');
      return;
    }
    
    setSelectedCustomer({
      id: customerId,
      name: customerAssignments[0].customer_name,
      phone: customerAssignments[0].customer_phone,
      assignments: selectedCustomerAssignments
    });
    setOpenBilling(true);
  };

  // Load invoices with pagination
  const loadInvoices = async (page: number = 1, search: string = '') => {
    try {
      setLoadingInvoices(true);
      setError('');
      const response = await ApiService.getInvoices({
        page,
        limit: 15,
        search: search || undefined,
      });
      
      const invoicesData = response.data?.invoices || response.invoices || [];
      const total = response.data?.total || response.data?.pagination?.total || response.total || invoicesData.length;
      const totalPages = Math.ceil(total / 15) || 1;
      
      setInvoices(invoicesData);
      setInvoiceTotal(total);
      setInvoiceTotalPages(totalPages);
      setInvoicePage(page);
    } catch (err: any) {
      console.error('Error loading invoices:', err);
      setError('Failed to load invoices');
      setInvoices([]);
      setInvoiceTotal(0);
      setInvoiceTotalPages(1);
    } finally {
      setLoadingInvoices(false);
    }
  };

  // Handle invoice search dialog open
  const handleOpenInvoiceSearch = async () => {
    setInvoiceSearchOpen(true);
    setInvoiceSearchQuery('');
    await loadInvoices(1, '');
  };

  // Handle invoice edit
  const handleEditInvoice = async (invoice: any) => {
    try {
      setLoading(true);
      setError('');
      
      // Fetch full invoice details
      const response = await ApiService.getInvoice(invoice.id);
      const invoiceData = response.data || response;
      
      if (!invoiceData) {
        setError('Failed to load invoice details');
        return;
      }

      // Parse invoice lines to separate services and products
      const serviceLines: any[] = [];
      const productLines: ProductItem[] = [];
      
      (invoiceData.lines || []).forEach((line: any) => {
        if (line.description?.includes('Service:')) {
          // Extract service details from description
          const serviceMatch = line.description.match(/Service: (.+?) \(by (.+?)\)/);
          if (serviceMatch) {
            serviceLines.push({
              id: Date.now() + Math.random(), // Temporary ID
              service_name: serviceMatch[1],
              employee_name: serviceMatch[2],
              service_price: line.unit_price,
            });
          }
        } else if (line.item_id) {
          // Product line
          productLines.push({
            id: `product-${line.item_id}`,
            product_id: String(line.item_id),
            product_name: line.description?.replace('Product: ', '') || 'Product',
            quantity: line.quantity,
            unit_price: line.unit_price,
            total: line.quantity * line.unit_price,
            discount: 0,
          });
        }
      });

      // Set up customer data
      const customerData = {
        id: invoiceData.customer_id || 0,
        name: invoiceData.customer_name || 'Customer',
        phone: invoiceData.customer_address?.replace('Phone: ', '') || '',
        assignments: serviceLines,
      };

      // Set selected products
      const productsMap = new Map<number, ProductItem>();
      productLines.forEach(p => {
        productsMap.set(parseInt(p.product_id), p);
      });
      setSelectedProducts(productsMap);

      // Set selected assignments (for services) - use temporary IDs for display
      // These are just for UI display since we're editing an existing invoice
      const assignmentIds = serviceLines.map((s: any) => s.id);
      setSelectedAssignments(assignmentIds);
      
      // Note: These are temporary IDs for display only
      // The actual invoice update will use the invoice lines

      // Set customer
      setSelectedCustomer(customerData);

      // Set payment details
      setAmountPaid(Math.round(invoiceData.amount_paid || 0));
      setPaymentMethod((invoiceData.payment_method || 'cash').toLowerCase() as any);
      setMpesaCode(invoiceData.mpesa_code || '');
      setIncludeVAT((invoiceData.lines || []).some((l: any) => l.vat_amount > 0));

      // Set editing invoice
      setEditingInvoice(invoiceData);
      
      // Close search dialog and open billing dialog
      setInvoiceSearchOpen(false);
      setOpenBilling(true);
    } catch (err: any) {
      console.error('Error loading invoice for edit:', err);
      setError('Failed to load invoice details');
    } finally {
      setLoading(false);
    }
  };

  // Handle invoice view (receipt)
  const handleViewInvoice = async (invoice: any) => {
    try {
      setLoading(true);
      setError('');
      
      // Fetch full invoice details
      const response = await ApiService.getInvoice(invoice.id);
      const invoiceData = response.data || response;
      
      if (!invoiceData) {
        setError('Failed to load invoice details');
        return;
      }

      // Parse invoice lines
      const assignments: any[] = [];
      const products: ProductItem[] = [];
      
      (invoiceData.lines || []).forEach((line: any) => {
        if (line.description?.includes('Service:')) {
          const serviceMatch = line.description.match(/Service: (.+?) \(by (.+?)\)/);
          if (serviceMatch) {
            assignments.push({
              service_name: serviceMatch[1],
              employee_name: serviceMatch[2],
              service_price: line.unit_price,
            });
          }
        } else if (line.item_id) {
          products.push({
            id: `product-${line.item_id}`,
            product_id: String(line.item_id),
            product_name: line.description?.replace('Product: ', '') || 'Product',
            quantity: line.quantity,
            unit_price: line.unit_price,
            total: line.quantity * line.unit_price,
            discount: 0,
          });
        }
      });

      // Calculate totals
      const serviceSubtotal = Math.round(assignments.reduce((sum, a) => sum + Number(a.service_price || 0), 0));
      const productSubtotal = Math.round(products.reduce((sum, p) => sum + p.total, 0));
      const grandSubtotal = serviceSubtotal + productSubtotal;
      const grandVat = Math.round(grandSubtotal * 0.16);
      const grandTotal = grandSubtotal + grandVat;
      const amountPaidValue = Math.round(invoiceData.amount_paid || 0);
      const balanceDue = Math.max(0, grandTotal - amountPaidValue);

      const totals = {
        serviceSubtotal,
        productSubtotal,
        grandSubtotal,
        grandVat,
        grandTotal,
        balanceDue,
        paymentStatus: invoiceData.status || 'pending',
      };

      // Create customer data for receipt
      const customerData = {
        name: invoiceData.customer_name || 'Customer',
        phone: invoiceData.customer_address?.replace('Phone: ', '') || '',
        assignments,
      };

      // Print receipt
      printReceipt(invoiceData, customerData, totals);
      
      setInvoiceSearchOpen(false);
    } catch (err: any) {
      console.error('Error loading invoice for view:', err);
      setError('Failed to load invoice details');
    } finally {
      setLoading(false);
    }
  };

  const handleAddProduct = () => {
    if (!selectedProduct) {
      setError('Please select a product');
      return;
    }

    if (!productQuantity || !productPrice) {
      setError('Please enter quantity and price');
      return;
    }

    const quantity = parseFloat(productQuantity);
    const price = parseFloat(productPrice);
    const discount = productDiscount ? parseFloat(productDiscount) : 0;

    if (isNaN(quantity) || quantity <= 0) {
      setError('Quantity must be greater than 0');
      return;
    }

    if (isNaN(price) || price <= 0) {
      setError('Price must be greater than 0');
      return;
    }

    const subtotal = quantity * price;
    const discountAmount = (subtotal * discount) / 100;
    const total = subtotal - discountAmount;

    const productItem: ProductItem = {
      id: `product-${Date.now()}-${selectedProduct.id}`,
      product_id: String(selectedProduct.id),
      product_name: selectedProduct.item_name || selectedProduct.name || 'Product',
      quantity: quantity,
      unit_price: price,
      total: total,
      discount: discount,
    };

    setSelectedProducts(prev => {
      const newMap = new Map(prev);
      newMap.set(selectedProduct.id, productItem);
      return newMap;
    });

    setShowProductDialog(false);
    setSelectedProduct(null);
    setProductQuantity('');
    setProductPrice('');
    setProductDiscount('');
    setError('');
    setSuccess('Product added to bill');
    setTimeout(() => setSuccess(''), 2000);
  };

  const handleRemoveProduct = (productId: string | number) => {
    setSelectedProducts(prev => {
      const newMap = new Map(prev);
      const idToDelete = typeof productId === 'string' ? parseInt(productId) : productId;
      newMap.delete(idToDelete);
      return newMap;
    });
  };

  // Helper function to format currency in KES (rounded to nearest whole number)
  const formatCurrency = (amount: number): string => {
    return `KES ${Math.round(amount)}`;
  };

  const calculateServiceTotal = (customerAssignments: any[]) => {
    const selectedCustomerAssignments = customerAssignments.filter(a => 
      selectedAssignments.includes(a.id)
    );
    const subtotal = Math.round(selectedCustomerAssignments.reduce((sum, a) => sum + Number(a.service_price), 0));
    const vat = includeVAT ? Math.round(subtotal * 0.16) : 0;
    return { subtotal, vat, total: Math.round(subtotal + vat) };
  };

  const calculateProductTotal = () => {
    const subtotal = Math.round(Array.from(selectedProducts.values()).reduce((sum, p) => sum + p.total, 0));
    const vat = includeVAT ? Math.round(subtotal * 0.16) : 0;
    return { subtotal, vat, total: Math.round(subtotal + vat) };
  };

  const calculateGrandTotal = (customerAssignments: any[]) => {
    const serviceTotal = calculateServiceTotal(customerAssignments);
    const productTotal = calculateProductTotal();
    const grandSubtotal = Math.round(serviceTotal.subtotal + productTotal.subtotal);
    const grandVat = includeVAT ? Math.round(grandSubtotal * 0.16) : 0;
    const totalBeforeDiscount = Math.round(grandSubtotal + grandVat);
    const discountAmount = Math.round(Number(discount) || 0);
    const grandTotal = Math.max(0, totalBeforeDiscount - discountAmount); // Ensure total doesn't go negative
    const balanceDue = Math.max(0, Math.round(grandTotal - amountPaid));
    const paymentStatus = amountPaid >= grandTotal ? 'paid' : amountPaid > 0 ? 'partial' : 'unpaid';
    
    return {
      serviceSubtotal: serviceTotal.subtotal,
      serviceVat: serviceTotal.vat,
      serviceTotal: serviceTotal.total,
      productSubtotal: productTotal.subtotal,
      productVat: productTotal.vat,
      productTotal: productTotal.total,
      grandSubtotal,
      grandVat,
      discountAmount,
      grandTotal,
      balanceDue,
      paymentStatus,
    };
  };

  const handleCreateInvoice = async () => {
    if (!selectedCustomer) {
      setError('Please select a customer');
      return;
    }

    const hasServices = selectedCustomer.assignments && selectedCustomer.assignments.length > 0;
    const hasProducts = selectedProducts.size > 0;

    if (!hasServices && !hasProducts) {
      setError('Please select at least one service or product to bill');
      return;
    }

    try {
      setLoading(true);
      setError('');
      
      const totals = calculateGrandTotal(groupedByCustomer.get(selectedCustomer.id) || []);

      // Create invoice lines combining services and products
      const invoiceLines: any[] = [];

      // Add service lines - include all service details in description
      if (selectedCustomer.assignments && selectedCustomer.assignments.length > 0) {
        selectedCustomer.assignments.forEach((a: any) => {
          // Include all service details in description for tracking
          const serviceDescription = `Service: ${a.service_name} (by ${a.employee_name})${a.actual_duration ? ` - Duration: ${Math.round(a.actual_duration)} min` : ''}${a.start_time ? ` - Date: ${new Date(a.start_time).toLocaleDateString()}` : ''}`;
          
          invoiceLines.push({
            item_id: null, // Services don't have item_id
            description: serviceDescription,
            quantity: 1,
            unit_price: Math.round(Number(a.service_price || 0)),
            code: '',
            uom: 'service',
          });
        });
      }

      // Add product lines
      Array.from(selectedProducts.values()).forEach((p: ProductItem) => {
        invoiceLines.push({
          item_id: parseInt(p.product_id),
          description: `Product: ${p.product_name}`,
          quantity: p.quantity,
          unit_price: Math.round(p.unit_price),
          code: '',
          uom: 'unit',
        });
      });

      // Create a single unified invoice using the main invoice API
      const paymentMethodText = paymentMethod === 'mpesa' ? 'M-Pesa' : paymentMethod === 'card' ? 'Card' : paymentMethod === 'cheque' ? 'Cheque' : 'Cash';
      
      const invoiceData: any = {
        customer_name: selectedCustomer.name,
        customer_address: selectedCustomer.phone ? `Phone: ${selectedCustomer.phone}` : '',
        lines: invoiceLines,
        notes: `Service Billing${selectedCustomer.assignments && selectedCustomer.assignments.length > 0 ? ' (with services)' : ''}${selectedProducts.size > 0 ? ' (with products)' : ''} for ${selectedCustomer.name}`,
        due_date: new Date().toISOString().split('T')[0],
        payment_terms: paymentMethodText,
        payment_method: paymentMethodText,
        mpesa_code: paymentMethod === 'mpesa' && mpesaCode ? mpesaCode : '',
        amountPaid: Math.round(amountPaid || totals.grandTotal),
        paymentMethod: selectedAccount || null,
      };

      // Create or update invoice
      let invoice;
      if (editingInvoice && editingInvoice.id) {
        // Update existing invoice
        const result = await ApiService.updateInvoice(editingInvoice.id, invoiceData);
        invoice = result.data?.invoice || result.invoice || editingInvoice;
      } else {
        // Create new invoice
        const result = await ApiService.createInvoice(invoiceData);
        invoice = result.data?.invoice || result.invoice;
      }

      // Update invoice status based on amount paid
      if (invoice?.id) {
        const paymentStatus = amountPaid >= totals.grandTotal ? 'paid' : amountPaid > 0 ? 'partial' : 'pending';
        try {
          await api.patch(`/invoices/${invoice.id}/status`, { 
            status: paymentStatus
          });
        } catch (statusErr) {
          console.warn('Failed to update invoice status:', statusErr);
        }

        // Link M-Pesa confirmation if M-Pesa code is provided
        if (paymentMethod === 'mpesa' && mpesaCode) {
          try {
            const confirmationsResponse = await api.get('/mpesa/confirmations?linked=false');
            const confirmations = confirmationsResponse.data?.confirmations || [];
            const matchingConfirmation = confirmations.find((c: any) => c.trans_id === mpesaCode);
            
            if (matchingConfirmation) {
              await api.post(`/mpesa/confirmations/${matchingConfirmation.id}/link`, {
                invoice_id: invoice.id
              });
            }
          } catch (linkError) {
            console.warn('Failed to link M-Pesa confirmation:', linkError);
          }
        }

        // Update financial account balance if account is selected
        if (selectedAccount && amountPaid > 0) {
          try {
            await api.patch(`/financial-accounts/${selectedAccount}/balance`, {
              amount: amountPaid,
              operation: 'add'
            });
          } catch (balanceError) {
            console.warn('Failed to update financial account balance:', balanceError);
          }
        }
      }

      // Also create service billing invoice for tracking (if we have services)
      if (selectedCustomer.assignments && selectedCustomer.assignments.length > 0) {
        try {
          await ServiceBillingAPI.createInvoiceFromAssignments({
            customer_id: selectedCustomer.id,
            assignment_ids: selectedCustomer.assignments.map((a: any) => a.id),
            payment_method: 'Cash',
            notes: `Service billing for ${selectedCustomer.name}${selectedProducts.size > 0 ? ' (with products)' : ''}`
          });
        } catch (serviceErr) {
          console.warn('Failed to create service billing invoice:', serviceErr);
          // Continue even if this fails
        }
      }

      if (invoice) {
        // Print receipt - pass current state for receipt generation
        const receiptCustomerData = {
          ...selectedCustomer,
          assignments: selectedCustomer.assignments || [],
        };
        printReceipt(invoice, receiptCustomerData, totals);
        
        // Show success message
        const actionText = editingInvoice ? 'updated' : 'created';
        setSuccess(`✅ Invoice ${invoice.invoice_number} ${actionText} successfully! Receipt printed.`);
        setTimeout(() => setSuccess(''), 8000);
        
        // Reset all form state for next billing
        setSelectedAssignments([]);
        setSelectedProducts(new Map());
        setSelectedCustomer(null);
        setOpenBilling(false);
        setAmountPaid(0);
        setMpesaCode('');
        setPaymentMethod('cash');
        setIncludeVAT(true);
        setDiscount(0);
        setSelectedProduct(null);
        setProductQuantity('');
        setProductPrice('');
        setProductDiscount('');
        setError('');
        setEditingInvoice(null);
        
        // Reload data to refresh the list (removes billed items)
        await loadData();
        await fetchFinancialAccounts(); // Refresh account balances
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create invoice');
    } finally {
      setLoading(false);
    }
  };

  const printReceipt = (invoice: any, customerData: any, totals: any) => {
    const business = JSON.parse(localStorage.getItem('business') || '{}');
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    
    const paymentMethodText = paymentMethod === 'mpesa' ? 'M-Pesa' : paymentMethod === 'card' ? 'Card' : paymentMethod === 'cheque' ? 'Cheque' : 'Cash';
    
    // Get current selected products for receipt
    const productsForReceipt = Array.from(selectedProducts.values());

    const receiptHTML = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Service Receipt - ${invoice.invoice_number}</title>
        <style>
          @media print { @page { margin: 0.5cm; size: 80mm auto; } }
          body { font-family: 'Courier New', monospace; width: 80mm; margin: 0 auto; padding: 10px; font-size: 12px; }
          .header { text-align: center; border-bottom: 2px dashed #000; padding-bottom: 10px; margin-bottom: 10px; }
          .header h2 { margin: 5px 0; font-size: 18px; }
          .info { margin: 10px 0; font-size: 11px; }
          table { width: 100%; margin: 10px 0; border-collapse: collapse; }
          th { border-bottom: 1px solid #000; padding: 5px 2px; text-align: left; font-size: 11px; }
          td { padding: 5px 2px; font-size: 11px; }
          .employee { font-size: 10px; color: #666; font-style: italic; }
          .totals { margin-top: 10px; padding-top: 10px; border-top: 2px dashed #000; }
          .totals-row { display: flex; justify-content: space-between; padding: 3px 0; font-size: 12px; }
          .total-final { font-weight: bold; font-size: 14px; border-top: 1px solid #000; margin-top: 5px; padding-top: 5px; }
          .footer { text-align: center; margin-top: 15px; padding-top: 10px; border-top: 2px dashed #000; font-size: 11px; }
        </style>
      </head>
      <body>
        <div class="header">
          <h2>${business.business_name || 'Service Business'}</h2>
          <p>${business.address || 'Business Address'}</p>
          <p>Tel: ${business.phone || 'N/A'} | Email: ${business.email || user.email || 'N/A'}</p>
        </div>
        <div class="info">
          <div><strong>Invoice:</strong> ${invoice.invoice_number}</div>
          <div><strong>Date:</strong> ${new Date(invoice.created_at || Date.now()).toLocaleString()}</div>
          <div><strong>Customer:</strong> ${customerData.name}</div>
          <div><strong>Phone:</strong> ${customerData.phone}</div>
        </div>
        <table>
          <thead>
            <tr>
              <th>Item</th>
              <th>Qty</th>
              <th>Price</th>
            </tr>
          </thead>
          <tbody>
            ${(customerData.assignments || []).map((a: any) => `
              <tr>
                <td>
                  ${a.service_name || 'Service'}
                  <div class="employee">by ${a.employee_name || 'N/A'}</div>
                </td>
                <td>1</td>
                <td>KES ${Math.round(Number(a.service_price || 0))}</td>
              </tr>
            `).join('')}
            ${productsForReceipt.map((p: ProductItem) => `
              <tr>
                <td>${p.product_name}</td>
                <td>${p.quantity}</td>
                <td>KES ${Math.round(p.total)}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
        <div class="totals">
          ${(customerData.assignments || []).length > 0 ? `<div class="totals-row"><span>Service Subtotal:</span><span>KES ${Math.round(totals.serviceSubtotal)}</span></div>` : ''}
          ${productsForReceipt.length > 0 ? `<div class="totals-row"><span>Product Subtotal:</span><span>KES ${Math.round(totals.productSubtotal)}</span></div>` : ''}
          <div class="totals-row"><span>Subtotal:</span><span>KES ${Math.round(totals.grandSubtotal)}</span></div>
          ${totals.grandVat > 0 ? `<div class="totals-row"><span>VAT (16%):</span><span>KES ${Math.round(totals.grandVat)}</span></div>` : ''}
          ${totals.discountAmount > 0 ? `<div class="totals-row" style="color: #d32f2f;"><span>Discount:</span><span>-KES ${Math.round(totals.discountAmount)}</span></div>` : ''}
          <div class="totals-row total-final"><span>TOTAL:</span><span>KES ${Math.round(totals.grandTotal)}</span></div>
          <div class="totals-row"><span>Amount Paid:</span><span>KES ${Math.round(amountPaid)}</span></div>
          <div class="totals-row"><span>Balance Due:</span><span>KES ${Math.round(totals.balanceDue)}</span></div>
          <div class="totals-row"><span>Payment Method:</span><span>${paymentMethodText}</span></div>
          ${paymentMethod === 'mpesa' && mpesaCode ? `<div class="totals-row"><span>M-Pesa Code:</span><span>${mpesaCode}</span></div>` : ''}
        </div>
        <div class="footer">
          <p>Thank you for choosing us!</p>
          <p>We look forward to serving you again</p>
        </div>
        <script>
          window.onload = function() {
            window.print();
            setTimeout(function() { window.close(); }, 100);
          };
        </script>
      </body>
      </html>
    `;
    printWindow.document.write(receiptHTML);
    printWindow.document.close();
  };

  return (
    <Box sx={{ p: 2 }}>
      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>{error}</Alert>}
      {success && <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess('')}>{success}</Alert>}

      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, gap: 2 }}>
        <Alert severity="info" sx={{ flex: 1 }}>
          <Typography variant="body2">
            <strong>Note:</strong> You can bill services even if they're still in progress. Some customers may prefer to pay before service completion. You can also add products to the bill.
          </Typography>
        </Alert>
        <Button
          variant="outlined"
          startIcon={<SearchIcon />}
          onClick={handleOpenInvoiceSearch}
          sx={{ minWidth: 150 }}
        >
          Search Invoices
        </Button>
      </Box>

      {assignments.length === 0 ? (
        <Card sx={{ p: 4, textAlign: 'center' }}>
          <Typography color="text.secondary">
            No services available for billing. Assign customers to employees in the Assignments tab first.
          </Typography>
        </Card>
      ) : (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          {Array.from(groupedByCustomer.entries()).map(([customerId, customerAssignments]) => {
            const customerName = customerAssignments[0].customer_name;
            const customerPhone = customerAssignments[0].customer_phone;
            const selectedCount = customerAssignments.filter(a => selectedAssignments.includes(a.id)).length;
            const totals = calculateGrandTotal(customerAssignments);
            
            return (
              <Card key={customerId}>
                <Box sx={{ p: 2, backgroundColor: '#f5f5f5', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Checkbox
                      checked={customerAssignments.every(a => selectedAssignments.includes(a.id))}
                      indeterminate={
                        customerAssignments.some(a => selectedAssignments.includes(a.id)) &&
                        !customerAssignments.every(a => selectedAssignments.includes(a.id))
                      }
                      onChange={() => handleSelectAllForCustomer(customerId)}
                    />
                    <Box>
                      <Typography variant="h6">{customerName}</Typography>
                      <Typography variant="body2" color="text.secondary">
                        {customerPhone} • {customerAssignments.length} service(s) completed
                      </Typography>
                    </Box>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    {(selectedCount > 0 || selectedProducts.size > 0) && (
                      <Chip 
                        label={`${selectedCount} service(s) • ${selectedProducts.size} product(s) • Total: ${formatCurrency(totals.grandTotal)}`}
                        color="primary"
                      />
                    )}
                    <Button
                      variant="outlined"
                      startIcon={<AddIcon />}
                      onClick={() => {
                        if (!selectedCustomer || selectedCustomer.id !== customerId) {
                          setSelectedCustomer({
                            id: customerId,
                            name: customerName,
                            phone: customerPhone,
                            assignments: [],
                          });
                        }
                        setShowProductDialog(true);
                        setError('');
                      }}
                      sx={{ mr: 1 }}
                    >
                      Add Product
                    </Button>
                    <Button
                      variant="contained"
                      startIcon={<ReceiptIcon />}
                      onClick={() => handleOpenBilling(customerId)}
                      disabled={selectedCount === 0 && selectedProducts.size === 0}
                      sx={{ backgroundColor: '#4caf50' }}
                    >
                      Bill Customer
                    </Button>
                  </Box>
                </Box>
                
                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell padding="checkbox"></TableCell>
                        <TableCell><strong>Date</strong></TableCell>
                        <TableCell><strong>Service</strong></TableCell>
                        <TableCell><strong>Employee</strong></TableCell>
                        <TableCell><strong>Status</strong></TableCell>
                        <TableCell><strong>Duration</strong></TableCell>
                        <TableCell align="right"><strong>Price</strong></TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {customerAssignments.map((assignment) => (
                        <TableRow key={assignment.id} hover>
                          <TableCell padding="checkbox">
                            <Checkbox
                              checked={selectedAssignments.includes(assignment.id)}
                              onChange={() => handleSelectAssignment(assignment.id)}
                            />
                          </TableCell>
                          <TableCell>
                            {new Date(assignment.start_time).toLocaleDateString()}
                            <br />
                            <Typography variant="caption" color="text.secondary">
                              {new Date(assignment.start_time).toLocaleTimeString()}
                            </Typography>
                          </TableCell>
                          <TableCell>{assignment.service_name}</TableCell>
                          <TableCell>{assignment.employee_name}</TableCell>
                          <TableCell>{getStatusChip(assignment.status)}</TableCell>
                          <TableCell>
                            {Math.round(assignment.actual_duration || assignment.estimated_duration)} min
                            {assignment.status === 'in_progress' && (
                              <Typography variant="caption" color="warning.main" display="block">
                                (Ongoing)
                              </Typography>
                            )}
                          </TableCell>
                          <TableCell align="right">
                            <Typography fontWeight="bold">
                              {formatCurrency(Number(assignment.service_price))}
                            </Typography>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>

                {/* Products Section */}
                {selectedProducts.size > 0 && (
                  <Box sx={{ p: 2, borderTop: '1px solid #ddd' }}>
                    <Typography variant="h6" sx={{ mb: 2 }}>Products</Typography>
                    <TableContainer>
                      <Table size="small">
                        <TableHead>
                          <TableRow>
                            <TableCell><strong>Product</strong></TableCell>
                            <TableCell align="center"><strong>Quantity</strong></TableCell>
                            <TableCell align="right"><strong>Unit Price</strong></TableCell>
                            <TableCell align="right"><strong>Discount</strong></TableCell>
                            <TableCell align="right"><strong>Total</strong></TableCell>
                            <TableCell align="center"><strong>Action</strong></TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {Array.from(selectedProducts.values()).map((product) => (
                            <TableRow key={product.id}>
                              <TableCell>{product.product_name}</TableCell>
                              <TableCell align="center">{product.quantity}</TableCell>
                              <TableCell align="right">{formatCurrency(product.unit_price)}</TableCell>
                              <TableCell align="right">{product.discount ? `${product.discount}%` : '-'}</TableCell>
                              <TableCell align="right">
                                <Typography fontWeight="bold">{formatCurrency(product.total)}</Typography>
                              </TableCell>
                              <TableCell align="center">
                                <IconButton size="small" onClick={() => handleRemoveProduct(product.product_id)}>
                                  <DeleteIcon fontSize="small" />
                                </IconButton>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  </Box>
                )}
              </Card>
            );
          })}
        </Box>
      )}

      {/* Billing Confirmation Dialog */}
      <Dialog open={openBilling} onClose={() => {
        setOpenBilling(false);
        setEditingInvoice(null);
      }} maxWidth="sm" fullWidth>
        <DialogTitle>{editingInvoice ? 'Edit Invoice' : 'Create Invoice'}</DialogTitle>
        <DialogContent>
          {selectedCustomer && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="body1" gutterBottom>
                <strong>Customer:</strong> {selectedCustomer.name}
              </Typography>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                {selectedCustomer.phone}
              </Typography>
              
              <Box sx={{ mt: 3, p: 2, backgroundColor: '#f5f5f5', borderRadius: 1 }}>
                {selectedCustomer.assignments && selectedCustomer.assignments.length > 0 && (
                  <>
                    <Typography variant="body2" gutterBottom>
                      <strong>Services to bill:</strong>
                    </Typography>
                    {selectedCustomer.assignments.map((a: any, index: number) => (
                      <Box key={index} sx={{ display: 'flex', justifyContent: 'space-between', mt: 1 }}>
                        <Typography variant="body2">
                          {a.service_name} <span style={{ color: '#666' }}>by {a.employee_name}</span>
                        </Typography>
                        <Typography variant="body2">{formatCurrency(Number(a.service_price))}</Typography>
                      </Box>
                    ))}
                  </>
                )}

                {selectedProducts.size > 0 && (
                  <>
                    {selectedCustomer.assignments && selectedCustomer.assignments.length > 0 && <Divider sx={{ my: 2 }} />}
                    <Typography variant="body2" gutterBottom>
                      <strong>Products to bill:</strong>
                    </Typography>
                    {Array.from(selectedProducts.values()).map((p: ProductItem) => (
                      <Box key={p.id} sx={{ display: 'flex', justifyContent: 'space-between', mt: 1 }}>
                        <Typography variant="body2">
                          {p.product_name} (Qty: {p.quantity})
                        </Typography>
                        <Typography variant="body2">{formatCurrency(p.total)}</Typography>
                      </Box>
                    ))}
                  </>
                )}
                
                <Box sx={{ mt: 2, pt: 2, borderTop: '1px solid #ddd' }}>
                {selectedCustomer.assignments && selectedCustomer.assignments.length > 0 && (
                  <>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                      <Typography variant="body2">Service Subtotal:</Typography>
                      <Typography variant="body2">
                        {formatCurrency(calculateServiceTotal(groupedByCustomer.get(selectedCustomer.id) || []).subtotal)}
                      </Typography>
                    </Box>
                  </>
                )}
                  {selectedProducts.size > 0 && (
                    <>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                        <Typography variant="body2">Product Subtotal:</Typography>
                        <Typography variant="body2">
                          {formatCurrency(calculateProductTotal().subtotal)}
                        </Typography>
                      </Box>
                    </>
                  )}
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                    <Typography variant="body2">Subtotal:</Typography>
                    <Typography variant="body2">
                      {formatCurrency(calculateGrandTotal(groupedByCustomer.get(selectedCustomer.id) || []).grandSubtotal)}
                    </Typography>
                  </Box>
                  {includeVAT && (
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                      <Typography variant="body2">VAT (16%):</Typography>
                      <Typography variant="body2">
                        {formatCurrency(calculateGrandTotal(groupedByCustomer.get(selectedCustomer.id) || []).grandVat)}
                      </Typography>
                    </Box>
                  )}
                  {discount > 0 && (
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                      <Typography variant="body2" color="error.main">Discount:</Typography>
                      <Typography variant="body2" fontWeight="bold" color="error.main">
                        -{formatCurrency(calculateGrandTotal(groupedByCustomer.get(selectedCustomer.id) || []).discountAmount)}
                      </Typography>
                    </Box>
                  )}
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1, pt: 1, borderTop: '1px solid #000' }}>
                    <Typography variant="h6">Grand Total:</Typography>
                    <Typography variant="h6" color="primary">
                      {formatCurrency(calculateGrandTotal(groupedByCustomer.get(selectedCustomer.id) || []).grandTotal)}
                    </Typography>
                  </Box>
                </Box>

                {/* Payment Information */}
                <Divider sx={{ my: 2 }} />
                <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
                  Payment Information
                </Typography>
                
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

                <FormControl fullWidth sx={{ mb: 2 }}>
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
                    <MenuItem value="cheque">Cheque</MenuItem>
                  </Select>
                </FormControl>

                {paymentMethod === 'mpesa' && (
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
                    sx={{ mb: 2 }}
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
                )}

                <TextField
                  fullWidth
                  type="number"
                  label="Amount Paid (KES)"
                  value={amountPaid}
                  onChange={(e) => {
                    const paid = Math.round(parseFloat(e.target.value) || 0);
                    setAmountPaid(paid);
                  }}
                  sx={{ mb: 2 }}
                  inputProps={{ min: 0, step: 1 }}
                />

                <Box sx={{ mb: 2, p: 1.5, bgcolor: '#f5f5f5', borderRadius: 1 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="body2">Total Amount:</Typography>
                    <Typography variant="body2" fontWeight="bold">
                      {formatCurrency(calculateGrandTotal(groupedByCustomer.get(selectedCustomer.id) || []).grandTotal)}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="body2">Amount Paid:</Typography>
                    <Typography variant="body2" fontWeight="bold" color="primary.main">
                      {formatCurrency(amountPaid)}
                    </Typography>
                  </Box>
                  <Divider sx={{ my: 1 }} />
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="body2" fontWeight="bold">Balance Due:</Typography>
                    <Typography 
                      variant="body2" 
                      fontWeight="bold"
                      color={calculateGrandTotal(groupedByCustomer.get(selectedCustomer.id) || []).balanceDue > 0 ? 'error.main' : 'success.main'}
                    >
                      {formatCurrency(calculateGrandTotal(groupedByCustomer.get(selectedCustomer.id) || []).balanceDue)}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 1 }}>
                    <Typography variant="body2">Status:</Typography>
                    <Chip 
                      label={calculateGrandTotal(groupedByCustomer.get(selectedCustomer.id) || []).paymentStatus.toUpperCase()} 
                      color={
                        calculateGrandTotal(groupedByCustomer.get(selectedCustomer.id) || []).paymentStatus === 'paid' ? 'success' :
                        calculateGrandTotal(groupedByCustomer.get(selectedCustomer.id) || []).paymentStatus === 'partial' ? 'warning' : 'error'
                      }
                      size="small"
                    />
                  </Box>
                </Box>

                <FormControl fullWidth sx={{ mb: 2 }}>
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
                          {account.account_name} - Balance: {formatCurrency(Number(account.current_balance || account.balance || 0))}
                        </MenuItem>
                      ))
                    )}
                  </Select>
                </FormControl>
                {accounts.length === 0 && (
                  <Button
                    size="small"
                    onClick={() => setAccountsOpen(true)}
                    sx={{ mb: 2 }}
                  >
                    Manage Accounts
                  </Button>
                )}
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => {
            setOpenBilling(false);
            setEditingInvoice(null);
            setAmountPaid(0);
            setMpesaCode('');
            setPaymentMethod('cash');
          }}>Cancel</Button>
          <Button
            onClick={handleCreateInvoice}
            variant="contained"
            disabled={loading || !selectedAccount}
            sx={{ backgroundColor: '#4caf50' }}
          >
            {editingInvoice ? 'Update Invoice & Print' : 'Create Invoice & Print'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Add Product Dialog */}
      <Dialog 
        open={showProductDialog} 
        onClose={() => {
          setShowProductDialog(false);
          setSelectedProduct(null);
          setProductQuantity('');
          setProductPrice('');
          setProductDiscount('');
          setError('');
        }} 
        maxWidth="sm" 
        fullWidth
      >
        <DialogTitle>Add Product to Bill</DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>{error}</Alert>}
            {loadingProducts && (
              <Alert severity="info" sx={{ mb: 2 }}>
                Loading products...
              </Alert>
            )}
            {!loadingProducts && products.length === 0 && (
              <Alert severity="warning" sx={{ mb: 2 }}>
                No products available. Please add products in the Items section first.
              </Alert>
            )}
            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel>Select Product *</InputLabel>
              <Select
                value={selectedProduct ? String(selectedProduct.id) : ''}
                onChange={(e) => {
                  try {
                    const productId = e.target.value;
                    if (!productId) {
                      setSelectedProduct(null);
                      return;
                    }
                    const product = (products || []).find(p => p && String(p.id) === String(productId));
                    if (product) {
                      setSelectedProduct(product);
                      const defaultPrice = product.selling_price || product.price || product.unit_price || 0;
                      setProductPrice(String(defaultPrice));
                      setProductQuantity('1');
                      setProductDiscount('0');
                      setError('');
                    } else {
                      setSelectedProduct(null);
                      setError('Product not found');
                    }
                  } catch (err) {
                    console.error('Error selecting product:', err);
                    setError('Error selecting product');
                  }
                }}
                label="Select Product *"
                disabled={loadingProducts || products.length === 0}
              >
                {products.length === 0 ? (
                  <MenuItem disabled>No products available</MenuItem>
                ) : (
                  products
                    .filter((prod) => prod && prod.id)
                    .map((prod) => {
                      try {
                        const stock = prod.quantity || prod.stock_quantity || prod.current_stock || 0;
                        const stockNum = typeof stock === 'string' ? parseFloat(stock) : (stock || 0);
                        const unit = prod.unit || prod.uom || 'PCS';
                        const price = prod.selling_price || prod.price || prod.unit_price || 0;
                        const productName = prod.item_name || prod.name || 'Product';
                        return (
                          <MenuItem key={prod.id} value={String(prod.id)}>
                            {productName} ({stockNum} {unit} available) - ${Number(price).toFixed(2)}
                          </MenuItem>
                        );
                      } catch (err) {
                        console.error('Error rendering product:', err, prod);
                        return (
                          <MenuItem key={prod.id || Math.random()} value={String(prod.id)} disabled>
                            Error loading product
                          </MenuItem>
                        );
                      }
                    })
                )}
              </Select>
            </FormControl>

            {selectedProduct && (
              <>
                <TextField
                  fullWidth
                  type="number"
                  label="Quantity *"
                  value={productQuantity}
                  onChange={(e) => setProductQuantity(e.target.value)}
                  sx={{ mb: 2 }}
                  inputProps={{ min: 0.01, step: 0.01 }}
                />
                <TextField
                  fullWidth
                  type="number"
                  label="Unit Price ($) *"
                  value={productPrice}
                  onChange={(e) => setProductPrice(e.target.value)}
                  sx={{ mb: 2 }}
                  inputProps={{ min: 0, step: 0.01 }}
                />
                <TextField
                  fullWidth
                  type="number"
                  label="Discount (%)"
                  value={productDiscount}
                  onChange={(e) => setProductDiscount(e.target.value)}
                  inputProps={{ min: 0, max: 100, step: 0.01 }}
                  helperText={productDiscount ? `Discount: $${((parseFloat(productQuantity || '0') * parseFloat(productPrice || '0')) * parseFloat(productDiscount || '0') / 100).toFixed(2)}` : ''}
                />
                {productQuantity && productPrice && (
                  <Box sx={{ mt: 2, p: 2, bgcolor: '#e3f2fd', borderRadius: 1 }}>
                    <Typography variant="subtitle2" gutterBottom>
                      Total Calculation
                    </Typography>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                      <Typography variant="body2">Subtotal:</Typography>
                      <Typography variant="body2" fontWeight="bold">
                        ${(parseFloat(productQuantity) * parseFloat(productPrice)).toFixed(2)}
                      </Typography>
                    </Box>
                    {productDiscount && parseFloat(productDiscount || '0') > 0 && (
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                        <Typography variant="body2" color="error">Discount ({productDiscount}%):</Typography>
                        <Typography variant="body2" fontWeight="bold" color="error">
                          -${((parseFloat(productQuantity || '0') * parseFloat(productPrice || '0')) * parseFloat(productDiscount || '0') / 100).toFixed(2)}
                        </Typography>
                      </Box>
                    )}
                    <Divider sx={{ my: 1 }} />
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="h6" fontWeight="bold">Total:</Typography>
                      <Typography variant="h6" fontWeight="bold" color="primary.main">
                        ${(
                          (parseFloat(productQuantity || '0') * parseFloat(productPrice || '0')) - 
                          (productDiscount ? ((parseFloat(productQuantity || '0') * parseFloat(productPrice || '0')) * parseFloat(productDiscount || '0') / 100) : 0)
                        ).toFixed(2)}
                      </Typography>
                    </Box>
                  </Box>
                )}
              </>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => {
            setShowProductDialog(false);
            setSelectedProduct(null);
            setProductQuantity('');
            setProductPrice('');
            setProductDiscount('');
          }}>Cancel</Button>
          <Button
            onClick={handleAddProduct}
            variant="contained"
            disabled={!selectedProduct || !productQuantity || !productPrice}
            sx={{ backgroundColor: '#673ab7' }}
          >
            Add to Bill
          </Button>
        </DialogActions>
      </Dialog>

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
        <DialogContent sx={{ pt: 2 }}>
          <Tabs value={mpesaTabValue} onChange={(_, newValue) => {
            setMpesaTabValue(newValue);
            setCodeSearchResult(null);
          }} sx={{ mb: 2 }}>
            <Tab label="Link to Customer" />
            <Tab label="Enter Confirmation Code" />
          </Tabs>

          {mpesaTabValue === 0 ? (
            // Tab 1: Link to Customer (existing functionality)
            <>
              {loading ? (
                <Typography>Loading confirmations...</Typography>
              ) : mpesaConfirmations.length > 0 ? (
                <TableContainer sx={{ maxHeight: 400 }}>
                  <Table stickyHeader>
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
                            ${Number(confirmation.trans_amount || 0).toFixed(2)}
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
          ) : (
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
                    Amount: ${Number(codeSearchResult.confirmation.trans_amount || 0).toFixed(2)}
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
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => {
            setMpesaModalOpen(false);
            setMpesaTabValue(0);
            setManualMpesaCode('');
            setCodeSearchResult(null);
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
                  {account.account_name} ({account.account_type}) - Balance: ${Number(account.current_balance || account.balance || 0).toFixed(2)}
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

      {/* Invoice Search Dialog */}
      <Dialog 
        open={invoiceSearchOpen} 
        onClose={() => {
          setInvoiceSearchOpen(false);
          setInvoiceSearchQuery('');
        }} 
        maxWidth="md" 
        fullWidth
      >
        <DialogTitle sx={{ backgroundColor: '#1976d2', color: 'white', fontWeight: 'bold', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>Search Invoices</span>
          <IconButton onClick={() => setInvoiceSearchOpen(false)} sx={{ color: 'white' }}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ pt: 3 }}>
          <TextField
            fullWidth
            placeholder="Search by invoice number, customer name..."
            value={invoiceSearchQuery}
            onChange={(e) => {
              setInvoiceSearchQuery(e.target.value);
              loadInvoices(1, e.target.value);
            }}
            sx={{ mb: 2 }}
            InputProps={{
              startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />,
            }}
          />
          
          {loadingInvoices ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
              <CircularProgress />
            </Box>
          ) : invoices.length === 0 ? (
            <Box sx={{ textAlign: 'center', p: 4 }}>
              <Typography color="text.secondary">No invoices found</Typography>
            </Box>
          ) : (
            <>
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell><strong>Invoice #</strong></TableCell>
                      <TableCell><strong>Customer</strong></TableCell>
                      <TableCell><strong>Date</strong></TableCell>
                      <TableCell align="right"><strong>Total</strong></TableCell>
                      <TableCell><strong>Status</strong></TableCell>
                      <TableCell align="center"><strong>Actions</strong></TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {invoices.map((invoice) => (
                      <TableRow key={invoice.id} hover>
                        <TableCell>{invoice.invoice_number}</TableCell>
                        <TableCell>{invoice.customer_name}</TableCell>
                        <TableCell>
                          {new Date(invoice.created_at).toLocaleDateString()}
                        </TableCell>
                        <TableCell align="right">
                          {formatCurrency(invoice.total_amount || 0)}
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
                            sx={{ mr: 1 }}
                            title="View Receipt"
                          >
                            <ViewIcon />
                          </IconButton>
                          <IconButton
                            size="small"
                            onClick={() => handleEditInvoice(invoice)}
                            color="secondary"
                            title="Edit Invoice"
                          >
                            <EditIcon />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
              
              {invoiceTotalPages > 1 && (
                <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
                  <Pagination
                    count={invoiceTotalPages}
                    page={invoicePage}
                    onChange={(e, page) => loadInvoices(page, invoiceSearchQuery)}
                    color="primary"
                  />
                </Box>
              )}
              
              <Typography variant="body2" color="text.secondary" sx={{ mt: 2, textAlign: 'center' }}>
                Showing {invoices.length} of {invoiceTotal} invoices
              </Typography>
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => {
            setInvoiceSearchOpen(false);
            setInvoiceSearchQuery('');
          }}>
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ServiceBillingPOSTab;
