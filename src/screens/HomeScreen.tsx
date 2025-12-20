import React, { useState, useEffect } from 'react';
import {
  Container,
  Card,
  CardContent,
  Typography,
  Button,
  Box,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
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
  Chip,
  Alert,
  TextField,
  CircularProgress,
} from '@mui/material';
import {
  Add as AddIcon,
  Receipt as InvoiceIcon,
  Description as QuotationIcon,
  List as ListIcon,
  Inventory as ItemIcon,
  AccountCircle as SignatureIcon,
  Settings as SettingsIcon,
  KeyboardReturn as ReturnIcon,
  ReportProblem as DamageIcon,
  Analytics as AnalyticsIcon,
  Store as StoreIcon,
  LocalHospital as HospitalIcon,
  Storage as DatabaseIcon,
  Warning as WarningIcon,
  TrendingUp as TrendingUpIcon,
  People as PeopleIcon,
  AccountBalance as AccountBalanceIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { ApiService } from '../services/api';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface ExpiringItem {
  id: number;
  item_name: string;
  expiry_date: string;
  quantity: number;
  category_name?: string;
}

interface FinancialAccount {
  id: number;
  account_name: string;
  account_type: string;
  current_balance: number;
}

interface TransactionHistory {
  date: string;
  account_id: number;
  account_name: string;
  balance: number;
  transactions: number;
  total_inflow: number;
  total_outflow: number;
  total_amount?: number;
}

const HomeScreen: React.FC = () => {
  const navigate = useNavigate();
  const { business, user } = useAuth();
  const [businessName, setBusinessName] = useState<string>('');
  const [advanceOpen, setAdvanceOpen] = useState(false);

  // Expiring items state
  const [expiringItems, setExpiringItems] = useState<ExpiringItem[]>([]);
  const [expiryFilter, setExpiryFilter] = useState<'expired' | 'today' | 'week' | 'month' | 'custom'>('week');
  const [customStartDate, setCustomStartDate] = useState<string>('');
  const [customEndDate, setCustomEndDate] = useState<string>('');
  const [loadingExpiring, setLoadingExpiring] = useState(false);

  // Financial accounts state
  const [financialAccounts, setFinancialAccounts] = useState<FinancialAccount[]>([]);
  const [selectedAccount, setSelectedAccount] = useState<number | null>(null);
  const [accountFilter, setAccountFilter] = useState<'today' | 'week' | 'month' | 'custom'>('week');
  const [accountCustomStartDate, setAccountCustomStartDate] = useState<string>('');
  const [accountCustomEndDate, setAccountCustomEndDate] = useState<string>('');
  const [transactionHistory, setTransactionHistory] = useState<TransactionHistory[]>([]);
  const [loadingAccounts, setLoadingAccounts] = useState(false);

  // Fetch business settings to get business name
  useEffect(() => {
    const fetchBusinessSettings = async () => {
      try {
        const data = await ApiService.getBusinessSettings();
        if (data.success && data.data && data.data.businessName) {
          setBusinessName(data.data.businessName);
        }
      } catch (error) {
        console.error('Error fetching business settings:', error);
        const savedSettings = localStorage.getItem('businessSettings');
        if (savedSettings) {
          const settings = JSON.parse(savedSettings);
          if (settings.businessName) {
            setBusinessName(settings.businessName);
          }
        }
      }
    };

    fetchBusinessSettings();
  }, []);

  // Fetch expiring items
  useEffect(() => {
    fetchExpiringItems();
  }, [expiryFilter, customStartDate, customEndDate]);

  // Fetch financial accounts and transaction history
  useEffect(() => {
    fetchFinancialAccounts();
  }, []);

  useEffect(() => {
    if (financialAccounts.length > 0) {
      fetchTransactionHistory();
    }
  }, [selectedAccount, accountFilter, accountCustomStartDate, accountCustomEndDate, financialAccounts]);

  const fetchExpiringItems = async () => {
    try {
      setLoadingExpiring(true);
      const params: any = { filter: expiryFilter };
      if (expiryFilter === 'custom') {
        if (customStartDate) params.startDate = customStartDate;
        if (customEndDate) params.endDate = customEndDate;
      }
      const response = await ApiService.getItemsByExpiry(params);
      if (response.success && response.data) {
        setExpiringItems(response.data.items || []);
      }
    } catch (error) {
      console.error('Error fetching expiring items:', error);
    } finally {
      setLoadingExpiring(false);
    }
  };

  const fetchFinancialAccounts = async () => {
    try {
      const response = await ApiService.getFinancialAccounts();
      if (response.success && response.data) {
        const accounts = response.data.accounts || response.data.data?.accounts || [];
        setFinancialAccounts(accounts);
        if (accounts.length > 0 && !selectedAccount) {
          setSelectedAccount(null); // Show all accounts by default
        }
      }
    } catch (error) {
      console.error('Error fetching financial accounts:', error);
    }
  };

  const fetchTransactionHistory = async () => {
    try {
      setLoadingAccounts(true);
      const params: any = { filter: accountFilter };
      if (selectedAccount) {
        params.accountId = selectedAccount;
      }
      if (accountFilter === 'custom') {
        if (accountCustomStartDate) params.startDate = accountCustomStartDate;
        if (accountCustomEndDate) params.endDate = accountCustomEndDate;
      }
      const response = await ApiService.getAccountTransactionHistory(params);
      if (response.success && response.data) {
        setTransactionHistory(response.data.history || []);
      }
    } catch (error) {
      console.error('Error fetching transaction history:', error);
    } finally {
      setLoadingAccounts(false);
    }
  };

  const getDaysUntilExpiry = (expiryDate: string): number => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const expiry = new Date(expiryDate);
    expiry.setHours(0, 0, 0, 0);
    const diffTime = expiry.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const prepareChartData = () => {
    // Group by date and account - show total transaction amounts per day
    const dateMap = new Map<string, { [key: string]: number | string }>();
    
    transactionHistory.forEach(item => {
      if (!dateMap.has(item.date)) {
        dateMap.set(item.date, { rawDate: item.date });
      }
      const dateData = dateMap.get(item.date)!;
      // Use total_inflow as the value for the graph (money coming in)
      const currentValue = dateData[item.account_name];
      dateData[item.account_name] = ((typeof currentValue === 'number' ? currentValue : 0) + item.total_inflow);
    });

    // Convert to array format for chart
    const chartData: any[] = [];
    dateMap.forEach((accounts, date) => {
      const accountEntries: { [key: string]: number } = {};
      Object.entries(accounts).forEach(([key, value]) => {
        if (key !== 'rawDate' && typeof value === 'number') {
          accountEntries[key] = value;
        }
      });
      chartData.push({
        date: new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        rawDate: accounts.rawDate as string,
        ...accountEntries
      });
    });

    // Sort by raw date
    chartData.sort((a, b) => new Date(a.rawDate).getTime() - new Date(b.rawDate).getTime());

    return chartData;
  };

  const chartData = prepareChartData();
  const uniqueAccountNames = Array.from(new Set(transactionHistory.map(t => t.account_name)));

  // Generate colors for accounts
  const colors = ['#1976d2', '#2e7d32', '#ed6c02', '#d32f2f', '#9c27b0', '#0288d1', '#388e3c'];

  return (
    <Box sx={{ 
      display: 'flex', 
      justifyContent: 'center', 
      width: '100vw', 
      minHeight: '100vh',
      padding: { xs: 2, sm: 3, md: 4 },
      boxSizing: 'border-box'
    }}>
      <Box sx={{ 
        width: '100%', 
        maxWidth: '1400px',
        display: 'flex',
        flexDirection: 'column',
        gap: 3
      }}>
        {/* Welcome Section */}
        <Card sx={{ elevation: 4 }}>
          <CardContent>
            <Typography variant="h4" component="h1" gutterBottom align="center" color="primary">
              Welcome to Invoice App
            </Typography>
            <Typography variant="h6" align="center" color="text.secondary">
              Create professional quotations and invoices for your business
            </Typography>
            {business && (
              <Typography variant="body1" align="center" sx={{ mt: 2 }}>
                Business: <strong>{businessName || business.name}</strong> | User: <strong>{user?.first_name} {user?.last_name}</strong>
              </Typography>
            )}
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card sx={{ elevation: 4 }}>
          <CardContent>
            <Typography variant="h5" gutterBottom color="primary">
              Quick Actions
            </Typography>
          
            <Box sx={{ 
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: 2,
              mt: 1
            }}>
              <Button
                fullWidth
                variant="contained"
                startIcon={<StoreIcon />}
                onClick={() => navigate('/pos')}
                sx={{
                  py: 2,
                  bgcolor: '#1976d2',
                  '&:hover': { bgcolor: '#1565c0' }
                }}
              >
                POS System
              </Button>

              {/* Advance package button (contains Salon, Service Billing, Hospital links) */}
              <Button
                fullWidth
                variant="contained"
                onClick={() => setAdvanceOpen(true)}
                sx={{
                  py: 2,
                  bgcolor: '#00796b',
                  '&:hover': { bgcolor: '#00695c' }
                }}
              >
                Advance Package
              </Button>

              {/* Invoice Management */}
              <Button
                fullWidth
                variant="contained"
                startIcon={<InvoiceIcon />}
                onClick={() => navigate('/invoices')}
                sx={{
                  py: 2,
                  bgcolor: '#0066ff',
                  '&:hover': { bgcolor: '#0056d3' }
                }}
              >
                Invoices
              </Button>

              <Button
                fullWidth
                variant="contained"
                startIcon={<QuotationIcon />}
                onClick={() => navigate('/quotations')}
                sx={{
                  py: 2,
                  bgcolor: '#2e7d32',
                  '&:hover': { bgcolor: '#1b5e20' }
                }}
              >
                Quotations
              </Button>
              
              <Button
                fullWidth
                variant="outlined"
                startIcon={<InvoiceIcon />}
                onClick={() => navigate('/create-invoice')}
                sx={{ py: 2, borderColor: '#0066ff', color: '#0066ff' }}
              >
                Create Invoice
              </Button>

              <Button
                fullWidth
                variant="outlined"
                startIcon={<QuotationIcon />}
                onClick={() => navigate('/create-quotation')}
                sx={{ py: 2, borderColor: '#2e7d32', color: '#2e7d32' }}
              >
                Create Quotation
              </Button>
              
              <Button
                fullWidth
                variant="outlined"
                startIcon={<ItemIcon />}
                onClick={() => navigate('/customers')}
                sx={{ py: 2, borderColor: '#9c27b0', color: '#9c27b0' }}
              >
                👥 Customers
              </Button>
              
              <Button
                fullWidth
                variant="outlined"
                startIcon={<ItemIcon />}
                onClick={() => navigate('/customer-invoices-list')}
                sx={{ py: 2, borderColor: '#1976d2', color: '#1976d2' }}
              >
                📊 Customer Invoices
              </Button>
              
              {/* Item Management */}
              <Button
                fullWidth
                variant="outlined"
                startIcon={<ItemIcon />}
                onClick={() => navigate('/items-list')}
                sx={{ py: 2 }}
              >
                Items
              </Button>
              
              <Button
                fullWidth
                variant="outlined"
                startIcon={<AddIcon />}
                onClick={() => navigate('/item-categories')}
                sx={{ py: 2, borderColor: '#ff9800', color: '#ff9800' }}
              >
                📂 Item Categories
              </Button>
              
              <Button
                fullWidth
                variant="outlined"
                startIcon={<AddIcon />}
                onClick={() => navigate('/add-item')}
                sx={{ py: 2 }}
              >
                Add Item
              </Button>
              
              {/* Inventory Management */}
              <Button
                fullWidth
                variant="outlined"
                startIcon={<ReturnIcon />}
                onClick={() => navigate('/goods-returns')}
                sx={{ py: 2, borderColor: '#4CAF50', color: '#4CAF50' }}
              >
                Goods Returns
              </Button>
              
              <Button
                fullWidth
                variant="outlined"
                startIcon={<DamageIcon />}
                onClick={() => navigate('/damage-tracking')}
                sx={{ py: 2, borderColor: '#FF5722', color: '#FF5722' }}
              >
                Damage Tracking
              </Button>
              
              {/* Settings */}
              <Button
                fullWidth
                variant="outlined"
                startIcon={<SignatureIcon />}
                onClick={() => navigate('/order-signatures')}
                sx={{ py: 2 }}
              >
                Signatures
              </Button>
              
              <Button
                fullWidth
                variant="outlined"
                startIcon={<AnalyticsIcon />}
                onClick={() => navigate('/analytics')}
                sx={{ py: 2, borderColor: '#9C27B0', color: '#9C27B0' }}
              >
                Analytics
              </Button>
              
              <Button
                fullWidth
                variant="outlined"
                startIcon={<PeopleIcon />}
                onClick={() => navigate('/users-management')}
                sx={{ py: 2, borderColor: '#1976d2', color: '#1976d2' }}
              >
                👥 Users Management
              </Button>
              
              {user?.can_access_financial_accounts && (
                <Button
                  fullWidth
                  variant="outlined"
                  startIcon={<AccountBalanceIcon />}
                  onClick={() => navigate('/financial-accounts')}
                  sx={{ py: 2, borderColor: '#00C853', color: '#00C853' }}
                >
                  💰 Financial Accounts
                </Button>
              )}
              
              <Button
                fullWidth
                variant="outlined"
                startIcon={<SettingsIcon />}
                onClick={() => navigate('/business-settings')}
                sx={{ py: 2 }}
              >
                Settings
              </Button>

              <Button
                fullWidth
                variant="outlined"
                startIcon={<DatabaseIcon />}
                onClick={() => navigate('/database-settings')}
                sx={{ py: 2, borderColor: '#1976D2', color: '#1976D2' }}
              >
                Database Settings
              </Button>

              {/* Previously Salon/Hospital buttons moved to Advance Package modal */}
            </Box>
          </CardContent>
        </Card>

        {/* Expiring Items Section */}
        <Card sx={{ elevation: 4 }}>
          <CardContent>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h5" color="primary" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <WarningIcon /> Items Expiring Soon
              </Typography>
              <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
                <FormControl size="small" sx={{ minWidth: 150 }}>
                  <InputLabel>Filter</InputLabel>
                  <Select
                    value={expiryFilter}
                    onChange={(e) => setExpiryFilter(e.target.value as any)}
                    label="Filter"
                  >
                    <MenuItem value="expired">Already Expired</MenuItem>
                    <MenuItem value="today">Expire Today</MenuItem>
                    <MenuItem value="week">Within One Week</MenuItem>
                    <MenuItem value="month">Within One Month</MenuItem>
                    <MenuItem value="custom">Custom</MenuItem>
                  </Select>
                </FormControl>
                {expiryFilter === 'custom' && (
                  <>
                    <TextField
                      type="date"
                      label="Start Date"
                      size="small"
                      value={customStartDate}
                      onChange={(e) => setCustomStartDate(e.target.value)}
                      InputLabelProps={{ shrink: true }}
                    />
                    <TextField
                      type="date"
                      label="End Date"
                      size="small"
                      value={customEndDate}
                      onChange={(e) => setCustomEndDate(e.target.value)}
                      InputLabelProps={{ shrink: true }}
                    />
                  </>
                )}
              </Box>
            </Box>

            {loadingExpiring ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                <CircularProgress />
              </Box>
            ) : expiringItems.length === 0 ? (
              <Alert severity="info">No items found for the selected filter.</Alert>
            ) : (
              <TableContainer component={Paper}>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell><strong>Item Name</strong></TableCell>
                      <TableCell><strong>Category</strong></TableCell>
                      <TableCell align="right"><strong>Quantity</strong></TableCell>
                      <TableCell><strong>Expiry Date</strong></TableCell>
                      <TableCell align="center"><strong>Status</strong></TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {expiringItems.map((item) => {
                      const daysUntil = getDaysUntilExpiry(item.expiry_date);
                      const isExpired = daysUntil < 0;
                      const isToday = daysUntil === 0;
                      const isUrgent = daysUntil > 0 && daysUntil <= 7;
                      
                      return (
                        <TableRow key={item.id} hover>
                          <TableCell>{item.item_name}</TableCell>
                          <TableCell>{item.category_name || '-'}</TableCell>
                          <TableCell align="right">{item.quantity}</TableCell>
                          <TableCell>{new Date(item.expiry_date).toLocaleDateString()}</TableCell>
                          <TableCell align="center">
                            <Chip
                              label={
                                isExpired 
                                  ? `Expired ${Math.abs(daysUntil)} days ago`
                                  : isToday
                                  ? 'Expires Today'
                                  : isUrgent
                                  ? `${daysUntil} days left`
                                  : `${daysUntil} days left`
                              }
                              color={isExpired ? 'error' : isToday ? 'warning' : isUrgent ? 'warning' : 'default'}
                              size="small"
                            />
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </CardContent>
        </Card>

        {/* Financial Accounts Graph Section - Protected by permission */}
        {user?.can_access_financial_accounts && (
        <Card sx={{ elevation: 4 }}>
          <CardContent>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h5" color="primary" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <TrendingUpIcon /> Financial Accounts Overview
              </Typography>
              <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
                <FormControl size="small" sx={{ minWidth: 150 }}>
                  <InputLabel>Account</InputLabel>
                  <Select
                    value={selectedAccount || ''}
                    onChange={(e) => setSelectedAccount(e.target.value ? Number(e.target.value) : null)}
                    label="Account"
                  >
                    <MenuItem value="">All Accounts</MenuItem>
                    {financialAccounts.map((account) => (
                      <MenuItem key={account.id} value={account.id}>
                        {account.account_name} ({account.account_type})
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
                <FormControl size="small" sx={{ minWidth: 150 }}>
                  <InputLabel>Period</InputLabel>
                  <Select
                    value={accountFilter}
                    onChange={(e) => setAccountFilter(e.target.value as any)}
                    label="Period"
                  >
                    <MenuItem value="today">Today</MenuItem>
                    <MenuItem value="week">This Week</MenuItem>
                    <MenuItem value="month">This Month</MenuItem>
                    <MenuItem value="custom">Custom</MenuItem>
                  </Select>
                </FormControl>
                {accountFilter === 'custom' && (
                  <>
                    <TextField
                      type="date"
                      label="Start Date"
                      size="small"
                      value={accountCustomStartDate}
                      onChange={(e) => setAccountCustomStartDate(e.target.value)}
                      InputLabelProps={{ shrink: true }}
                    />
                    <TextField
                      type="date"
                      label="End Date"
                      size="small"
                      value={accountCustomEndDate}
                      onChange={(e) => setAccountCustomEndDate(e.target.value)}
                      InputLabelProps={{ shrink: true }}
                    />
                  </>
                )}
              </Box>
            </Box>

            {loadingAccounts ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                <CircularProgress />
              </Box>
            ) : chartData.length === 0 ? (
              <Alert severity="info">No transaction data available for the selected period.</Alert>
            ) : (
              <Box sx={{ width: '100%', height: 400 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    {uniqueAccountNames.map((accountName, index) => (
                      <Line
                        key={accountName}
                        type="monotone"
                        dataKey={accountName}
                        stroke={colors[index % colors.length]}
                        strokeWidth={2}
                        name={accountName}
                      />
                    ))}
                  </LineChart>
                </ResponsiveContainer>
              </Box>
            )}

            {/* Account Summary */}
            {financialAccounts.length > 0 && (
              <Box sx={{ mt: 3 }}>
                <Typography variant="h6" gutterBottom>Account Balances</Typography>
                <Box sx={{ 
                  display: 'grid',
                  gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(3, 1fr)' },
                  gap: 2
                }}>
                  {financialAccounts.map((account) => (
                    <Card variant="outlined" key={account.id}>
                      <CardContent>
                        <Typography variant="subtitle1" fontWeight="bold">
                          {account.account_name}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {account.account_type}
                        </Typography>
                        <Typography variant="h6" color="primary" sx={{ mt: 1 }}>
                          KES {Number(account.current_balance).toFixed(2)}
                        </Typography>
                      </CardContent>
                    </Card>
                  ))}
                </Box>
              </Box>
            )}
          </CardContent>
        </Card>
        )}

        {/* Advance Package Modal */}
        <Dialog open={advanceOpen} onClose={() => setAdvanceOpen(false)} fullWidth maxWidth="sm">
          <DialogTitle>Advance Package</DialogTitle>
          <DialogContent>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
              <Button variant="outlined" onClick={() => { setAdvanceOpen(false); navigate('/salon'); }}>
                💈 Salon / Barber
              </Button>
              <Button variant="outlined" onClick={() => { setAdvanceOpen(false); navigate('/service-billing'); }}>
                💆 Service Billing
              </Button>
              <Button variant="outlined" onClick={() => { setAdvanceOpen(false); navigate('/hospital'); }}>
                🏥 Hospital Management
              </Button>
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setAdvanceOpen(false)}>Close</Button>
          </DialogActions>
        </Dialog>
      </Box>
    </Box>
  );
};

export default HomeScreen;
