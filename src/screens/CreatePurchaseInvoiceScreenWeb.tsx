import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Alert,
  Divider,
  Autocomplete,
  Dialog,
  DialogTitle,
  DialogContent,
  List,
  ListItem,
  ListItemText,
  ListItemButton,
  Chip,
  DialogActions,
  InputAdornment,
  Tabs,
  Tab,
  Checkbox,
  FormControlLabel,
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Save as SaveIcon,
  Receipt as InvoiceIcon,
  List as ListIcon,
  Search as SearchIcon,
} from '@mui/icons-material';
import { useNavigate, useParams } from 'react-router-dom';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { ApiService } from '../services/api';
import { format } from 'date-fns';
import Sidebar from '../components/Sidebar';

interface Item {
  id: number;
  item_name: string;
  description: string;
  unit_price: number;
  quantity: number;
  category: string;
  uom: string;
  code: string;
}

interface PurchaseInvoiceLine {
  item_id: number | null;
  quantity: number;
  unit_price: number;
  total: number;
  description: string;
  code: string;
  uom: string;
  item_name?: string;
}

const CreatePurchaseInvoiceScreen: React.FC = () => {
  const navigate = useNavigate();
  const { purchaseInvoiceId } = useParams();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [items, setItems] = useState<Item[]>([]);
  const [itemSearchQuery, setItemSearchQuery] = useState('');
  const [generatedPurchaseInvoiceNumber, setGeneratedPurchaseInvoiceNumber] = useState<string | null>(null);
  
  // Supplier data
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [selectedSupplier, setSelectedSupplier] = useState<any | null>(null);
  const [supplierSearchQuery, setSupplierSearchQuery] = useState('');
  
  // Purchase Invoice form data
  const [supplierId, setSupplierId] = useState<number | null>(null);
  const [supplierName, setSupplierName] = useState('');
  const [supplierAddress, setSupplierAddress] = useState('');
  const [supplierPin, setSupplierPin] = useState('');
  const [supplierLocation, setSupplierLocation] = useState('');
  const [dueDate, setDueDate] = useState<Date | null>(
    new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days from now
  );
  const [paymentTerms, setPaymentTerms] = useState('Cash');
  const [paymentMethod, setPaymentMethod] = useState<string>(''); // Should be financial account ID (string) or empty
  const [mpesaCode, setMpesaCode] = useState('');
  const [notes, setNotes] = useState('');
  const [lines, setLines] = useState<PurchaseInvoiceLine[]>([
    {
      item_id: null,
      quantity: 1,
      unit_price: 0,
      total: 0,
      description: '',
      code: '',
      uom: '',
      item_name: ''
    }
  ]);
  
  // Payment fields
  const [amountPaid, setAmountPaid] = useState<number>(0);
  const [includeVAT, setIncludeVAT] = useState(true); // VAT checkbox state
  const [discountType, setDiscountType] = useState<'percentage' | 'fixed'>('percentage'); // Default to percentage
  const [discountPercentage, setDiscountPercentage] = useState<number>(0); // Discount percentage
  const [discount, setDiscount] = useState<number>(0); // Discount amount (fixed or calculated)
  const [financialAccounts, setFinancialAccounts] = useState<any[]>([]);
  const [mpesaConfirmations, setMpesaConfirmations] = useState<any[]>([]);
  const [mpesaModalOpen, setMpesaModalOpen] = useState(false);
  const [mpesaTabValue, setMpesaTabValue] = useState(0);
  const [manualMpesaCode, setManualMpesaCode] = useState('');
  const [searchingCode, setSearchingCode] = useState(false);
  const [codeSearchResult, setCodeSearchResult] = useState<{ found: boolean; confirmation: any } | null>(null);
  const [mpesaMessage, setMpesaMessage] = useState('');

  // Fetch items and quotations
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch items
        const itemsResponse = await ApiService.getItems();
        if (itemsResponse.success) {
          setItems(itemsResponse.data.items || itemsResponse.data || []);
        }

        // Fetch suppliers
        const suppliersResponse = await ApiService.getSuppliers();
        if (suppliersResponse.success) {
          setSuppliers(suppliersResponse.data.suppliers || []);
        }

        // Fetch financial accounts for payment methods
        const accountsResponse = await ApiService.getFinancialAccounts();
        if (accountsResponse.success) {
          setFinancialAccounts(accountsResponse.data.accounts || []);
        }
      } catch (err) {
        console.error('Error fetching data:', err);
      }
    };

    fetchData();
  }, []);

  // Load data based on mode (purchase invoice edit)
  useEffect(() => {
    if (purchaseInvoiceId) {
      setIsEditMode(true);
      // Load invoice data - suppliers and financial accounts will be available when needed
      loadPurchaseInvoiceData(parseInt(purchaseInvoiceId));
    }
  }, [purchaseInvoiceId]);

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
      
      // Note: M-Pesa linking for purchase invoices can be added if needed
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
      setError(null);
      const response = await ApiService.searchMpesaConfirmationByCode(manualMpesaCode.trim());
      
      if (response.success && response.data.found) {
        const confirmation = response.data.confirmation;
        setCodeSearchResult({ found: true, confirmation });
        setMpesaCode(confirmation.trans_id);
        setAmountPaid(parseFloat(confirmation.trans_amount) || 0);
        setSuccess('M-Pesa confirmation found and amount populated!');
        setTimeout(() => setSuccess(null), 3000);
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
      setError(null);
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
        setTimeout(() => setSuccess(null), 3000);
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

  // Handle M-Pesa message paste
  const handleMpesaMessagePaste = (message: string) => {
    setMpesaMessage(message);
    const parsed = parseMpesaMessage(message);
    
    if (parsed.code) {
      setMpesaCode(parsed.code);
      setSuccess(`Transaction code extracted: ${parsed.code}`);
      setTimeout(() => setSuccess(null), 3000);
    } else {
      setError('Could not extract transaction code from message. Please check the format.');
    }
    
    if (parsed.amount > 0) {
      setAmountPaid(parsed.amount);
      if (parsed.code) {
        setSuccess(`Transaction code: ${parsed.code}, Amount: KES ${parsed.amount}`);
        setTimeout(() => setSuccess(null), 3000);
      }
    } else {
      setError('Could not extract amount from message. Please check the format.');
    }
  };

  const loadPurchaseInvoiceData = async (id: number) => {
    try {
      console.log('🔵 [CreatePurchaseInvoice] Loading purchase invoice data for ID:', id);
      const response = await ApiService.getPurchaseInvoice(id);
      console.log('🔵 [CreatePurchaseInvoice] API response:', response);
      
      if (response.success) {
        const purchaseInvoice = response.data;
        console.log('🔵 [CreatePurchaseInvoice] Purchase invoice data:', purchaseInvoice);
        
        setSupplierName(purchaseInvoice.supplier_name);
        setSupplierAddress(purchaseInvoice.supplier_address || '');
        setSupplierPin(purchaseInvoice.supplier_pin || '');
        setNotes(purchaseInvoice.notes || '');
        setPaymentTerms(purchaseInvoice.payment_terms || 'Cash');
        setDueDate(purchaseInvoice.due_date ? new Date(purchaseInvoice.due_date) : null);
        
        // Load amount paid
        const loadedAmountPaid = parseFloat(purchaseInvoice.amount_paid || purchaseInvoice.amountPaid || 0) || 0;
        setAmountPaid(loadedAmountPaid);
        console.log('🔵 [CreatePurchaseInvoice] Amount paid:', loadedAmountPaid);
        
        // Load payment method - use financial_account_id from payment record, or empty string
        // The paymentMethod state should be a financial account ID (number) or empty string
        const financialAccountId = purchaseInvoice.financial_account_id;
        if (financialAccountId && !isNaN(Number(financialAccountId))) {
          setPaymentMethod(String(financialAccountId));
          console.log('🔵 [CreatePurchaseInvoice] Payment method (financial account ID):', financialAccountId);
        } else {
          setPaymentMethod('');
          console.log('🔵 [CreatePurchaseInvoice] No financial account ID found, setting payment method to empty');
        }
        
        // Load VAT information
        const vatAmount = parseFloat(purchaseInvoice.vat_amount || 0) || 0;
        setIncludeVAT(vatAmount > 0);
        console.log('🔵 [CreatePurchaseInvoice] VAT amount:', vatAmount, 'Include VAT:', vatAmount > 0);
        
        // Load discount
        const loadedDiscount = purchaseInvoice.discount || purchaseInvoice.discount_amount || 0;
        setDiscount(loadedDiscount);
        setDiscountType('fixed');
        setDiscountPercentage(0);
        
        // Set the purchase invoice number from database
        if (purchaseInvoice.purchase_invoice_number) {
          setGeneratedPurchaseInvoiceNumber(purchaseInvoice.purchase_invoice_number);
        }
        
        // Set supplier ID if available
        if (purchaseInvoice.supplier_id) {
          setSupplierId(purchaseInvoice.supplier_id);
          // Try to find and set the selected supplier
          const supplier = suppliers.find(s => s.id === purchaseInvoice.supplier_id);
          if (supplier) {
            setSelectedSupplier(supplier);
          }
        }
        
        // Convert purchase invoice lines to editable format
        if (purchaseInvoice.lines) {
          setLines(purchaseInvoice.lines.map((line: any) => {
            const quantity = parseFloat(line.quantity) || 0;
            const unit_price = parseFloat(line.unit_price) || 0;
            const total = quantity * unit_price;
            return {
              item_id: line.item_id,
              quantity,
              unit_price,
              total,
              description: line.description,
              code: line.code,
              uom: line.uom,
              item_name: line.item_name
            };
          }));
        }
        
        console.log('✅ [CreatePurchaseInvoice] Purchase invoice data loaded successfully');
      } else {
        console.error('❌ [CreatePurchaseInvoice] API response not successful:', response);
        setError('Failed to load purchase invoice data');
      }
    } catch (err) {
      console.error('❌ [CreatePurchaseInvoice] Error loading purchase invoice:', err);
      setError('Failed to load purchase invoice data');
    }
  };

  const handleSupplierSelect = (supplier: any | null) => {
    setSelectedSupplier(supplier);
    if (supplier) {
      setSupplierId(supplier.id);
      setSupplierName(supplier.name);
      setSupplierPin(supplier.pin || '');
      setSupplierAddress(supplier.address || '');
      setSupplierLocation(supplier.location || '');
    } else {
      setSupplierId(null);
      setSupplierName('');
      setSupplierPin('');
      setSupplierAddress('');
      setSupplierLocation('');
    }
  };

  const handleItemSelect = (index: number, item: Item | null) => {
    const newLines = [...lines];
    newLines[index] = {
      ...newLines[index],
      item_id: item?.id || null,
      item_name: item?.item_name || '',
      description: item?.description || item?.item_name || '', // Use description, fallback to item_name
      unit_price: item?.unit_price || 0,
      code: item?.code || '',
      uom: item?.uom || '',
      total: newLines[index].quantity * (item?.unit_price || 0)
    };
    console.log('🔵 [CreateInvoice] Item selected, using description:', newLines[index].description);
    setLines(newLines);
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

  const handleLineChange = (index: number, field: keyof PurchaseInvoiceLine, value: any) => {
    const newLines = [...lines];
    
    // If changing quantity, validate it
    if (field === 'quantity') {
      const validatedQty = validateFractionalQuantity(parseFloat(value) || 0);
      newLines[index] = { ...newLines[index], [field]: validatedQty };
    } else {
      newLines[index] = { ...newLines[index], [field]: value };
    }
    
    if (field === 'quantity' || field === 'unit_price') {
      newLines[index].total = newLines[index].quantity * newLines[index].unit_price;
    }
    
    setLines(newLines);
  };

  const fetchPurchaseInvoiceNumber = async () => {
    try {
      const response = await ApiService.getNextPurchaseInvoiceNumber();
      console.log('Fetched purchase invoice number response:', response);
      
      if (response.success && response.data?.purchaseInvoiceNumber) {
        const purchaseInvoiceNum = response.data.purchaseInvoiceNumber;
        console.log('Purchase invoice number generated:', purchaseInvoiceNum);
        setGeneratedPurchaseInvoiceNumber(purchaseInvoiceNum);
        return purchaseInvoiceNum;
      } else {
        console.error('Failed to fetch purchase invoice number:', response.message || 'No message');
      }
    } catch (error) {
      console.error('Error fetching purchase invoice number:', error);
    }
    return null;
  };

  const addLine = () => {
    setLines([
      ...lines,
      {
        item_id: null,
        quantity: 1,
        unit_price: 0,
        total: 0,
        description: '',
        code: '',
        uom: '',
        item_name: ''
      }
    ]);
  };

  const removeLine = (index: number) => {
    if (lines.length > 1) {
      setLines(lines.filter((_: any, i: number) => i !== index));
    }
  };

  const calculateTotals = () => {
    const subtotal = lines.reduce((sum, line) => {
      // Ensure we handle NaN values and use calculated total if not available
      const lineTotal = isNaN(line.total) ? (line.quantity * line.unit_price) : line.total;
      return sum + (isNaN(lineTotal) ? 0 : lineTotal);
    }, 0);
    // Calculate VAT based on includeVAT flag: if enabled, calculate 16% of subtotal, otherwise 0
    const vatAmount = includeVAT ? subtotal * 0.16 : 0;
    console.log('🔵 [CreateInvoice] calculateTotals - includeVAT:', includeVAT, 'subtotal:', subtotal, 'vatAmount:', vatAmount);
    const totalBeforeDiscount = subtotal + vatAmount;
    
    // Calculate discount based on type
    let discountAmount = 0;
    if (discountType === 'percentage') {
      // Calculate discount from percentage
      discountAmount = (totalBeforeDiscount * discountPercentage) / 100;
    } else {
      // Use fixed discount amount
      discountAmount = Number(discount) || 0;
    }
    
    const totalBeforeRounding = Math.max(0, totalBeforeDiscount - discountAmount); // Ensure total doesn't go negative
    const totalAmount = Math.round(totalBeforeRounding); // Round to nearest whole number
    
    return { 
      subtotal: isNaN(subtotal) ? 0 : subtotal, 
      vatAmount: isNaN(vatAmount) ? 0 : vatAmount, 
      discountAmount: isNaN(discountAmount) ? 0 : discountAmount,
      totalAmount: isNaN(totalAmount) ? 0 : totalAmount 
    };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!supplierName || !dueDate || lines.length === 0) {
      setError('Please fill in all required fields');
      return;
    }

    // Validate that all lines have items and quantities
    const invalidLines = lines.some(line => !line.item_id || line.quantity <= 0);
    if (invalidLines) {
      setError('Please ensure all lines have valid items and quantities');
      return;
    }

    // Validate payment method is selected if amount is paid
    const calculatedAmountPaid = parseFloat(amountPaid.toString()) || 0;
    if (calculatedAmountPaid > 0 && !paymentMethod) {
      setError('Payment method is required when amount is paid');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const totals = calculateTotals();
      console.log('🔵 [CreatePurchaseInvoice] handleSubmit - includeVAT:', includeVAT, 'totals:', totals);
      const purchaseInvoiceData = {
        supplier_id: supplierId,
        supplier_name: supplierName,
        supplier_address: supplierAddress,
        supplier_pin: supplierPin,
        due_date: dueDate?.toISOString() || '',
        payment_terms: paymentTerms,
        payment_method: paymentMethod,
        mpesa_code: paymentMethod === 'M-Pesa' ? mpesaCode : '',
        notes,
        amountPaid: calculatedAmountPaid,
        paymentMethod: paymentMethod || undefined,
        vat_amount: totals.vatAmount,
        discount_amount: totals.discountAmount,
        lines: lines.map(line => ({
          item_id: line.item_id ? parseInt(line.item_id.toString()) : undefined,
          quantity: parseFloat(line.quantity.toString()),
          unit_price: parseFloat(line.unit_price.toString()),
          description: line.description,
          code: line.code,
          uom: line.uom
        }))
      };
      console.log('🔵 [CreatePurchaseInvoice] Purchase invoice data being sent:', purchaseInvoiceData);

      let response;
      if (isEditMode && purchaseInvoiceId) {
        response = await ApiService.updatePurchaseInvoice(parseInt(purchaseInvoiceId), purchaseInvoiceData);
        if (response.success) {
          setSuccess('Purchase invoice updated successfully!');
        } else {
          throw new Error(response.message || 'Failed to update purchase invoice');
        }
      } else {
        response = await ApiService.createPurchaseInvoice(purchaseInvoiceData);
        if (response.success) {
          const purchaseInvoiceNumber = response.data?.purchase_invoice_number || response.data?.purchaseInvoiceNumber || 'Unknown';
          setSuccess(`Purchase invoice created successfully! Purchase Invoice #${purchaseInvoiceNumber}`);
        } else {
          throw new Error(response.message || 'Failed to create purchase invoice');
        }
      }
      
      // Navigate to purchase invoice list after a short delay
      setTimeout(() => {
        navigate('/purchase-invoices');
      }, 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const { subtotal, vatAmount, discountAmount, totalAmount } = calculateTotals();

  const filteredItems = items.filter(item =>
    item.item_name.toLowerCase().includes(itemSearchQuery.toLowerCase()) ||
    item.code.toLowerCase().includes(itemSearchQuery.toLowerCase())
  );

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES'
    }).format(amount);
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Box sx={{ display: 'flex', width: '100vw', minHeight: '100vh', margin: 0 }}>
        {/* Sidebar - hidden on mobile */}
        <Box sx={{ display: { xs: 'none', md: 'block' } }}>
          <Sidebar title="Purchase Invoice Management" />
        </Box>

        {/* Main Content */}
        <Box sx={{ 
          marginLeft: { xs: 0, md: '350px' }, 
          width: { xs: '100%', md: 'calc(100vw - 350px - 24px)' }, 
          p: { xs: 2, md: 3 }, 
          paddingRight: { xs: 0, md: '24px' },
          overflow: 'auto'
        }}>
          {/* Header */}
          <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, alignItems: { xs: 'flex-start', sm: 'center' }, gap: 2, mb: 3 }}>
            <Box sx={{ flex: 1 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <InvoiceIcon sx={{ fontSize: { xs: 24, md: 32 } }} />
                <Typography variant="h4" component="h1" sx={{ fontSize: { xs: '1.5rem', md: '2.125rem' } }}>
                  {isEditMode ? 'Edit Purchase Invoice' : 'Create Purchase Invoice'}
                </Typography>
              </Box>
            </Box>
          </Box>

        {/* Success Alert */}
        {success && (
          <Alert severity="success" sx={{ mb: 3 }}>
            {success}
          </Alert>
        )}

        {/* Error Alert */}
        {error && (
          <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        <form onSubmit={handleSubmit}>
          {/* Supplier Information */}
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ fontSize: { xs: '1rem', md: '1.25rem' } }}>
                Supplier Information
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 2 }}>
                  <Box sx={{ flex: 1 }}>
                    <Autocomplete
                      options={suppliers}
                      getOptionLabel={(option) => option.name}
                      value={selectedSupplier}
                      onChange={(_, newValue) => handleSupplierSelect(newValue)}
                      freeSolo
                      onInputChange={(_, newInputValue) => {
                        if (!selectedSupplier) {
                          setSupplierName(newInputValue);
                        }
                      }}
                      renderInput={(params) => (
                        <TextField
                          {...params}
                          label="Supplier Name *"
                          required
                          size="small"
                          placeholder="Search or enter new supplier..."
                        />
                      )}
                      renderOption={(props, option) => (
                        <Box component="li" {...props}>
                          <Box>
                            <Typography variant="body2">{option.name}</Typography>
                            {option.phone && (
                              <Typography variant="caption" color="text.secondary">
                                {option.phone}
                              </Typography>
                            )}
                          </Box>
                        </Box>
                      )}
                    />
                  </Box>
                  <Box sx={{ flex: 1 }}>
                    <TextField
                      fullWidth
                      label="Supplier PIN"
                      value={supplierPin}
                      onChange={(e) => setSupplierPin(e.target.value)}
                      size="small"
                    />
                  </Box>
                </Box>
                <TextField
                  fullWidth
                  label="Supplier Address"
                  multiline
                  rows={3}
                  value={supplierAddress}
                  onChange={(e) => setSupplierAddress(e.target.value)}
                  size="small"
                />
              </Box>
            </CardContent>
          </Card>

          {/* Purchase Invoice Details */}
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ fontSize: { xs: '1rem', md: '1.25rem' } }}>
                Purchase Invoice Details
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 2 }}>
                  <Box sx={{ flex: 1 }}>
                    <DatePicker
                      label="Due Date *"
                      value={dueDate}
                      onChange={(newValue) => setDueDate(newValue)}
                      slotProps={{
                        textField: {
                          fullWidth: true,
                          required: true
                        }
                      }}
                    />
                  </Box>
                  <Box sx={{ flex: 1, minWidth: '300px' }}>
                    <FormControl fullWidth>
                      <InputLabel>Payment Terms</InputLabel>
                      <Select
                        value={paymentTerms}
                        onChange={(e) => setPaymentTerms(e.target.value)}
                        label="Payment Terms"
                      >
                        <MenuItem value="Cash">Cash</MenuItem>
                        <MenuItem value="Cheque">Cheque</MenuItem>
                        <MenuItem value="M-Pesa">M-Pesa</MenuItem>
                      </Select>
                    </FormControl>
                  </Box>
                </Box>
                <TextField
                  fullWidth
                  label="Notes"
                  multiline
                  rows={3}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </Box>
            </CardContent>
          </Card>

          {/* Items */}
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: 1, alignItems: { xs: 'flex-start', sm: 'center' }, mb: 2, flexWrap: 'wrap' }}>
                <Typography variant="h6" sx={{ flex: 1, minWidth: { xs: '100%', sm: 'auto' } }}>
                  Items
                </Typography>
                <Box sx={{ display: 'flex', gap: 1, flexDirection: { xs: 'column', sm: 'row' }, width: { xs: '100%', sm: 'auto' }, flex: 1, minWidth: { xs: '100%', sm: 'auto' } }}>
                  <Autocomplete
                    options={filteredItems}
                    getOptionLabel={(option) => `${option.item_name} (${option.code})`}
                    value={null}
                    onChange={(_, newValue) => {
                      if (newValue) {
                        // Add a new line with this item
                        const newLine = {
                          item_id: newValue.id || null,
                          quantity: 1,
                          unit_price: newValue.unit_price || 0,
                          total: 1 * (newValue.unit_price || 0),
                          description: newValue.description || newValue.item_name || '', // Use description, fallback to item_name
                          code: newValue.code || '',
                          uom: newValue.uom || '',
                          item_name: newValue.item_name || ''
                        };
                        console.log('🔵 [CreateInvoice] New item added from autocomplete, description:', newLine.description);
                        setLines([...lines, newLine]);
                        // Clear search query
                        setItemSearchQuery('');
                      }
                    }}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        placeholder="Search by code or name..."
                        size="small"
                        sx={{ width: { xs: '100%', sm: 300 }, flexShrink: 0 }}
                      />
                    )}
                  />
                </Box>
              </Box>

              <TableContainer component={Paper} variant="outlined" sx={{ overflowX: { xs: 'auto', md: 'unset' } }}>
                <Table sx={{ fontSize: { xs: '0.75rem', md: 'inherit' } }}>
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ fontSize: { xs: '0.75rem', md: '0.875rem' } }}>Item</TableCell>
                      <TableCell align="center" sx={{ fontSize: { xs: '0.75rem', md: '0.875rem' }, width: { xs: 70, md: 'auto' } }}>Qty</TableCell>
                      <TableCell align="right" sx={{ fontSize: { xs: '0.75rem', md: '0.875rem' }, width: { xs: 80, md: 'auto' } }}>Price</TableCell>
                      <TableCell align="right" sx={{ fontSize: { xs: '0.75rem', md: '0.875rem' }, width: { xs: 80, md: 'auto' } }}>Total</TableCell>
                      <TableCell width={40} sx={{ padding: { xs: '4px 8px', md: '16px' } }}></TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {lines.map((line, index) => (
                      <TableRow key={index}>
                        <TableCell sx={{ minWidth: { xs: 200, md: 300 }, padding: { xs: '8px 4px', md: '16px' } }}>
                          <Autocomplete
                            options={filteredItems}
                            getOptionLabel={(option) => `${option.item_name} (${option.code})`}
                            value={items.find(item => item.id === line.item_id) || null}
                            onChange={(_, newValue) => handleItemSelect(index, newValue)}
                            renderInput={(params) => (
                              <TextField
                                {...params}
                                label="Item"
                                size="small"
                                required
                              />
                            )}
                          />
                        </TableCell>
                        <TableCell align="center" sx={{ padding: { xs: '8px 4px', md: '16px' } }}>
                          <TextField
                            type="number"
                            size="small"
                            value={line.quantity}
                            onChange={(e) => {
                              const inputValue = parseFloat(e.target.value) || 0;
                              handleLineChange(index, 'quantity', inputValue);
                            }}
                            onBlur={(e) => {
                              // Validate on blur to ensure correct value
                              const inputValue = parseFloat(e.target.value) || 0;
                              const validatedQty = validateFractionalQuantity(inputValue);
                              if (Math.abs(validatedQty - inputValue) > 0.001) {
                                handleLineChange(index, 'quantity', validatedQty);
                              }
                            }}
                            inputProps={{ 
                              min: 0.25, 
                              step: 0.25,
                              pattern: '[0-9]+(\\.(25|5|75|0))?'
                            }}
                            sx={{ width: { xs: 80, md: 120 } }}
                          />
                        </TableCell>
                        <TableCell align="right" sx={{ padding: { xs: '8px 4px', md: '16px' } }}>
                          <TextField
                            type="number"
                            size="small"
                            value={line.unit_price}
                            onChange={(e) => handleLineChange(index, 'unit_price', parseFloat(e.target.value) || 0)}
                            inputProps={{ min: 0, step: 0.01 }}
                            sx={{ width: { xs: 70, md: 120 } }}
                          />
                        </TableCell>
                        <TableCell align="right" sx={{ padding: { xs: '8px 4px', md: '16px' }, fontSize: { xs: '0.85rem', md: '1rem' } }}>
                          {formatCurrency(line.total)}
                        </TableCell>
                        <TableCell sx={{ padding: { xs: '4px 0', md: '16px' } }}>
                          <IconButton
                            onClick={() => removeLine(index)}
                            disabled={lines.length === 1}
                            color="error"
                            size="small"
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>

          {/* Totals */}
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ fontSize: { xs: '1rem', md: '1.25rem' } }}>
                Summary
              </Typography>
              <Box sx={{ maxWidth: { xs: '100%', md: 400 }, ml: { xs: 0, md: 'auto' } }}>
                {/* VAT Toggle */}
                <Box sx={{ mb: 2 }}>
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={includeVAT}
                        onChange={(e) => {
                          console.log('🔵 [CreateInvoice] VAT checkbox changed:', e.target.checked);
                          setIncludeVAT(e.target.checked);
                        }}
                      />
                    }
                    label="Include VAT (16%)"
                  />
                </Box>
                
                {/* Discount Type Toggle */}
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
                      helperText={`Discount: ${formatCurrency(calculateTotals().discountAmount)}`}
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
                {(() => {
                  const totals = calculateTotals();
                  return (
                    <>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1, gap: 2 }}>
                        <Typography variant="body2">Subtotal:</Typography>
                        <Typography variant="body2" sx={{ fontWeight: 'bold' }}>{formatCurrency(totals.subtotal)}</Typography>
                      </Box>
                      {includeVAT && (
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1, gap: 2 }}>
                          <Typography variant="body2">VAT (16%):</Typography>
                          <Typography variant="body2" sx={{ fontWeight: 'bold' }}>{formatCurrency(totals.vatAmount)}</Typography>
                        </Box>
                      )}
                      {totals.discountAmount > 0 && (
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1, gap: 2 }}>
                          <Typography variant="body2" sx={{ color: 'error.main' }}>
                            Discount{discountType === 'percentage' ? ` (${discountPercentage}%)` : ''}:
                          </Typography>
                          <Typography variant="body2" sx={{ fontWeight: 'bold', color: 'error.main' }}>
                            -{formatCurrency(totals.discountAmount)}
                          </Typography>
                        </Box>
                      )}
                      <Divider sx={{ my: 1 }} />
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2, gap: 2 }}>
                        <Typography sx={{ fontSize: { xs: '1rem', md: '1.5rem' }, fontWeight: 'bold' }}>Total:</Typography>
                        <Typography sx={{ fontSize: { xs: '1rem', md: '1.5rem' }, fontWeight: 'bold' }}>{formatCurrency(totals.totalAmount)}</Typography>
                      </Box>
                    </>
                  );
                })()}
                
                {/* Payment Information */}
                <Divider sx={{ my: 2 }} />
                <Typography variant="subtitle1" gutterBottom>
                  Payment Information
                </Typography>
                {(() => {
                  const totals = calculateTotals();
                  return (
                    <>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1, color: 'primary.main' }}>
                        <Typography>Amount Paid:</Typography>
                        <Typography fontWeight="medium">{formatCurrency(amountPaid)}</Typography>
                      </Box>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                        <Typography>Balance Due:</Typography>
                        <Typography 
                          fontWeight="medium"
                          color={totals.totalAmount - amountPaid > 0 ? 'error.main' : 'success.main'}
                        >
                          {formatCurrency(totals.totalAmount - amountPaid)}
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography variant="body2">Status:</Typography>
                        <Chip 
                          label={
                            amountPaid === 0 ? 'Unpaid' :
                            amountPaid >= totals.totalAmount ? 'Paid' : 'Partially Paid'
                          }
                          color={
                            amountPaid === 0 ? 'error' :
                            amountPaid >= totals.totalAmount ? 'success' : 'warning'
                          }
                          size="small"
                        />
                      </Box>
                    </>
                  );
                })()}
              </Box>
            </CardContent>
          </Card>

          {/* Payment Details */}
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Payment Details
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                {paymentTerms === 'M-Pesa' && (
                  <Box>
                    <TextField
                      fullWidth
                      label="M-Pesa Transaction Code *"
                      value={mpesaCode}
                      onChange={(e) => setMpesaCode(e.target.value)}
                      onClick={() => {
                        if (paymentTerms === 'M-Pesa') {
                          fetchMpesaConfirmations();
                          setMpesaModalOpen(true);
                        }
                      }}
                      placeholder="Click to select from confirmations..."
                      required
                      InputProps={{
                        readOnly: true,
                        endAdornment: (
                          <InputAdornment position="end">
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
                          </InputAdornment>
                        )
                      }}
                    />
                  </Box>
                )}
                <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
                  <Box sx={{ flex: 1, minWidth: '300px' }}>
                    <TextField
                      fullWidth
                      label="Amount Paid"
                      type="number"
                      value={amountPaid}
                      onChange={(e) => setAmountPaid(parseFloat(e.target.value) || 0)}
                      inputProps={{ 
                        step: 0.01,
                        min: 0
                      }}
                      helperText={`Total: ${formatCurrency(totalAmount)}`}
                    />
                  </Box>
                  <Box sx={{ flex: 1, minWidth: '300px' }}>
                    <FormControl fullWidth error={amountPaid > 0 && !paymentMethod}>
                      <InputLabel>Payment Method / Account *</InputLabel>
                      <Select
                        value={paymentMethod}
                        onChange={(e) => setPaymentMethod(e.target.value)}
                        label="Payment Method / Account *"
                      >
                        <MenuItem value="">
                          <em>Select payment method</em>
                        </MenuItem>
                        {financialAccounts.map((account) => (
                          <MenuItem key={account.id} value={account.id}>
                            {account.account_name} ({account.account_type.replace('_', ' ').toUpperCase()})
                          </MenuItem>
                        ))}
                      </Select>
                      {amountPaid > 0 && !paymentMethod && (
                        <Typography sx={{ color: 'error.main', fontSize: '0.75rem', mt: 0.5 }}>
                          Payment method is required when amount is paid
                        </Typography>
                      )}
                    </FormControl>
                  </Box>
                </Box>
              </Box>
            </CardContent>
          </Card>

          {/* Submit Button */}
          <Box sx={{ display: 'flex', flexDirection: { xs: 'column-reverse', sm: 'row' }, justifyContent: 'flex-end', gap: 2 }}>
            <Button
              variant="outlined"
              color="primary"
              sx={{ width: { xs: '100%', sm: 'auto' } }}
              onClick={async () => {
                if (!supplierName || !dueDate || lines.length === 0) {
                  setError('Please fill in all required fields before previewing');
                  return;
                }
                const invalidLines = lines.some(line => !line.item_id || line.quantity <= 0);
                if (invalidLines) {
                  setError('Please ensure all lines have valid items and quantities');
                  return;
                }
                
                // Fetch purchase invoice number before navigating to preview
                const purchaseInvoiceNumber = await fetchPurchaseInvoiceNumber();
                
                const totals = calculateTotals();
                navigate('/purchase-invoice-preview', {
                  state: {
                    lines,
                    supplierName,
                    supplierAddress,
                    supplierPin,
                    documentType: 'purchase_invoice',
                    dueDate: dueDate?.toISOString(),
                    paymentTerms,
                    notes,
                    purchaseInvoiceNumber: purchaseInvoiceNumber || generatedPurchaseInvoiceNumber,
                    includeVAT,
                    vat_amount: totals.vatAmount,
                    discount_amount: totals.discountAmount,
                    total_amount: totals.totalAmount
                  }
                });
              }}
              disabled={loading}
            >
              Preview
            </Button>
            <Button
              type="submit"
              variant="contained"
              color="primary"
              startIcon={<SaveIcon />}
              disabled={loading}
              sx={{ width: { xs: '100%', sm: 'auto' } }}
            >
              {loading ? (isEditMode ? 'Updating...' : 'Creating...') : (isEditMode ? 'Update Purchase Invoice' : 'Create Purchase Invoice')}
            </Button>
          </Box>
        </form>

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
                        setTimeout(() => setSuccess(null), 3000);
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
        </Box>
      </Box>
    </LocalizationProvider>
  );
};

export default CreatePurchaseInvoiceScreen;