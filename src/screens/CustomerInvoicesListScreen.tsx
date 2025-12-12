import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  TextField,
  Alert,
  Chip,
  IconButton,
  InputAdornment,
  Pagination,
} from '@mui/material';
import {
  Receipt as ReceiptIcon,
  Search as SearchIcon,
  Visibility as ViewIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { ApiService } from '../services/api';
import Sidebar from '../components/Sidebar';
import { format } from 'date-fns';

interface Invoice {
  id: number;
  invoice_number: string;
  customer_name: string;
  customer_address?: string;
  customer_pin?: string;
  total_amount: number;
  amount_paid: number;
  status: string;
  issue_date: string;
  due_date: string;
  payment_method?: string;
  mpesa_code?: string;
  created_at: string;
  line_count?: number;
}

const CustomerInvoicesListScreen: React.FC = () => {
  const navigate = useNavigate();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 50,
    total: 0,
    totalPages: 0
  });

  useEffect(() => {
    fetchAllInvoices();
  }, [pagination.page, searchQuery]);

  const fetchAllInvoices = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const params: any = {
        page: pagination.page,
        limit: pagination.limit,
      };
      
      if (searchQuery) {
        params.search = searchQuery;
      }

      const response = await ApiService.getInvoices(params);
      
      if (response.success) {
        setInvoices(response.data.invoices || []);
        setPagination(prev => ({
          ...prev,
          total: response.data.pagination?.total || 0,
          totalPages: response.data.pagination?.totalPages || 0
        }));
      } else {
        throw new Error(response.message || 'Failed to fetch invoices');
      }
    } catch (err: any) {
      console.error('Error fetching invoices:', err);
      setError(err.message || 'Failed to fetch invoices');
    } finally {
      setLoading(false);
    }
  };

  const handlePageChange = (event: React.ChangeEvent<unknown>, value: number) => {
    setPagination(prev => ({ ...prev, page: value }));
  };

  const handleSearch = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(event.target.value);
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES'
    }).format(amount);
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'paid':
        return 'success';
      case 'unpaid':
      case 'draft':
        return 'default';
      case 'sent':
        return 'info';
      case 'overdue':
        return 'error';
      case 'partially paid':
        return 'warning';
      default:
        return 'default';
    }
  };

  const handleViewInvoice = (invoiceId: number) => {
    navigate(`/invoices/${invoiceId}`);
  };

  const getOutstandingAmount = (invoice: Invoice) => {
    return invoice.total_amount - (invoice.amount_paid || 0);
  };

  const getPaymentMethodDisplay = (invoice: Invoice) => {
    if (!invoice.payment_method) return '-';
    
    // Map numeric values or IDs to proper payment method names
    const paymentMethodMap: { [key: string]: string } = {
      '1': 'Cash',
      '2': 'M-Pesa',
      '3': 'Card',
      '4': 'Bank Transfer',
      '5': 'Cheque',
      'cash': 'Cash',
      'Cash': 'Cash',
      'mpesa': 'M-Pesa',
      'M-Pesa': 'M-Pesa',
      'Mpesa': 'M-Pesa',
      'mobile_money': 'M-Pesa',
      'card': 'Card',
      'Card': 'Card',
      'bank': 'Bank Transfer',
      'Bank': 'Bank Transfer',
      'bank_transfer': 'Bank Transfer',
      'cheque': 'Cheque',
      'Cheque': 'Cheque',
    };
    
    const method = paymentMethodMap[invoice.payment_method] || invoice.payment_method;
    
    // Add M-Pesa code if available
    if ((method === 'M-Pesa' || invoice.payment_method === '2' || invoice.payment_method === 'mpesa' || invoice.payment_method === 'mobile_money') && invoice.mpesa_code) {
      return `M-Pesa (${invoice.mpesa_code})`;
    }
    
    return method;
  };

  return (
    <Box sx={{ display: 'flex', width: '100vw', minHeight: '100vh', margin: 0 }}>
      <Box sx={{ display: { xs: 'none', md: 'block' } }}>
        <Sidebar title="Customer Invoices" />
      </Box>

      <Box sx={{ 
        marginLeft: { xs: 0, md: '350px' }, 
        width: { xs: '100%', md: 'calc(100vw - 350px - 24px)' }, 
        p: { xs: 2, md: 3 }, 
        paddingRight: { xs: 0, md: '24px' },
        overflow: 'auto'
      }}>
        {/* Header */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <ReceiptIcon sx={{ fontSize: 32 }} />
            <Typography variant="h4" component="h1">
              Customer Invoices
            </Typography>
          </Box>
        </Box>

        {/* Search */}
        <Paper sx={{ p: 2, mb: 3 }}>
          <TextField
            fullWidth
            placeholder="Search invoices by invoice number or customer name..."
            value={searchQuery}
            onChange={handleSearch}
            size="small"
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
            }}
          />
        </Paper>

        {/* Error Alert */}
        {error && (
          <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        {/* Invoices Table */}
        <Card>
          <CardContent>
            {loading && invoices.length === 0 ? (
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <Typography>Loading invoices...</Typography>
              </Box>
            ) : invoices.length === 0 ? (
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <ReceiptIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
                <Typography variant="h6" color="text.secondary" gutterBottom>
                  No invoices found
                </Typography>
                <Typography color="text.secondary">
                  {searchQuery ? 'Try adjusting your search query' : 'No invoices have been created yet'}
                </Typography>
              </Box>
            ) : (
              <>
                {/* Desktop Table View */}
                <TableContainer 
                  component={Paper} 
                  variant="outlined"
                  sx={{ 
                    display: { xs: 'none', md: 'block' },
                    overflowX: 'auto'
                  }}
                >
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell><strong>Invoice #</strong></TableCell>
                        <TableCell><strong>Customer Name</strong></TableCell>
                        <TableCell><strong>Issue Date</strong></TableCell>
                        <TableCell align="right"><strong>Total Amount</strong></TableCell>
                        <TableCell align="right"><strong>Amount Paid</strong></TableCell>
                        <TableCell align="right"><strong>Outstanding</strong></TableCell>
                        <TableCell><strong>Payment Method</strong></TableCell>
                        <TableCell><strong>Status</strong></TableCell>
                        <TableCell align="center"><strong>Actions</strong></TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {invoices.map((invoice) => {
                        const outstanding = getOutstandingAmount(invoice);
                        return (
                          <TableRow 
                            key={invoice.id} 
                            hover
                            sx={{ cursor: 'pointer' }}
                            onClick={() => handleViewInvoice(invoice.id)}
                          >
                            <TableCell>
                              <Typography variant="body1" fontWeight="medium">
                                {invoice.invoice_number}
                              </Typography>
                            </TableCell>
                            <TableCell>
                              <Typography variant="body2" fontWeight="medium">
                                {invoice.customer_name}
                              </Typography>
                              {invoice.customer_pin && (
                                <Typography variant="caption" color="text.secondary">
                                  PIN: {invoice.customer_pin}
                                </Typography>
                              )}
                            </TableCell>
                            <TableCell>
                              <Typography variant="body2">
                                {format(new Date(invoice.issue_date), 'MMM dd, yyyy')}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                Due: {format(new Date(invoice.due_date), 'MMM dd, yyyy')}
                              </Typography>
                            </TableCell>
                            <TableCell align="right">
                              <Typography variant="body1" fontWeight="medium">
                                {formatCurrency(invoice.total_amount)}
                              </Typography>
                            </TableCell>
                            <TableCell align="right">
                              <Typography variant="body1" color="success.main">
                                {formatCurrency(invoice.amount_paid || 0)}
                              </Typography>
                            </TableCell>
                            <TableCell align="right">
                              <Typography 
                                variant="body1" 
                                fontWeight="medium"
                                color={outstanding > 0 ? 'error.main' : 'success.main'}
                              >
                                {formatCurrency(outstanding)}
                              </Typography>
                            </TableCell>
                            <TableCell>
                              <Typography variant="body2">
                                {getPaymentMethodDisplay(invoice)}
                              </Typography>
                            </TableCell>
                            <TableCell>
                              <Chip 
                                label={invoice.status.toUpperCase()}
                                size="small"
                                color={getStatusColor(invoice.status) as any}
                              />
                            </TableCell>
                            <TableCell align="center">
                              <IconButton
                                size="small"
                                color="primary"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleViewInvoice(invoice.id);
                                }}
                              >
                                <ViewIcon fontSize="small" />
                              </IconButton>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </TableContainer>

                {/* Mobile Card View */}
                <Box sx={{ display: { xs: 'flex', md: 'none' }, flexDirection: 'column', gap: 2 }}>
                  {invoices.map((invoice) => {
                    const outstanding = getOutstandingAmount(invoice);
                    return (
                      <Card 
                        key={invoice.id}
                        sx={{ 
                          cursor: 'pointer',
                          '&:hover': { boxShadow: 3 }
                        }}
                        onClick={() => handleViewInvoice(invoice.id)}
                      >
                        <CardContent>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                            <Box>
                              <Typography variant="h6" fontWeight="bold" gutterBottom>
                                {invoice.invoice_number}
                              </Typography>
                              <Typography variant="body2" fontWeight="medium" gutterBottom>
                                {invoice.customer_name}
                              </Typography>
                              {invoice.customer_pin && (
                                <Typography variant="caption" color="text.secondary">
                                  PIN: {invoice.customer_pin}
                                </Typography>
                              )}
                            </Box>
                            <Chip 
                              label={invoice.status.toUpperCase()}
                              size="small"
                              color={getStatusColor(invoice.status) as any}
                            />
                          </Box>
                          
                          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, mb: 2 }}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                              <Typography variant="body2" color="text.secondary">Issue Date:</Typography>
                              <Typography variant="body2">
                                {format(new Date(invoice.issue_date), 'MMM dd, yyyy')}
                              </Typography>
                            </Box>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                              <Typography variant="body2" color="text.secondary">Due Date:</Typography>
                              <Typography variant="body2">
                                {format(new Date(invoice.due_date), 'MMM dd, yyyy')}
                              </Typography>
                            </Box>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                              <Typography variant="body2" color="text.secondary">Total Amount:</Typography>
                              <Typography variant="body2" fontWeight="bold">
                                {formatCurrency(invoice.total_amount)}
                              </Typography>
                            </Box>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                              <Typography variant="body2" color="text.secondary">Amount Paid:</Typography>
                              <Typography variant="body2" color="success.main" fontWeight="medium">
                                {formatCurrency(invoice.amount_paid || 0)}
                              </Typography>
                            </Box>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                              <Typography variant="body2" color="text.secondary">Outstanding:</Typography>
                              <Typography 
                                variant="body2" 
                                fontWeight="bold"
                                color={outstanding > 0 ? 'error.main' : 'success.main'}
                              >
                                {formatCurrency(outstanding)}
                              </Typography>
                            </Box>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                              <Typography variant="body2" color="text.secondary">Payment Method:</Typography>
                              <Typography variant="body2">
                                {getPaymentMethodDisplay(invoice)}
                              </Typography>
                            </Box>
                          </Box>

                          <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                            <IconButton
                              size="small"
                              color="primary"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleViewInvoice(invoice.id);
                              }}
                            >
                              <ViewIcon fontSize="small" />
                            </IconButton>
                          </Box>
                        </CardContent>
                      </Card>
                    );
                  })}
                </Box>

                {/* Pagination */}
                {pagination.totalPages > 1 && (
                  <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
                    <Pagination
                      count={pagination.totalPages}
                      page={pagination.page}
                      onChange={handlePageChange}
                      color="primary"
                    />
                  </Box>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </Box>
    </Box>
  );
};

export default CustomerInvoicesListScreen;
