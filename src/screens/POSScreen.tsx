import React, { useState, useEffect } from 'react';
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
} from '@mui/material';
import {
  Delete as DeleteIcon,
  Search as SearchIcon,
  Print as PrintIcon,
  Save as SaveIcon,
  Add as AddIcon,
  Close as CloseIcon,
} from '@mui/icons-material';
import ApiService, { api } from '../services/api';

interface POSItem {
  id: string;
  name: string;
  code: string;
  quantity: number;
  unit: string;
  rate: number;
  vat: number;
  amount: number;
}

interface AvailableItem {
  id: string;
  item_name: string;
  code?: string;
  quantity: number;
  unit: string;
  selling_price: number;
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
  items: POSItem[];
  total: number;
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
  const [paymentDetails, setPaymentDetails] = useState({
    netAmount: 0,
    tendered: 0,
    change: 0,
    cardNumber: '',
    cardType: '',
    bankName: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Fetch available items
  const fetchAvailableItems = async () => {
    try {
      const response = await ApiService.getItems();
      setAvailableItems(response.data?.items || response.items || []);
    } catch (err) {
      setError('Failed to fetch items');
      console.error('Fetch items error:', err);
    }
  };

  // Fetch financial accounts
  const fetchFinancialAccounts = async () => {
    try {
      const response = await ApiService.getFinancialAccounts();
      const data = response.data?.accounts || response.accounts || [];
      setAccounts(data);
      if (Array.isArray(data) && data.length > 0) {
        setSelectedAccount(data[0].id);
      }
    } catch (err) {
      setError('Failed to fetch accounts');
      console.error('Fetch accounts error:', err);
    }
  };

  // Fetch draft invoices
  const fetchDrafts = async () => {
    try {
      const response = await ApiService.getInvoices({ status: 'draft' });
      setDrafts(response.data?.invoices || response.invoices || []);
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

  useEffect(() => {
    fetchAvailableItems();
    fetchFinancialAccounts();
  }, []);

  // Search items
  const handleSearchItems = () => {
    if (searchQuery.trim()) {
      const filtered = availableItems.filter(
        (item) =>
          item.item_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          item.code?.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setAvailableItems(filtered);
    }
  };

  // Add item to POS
  const addItemToPOS = (item: AvailableItem) => {
    const existingItem = posItems.find((i) => i.id === item.id);
    if (existingItem) {
      updateItemQuantity(item.id, existingItem.quantity + 1);
    } else {
      const sellingPrice = Number(item.selling_price) || 0;
      const itemAmount = sellingPrice * 1; // quantity = 1
      const itemVat = itemAmount * 0.16; // 16% VAT
      const newItem: POSItem = {
        id: item.id,
        name: item.item_name,
        code: item.code || '',
        quantity: 1,
        unit: item.unit,
        rate: sellingPrice,
        vat: itemVat,
        amount: itemAmount,
      };
      setPosItems([...posItems, newItem]);
    }
    setSearchOpen(false);
    setSearchQuery('');
  };

  // Update item quantity
  const updateItemQuantity = (itemId: string, quantity: number) => {
    setPosItems(
      posItems.map((item) => {
        if (item.id === itemId) {
          const newQty = Math.max(1, quantity);
          const itemAmount = Number(item.rate) * newQty;
          const itemVat = itemAmount * 0.16; // 16% VAT
          return {
            ...item,
            quantity: newQty,
            amount: itemAmount,
            vat: itemVat,
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
    const vatTotal = posItems.reduce((sum, item) => sum + Number(item.vat || 0), 0);
    const total = subTotal + vatTotal;
    return { subTotal, vatTotal, total };
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
      await ApiService.post('/invoices/draft', {
        items: posItems,
        total,
        account_id: selectedAccount,
      });
      setPosItems([]);
      setError('');
      alert('Invoice saved as draft');
    } catch (err) {
      setError('Failed to save draft');
      console.error('Save draft error:', err);
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
  const saveInvoice = async () => {
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
          description: item.name,
          code: item.code,
          uom: item.unit,
        })),
        notes: `POS Sale - Account: ${accounts.find(a => a.id === selectedAccount)?.account_name || selectedAccount}`,
        due_date: currentDate,
        payment_terms: 'Paid',
      };
      
      // Create invoice using the API
      const result = await ApiService.createInvoice(invoiceData);
      const createdInvoice = result.data?.invoice || result.invoice;
      
      // Update invoice number to POS format
      if (createdInvoice?.id) {
        await api.patch(`/invoices/${createdInvoice.id}`, { 
          invoice_number: invoiceNumber,
          status: 'paid'
        });
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
        // Don't fail the whole operation if balance update fails
      }
      
      alert(`Invoice ${invoiceNumber} saved successfully! Total: ${total.toFixed(2)}`);
      setPosItems([]);
      
      // Refresh financial accounts to show updated balance
      await fetchFinancialAccounts();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to save invoice');
      console.error('Save invoice error:', err);
    } finally {
      setLoading(false);
    }
  };

  // Clear all items and start new invoice
  const addNewInvoice = () => {
    if (posItems.length > 0) {
      const confirmed = window.confirm('Clear current items and start new invoice?');
      if (!confirmed) return;
    }
    setPosItems([]);
    setError('');
  };

  // Retrieve draft
  const retrieveDraft = (draft: DraftInvoice) => {
    setPosItems(draft.items);
    setRetrieveOpen(false);
  };

  // Print receipt
  const printReceipt = () => {
    const { subTotal, vatTotal, total } = calculateTotals();
    const business = JSON.parse(localStorage.getItem('business') || '{}');
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert('Please allow popups to print receipt');
      return;
    }
    
    const receiptHTML = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Receipt</title>
        <style>
          @media print {
            @page { margin: 0.5cm; size: 80mm auto; }
          }
          body {
            font-family: 'Courier New', monospace;
            width: 80mm;
            margin: 0 auto;
            padding: 10px;
            font-size: 12px;
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
          <h2>${business.business_name || 'Invoice App'}</h2>
          <p>${business.address || 'Business Address'}</p>
          <p>Tel: ${business.phone || 'N/A'} | Email: ${business.email || user.email || 'N/A'}</p>
          <p>PIN: ${business.pin || 'N/A'}</p>
        </div>
        
        <div class="info">
          <div style="display: flex; justify-content: space-between;">
            <span>Date:</span>
            <span>${new Date().toLocaleString()}</span>
          </div>
          <div style="display: flex; justify-content: space-between;">
            <span>Cashier:</span>
            <span>${user.first_name || 'N/A'} ${user.last_name || ''}</span>
          </div>
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
            ${posItems.map(item => `
              <tr>
                <td>${item.name}</td>
                <td class="text-center">${item.quantity}</td>
                <td class="text-right">${Number(item.rate).toFixed(2)}</td>
                <td class="text-right">${Number(item.amount).toFixed(2)}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
        
        <div class="totals">
          <div class="totals-row">
            <span>Subtotal:</span>
            <span>${Number(subTotal).toFixed(2)}</span>
          </div>
          <div class="totals-row">
            <span>VAT (16%):</span>
            <span>${Number(vatTotal).toFixed(2)}</span>
          </div>
          <div class="totals-row total-final">
            <span>TOTAL:</span>
            <span>${Number(total).toFixed(2)}</span>
          </div>
        </div>
        
        <div class="footer">
          <p>Thank you for your business!</p>
          <p>Powered by Invoice App</p>
        </div>
        
        <script>
          window.onload = function() {
            window.print();
            setTimeout(function() {
              window.close();
            }, 100);
          };
        </script>
      </body>
      </html>
    `;
    
    printWindow.document.write(receiptHTML);
    printWindow.document.close();
  };

  const { subTotal, vatTotal, total } = calculateTotals();

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

        <Grid container spacing={3}>
          {/* Left: Items Table */}
          <Grid container size={{ xs: 12, md: 9 }}>
            <Paper sx={{ p: 2, borderRadius: 2, boxShadow: 2 }}>
              <Typography variant="h6" fontWeight="bold" sx={{ mb: 2 }}>
                Items
              </Typography>
              <Box sx={{ mb: 2, display: 'flex', gap: 1 }}>
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
                      <TableCell>Name</TableCell>
                      <TableCell align="right">Qty</TableCell>
                      <TableCell>Unit</TableCell>
                      <TableCell align="right">Rate</TableCell>
                      <TableCell align="right">VAT</TableCell>
                      <TableCell align="right">Amount</TableCell>
                      <TableCell align="center">Action</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {posItems.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={8} align="center" sx={{ py: 4, color: '#999' }}>
                          No items added yet
                        </TableCell>
                      </TableRow>
                    ) : (
                      posItems.map((item, index) => (
                        <TableRow key={item.id} sx={{ '&:hover': { backgroundColor: '#f9f9f9' } }}>
                          <TableCell>{index + 1}</TableCell>
                          <TableCell>{item.name || 'N/A'}</TableCell>
                          <TableCell align="right">
                            <TextField
                              type="number"
                              size="small"
                              value={item.quantity || 1}
                              onChange={(e) => updateItemQuantity(item.id, parseInt(e.target.value) || 1)}
                              sx={{ width: 60 }}
                            />
                          </TableCell>
                          <TableCell>{item.unit || 'PCS'}</TableCell>
                          <TableCell align="right">{Number(item.rate || 0).toFixed(2)}</TableCell>
                          <TableCell align="right">{Number(item.vat || 0).toFixed(2)}</TableCell>
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
          </Grid>

          {/* Right: Summary & Actions */}
          <Grid container size={{ xs: 12, md: 3 }}>
            <Paper sx={{ p: 2, borderRadius: 2, boxShadow: 2, backgroundColor: '#f9f9f9' }}>
              <Typography variant="h6" fontWeight="bold" sx={{ mb: 3 }}>
                Summary
              </Typography>
              <Box sx={{ mb: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography>Subtotal:</Typography>
                  <Typography fontWeight="bold">{Number(subTotal).toFixed(2)}</Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography>VAT:</Typography>
                  <Typography fontWeight="bold">{Number(vatTotal).toFixed(2)}</Typography>
                </Box>
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

              <Stack spacing={2}>
                <Button
                  variant="contained"
                  fullWidth
                  onClick={saveInvoice}
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
                  onClick={handlePayment}
                  disabled={posItems.length === 0}
                  sx={{ backgroundColor: '#4caf50', '&:hover': { backgroundColor: '#388e3c' } }}
                >
                  💰 Cash / Card Payment
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
                  onClick={printReceipt}
                  disabled={posItems.length === 0}
                  sx={{ backgroundColor: '#1976d2' }}
                  startIcon={<PrintIcon />}
                >
                  Print Receipt
                </Button>
                <Button
                  variant="outlined"
                  fullWidth
                  onClick={() => setPosItems([])}
                  disabled={posItems.length === 0}
                  sx={{ color: '#d32f2f', borderColor: '#d32f2f' }}
                  startIcon={<DeleteIcon />}
                >
                  Delete Bill
                </Button>
              </Stack>
            </Paper>
          </Grid>
        </Grid>

        {/* Search Items Modal */}
        <Dialog open={searchOpen} onClose={() => setSearchOpen(false)} maxWidth="md" fullWidth>
          <DialogTitle sx={{ backgroundColor: '#1976d2', color: 'white', fontWeight: 'bold' }}>
            Lookup Items
          </DialogTitle>
          <DialogContent sx={{ pt: 2 }}>
            <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
              <TextField
                fullWidth
                placeholder="Search by name or code..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearchItems()}
              />
              <Button variant="contained" onClick={handleSearchItems} sx={{ backgroundColor: '#1976d2' }}>
                Search
              </Button>
            </Box>
            <TableContainer>
              <Table>
                <TableHead sx={{ backgroundColor: '#f5f5f5' }}>
                  <TableRow>
                    <TableCell>Name</TableCell>
                    <TableCell>Code</TableCell>
                    <TableCell align="right">Stock</TableCell>
                    <TableCell align="right">Price</TableCell>
                    <TableCell align="center">Action</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {availableItems.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>{item.item_name || 'Unknown'}</TableCell>
                      <TableCell>{item.code || '-'}</TableCell>
                      <TableCell align="right">{item.quantity || 0}</TableCell>
                      <TableCell align="right">{Number(item.selling_price || 0).toFixed(2)}</TableCell>
                      <TableCell align="center">
                        <Button
                          size="small"
                          variant="contained"
                          onClick={() => addItemToPOS(item)}
                          sx={{ backgroundColor: '#4caf50', '&:hover': { backgroundColor: '#388e3c' } }}
                        >
                          Add
                        </Button>
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
                        <TableRow key={invoice.id} hover>
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
                          primary={draft.invoice_number || 'Draft Invoice'}
                          secondary={`Total: ${Number(draft.total || 0).toFixed(2)} - ${draft.created_at || 'N/A'}`}
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
      </Container>
    </Box>
  );
};

export default POSScreen;
