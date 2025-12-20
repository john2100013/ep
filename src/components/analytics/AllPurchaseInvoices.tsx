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
  LinearProgress,
  Alert,
  Chip,
  Collapse,
  IconButton,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  Receipt as ReceiptIcon,
} from '@mui/icons-material';

interface PurchaseInvoiceProduct {
  id: number;
  item_id?: number;
  description: string;
  code: string;
  quantity: number;
  unit_price: number;
  total: number;
  uom?: string;
}

interface PurchaseInvoice {
  id: number;
  purchaseInvoiceNumber: string;
  supplierName: string;
  createdAt: string;
  issueDate: string | null;
  totalAmount: number;
  amountPaid: number;
  actualAmountPaid: number;
  changeReceived: number;
  amountDue: number;
  status: string;
  paymentStatus: string;
  products: PurchaseInvoiceProduct[];
}

interface AllPurchaseInvoicesProps {
  dateRange: string;
}

const AllPurchaseInvoices: React.FC<AllPurchaseInvoicesProps> = ({ dateRange }) => {
  const [purchaseInvoices, setPurchaseInvoices] = useState<PurchaseInvoice[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expandedPurchaseInvoices, setExpandedPurchaseInvoices] = useState<Set<number>>(new Set());

  useEffect(() => {
    fetchPurchaseInvoices();
  }, [dateRange]);

  const fetchPurchaseInvoices = async () => {
    setLoading(true);
    setError(null);
    try {
      const { api } = await import('../../services/api');
      const response = await api.get('/analytics/all-purchase-invoices', {
        params: { dateRange }
      });
      
      if (response.data) {
        setPurchaseInvoices(response.data.purchaseInvoices || []);
      } else {
        setPurchaseInvoices([]);
      }
    } catch (err: any) {
      console.error('Error fetching purchase invoices:', err);
      setError(err?.response?.data?.error || 'Failed to fetch purchase invoices');
      setPurchaseInvoices([]);
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

  const togglePurchaseInvoice = (purchaseInvoiceId: number) => {
    const newExpanded = new Set(expandedPurchaseInvoices);
    if (newExpanded.has(purchaseInvoiceId)) {
      newExpanded.delete(purchaseInvoiceId);
    } else {
      newExpanded.add(purchaseInvoiceId);
    }
    setExpandedPurchaseInvoices(newExpanded);
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

  const totalAmount = purchaseInvoices.reduce((sum, inv) => sum + inv.totalAmount, 0);
  const totalPaid = purchaseInvoices.reduce((sum, inv) => sum + (inv.actualAmountPaid || 0), 0);
  const totalDue = purchaseInvoices.reduce((sum, inv) => sum + inv.amountDue, 0);

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" fontWeight="bold">
          All Purchase Invoices
        </Typography>
      </Box>

      {loading && <LinearProgress sx={{ mb: 2 }} />}
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      {/* Summary Cards */}
      <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap', mb: 4 }}>
        <Card sx={{ flex: 1, minWidth: '200px' }}>
          <CardContent>
            <Typography variant="h6" color="primary" gutterBottom>
              Total Purchase Invoices
            </Typography>
            <Typography variant="h4" fontWeight="bold">
              {purchaseInvoices.length}
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
              Actual Amount Paid
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

      {/* Purchase Invoices Table */}
      <TableContainer component={Paper} variant="outlined">
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Purchase Invoice #</TableCell>
              <TableCell>Supplier</TableCell>
              <TableCell>Date</TableCell>
              <TableCell align="right">Total Amount</TableCell>
              <TableCell align="right">Amount Paid</TableCell>
              <TableCell align="right">Actual Paid</TableCell>
              <TableCell align="right">Change Received</TableCell>
              <TableCell align="right">Amount Due</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Payment Status</TableCell>
              <TableCell>Products</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {purchaseInvoices.map((purchaseInvoice) => (
              <React.Fragment key={purchaseInvoice.id}>
                <TableRow hover>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <ReceiptIcon fontSize="small" color="primary" />
                      <Typography variant="body2" fontWeight="medium">
                        {purchaseInvoice.purchaseInvoiceNumber}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell>{purchaseInvoice.supplierName}</TableCell>
                  <TableCell>{formatDate(purchaseInvoice.createdAt)}</TableCell>
                  <TableCell align="right">
                    <Typography variant="body2" fontWeight="bold">
                      {formatCurrency(purchaseInvoice.totalAmount)}
                    </Typography>
                  </TableCell>
                  <TableCell align="right">
                    <Typography variant="body2" color="text.secondary">
                      {formatCurrency(purchaseInvoice.amountPaid)}
                    </Typography>
                  </TableCell>
                  <TableCell align="right">
                    <Typography variant="body2" color="success.main" fontWeight="bold">
                      {formatCurrency(purchaseInvoice.actualAmountPaid || 0)}
                    </Typography>
                  </TableCell>
                  <TableCell align="right">
                    <Typography variant="body2" color={purchaseInvoice.changeReceived > 0 ? "info.main" : "text.secondary"}>
                      {formatCurrency(purchaseInvoice.changeReceived || 0)}
                    </Typography>
                  </TableCell>
                  <TableCell align="right">
                    <Typography variant="body2" color="warning.main">
                      {formatCurrency(purchaseInvoice.amountDue)}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={purchaseInvoice.status || 'N/A'}
                      color={getStatusColor(purchaseInvoice.status) as any}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={purchaseInvoice.paymentStatus || 'N/A'}
                      color={getPaymentStatusColor(purchaseInvoice.paymentStatus) as any}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    <IconButton
                      size="small"
                      onClick={() => togglePurchaseInvoice(purchaseInvoice.id)}
                    >
                      {expandedPurchaseInvoices.has(purchaseInvoice.id) ? (
                        <ExpandLessIcon />
                      ) : (
                        <ExpandMoreIcon />
                      )}
                    </IconButton>
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell colSpan={11} sx={{ py: 0, border: 0 }}>
                    <Collapse in={expandedPurchaseInvoices.has(purchaseInvoice.id)} timeout="auto" unmountOnExit>
                      <Box sx={{ p: 2, bgcolor: 'grey.50' }}>
                        <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
                          Products ({purchaseInvoice.products.length})
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
                            {purchaseInvoice.products.map((product) => (
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

      {purchaseInvoices.length === 0 && !loading && (
        <Alert severity="info" sx={{ mt: 2 }}>
          No purchase invoices found for the selected period.
        </Alert>
      )}
    </Box>
  );
};

export default AllPurchaseInvoices;

