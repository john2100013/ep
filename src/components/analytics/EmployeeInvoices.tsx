import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
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
  LinearProgress,
  Alert,
  Chip,
  Collapse,
  IconButton,
  Button,
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  Receipt as ReceiptIcon,
  ArrowBack as ArrowBackIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { ApiService } from '../../services/api';

interface InvoiceProduct {
  id: number;
  item_id?: number;
  description: string;
  code: string;
  quantity: number;
  unit_price: number;
  total: number;
  uom?: string;
}

interface Invoice {
  id: number;
  invoiceNumber: string;
  customerName: string;
  createdAt: string;
  issueDate: string | null;
  totalAmount: number;
  amountPaid: number;
  amountDue: number;
  status: string;
  paymentStatus: string;
  products: InvoiceProduct[];
}

const EmployeeInvoices: React.FC = () => {
  const { userId } = useParams<{ userId: string }>();
  const [searchParams] = useSearchParams();
  const dateRange = searchParams.get('dateRange') || 'this_month';
  const navigate = useNavigate();
  
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expandedInvoices, setExpandedInvoices] = useState<Set<number>>(new Set());
  const [userName, setUserName] = useState<string>('');

  useEffect(() => {
    if (userId) {
      fetchInvoices();
    }
  }, [userId, dateRange]);

  const fetchInvoices = async () => {
    if (!userId) return;
    
    setLoading(true);
    setError(null);
    try {
      const response = await ApiService.get(`/users/${userId}/invoices`, {
        params: { dateRange }
      });
      
      if (response.success) {
        setInvoices(response.data.invoices || []);
        // Try to get user name from first invoice or fetch separately
        if (response.data.invoices && response.data.invoices.length > 0) {
          // User name will be shown in header
        }
      } else {
        setInvoices([]);
      }
    } catch (err: any) {
      console.error('Error fetching user invoices:', err);
      setError(err?.response?.data?.message || 'Failed to fetch invoices');
      setInvoices([]);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-GB', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const toggleInvoice = (invoiceId: number) => {
    const newExpanded = new Set(expandedInvoices);
    if (newExpanded.has(invoiceId)) {
      newExpanded.delete(invoiceId);
    } else {
      newExpanded.add(invoiceId);
    }
    setExpandedInvoices(newExpanded);
  };

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'paid':
        return 'success';
      case 'sent':
        return 'info';
      case 'draft':
        return 'default';
      case 'cancelled':
        return 'error';
      case 'overdue':
        return 'error';
      default:
        return 'default';
    }
  };

  const getPaymentStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'paid':
        return 'success';
      case 'partial':
        return 'warning';
      case 'unpaid':
        return 'error';
      default:
        return 'default';
    }
  };

  const totalAmount = invoices.reduce((sum, inv) => sum + inv.totalAmount, 0);
  const totalPaid = invoices.reduce((sum, inv) => sum + inv.amountPaid, 0);
  const totalDue = invoices.reduce((sum, inv) => sum + inv.amountDue, 0);

  return (
    <Box sx={{ width: '100vw', minHeight: '100vh', margin: 0, padding: { xs: 2, md: 3 } }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Button
            startIcon={<ArrowBackIcon />}
            onClick={() => navigate('/analytics')}
            variant="outlined"
          >
            Back to Analytics
          </Button>
          <Typography variant="h5" fontWeight="bold">
            Employee Invoices
          </Typography>
        </Box>
      </Box>

      {loading && <LinearProgress sx={{ mb: 2 }} />}
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      {/* Summary Cards */}
      <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap', mb: 4 }}>
        <Card sx={{ flex: 1, minWidth: '200px' }}>
          <CardContent>
            <Typography variant="h6" color="primary" gutterBottom>
              Total Invoices
            </Typography>
            <Typography variant="h4" fontWeight="bold">
              {invoices.length}
            </Typography>
          </CardContent>
        </Card>
        <Card sx={{ flex: 1, minWidth: '200px' }}>
          <CardContent>
            <Typography variant="h6" color="success.main" gutterBottom>
              Total Amount
            </Typography>
            <Typography variant="h4" fontWeight="bold" color="success.main">
              {formatCurrency(totalAmount)}
            </Typography>
          </CardContent>
        </Card>
        <Card sx={{ flex: 1, minWidth: '200px' }}>
          <CardContent>
            <Typography variant="h6" color="info.main" gutterBottom>
              Amount Paid
            </Typography>
            <Typography variant="h4" fontWeight="bold" color="info.main">
              {formatCurrency(totalPaid)}
            </Typography>
          </CardContent>
        </Card>
        <Card sx={{ flex: 1, minWidth: '200px' }}>
          <CardContent>
            <Typography variant="h6" color="warning.main" gutterBottom>
              Amount Due
            </Typography>
            <Typography variant="h4" fontWeight="bold" color="warning.main">
              {formatCurrency(totalDue)}
            </Typography>
          </CardContent>
        </Card>
      </Box>

      {/* Invoices Table */}
      <TableContainer component={Paper} variant="outlined">
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Invoice #</TableCell>
              <TableCell>Customer</TableCell>
              <TableCell>Date</TableCell>
              <TableCell align="right">Total Amount</TableCell>
              <TableCell align="right">Amount Paid</TableCell>
              <TableCell align="right">Amount Due</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Payment Status</TableCell>
              <TableCell>Products</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {invoices.map((invoice) => (
              <React.Fragment key={invoice.id}>
                <TableRow hover>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <ReceiptIcon fontSize="small" color="primary" />
                      <Typography variant="body2" fontWeight="medium">
                        {invoice.invoiceNumber}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell>{invoice.customerName}</TableCell>
                  <TableCell>{formatDate(invoice.createdAt)}</TableCell>
                  <TableCell align="right">
                    <Typography variant="body2" fontWeight="bold">
                      {formatCurrency(invoice.totalAmount)}
                    </Typography>
                  </TableCell>
                  <TableCell align="right">
                    <Typography variant="body2" color="success.main">
                      {formatCurrency(invoice.amountPaid)}
                    </Typography>
                  </TableCell>
                  <TableCell align="right">
                    <Typography variant="body2" color="warning.main">
                      {formatCurrency(invoice.amountDue)}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={invoice.status || 'N/A'}
                      color={getStatusColor(invoice.status) as any}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={invoice.paymentStatus || 'N/A'}
                      color={getPaymentStatusColor(invoice.paymentStatus) as any}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    <IconButton
                      size="small"
                      onClick={() => toggleInvoice(invoice.id)}
                    >
                      {expandedInvoices.has(invoice.id) ? (
                        <ExpandLessIcon />
                      ) : (
                        <ExpandMoreIcon />
                      )}
                    </IconButton>
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell colSpan={9} sx={{ py: 0, border: 0 }}>
                    <Collapse in={expandedInvoices.has(invoice.id)} timeout="auto" unmountOnExit>
                      <Box sx={{ p: 2, bgcolor: 'grey.50' }}>
                        <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
                          Products ({invoice.products.length})
                        </Typography>
                        <Table size="small">
                          <TableHead>
                            <TableRow>
                              <TableCell>Code</TableCell>
                              <TableCell>Description</TableCell>
                              <TableCell align="right">Quantity</TableCell>
                              <TableCell align="right">Unit Price</TableCell>
                              <TableCell align="right">Total</TableCell>
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            {invoice.products.map((product) => (
                              <TableRow key={product.id}>
                                <TableCell>{product.code}</TableCell>
                                <TableCell>{product.description}</TableCell>
                                <TableCell align="right">
                                  {product.quantity} {product.uom || ''}
                                </TableCell>
                                <TableCell align="right">
                                  {formatCurrency(product.unit_price)}
                                </TableCell>
                                <TableCell align="right">
                                  <Typography variant="body2" fontWeight="bold">
                                    {formatCurrency(product.total)}
                                  </Typography>
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
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {invoices.length === 0 && !loading && (
        <Alert severity="info" sx={{ mt: 2 }}>
          No invoices found for this employee in the selected period.
        </Alert>
      )}
    </Box>
  );
};

export default EmployeeInvoices;

