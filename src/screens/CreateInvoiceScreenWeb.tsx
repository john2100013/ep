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
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Save as SaveIcon,
  Receipt as InvoiceIcon,
  List as ListIcon,
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

interface InvoiceLine {
  item_id: number | null;
  quantity: number;
  unit_price: number;
  total: number;
  description: string;
  code: string;
  uom: string;
  item_name?: string;
}

interface Quotation {
  id: number;
  quotation_number: string;
  customer_name: string;
  customer_address?: string;
  customer_pin?: string;
  subtotal: number;
  vat_amount: number;
  total_amount: number;
  status: string;
  valid_until: string;
  notes?: string;
  lines?: any[];
}

const CreateInvoiceScreen: React.FC = () => {
  const navigate = useNavigate();
  const { quotationId, invoiceId } = useParams();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [items, setItems] = useState<Item[]>([]);
  const [quotations, setQuotations] = useState<Quotation[]>([]);
  const [quotationDialogOpen, setQuotationDialogOpen] = useState(false);
  const [itemSearchQuery, setItemSearchQuery] = useState('');
  const [generatedInvoiceNumber, setGeneratedInvoiceNumber] = useState<string | null>(null);
  
  // Customer data
  const [customers, setCustomers] = useState<any[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<any | null>(null);
  const [customerSearchQuery, setCustomerSearchQuery] = useState('');
  
  // Invoice form data
  const [customerId, setCustomerId] = useState<number | null>(null);
  const [customerName, setCustomerName] = useState('');
  const [customerAddress, setCustomerAddress] = useState('');
  const [customerPin, setCustomerPin] = useState('');
  const [customerLocation, setCustomerLocation] = useState('');
  const [dueDate, setDueDate] = useState<Date | null>(
    new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days from now
  );
  const [paymentTerms, setPaymentTerms] = useState('Cash');
  const [paymentMethod, setPaymentMethod] = useState('Cash');
  const [mpesaCode, setMpesaCode] = useState('');
  const [notes, setNotes] = useState('');
  const [lines, setLines] = useState<InvoiceLine[]>([
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
  const [selectedQuotationId, setSelectedQuotationId] = useState<number | null>(null);
  
  // Payment fields
  const [amountPaid, setAmountPaid] = useState<number>(0);
  const [financialAccounts, setFinancialAccounts] = useState<any[]>([]);

  // Fetch items and quotations
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch items
        const itemsResponse = await ApiService.getItems();
        if (itemsResponse.success) {
          setItems(itemsResponse.data.items || itemsResponse.data || []);
        }

        // Fetch quotations that can be converted (not already converted)
        const quotationsResponse = await ApiService.getQuotations({ limit: 100 });
        if (quotationsResponse.success) {
          const quotationsList = quotationsResponse.data?.quotations || [];
          // Filter for quotations that can be converted to invoices (exclude converted ones)
          const eligibleQuotations = quotationsList.filter((q: Quotation) => 
            q.status !== 'converted'
          );
          setQuotations(eligibleQuotations);
          console.log('Loaded quotations:', eligibleQuotations); // Debug log
        }

        // Fetch customers
        const customersResponse = await ApiService.getCustomers();
        if (customersResponse.success) {
          setCustomers(customersResponse.data.customers || []);
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

  // Load data based on mode (quotation or invoice edit)
  useEffect(() => {
    if (quotationId) {
      loadQuotationData(parseInt(quotationId));
    } else if (invoiceId) {
      setIsEditMode(true);
      loadInvoiceData(parseInt(invoiceId));
    }
  }, [quotationId, invoiceId]);

  const loadQuotationData = async (id: number) => {
    try {
      const response = await ApiService.getQuotation(id);
      if (response.success) {
        const quotation = response.data;
        setCustomerName(quotation.customer_name);
        setCustomerAddress(quotation.customer_address || '');
        setCustomerPin(quotation.customer_pin || '');
        setNotes(quotation.notes || '');
        setSelectedQuotationId(quotation.id);
        
        // Convert quotation lines to invoice lines
        if (quotation.lines) {
          setLines(quotation.lines.map((line: any) => {
            const quantity = parseFloat(line.quantity) || 0;
            const unit_price = parseFloat(line.unit_price) || 0;
            const total = quantity * unit_price; // Recalculate total to ensure it's correct
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
      }
    } catch (err) {
      console.error('Error loading quotation:', err);
      setError('Failed to load quotation data');
    }
  };

  const loadInvoiceData = async (id: number) => {
    try {
      const response = await ApiService.getInvoice(id);
      if (response.success) {
        const invoice = response.data;
        setCustomerName(invoice.customer_name);
        setCustomerAddress(invoice.customer_address || '');
        setCustomerPin(invoice.customer_pin || '');
        setNotes(invoice.notes || '');
        setPaymentTerms(invoice.payment_terms || 'Cash');
        setDueDate(invoice.due_date ? new Date(invoice.due_date) : null);
        setSelectedQuotationId(invoice.quotation_id || null);
        
        // Set the invoice number from database
        if (invoice.invoice_number) {
          setGeneratedInvoiceNumber(invoice.invoice_number);
        }
        
        // Convert invoice lines to editable format
        if (invoice.lines) {
          setLines(invoice.lines.map((line: any) => {
            const quantity = parseFloat(line.quantity) || 0;
            const unit_price = parseFloat(line.unit_price) || 0;
            const total = quantity * unit_price; // Recalculate total to ensure it's correct
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
      }
    } catch (err) {
      console.error('Error loading invoice:', err);
      setError('Failed to load invoice data');
    }
  };

  const handleCustomerSelect = (customer: any | null) => {
    setSelectedCustomer(customer);
    if (customer) {
      setCustomerId(customer.id);
      setCustomerName(customer.name);
      setCustomerPin(customer.pin || '');
      setCustomerAddress(customer.address || '');
      setCustomerLocation(customer.location || '');
    } else {
      setCustomerId(null);
      setCustomerName('');
      setCustomerPin('');
      setCustomerAddress('');
      setCustomerLocation('');
    }
  };

  const handleItemSelect = (index: number, item: Item | null) => {
    const newLines = [...lines];
    newLines[index] = {
      ...newLines[index],
      item_id: item?.id || null,
      item_name: item?.item_name || '',
      description: item?.description || '',
      unit_price: item?.unit_price || 0,
      code: item?.code || '',
      uom: item?.uom || '',
      total: newLines[index].quantity * (item?.unit_price || 0)
    };
    setLines(newLines);
  };

  const handleLineChange = (index: number, field: keyof InvoiceLine, value: any) => {
    const newLines = [...lines];
    newLines[index] = { ...newLines[index], [field]: value };
    
    if (field === 'quantity' || field === 'unit_price') {
      newLines[index].total = newLines[index].quantity * newLines[index].unit_price;
    }
    
    setLines(newLines);
  };

  const fetchInvoiceNumber = async () => {
    try {
      const response = await ApiService.getNextInvoiceNumber();
      console.log('Fetched invoice number response:', response);
      
      if (response.success && response.data?.invoiceNumber) {
        const invoiceNum = response.data.invoiceNumber;
        console.log('Invoice number generated:', invoiceNum);
        setGeneratedInvoiceNumber(invoiceNum);
        return invoiceNum;
      } else {
        console.error('Failed to fetch invoice number:', response.message || 'No message');
      }
    } catch (error) {
      console.error('Error fetching invoice number:', error);
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
    const vatAmount = subtotal * 0.16;
    const totalAmount = subtotal + vatAmount;
    
    return { subtotal: isNaN(subtotal) ? 0 : subtotal, vatAmount: isNaN(vatAmount) ? 0 : vatAmount, totalAmount: isNaN(totalAmount) ? 0 : totalAmount };
  };

  const handleQuotationSelect = async (quotation: Quotation) => {
    setQuotationDialogOpen(false);
    await loadQuotationData(quotation.id);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!customerName || !dueDate || lines.length === 0) {
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
      const invoiceData = {
        customer_id: customerId,
        customer_name: customerName,
        customer_address: customerAddress,
        customer_pin: customerPin,
        due_date: dueDate?.toISOString() || '',
        payment_terms: paymentTerms,
        payment_method: paymentMethod,
        mpesa_code: paymentMethod === 'M-Pesa' ? mpesaCode : '',
        notes,
        quotation_id: selectedQuotationId,
        amountPaid: calculatedAmountPaid,
        paymentMethod: paymentMethod || null,
        lines: lines.map(line => ({
          item_id: line.item_id ? parseInt(line.item_id.toString()) : undefined,
          quantity: parseFloat(line.quantity.toString()),
          unit_price: parseFloat(line.unit_price.toString()),
          description: line.description,
          code: line.code,
          uom: line.uom
        }))
      };

      let response;
      if (isEditMode && invoiceId) {
        response = await ApiService.updateInvoice(parseInt(invoiceId), invoiceData);
        if (response.success) {
          setSuccess('Invoice updated successfully!');
        } else {
          throw new Error(response.message || 'Failed to update invoice');
        }
      } else {
        response = await ApiService.createInvoice(invoiceData);
        if (response.success) {
          const invoiceNumber = response.data?.invoice_number || response.data?.invoiceNumber || 'Unknown';
          setSuccess(`Invoice created successfully! Invoice #${invoiceNumber}`);
        } else {
          throw new Error(response.message || 'Failed to create invoice');
        }
      }
      
      // Navigate to invoice list after a short delay
      setTimeout(() => {
        navigate('/invoices');
      }, 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const { subtotal, vatAmount, totalAmount } = calculateTotals();

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
          <Sidebar title="Invoice Management" />
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
                  {isEditMode ? 'Edit Invoice' : quotationId ? 'Convert Quotation to Invoice' : 'Create Invoice'}
                </Typography>
              </Box>
            </Box>
            <Button
              variant="outlined"
              startIcon={<ListIcon />}
              onClick={() => setQuotationDialogOpen(true)}
              sx={{ width: { xs: '100%', sm: 'auto' } }}
            >
              From Quotation
            </Button>
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

        {/* Selected Quotation Info */}
        {selectedQuotationId && (
          <Alert severity="info" sx={{ mb: 3 }}>
            Converting from Quotation ID: {selectedQuotationId}
          </Alert>
        )}

        <form onSubmit={handleSubmit}>
          {/* Customer Information */}
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ fontSize: { xs: '1rem', md: '1.25rem' } }}>
                Customer Information
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 2 }}>
                  <Box sx={{ flex: 1 }}>
                    <Autocomplete
                      options={customers}
                      getOptionLabel={(option) => option.name}
                      value={selectedCustomer}
                      onChange={(_, newValue) => handleCustomerSelect(newValue)}
                      freeSolo
                      onInputChange={(_, newInputValue) => {
                        if (!selectedCustomer) {
                          setCustomerName(newInputValue);
                        }
                      }}
                      renderInput={(params) => (
                        <TextField
                          {...params}
                          label="Customer Name *"
                          required
                          size="small"
                          placeholder="Search or enter new customer..."
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
                      label="Customer PIN"
                      value={customerPin}
                      onChange={(e) => setCustomerPin(e.target.value)}
                      size="small"
                    />
                  </Box>
                </Box>
                <TextField
                  fullWidth
                  label="Customer Address"
                  multiline
                  rows={3}
                  value={customerAddress}
                  onChange={(e) => setCustomerAddress(e.target.value)}
                  size="small"
                />
              </Box>
            </CardContent>
          </Card>

          {/* Invoice Details */}
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ fontSize: { xs: '1rem', md: '1.25rem' } }}>
                Invoice Details
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
                          description: newValue.description || '',
                          code: newValue.code || '',
                          uom: newValue.uom || '',
                          item_name: newValue.item_name || ''
                        };
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
                            onChange={(e) => handleLineChange(index, 'quantity', parseFloat(e.target.value) || 0)}
                            inputProps={{ min: 0.01, step: 0.01 }}
                            sx={{ width: { xs: 60, md: 100 } }}
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
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1, gap: 2 }}>
                  <Typography variant="body2">Subtotal:</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 'bold' }}>{formatCurrency(subtotal)}</Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1, gap: 2 }}>
                  <Typography variant="body2">VAT (16%):</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 'bold' }}>{formatCurrency(vatAmount)}</Typography>
                </Box>
                <Divider sx={{ my: 1 }} />
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2, gap: 2 }}>
                  <Typography sx={{ fontSize: { xs: '1rem', md: '1.5rem' }, fontWeight: 'bold' }}>Total:</Typography>
                  <Typography sx={{ fontSize: { xs: '1rem', md: '1.5rem' }, fontWeight: 'bold' }}>{formatCurrency(totalAmount)}</Typography>
                </Box>
                
                {/* Payment Information */}
                <Divider sx={{ my: 2 }} />
                <Typography variant="subtitle1" gutterBottom>
                  Payment Information
                </Typography>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1, color: 'primary.main' }}>
                  <Typography>Amount Paid:</Typography>
                  <Typography fontWeight="medium">{formatCurrency(amountPaid)}</Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography>Balance Due:</Typography>
                  <Typography 
                    fontWeight="medium"
                    color={totalAmount - amountPaid > 0 ? 'error.main' : 'success.main'}
                  >
                    {formatCurrency(totalAmount - amountPaid)}
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body2">Status:</Typography>
                  <Chip 
                    label={
                      amountPaid === 0 ? 'Unpaid' :
                      amountPaid >= totalAmount ? 'Paid' : 'Partially Paid'
                    }
                    color={
                      amountPaid === 0 ? 'error' :
                      amountPaid >= totalAmount ? 'success' : 'warning'
                    }
                    size="small"
                  />
                </Box>
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
                      placeholder="e.g., SH12345678"
                      required
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
                if (!customerName || !dueDate || lines.length === 0) {
                  setError('Please fill in all required fields before previewing');
                  return;
                }
                const invalidLines = lines.some(line => !line.item_id || line.quantity <= 0);
                if (invalidLines) {
                  setError('Please ensure all lines have valid items and quantities');
                  return;
                }
                
                // Fetch invoice number before navigating to preview
                const invoiceNumber = await fetchInvoiceNumber();
                
                navigate('/invoice-preview', {
                  state: {
                    lines,
                    customerName,
                    customerAddress,
                    customerPin,
                    documentType: 'invoice',
                    dueDate: dueDate?.toISOString(),
                    paymentTerms,
                    notes,
                    invoiceNumber: invoiceNumber || generatedInvoiceNumber
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
              {loading ? (isEditMode ? 'Updating...' : 'Creating...') : (isEditMode ? 'Update Invoice' : 'Create Invoice')}
            </Button>
          </Box>
        </form>

        {/* Quotation Selection Dialog */}
        <Dialog
          open={quotationDialogOpen}
          onClose={() => setQuotationDialogOpen(false)}
          maxWidth="md"
          fullWidth
        >
          <DialogTitle>Select Quotation to Convert</DialogTitle>
          <DialogContent>
            <List>
              {quotations.map((quotation) => (
                <ListItem key={quotation.id} disablePadding>
                  <ListItemButton onClick={() => handleQuotationSelect(quotation)}>
                    <ListItemText
                      primary={`${quotation.quotation_number} - ${quotation.customer_name}`}
                      secondary={
                        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', mt: 1 }}>
                          <Typography variant="body2">
                            Amount: {formatCurrency(quotation.total_amount)}
                          </Typography>
                          <Typography variant="body2">
                            Valid Until: {format(new Date(quotation.valid_until), 'MMM dd, yyyy')}
                          </Typography>
                          <Chip 
                            label={quotation.status.toUpperCase()} 
                            size="small" 
                            color="success"
                          />
                        </Box>
                      }
                    />
                  </ListItemButton>
                </ListItem>
              ))}
              {quotations.length === 0 && (
                <ListItem>
                  <ListItemText
                    primary="No quotations available"
                    secondary="Create a quotation first to convert it to an invoice"
                  />
                </ListItem>
              )}
            </List>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setQuotationDialogOpen(false)}>Cancel</Button>
          </DialogActions>
        </Dialog>
        </Box>
      </Box>
    </LocalizationProvider>
  );
};

export default CreateInvoiceScreen;