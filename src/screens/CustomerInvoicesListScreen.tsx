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
  Collapse,
} from '@mui/material';
import {
  People as PeopleIcon,
  KeyboardArrowDown,
  KeyboardArrowUp,
  Visibility as ViewIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { ApiService } from '../services/api';
import Sidebar from '../components/Sidebar';

interface Customer {
  id: number;
  name: string;
  email: string;
  phone: string;
  pin: string;
  invoices?: Invoice[];
  totalInvoiced?: number;
  totalPaid?: number;
  outstanding?: number;
}

interface Invoice {
  id: number;
  invoice_number: string;
  total_amount: number;
  amount_paid: number;
  status: string;
  issue_date: string;
  payment_method: string;
  mpesa_code: string;
}

const CustomerInvoicesListScreen: React.FC = () => {
  const navigate = useNavigate();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedCustomer, setExpandedCustomer] = useState<number | null>(null);

  useEffect(() => {
    fetchCustomersWithInvoices();
  }, []);

  const fetchCustomersWithInvoices = async () => {
    try {
      setLoading(true);
      const customersResponse = await ApiService.getCustomers();
      
      if (customersResponse.success) {
        const customersList = customersResponse.data.customers || [];
        
        // Fetch invoices for each customer
        const customersWithInvoices = await Promise.all(
          customersList.map(async (customer: Customer) => {
            try {
              const invoicesResponse = await ApiService.getCustomerInvoices(customer.id);
              if (invoicesResponse.success) {
                return {
                  ...customer,
                  invoices: invoicesResponse.data.invoices || [],
                  totalInvoiced: parseFloat(invoicesResponse.data.summary?.totalInvoiced || 0),
                  totalPaid: parseFloat(invoicesResponse.data.summary?.totalPaid || 0),
                  outstanding: parseFloat(invoicesResponse.data.summary?.totalOutstanding || 0),
                };
              }
            } catch (err) {
              console.error(`Error fetching invoices for customer ${customer.id}:`, err);
            }
            return {
              ...customer,
              invoices: [],
              totalInvoiced: 0,
              totalPaid: 0,
              outstanding: 0,
            };
          })
        );
        
        setCustomers(customersWithInvoices);
      }
    } catch (err) {
      console.error('Error fetching customers:', err);
      setError('Failed to fetch customers and invoices');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleExpand = (customerId: number) => {
    setExpandedCustomer(expandedCustomer === customerId ? null : customerId);
  };

  const filteredCustomers = customers.filter(customer =>
    customer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    customer.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    customer.phone?.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
        return 'error';
      case 'partially paid':
        return 'warning';
      default:
        return 'default';
    }
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
            <PeopleIcon sx={{ fontSize: 32 }} />
            <Typography variant="h4" component="h1">
              Customer Invoices
            </Typography>
          </Box>
        </Box>

        {/* Search */}
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <TextField
              fullWidth
              label="Search Customers"
              variant="outlined"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by name, email, or phone..."
            />
          </CardContent>
        </Card>

        {/* Error Alert */}
        {error && (
          <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        {/* Customers Table */}
        <Card>
          <CardContent>
            <TableContainer component={Paper} variant="outlined">
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell width={50}></TableCell>
                    <TableCell>Customer Name</TableCell>
                    <TableCell>Contact</TableCell>
                    <TableCell align="right">Total Invoiced</TableCell>
                    <TableCell align="right">Total Paid</TableCell>
                    <TableCell align="right">Outstanding</TableCell>
                    <TableCell align="center">Invoices</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={7} align="center">
                        <Typography>Loading...</Typography>
                      </TableCell>
                    </TableRow>
                  ) : filteredCustomers.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} align="center">
                        <Typography variant="body2" color="text.secondary">
                          No customers found
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredCustomers.map((customer) => (
                      <React.Fragment key={customer.id}>
                        <TableRow hover>
                          <TableCell>
                            <IconButton
                              size="small"
                              onClick={() => handleToggleExpand(customer.id)}
                              disabled={!customer.invoices || customer.invoices.length === 0}
                            >
                              {expandedCustomer === customer.id ? <KeyboardArrowUp /> : <KeyboardArrowDown />}
                            </IconButton>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body1" fontWeight="medium">
                              {customer.name}
                            </Typography>
                            {customer.pin && (
                              <Typography variant="caption" color="text.secondary">
                                PIN: {customer.pin}
                              </Typography>
                            )}
                          </TableCell>
                          <TableCell>
                            {customer.email && (
                              <Typography variant="body2">{customer.email}</Typography>
                            )}
                            {customer.phone && (
                              <Typography variant="body2" color="text.secondary">
                                {customer.phone}
                              </Typography>
                            )}
                          </TableCell>
                          <TableCell align="right">
                            <Typography variant="body1" fontWeight="medium">
                              {formatCurrency(customer.totalInvoiced || 0)}
                            </Typography>
                          </TableCell>
                          <TableCell align="right">
                            <Typography variant="body1" color="success.main">
                              {formatCurrency(customer.totalPaid || 0)}
                            </Typography>
                          </TableCell>
                          <TableCell align="right">
                            <Typography 
                              variant="body1" 
                              fontWeight="medium"
                              color={(customer.outstanding || 0) > 0 ? 'error.main' : 'text.secondary'}
                            >
                              {formatCurrency(customer.outstanding || 0)}
                            </Typography>
                          </TableCell>
                          <TableCell align="center">
                            <Chip 
                              label={customer.invoices?.length || 0}
                              size="small"
                              color="primary"
                            />
                          </TableCell>
                        </TableRow>
                        
                        {/* Expanded Invoices Row */}
                        {customer.invoices && customer.invoices.length > 0 && (
                          <TableRow>
                            <TableCell colSpan={7} sx={{ py: 0, borderBottom: 0 }}>
                              <Collapse in={expandedCustomer === customer.id} timeout="auto" unmountOnExit>
                                <Box sx={{ m: 2 }}>
                                  <Typography variant="h6" gutterBottom>
                                    Invoices
                                  </Typography>
                                  <Table size="small">
                                    <TableHead>
                                      <TableRow>
                                        <TableCell>Invoice #</TableCell>
                                        <TableCell>Date</TableCell>
                                        <TableCell align="right">Amount</TableCell>
                                        <TableCell align="right">Paid</TableCell>
                                        <TableCell align="right">Balance</TableCell>
                                        <TableCell>Payment Method</TableCell>
                                        <TableCell>M-Pesa Code</TableCell>
                                        <TableCell>Status</TableCell>
                                        <TableCell align="center">Actions</TableCell>
                                      </TableRow>
                                    </TableHead>
                                    <TableBody>
                                      {customer.invoices.map((invoice) => (
                                        <TableRow key={invoice.id}>
                                          <TableCell>
                                            <Typography variant="body2" fontWeight="medium">
                                              {invoice.invoice_number}
                                            </Typography>
                                          </TableCell>
                                          <TableCell>
                                            {new Date(invoice.issue_date).toLocaleDateString()}
                                          </TableCell>
                                          <TableCell align="right">
                                            {formatCurrency(invoice.total_amount)}
                                          </TableCell>
                                          <TableCell align="right">
                                            <Typography color="success.main">
                                              {formatCurrency(invoice.amount_paid || 0)}
                                            </Typography>
                                          </TableCell>
                                          <TableCell align="right">
                                            <Typography 
                                              color={(invoice.total_amount - (invoice.amount_paid || 0)) > 0 ? 'error.main' : 'text.secondary'}
                                            >
                                              {formatCurrency(invoice.total_amount - (invoice.amount_paid || 0))}
                                            </Typography>
                                          </TableCell>
                                          <TableCell>
                                            <Typography variant="body2">
                                              {invoice.payment_method || '-'}
                                            </Typography>
                                          </TableCell>
                                          <TableCell>
                                            <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                                              {invoice.mpesa_code || '-'}
                                            </Typography>
                                          </TableCell>
                                          <TableCell>
                                            <Chip 
                                              label={invoice.status}
                                              size="small"
                                              color={getStatusColor(invoice.status)}
                                            />
                                          </TableCell>
                                          <TableCell align="center">
                                            <IconButton
                                              size="small"
                                              color="primary"
                                              onClick={() => navigate(`/invoices/${invoice.id}`)}
                                            >
                                              <ViewIcon fontSize="small" />
                                            </IconButton>
                                          </TableCell>
                                        </TableRow>
                                      ))}
                                    </TableBody>
                                  </Table>
                                </Box>
                              </Collapse>
                            </TableCell>
                          </TableRow>
                        )}
                      </React.Fragment>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
      </Box>
    </Box>
  );
};

export default CustomerInvoicesListScreen;
