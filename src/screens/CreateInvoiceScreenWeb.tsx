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
  ArrowBack as BackIcon,
  List as ListIcon,
} from '@mui/icons-material';
import { useNavigate, useParams } from 'react-router-dom';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { ApiService } from '../services/api';
import { format } from 'date-fns';

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
  
  // Invoice form data
  const [customerName, setCustomerName] = useState('');
  const [customerAddress, setCustomerAddress] = useState('');
  const [customerPin, setCustomerPin] = useState('');
  const [dueDate, setDueDate] = useState<Date | null>(
    new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days from now
  );
  const [paymentTerms, setPaymentTerms] = useState('Net 30 Days');
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
  const [paymentMethod, setPaymentMethod] = useState<string>('');
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
          setLines(quotation.lines.map((line: any) => ({
            item_id: line.item_id,
            quantity: line.quantity,
            unit_price: line.unit_price,
            total: line.total,
            description: line.description,
            code: line.code,
            uom: line.uom,
            item_name: line.item_name
          })));
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
        setPaymentTerms(invoice.payment_terms || 'Net 30 Days');
        setDueDate(invoice.due_date ? new Date(invoice.due_date) : null);
        setSelectedQuotationId(invoice.quotation_id || null);
        
        // Convert invoice lines to editable format
        if (invoice.lines) {
          setLines(invoice.lines.map((line: any) => ({
            item_id: line.item_id,
            quantity: line.quantity,
            unit_price: line.unit_price,
            total: line.total,
            description: line.description,
            code: line.code,
            uom: line.uom,
            item_name: line.item_name
          })));
        }
      }
    } catch (err) {
      console.error('Error loading invoice:', err);
      setError('Failed to load invoice data');
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
    const subtotal = lines.reduce((sum, line) => sum + line.total, 0);
    const vatAmount = subtotal * 0.16;
    const totalAmount = subtotal + vatAmount;
    
    return { subtotal, vatAmount, totalAmount };
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

    setLoading(true);
    setError(null);

    try {
      const invoiceData = {
        customer_name: customerName,
        customer_address: customerAddress,
        customer_pin: customerPin,
        due_date: dueDate?.toISOString() || '',
        payment_terms: paymentTerms,
        notes,
        quotation_id: selectedQuotationId,
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
          setSuccess('Invoice created successfully!');
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

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES'
    }).format(amount);
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Box sx={{ p: 3 }}>
        {/* Header */}
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
          <IconButton onClick={() => navigate('/invoices')} sx={{ mr: 2 }}>
            <BackIcon />
          </IconButton>
          <InvoiceIcon sx={{ mr: 2, fontSize: 32 }} />
          <Typography variant="h4" component="h1" sx={{ flex: 1 }}>
            {isEditMode ? 'Edit Invoice' : quotationId ? 'Convert Quotation to Invoice' : 'Create Invoice'}
          </Typography>
          <Button
            variant="outlined"
            startIcon={<ListIcon />}
            onClick={() => setQuotationDialogOpen(true)}
            sx={{ ml: 2 }}
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
              <Typography variant="h6" gutterBottom>
                Customer Information
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
                  <Box sx={{ flex: 1, minWidth: '300px' }}>
                    <TextField
                      fullWidth
                      label="Customer Name *"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      required
                    />
                  </Box>
                  <Box sx={{ flex: 1, minWidth: '300px' }}>
                    <TextField
                      fullWidth
                      label="Customer PIN"
                      value={customerPin}
                      onChange={(e) => setCustomerPin(e.target.value)}
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
                />
              </Box>
            </CardContent>
          </Card>

          {/* Invoice Details */}
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Invoice Details
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
                  <Box sx={{ flex: 1, minWidth: '300px' }}>
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
                        <MenuItem value="Net 30 Days">Net 30 Days</MenuItem>
                        <MenuItem value="Net 15 Days">Net 15 Days</MenuItem>
                        <MenuItem value="Due on Receipt">Due on Receipt</MenuItem>
                        <MenuItem value="Cash on Delivery">Cash on Delivery</MenuItem>
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
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6">
                  Items
                </Typography>
                <Button startIcon={<AddIcon />} onClick={addLine}>
                  Add Item
                </Button>
              </Box>

              <TableContainer component={Paper} variant="outlined">
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Item</TableCell>
                      <TableCell>Quantity</TableCell>
                      <TableCell>Unit Price</TableCell>
                      <TableCell>Total</TableCell>
                      <TableCell width={50}></TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {lines.map((line, index) => (
                      <TableRow key={index}>
                        <TableCell sx={{ minWidth: 300 }}>
                          <Autocomplete
                            options={items}
                            getOptionLabel={(option) => `${option.item_name} (${option.code})`}
                            value={items.find(item => item.id === line.item_id) || null}
                            onChange={(_, newValue) => handleItemSelect(index, newValue)}
                            renderInput={(params) => (
                              <TextField
                                {...params}
                                label="Select Item"
                                size="small"
                                required
                              />
                            )}
                          />
                        </TableCell>
                        <TableCell>
                          <TextField
                            type="number"
                            size="small"
                            value={line.quantity}
                            onChange={(e) => handleLineChange(index, 'quantity', parseFloat(e.target.value) || 0)}
                            inputProps={{ min: 0.01, step: 0.01 }}
                            sx={{ width: 100 }}
                          />
                        </TableCell>
                        <TableCell>
                          <TextField
                            type="number"
                            size="small"
                            value={line.unit_price}
                            onChange={(e) => handleLineChange(index, 'unit_price', parseFloat(e.target.value) || 0)}
                            inputProps={{ min: 0, step: 0.01 }}
                            sx={{ width: 120 }}
                          />
                        </TableCell>
                        <TableCell>
                          {formatCurrency(line.total)}
                        </TableCell>
                        <TableCell>
                          <IconButton
                            onClick={() => removeLine(index)}
                            disabled={lines.length === 1}
                            color="error"
                          >
                            <DeleteIcon />
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
              <Typography variant="h6" gutterBottom>
                Summary
              </Typography>
              <Box sx={{ maxWidth: 400, ml: 'auto' }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography>Subtotal:</Typography>
                  <Typography>{formatCurrency(subtotal)}</Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography>VAT (16%):</Typography>
                  <Typography>{formatCurrency(vatAmount)}</Typography>
                </Box>
                <Divider sx={{ my: 1 }} />
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                  <Typography variant="h6">Total:</Typography>
                  <Typography variant="h6">{formatCurrency(totalAmount)}</Typography>
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
                        min: 0,
                        max: totalAmount
                      }}
                      helperText={`Max: ${formatCurrency(totalAmount)}`}
                    />
                  </Box>
                  <Box sx={{ flex: 1, minWidth: '300px' }}>
                    <FormControl fullWidth>
                      <InputLabel>Payment Method</InputLabel>
                      <Select
                        value={paymentMethod}
                        onChange={(e) => setPaymentMethod(e.target.value)}
                        label="Payment Method"
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
                    </FormControl>
                  </Box>
                </Box>
              </Box>
            </CardContent>
          </Card>

          {/* Submit Button */}
          <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
            <Button
              type="submit"
              variant="contained"
              color="primary"
              size="large"
              startIcon={<SaveIcon />}
              disabled={loading}
            >
              {loading ? (isEditMode ? 'Updating Invoice...' : 'Creating Invoice...') : (isEditMode ? 'Update Invoice' : 'Create Invoice')}
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
    </LocalizationProvider>
  );
};

export default CreateInvoiceScreen;