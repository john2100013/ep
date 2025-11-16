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
  Alert
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  AccountBalance as BankIcon,
  Money as CashIcon,
  Phone as MobileIcon
} from '@mui/icons-material';
import { ApiService } from '../services/api';
import Sidebar from '../components/Sidebar';

interface FinancialAccount {
  id: number;
  business_id: number;
  account_name: string;
  account_type: 'cash' | 'bank' | 'mobile_money';
  account_number?: string;
  opening_balance: number;
  current_balance: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

const FinancialAccountsScreen: React.FC = () => {
  const [accounts, setAccounts] = useState<FinancialAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<FinancialAccount | null>(null);
  const [formData, setFormData] = useState({
    account_name: '',
    account_type: 'cash' as 'cash' | 'bank' | 'mobile_money',
    account_number: '',
    balance: 0
  });

  useEffect(() => {
    loadAccounts();
  }, []);

  const loadAccounts = async () => {
    try {
      setLoading(true);
      const response = await ApiService.getFinancialAccounts();
      if (response.success) {
        setAccounts(response.data.accounts || []);
      } else {
        setError(response.message || 'Failed to load financial accounts');
      }
    } catch (err) {
      setError('Failed to load financial accounts');
      console.error('Load accounts error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (account?: FinancialAccount) => {
    if (account) {
      setEditingAccount(account);
      setFormData({
        account_name: account.account_name,
        account_type: account.account_type,
        account_number: account.account_number || '',
        balance: account.current_balance
      });
    } else {
      setEditingAccount(null);
      setFormData({
        account_name: '',
        account_type: 'cash',
        account_number: '',
        balance: 0
      });
    }
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingAccount(null);
    setFormData({
      account_name: '',
      account_type: 'cash',
      account_number: '',
      balance: 0
    });
  };

  const handleSubmit = async () => {
    try {
      if (!formData.account_name.trim()) {
        setError('Account name is required');
        return;
      }

      const response = editingAccount 
        ? await ApiService.updateFinancialAccount(editingAccount.id, formData)
        : await ApiService.createFinancialAccount(formData);

      if (response.success) {
        await loadAccounts();
        handleCloseDialog();
        setError(null);
      } else {
        setError(response.message || 'Failed to save account');
      }
    } catch (err) {
      setError('Failed to save account');
      console.error('Save account error:', err);
    }
  };

  const handleDelete = async (accountId: number) => {
    if (!window.confirm('Are you sure you want to delete this account?')) {
      return;
    }

    try {
      const response = await ApiService.deleteFinancialAccount(accountId);
      if (response.success) {
        await loadAccounts();
        setError(null);
      } else {
        setError(response.message || 'Failed to delete account');
      }
    } catch (err) {
      setError('Failed to delete account');
      console.error('Delete account error:', err);
    }
  };

  const getAccountIcon = (type: string) => {
    switch (type) {
      case 'bank':
        return <BankIcon />;
      case 'mobile_money':
        return <MobileIcon />;
      default:
        return <CashIcon />;
    }
  };

  const getAccountTypeLabel = (type: string) => {
    switch (type) {
      case 'bank':
        return 'Bank Account';
      case 'mobile_money':
        return 'Mobile Money';
      default:
        return 'Cash Account';
    }
  };

  const getAccountTypeColor = (type: string): "default" | "primary" | "secondary" | "error" | "info" | "success" | "warning" => {
    switch (type) {
      case 'bank':
        return 'primary';
      case 'mobile_money':
        return 'success';
      default:
        return 'secondary';
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES',
      minimumFractionDigits: 2
    }).format(amount);
  };

  const totalBalance = accounts.reduce((sum, account) => sum + account.current_balance, 0);

  if (loading) {
    return (
      <Container>
        <Typography>Loading financial accounts...</Typography>
      </Container>
    );
  }

  // Calculate stats for sidebar
  const currentStats = {
    total: accounts.length,
    totalValue: totalBalance,
    statusCounts: {
      active: accounts.filter(acc => acc.is_active).length,
      inactive: accounts.filter(acc => !acc.is_active).length,
      cash: accounts.filter(acc => acc.account_type === 'cash').length,
      bank: accounts.filter(acc => acc.account_type === 'bank').length,
      mobile: accounts.filter(acc => acc.account_type === 'mobile_money').length,
    }
  };

  return (
    <Box sx={{ display: 'flex', width: '100vw', minHeight: '100vh', margin: 0 }}>
      {/* Sidebar - hidden on mobile */}
      <Box sx={{ display: { xs: 'none', md: 'block' } }}>
        <Sidebar 
          title="Financial Accounts"
          currentStats={currentStats}
        />
      </Box>

      {/* Main Content */}
      <Box sx={{ 
        marginLeft: { xs: 0, md: '350px' }, 
        width: { xs: '100%', md: 'calc(100vw - 350px - 24px)' }, 
        p: { xs: 2, md: 3 }, 
        paddingRight: { xs: 0, md: '24px' },
        overflow: 'auto',
        display: 'flex',
        justifyContent: 'center'
      }}>
        <Box sx={{ maxWidth: 'lg', width: '100%' }}>
          <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: { xs: 'stretch', sm: 'center' }, flexDirection: { xs: 'column', sm: 'row' }, gap: { xs: 1, sm: 2 } }}>
            <Typography variant="h4" component="h1" sx={{ fontSize: { xs: '1.5rem', md: '2.125rem' } }}>
              Financial Accounts
            </Typography>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => handleOpenDialog()}
              sx={{ width: { xs: '100%', sm: 'auto' } }}
            >
              Add Account
            </Button>
          </Box>

          {error && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {error}
            </Alert>
          )}

          <Paper sx={{ mb: 3, p: { xs: 1.5, md: 3 } }}>
            <Typography variant="h6" gutterBottom sx={{ fontSize: { xs: '1rem', md: '1.25rem' } }}>
              Total Balance: {formatCurrency(totalBalance)}
            </Typography>
          </Paper>

          <TableContainer component={Paper} sx={{ overflowX: { xs: 'auto', md: 'visible' }, fontSize: { xs: '0.75rem', md: '0.875rem' } }}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Account Name</TableCell>
                  <TableCell>Type</TableCell>
                  <TableCell>Account Number</TableCell>
                  <TableCell align="right">Balance</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell align="center">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {accounts.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} align="center">
                      <Typography variant="body2" color="textSecondary">
                        No financial accounts found. Add your first account to get started.
                      </Typography>
                    </TableCell>
              </TableRow>
            ) : (
              accounts.map((account) => (
                <TableRow key={account.id}>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      {getAccountIcon(account.account_type)}
                      {account.account_name}
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={getAccountTypeLabel(account.account_type)}
                      color={getAccountTypeColor(account.account_type)}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>{account.account_number || '-'}</TableCell>
                  <TableCell align="right">
                    <Typography
                      variant="body2"
                      color={account.current_balance >= 0 ? 'success.main' : 'error.main'}
                      fontWeight="medium"
                    >
                      {formatCurrency(account.current_balance)}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={account.is_active ? 'Active' : 'Inactive'}
                      color={account.is_active ? 'success' : 'default'}
                      size="small"
                    />
                  </TableCell>
                  <TableCell align="center">
                    <IconButton
                      size="small"
                      onClick={() => handleOpenDialog(account)}
                      color="primary"
                    >
                      <EditIcon />
                    </IconButton>
                    <IconButton
                      size="small"
                      onClick={() => handleDelete(account.id)}
                      color="error"
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

          {/* Add/Edit Dialog */}
          <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
            <DialogTitle>
              {editingAccount ? 'Edit Account' : 'Add New Account'}
            </DialogTitle>
            <DialogContent>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: { xs: 1, md: 2 }, pt: 1 }}>
            <TextField
              label="Account Name"
              value={formData.account_name}
              onChange={(e) => setFormData({ ...formData, account_name: e.target.value })}
              fullWidth
              required
            />
            
            <FormControl fullWidth>
              <InputLabel>Account Type</InputLabel>
              <Select
                value={formData.account_type}
                label="Account Type"
                onChange={(e) => setFormData({ ...formData, account_type: e.target.value as 'cash' | 'bank' | 'mobile_money' })}
              >
                <MenuItem value="cash">Cash Account</MenuItem>
                <MenuItem value="bank">Bank Account</MenuItem>
                <MenuItem value="mobile_money">Mobile Money</MenuItem>
              </Select>
            </FormControl>

            {(formData.account_type === 'bank' || formData.account_type === 'mobile_money') && (
              <TextField
                label={formData.account_type === 'bank' ? 'Account Number' : 'Phone Number'}
                value={formData.account_number}
                onChange={(e) => setFormData({ ...formData, account_number: e.target.value })}
                fullWidth
              />
            )}

            <TextField
              label="Initial Balance"
              type="number"
              value={formData.balance}
              onChange={(e) => setFormData({ ...formData, balance: parseFloat(e.target.value) || 0 })}
              fullWidth
              inputProps={{ step: 0.01 }}
            />
              </Box>
            </DialogContent>
            <DialogActions>
              <Button onClick={handleCloseDialog}>Cancel</Button>
              <Button onClick={handleSubmit} variant="contained">
                {editingAccount ? 'Update' : 'Create'}
              </Button>
            </DialogActions>
          </Dialog>
        </Box>
      </Box>
    </Box>
  );
};

export default FinancialAccountsScreen;