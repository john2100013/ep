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
  Description as QuotationIcon,
  ArrowBack as ArrowBackIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { ApiService } from '../../services/api';

interface QuotationProduct {
  id: number;
  item_id?: number;
  description: string;
  code: string;
  quantity: number;
  unit_price: number;
  total: number;
  uom?: string;
}

interface Quotation {
  id: number;
  quotationNumber: string;
  customerName: string;
  createdAt: string;
  validUntil: string | null;
  totalAmount: number;
  status: string;
  products: QuotationProduct[];
}

const EmployeeQuotations: React.FC = () => {
  const { userId } = useParams<{ userId: string }>();
  const [searchParams] = useSearchParams();
  const dateRange = searchParams.get('dateRange') || 'this_month';
  const navigate = useNavigate();
  
  const [quotations, setQuotations] = useState<Quotation[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expandedQuotations, setExpandedQuotations] = useState<Set<number>>(new Set());

  useEffect(() => {
    if (userId) {
      fetchQuotations();
    }
  }, [userId, dateRange]);

  const fetchQuotations = async () => {
    if (!userId) return;
    
    setLoading(true);
    setError(null);
    try {
      const response = await ApiService.get(`/users/${userId}/quotations`, {
        params: { dateRange }
      });
      
      if (response.success) {
        setQuotations(response.data.quotations || []);
      } else {
        setQuotations([]);
      }
    } catch (err: any) {
      console.error('Error fetching user quotations:', err);
      setError(err?.response?.data?.message || 'Failed to fetch quotations');
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
      default:
        return 'default';
    }
  };

  const totalAmount = quotations.reduce((sum, q) => sum + q.totalAmount, 0);

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
            Employee Quotations
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
                      <QuotationIcon fontSize="small" color="secondary" />
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
                              <TableCell>Code</TableCell>
                              <TableCell>Description</TableCell>
                              <TableCell align="right">Quantity</TableCell>
                              <TableCell align="right">Unit Price</TableCell>
                              <TableCell align="right">Total</TableCell>
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            {quotation.products.map((product) => (
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

      {quotations.length === 0 && !loading && (
        <Alert severity="info" sx={{ mt: 2 }}>
          No quotations found for this employee in the selected period.
        </Alert>
      )}
    </Box>
  );
};

export default EmployeeQuotations;

