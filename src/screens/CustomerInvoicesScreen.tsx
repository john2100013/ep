import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Card,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Alert,
  Chip,
  IconButton,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Collapse,
  useMediaQuery,
  useTheme,
  Paper,
} from '@mui/material';
import {
  ArrowBack as BackIcon,
  Visibility as ViewIcon,
  KeyboardArrowDown,
  KeyboardArrowUp,
  Search as SearchIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import ApiService from '../services/api';
import Sidebar from '../components/Sidebar';

interface Invoice {
  id: number;
  invoice_number: string;
  issue_date: string;
  due_date?: string;
  subtotal: number;
  vat_amount: number;
  total_amount: number;
  amount_paid: number;
  payment_method?: string;
  mpesa_code?: string;
  status: string;
  notes?: string;
  created_at: string;
}

interface CustomerWithInvoices {
  id: number;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  pin?: string;
  location?: string;
  invoices: Invoice[];
  totalInvoiced: number;
  totalPaid: number;
  outstanding: number;
  invoiceCount: number;
}

const CustomerInvoicesScreen: React.FC = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [customers, setCustomers] = useState<CustomerWithInvoices[]>([]);
  const [expandedCustomerId, setExpandedCustomerId] = useState<number | null>(null);
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerWithInvoices | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadAllCustomersWithInvoices();
  }, []);

  const loadAllCustomersWithInvoices = async () => {
    try {
      setLoading(true);
      
      // Fetch all customers
      const customersResponse = await ApiService.getCustomers();
      
      if (customersResponse.success) {
        const customersList = customersResponse.data.customers || [];
        
        // Fetch invoices for each customer
        const customersWithInvoices = await Promise.all(
          customersList.map(async (customer: any) => {
            try {
              // Get invoices for this customer
              const invoicesResponse = await ApiService.getCustomerInvoices(customer.id);
              
              if (invoicesResponse.success && invoicesResponse.data) {
                const invoices = invoicesResponse.data.invoices || [];
                
                // Calculate totals
                let totalInvoiced = 0;
                let totalPaid = 0;
                
                invoices.forEach((invoice: Invoice) => {
                  totalInvoiced += parseFloat(invoice.total_amount.toString());
                  totalPaid += parseFloat(invoice.amount_paid.toString());
                });
                
                const outstanding = totalInvoiced - totalPaid;
                
                return {
                  ...customer,
                  invoices,
                  totalInvoiced,
                  totalPaid,
                  outstanding,
                  invoiceCount: invoices.length
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
              invoiceCount: 0
            };
          })
        );
        
        // Filter out customers with no invoices
        const customersWithInvoicesOnly = customersWithInvoices.filter(c => c.invoiceCount > 0);
        setCustomers(customersWithInvoicesOnly);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load customer invoices');
      console.error('Error loading customers with invoices:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCustomerClick = (customer: CustomerWithInvoices) => {
    setSelectedCustomer(customer);
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setSelectedCustomer(null);
  };

  const handleToggleExpand = (customerId: number) => {
    setExpandedCustomerId(expandedCustomerId === customerId ? null : customerId);
  };

  const handleViewInvoice = (invoiceId: number) => {
    navigate(`/invoices/${invoiceId}`);
  };

  const getStatusChip = (status: string) => {
    const statusConfig: any = {
      paid: { label: 'Paid', color: 'success' },
      partial: { label: 'Partial', color: 'warning' },
      unpaid: { label: 'Unpaid', color: 'error' },
      draft: { label: 'Draft', color: 'default' },
    };
    const config = statusConfig[status.toLowerCase()] || { label: status, color: 'default' };
    return <Chip label={config.label} color={config.color} size="small" />;
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES'
    }).format(amount);
  };

  const filteredCustomers = customers.filter(customer =>
    customer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    customer.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    customer.phone?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    customer.pin?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <Box sx={{ display: 'flex', width: '100vw', minHeight: '100vh', margin: 0 }}>
      {/* Sidebar - hidden on mobile */}
      {!isMobile && (
        <Box sx={{ display: { xs: 'none', md: 'block' } }}>
          <Sidebar title="Customer Invoices" />
        </Box>
      )}

      {/* Main Content */}
      <Box sx={{ 
        marginLeft: { xs: 0, md: '350px' }, 
        width: { xs: '100%', md: 'calc(100vw - 350px)' }, 
        p: { xs: 2, md: 3 },
        overflow: 'auto'
      }}>
        {/* Header */}
        <Box sx={{ mb: 3 }}>
          <Typography variant={isMobile ? "h5" : "h4"} fontWeight="bold" gutterBottom>
            📊 Customer Invoices
          </Typography>
          <Typography variant="body2" color="text.secondary">
            View all customers and their invoice history
          </Typography>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
            {error}
          </Alert>
        )}

        {/* Search Bar */}
        <Card sx={{ mb: 3, p: 2 }}>
          <TextField
            fullWidth
            placeholder="Search by name, email, phone, or PIN..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            InputProps={{
              startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />
            }}
            size="small"
          />
        </Card>

        {/* Summary Cards */}
        <Box sx={{ 
          display: 'grid', 
          gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: '1fr 1fr 1fr 1fr' }, 
          gap: 2, 
          mb: 3 
        }}>
          <Card sx={{ p: 2, textAlign: 'center', backgroundColor: '#e3f2fd' }}>
            <Typography variant={isMobile ? "h5" : "h4"} fontWeight="bold" color="primary">
              {filteredCustomers.length}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Customers with Invoices
            </Typography>
          </Card>
          <Card sx={{ p: 2, textAlign: 'center', backgroundColor: '#f3e5f5' }}>
            <Typography variant={isMobile ? "h5" : "h4"} fontWeight="bold" color="secondary">
              {filteredCustomers.reduce((sum, c) => sum + c.invoiceCount, 0)}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Total Invoices
            </Typography>
          </Card>
          <Card sx={{ p: 2, textAlign: 'center', backgroundColor: '#e8f5e9' }}>
            <Typography variant={isMobile ? "h6" : "h5"} fontWeight="bold" sx={{ color: '#2e7d32' }}>
              {formatCurrency(filteredCustomers.reduce((sum, c) => sum + c.totalPaid, 0))}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Total Paid
            </Typography>
          </Card>
          <Card sx={{ p: 2, textAlign: 'center', backgroundColor: '#ffebee' }}>
            <Typography variant={isMobile ? "h6" : "h5"} fontWeight="bold" sx={{ color: '#c62828' }}>
              {formatCurrency(filteredCustomers.reduce((sum, c) => sum + c.outstanding, 0))}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Total Outstanding
            </Typography>
          </Card>
        </Box>

        {/* Customer List */}
        <Card>
          <TableContainer>
            <Table size={isMobile ? "small" : "medium"}>
              <TableHead>
                <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
                  <TableCell width={50}></TableCell>
                  <TableCell><strong>Customer</strong></TableCell>
                  {!isMobile && <TableCell><strong>Contact</strong></TableCell>}
                  <TableCell align="right"><strong>Total Invoiced</strong></TableCell>
                  <TableCell align="right"><strong>Total Paid</strong></TableCell>
                  <TableCell align="right"><strong>Outstanding</strong></TableCell>
                  <TableCell align="center"><strong>Invoices</strong></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={isMobile ? 5 : 7} align="center" sx={{ py: 4 }}>
                      <Typography>Loading...</Typography>
                    </TableCell>
                  </TableRow>
                ) : filteredCustomers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={isMobile ? 5 : 7} align="center" sx={{ py: 4 }}>
                      <Typography color="text.secondary">
                        {searchQuery ? 'No customers found matching your search' : 'No customers with invoices found'}
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredCustomers.map((customer) => (
                    <React.Fragment key={customer.id}>
                      <TableRow 
                        hover 
                        sx={{ 
                          cursor: 'pointer',
                          '&:hover': { backgroundColor: '#f5f5f5' }
                        }}
                      >
                        <TableCell>
                          <IconButton
                            size="small"
                            onClick={() => handleToggleExpand(customer.id)}
                          >
                            {expandedCustomerId === customer.id ? <KeyboardArrowUp /> : <KeyboardArrowDown />}
                          </IconButton>
                        </TableCell>
                        <TableCell onClick={() => handleCustomerClick(customer)}>
                          <Typography variant="body2" fontWeight="bold">
                            {customer.name}
                          </Typography>
                          {customer.pin && (
                            <Typography variant="caption" color="text.secondary">
                              PIN: {customer.pin}
                            </Typography>
                          )}
                        </TableCell>
                        {!isMobile && (
                          <TableCell>
                            {customer.email && (
                              <Typography variant="body2" sx={{ fontSize: '0.875rem' }}>
                                {customer.email}
                              </Typography>
                            )}
                            {customer.phone && (
                              <Typography variant="caption" color="text.secondary">
                                {customer.phone}
                              </Typography>
                            )}
                          </TableCell>
                        )}
                        <TableCell align="right">
                          <Typography variant="body2" fontWeight="bold">
                            {formatCurrency(customer.totalInvoiced)}
                          </Typography>
                        </TableCell>
                        <TableCell align="right">
                          <Typography variant="body2" sx={{ color: '#2e7d32', fontWeight: 'bold' }}>
                            {formatCurrency(customer.totalPaid)}
                          </Typography>
                        </TableCell>
                        <TableCell align="right">
                          <Typography 
                            variant="body2" 
                            fontWeight="bold"
                            sx={{ color: customer.outstanding > 0 ? '#c62828' : '#2e7d32' }}
                          >
                            {formatCurrency(customer.outstanding)}
                          </Typography>
                        </TableCell>
                        <TableCell align="center">
                          <Chip 
                            label={customer.invoiceCount} 
                            color="primary" 
                            size="small"
                            onClick={() => handleCustomerClick(customer)}
                          />
                        </TableCell>
                      </TableRow>
                      
                      {/* Expandable Invoice Details */}
                      <TableRow>
                        <TableCell colSpan={isMobile ? 5 : 7} sx={{ py: 0, borderBottom: 0 }}>
                          <Collapse in={expandedCustomerId === customer.id} timeout="auto" unmountOnExit>
                            <Box sx={{ p: 2, backgroundColor: '#f9f9f9' }}>
                              <Typography variant="subtitle2" gutterBottom fontWeight="bold">
                                Invoice Details
                              </Typography>
                              <Table size="small">
                                <TableHead>
                                  <TableRow>
                                    <TableCell><strong>Invoice #</strong></TableCell>
                                    <TableCell><strong>Date</strong></TableCell>
                                    {!isMobile && <TableCell><strong>Due Date</strong></TableCell>}
                                    <TableCell align="right"><strong>Amount</strong></TableCell>
                                    <TableCell align="right"><strong>Paid</strong></TableCell>
                                    {!isMobile && <TableCell><strong>Status</strong></TableCell>}
                                    <TableCell align="center"><strong>Action</strong></TableCell>
                                  </TableRow>
                                </TableHead>
                                <TableBody>
                                  {customer.invoices.map((invoice) => (
                                    <TableRow key={invoice.id}>
                                      <TableCell>
                                        <Typography variant="body2" fontWeight="bold" color="primary">
                                          {invoice.invoice_number}
                                        </Typography>
                                      </TableCell>
                                      <TableCell>
                                        <Typography variant="caption">
                                          {new Date(invoice.issue_date).toLocaleDateString()}
                                        </Typography>
                                      </TableCell>
                                      {!isMobile && (
                                        <TableCell>
                                          <Typography variant="caption">
                                            {invoice.due_date ? new Date(invoice.due_date).toLocaleDateString() : '-'}
                                          </Typography>
                                        </TableCell>
                                      )}
                                      <TableCell align="right">
                                        <Typography variant="body2">
                                          {formatCurrency(parseFloat(invoice.total_amount.toString()))}
                                        </Typography>
                                      </TableCell>
                                      <TableCell align="right">
                                        <Typography variant="body2" sx={{ color: '#2e7d32' }}>
                                          {formatCurrency(parseFloat(invoice.amount_paid.toString()))}
                                        </Typography>
                                      </TableCell>
                                      {!isMobile && (
                                        <TableCell>
                                          {getStatusChip(invoice.status)}
                                        </TableCell>
                                      )}
                                      <TableCell align="center">
                                        <IconButton
                                          size="small"
                                          color="primary"
                                          onClick={() => handleViewInvoice(invoice.id)}
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
                    </React.Fragment>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Card>

        {/* Customer Details Dialog */}
        <Dialog 
          open={dialogOpen} 
          onClose={handleCloseDialog}
          maxWidth="md"
          fullWidth
          fullScreen={isMobile}
        >
          <DialogTitle>
            <Typography variant="h6" fontWeight="bold">
              Customer Invoice Summary
            </Typography>
          </DialogTitle>
          <DialogContent>
            {selectedCustomer && (
              <Box>
                {/* Customer Info */}
                <Card sx={{ p: 2, mb: 3, backgroundColor: '#f5f5f5' }}>
                  <Typography variant="h6" gutterBottom>
                    {selectedCustomer.name}
                  </Typography>
                  <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 1 }}>
                    {selectedCustomer.email && (
                      <Typography variant="body2" color="text.secondary">
                        📧 {selectedCustomer.email}
                      </Typography>
                    )}
                    {selectedCustomer.phone && (
                      <Typography variant="body2" color="text.secondary">
                        📱 {selectedCustomer.phone}
                      </Typography>
                    )}
                    {selectedCustomer.pin && (
                      <Typography variant="body2" color="text.secondary">
                        <strong>PIN:</strong> {selectedCustomer.pin}
                      </Typography>
                    )}
                    {selectedCustomer.location && (
                      <Typography variant="body2" color="text.secondary">
                        📍 {selectedCustomer.location}
                      </Typography>
                    )}
                  </Box>
                </Card>

                {/* Summary Cards */}
                <Box sx={{ 
                  display: 'grid', 
                  gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr 1fr' }, 
                  gap: 2, 
                  mb: 3 
                }}>
                  <Card sx={{ p: 2, textAlign: 'center', backgroundColor: '#e3f2fd' }}>
                    <Typography variant="h5" fontWeight="bold" color="primary">
                      {selectedCustomer.invoiceCount}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Total Invoices
                    </Typography>
                  </Card>
                  <Card sx={{ p: 2, textAlign: 'center', backgroundColor: '#e8f5e9' }}>
                    <Typography variant="h6" fontWeight="bold" sx={{ color: '#2e7d32' }}>
                      {formatCurrency(selectedCustomer.totalPaid)}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Total Paid
                    </Typography>
                  </Card>
                  <Card sx={{ p: 2, textAlign: 'center', backgroundColor: '#ffebee' }}>
                    <Typography variant="h6" fontWeight="bold" sx={{ color: '#c62828' }}>
                      {formatCurrency(selectedCustomer.outstanding)}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Outstanding
                    </Typography>
                  </Card>
                </Box>

                {/* Invoice List */}
                <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                  Invoice History
                </Typography>
                <TableContainer component={Paper} sx={{ maxHeight: 400 }}>
                  <Table size="small" stickyHeader>
                    <TableHead>
                      <TableRow>
                        <TableCell><strong>Invoice #</strong></TableCell>
                        <TableCell><strong>Date</strong></TableCell>
                        <TableCell align="right"><strong>Amount</strong></TableCell>
                        <TableCell align="right"><strong>Paid</strong></TableCell>
                        <TableCell><strong>Status</strong></TableCell>
                        <TableCell align="center"><strong>Action</strong></TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {selectedCustomer.invoices.map((invoice) => (
                        <TableRow key={invoice.id} hover>
                          <TableCell>
                            <Typography variant="body2" fontWeight="bold" color="primary">
                              {invoice.invoice_number}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="caption">
                              {new Date(invoice.issue_date).toLocaleDateString()}
                            </Typography>
                          </TableCell>
                          <TableCell align="right">
                            <Typography variant="body2">
                              {formatCurrency(parseFloat(invoice.total_amount.toString()))}
                            </Typography>
                          </TableCell>
                          <TableCell align="right">
                            <Typography variant="body2" sx={{ color: '#2e7d32' }}>
                              {formatCurrency(parseFloat(invoice.amount_paid.toString()))}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            {getStatusChip(invoice.status)}
                          </TableCell>
                          <TableCell align="center">
                            <IconButton
                              size="small"
                              color="primary"
                              onClick={() => {
                                handleCloseDialog();
                                handleViewInvoice(invoice.id);
                              }}
                            >
                              <ViewIcon fontSize="small" />
                            </IconButton>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Box>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseDialog} color="primary">
              Close
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </Box>
  );
};

export default CustomerInvoicesScreen;
