import React, { useState, useEffect, useMemo } from 'react';
import {
  Box,
  Button,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Typography,
  Grid,
  Card,
  CardContent,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Alert,
  Toolbar,
  AppBar,
  Container,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  Divider,
  Stack,
  Tabs,
  Tab,
  Checkbox,
  FormControlLabel,
} from '@mui/material';
import {
  Delete as DeleteIcon,
  Search as SearchIcon,
  Print as PrintIcon,
  Save as SaveIcon,
  Add as AddIcon,
  Close as CloseIcon,
} from '@mui/icons-material';
import { Chip } from '@mui/material';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import ApiService, { api } from '../services/api';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { saveAs } from 'file-saver';

interface POSItem {
  id: string;
  name: string;
  code: string;
  quantity: number;
  unit: string;
  rate: number;
  vat: number;
  amount: number;
  description?: string;
}

interface AvailableItem {
  id: string;
  item_name: string;
  code?: string;
  quantity: number;
  unit: string;
  selling_price: number;
  description?: string;
}

interface FinancialAccount {
  id: string | number;
  account_name: string;
  account_type: string;
  account_number?: string;
  opening_balance?: number;
  current_balance: number;
  balance?: number;
  is_active?: boolean;
  created_at?: string;
  updated_at?: string;
}

interface DraftInvoice {
  id: string;
  invoice_number: string;
  created_at: string;
  items?: POSItem[];
  total?: number;
  total_amount?: number;
  line_count?: number;
  status?: string;
}

const POSScreen: React.FC = () => {
  const [posItems, setPosItems] = useState<POSItem[]>([]);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [availableItems, setAvailableItems] = useState<AvailableItem[]>([]);
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card' | null>(null);
  const [paymentOpen, setPaymentOpen] = useState(false);
  const [searchInvoiceOpen, setSearchInvoiceOpen] = useState(false);
  const [invoiceSearchQuery, setInvoiceSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [drafts, setDrafts] = useState<DraftInvoice[]>([]);
  const [retrieveOpen, setRetrieveOpen] = useState(false);
  const [accountsOpen, setAccountsOpen] = useState(false);
  const [accounts, setAccounts] = useState<FinancialAccount[]>([]);
  const [selectedAccount, setSelectedAccount] = useState<string>('');
  const [currentDraftId, setCurrentDraftId] = useState<string | null>(null);
  const [selectedInvoiceId, setSelectedInvoiceId] = useState<string | null>(null);
  const [paymentDetails, setPaymentDetails] = useState({
    netAmount: 0,
    tendered: 0,
    change: 0,
    cardNumber: '',
    cardType: '',
    bankName: '',
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [amountPaid, setAmountPaid] = useState<number>(0);
  const [mpesaCode, setMpesaCode] = useState('');
  const [posPaymentMethod, setPosPaymentMethod] = useState<string>('Cash');
  const [mpesaConfirmations, setMpesaConfirmations] = useState<any[]>([]);
  const [mpesaModalOpen, setMpesaModalOpen] = useState(false);
  const [mpesaTabValue, setMpesaTabValue] = useState(0);
  const [manualMpesaCode, setManualMpesaCode] = useState('');
  const [searchingCode, setSearchingCode] = useState(false);
  const [codeSearchResult, setCodeSearchResult] = useState<{ found: boolean; confirmation: any } | null>(null);
  const [mpesaMessage, setMpesaMessage] = useState('');
  const [businessCategoryNames, setBusinessCategoryNames] = useState({
    category_name: 'Category',
    category_1_name: 'Category 1',
    category_2_name: 'Category 2'
  });
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [categories, setCategories] = useState<any[]>([]);
  const [productModalOpen, setProductModalOpen] = useState(false);
  const [editingProductId, setEditingProductId] = useState<number | null>(null);
  const [productFormData, setProductFormData] = useState({
    item_name: '',
    description: '',
    quantity: '',
    buying_price: '',
    selling_price: '',
    rate: '',
    unit: '',
    category_id: '',
    category_1_id: '',
    category_2_id: '',
    reorder_level: '',
    modification_reason: '',
  });
  const [productManufacturingDate, setProductManufacturingDate] = useState<Date | null>(null);
  const [productExpiryDate, setProductExpiryDate] = useState<Date | null>(null);
  const [productSaving, setProductSaving] = useState(false);
  const [includeVAT, setIncludeVAT] = useState(true); // VAT checkbox state
  const [discountType, setDiscountType] = useState<'percentage' | 'fixed'>('percentage'); // Default to percentage
  const [discountPercentage, setDiscountPercentage] = useState<number>(0); // Discount percentage
  const [discount, setDiscount] = useState<number>(0); // Discount amount (fixed or calculated)


  // Fetch financial accounts
  const fetchFinancialAccounts = async () => {
    try {
      setError('');
      const token = localStorage.getItem('token');
      if (!token) {
        console.error('No token found in localStorage');
        return;
      }
      const response = await ApiService.getFinancialAccounts();
      const data = response.data?.accounts || response.accounts || [];
      setAccounts(data);
      if (Array.isArray(data) && data.length > 0) {
        setSelectedAccount(String(data[0].id));
      }
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || err.message || 'Failed to fetch accounts';
      setError(errorMessage);
      console.error('Fetch accounts error:', err);
      
      // If it's an auth error, the interceptor will handle redirect
      if (err.response?.status === 401 || err.response?.status === 403) {
        setError('Session expired. Please login again.');
      }
    }
  };

  // Fetch draft invoices
  const fetchDrafts = async () => {
    try {
      const response = await api.get('/invoices/drafts/list');
      setDrafts(response.data.data?.invoices || response.data.invoices || []);
    } catch (err) {
      setError('Failed to fetch drafts');
      console.error('Fetch drafts error:', err);
    }
  };

  // Fetch all invoices for search
  const fetchInvoices = async () => {
    try {
      setLoading(true);
      const response = await ApiService.getInvoices({ limit: 100 });
      const invoicesData = response.data?.invoices || response.invoices || [];
      setSearchResults(invoicesData);
    } catch (error) {
      console.error('Failed to fetch invoices:', error);
      setError('Failed to load invoices');
    } finally {
      setLoading(false);
    }
  };

  // Fetch pending M-Pesa confirmations
  const fetchMpesaConfirmations = async () => {
    try {
      setLoading(true);
      const response = await ApiService.getPendingMpesaConfirmations();
      const confirmations = response.data?.confirmations || [];
      setMpesaConfirmations(confirmations);
    } catch (error) {
      console.error('Failed to fetch M-Pesa confirmations:', error);
      setError('Failed to load M-Pesa confirmations');
    } finally {
      setLoading(false);
    }
  };

  // Handle M-Pesa confirmation selection
  const handleMpesaConfirmationSelect = async (confirmation: any) => {
    try {
      setMpesaCode(confirmation.trans_id);
      setAmountPaid(parseFloat(confirmation.trans_amount) || 0);
      setMpesaModalOpen(false);
      
      // If we have a selected invoice, link the confirmation
      if (selectedInvoiceId) {
        try {
          await ApiService.linkMpesaConfirmation(confirmation.id, parseInt(selectedInvoiceId));
          console.log('✅ M-Pesa confirmation linked to invoice');
        } catch (linkError) {
          console.error('Failed to link confirmation:', linkError);
        }
      }
    } catch (error) {
      console.error('Error selecting M-Pesa confirmation:', error);
    }
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

  useEffect(() => {
    // Check if user is authenticated before fetching data
    const token = localStorage.getItem('token');
    if (!token) {
      setError('Please login to access the POS system');
      return;
    }
    
    fetchAvailableItems();
    fetchFinancialAccounts();
    fetchCategories();
    fetchBusinessCategoryNames();
  }, []);

  const fetchCategories = async () => {
    try {
      const response = await ApiService.getItemCategories();
      if (response.success) {
        setCategories(response.data.categories || []);
      }
    } catch (err) {
      console.error('Error fetching categories:', err);
    }
  };

  const fetchBusinessCategoryNames = async () => {
    try {
      const response = await ApiService.getBusinessCategoryNames();
      if (response.success && response.data) {
        setBusinessCategoryNames({
          category_name: response.data.category_name || 'Category',
          category_1_name: response.data.category_1_name || 'Category 1',
          category_2_name: response.data.category_2_name || 'Category 2'
        });
      }
    } catch (err) {
      console.error('Error fetching business category names:', err);
    }
  };

  // Store all items separately for filtering
  const [allItems, setAllItems] = useState<AvailableItem[]>([]);

  const resetProductForm = () => {
    setProductFormData({
      item_name: '',
      description: '',
      quantity: '',
      buying_price: '',
      selling_price: '',
      rate: '',
      unit: '',
      category_id: '',
      category_1_id: '',
      category_2_id: '',
      reorder_level: '',
      modification_reason: '',
    });
    setProductManufacturingDate(null);
    setProductExpiryDate(null);
    setEditingProductId(null);
  };

  const handleProductFormChanged = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setProductFormData((prev) => ({ ...prev, [name]: value }));
  };

  const openAddProductModal = () => {
    resetProductForm();
    setError('');
    setSuccess('');
    setProductModalOpen(true);
  };

  const loadProductForEdit = async (itemId: number) => {
    try {
      setError('');
      const response = await ApiService.getItem(itemId);
      if (response.success && response.data) {
        const item = response.data.item || response.data;
        setEditingProductId(itemId);
        setProductFormData({
          item_name: item.item_name || item.name || '',
          description: item.description || '',
          quantity: item.quantity?.toString() || item.stock_quantity?.toString() || '',
          buying_price: item.buying_price?.toString() || '',
          selling_price: item.selling_price?.toString() || item.rate?.toString() || item.unit_price?.toString() || '',
          rate: item.rate?.toString() || item.unit_price?.toString() || '',
          unit: item.unit || item.uom || '',
          category_id: item.category_id != null ? String(item.category_id) : '',
          category_1_id: item.category_1_id != null ? String(item.category_1_id) : '',
          category_2_id: item.category_2_id != null ? String(item.category_2_id) : '',
          reorder_level: item.reorder_level?.toString() || '',
          modification_reason: '',
        });

        if (item.manufacturing_date) {
          setProductManufacturingDate(new Date(item.manufacturing_date));
        } else {
          setProductManufacturingDate(null);
        }

        if (item.expiry_date) {
          setProductExpiryDate(new Date(item.expiry_date));
        } else {
          setProductExpiryDate(null);
        }
      }
    } catch (err: any) {
      console.error('Error loading product:', err);
      setError(err.response?.data?.message || 'Failed to load product data');
    }
  };

  const handleProductSubmit = async () => {
    if (!productFormData.item_name.trim()) {
      setError('Item name is required');
      return;
    }

    if (!productFormData.category_id && !productFormData.category_1_id && !productFormData.category_2_id) {
      setError('Please select at least one category');
      return;
    }

    if (!productFormData.quantity || parseFloat(productFormData.quantity) < 0) {
      setError('Valid quantity is required');
      return;
    }

    if (!productFormData.buying_price || parseFloat(productFormData.buying_price) < 0) {
      setError('Valid buying price is required');
      return;
    }

    if (!productFormData.selling_price || parseFloat(productFormData.selling_price) < 0) {
      setError('Valid selling price is required');
      return;
    }

    try {
      setProductSaving(true);
      setError('');

      if (editingProductId) {
        const categoryId = productFormData.category_id && productFormData.category_id.trim()
          ? parseInt(productFormData.category_id)
          : null;
        const category1Id = productFormData.category_1_id && productFormData.category_1_id.trim()
          ? parseInt(productFormData.category_1_id)
          : null;
        const category2Id = productFormData.category_2_id && productFormData.category_2_id.trim()
          ? parseInt(productFormData.category_2_id)
          : null;

        await ApiService.updateItem(editingProductId, {
          item_name: productFormData.item_name.trim(),
          description: productFormData.description.trim(),
          quantity: parseFloat(productFormData.quantity),
          rate: parseFloat(productFormData.selling_price || productFormData.rate),
          unit: productFormData.unit.trim() || undefined,
          category_id: categoryId,
          category_1_id: category1Id,
          category_2_id: category2Id,
          modification_reason: productFormData.modification_reason.trim() || undefined,
        });
        setSuccess('Product updated successfully!');
      } else {
        await ApiService.createItem({
          item_name: productFormData.item_name.trim(),
          description: productFormData.description.trim(),
          quantity: parseFloat(productFormData.quantity),
          buying_price: parseFloat(productFormData.buying_price),
          selling_price: parseFloat(productFormData.selling_price),
          rate: parseFloat(productFormData.selling_price || productFormData.rate),
          unit: productFormData.unit.trim() || undefined,
          category_id: productFormData.category_id ? parseInt(productFormData.category_id) : undefined,
          category_1_id: productFormData.category_1_id ? parseInt(productFormData.category_1_id) : undefined,
          category_2_id: productFormData.category_2_id ? parseInt(productFormData.category_2_id) : undefined,
          reorder_level: productFormData.reorder_level ? parseInt(productFormData.reorder_level) : undefined,
          manufacturing_date: productManufacturingDate?.toISOString().split('T')[0] || undefined,
          expiry_date: productExpiryDate?.toISOString().split('T')[0] || undefined,
        });
        setSuccess('Product added successfully!');
      }

      await fetchAvailableItems();
      setProductModalOpen(false);
      resetProductForm();
    } catch (err: any) {
      console.error('Error saving product:', err);
      setError(err.response?.data?.message || 'Failed to save product');
    } finally {
      setProductSaving(false);
    }
  };

  // Fetch available items
  const fetchAvailableItems = async () => {
    try {
      setError('');
      const token = localStorage.getItem('token');
      if (!token) {
        setError('Please login to access items');
        console.error('No token found in localStorage');
        return;
      }
      const response = await ApiService.getItems();
      const items = response.data?.items || response.items || [];
      setAllItems(items);
      setAvailableItems(items);
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || err.message || 'Failed to fetch items';
      setError(errorMessage);
      console.error('Fetch items error:', err);
      
      // If it's an auth error, the interceptor will handle redirect
      if (err.response?.status === 401 || err.response?.status === 403) {
        setError('Session expired. Please login again.');
      }
    }
  };

  // Search items
  const handleSearchItems = () => {
    // Filtering is handled by useEffect
  };

  // Filter items based on search and category
  useEffect(() => {
    if (!searchQuery.trim() && categoryFilter === 'all') {
      setAvailableItems(allItems);
      return;
    }

    const filtered = allItems.filter((item: any) => {
      const matchesSearch = !searchQuery.trim() || 
        item.item_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.code?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item as any).category_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item as any).category_1_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item as any).category_2_name?.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesCategory = categoryFilter === 'all' ||
        (item as any).category_id === parseInt(categoryFilter) ||
        (item as any).category_1_id === parseInt(categoryFilter) ||
        (item as any).category_2_id === parseInt(categoryFilter);
      
      return matchesSearch && matchesCategory;
    });
    setAvailableItems(filtered);
  }, [searchQuery, categoryFilter, allItems]);

  // Add item to POS
  const addItemToPOS = (item: AvailableItem) => {
    const existingItem = posItems.find((i) => i.id === item.id);
    if (existingItem) {
      updateItemQuantity(item.id, existingItem.quantity + 1);
    } else {
      const sellingPrice = Number(item.selling_price) || 0;
      const itemAmount = sellingPrice * 1; // quantity = 1
      const newItem: POSItem = {
        id: item.id,
        name: item.item_name,
        code: item.code || '',
        quantity: 1,
        unit: item.unit,
        rate: sellingPrice,
        vat: 0, // VAT is calculated on subtotal only, not per item
        amount: itemAmount,
        description: item.description || item.item_name, // Use description if available, fallback to item_name
      };
      setPosItems([...posItems, newItem]);
    }
    setSearchOpen(false);
    setSearchQuery('');
  };

  // Helper function to validate and normalize fractional quantities
  // Only allows: whole numbers (1, 2, 3...) and fractional increments (0.25, 0.5, 0.75)
  // Also allows combinations like 1.5, 2.25, 3.75, etc.
  const validateFractionalQuantity = (value: number): number => {
    if (value <= 0) return 0.25; // Minimum is 0.25
    
    // Get the whole number part and decimal part
    const wholePart = Math.floor(value);
    const decimalPart = value - wholePart;
    
    // If it's a whole number, return it
    if (decimalPart === 0) {
      return wholePart;
    }
    
    // Check if decimal part is one of the allowed fractions
    // Allowed: 0.25, 0.5, 0.75
    const allowedDecimals = [0.25, 0.5, 0.75];
    const tolerance = 0.001; // Small tolerance for floating point comparison
    
    // Find the closest allowed decimal
    let closestDecimal = allowedDecimals[0];
    let minDiff = Math.abs(decimalPart - allowedDecimals[0]);
    
    for (const allowed of allowedDecimals) {
      const diff = Math.abs(decimalPart - allowed);
      if (diff < minDiff) {
        minDiff = diff;
        closestDecimal = allowed;
      }
    }
    
    // If the decimal is close enough to an allowed value, use it
    if (minDiff < tolerance) {
      return wholePart + closestDecimal;
    }
    
    // Otherwise, round to the nearest allowed value
    // If decimal is between 0 and 0.25, round to 0.25
    // If between 0.25 and 0.5, round to 0.5
    // If between 0.5 and 0.75, round to 0.75
    // If above 0.75, round up to next whole number
    if (decimalPart < 0.125) {
      return wholePart + 0.25;
    } else if (decimalPart < 0.375) {
      return wholePart + 0.5;
    } else if (decimalPart < 0.625) {
      return wholePart + 0.75;
    } else {
      return wholePart + 1;
    }
  };

  // Update item quantity
  const updateItemQuantity = (itemId: string, quantity: number) => {
    setPosItems(
      posItems.map((item) => {
        if (item.id === itemId) {
          // Validate and normalize the quantity
          const validatedQty = validateFractionalQuantity(quantity);
          const itemAmount = Number(item.rate) * validatedQty;
          return {
            ...item,
            quantity: validatedQty,
            amount: itemAmount,
            vat: 0, // VAT is calculated on subtotal only, not per item
          };
        }
        return item;
      })
    );
  };

  // Delete item from POS
  const deleteItem = (itemId: string) => {
    setPosItems(posItems.filter((item) => item.id !== itemId));
  };

  // Calculate totals
  const calculateTotals = () => {
    const subTotal = posItems.reduce((sum, item) => sum + Number(item.amount || 0), 0);
    // Calculate VAT based on includeVAT flag: if enabled, calculate 16% of subtotal, otherwise 0
    const vatTotal = includeVAT ? subTotal * 0.16 : 0; // 16% VAT if enabled, 0 if disabled
    const totalBeforeDiscount = subTotal + vatTotal;
    
    // Calculate discount based on type
    let discountAmount = 0;
    if (discountType === 'percentage') {
      // Calculate discount from percentage
      discountAmount = (totalBeforeDiscount * discountPercentage) / 100;
    } else {
      // Use fixed discount amount
      discountAmount = Number(discount) || 0;
    }
    
    const totalAfterDiscount = Math.max(0, totalBeforeDiscount - discountAmount); // Ensure total doesn't go negative
    const total = Math.round(totalAfterDiscount); // Round to nearest whole number
    return { subTotal, vatTotal, discountAmount, total };
  };

  // Handle payment
  const handlePayment = () => {
    const { total } = calculateTotals();
    setPaymentDetails({ ...paymentDetails, netAmount: total });
    setPaymentOpen(true);
  };

  // Calculate change
  useEffect(() => {
    const change = paymentDetails.tendered - paymentDetails.netAmount;
    setPaymentDetails((prev) => ({ ...prev, change }));
  }, [paymentDetails.tendered, paymentDetails.netAmount]);

  // Save as draft
  const saveDraft = async () => {
    try {
      setLoading(true);
      const { total } = calculateTotals();
      const response = await api.post('/invoices/draft', {
        items: posItems,
        total,
        account_id: selectedAccount,
      });
      if (response.data.success) {
        setPosItems([]);
        setSelectedAccount('');
        setCurrentDraftId(null);
        setDiscount(0);
        setDiscountPercentage(0);
        setDiscountType('percentage');
        setError('');
        alert('Invoice saved as draft successfully!');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to save draft');
      console.error('Save draft error:', err);
      alert('Failed to save draft: ' + (err.response?.data?.message || 'Unknown error'));
    } finally {
      setLoading(false);
    }
  };

  // Generate invoice number with POS_INJ prefix
  const generateInvoiceNumber = async () => {
    try {
      // Fetch latest invoice to get next sequence number
      const response = await ApiService.getInvoices({ limit: 1 });
      const invoices = response.data?.invoices || response.invoices || [];
      
      let nextNumber = 1;
      if (invoices.length > 0) {
        const lastInvoice = invoices[0];
        const lastNumber = lastInvoice.invoice_number;
        
        // Extract number from last invoice if it has POS_INJ prefix
        if (lastNumber && lastNumber.startsWith('POS_INJ')) {
          const numPart = lastNumber.replace('POS_INJ', '');
          nextNumber = parseInt(numPart) + 1;
        }
      }
      
      // Format with leading zeros (e.g., POS_INJ00001)
      return `POS_INJ${String(nextNumber).padStart(5, '0')}`;
    } catch (error) {
      console.error('Error generating invoice number:', error);
      // Fallback to timestamp-based number
      return `POS_INJ${Date.now()}`;
    }
  };

  // Save invoice to database
  const saveInvoice = async (options?: { autoPrint?: boolean }) => {
    if (posItems.length === 0) {
      setError('Cannot save empty invoice');
      return;
    }

    if (!selectedAccount) {
      setError('Please select a financial account');
      setAccountsOpen(true);
      return;
    }

    try {
      setLoading(true);
      setError('');
      
      // Check if this is an existing invoice being updated
      if (selectedInvoiceId) {
        // Update existing invoice
        const { total, subTotal, vatTotal } = calculateTotals();
        const currentDate = new Date().toISOString().split('T')[0];
        
        const invoiceData = {
          customer_name: 'POS Customer',
          customer_address: '',
          lines: posItems.map(item => ({
            item_id: parseInt(item.id),
            quantity: item.quantity,
            unit_price: Number(item.rate),
            description: item.description || item.name,
            code: item.code,
            uom: item.unit,
          })),
          notes: `POS Sale - Account: ${accounts.find(a => a.id === selectedAccount)?.account_name || selectedAccount}`,
          due_date: currentDate,
          payment_terms: posPaymentMethod,
          payment_method: posPaymentMethod,
          mpesa_code: posPaymentMethod === 'M-Pesa' ? mpesaCode : '',
          amountPaid: parseFloat(amountPaid.toString()) || 0,
          paymentMethod: selectedAccount || null,
          vat_amount: vatTotal, // Send calculated VAT amount (0 if VAT is unchecked)
          discount_amount: discountAmount, // Send calculated discount amount
        };
        
        // Update invoice using the API
        await ApiService.updateInvoice(parseInt(selectedInvoiceId), invoiceData);
        
        // Update invoice status to paid
        await api.patch(`/invoices/${selectedInvoiceId}/status`, { 
          status: 'paid'
        });
        
        // Update financial account balance (add the total amount)
        try {
          await api.patch(`/financial-accounts/${selectedAccount}/balance`, {
            amount: total,
            operation: 'add'
          });
          console.log('✅ Financial account updated successfully');
        } catch (balanceError) {
          console.error('⚠️ Failed to update financial account balance:', balanceError);
        }
        
        alert(`Invoice updated successfully! Total: ${total.toFixed(2)}`);
        if (options?.autoPrint) {
          await printReceipt();
        }
        setPosItems([]);
        setSelectedInvoiceId(null);
        setSelectedAccount('');
        setAmountPaid(0);
        setMpesaCode('');
        setPosPaymentMethod('Cash');
        setDiscount(0);
        setDiscountPercentage(0);
        setDiscountType('percentage');
        setDiscountPercentage(0);
        setDiscountType('percentage');
        
        // Refresh financial accounts to show updated balance
        await fetchFinancialAccounts();
      } else if (currentDraftId) {
        // Convert draft to real invoice
        const convertResponse = await api.post(`/invoices/draft/${currentDraftId}/convert`);
        
        if (convertResponse.data.success) {
          const invoice = convertResponse.data.data;
          
          // Update invoice status to paid
          await api.patch(`/invoices/${currentDraftId}/status`, { 
            status: 'paid'
          });
          
          // Update financial account balance
          try {
            await api.patch(`/financial-accounts/${selectedAccount}/balance`, {
              amount: invoice.total_amount,
              operation: 'add'
            });
          } catch (balanceError) {
            console.error('⚠️ Failed to update financial account balance:', balanceError);
          }
          
          alert(`Invoice ${invoice.invoice_number} saved successfully!`);
          if (options?.autoPrint) {
            await printReceipt();
          }
          setPosItems([]);
          setCurrentDraftId(null);
          setSelectedAccount('');
          setAmountPaid(0);
          setMpesaCode('');
          setPosPaymentMethod('Cash');
          setDiscount(0);
          setDiscountPercentage(0);
          setDiscountType('percentage');
          
          // Refresh financial accounts
          await fetchFinancialAccounts();
        }
      } else {
        // Create new invoice
        const invoiceNumber = await generateInvoiceNumber();
        const { total, subTotal, vatTotal } = calculateTotals();
        const currentDate = new Date().toISOString().split('T')[0];
        
        const invoiceData = {
          customer_name: 'POS Customer',
          customer_address: '',
          lines: posItems.map(item => ({
            item_id: parseInt(item.id),
            quantity: item.quantity,
            unit_price: Number(item.rate),
            description: item.description || item.name,
            code: item.code,
            uom: item.unit,
          })),
          notes: `POS Sale - Account: ${accounts.find(a => a.id === selectedAccount)?.account_name || selectedAccount}`,
          due_date: currentDate,
          payment_terms: posPaymentMethod,
          payment_method: posPaymentMethod,
          mpesa_code: posPaymentMethod === 'M-Pesa' ? mpesaCode : '',
          amountPaid: parseFloat(amountPaid.toString()) || 0,
          paymentMethod: selectedAccount || null,
          vat_amount: vatTotal, // Send calculated VAT amount (0 if VAT is unchecked)
          discount_amount: discountAmount, // Send calculated discount amount
        };
        
        // Create invoice using the API
        const result = await ApiService.createInvoice(invoiceData);
        const createdInvoice = result.data?.invoice || result.invoice;
        
        // Update invoice status to paid (invoice number is auto-generated by backend)
        if (createdInvoice?.id) {
          await api.patch(`/invoices/${createdInvoice.id}/status`, { 
            status: 'paid'
          });
          
          // Link M-Pesa confirmation if M-Pesa code is provided
          if (posPaymentMethod === 'M-Pesa' && mpesaCode) {
            try {
              // Find the confirmation by trans_id
              const confirmationsResponse = await ApiService.getAllMpesaConfirmations({ linked: false });
              const confirmations = confirmationsResponse.data?.confirmations || [];
              const matchingConfirmation = confirmations.find((c: any) => c.trans_id === mpesaCode);
              
              if (matchingConfirmation) {
                await ApiService.linkMpesaConfirmation(matchingConfirmation.id, createdInvoice.id);
                console.log('✅ M-Pesa confirmation linked to invoice');
              }
            } catch (linkError) {
              console.error('⚠️ Failed to link M-Pesa confirmation:', linkError);
            }
          }
        }
        
        // Update financial account balance (add the total amount)
        try {
          await api.patch(`/financial-accounts/${selectedAccount}/balance`, {
            amount: total,
            operation: 'add'
          });
          console.log('✅ Financial account updated successfully');
        } catch (balanceError) {
          console.error('⚠️ Failed to update financial account balance:', balanceError);
        }
        
        alert(`Invoice ${invoiceNumber} saved successfully! Total: ${total.toFixed(2)}`);
        if (options?.autoPrint) {
          await printReceipt();
        }
        setPosItems([]);
        setSelectedAccount('');
        setSelectedInvoiceId(null);
        setAmountPaid(0);
        setMpesaCode('');
        setPosPaymentMethod('Cash');
        setDiscount(0);
        setDiscountPercentage(0);
        setDiscountType('percentage');
        
        // Refresh financial accounts to show updated balance
        await fetchFinancialAccounts();
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to save invoice');
      console.error('Save invoice error:', err);
    } finally {
      setLoading(false);
    }
  };

  const saveAndPrintInvoice = async () => {
    await saveInvoice({ autoPrint: true });
  };

  // Clear all items and start new invoice
  const addNewInvoice = () => {
    if (posItems.length > 0) {
      const confirmed = window.confirm('Clear current items and start new invoice?');
      if (!confirmed) return;
    }
    setPosItems([]);
    setError('');
    setSelectedInvoiceId(null);
    setCurrentDraftId(null);
    setAmountPaid(0);
    setMpesaCode('');
    setPosPaymentMethod('Cash');
    setDiscount(0);
    setDiscountPercentage(0);
    setDiscountType('percentage');
  };

  // Retrieve draft
  const retrieveDraft = async (draft: DraftInvoice) => {
    try {
      setLoading(true);
      // Fetch full draft details with lines
      const response = await api.get(`/invoices/${draft.id}`);
      
      if (response.data.success && response.data.data) {
        const invoiceData = response.data.data;
        
        // Convert invoice lines to POS items format
        const items = (invoiceData.lines || []).map((line: any) => {
          const quantity = parseFloat(line.quantity) || 0;
          const rate = parseFloat(line.unit_price) || 0;
          const amount = parseFloat(line.total) || (quantity * rate);
          
          return {
            id: String(line.item_id || line.id),
            name: line.item_name || line.description || 'Item',
            code: line.code || '',
            quantity: quantity,
            unit: line.uom || 'PCS',
            rate: rate,
            vat: 0, // VAT is calculated on subtotal only, not per item
            amount: amount,
            description: line.description || line.item_name || 'Item', // Preserve description
          };
        });
        
        setPosItems(items);
        setCurrentDraftId(draft.id); // Store draft ID for later conversion
        setSelectedInvoiceId(null); // Clear selected invoice
        setRetrieveOpen(false);
      }
    } catch (error) {
      console.error('Error retrieving draft:', error);
      setError('Failed to retrieve draft');
    } finally {
      setLoading(false);
    }
  };

  // Handle invoice selection from search
  const handleInvoiceSelect = async (invoice: any) => {
    try {
      setLoading(true);
      setError('');
      
      // Fetch full invoice details with lines
      const response = await ApiService.getInvoice(invoice.id);
      
      if (response.success && response.data) {
        const invoiceData = response.data;
        
        // Convert invoice lines to POS items format
        const items = (invoiceData.lines || []).map((line: any) => {
          const quantity = parseFloat(line.quantity) || 0;
          const rate = parseFloat(line.unit_price) || 0;
          const amount = parseFloat(line.total) || (quantity * rate);
          
          return {
            id: String(line.item_id || line.id),
            name: line.item_name || line.description || 'Item',
            code: line.code || '',
            quantity: quantity,
            unit: line.uom || 'PCS',
            rate: rate,
            vat: 0, // VAT is calculated on subtotal only, not per item
            amount: amount,
            description: line.description || line.item_name || 'Item', // Preserve description
          };
        });
        
        setPosItems(items);
        setSelectedInvoiceId(String(invoice.id)); // Store invoice ID for potential update
        setCurrentDraftId(null); // Clear draft ID
        setSearchInvoiceOpen(false); // Close the modal
        setInvoiceSearchQuery(''); // Clear search query
      } else {
        setError('Failed to load invoice details');
      }
    } catch (error: any) {
      console.error('Error loading invoice:', error);
      setError(error.response?.data?.message || 'Failed to load invoice details');
    } finally {
      setLoading(false);
    }
  };

  // Print receipt - Generate PDF instead of using browser print dialog (works on mobile)
  const printReceipt = async () => {
    if (posItems.length === 0) {
      setError('No items to print');
      return;
    }
    
    try {
      setLoading(true);
      setError('');
      const receiptTotals = calculateTotals();
      const { subTotal, vatTotal, discountAmount, total } = receiptTotals;
      
      // Fetch business settings from API
      let businessSettings: any = {};
      try {
        const response = await ApiService.getBusinessSettings();
        if (response.success && response.data) {
          businessSettings = response.data;
          console.log('Business settings fetched:', businessSettings);
          console.log('PIN value:', businessSettings.pin);
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
      
      // Create a temporary div to render the receipt
      // Position at (0,0) so html2canvas captures content starting from top-left
      const tempDiv = document.createElement('div');
      tempDiv.style.position = 'fixed';
      tempDiv.style.left = '0';
      tempDiv.style.top = '0';
      tempDiv.style.width = '80mm';
      tempDiv.style.padding = '10px';
      tempDiv.style.paddingTop = '10px';
      tempDiv.style.margin = '0';
      tempDiv.style.marginTop = '0';
      tempDiv.style.fontFamily = "'Courier New', monospace";
      tempDiv.style.fontSize = '12px';
      tempDiv.style.backgroundColor = '#ffffff';
      tempDiv.style.color = '#000000';
      tempDiv.style.zIndex = '-9999';
      tempDiv.style.pointerEvents = 'none';
      tempDiv.style.overflow = 'visible';
      tempDiv.style.boxSizing = 'border-box';
      
      tempDiv.innerHTML = `
        <div style="text-align: center; border-bottom: 2px dashed #000; padding-bottom: 10px; margin-top: 0; margin-bottom: 10px; width: 100%; box-sizing: border-box;">
          <h2 style="margin: 0; margin-bottom: 5px; font-size: 18px; text-align: center;">${businessSettings.businessName || 'Invoice App'}</h2>
          <p style="margin: 0; margin-bottom: 3px; font-size: 11px; text-align: center;">${fullAddress}</p>
          <p style="margin: 0; margin-bottom: 3px; font-size: 11px; text-align: center;">Phone Number: ${businessSettings.telephone || 'N/A'}</p>
          <p style="margin: 0; margin-bottom: 3px; font-size: 11px; text-align: center;">Email: ${businessSettings.email || user.email || 'N/A'}</p>
          <p style="margin: 0; font-size: 11px; text-align: center;">PIN: ${businessSettings.pin || 'N/A'}</p>
        </div>
        
        <div style="margin: 10px 0; font-size: 11px;">
          <div style="display: flex; justify-content: space-between; margin-bottom: 5px;">
            <span>Date:</span>
            <span>${new Date().toLocaleString()}</span>
          </div>
          <div style="display: flex; justify-content: space-between;">
            <span>Cashier:</span>
            <span>${businessSettings.createdBy || `${user.first_name || 'N/A'} ${user.last_name || ''}`}</span>
          </div>
        </div>
        
        <table style="width: 100%; margin: 10px 0; border-collapse: collapse;">
          <thead>
            <tr>
              <th style="border-bottom: 1px solid #000; padding: 5px 2px; text-align: left; font-size: 11px;">Item</th>
              <th style="border-bottom: 1px solid #000; padding: 5px 2px; text-align: center; font-size: 11px;">Qty</th>
              <th style="border-bottom: 1px solid #000; padding: 5px 2px; text-align: right; font-size: 11px;">Price</th>
              <th style="border-bottom: 1px solid #000; padding: 5px 2px; text-align: right; font-size: 11px;">Total</th>
            </tr>
          </thead>
          <tbody>
            ${posItems.map(item => {
              // Format quantity to show decimal values correctly (e.g., 1.5, 2.25, 0.75)
              const formattedQty = item.quantity % 1 === 0 
                ? item.quantity.toString() 
                : item.quantity.toFixed(2).replace(/\.?0+$/, ''); // Remove trailing zeros
              return `
              <tr style="border-bottom: 1px dashed #ccc;">
                <td style="padding: 5px 2px; font-size: 11px;">${item.description || item.name}</td>
                <td style="padding: 5px 2px; font-size: 11px; text-align: center;">${formattedQty}</td>
                <td style="padding: 5px 2px; font-size: 11px; text-align: right;">${Number(item.rate).toFixed(2)}</td>
                <td style="padding: 5px 2px; font-size: 11px; text-align: right;">${Number(item.amount).toFixed(2)}</td>
              </tr>
            `;
            }).join('')}
          </tbody>
        </table>
        
        <div style="margin-top: 10px; padding-top: 10px; border-top: 2px dashed #000;">
          <div style="display: flex; justify-content: space-between; padding: 3px 0; font-size: 12px;">
            <span>Subtotal:</span>
            <span>${Number(subTotal).toFixed(2)}</span>
          </div>
          ${discountAmount > 0 ? `
          <div style="display: flex; justify-content: space-between; padding: 3px 0; font-size: 12px; color: #d32f2f;">
            <span>Discount:</span>
            <span>-${Number(discountAmount).toFixed(2)}</span>
          </div>
          ` : ''}
          <div style="display: flex; justify-content: space-between; padding: 3px 0; font-size: 14px; font-weight: bold; border-top: 1px solid #000; margin-top: 5px; padding-top: 5px;">
            <span>TOTAL:</span>
            <span>${Number(total).toFixed(2)}</span>
          </div>
          <div style="display: flex; justify-content: space-between; padding: 3px 0; font-size: 12px; margin-top: 8px;">
            <span>Amount Received:</span>
            <span>${Number(amountPaid).toFixed(2)}</span>
          </div>
          ${amountPaid < total ? `
          <div style="display: flex; justify-content: space-between; padding: 3px 0; font-size: 12px; color: #d32f2f;">
            <span>Amount Due:</span>
            <span>${Number(total - amountPaid).toFixed(2)}</span>
          </div>
          ` : amountPaid > total ? `
          <div style="display: flex; justify-content: space-between; padding: 3px 0; font-size: 12px; color: #4caf50;">
            <span>Change Due:</span>
            <span>${Number(amountPaid - total).toFixed(2)}</span>
          </div>
          ` : ''}
        </div>
        
        <div style="text-align: center; margin-top: 15px; padding-top: 10px; border-top: 2px dashed #000; font-size: 11px;">
          <p>Thank you for your business!</p>
          <p>Powered by ${businessSettings.businessName || 'Invoice App'}</p>
        </div>
      `;
      
      document.body.appendChild(tempDiv);
      
      // Wait for the element to be rendered
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Generate canvas from the receipt content
      // Since div is at (0,0), html2canvas will capture it correctly without offset
      const canvas = await html2canvas(tempDiv, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        width: tempDiv.offsetWidth,
        height: tempDiv.scrollHeight,
      });
      
      // Remove the temporary div
      document.body.removeChild(tempDiv);
      
      // Create PDF - calculate height based on actual content
      const imgData = canvas.toDataURL('image/png');
      const pdfWidth = 80; // 80mm width
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      const pdf = new jsPDF('p', 'mm', [pdfWidth, pdfHeight]);
      
      // Add image starting at top-left (0, 0) - content will be at top since canvas starts at (0,0)
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      
      // Generate filename
      const fileName = `Receipt_${new Date().toISOString().split('T')[0]}_${Date.now()}.pdf`;
      
      // Save the PDF
      saveAs(pdf.output('blob'), fileName);
      setSuccess('Receipt generated successfully!');
      setTimeout(() => setSuccess(''), 3000);
      
    } catch (error: any) {
      console.error('Error generating receipt PDF:', error);
      setError('Failed to generate receipt: ' + (error.message || 'Unknown error'));
    } finally {
      setLoading(false);
    }
  };

  // Calculate totals using useMemo for performance
  const totals = useMemo(() => calculateTotals(), [posItems, includeVAT, discountType, discountPercentage, discount]);
  const { subTotal, vatTotal, discountAmount, total } = totals;

  return (
    <Box sx={{ width: '100vw', minHeight: '100vh', margin: 0 }}>
      <Container maxWidth="xl" sx={{ p: { xs: 2, md: 3 } }}>
        {/* Header */}
        <AppBar position="static" sx={{ backgroundColor: '#1976d2', mb: 3, borderRadius: 1 }}>
          <Toolbar sx={{ display: 'flex', justifyContent: 'space-between' }}>
            <Typography variant="h6" fontWeight="bold">
              POS System
            </Typography>
            <Button
              onClick={() => setAccountsOpen(true)}
              sx={{ backgroundColor: '#fff', color: '#1976d2', fontWeight: 'bold', '&:hover': { backgroundColor: '#f0f0f0' } }}
            >
              💳 Cash Account
            </Button>
          </Toolbar>
        </AppBar>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
            {error}
          </Alert>
        )}

        {selectedInvoiceId && (
          <Alert severity="info" sx={{ mb: 2 }} onClose={() => setSelectedInvoiceId(null)}>
            📋 Editing invoice. Changes will update the existing invoice when saved.
          </Alert>
        )}

        <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 1, alignItems: 'flex-start' }}>
          {/* Left: Items Table */}
          <Box sx={{ flex: '1 1 auto', minWidth: 0, width: { xs: '100%', md: 'auto' } }}>
            <Paper sx={{ p: 2, borderRadius: 2, boxShadow: 2, height: '100%' }}>
              <Typography variant="h6" fontWeight="bold" sx={{ mb: 2 }}>
                Items
              </Typography>
              <Box sx={{ mb: 2, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                <Button
                  variant="contained"
                  onClick={() => setSearchOpen(true)}
                  startIcon={<SearchIcon />}
                  sx={{ backgroundColor: '#1976d2' }}
                >
                  Lookup Item
                </Button>
                <Button
                  variant="outlined"
                  onClick={openAddProductModal}
                  startIcon={<AddIcon />}
                  sx={{ color: '#1976d2', borderColor: '#1976d2' }}
                >
                  Add Product
                </Button>
                <Button
                  variant="outlined"
                  onClick={() => {
                    setSearchInvoiceOpen(true);
                    fetchInvoices();
                  }}
                  startIcon={<SearchIcon />}
                  sx={{ color: '#1976d2', borderColor: '#1976d2' }}
                >
                  Search Invoices
                </Button>
              </Box>

              <TableContainer>
                <Table>
                  <TableHead sx={{ backgroundColor: '#f5f5f5' }}>
                    <TableRow>
                      <TableCell>#</TableCell>
                      <TableCell>Item Description</TableCell>
                      <TableCell align="right">Qty</TableCell>
                      <TableCell>Unit</TableCell>
                      <TableCell align="right">Rate</TableCell>
                      <TableCell align="right">Amount</TableCell>
                      <TableCell align="center">Action</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {posItems.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} align="center" sx={{ py: 4, color: '#999' }}>
                          No items added yet
                        </TableCell>
                      </TableRow>
                    ) : (
                      posItems.map((item, index) => (
                        <TableRow key={item.id} sx={{ '&:hover': { backgroundColor: '#f9f9f9' } }}>
                          <TableCell>{index + 1}</TableCell>
                          <TableCell>{item.description || item.name || 'N/A'}</TableCell>
                          <TableCell align="right">
                            <TextField
                              type="number"
                              size="small"
                              value={item.quantity || 1}
                              onChange={(e) => {
                                const inputValue = parseFloat(e.target.value) || 0;
                                updateItemQuantity(item.id, inputValue);
                              }}
                              onBlur={(e) => {
                                // Validate on blur to ensure correct value
                                const inputValue = parseFloat(e.target.value) || 0;
                                const validatedQty = validateFractionalQuantity(inputValue);
                                if (Math.abs(validatedQty - inputValue) > 0.001) {
                                  updateItemQuantity(item.id, validatedQty);
                                }
                              }}
                              inputProps={{ 
                                min: 0.25, 
                                step: 0.25
                              }}
                              sx={{ width: 80 }}
                            />
                          </TableCell>
                          <TableCell>{item.unit || 'PCS'}</TableCell>
                          <TableCell align="right">{Number(item.rate || 0).toFixed(2)}</TableCell>
                          <TableCell align="right" sx={{ fontWeight: 'bold' }}>
                            {Number(item.amount || 0).toFixed(2)}
                          </TableCell>
                          <TableCell align="center">
                            <IconButton
                              size="small"
                              onClick={() => deleteItem(item.id)}
                              sx={{ color: '#d32f2f' }}
                            >
                              <DeleteIcon />
                            </IconButton>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </Paper>
          </Box>

          {/* Right: Summary & Actions */}
          <Box sx={{ flex: { xs: '0 0 auto', md: '0 0 320px' }, width: { xs: '100%', md: '320px' }, minWidth: { xs: 'auto', md: '280px' } }}>
            <Paper sx={{ p: 2, borderRadius: 2, boxShadow: 2, backgroundColor: '#f9f9f9', height: '100%' }}>
              <Typography variant="h6" fontWeight="bold" sx={{ mb: 2 }}>
                Summary
              </Typography>
              
              {/* VAT Toggle */}
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
                <Box sx={{ display: 'flex', gap: 1, mb: 1 }}>
                  <Button
                    variant={discountType === 'percentage' ? 'contained' : 'outlined'}
                    size="small"
                    onClick={() => {
                      setDiscountType('percentage');
                      setDiscountPercentage(0);
                      setDiscount(0);
                    }}
                    sx={{ flex: 1 }}
                  >
                    Percentage
                  </Button>
                  <Button
                    variant={discountType === 'fixed' ? 'contained' : 'outlined'}
                    size="small"
                    onClick={() => {
                      setDiscountType('fixed');
                      setDiscountPercentage(0);
                      setDiscount(0);
                    }}
                    sx={{ flex: 1 }}
                  >
                    Fixed Amount
                  </Button>
                </Box>
                {discountType === 'percentage' ? (
                  <TextField
                    fullWidth
                    label="Discount Percentage (%)"
                    type="number"
                    size="small"
                    value={discountPercentage}
                    onChange={(e) => {
                      const value = Math.max(0, Math.min(100, parseFloat(e.target.value) || 0));
                      setDiscountPercentage(value);
                    }}
                    inputProps={{ 
                      min: 0,
                      max: 100,
                      step: 0.01
                    }}
                    helperText={`Discount: ${Number(calculateTotals().discountAmount).toFixed(2)}`}
                  />
                ) : (
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
                )}
              </Box>
              
              <Box sx={{ mb: 2, p: 1.5, backgroundColor: '#fff', borderRadius: 1 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body2" color="text.secondary">Subtotal:</Typography>
                  <Typography variant="body2" fontWeight="bold">{Number(subTotal).toFixed(2)}</Typography>
                </Box>
                {includeVAT && (
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="body2" color="text.secondary">VAT (16%):</Typography>
                    <Typography variant="body2" fontWeight="bold">{Number(vatTotal).toFixed(2)}</Typography>
                  </Box>
                )}
                {calculateTotals().discountAmount > 0 && (
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="body2" color="text.secondary" sx={{ color: 'error.main' }}>
                      Discount{discountType === 'percentage' ? ` (${discountPercentage}%)` : ''}:
                    </Typography>
                    <Typography variant="body2" fontWeight="bold" sx={{ color: 'error.main' }}>
                      -{Number(calculateTotals().discountAmount).toFixed(2)}
                    </Typography>
                  </Box>
                )}
                <Divider sx={{ my: 1 }} />
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                  <Typography variant="h6" fontWeight="bold">
                    Total:
                  </Typography>
                  <Typography variant="h6" fontWeight="bold" sx={{ color: '#1976d2' }}>
                    {Number(total).toFixed(2)}
                  </Typography>
                </Box>
              </Box>
                
              {/* Payment Information */}
              <Box>
                <Divider sx={{ my: 1.5 }} />
                <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 'bold', mb: 1 }}>
                  Payment Information
                </Typography>
                
                <Box sx={{ mb: 1.5 }}>
                  <TextField
                    fullWidth
                    label="Amount Paid"
                    type="number"
                    size="small"
                    value={amountPaid}
                    onChange={(e) => setAmountPaid(parseFloat(e.target.value) || 0)}
                    inputProps={{ 
                      step: 0.01,
                      min: 0
                    }}
                    sx={{ mb: 1 }}
                  />
                  
                  {posPaymentMethod === 'M-Pesa' && (
                    <TextField
                      fullWidth
                      label="M-Pesa Transaction Code"
                      size="small"
                      value={mpesaCode}
                      onChange={(e) => setMpesaCode(e.target.value)}
                      onClick={() => {
                        if (posPaymentMethod === 'M-Pesa') {
                          fetchMpesaConfirmations();
                          setMpesaModalOpen(true);
                        }
                      }}
                      placeholder="Click to select from confirmations..."
                      sx={{ mb: 1, cursor: 'pointer' }}
                      InputProps={{
                        readOnly: true,
                        endAdornment: (
                          <IconButton
                            size="small"
                            onClick={(e) => {
                              e.stopPropagation();
                              fetchMpesaConfirmations();
                              setMpesaModalOpen(true);
                            }}
                          >
                            <SearchIcon />
                          </IconButton>
                        )
                      }}
                    />
                  )}
                  
                  <FormControl fullWidth size="small" sx={{ mb: 1 }}>
                    <InputLabel>Payment Method</InputLabel>
                    <Select
                      value={posPaymentMethod}
                      onChange={(e) => {
                        setPosPaymentMethod(e.target.value);
                        if (e.target.value !== 'M-Pesa') {
                          setMpesaCode('');
                        }
                      }}
                      label="Payment Method"
                    >
                      <MenuItem value="Cash">Cash</MenuItem>
                      <MenuItem value="M-Pesa">M-Pesa</MenuItem>
                      <MenuItem value="Card">Card</MenuItem>
                      <MenuItem value="Cheque">Cheque</MenuItem>
                    </Select>
                  </FormControl>
                </Box>
                
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body2" color="text.secondary">Amount Paid:</Typography>
                  <Typography variant="body2" fontWeight="bold" sx={{ color: 'primary.main' }}>
                    {Number(amountPaid).toFixed(2)}
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body2" color="text.secondary">Balance Due:</Typography>
                  <Typography 
                    variant="body2" 
                    fontWeight="bold"
                    sx={{ 
                      color: (total - amountPaid) > 0 ? 'error.main' : (total - amountPaid) < 0 ? 'success.main' : 'text.primary'
                    }}
                  >
                    {Number(total - amountPaid).toFixed(2)}
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 1.5 }}>
                  <Typography variant="body2" color="text.secondary">Status:</Typography>
                  <Chip 
                    label={
                      amountPaid === 0 ? 'Unpaid' :
                      amountPaid >= total ? 'Paid' : 'Partially Paid'
                    }
                    color={
                      amountPaid === 0 ? 'error' :
                      amountPaid >= total ? 'success' : 'warning'
                    }
                    size="small"
                  />
                </Box>
              </Box>

              <Stack spacing={1.5}>
                <Button
                  variant="contained"
                  fullWidth
                  onClick={() => saveInvoice()}
                  disabled={posItems.length === 0 || loading || !selectedAccount}
                  sx={{ backgroundColor: '#2196f3', '&:hover': { backgroundColor: '#1976d2' } }}
                  startIcon={<SaveIcon />}
                >
                  💾 Save Invoice
                </Button>
                <Button
                  variant="contained"
                  fullWidth
                  onClick={addNewInvoice}
                  sx={{ backgroundColor: '#9c27b0', '&:hover': { backgroundColor: '#7b1fa2' } }}
                  startIcon={<AddIcon />}
                >
                  ➕ Add New
                </Button>
                <Button
                  variant="contained"
                  fullWidth
                  onClick={saveDraft}
                  disabled={posItems.length === 0 || loading}
                  sx={{ backgroundColor: '#ff9800', '&:hover': { backgroundColor: '#f57c00' } }}
                  startIcon={<SaveIcon />}
                >
                  Hold (Save as Draft)
                </Button>
                <Button
                  variant="outlined"
                  fullWidth
                  onClick={() => {
                    fetchDrafts();
                    setRetrieveOpen(true);
                  }}
                  sx={{ color: '#1976d2', borderColor: '#1976d2' }}
                >
                  📋 Retrieve Draft
                </Button>
                <Button
                  variant="contained"
                  fullWidth
                  onClick={() => saveAndPrintInvoice()}
                  disabled={posItems.length === 0 || loading || !selectedAccount}
                  sx={{ backgroundColor: '#1976d2' }}
                  startIcon={<PrintIcon />}
                >
                  Save & Print
                </Button>
                <Button
                  variant="outlined"
                  fullWidth
                  onClick={() => {
                    setPosItems([]);
                    setSelectedInvoiceId(null);
                    setCurrentDraftId(null);
                    setAmountPaid(0);
                    setMpesaCode('');
                    setPosPaymentMethod('Cash');
                    setDiscount(0);
                    setDiscountPercentage(0);
                    setDiscountType('percentage');
                  }}
                  disabled={posItems.length === 0}
                  sx={{ color: '#d32f2f', borderColor: '#d32f2f' }}
                  startIcon={<DeleteIcon />}
                >
                  Delete Bill
                </Button>
              </Stack>
            </Paper>
          </Box>
        </Box>

        {/* Search Items Modal */}
        <Dialog open={searchOpen} onClose={() => setSearchOpen(false)} maxWidth="md" fullWidth>
          <DialogTitle sx={{ backgroundColor: '#1976d2', color: 'white', fontWeight: 'bold' }}>
            Lookup Items
          </DialogTitle>
          <DialogContent sx={{ pt: 2 }}>
            <Box sx={{ display: 'flex', gap: 1, mb: 2, flexWrap: 'wrap' }}>
              <TextField
                fullWidth
                placeholder="Search by name, code, or category..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearchItems()}
                sx={{ flex: '1 1 300px' }}
              />
              <FormControl sx={{ minWidth: 150 }}>
                <InputLabel>Filter by Category</InputLabel>
                <Select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  label="Filter by Category"
                >
                  <MenuItem value="all">All Categories</MenuItem>
                  {categories.map((category) => (
                    <MenuItem key={category.id} value={category.id}>
                      {category.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <Button variant="contained" onClick={handleSearchItems} sx={{ backgroundColor: '#1976d2' }}>
                Search
              </Button>
            </Box>
            <TableContainer>
              <Table>
                <TableHead sx={{ backgroundColor: '#f5f5f5' }}>
                  <TableRow>
                    <TableCell>Item Name</TableCell>
                    <TableCell>Item Description</TableCell>
                    <TableCell>Code</TableCell>
                    <TableCell>{businessCategoryNames.category_name}</TableCell>
                    <TableCell>{businessCategoryNames.category_1_name}</TableCell>
                    <TableCell>{businessCategoryNames.category_2_name}</TableCell>
                    <TableCell align="right">Stock</TableCell>
                    <TableCell align="right">Price</TableCell>
                    <TableCell align="center">Action</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {availableItems.map((item: any) => (
                    <TableRow key={item.id}>
                      <TableCell>{item.item_name || 'Unknown'}</TableCell>
                      <TableCell>{item.description || item.item_name || 'Unknown'}</TableCell>
                      <TableCell>{item.code || '-'}</TableCell>
                      <TableCell>
                        {item.category_name ? (
                          <Chip label={item.category_name} size="small" color="primary" variant="outlined" />
                        ) : (
                          <Typography variant="caption" color="text.secondary">-</Typography>
                        )}
                      </TableCell>
                      <TableCell>
                        {item.category_1_name ? (
                          <Chip label={item.category_1_name} size="small" color="info" variant="outlined" />
                        ) : (
                          <Typography variant="caption" color="text.secondary">-</Typography>
                        )}
                      </TableCell>
                      <TableCell>
                        {item.category_2_name ? (
                          <Chip label={item.category_2_name} size="small" color="success" variant="outlined" />
                        ) : (
                          <Typography variant="caption" color="text.secondary">-</Typography>
                        )}
                      </TableCell>
                      <TableCell align="right">{item.quantity || 0}</TableCell>
                      <TableCell align="right">{Number(item.selling_price || 0).toFixed(2)}</TableCell>
                      <TableCell align="center">
                        <Stack direction="row" spacing={1} justifyContent="center">
                          <Button
                            size="small"
                            variant="outlined"
                            onClick={() => {
                              setProductModalOpen(true);
                              loadProductForEdit(Number(item.id));
                            }}
                            sx={{ color: '#1976d2', borderColor: '#1976d2' }}
                          >
                            Edit
                          </Button>
                          <Button
                            size="small"
                            variant="contained"
                            onClick={() => addItemToPOS(item)}
                            sx={{ backgroundColor: '#4caf50', '&:hover': { backgroundColor: '#388e3c' } }}
                          >
                            Add
                          </Button>
                        </Stack>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setSearchOpen(false)}>Close</Button>
          </DialogActions>
        </Dialog>

        {/* Product Modal */}
        <Dialog open={productModalOpen} onClose={() => {
          setProductModalOpen(false);
          resetProductForm();
        }} maxWidth="md" fullWidth>
          <DialogTitle sx={{ backgroundColor: '#1976d2', color: 'white', fontWeight: 'bold' }}>
            {editingProductId ? 'Edit Product' : 'Add Product'}
          </DialogTitle>
          <DialogContent sx={{ pt: 2 }}>
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

            <Grid container spacing={2}>
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                  fullWidth
                  label="Item Name"
                  name="item_name"
                  value={productFormData.item_name}
                  onChange={handleProductFormChanged}
                  required
                />
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                  fullWidth
                  label="Description"
                  name="description"
                  value={productFormData.description}
                  onChange={handleProductFormChanged}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                  fullWidth
                  label="Quantity"
                  name="quantity"
                  type="number"
                  value={productFormData.quantity}
                  onChange={handleProductFormChanged}
                  inputProps={{ min: 0, step: 0.01 }}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                  fullWidth
                  label="Buying Price"
                  name="buying_price"
                  type="number"
                  value={productFormData.buying_price}
                  onChange={handleProductFormChanged}
                  inputProps={{ min: 0, step: 0.01 }}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                  fullWidth
                  label="Selling Price"
                  name="selling_price"
                  type="number"
                  value={productFormData.selling_price}
                  onChange={handleProductFormChanged}
                  inputProps={{ min: 0, step: 0.01 }}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                  fullWidth
                  label="Unit"
                  name="unit"
                  value={productFormData.unit}
                  onChange={handleProductFormChanged}
                  placeholder="PCS"
                />
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <FormControl fullWidth>
                  <InputLabel>{businessCategoryNames.category_name}</InputLabel>
                  <Select
                    value={productFormData.category_id}
                    onChange={(e) => setProductFormData((prev) => ({ ...prev, category_id: e.target.value }))}
                    label={businessCategoryNames.category_name}
                  >
                    <MenuItem value="">None</MenuItem>
                    {categories.map((category) => (
                      <MenuItem key={category.id} value={category.id}>{category.name}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <FormControl fullWidth>
                  <InputLabel>{businessCategoryNames.category_1_name}</InputLabel>
                  <Select
                    value={productFormData.category_1_id}
                    onChange={(e) => setProductFormData((prev) => ({ ...prev, category_1_id: e.target.value }))}
                    label={businessCategoryNames.category_1_name}
                  >
                    <MenuItem value="">None</MenuItem>
                    {categories.map((category) => (
                      <MenuItem key={category.id} value={category.id}>{category.name}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <FormControl fullWidth>
                  <InputLabel>{businessCategoryNames.category_2_name}</InputLabel>
                  <Select
                    value={productFormData.category_2_id}
                    onChange={(e) => setProductFormData((prev) => ({ ...prev, category_2_id: e.target.value }))}
                    label={businessCategoryNames.category_2_name}
                  >
                    <MenuItem value="">None</MenuItem>
                    {categories.map((category) => (
                      <MenuItem key={category.id} value={category.id}>{category.name}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                  fullWidth
                  label="Reorder Level"
                  name="reorder_level"
                  type="number"
                  value={productFormData.reorder_level}
                  onChange={handleProductFormChanged}
                  inputProps={{ min: 0, step: 1 }}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                  fullWidth
                  label="Modification Reason"
                  name="modification_reason"
                  value={productFormData.modification_reason}
                  onChange={handleProductFormChanged}
                  placeholder="Optional"
                />
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <LocalizationProvider dateAdapter={AdapterDateFns}>
                  <DatePicker
                    label="Manufacturing Date"
                    value={productManufacturingDate}
                    onChange={(newValue) => setProductManufacturingDate(newValue)}
                    slotProps={{ textField: { fullWidth: true } }}
                  />
                </LocalizationProvider>
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <LocalizationProvider dateAdapter={AdapterDateFns}>
                  <DatePicker
                    label="Expiry Date"
                    value={productExpiryDate}
                    onChange={(newValue) => setProductExpiryDate(newValue)}
                    slotProps={{ textField: { fullWidth: true } }}
                  />
                </LocalizationProvider>
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => {
              setProductModalOpen(false);
              resetProductForm();
            }}>Cancel</Button>
            <Button
              variant="contained"
              onClick={handleProductSubmit}
              disabled={productSaving}
              sx={{ backgroundColor: '#1976d2' }}
            >
              {productSaving ? 'Saving...' : editingProductId ? 'Update Product' : 'Save Product'}
            </Button>
          </DialogActions>
        </Dialog>

        {/* Payment Modal */}
        <Dialog open={paymentOpen} onClose={() => setPaymentOpen(false)} maxWidth="sm" fullWidth>
          <DialogTitle sx={{ backgroundColor: '#1976d2', color: 'white', fontWeight: 'bold' }}>
            {paymentMethod === 'cash' ? '💰 Cash Payment' : '💳 Card Payment'}
          </DialogTitle>
          <DialogContent sx={{ pt: 2 }}>
            {paymentMethod === null ? (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Button
                  variant="contained"
                  fullWidth
                  onClick={() => setPaymentMethod('cash')}
                  sx={{ backgroundColor: '#4caf50', py: 1.5 }}
                >
                  💰 Cash Payment
                </Button>
                <Button
                  variant="contained"
                  fullWidth
                  onClick={() => setPaymentMethod('card')}
                  sx={{ backgroundColor: '#1976d2', py: 1.5 }}
                >
                  💳 Card Payment
                </Button>
              </Box>
            ) : paymentMethod === 'cash' ? (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Typography variant="h6">Net Amount: {paymentDetails.netAmount.toFixed(2)}</Typography>
                <TextField
                  label="Tendered Amount"
                  type="number"
                  fullWidth
                  value={paymentDetails.tendered}
                  onChange={(e) =>
                    setPaymentDetails({ ...paymentDetails, tendered: parseFloat(e.target.value) || 0 })
                  }
                />
                <Typography variant="h6" sx={{ color: paymentDetails.change >= 0 ? '#4caf50' : '#d32f2f' }}>
                  Change: {paymentDetails.change.toFixed(2)}
                </Typography>
                <TextField label="Remarks (optional)" fullWidth multiline rows={2} />
              </Box>
            ) : (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Typography variant="h6">Net Amount: {paymentDetails.netAmount.toFixed(2)}</Typography>
                <TextField label="Amount" type="number" fullWidth value={paymentDetails.netAmount} disabled />
                <TextField
                  label="Card Number"
                  fullWidth
                  value={paymentDetails.cardNumber}
                  onChange={(e) =>
                    setPaymentDetails({ ...paymentDetails, cardNumber: e.target.value })
                  }
                />
                <FormControl fullWidth>
                  <InputLabel>Card Type</InputLabel>
                  <Select
                    value={paymentDetails.cardType}
                    onChange={(e) =>
                      setPaymentDetails({ ...paymentDetails, cardType: e.target.value })
                    }
                    label="Card Type"
                  >
                    <MenuItem value="visa">Visa</MenuItem>
                    <MenuItem value="mastercard">Mastercard</MenuItem>
                    <MenuItem value="amex">American Express</MenuItem>
                  </Select>
                </FormControl>
                <TextField label="Bank Name" fullWidth />
              </Box>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setPaymentMethod(null)}>Back</Button>
            <Button
              onClick={() => {
                setPaymentOpen(false);
                setPaymentMethod(null);
                setPosItems([]);
                alert('Payment processed successfully!');
              }}
              variant="contained"
              sx={{ backgroundColor: '#1976d2' }}
            >
              OK
            </Button>
          </DialogActions>
        </Dialog>

        {/* Search Invoices Modal */}
        <Dialog open={searchInvoiceOpen} onClose={() => setSearchInvoiceOpen(false)} maxWidth="md" fullWidth>
          <DialogTitle sx={{ backgroundColor: '#1976d2', color: 'white', fontWeight: 'bold' }}>
            Search Invoices
          </DialogTitle>
          <DialogContent sx={{ pt: 2 }}>
            <TextField
              fullWidth
              placeholder="Search by invoice number or customer..."
              value={invoiceSearchQuery}
              onChange={(e) => setInvoiceSearchQuery(e.target.value)}
              sx={{ mb: 2 }}
            />
            {loading ? (
              <Typography>Loading invoices...</Typography>
            ) : searchResults.length > 0 ? (
              <TableContainer sx={{ maxHeight: 400 }}>
                <Table stickyHeader>
                  <TableHead>
                    <TableRow>
                      <TableCell>Invoice #</TableCell>
                      <TableCell>Customer</TableCell>
                      <TableCell>Date</TableCell>
                      <TableCell align="right">Total</TableCell>
                      <TableCell>Status</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {searchResults
                      .filter(inv => 
                        !invoiceSearchQuery || 
                        inv.invoice_number?.toLowerCase().includes(invoiceSearchQuery.toLowerCase()) ||
                        inv.customer_name?.toLowerCase().includes(invoiceSearchQuery.toLowerCase())
                      )
                      .map((invoice) => (
                        <TableRow 
                          key={invoice.id} 
                          hover
                          onClick={() => handleInvoiceSelect(invoice)}
                          sx={{ 
                            cursor: 'pointer',
                            '&:hover': { 
                              backgroundColor: '#f5f5f5',
                              transform: 'scale(1.01)',
                              transition: 'all 0.2s ease'
                            }
                          }}
                        >
                          <TableCell>{invoice.invoice_number}</TableCell>
                          <TableCell>{invoice.customer_name}</TableCell>
                          <TableCell>{new Date(invoice.created_at).toLocaleDateString()}</TableCell>
                          <TableCell align="right">{Number(invoice.total_amount || 0).toFixed(2)}</TableCell>
                          <TableCell>
                            <Typography 
                              sx={{ 
                                color: invoice.status === 'paid' ? 'green' : invoice.status === 'pending' ? 'orange' : 'red',
                                fontWeight: 'bold'
                              }}
                            >
                              {invoice.status?.toUpperCase()}
                            </Typography>
                          </TableCell>
                        </TableRow>
                      ))}
                  </TableBody>
                </Table>
              </TableContainer>
            ) : (
              <Typography color="textSecondary">No invoices found</Typography>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setSearchInvoiceOpen(false)}>Close</Button>
          </DialogActions>
        </Dialog>

        {/* Retrieve Draft Modal */}
        <Dialog open={retrieveOpen} onClose={() => setRetrieveOpen(false)} maxWidth="sm" fullWidth>
          <DialogTitle sx={{ backgroundColor: '#1976d2', color: 'white', fontWeight: 'bold' }}>
            📋 Retrieve Draft Invoices
          </DialogTitle>
          <DialogContent sx={{ pt: 2 }}>
            {drafts.length === 0 ? (
              <Typography color="textSecondary">No draft invoices found</Typography>
            ) : (
              <List>
                {drafts.map((draft) => (
                  <React.Fragment key={draft.id}>
                    <ListItem disablePadding>
                      <ListItemButton onClick={() => retrieveDraft(draft)} sx={{ pr: 1 }}>
                        <ListItemText
                          primary={`Draft - ${new Date(draft.created_at).toLocaleString()}`}
                          secondary={`Total: KES ${Number(draft.total_amount || draft.total || 0).toFixed(2)} - Items: ${draft.line_count || 0}`}
                        />
                      </ListItemButton>
                    </ListItem>
                    <Divider />
                  </React.Fragment>
                ))}
              </List>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setRetrieveOpen(false)}>Close</Button>
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
              <Select value={selectedAccount} onChange={(e) => setSelectedAccount(e.target.value)} label="Financial Account">
                {accounts.map((account) => (
                  <MenuItem key={account.id} value={account.id}>
                    {account.account_name} ({account.account_type}) - Balance: {Number(account.current_balance || account.balance || 0).toFixed(2)}
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
                        sx={{ 
                          cursor: 'pointer',
                          '&:hover': { 
                            backgroundColor: '#f5f5f5'
                          }
                        }}
                      >
                        <TableCell sx={{ fontWeight: 'bold' }}>{confirmation.trans_id}</TableCell>
                        <TableCell sx={{ fontWeight: 'bold', color: '#00A859' }}>
                          {Number(confirmation.trans_amount || 0).toFixed(2)}
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
                No pending M-Pesa confirmations found
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

                <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: 2, justifyContent: 'flex-end' }}>
                  <Button
                    variant="outlined"
                    onClick={() => {
                      setManualMpesaCode('');
                      setCodeSearchResult(null);
                    }}
                    fullWidth={false}
                    sx={{ width: { xs: '100%', sm: 'auto' } }}
                  >
                    Clear
                  </Button>
                  <Button
                    variant="contained"
                    onClick={handleSearchMpesaCode}
                    disabled={!manualMpesaCode.trim() || searchingCode}
                    sx={{ 
                      backgroundColor: '#00A859', 
                      '&:hover': { backgroundColor: '#008547' },
                      width: { xs: '100%', sm: 'auto' }
                    }}
                  >
                    {searchingCode ? 'Searching...' : 'Search'}
                  </Button>
                  {codeSearchResult && !codeSearchResult.found && (
                    <Button
                      variant="contained"
                      onClick={handleSaveManualMpesaCode}
                      disabled={loading}
                      sx={{ 
                        backgroundColor: '#1976d2',
                        width: { xs: '100%', sm: 'auto' }
                      }}
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
      </Container>
    </Box>
  );
};

export default POSScreen;
