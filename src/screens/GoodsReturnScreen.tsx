import React, { useState, useEffect } from 'react';
import {
  Container,
  Paper,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Box,
  IconButton,
  Chip,
  Alert,
  Card,
  CardContent,
  Divider,
  Autocomplete
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Receipt as ReceiptIcon,
  KeyboardReturn as ReturnIcon,
  Search as SearchIcon
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers';
import { LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { format } from 'date-fns';
import { ApiService } from '../services/api';
import Sidebar from '../components/Sidebar';

interface GoodsReturn {
  id: number;
  return_number: string;
  invoice_id?: number;
  customer_name: string;
  return_date: string;
  subtotal: number;
  vat_amount: number;
  total_amount: number;
  refund_amount: number;
  refund_method?: string;
  financial_account_id?: number;
  status: 'pending' | 'processed' | 'cancelled';
  reason?: string;
  notes?: string;
  created_at: string;
  lines?: GoodsReturnLine[];
}

interface GoodsReturnLine {
  id?: number;
  item_id: number;
  quantity: number;
  unit_price: number;
  total: number;
  description: string;
  code: string;
  uom: string;
  item_name?: string;
}

interface Invoice {
  id: number;
  invoice_number: string;
  customer_name: string;
  total_amount: number;
  status: string;
  created_at: string;
}

interface Item {
  id: number;
  item_name: string;
  description: string;
  unit_price: number;
  selling_price: number;
  quantity: number;
  code: string;
  uom: string;
}

interface FinancialAccount {
  id: number;
  account_name: string;
  account_type: string;
  current_balance: number;
}

const GoodsReturnScreen: React.FC = () => {
  const [returns, setReturns] = useState<GoodsReturn[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [invoiceSearchOpen, setInvoiceSearchOpen] = useState(false);
  
  // Form data
  const [customerName, setCustomerName] = useState('');
  const [invoiceId, setInvoiceId] = useState<number | null>(null);
  const [returnDate, setReturnDate] = useState<Date | null>(new Date());
  const [reason, setReason] = useState('');
  const [notes, setNotes] = useState('');
  const [refundMethod, setRefundMethod] = useState<string>('');
  const [financialAccountId, setFinancialAccountId] = useState<number | null>(null);
  const [lines, setLines] = useState<GoodsReturnLine[]>([{
    item_id: 0,
    quantity: 1,
    unit_price: 0,
    total: 0,
    description: '',
    code: '',
    uom: '',
    item_name: ''
  }]);

  // Data
  const [items, setItems] = useState<Item[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [financialAccounts, setFinancialAccounts] = useState<FinancialAccount[]>([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Load returns, items, invoices, and financial accounts
      const [returnsRes, itemsRes, invoicesRes, accountsRes] = await Promise.all([
        ApiService.get('/goods-returns'),
        ApiService.getItems(),
        ApiService.getInvoices({ limit: 100 }),
        ApiService.getFinancialAccounts()
      ]);

      if (returnsRes.success) {
        setReturns(returnsRes.data.returns || []);
      }
      
      if (itemsRes.success) {
        setItems(itemsRes.data.items || []);
      }
      
      if (invoicesRes.success) {
        setInvoices(invoicesRes.data.invoices || []);
      }
      
      if (accountsRes.success) {
        setFinancialAccounts(accountsRes.data.accounts || []);
      }
    } catch (err) {
      setError('Failed to load data');
      console.error('Load data error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = () => {
    setDialogOpen(true);
    setError(null);
    setSuccess(null);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    resetForm();
  };

  const resetForm = () => {
    setCustomerName('');
    setInvoiceId(null);
    setReturnDate(new Date());
    setReason('');
    setNotes('');
    setRefundMethod('');
    setFinancialAccountId(null);
    setLines([{
      item_id: 0,
      quantity: 1,
      unit_price: 0,
      total: 0,
      description: '',
      code: '',
      uom: '',
      item_name: ''
    }]);
  };

  const handleInvoiceSelect = async (invoice: Invoice) => {
    try {
      const response = await ApiService.getInvoice(invoice.id);
      if (response.success && response.data.lines) {
        setCustomerName(invoice.customer_name);
        setInvoiceId(invoice.id);
        
        // Pre-fill lines from invoice
        const invoiceLines = response.data.lines.map((line: any) => ({
          item_id: line.item_id,
          quantity: 0, // User will specify return quantity
          unit_price: line.unit_price,
          total: 0,
          description: line.description,
          code: line.code,
          uom: line.uom,
          item_name: line.description
        }));
        
        setLines(invoiceLines);
        setInvoiceSearchOpen(false);
      }
    } catch (err) {
      setError('Failed to load invoice details');
    }
  };

  const addLine = () => {
    setLines([...lines, {
      item_id: 0,
      quantity: 1,
      unit_price: 0,
      total: 0,
      description: '',
      code: '',
      uom: '',
      item_name: ''
    }]);
  };

  const removeLine = (index: number) => {
    if (lines.length > 1) {
      setLines(lines.filter((_, i) => i !== index));
    }
  };

  const updateLine = (index: number, field: keyof GoodsReturnLine, value: any) => {
    const updatedLines = [...lines];
    updatedLines[index] = { ...updatedLines[index], [field]: value };
    
    // Auto-fill item details when item is selected
    if (field === 'item_id' && value) {
      const selectedItem = items.find(item => item.id === value);
      if (selectedItem) {
        updatedLines[index] = {
          ...updatedLines[index],
          description: selectedItem.description || selectedItem.item_name,
          code: selectedItem.code,
          uom: selectedItem.uom || 'PCS',
          unit_price: selectedItem.selling_price || selectedItem.unit_price,
          item_name: selectedItem.item_name
        };
      }
    }
    
    // Calculate total
    if (field === 'quantity' || field === 'unit_price') {
      updatedLines[index].total = updatedLines[index].quantity * updatedLines[index].unit_price;
    }
    
    setLines(updatedLines);
  };

  const calculateTotals = () => {
    const subtotal = lines.reduce((sum, line) => sum + line.total, 0);
    const vatAmount = subtotal * 0.16; // 16% VAT
    const totalAmount = subtotal + vatAmount;
    
    return { subtotal, vatAmount, totalAmount };
  };

  const handleSubmit = async () => {
    try {
      if (!customerName || !returnDate || lines.length === 0) {
        setError('Please fill in all required fields');
        return;
      }

      // Validate that all lines have items and quantities > 0
      const invalidLines = lines.some(line => !line.item_id || line.quantity <= 0);
      if (invalidLines) {
        setError('Please ensure all lines have valid items and quantities');
        return;
      }

      const { subtotal, vatAmount, totalAmount } = calculateTotals();

      const returnData = {
        customer_name: customerName,
        invoice_id: invoiceId,
        return_date: returnDate?.toISOString().split('T')[0],
        reason,
        notes,
        refund_method: refundMethod || undefined,
        financial_account_id: financialAccountId,
        refund_amount: totalAmount,
        lines: lines.map(line => ({
          item_id: line.item_id,
          quantity: line.quantity,
          unit_price: line.unit_price,
          description: line.description,
          code: line.code,
          uom: line.uom
        }))
      };

      const response = await ApiService.post('/goods-returns', returnData);

      if (response.success) {
        setSuccess('Goods return created successfully!');
        await loadData();
        handleCloseDialog();
      } else {
        setError(response.message || 'Failed to create goods return');
      }
    } catch (err) {
      setError('Failed to create goods return');
      console.error('Submit error:', err);
    }
  };

  const processReturn = async (returnId: number) => {
    try {
      const response = await ApiService.put(`/goods-returns/${returnId}/process`);
      if (response.success) {
        setSuccess('Return processed successfully! Stock and accounts updated.');
        await loadData();
      } else {
        setError(response.message || 'Failed to process return');
      }
    } catch (err) {
      setError('Failed to process return');
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES',
      minimumFractionDigits: 2
    }).format(amount);
  };

  const getStatusColor = (status: string): "default" | "primary" | "secondary" | "error" | "info" | "success" | "warning" => {
    switch (status) {
      case 'processed': return 'success';
      case 'cancelled': return 'error';
      default: return 'warning';
    }
  };

  const { subtotal, vatAmount, totalAmount } = calculateTotals();

  if (loading) {
    return (
      <Container>
        <Typography>Loading goods returns...</Typography>
      </Container>
    );
  }

  // Calculate stats for sidebar
  const currentStats = {
    total: returns.length,
    totalValue: returns.reduce((sum, ret) => sum + ret.total_amount, 0),
    statusCounts: {
      pending: returns.filter(ret => ret.status === 'pending').length,
      processed: returns.filter(ret => ret.status === 'processed').length,
      cancelled: returns.filter(ret => ret.status === 'cancelled').length,
    }
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Box sx={{ display: 'flex', width: '100vw', minHeight: '100vh', margin: 0 }}>
        {/* Sidebar - hidden on mobile */}
        <Box sx={{ display: { xs: 'none', md: 'block' } }}>
          <Sidebar 
            title="Goods Returns"
            currentStats={currentStats}
          />
        </Box>

        {/* Main Content */}
        <Box sx={{ 
          marginLeft: { xs: 0, md: '350px' }, 
          width: { xs: '100%', md: 'calc(100vw - 350px - 24px)' }, 
          p: { xs: 2, md: 3 }, 
          paddingRight: { xs: 0, md: '24px' },
          overflow: 'auto'
        }}>
          <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: { xs: 'stretch', sm: 'center' }, flexDirection: { xs: 'column', sm: 'row' }, gap: { xs: 1, sm: 2 } }}>
            <Typography variant="h4" component="h1" sx={{ fontSize: { xs: '1.5rem', md: '2.125rem' }, display: 'flex', alignItems: 'center' }}>
              <ReturnIcon sx={{ mr: 2, fontSize: { xs: 20, md: 28 } }} />
              Goods Returns
            </Typography>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={handleOpenDialog}
              sx={{ width: { xs: '100%', sm: 'auto' } }}
            >
              New Return
            </Button>
          </Box>

          {error && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {error}
          </Alert>
        )}

        {success && (
          <Alert severity="success" sx={{ mb: 3 }}>
            {success}
          </Alert>
          )}

          <TableContainer component={Paper} sx={{ overflowX: { xs: 'auto', md: 'visible' }, fontSize: { xs: '0.75rem', md: '0.875rem' } }}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Return #</TableCell>
                  <TableCell>Customer</TableCell>
                  <TableCell>Date</TableCell>
                  <TableCell>Invoice</TableCell>
                  <TableCell align="right">Amount</TableCell>
                  <TableCell>Refund Method</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell align="center">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {returns.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} align="center">
                    <Typography variant="body2" color="textSecondary">
                      No goods returns found. Create your first return to get started.
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                returns.map((returnItem) => (
                  <TableRow key={returnItem.id}>
                    <TableCell>{returnItem.return_number}</TableCell>
                    <TableCell>{returnItem.customer_name}</TableCell>
                    <TableCell>{format(new Date(returnItem.return_date), 'MMM dd, yyyy')}</TableCell>
                    <TableCell>
                      {returnItem.invoice_id ? `INV-${returnItem.invoice_id}` : '-'}
                    </TableCell>
                    <TableCell align="right">
                      {formatCurrency(returnItem.total_amount)}
                    </TableCell>
                    <TableCell>
                      {returnItem.refund_method ? returnItem.refund_method.replace('_', ' ').toUpperCase() : '-'}
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={returnItem.status.toUpperCase()}
                        color={getStatusColor(returnItem.status)}
                        size="small"
                      />
                    </TableCell>
                    <TableCell align="center">
                      {returnItem.status === 'pending' && (
                        <Button
                          size="small"
                          variant="contained"
                          color="success"
                          onClick={() => processReturn(returnItem.id)}
                        >
                          Process
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
              </TableBody>
            </Table>
          </TableContainer>

          {/* Create Return Dialog */}
          <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="lg" fullWidth>
            <DialogTitle>Create Goods Return</DialogTitle>
            <DialogContent>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, pt: 2 }}>
              {/* Customer Information */}
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>Customer Information</Typography>
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
                      <Button
                        fullWidth
                        variant="outlined"
                        startIcon={<SearchIcon />}
                        onClick={() => setInvoiceSearchOpen(true)}
                        sx={{ height: '56px' }}
                      >
                        {invoiceId ? `From Invoice INV-${invoiceId}` : 'Link to Invoice (Optional)'}
                      </Button>
                    </Box>
                  </Box>
                </CardContent>
              </Card>

              {/* Return Details */}
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>Return Details</Typography>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                    <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
                      <Box sx={{ flex: 1, minWidth: '300px' }}>
                        <DatePicker
                          label="Return Date *"
                          value={returnDate}
                          onChange={(newValue) => setReturnDate(newValue)}
                          slotProps={{
                            textField: {
                              fullWidth: true,
                              required: true
                            }
                          }}
                        />
                      </Box>
                      <Box sx={{ flex: 1, minWidth: '300px' }}>
                        <TextField
                          fullWidth
                          label="Reason for Return"
                          value={reason}
                          onChange={(e) => setReason(e.target.value)}
                        />
                      </Box>
                    </Box>
                    <TextField
                      fullWidth
                      label="Notes"
                      multiline
                      rows={2}
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                    />
                  </Box>
                </CardContent>
              </Card>

              {/* Return Items */}
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Typography variant="h6">Return Items</Typography>
                    <Button startIcon={<AddIcon />} onClick={addLine}>
                      Add Item
                    </Button>
                  </Box>
                  
                  <TableContainer>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>Item</TableCell>
                          <TableCell>Description</TableCell>
                          <TableCell>Qty</TableCell>
                          <TableCell>Unit Price</TableCell>
                          <TableCell>Total</TableCell>
                          <TableCell></TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {lines.map((line, index) => (
                          <TableRow key={index}>
                            <TableCell>
                              <Autocomplete
                                options={items}
                                getOptionLabel={(option) => `${option.code} - ${option.item_name}`}
                                value={items.find(item => item.id === line.item_id) || null}
                                onChange={(_, newValue) => updateLine(index, 'item_id', newValue?.id || 0)}
                                renderInput={(params) => (
                                  <TextField {...params} size="small" sx={{ minWidth: 200 }} />
                                )}
                              />
                            </TableCell>
                            <TableCell>
                              <TextField
                                size="small"
                                value={line.description}
                                onChange={(e) => updateLine(index, 'description', e.target.value)}
                                sx={{ minWidth: 150 }}
                              />
                            </TableCell>
                            <TableCell>
                              <TextField
                                size="small"
                                type="number"
                                value={line.quantity}
                                onChange={(e) => updateLine(index, 'quantity', parseFloat(e.target.value) || 0)}
                                sx={{ width: 80 }}
                                inputProps={{ min: 0, step: 0.01 }}
                              />
                            </TableCell>
                            <TableCell>
                              <TextField
                                size="small"
                                type="number"
                                value={line.unit_price}
                                onChange={(e) => updateLine(index, 'unit_price', parseFloat(e.target.value) || 0)}
                                sx={{ width: 100 }}
                                inputProps={{ min: 0, step: 0.01 }}
                              />
                            </TableCell>
                            <TableCell>{formatCurrency(line.total)}</TableCell>
                            <TableCell>
                              <IconButton
                                size="small"
                                onClick={() => removeLine(index)}
                                disabled={lines.length === 1}
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

              {/* Refund Information */}
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>Refund Information</Typography>
                  <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap', mb: 3 }}>
                    <Box sx={{ flex: 1, minWidth: '300px' }}>
                      <FormControl fullWidth>
                        <InputLabel>Refund Method</InputLabel>
                        <Select
                          value={refundMethod}
                          onChange={(e) => setRefundMethod(e.target.value)}
                          label="Refund Method"
                        >
                          <MenuItem value="cash">Cash</MenuItem>
                          <MenuItem value="bank">Bank Transfer</MenuItem>
                          <MenuItem value="mobile_money">Mobile Money</MenuItem>
                          <MenuItem value="credit_note">Credit Note</MenuItem>
                        </Select>
                      </FormControl>
                    </Box>
                    <Box sx={{ flex: 1, minWidth: '300px' }}>
                      <FormControl fullWidth>
                        <InputLabel>Financial Account</InputLabel>
                        <Select
                          value={financialAccountId || ''}
                          onChange={(e) => setFinancialAccountId(Number(e.target.value) || null)}
                          label="Financial Account"
                          disabled={!refundMethod || refundMethod === 'credit_note'}
                        >
                          {financialAccounts.map((account) => (
                            <MenuItem key={account.id} value={account.id}>
                              {account.account_name} ({formatCurrency(account.current_balance)})
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </Box>
                  </Box>

                  {/* Totals */}
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
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="h6">Total Refund:</Typography>
                      <Typography variant="h6">{formatCurrency(totalAmount)}</Typography>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseDialog}>Cancel</Button>
            <Button onClick={handleSubmit} variant="contained">
              Create Return
            </Button>
          </DialogActions>
          </Dialog>

          {/* Invoice Search Dialog */}
          <Dialog open={invoiceSearchOpen} onClose={() => setInvoiceSearchOpen(false)} maxWidth="md" fullWidth>
            <DialogTitle>Select Invoice</DialogTitle>
            <DialogContent>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Invoice #</TableCell>
                    <TableCell>Customer</TableCell>
                    <TableCell>Amount</TableCell>
                    <TableCell>Date</TableCell>
                    <TableCell>Action</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {invoices.map((invoice) => (
                    <TableRow key={invoice.id}>
                      <TableCell>{invoice.invoice_number}</TableCell>
                      <TableCell>{invoice.customer_name}</TableCell>
                      <TableCell>{formatCurrency(invoice.total_amount)}</TableCell>
                      <TableCell>{format(new Date(invoice.created_at), 'MMM dd, yyyy')}</TableCell>
                      <TableCell>
                        <Button
                          size="small"
                          variant="contained"
                          onClick={() => handleInvoiceSelect(invoice)}
                        >
                          Select
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setInvoiceSearchOpen(false)}>Cancel</Button>
            </DialogActions>
          </Dialog>
        </Box>
      </Box>
    </LocalizationProvider>
  );
};

export default GoodsReturnScreen;