import React, { useEffect, useMemo, useState } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  Typography,
  TextField,
  IconButton,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Tabs,
  Tab,
  Chip,
  Checkbox,
  FormControlLabel,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Divider,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
} from '@mui/material';
import {
  TableRestaurant as TableIcon,
  Add as AddIcon,
  Send as SendIcon,
  ReceiptLong as ReceiptIcon,
  ArrowBack as BackIcon,
  Delete as DeleteIcon,
  Search as SearchIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { ApiService } from '../../services/api';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { saveAs } from 'file-saver';

interface RestaurantSpace {
  id: number;
  title: string;
  code?: string;
}

interface RestaurantTable {
  id: number;
  space_id: number;
  table_no: string;
  size: number;
  shape: string;
  label?: string;
}

interface AvailableItem {
  id: number;
  item_name: string;
  code?: string;
  selling_price?: number;
  description?: string;
  uom?: string;
}

interface OrderItem {
  item_id: number;
  name: string;
  quantity: number;
  unit_price: number;
  description?: string;
  code?: string;
  uom?: string;
}

interface CounterOrderSummary {
  id: number;
  table_id: number;
  table_no: string;
  label?: string;
  space_title?: string;
  total_amount: number;
  item_count: number;
  status: string;
}

const RestaurantScreen: React.FC = () => {
  const navigate = useNavigate();

  const [tab, setTab] = useState<'tables' | 'counter'>('tables');
  const [spaces, setSpaces] = useState<RestaurantSpace[]>([]);
  const [tables, setTables] = useState<RestaurantTable[]>([]);
  const [selectedSpaceId, setSelectedSpaceId] = useState<number | null>(null);
  const [selectedTable, setSelectedTable] = useState<RestaurantTable | null>(null);
  const [items, setItems] = useState<AvailableItem[]>([]);
  const [itemSearch, setItemSearch] = useState('');
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const [currentOrderId, setCurrentOrderId] = useState<number | undefined>(undefined);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [counterOrders, setCounterOrders] = useState<CounterOrderSummary[]>([]);
  const [manageSpaceOpen, setManageSpaceOpen] = useState(false);
  const [newSpaceTitle, setNewSpaceTitle] = useState('');
  const [newSpaceCode, setNewSpaceCode] = useState('');
  // Billing dialog state
  const [billingOpen, setBillingOpen] = useState(false);
  const [billingOrder, setBillingOrder] = useState<CounterOrderSummary | null>(null);
  const [billingLines, setBillingLines] = useState<OrderItem[]>([]);
  const [billingItemSearch, setBillingItemSearch] = useState('');
  const [billingIncludeVAT, setBillingIncludeVAT] = useState(true);
  const [billingDiscountType, setBillingDiscountType] = useState<'percentage' | 'fixed'>('percentage');
  const [billingDiscountPercentage, setBillingDiscountPercentage] = useState<number>(0);
  const [billingDiscount, setBillingDiscount] = useState<number>(0);
  const [billingAmountPaid, setBillingAmountPaid] = useState<number>(0);
  const [billingPaymentTerms, setBillingPaymentTerms] = useState<string>('Cash');
  const [billingPaymentMethod, setBillingPaymentMethod] = useState<string>('');
  const [billingMpesaCode, setBillingMpesaCode] = useState<string>('');
  const [financialAccounts, setFinancialAccounts] = useState<any[]>([]);
  const [mpesaConfirmations, setMpesaConfirmations] = useState<any[]>([]);
  const [mpesaModalOpen, setMpesaModalOpen] = useState(false);
  const [mpesaTabValue, setMpesaTabValue] = useState(0);
  const [manualMpesaCode, setManualMpesaCode] = useState('');
  const [searchingCode, setSearchingCode] = useState(false);
  const [codeSearchResult, setCodeSearchResult] = useState<{
    found: boolean;
    confirmation: any;
  } | null>(null);
  const [mpesaMessage, setMpesaMessage] = useState('');
  const [billingLookupOpen, setBillingLookupOpen] = useState(false);
  const [billingLookupSearch, setBillingLookupSearch] = useState('');
  const [billingCategoryFilter, setBillingCategoryFilter] = useState<string>('all');
  const [categories, setCategories] = useState<any[]>([]);
  const [businessCategoryNames, setBusinessCategoryNames] = useState({
    category_name: 'Category',
    category_1_name: 'Category 1',
    category_2_name: 'Category 2'
  });

  const fetchSpacesAndTables = async () => {
    try {
      setLoading(true);
      const response = await ApiService.get('/restaurant/spaces-and-tables');
      const data = response.data || response;
      setSpaces(data.spaces || []);
      setTables(data.tables || []);
      setCounterOrders(data.openOrders || []);
      if (!selectedSpaceId && (data.spaces || []).length > 0) {
        setSelectedSpaceId(data.spaces[0].id);
      }
    } catch (err: any) {
      console.error('Failed to load restaurant spaces/tables', err);
      setError(err.response?.data?.message || 'Failed to load restaurant data');
    } finally {
      setLoading(false);
    }
  };

  const fetchItems = async () => {
    try {
      const response = await ApiService.getItems();
      setItems(response.data?.items || response.items || []);
    } catch (err: any) {
      console.error('Failed to load items', err);
      setError(err.response?.data?.message || 'Failed to load items');
    }
  };

  const fetchCounterOrders = async () => {
    try {
      const response = await ApiService.get('/restaurant/orders');
      const data = response.data || response;
      setCounterOrders(data.orders || []);
    } catch (err: any) {
      console.error('Failed to load counter orders', err);
      setError(err.response?.data?.message || 'Failed to load counter orders');
    }
  };

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

  useEffect(() => {
    fetchSpacesAndTables();
    fetchItems();
    fetchCategories();
    fetchBusinessCategoryNames();
    // Load financial accounts for billing payment methods
    const fetchAccounts = async () => {
      try {
        const response = await ApiService.getFinancialAccounts();
        const accounts = response.data?.accounts || response.accounts || [];
        setFinancialAccounts(accounts);
      } catch (err: any) {
        console.error('Failed to load financial accounts', err);
      }
    };
    fetchAccounts();
  }, []);

  const filteredItems = useMemo(() => {
    const q = itemSearch.toLowerCase();
    return items.filter(
      (i) =>
        i.item_name.toLowerCase().includes(q) ||
        (i.code || '').toLowerCase().includes(q),
    );
  }, [items, itemSearch]);

  const billingFilteredItems = useMemo(() => {
    const q = billingItemSearch.toLowerCase();
    if (!q) return [];
    return items.filter(
      (i) =>
        i.item_name.toLowerCase().includes(q) ||
        (i.code || '').toLowerCase().includes(q),
    );
  }, [items, billingItemSearch]);

  const billingLookupFilteredItems = useMemo(() => {
    if (!billingLookupSearch.trim() && billingCategoryFilter === 'all') {
      return items;
    }

    const filtered = items.filter((item: any) => {
      const matchesSearch = !billingLookupSearch.trim() || 
        item.item_name?.toLowerCase().includes(billingLookupSearch.toLowerCase()) ||
        item.code?.toLowerCase().includes(billingLookupSearch.toLowerCase()) ||
        item.description?.toLowerCase().includes(billingLookupSearch.toLowerCase()) ||
        (item as any).category_name?.toLowerCase().includes(billingLookupSearch.toLowerCase()) ||
        (item as any).category_1_name?.toLowerCase().includes(billingLookupSearch.toLowerCase()) ||
        (item as any).category_2_name?.toLowerCase().includes(billingLookupSearch.toLowerCase());
      
      const matchesCategory = billingCategoryFilter === 'all' ||
        (item as any).category_id === parseInt(billingCategoryFilter) ||
        (item as any).category_1_id === parseInt(billingCategoryFilter) ||
        (item as any).category_2_id === parseInt(billingCategoryFilter);
      
      return matchesSearch && matchesCategory;
    });
    return filtered;
  }, [items, billingLookupSearch, billingCategoryFilter]);

  const handleAddItemToBilling = (item: AvailableItem) => {
    setBillingLines((prev) => {
      const existing = prev.find((p) => p.item_id === item.id);
      if (existing) {
        return prev.map((p) =>
          p.item_id === item.id ? { ...p, quantity: p.quantity + 1 } : p,
        );
      }
      return [
        ...prev,
        {
          item_id: item.id,
          name: item.item_name,
          quantity: 1,
          unit_price: item.selling_price || 0,
          description: item.description || item.item_name,
          code: item.code,
          uom: item.uom || 'PCS',
        },
      ];
    });
    setBillingLookupSearch('');
  };

  const handleAddItemToOrder = (item: AvailableItem) => {
    setOrderItems((prev) => {
      const existing = prev.find((p) => p.item_id === item.id);
      if (existing) {
        return prev.map((p) =>
          p.item_id === item.id ? { ...p, quantity: p.quantity + 1 } : p,
        );
      }
      return [
        ...prev,
        {
          item_id: item.id,
          name: item.item_name,
          quantity: 1,
          unit_price: item.selling_price || 0,
          description: item.description || item.item_name,
          code: item.code,
          uom: item.uom || 'PCS',
        },
      ];
    });
  };

  const handleQuantityChange = (item_id: number, quantity: number) => {
    const q = quantity <= 0 ? 0 : quantity;
    setOrderItems((prev) =>
      prev
        .map((p) => (p.item_id === item_id ? { ...p, quantity: q } : p))
        .filter((p) => p.quantity > 0),
    );
  };

  const handleRemoveItem = (item_id: number) => {
    setOrderItems((prev) => prev.filter((p) => p.item_id !== item_id));
  };

  const orderTotal = useMemo(
    () =>
      orderItems.reduce(
        (sum, item) => sum + item.quantity * item.unit_price,
        0,
      ),
    [orderItems],
  );

  const billingTotals = useMemo(() => {
    const subtotal = billingLines.reduce(
      (sum, line) => sum + line.quantity * line.unit_price,
      0,
    );
    const vatAmount = billingIncludeVAT ? subtotal * 0.16 : 0;
    const totalBeforeDiscount = subtotal + vatAmount;

    let discountAmount = 0;
    if (billingDiscountType === 'percentage') {
      discountAmount = (totalBeforeDiscount * billingDiscountPercentage) / 100;
    } else {
      discountAmount = Number(billingDiscount) || 0;
    }

    const totalBeforeRounding = Math.max(0, totalBeforeDiscount - discountAmount);
    const totalAmount = Math.round(totalBeforeRounding);

    return {
      subtotal,
      vatAmount,
      discountAmount,
      totalAmount,
    };
  }, [billingLines, billingIncludeVAT, billingDiscountType, billingDiscountPercentage, billingDiscount]);

  // ===== M-Pesa helpers (mirroring POSScreen) =====
  const fetchMpesaConfirmations = async () => {
    try {
      setLoading(true);
      const response = await ApiService.getPendingMpesaConfirmations();
      const confirmations = response.data?.confirmations || [];
      setMpesaConfirmations(confirmations);
    } catch (error: any) {
      console.error('Failed to fetch M-Pesa confirmations:', error);
      setError('Failed to load M-Pesa confirmations');
    } finally {
      setLoading(false);
    }
  };

  const handleMpesaConfirmationSelect = async (confirmation: any) => {
    try {
      setBillingMpesaCode(confirmation.trans_id);
      setBillingAmountPaid(parseFloat(confirmation.trans_amount) || 0);
      setMpesaModalOpen(false);
    } catch (error) {
      console.error('Error selecting M-Pesa confirmation:', error);
    }
  };

  const parseMpesaMessage = (message: string) => {
    try {
      let codeMatch = message.match(/([A-Z0-9]{8,12})\s+Confirmed/i);
      if (!codeMatch) {
        codeMatch = message.match(/([A-Z0-9]{8,12})Confirmed/i);
      }
      const extractedCode = codeMatch ? codeMatch[1].trim() : null;

      let amountMatch = message.match(/(?:Ksh|KES)\s*([\d,]+\.?\d*)/i);
      if (!amountMatch) {
        amountMatch = message.match(/received\s+(?:Ksh|KES)\s*([\d,]+\.?\d*)/i);
      }
      if (!amountMatch) {
        amountMatch = message.match(/(?:Ksh|KES)([\d,]+\.?\d*)/i);
      }

      let extractedAmount = 0;
      if (amountMatch) {
        const amountStr = amountMatch[1].replace(/,/g, '');
        extractedAmount = parseFloat(amountStr) || 0;
        extractedAmount = Math.round(extractedAmount);
      }

      return { code: extractedCode, amount: extractedAmount };
    } catch (err) {
      console.error('Error parsing M-Pesa message:', err);
      return { code: null, amount: 0 };
    }
  };

  const handleSearchMpesaCode = async () => {
    if (!manualMpesaCode.trim()) {
      setError('Please enter a transaction code');
      return;
    }

    try {
      setSearchingCode(true);
      setError(null);
      const response = await ApiService.searchMpesaConfirmationByCode(
        manualMpesaCode.trim(),
      );

      if (response.success && response.data.found) {
        const confirmation = response.data.confirmation;
        setCodeSearchResult({ found: true, confirmation });
        setBillingMpesaCode(confirmation.trans_id);
        setBillingAmountPaid(parseFloat(confirmation.trans_amount) || 0);
        setSuccess('M-Pesa confirmation found and amount populated!');
        setTimeout(() => setSuccess(null), 3000);
      } else {
        setCodeSearchResult({ found: false, confirmation: null });
        const shouldSave = window.confirm(
          `M-Pesa confirmation with code "${manualMpesaCode.trim()}" not found. Do you want to save this code for future reference?`,
        );
        if (shouldSave) {
          await handleSaveManualMpesaCode();
        }
      }
    } catch (err: any) {
      console.error('Error searching M-Pesa code:', err);
      setError(
        err.response?.data?.message || 'Failed to search M-Pesa confirmation',
      );
    } finally {
      setSearchingCode(false);
    }
  };

  const handleSaveManualMpesaCode = async () => {
    if (!manualMpesaCode.trim()) {
      setError('Please enter a transaction code');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const response = await ApiService.saveManualMpesaConfirmation({
        trans_id: manualMpesaCode.trim(),
        trans_amount: billingAmountPaid || 0,
      });
      if (response.success) {
        setBillingMpesaCode(manualMpesaCode.trim());
        setSuccess('M-Pesa confirmation code saved successfully!');
        setMpesaModalOpen(false);
        setMpesaTabValue(0);
        setManualMpesaCode('');
        setCodeSearchResult(null);
        setTimeout(() => setSuccess(null), 3000);
      } else {
        throw new Error(response.message || 'Failed to save confirmation code');
      }
    } catch (err: any) {
      console.error('Error saving manual M-Pesa code:', err);
      setError(
        err.response?.data?.message ||
          'Failed to save M-Pesa confirmation code',
      );
    } finally {
      setLoading(false);
    }
  };

  const handleSendOrder = async () => {
    if (!selectedTable) {
      setError('Please select a table first');
      return;
    }
    if (orderItems.length === 0) {
      setError('Please add at least one item');
      return;
    }
    try {
      setLoading(true);
      setError(null);
      const payload = {
        order_id: currentOrderId,
        table_id: selectedTable.id,
        items: orderItems.map((i) => ({
          item_id: i.item_id,
          quantity: i.quantity,
          unit_price: i.unit_price,
          description: i.description,
          code: i.code,
          uom: i.uom,
        })),
      };
      const response = await ApiService.post('/restaurant/orders/save', payload);
      const data = response.data || response;
      setCurrentOrderId(data.data?.id || data.id);
      setSuccess('Order sent to counter');
      setTimeout(() => setSuccess(null), 2500);
      await fetchCounterOrders();
      await fetchSpacesAndTables();
    } catch (err: any) {
      console.error('Failed to send order', err);
      setError(err.response?.data?.message || 'Failed to send order');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenCounterOrder = async (order: CounterOrderSummary) => {
    try {
      setLoading(true);
      setError(null);
      const response = await ApiService.get(`/restaurant/orders/${order.id}`);
      const data = response.data || response;
      const ord = data.order;
      const itemsData = data.items || [];
      const table = tables.find((t) => t.id === ord.table_id) || null;
      setSelectedTable(table);
      setSelectedSpaceId(table?.space_id || null);
      setCurrentOrderId(ord.id);
      setOrderItems(
        itemsData.map((line: any) => ({
          item_id: line.item_id,
          name: line.item_name || line.description || 'Item',
          quantity: parseFloat(String(line.quantity)) || 0,
          unit_price: parseFloat(String(line.unit_price)) || 0,
          description: line.description || line.item_name || 'Item',
          code: line.code,
          uom: line.uom || 'PCS',
        })),
      );
      setTab('tables');
    } catch (err: any) {
      console.error('Failed to load order details', err);
      setError(err.response?.data?.message || 'Failed to load order');
    } finally {
      setLoading(false);
    }
  };

  // Print receipt similar to POSScreen.printReceipt but using billingLines
  const printRestaurantReceipt = async (invoice?: any) => {
    if (billingLines.length === 0) {
      setError('No items to print');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const { subtotal, vatAmount, discountAmount, totalAmount } = billingTotals;

      let businessSettings: any = {};
      try {
        const response = await ApiService.getBusinessSettings();
        if (response.success && response.data) {
          businessSettings = response.data;
        }
      } catch (err) {
        console.error('Error fetching business settings:', err);
        const saved = localStorage.getItem('businessSettings');
        if (saved) {
          businessSettings = JSON.parse(saved);
        }
      }

      const user = JSON.parse(localStorage.getItem('user') || '{}');
      const fullAddress =
        [businessSettings.street, businessSettings.city]
          .filter(Boolean)
          .join(', ') || 'Business Address';

      const tempDiv = document.createElement('div');
      tempDiv.style.position = 'fixed';
      tempDiv.style.left = '0';
      tempDiv.style.top = '0';
      tempDiv.style.width = '80mm';
      tempDiv.style.padding = '10px';
      tempDiv.style.margin = '0';
      tempDiv.style.fontFamily = "'Courier New', monospace";
      tempDiv.style.fontSize = '12px';
      tempDiv.style.backgroundColor = '#ffffff';
      tempDiv.style.color = '#000000';
      tempDiv.style.zIndex = '-9999';
      tempDiv.style.pointerEvents = 'none';
      tempDiv.style.overflow = 'visible';
      tempDiv.style.boxSizing = 'border-box';

      const amountPaid = billingAmountPaid;
      const total = totalAmount;

      tempDiv.innerHTML = `
        <div style="text-align: center; border-bottom: 2px dashed #000; padding-bottom: 10px; margin-top: 0; margin-bottom: 10px; width: 100%; box-sizing: border-box;">
          <h2 style="margin: 0; margin-bottom: 5px; font-size: 18px; text-align: center;">${businessSettings.businessName || 'Invoice App'}</h2>
          <p style="margin: 0; margin-bottom: 3px; font-size: 11px; text-align: center;">${fullAddress}</p>
          <p style="margin: 0; margin-bottom: 3px; font-size: 11px; text-align: center;">Phone: ${businessSettings.telephone || 'N/A'}</p>
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
          ${
            invoice?.invoice_number
              ? `<div style="display:flex;justify-content:space-between;"><span>Invoice #:</span><span>${invoice.invoice_number}</span></div>`
              : ''
          }
        </div>
        <table style="width: 100%; margin: 10px 0; border-collapse: collapse;">
          <thead>
            <tr>
              <th style="border-bottom: 1px solid #000; padding: 5px 2px; text-align: left; font-size: 11px;">Item</th>
              <th style="border-bottom: 1px solid #000; padding: 5px 2px; text-align: center; font-size: 11px;">Qty</th>
              <th style="border-bottom: 1px solid #000; padding: 5px 2px; text-align: right; font-size: 11px;">Price</th>
              <th style="border-bottom: 1px solid #000; padding: 5px 2px; text-align: right; font-size: 11px;">Total</th>
            </tr>
          </thead>
          <tbody>
            ${billingLines
              .map((line) => {
                const formattedQty =
                  line.quantity % 1 === 0
                    ? line.quantity.toString()
                    : line.quantity.toFixed(2).replace(/\.?0+$/, '');
                return `
                  <tr style="border-bottom: 1px dashed #ccc;">
                    <td style="padding: 5px 2px; font-size: 11px;">${line.description || line.name}</td>
                    <td style="padding: 5px 2px; font-size: 11px; text-align: center;">${formattedQty}</td>
                    <td style="padding: 5px 2px; font-size: 11px; text-align: right;">${Number(
                      line.unit_price,
                    ).toFixed(2)}</td>
                    <td style="padding: 5px 2px; font-size: 11px; text-align: right;">${(
                      line.quantity * line.unit_price
                    ).toFixed(2)}</td>
                  </tr>`;
              })
              .join('')}
          </tbody>
        </table>
        <div style="margin-top: 10px; padding-top: 10px; border-top: 2px dashed #000;">
          <div style="display: flex; justify-content: space-between; padding: 3px 0; font-size: 12px;">
            <span>Subtotal:</span>
            <span>${subtotal.toFixed(2)}</span>
          </div>
          ${
            vatAmount > 0
              ? `<div style="display: flex; justify-content: space-between; padding: 3px 0; font-size: 12px;">
                   <span>VAT (16%):</span>
                   <span>${vatAmount.toFixed(2)}</span>
                 </div>`
              : ''
          }
          ${
            discountAmount > 0
              ? `<div style="display: flex; justify-content: space-between; padding: 3px 0; font-size: 12px; color: #d32f2f;">
                   <span>Discount:</span>
                   <span>-${discountAmount.toFixed(2)}</span>
                 </div>`
              : ''
          }
          <div style="display: flex; justify-content: space-between; padding: 3px 0; font-size: 14px; font-weight: bold; border-top: 1px solid #000; margin-top: 5px; padding-top: 5px;">
            <span>TOTAL:</span>
            <span>${total.toFixed(2)}</span>
          </div>
          <div style="display: flex; justify-content: space-between; padding: 3px 0; font-size: 12px; margin-top: 8px;">
            <span>Amount Received:</span>
            <span>${amountPaid.toFixed(2)}</span>
          </div>
          ${
            amountPaid < total
              ? `<div style="display: flex; justify-content: space-between; padding: 3px 0; font-size: 12px; color: #d32f2f;">
                   <span>Amount Due:</span>
                   <span>${(total - amountPaid).toFixed(2)}</span>
                 </div>`
              : amountPaid > total
              ? `<div style="display: flex; justify-content: space_between; padding: 3px 0; font-size: 12px; color: #4caf50;">
                   <span>Change Due:</span>
                   <span>${(amountPaid - total).toFixed(2)}</span>
                 </div>`
              : ''
          }
        </div>
        <div style="text-align: center; margin-top: 15px; padding-top: 10px; border-top: 2px dashed #000; font-size: 11px;">
          <p>Thank you for your business!</p>
          <p>Powered by ${businessSettings.businessName || 'Invoice App'}</p>
        </div>
      `;

      document.body.appendChild(tempDiv);
      await new Promise((resolve) => setTimeout(resolve, 100));

      const canvas = await html2canvas(tempDiv as HTMLDivElement, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        width: tempDiv.offsetWidth,
        height: tempDiv.scrollHeight,
      });
      document.body.removeChild(tempDiv);

      const imgData = canvas.toDataURL('image/png');
      const pdfWidth = 80;
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      const pdf = new jsPDF('p', 'mm', [pdfWidth, pdfHeight]);
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      const fileName = `Restaurant_Receipt_${new Date()
        .toISOString()
        .split('T')[0]}_${Date.now()}.pdf`;
      saveAs(pdf.output('blob'), fileName);
    } catch (err: any) {
      console.error('Error generating restaurant receipt:', err);
      setError('Failed to generate receipt: ' + (err.message || 'Unknown error'));
    } finally {
      setLoading(false);
    }
  };
  const handleCreateSpace = async () => {
    if (!newSpaceTitle.trim()) {
      setError('Space title is required');
      return;
    }
    try {
      setLoading(true);
      const response = await ApiService.post('/restaurant/spaces', {
        title: newSpaceTitle.trim(),
        code: newSpaceCode.trim() || undefined,
      });
      const data = response.data || response;
      setSpaces((prev) => [...prev, data.data || data]);
      setSelectedSpaceId(data.data?.id || data.id);
      setNewSpaceTitle('');
      setNewSpaceCode('');
      setManageSpaceOpen(false);
    } catch (err: any) {
      console.error('Failed to create space', err);
      setError(err.response?.data?.message || 'Failed to create space');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTable = async () => {
    if (!selectedSpaceId) {
      setError('Select a space first');
      return;
    }
    const nextNumber = tables.filter((t) => t.space_id === selectedSpaceId).length + 1;
    try {
      setLoading(true);
      const response = await ApiService.post('/restaurant/tables', {
        space_id: selectedSpaceId,
        table_no: `T-${String(nextNumber).padStart(2, '0')}`,
        size: 4,
        shape: 'rectangle',
      });
      const data = response.data || response;
      setTables((prev) => [...prev, data.data || data]);
    } catch (err: any) {
      console.error('Failed to create table', err);
      setError(err.response?.data?.message || 'Failed to create table');
    } finally {
      setLoading(false);
    }
  };

  const visibleTables = useMemo(
    () =>
      tables.filter((t) =>
        selectedSpaceId ? t.space_id === selectedSpaceId : true,
      ),
    [tables, selectedSpaceId],
  );

  const openBillingForOrder = async (order: CounterOrderSummary) => {
    try {
      setLoading(true);
      setError(null);
      const response = await ApiService.getRestaurantOrderDetails(order.id);
      const data = response.data || response;
      const itemsData = data.items || [];
      setBillingOrder(order);
      setBillingLines(
        itemsData.map((line: any) => ({
          item_id: line.item_id,
          name: line.item_name || line.description || 'Item',
          quantity: parseFloat(String(line.quantity)) || 0,
          unit_price: parseFloat(String(line.unit_price)) || 0,
          description: line.description || line.item_name || 'Item',
          code: line.code,
          uom: line.uom || 'PCS',
        })),
      );
      setBillingIncludeVAT(true);
      setBillingDiscountType('percentage');
      setBillingDiscountPercentage(0);
      setBillingDiscount(0);
      setBillingAmountPaid(0);
      setBillingPaymentTerms('Cash');
      setBillingPaymentMethod('');
      setBillingMpesaCode('');
      setBillingOpen(true);
    } catch (err: any) {
      console.error('Failed to load order for billing', err);
      setError(err.response?.data?.message || 'Failed to load order details');
    } finally {
      setLoading(false);
    }
  };

  const handleBillNow = async () => {
    if (!billingOrder) return;
    if (billingLines.length === 0) {
      setError('Please add at least one item before billing');
      return;
    }
    const totals = billingTotals;
    try {
      setLoading(true);
      setError(null);
      const payload = {
        lines: billingLines.map((line) => ({
          item_id: line.item_id,
          quantity: line.quantity,
          unit_price: line.unit_price,
          description: line.description,
          code: line.code,
          uom: line.uom,
        })),
        amountPaid: billingAmountPaid,
        paymentMethod: billingPaymentMethod || null,
        payment_terms: billingPaymentTerms,
        mpesa_code: billingPaymentTerms === 'M-Pesa' ? billingMpesaCode : undefined,
        vat_amount: totals.vatAmount,
        discount_amount: totals.discountAmount,
        // keep any additional fields aligned with backend billOrder
      };
      const response = await ApiService.billRestaurantOrder(billingOrder.id, payload);
      const data = response.data || response;
      const invoice = data.data?.invoice || data.invoice;

      // Link M-Pesa confirmation to the created invoice if applicable
      if (billingPaymentTerms === 'M-Pesa' && billingMpesaCode && invoice?.id) {
        try {
          const confirmationsResponse = await ApiService.getAllMpesaConfirmations({
            linked: false,
          });
          const confirmations = confirmationsResponse.data?.confirmations || [];
          const matching = confirmations.find(
            (c: any) => c.trans_id === billingMpesaCode,
          );
          if (matching) {
            await ApiService.linkMpesaConfirmation(matching.id, invoice.id);
          }
        } catch (linkErr) {
          console.error('Failed to link M-Pesa confirmation:', linkErr);
        }
      }

      // Print POS-style receipt instead of navigating to invoice preview
      await printRestaurantReceipt(invoice);

      setSuccess('Order billed and receipt generated!');
      setBillingOpen(false);
      await fetchCounterOrders();
      await fetchSpacesAndTables();
      setTab('counter');
    } catch (err: any) {
      console.error('Failed to bill order', err);
      setError(err.response?.data?.message || 'Failed to bill order');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ width: '100vw', minHeight: '100vh', bgcolor: '#f5f5f5' }}>
      <Box
        sx={{
          maxWidth: 1200,
          mx: 'auto',
          px: { xs: 1.5, sm: 2, md: 3 },
          py: { xs: 1.5, sm: 2, md: 3 },
          display: 'flex',
          flexDirection: 'column',
          gap: 2,
        }}
      >
        {/* Header */}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 1.5,
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <IconButton onClick={() => navigate(-1)}>
              <BackIcon />
            </IconButton>
            <Typography variant="h5" sx={{ fontWeight: 600 }}>
              Bar / Restaurant
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button
              variant="outlined"
              size="small"
              onClick={() => setManageSpaceOpen(true)}
            >
              Manage Spaces
            </Button>
            <Button
              variant="contained"
              size="small"
              onClick={handleCreateTable}
              startIcon={<AddIcon />}
            >
              Add Table
            </Button>
          </Box>
        </Box>

        {/* Tabs */}
        <Box sx={{ bgcolor: '#fff', borderRadius: 1 }}>
          <Tabs
            value={tab}
            onChange={(_, value) => setTab(value)}
            variant="fullWidth"
          >
            <Tab label="Tables / Orders" value="tables" />
            <Tab label="Counter" value="counter" />
          </Tabs>
        </Box>

        {success && (
          <Alert severity="success" onClose={() => setSuccess(null)}>
            {success}
          </Alert>
        )}
        {error && (
          <Alert severity="error" onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        {tab === 'tables' && (
          <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 2 }}>
            {/* Left: Space & Tables */}
            <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 1.5 }}>
              <Card>
                <CardContent>
                  <Typography variant="subtitle1" sx={{ mb: 1, fontWeight: 600 }}>
                    Spaces
                  </Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                    {spaces.map((space) => (
                      <Chip
                        key={space.id}
                        label={space.title}
                        color={space.id === selectedSpaceId ? 'primary' : 'default'}
                        onClick={() => setSelectedSpaceId(space.id)}
                      />
                    ))}
                    {spaces.length === 0 && (
                      <Typography variant="body2" color="text.secondary">
                        No spaces yet. Use &quot;Manage Spaces&quot; to add one.
                      </Typography>
                    )}
                  </Box>
                </CardContent>
              </Card>

              <Card sx={{ flex: 1 }}>
                <CardContent>
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      mb: 1.5,
                    }}
                  >
                    <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                      Tables
                    </Typography>
                  </Box>
                  <Box
                    sx={{
                      display: 'flex',
                      flexWrap: 'wrap',
                      gap: 1.5,
                    }}
                  >
                    {visibleTables.map((table) => (
                      <Box
                        key={table.id}
                        sx={{
                          width: { xs: '48%', sm: '30%', md: '22%' },
                          minWidth: 120,
                          bgcolor:
                            selectedTable?.id === table.id ? '#e3f2fd' : '#f0f0f0',
                          borderRadius: 1,
                          p: 1.2,
                          display: 'flex',
                          flexDirection: 'column',
                          gap: 0.5,
                          cursor: 'pointer',
                        }}
                        onClick={() => {
                          setSelectedTable(table);
                          setCurrentOrderId(undefined);
                          setOrderItems([]);
                        }}
                      >
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          <TableIcon fontSize="small" />
                          <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                            {table.table_no}
                          </Typography>
                        </Box>
                        <Typography variant="caption" color="text.secondary">
                          Size: {table.size} • {table.shape}
                        </Typography>
                        {table.label && (
                          <Typography variant="caption" color="text.secondary">
                            {table.label}
                          </Typography>
                        )}
                      </Box>
                    ))}
                    {visibleTables.length === 0 && (
                      <Typography variant="body2" color="text.secondary">
                        No tables in this space. Click &quot;Add Table&quot; to create one.
                      </Typography>
                    )}
                  </Box>
                </CardContent>
              </Card>
            </Box>

            {/* Right: Current Order */}
            <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 1.5 }}>
              <Card>
                <CardContent>
                  <Typography variant="subtitle1" sx={{ mb: 1, fontWeight: 600 }}>
                    {selectedTable
                      ? `Current Order - ${selectedTable.table_no}`
                      : 'Select a table to start an order'}
                  </Typography>
                  {selectedTable && (
                    <>
                      <Box sx={{ mb: 1.5 }}>
                        <TextField
                          fullWidth
                          size="small"
                          placeholder="Search item by name or code..."
                          value={itemSearch}
                          onChange={(e) => setItemSearch(e.target.value)}
                        />
                        <Box
                          sx={{
                            mt: 1,
                            maxHeight: 160,
                            overflowY: 'auto',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: 0.5,
                          }}
                        >
                          {filteredItems.slice(0, 20).map((item) => (
                            <Box
                              key={item.id}
                              sx={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                p: 0.75,
                                borderRadius: 0.75,
                                bgcolor: '#fafafa',
                              }}
                            >
                              <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                                <Typography variant="body2">
                                  {item.item_name}
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                  {item.code || '-'}
                                </Typography>
                              </Box>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                  {Number(item.selling_price || 0).toFixed(2)}
                                </Typography>
                                <Button
                                  size="small"
                                  variant="contained"
                                  onClick={() => handleAddItemToOrder(item)}
                                >
                                  Add
                                </Button>
                              </Box>
                            </Box>
                          ))}
                        </Box>
                      </Box>

                      <Box
                        sx={{
                          maxHeight: 260,
                          overflowY: 'auto',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: 0.75,
                          mb: 1.5,
                        }}
                      >
                        {orderItems.map((line) => (
                          <Box
                            key={line.item_id}
                            sx={{
                              display: 'flex',
                              flexDirection: 'row',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              gap: 1,
                              p: 0.75,
                              borderRadius: 0.75,
                              bgcolor: '#fff',
                            }}
                          >
                            <Box sx={{ flex: 1 }}>
                              <Typography variant="body2">
                                {line.description || line.name}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                {line.code || '-'}
                              </Typography>
                            </Box>
                            <Box
                              sx={{
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'flex-end',
                                gap: 0.5,
                              }}
                            >
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                <TextField
                                  type="number"
                                  size="small"
                                  value={line.quantity}
                                  onChange={(e) =>
                                    handleQuantityChange(
                                      line.item_id,
                                      parseFloat(e.target.value) || 0,
                                    )
                                  }
                                  inputProps={{ min: 0, step: 0.25 }}
                                  sx={{ width: 70 }}
                                />
                                <Typography variant="caption" color="text.secondary">
                                  x {Number(line.unit_price).toFixed(2)}
                                </Typography>
                              </Box>
                              <Box
                                sx={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: 1,
                                }}
                              >
                                <Typography
                                  variant="body2"
                                  sx={{ fontWeight: 600, minWidth: 64, textAlign: 'right' }}
                                >
                                  {(line.quantity * line.unit_price).toFixed(2)}
                                </Typography>
                                <IconButton
                                  size="small"
                                  color="error"
                                  onClick={() => handleRemoveItem(line.item_id)}
                                >
                                  <DeleteIcon fontSize="small" />
                                </IconButton>
                              </Box>
                            </Box>
                          </Box>
                        ))}
                        {orderItems.length === 0 && (
                          <Typography variant="body2" color="text.secondary">
                            No items in this order yet.
                          </Typography>
                        )}
                      </Box>

                      <Box
                        sx={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          mb: 1.5,
                        }}
                      >
                        <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                          Total:
                        </Typography>
                        <Typography variant="h6" sx={{ fontWeight: 700, color: 'primary.main' }}>
                          {orderTotal.toFixed(2)}
                        </Typography>
                      </Box>

                      <Box
                        sx={{
                          display: 'flex',
                          flexDirection: { xs: 'column', sm: 'row' },
                          gap: 1,
                        }}
                      >
                        <Button
                          fullWidth
                          variant="contained"
                          color="primary"
                          startIcon={<SendIcon />}
                          disabled={loading}
                          onClick={handleSendOrder}
                        >
                          Send Order
                        </Button>
                        <Button
                          fullWidth
                          variant="outlined"
                          startIcon={<ReceiptIcon />}
                          onClick={() => setTab('counter')}
                        >
                          Go to Counter
                        </Button>
                      </Box>
                    </>
                  )}
                </CardContent>
              </Card>
            </Box>
          </Box>
        )}

        {tab === 'counter' && (
          <Card>
            <CardContent>
              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  mb: 1.5,
                }}
              >
                <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                  Counter Orders
                </Typography>
                <Button size="small" onClick={fetchCounterOrders}>
                  Refresh
                </Button>
              </Box>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.75 }}>
                {counterOrders.map((order) => (
                  <Box
                    key={order.id}
                    sx={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      p: 1,
                      borderRadius: 1,
                      bgcolor: '#fafafa',
                    }}
                  >
                    <Box
                      sx={{ display: 'flex', flexDirection: 'column', cursor: 'pointer' }}
                      onClick={() => handleOpenCounterOrder(order)}
                    >
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {order.table_no} • {order.space_title || 'Space'}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {order.item_count} items
                      </Typography>
                    </Box>
                    <Box
                      sx={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'flex-end',
                        gap: 0.5,
                      }}
                    >
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {Number(order.total_amount || 0).toFixed(2)}
                      </Typography>
                      <Box sx={{ display: 'flex', gap: 0.5 }}>
                        <Chip
                          size="small"
                          label={order.status.toUpperCase()}
                          color={order.status === 'sent' ? 'primary' : 'default'}
                        />
                        <Button
                          size="small"
                          variant="contained"
                          onClick={(e) => {
                            e.stopPropagation();
                            openBillingForOrder(order);
                          }}
                        >
                          Bill Now
                        </Button>
                      </Box>
                    </Box>
                  </Box>
                ))}
                {counterOrders.length === 0 && (
                  <Typography variant="body2" color="text.secondary">
                    No active orders at the counter.
                  </Typography>
                )}
              </Box>
            </CardContent>
          </Card>
        )}

        {/* Billing Dialog */}
        <Dialog
          open={billingOpen}
          onClose={() => setBillingOpen(false)}
          fullWidth
          maxWidth="md"
        >
          <DialogTitle>Bill Order {billingOrder ? `- ${billingOrder.table_no}` : ''}</DialogTitle>
          <DialogContent>
            <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 2, mt: 1 }}>
              {/* Items side */}
              <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                  Items
                </Typography>
                <Box sx={{ mb: 1, display: 'flex', justifyContent: 'flex-start' }}>
                  <Button
                    variant="contained"
                    size="small"
                    startIcon={<SearchIcon />}
                    onClick={() => setBillingLookupOpen(true)}
                  >
                    Lookup Item
                  </Button>
                </Box>
                {/* Items list */}
                <Box
                  sx={{
                    maxHeight: 260,
                    overflowY: 'auto',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 0.75,
                  }}
                >
                  {billingLines.map((line) => (
                    <Box
                      key={line.item_id}
                      sx={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        gap: 1,
                        p: 0.75,
                        borderRadius: 0.75,
                        bgcolor: '#fafafa',
                      }}
                    >
                      <Box sx={{ flex: 1 }}>
                        <Typography variant="body2">
                          {line.description || line.name}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {line.code || '-'}
                        </Typography>
                      </Box>
                      <Box
                        sx={{
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'flex-end',
                          gap: 0.5,
                        }}
                      >
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          <TextField
                            type="number"
                            size="small"
                            value={line.quantity}
                            onChange={(e) =>
                              setBillingLines((prev) =>
                                prev.map((p) =>
                                  p.item_id === line.item_id
                                    ? {
                                        ...p,
                                        quantity: parseFloat(e.target.value) || 0,
                                      }
                                    : p,
                                ),
                              )
                            }
                            inputProps={{ min: 0, step: 0.25 }}
                            sx={{ width: 70 }}
                          />
                          <Typography variant="caption" color="text.secondary">
                            x {Number(line.unit_price).toFixed(2)}
                          </Typography>
                        </Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Typography
                            variant="body2"
                            sx={{ fontWeight: 600, minWidth: 64, textAlign: 'right' }}
                          >
                            {(line.quantity * line.unit_price).toFixed(2)}
                          </Typography>
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() =>
                              setBillingLines((prev) =>
                                prev.filter((p) => p.item_id !== line.item_id),
                              )
                            }
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </Box>
                      </Box>
                    </Box>
                  ))}
                  {billingLines.length === 0 && (
                    <Typography variant="body2" color="text.secondary">
                      No items to bill.
                    </Typography>
                  )}
                </Box>
              </Box>

              {/* Summary & payment side */}
              <Box
                sx={{
                  flex: { xs: 1, md: 0.9 },
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 1.5,
                }}
              >
                <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                  Summary
                </Typography>
                <Box>
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={billingIncludeVAT}
                        onChange={(e) => setBillingIncludeVAT(e.target.checked)}
                      />
                    }
                    label="Include VAT (16%)"
                  />
                </Box>
                <Box>
                  <Box sx={{ display: 'flex', gap: 1, mb: 1 }}>
                    <Button
                      variant={billingDiscountType === 'percentage' ? 'contained' : 'outlined'}
                      size="small"
                      onClick={() => {
                        setBillingDiscountType('percentage');
                        setBillingDiscount(0);
                        setBillingDiscountPercentage(0);
                      }}
                      sx={{ flex: 1 }}
                    >
                      Percentage
                    </Button>
                    <Button
                      variant={billingDiscountType === 'fixed' ? 'contained' : 'outlined'}
                      size="small"
                      onClick={() => {
                        setBillingDiscountType('fixed');
                        setBillingDiscount(0);
                        setBillingDiscountPercentage(0);
                      }}
                      sx={{ flex: 1 }}
                    >
                      Fixed Amount
                    </Button>
                  </Box>
                  {billingDiscountType === 'percentage' ? (
                    <TextField
                      fullWidth
                      label="Discount Percentage (%)"
                      type="number"
                      size="small"
                      value={billingDiscountPercentage}
                      onChange={(e) =>
                        setBillingDiscountPercentage(
                          Math.max(0, Math.min(100, parseFloat(e.target.value) || 0)),
                        )
                      }
                    />
                  ) : (
                    <TextField
                      fullWidth
                      label="Discount Amount"
                      type="number"
                      size="small"
                      value={billingDiscount}
                      onChange={(e) =>
                        setBillingDiscount(Math.max(0, parseFloat(e.target.value) || 0))
                      }
                    />
                  )}
                </Box>

                <Box>
                  <Box
                    sx={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      mb: 0.5,
                    }}
                  >
                    <Typography variant="body2">Subtotal:</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      {billingTotals.subtotal.toFixed(2)}
                    </Typography>
                  </Box>
                  {billingIncludeVAT && (
                    <Box
                      sx={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        mb: 0.5,
                      }}
                    >
                      <Typography variant="body2">VAT (16%):</Typography>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {billingTotals.vatAmount.toFixed(2)}
                      </Typography>
                    </Box>
                  )}
                  {billingTotals.discountAmount > 0 && (
                    <Box
                      sx={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        mb: 0.5,
                      }}
                    >
                      <Typography
                        variant="body2"
                        sx={{ fontWeight: 600, color: 'error.main' }}
                      >
                        Discount:
                      </Typography>
                      <Typography
                        variant="body2"
                        sx={{ fontWeight: 600, color: 'error.main' }}
                      >
                        -{billingTotals.discountAmount.toFixed(2)}
                      </Typography>
                    </Box>
                  )}
                  <Divider sx={{ my: 1 }} />
                  <Box
                    sx={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      mb: 1,
                    }}
                  >
                    <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                      Total:
                    </Typography>
                    <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                      {billingTotals.totalAmount.toFixed(2)}
                    </Typography>
                  </Box>
                </Box>

                {/* Payment */}
                <Divider sx={{ my: 1 }} />
                <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                  Payment
                </Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                  <TextField
                    fullWidth
                    label="Amount Received"
                    type="number"
                    size="small"
                    value={billingAmountPaid}
                    onChange={(e) => setBillingAmountPaid(parseFloat(e.target.value) || 0)}
                  />
                  <FormControl fullWidth size="small">
                    <InputLabel>Payment Terms</InputLabel>
                    <Select
                      label="Payment Terms"
                      value={billingPaymentTerms}
                      onChange={(e) => {
                        setBillingPaymentTerms(e.target.value);
                        if (e.target.value !== 'M-Pesa') {
                          setBillingMpesaCode('');
                        }
                      }}
                    >
                      <MenuItem value="Cash">Cash</MenuItem>
                      <MenuItem value="Cheque">Cheque</MenuItem>
                      <MenuItem value="M-Pesa">M-Pesa</MenuItem>
                    </Select>
                  </FormControl>
                  {billingPaymentTerms === 'M-Pesa' && (
                    <TextField
                      fullWidth
                      label="M-Pesa Transaction Code"
                      size="small"
                      value={billingMpesaCode}
                      onClick={() => {
                        if (billingPaymentTerms === 'M-Pesa') {
                          fetchMpesaConfirmations();
                          setMpesaModalOpen(true);
                        }
                      }}
                      placeholder="Click to select from confirmations..."
                      sx={{ cursor: 'pointer' }}
                      InputProps={{
                        readOnly: true,
                      }}
                    />
                  )}
                  <FormControl fullWidth size="small">
                    <InputLabel>Payment Method / Account</InputLabel>
                    <Select
                      label="Payment Method / Account"
                      value={billingPaymentMethod}
                      onChange={(e) => setBillingPaymentMethod(e.target.value)}
                    >
                      <MenuItem value="">
                        <em>Select account</em>
                      </MenuItem>
                      {financialAccounts.map((account) => (
                        <MenuItem key={account.id} value={account.id}>
                          {account.account_name} ({account.account_type})
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                  <Box
                    sx={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      mt: 0.5,
                    }}
                  >
                    <Typography variant="body2">Balance:</Typography>
                    <Typography
                      variant="body2"
                      sx={{
                        fontWeight: 600,
                        color:
                          billingTotals.totalAmount - billingAmountPaid > 0
                            ? 'error.main'
                            : 'success.main',
                      }}
                    >
                      {(billingTotals.totalAmount - billingAmountPaid).toFixed(2)}
                    </Typography>
                  </Box>
                </Box>
              </Box>
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setBillingOpen(false)}>Cancel</Button>
            <Button
              variant="contained"
              onClick={handleBillNow}
              disabled={billingLines.length === 0 || loading}
            >
              Bill &amp; Print
            </Button>
          </DialogActions>
        </Dialog>

        {/* Space Management Dialog */}
        <Dialog
          open={manageSpaceOpen}
          onClose={() => setManageSpaceOpen(false)}
          fullWidth
          maxWidth="sm"
        >
          <DialogTitle>Space Management</DialogTitle>
          <DialogContent>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
              <TextField
                label="Space Title"
                fullWidth
                value={newSpaceTitle}
                onChange={(e) => setNewSpaceTitle(e.target.value)}
              />
              <TextField
                label="Unique Code (optional)"
                fullWidth
                value={newSpaceCode}
                onChange={(e) => setNewSpaceCode(e.target.value)}
              />
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setManageSpaceOpen(false)}>Close</Button>
            <Button variant="contained" onClick={handleCreateSpace} disabled={loading}>
              Add Space
            </Button>
          </DialogActions>
        </Dialog>

        {/* M-Pesa Confirmations Modal (same behaviour as POSScreen) */}
        <Dialog
          open={mpesaModalOpen}
          onClose={() => {
            setMpesaModalOpen(false);
            setMpesaTabValue(0);
            setManualMpesaCode('');
            setCodeSearchResult(null);
            setMpesaMessage('');
          }}
          maxWidth="md"
          fullWidth
        >
          <DialogTitle
            sx={{ backgroundColor: '#00A859', color: 'white', fontWeight: 'bold' }}
          >
            📱 M-Pesa Confirmation
          </DialogTitle>
          <DialogContent
            sx={{ pt: 2, px: { xs: 1, sm: 3 }, pb: { xs: 1, sm: 3 } }}
          >
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
                  display: { xs: 'flex', sm: 'none' },
                },
              }}
            >
              <Tab label="Link to Customer" />
              <Tab label="Enter Confirmation Code" />
              <Tab label="Enter M-Pesa Message" />
            </Tabs>

            {mpesaTabValue === 0 ? (
              <>
                {loading ? (
                  <Typography>Loading confirmations...</Typography>
                ) : mpesaConfirmations.length > 0 ? (
                  <Box
                    sx={{
                      maxHeight: { xs: '50vh', sm: 400 },
                      overflowX: 'auto',
                      overflowY: 'auto',
                    }}
                  >
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                      <thead>
                        <tr>
                          <th>Transaction ID</th>
                          <th>Amount</th>
                          <th>Phone</th>
                          <th>Name</th>
                          <th>Date</th>
                          <th>Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {mpesaConfirmations.map((c) => (
                          <tr key={c.id}>
                            <td>{c.trans_id}</td>
                            <td style={{ fontWeight: 'bold', color: '#00A859' }}>
                              {Number(c.trans_amount || 0).toFixed(2)}
                            </td>
                            <td>{c.msisdn || 'N/A'}</td>
                            <td>
                              {[c.first_name, c.middle_name, c.last_name]
                                .filter(Boolean)
                                .join(' ') || 'N/A'}
                            </td>
                            <td>
                              {c.trans_time
                                ? new Date(c.trans_time).toLocaleString()
                                : new Date(c.created_at).toLocaleString()}
                            </td>
                            <td>
                              <Button
                                size="small"
                                variant="contained"
                                onClick={() => handleMpesaConfirmationSelect(c)}
                                sx={{
                                  backgroundColor: '#00A859',
                                  '&:hover': { backgroundColor: '#008547' },
                                }}
                              >
                                Select
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </Box>
                ) : (
                  <Typography
                    color="textSecondary"
                    sx={{ textAlign: 'center', py: 4 }}
                  >
                    No pending M-Pesa confirmations found
                  </Typography>
                )}
              </>
            ) : mpesaTabValue === 1 ? (
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
                      Amount: KES{' '}
                      {Number(codeSearchResult.confirmation.trans_amount || 0).toFixed(2)}
                    </Typography>
                    <Typography variant="body2">
                      Phone: {codeSearchResult.confirmation.msisdn || 'N/A'}
                    </Typography>
                    <Typography variant="body2">
                      Name:{' '}
                      {[
                        codeSearchResult.confirmation.first_name,
                        codeSearchResult.confirmation.middle_name,
                        codeSearchResult.confirmation.last_name,
                      ]
                        .filter(Boolean)
                        .join(' ') || 'N/A'}
                    </Typography>
                  </Alert>
                )}
                {codeSearchResult && !codeSearchResult.found && (
                  <Alert severity="warning" sx={{ mb: 2 }}>
                    <Typography variant="body2">
                      M-Pesa confirmation not found. You can save this code for future
                      reference.
                    </Typography>
                  </Alert>
                )}
                <Box
                  sx={{
                    display: 'flex',
                    flexDirection: { xs: 'column', sm: 'row' },
                    gap: 2,
                    justifyContent: 'flex-end',
                  }}
                >
                  <Button
                    variant="outlined"
                    onClick={() => {
                      setManualMpesaCode('');
                      setCodeSearchResult(null);
                    }}
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
                      width: { xs: '100%', sm: 'auto' },
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
                        width: { xs: '100%', sm: 'auto' },
                      }}
                    >
                      {loading ? 'Saving...' : 'Save Code'}
                    </Button>
                  )}
                </Box>
              </Box>
            ) : (
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
                    if (message.length > 20) {
                      const parsed = parseMpesaMessage(message);
                      if (parsed.code) {
                        setBillingMpesaCode(parsed.code);
                      }
                      if (parsed.amount > 0) {
                        setBillingAmountPaid(parsed.amount);
                      }
                    }
                  }}
                  placeholder="Paste the full M-Pesa SMS message here..."
                  sx={{ mb: 2 }}
                />
                {billingMpesaCode && (
                  <Alert severity="info" sx={{ mb: 2 }}>
                    <Typography variant="body2" fontWeight="bold">
                      Extracted Information:
                    </Typography>
                    <Typography variant="body2">
                      Transaction Code: <strong>{billingMpesaCode}</strong>
                    </Typography>
                    {billingAmountPaid > 0 && (
                      <Typography variant="body2">
                        Amount: <strong>KES {billingAmountPaid.toFixed(0)}</strong>
                      </Typography>
                    )}
                  </Alert>
                )}
                <Box sx={{ mb: 2 }}>
                  <TextField
                    fullWidth
                    label="Transaction Code"
                    value={billingMpesaCode}
                    onChange={(e) => setBillingMpesaCode(e.target.value)}
                    size="small"
                    sx={{ mb: 1 }}
                    helperText="You can edit the extracted code if needed"
                  />
                  <TextField
                    fullWidth
                    label="Amount Paid (KES)"
                    type="number"
                    value={billingAmountPaid}
                    onChange={(e) =>
                      setBillingAmountPaid(Math.round(parseFloat(e.target.value) || 0))
                    }
                    size="small"
                    inputProps={{ min: 0, step: 1 }}
                    helperText="You can edit the extracted amount if needed (rounded to whole number)"
                  />
                </Box>
                <Box
                  sx={{
                    display: 'flex',
                    flexDirection: { xs: 'column', sm: 'row' },
                    gap: 2,
                    justifyContent: 'flex-end',
                  }}
                >
                  <Button
                    variant="outlined"
                    onClick={() => {
                      setMpesaMessage('');
                      setBillingMpesaCode('');
                      setBillingAmountPaid(0);
                    }}
                    sx={{ width: { xs: '100%', sm: 'auto' } }}
                  >
                    Clear
                  </Button>
                  <Button
                    variant="contained"
                    onClick={() => {
                      if (billingMpesaCode && billingAmountPaid > 0) {
                        setSuccess('M-Pesa information extracted and populated!');
                        setMpesaModalOpen(false);
                        setTimeout(() => setSuccess(null), 3000);
                      } else {
                        setError(
                          'Please ensure both transaction code and amount are extracted.',
                        );
                      }
                    }}
                    disabled={!billingMpesaCode || billingAmountPaid <= 0}
                    sx={{
                      backgroundColor: '#00A859',
                      '&:hover': { backgroundColor: '#008547' },
                      width: { xs: '100%', sm: 'auto' },
                    }}
                  >
                    Use This Information
                  </Button>
                </Box>
              </Box>
            )}
          </DialogContent>
          <DialogActions>
            <Button
              onClick={() => {
                setMpesaModalOpen(false);
                setMpesaTabValue(0);
                setManualMpesaCode('');
                setCodeSearchResult(null);
                setMpesaMessage('');
              }}
            >
              Close
            </Button>
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

        {/* Billing Lookup Items Modal */}
        <Dialog
          open={billingLookupOpen}
          onClose={() => setBillingLookupOpen(false)}
          maxWidth="md"
          fullWidth
        >
          <DialogTitle sx={{ backgroundColor: '#1976d2', color: 'white', fontWeight: 'bold' }}>
            Lookup Items
          </DialogTitle>
          <DialogContent sx={{ pt: 2 }}>
            <Box sx={{ display: 'flex', gap: 1, mb: 2, flexWrap: 'wrap' }}>
              <TextField
                fullWidth
                placeholder="Search by name, code, or category..."
                value={billingLookupSearch}
                onChange={(e) => setBillingLookupSearch(e.target.value)}
                sx={{ flex: '1 1 300px' }}
              />
              <FormControl sx={{ minWidth: 150 }}>
                <InputLabel>Filter by Category</InputLabel>
                <Select
                  value={billingCategoryFilter}
                  onChange={(e) => setBillingCategoryFilter(e.target.value)}
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
                  {billingLookupFilteredItems.map((item: any) => (
                    <TableRow key={item.id}>
                      <TableCell>{item.item_name || 'Unknown'}</TableCell>
                      <TableCell>{item.description || item.item_name || 'Unknown'}</TableCell>
                      <TableCell>{item.code || '-'}</TableCell>
                      <TableCell>
                        {item.category_name ? (
                          <Chip
                            label={item.category_name}
                            size="small"
                            color="primary"
                            variant="outlined"
                          />
                        ) : (
                          <Typography variant="caption" color="text.secondary">
                            -
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell>
                        {item.category_1_name ? (
                          <Chip
                            label={item.category_1_name}
                            size="small"
                            color="info"
                            variant="outlined"
                          />
                        ) : (
                          <Typography variant="caption" color="text.secondary">
                            -
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell>
                        {item.category_2_name ? (
                          <Chip
                            label={item.category_2_name}
                            size="small"
                            color="success"
                            variant="outlined"
                          />
                        ) : (
                          <Typography variant="caption" color="text.secondary">
                            -
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell align="right">{item.quantity || 0}</TableCell>
                      <TableCell align="right">
                        {Number(item.selling_price || 0).toFixed(2)}
                      </TableCell>
                      <TableCell align="center">
                        <Button
                          size="small"
                          variant="contained"
                          onClick={() => handleAddItemToBilling(item)}
                          sx={{
                            backgroundColor: '#4caf50',
                            '&:hover': { backgroundColor: '#388e3c' },
                          }}
                        >
                          Add
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                  {billingLookupFilteredItems.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={9} align="center" sx={{ py: 4, color: '#999' }}>
                        No items found
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setBillingLookupOpen(false)}>Close</Button>
          </DialogActions>
        </Dialog>
      </Box>
    </Box>
  );
};

export default RestaurantScreen;


