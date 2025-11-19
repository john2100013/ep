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
} from '@mui/material';
import {
  ArrowBack as BackIcon,
  Print as PrintIcon,
  Visibility as ViewIcon,
} from '@mui/icons-material';
import { useNavigate, useParams } from 'react-router-dom';
import ApiService from '../services/api';

interface Invoice {
  id: number;
  invoice_number: string;
  issue_date: string;
  due_date?: string;
  subtotal: number;
  tax_amount: number;
  total_amount: number;
  amount_paid: number;
  payment_method?: string;
  mpesa_code?: string;
  status: string;
  notes?: string;
  created_at: string;
}

interface Customer {
  id: number;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  pin?: string;
  location?: string;
}

interface Summary {
  totalInvoices: number;
  totalInvoiced: string;
  totalPaid: string;
  totalOutstanding: string;
}

const CustomerInvoicesScreen: React.FC = () => {
  const navigate = useNavigate();
  const { customerId } = useParams<{ customerId: string }>();
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (customerId) {
      loadCustomerInvoices();
    }
  }, [customerId]);

  const loadCustomerInvoices = async () => {
    try {
      setLoading(true);
      const response = await ApiService.getCustomerInvoices(parseInt(customerId!));
      setCustomer(response.data.customer);
      setInvoices(response.data.invoices);
      setSummary(response.data.summary);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load customer invoices');
    } finally {
      setLoading(false);
    }
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

  const getPaymentChip = (method?: string) => {
    if (!method) return '-';
    const colorMap: any = {
      Cash: 'success',
      'M-Pesa': 'warning',
      Cheque: 'info',
    };
    return <Chip label={method} color={colorMap[method] || 'default'} size="small" />;
  };

  const handleViewInvoice = (invoice: Invoice) => {
    navigate(`/invoices/${invoice.id}`);
  };

  return (
    <Box sx={{ p: 3, maxWidth: 1400, margin: '0 auto' }}>
      <Box sx={{ mb: 3 }}>
        <Button
          startIcon={<BackIcon />}
          onClick={() => navigate('/customers')}
          sx={{ mb: 2 }}
        >
          Back to Customers
        </Button>
        <Typography variant="h5" fontWeight="bold">
          Customer Invoice History
        </Typography>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>{error}</Alert>}

      {customer && (
        <Card sx={{ p: 3, mb: 3 }}>
          <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 2 }}>
            <Box sx={{ flex: 1 }}>
              <Typography variant="h6" gutterBottom>
                {customer.name}
              </Typography>
              {customer.email && (
                <Typography variant="body2" color="text.secondary">
                  📧 {customer.email}
                </Typography>
              )}
              {customer.phone && (
                <Typography variant="body2" color="text.secondary">
                  📱 {customer.phone}
                </Typography>
              )}
            </Box>
            <Box sx={{ flex: 1 }}>
              {customer.pin && (
                <Typography variant="body2" color="text.secondary">
                  <strong>PIN:</strong> {customer.pin}
                </Typography>
              )}
              {customer.location && (
                <Typography variant="body2" color="text.secondary">
                  <strong>Location:</strong> {customer.location}
                </Typography>
              )}
              {customer.address && (
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                  <strong>Address:</strong> {customer.address}
                </Typography>
              )}
            </Box>
          </Box>
        </Card>
      )}

      {summary && (
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: '1fr 1fr 1fr 1fr' }, gap: 2, mb: 3 }}>
          <Card sx={{ p: 2, textAlign: 'center', backgroundColor: '#e3f2fd' }}>
            <Typography variant="h4" fontWeight="bold" color="primary">
              {summary.totalInvoices}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Total Invoices
            </Typography>
          </Card>
          <Card sx={{ p: 2, textAlign: 'center', backgroundColor: '#f3e5f5' }}>
            <Typography variant="h4" fontWeight="bold" color="secondary">
              ${summary.totalInvoiced}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Total Invoiced
            </Typography>
          </Card>
          <Card sx={{ p: 2, textAlign: 'center', backgroundColor: '#e8f5e9' }}>
            <Typography variant="h4" fontWeight="bold" sx={{ color: '#2e7d32' }}>
              ${summary.totalPaid}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Total Paid
            </Typography>
          </Card>
          <Card sx={{ p: 2, textAlign: 'center', backgroundColor: '#ffebee' }}>
            <Typography variant="h4" fontWeight="bold" sx={{ color: '#c62828' }}>
              ${summary.totalOutstanding}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Outstanding
            </Typography>
          </Card>
        </Box>
      )}

      <Card>
        <Box sx={{ p: 2, borderBottom: '1px solid #e0e0e0' }}>
          <Typography variant="h6">Invoice History</Typography>
        </Box>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
                <TableCell><strong>Invoice #</strong></TableCell>
                <TableCell><strong>Date</strong></TableCell>
                <TableCell><strong>Due Date</strong></TableCell>
                <TableCell align="right"><strong>Total</strong></TableCell>
                <TableCell align="right"><strong>Paid</strong></TableCell>
                <TableCell align="right"><strong>Balance</strong></TableCell>
                <TableCell><strong>Payment</strong></TableCell>
                <TableCell><strong>Status</strong></TableCell>
                <TableCell align="center"><strong>Actions</strong></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {invoices.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} align="center" sx={{ py: 4 }}>
                    <Typography color="text.secondary">
                      No invoices found for this customer
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                invoices.map((invoice) => {
                  const balance = (parseFloat(invoice.total_amount.toString()) - parseFloat(invoice.amount_paid.toString())).toFixed(2);
                  return (
                    <TableRow key={invoice.id} hover>
                      <TableCell>
                        <Typography variant="body2" fontWeight="bold" color="primary">
                          {invoice.invoice_number}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        {new Date(invoice.issue_date).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        {invoice.due_date ? new Date(invoice.due_date).toLocaleDateString() : '-'}
                      </TableCell>
                      <TableCell align="right">
                        <Typography variant="body2" fontWeight="bold">
                          ${parseFloat(invoice.total_amount.toString()).toFixed(2)}
                        </Typography>
                      </TableCell>
                      <TableCell align="right">
                        <Typography variant="body2" sx={{ color: '#2e7d32' }}>
                          ${parseFloat(invoice.amount_paid.toString()).toFixed(2)}
                        </Typography>
                      </TableCell>
                      <TableCell align="right">
                        <Typography 
                          variant="body2" 
                          fontWeight="bold"
                          sx={{ color: parseFloat(balance) > 0 ? '#c62828' : '#2e7d32' }}
                        >
                          ${balance}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        {getPaymentChip(invoice.payment_method)}
                        {invoice.mpesa_code && (
                          <Typography variant="caption" display="block" color="text.secondary">
                            {invoice.mpesa_code}
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell>{getStatusChip(invoice.status)}</TableCell>
                      <TableCell align="center">
                        <IconButton
                          size="small"
                          color="primary"
                          onClick={() => handleViewInvoice(invoice)}
                          title="View Invoice"
                        >
                          <ViewIcon />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>
    </Box>
  );
};

export default CustomerInvoicesScreen;
