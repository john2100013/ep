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
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  Description as DescriptionIcon,
} from '@mui/icons-material';

interface QuotationProduct {
  id: number;
  item_id?: number;
  item_name: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  vat_rate?: number;
}

interface Quotation {
  id: number;
  quotationNumber: string;
  customerName: string;
  createdAt: string;
  issueDate: string | null;
  totalAmount: number;
  status: string;
  validUntil: string | null;
  products: QuotationProduct[];
}

interface AllQuotationsProps {
  dateRange: string;
}

const AllQuotations: React.FC<AllQuotationsProps> = ({ dateRange }) => {
  const [quotations, setQuotations] = useState<Quotation[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expandedQuotations, setExpandedQuotations] = useState<Set<number>>(new Set());

  useEffect(() => {
    fetchQuotations();
  }, [dateRange]);

  const fetchQuotations = async () => {
    setLoading(true);
    setError(null);
    try {
      const { api } = await import('../../services/api');
      const response = await api.get('/analytics/all-quotations', {
        params: { dateRange }
      });
      
      if (response.data) {
        setQuotations(response.data.quotations || []);
      } else {
        setQuotations([]);
      }
    } catch (err: any) {
      console.error('Error fetching quotations:', err);
      setError(err?.response?.data?.error || 'Failed to fetch quotations');
      setQuotations([]);
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

  const toggleQuotation = (quotationId: number) => {
    const newExpanded = new Set(expandedQuotations);
    if (newExpanded.has(quotationId)) {
      newExpanded.delete(quotationId);
    } else {
      newExpanded.add(quotationId);
    }
    setExpandedQuotations(newExpanded);
  };

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'accepted':
        return 'success';
      case 'sent':
        return 'info';
      case 'draft':
        return 'default';
      case 'rejected':
        return 'error';
      case 'expired':
        return 'warning';
      case 'converted':
        return 'success';
      default:
        return 'default';
    }
  };

  const totalAmount = quotations.reduce((sum, q) => sum + q.totalAmount, 0);
  const acceptedCount = quotations.filter(q => q.status?.toLowerCase() === 'accepted').length;
  const convertedCount = quotations.filter(q => q.status?.toLowerCase() === 'converted').length;

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" fontWeight="bold">
          All Quotations
        </Typography>
      </Box>

      {loading && <LinearProgress sx={{ mb: 2 }} />}
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      {/* Summary Cards */}
      <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap', mb: 4 }}>
        <Card sx={{ flex: 1, minWidth: '200px' }}>
          <CardContent>
            <Typography variant="h6" color="primary" gutterBottom>
              Total Quotations
            </Typography>
            <Typography variant="h4" fontWeight="bold">
              {quotations.length}
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
              Accepted
            </Typography>
            <Typography variant="h4" fontWeight="bold" color="info.main">
              {acceptedCount}
            </Typography>
          </CardContent>
        </Card>
        <Card sx={{ flex: 1, minWidth: '200px' }}>
          <CardContent>
            <Typography variant="h6" color="success.main" gutterBottom>
              Converted
            </Typography>
            <Typography variant="h4" fontWeight="bold" color="success.main">
              {convertedCount}
            </Typography>
          </CardContent>
        </Card>
      </Box>

      {/* Quotations Table */}
      <TableContainer component={Paper} variant="outlined">
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Quotation #</TableCell>
              <TableCell>Customer</TableCell>
              <TableCell>Date</TableCell>
              <TableCell>Valid Until</TableCell>
              <TableCell align="right">Total Amount</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Products</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {quotations.map((quotation) => (
              <React.Fragment key={quotation.id}>
                <TableRow hover>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <DescriptionIcon fontSize="small" color="primary" />
                      <Typography variant="body2" fontWeight="medium">
                        {quotation.quotationNumber}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell>{quotation.customerName}</TableCell>
                  <TableCell>{formatDate(quotation.createdAt)}</TableCell>
                  <TableCell>
                    {quotation.validUntil ? formatDate(quotation.validUntil) : 'N/A'}
                  </TableCell>
                  <TableCell align="right">
                    <Typography variant="body2" fontWeight="bold">
                      {formatCurrency(quotation.totalAmount)}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={quotation.status || 'N/A'}
                      color={getStatusColor(quotation.status) as any}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    <IconButton
                      size="small"
                      onClick={() => toggleQuotation(quotation.id)}
                    >
                      {expandedQuotations.has(quotation.id) ? (
                        <ExpandLessIcon />
                      ) : (
                        <ExpandMoreIcon />
                      )}
                    </IconButton>
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell colSpan={7} sx={{ py: 0, border: 0 }}>
                    <Collapse in={expandedQuotations.has(quotation.id)} timeout="auto" unmountOnExit>
                      <Box sx={{ p: 2, bgcolor: 'grey.50' }}>
                        <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
                          Products ({quotation.products.length})
                        </Typography>
                        <Table size="small">
                          <TableHead>
                            <TableRow>
                              <TableCell>Item Name</TableCell>
                              <TableCell align="right">Quantity</TableCell>
                              <TableCell align="right">Unit Price</TableCell>
                              <TableCell align="right">VAT Rate</TableCell>
                              <TableCell align="right">Total</TableCell>
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            {quotation.products.map((product) => (
                              <TableRow key={product.id}>
                                <TableCell>{product.item_name}</TableCell>
                                <TableCell align="right">{product.quantity}</TableCell>
                                <TableCell align="right">
                                  {formatCurrency(product.unit_price)}
                                </TableCell>
                                <TableCell align="right">
                                  {product.vat_rate ? `${product.vat_rate}%` : '0%'}
                                </TableCell>
                                <TableCell align="right">
                                  <Typography variant="body2" fontWeight="bold">
                                    {formatCurrency(product.total_price)}
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

      {quotations.length === 0 && !loading && (
        <Alert severity="info" sx={{ mt: 2 }}>
          No quotations found for the selected period.
        </Alert>
      )}
    </Box>
  );
};

export default AllQuotations;

