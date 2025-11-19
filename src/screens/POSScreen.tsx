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
import Sidebar from '../components/Sidebar';
import ApiService from '../services/api';

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
  id: string;
  account_name: string;
  account_type: string;
  balance: number;
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
      const response = await ApiService.get('/api/items');
      setAvailableItems(response.data || response);
    } catch (err) {
      setError('Failed to fetch items');
    }
  };

  // Fetch financial accounts
  const fetchFinancialAccounts = async () => {
    try {
      const response = await ApiService.get('/api/financial-accounts');
      const data = response.data || response;
      setAccounts(data);
      if (Array.isArray(data) && data.length > 0) {
        setSelectedAccount(data[0].id);
      }
    } catch (err) {
      setError('Failed to fetch accounts');
    }
  };

  // Fetch draft invoices
  const fetchDrafts = async () => {
    try {
      const response = await ApiService.get('/api/invoices?status=draft');
      setDrafts(response.data || response);
    } catch (err) {
      setError('Failed to fetch drafts');
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
      const newItem: POSItem = {
        id: item.id,
        name: item.item_name,
        code: item.code || '',
        quantity: 1,
        unit: item.unit,
        rate: item.selling_price,
        vat: 0,
        amount: item.selling_price,
      };
      setPosItems([...posItems, newItem]);
    }
    setSearchOpen(false);
    setSearchQuery('');
  };

  // Update item quantity
  const updateItemQuantity = (itemId: string, quantity: number) => {
    setPosItems(
      posItems.map((item) =>
        item.id === itemId
          ? {
              ...item,
              quantity: Math.max(1, quantity),
              amount: item.rate * Math.max(1, quantity),
            }
          : item
      )
    );
  };

  // Delete item from POS
  const deleteItem = (itemId: string) => {
    setPosItems(posItems.filter((item) => item.id !== itemId));
  };

  // Calculate totals
  const calculateTotals = () => {
    const subTotal = posItems.reduce((sum, item) => sum + item.amount, 0);
    const vatTotal = posItems.reduce((sum, item) => sum + item.vat, 0);
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
      await ApiService.post('/api/invoices/draft', {
        items: posItems,
        total,
        account_id: selectedAccount,
      });
      setPosItems([]);
      setError('');
      alert('Invoice saved as draft');
    } catch (err) {
      setError('Failed to save draft');
    } finally {
      setLoading(false);
    }
  };

  // Retrieve draft
  const retrieveDraft = (draft: DraftInvoice) => {
    setPosItems(draft.items);
    setRetrieveOpen(false);
  };

  // Print receipt
  const printReceipt = () => {
    window.print();
  };

  const { subTotal, vatTotal, total } = calculateTotals();

  return (
    <Box sx={{ display: 'flex', width: '100vw', minHeight: '100vh', margin: 0 }}>
      <Box sx={{ display: { xs: 'none', md: 'block' } }}>
        <Sidebar title="POS Management" />
      </Box>
      <Box
        sx={{
          marginLeft: { xs: 0, md: '350px' },
          width: { xs: '100%', md: 'calc(100vw - 350px - 24px)' },
          p: { xs: 2, md: 3 },
          paddingRight: { xs: 0, md: '24px' },
          overflow: 'auto',
        }}
      >
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
          <Grid container size={{ xs: 12, md: 8 }}>
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
                  onClick={() => setSearchInvoiceOpen(true)}
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
                          <TableCell>{item.name}</TableCell>
                          <TableCell align="right">
                            <TextField
                              type="number"
                              size="small"
                              value={item.quantity}
                              onChange={(e) => updateItemQuantity(item.id, parseInt(e.target.value))}
                              sx={{ width: 60 }}
                            />
                          </TableCell>
                          <TableCell>{item.unit}</TableCell>
                          <TableCell align="right">{item.rate.toFixed(2)}</TableCell>
                          <TableCell align="right">{item.vat.toFixed(2)}</TableCell>
                          <TableCell align="right" sx={{ fontWeight: 'bold' }}>
                            {item.amount.toFixed(2)}
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
          <Grid container size={{ xs: 12, md: 4 }}>
            <Paper sx={{ p: 2, borderRadius: 2, boxShadow: 2, backgroundColor: '#f9f9f9' }}>
              <Typography variant="h6" fontWeight="bold" sx={{ mb: 3 }}>
                Summary
              </Typography>
              <Box sx={{ mb: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography>Subtotal:</Typography>
                  <Typography fontWeight="bold">{subTotal.toFixed(2)}</Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography>VAT:</Typography>
                  <Typography fontWeight="bold">{vatTotal.toFixed(2)}</Typography>
                </Box>
                <Divider sx={{ my: 1 }} />
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                  <Typography variant="h6" fontWeight="bold">
                    Total:
                  </Typography>
                  <Typography variant="h6" fontWeight="bold" sx={{ color: '#1976d2' }}>
                    {total.toFixed(2)}
                  </Typography>
                </Box>
              </Box>

              <Stack spacing={2}>
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
                      <TableCell>{item.item_name}</TableCell>
                      <TableCell>{item.code || '-'}</TableCell>
                      <TableCell align="right">{item.quantity}</TableCell>
                      <TableCell align="right">{item.selling_price.toFixed(2)}</TableCell>
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
              placeholder="Enter invoice number..."
              value={invoiceSearchQuery}
              onChange={(e) => setInvoiceSearchQuery(e.target.value)}
              sx={{ mb: 2 }}
            />
            <Typography color="textSecondary">Invoice search results will appear here</Typography>
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
                          primary={draft.invoice_number}
                          secondary={`Total: ${draft.total.toFixed(2)} - ${draft.created_at}`}
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
                    {account.account_name} ({account.account_type}) - Balance: {account.balance.toFixed(2)}
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
      </Box>
    </Box>
  );
};

export default POSScreen;
