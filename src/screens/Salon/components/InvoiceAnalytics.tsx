import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  CircularProgress,
  Alert,
  Collapse,
  IconButton,
} from '@mui/material';
import { ExpandMore, ExpandLess } from '@mui/icons-material';
import * as salonApi from '../../../services/salonApi';

interface InvoiceAnalyticsProps {
  filter: 'day' | 'week' | 'month';
}

interface InvoiceItem {
  id: number;
  invoice_number: string;
  customer_name: string;
  status: string;
  total_amount: number;
  amount_paid: number;
  amount_due: number;
  created_at: string;
  payment_method: string;
  items: any[];
}

const InvoiceAnalytics: React.FC<InvoiceAnalyticsProps> = ({ filter }) => {
  const [invoices, setInvoices] = useState<InvoiceItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set());

  useEffect(() => {
    loadInvoices();
  }, [filter]);

  const loadInvoices = async () => {
    try {
      console.log(`📊 [InvoiceAnalytics] Loading invoices with filter: ${filter}`);
      setLoading(true);
      setError('');
      const response = await salonApi.getInvoiceAnalytics({ filter });
      console.log(`📊 [InvoiceAnalytics] API Response:`, response);
      console.log(`📊 [InvoiceAnalytics] Response.data:`, response.data);
      
      // Handle different response formats
      let invoices: InvoiceItem[] = [];
      if (response.data?.success && response.data?.data) {
        invoices = Array.isArray(response.data.data) ? response.data.data : [];
      } else if (Array.isArray(response.data)) {
        invoices = response.data;
      } else if (response.data?.data && Array.isArray(response.data.data)) {
        invoices = response.data.data;
      }
      
      console.log(`📊 [InvoiceAnalytics] Loaded ${invoices.length} invoices`);
      setInvoices(invoices);
    } catch (err: any) {
      console.error('❌ [InvoiceAnalytics] Error loading invoices:', err);
      setError(err.response?.data?.message || 'Failed to load invoices');
    } finally {
      setLoading(false);
    }
  };

  const toggleRow = (id: number) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedRows(newExpanded);
  };

  const formatCurrency = (amount: number) => {
    return `KES ${Number(amount || 0).toFixed(2)}`;
  };

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'paid':
        return 'success';
      case 'partial':
        return 'warning';
      case 'pending':
      case 'draft':
        return 'error';
      default:
        return 'default';
    }
  };

  const totalRevenue = invoices.reduce((sum, inv) => sum + parseFloat(String(inv.total_amount || 0)), 0);
  const totalPaid = invoices.reduce((sum, inv) => sum + parseFloat(String(inv.amount_paid || 0)), 0);
  const totalDue = invoices.reduce((sum, inv) => sum + parseFloat(String(inv.amount_due || 0)), 0);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap' }}>
        <Card sx={{ flex: 1, minWidth: 200 }}>
          <CardContent>
            <Typography variant="body2" color="text.secondary">Total Invoices</Typography>
            <Typography variant="h4" fontWeight="bold">{invoices.length}</Typography>
          </CardContent>
        </Card>
        <Card sx={{ flex: 1, minWidth: 200 }}>
          <CardContent>
            <Typography variant="body2" color="text.secondary">Total Revenue</Typography>
            <Typography variant="h4" fontWeight="bold" color="primary.main">
              {formatCurrency(totalRevenue)}
            </Typography>
          </CardContent>
        </Card>
        <Card sx={{ flex: 1, minWidth: 200 }}>
          <CardContent>
            <Typography variant="body2" color="text.secondary">Total Paid</Typography>
            <Typography variant="h4" fontWeight="bold" color="success.main">
              {formatCurrency(totalPaid)}
            </Typography>
          </CardContent>
        </Card>
        <Card sx={{ flex: 1, minWidth: 200 }}>
          <CardContent>
            <Typography variant="body2" color="text.secondary">Amount Due</Typography>
            <Typography variant="h4" fontWeight="bold" color="error.main">
              {formatCurrency(totalDue)}
            </Typography>
          </CardContent>
        </Card>
      </Box>

      <Card>
        <CardContent>
          <Typography variant="h6" fontWeight="bold" gutterBottom>
            All Invoices
          </Typography>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell width={50}></TableCell>
                  <TableCell><strong>Invoice #</strong></TableCell>
                  <TableCell><strong>Customer</strong></TableCell>
                  <TableCell><strong>Date</strong></TableCell>
                  <TableCell align="right"><strong>Total</strong></TableCell>
                  <TableCell align="right"><strong>Paid</strong></TableCell>
                  <TableCell align="right"><strong>Due</strong></TableCell>
                  <TableCell><strong>Status</strong></TableCell>
                  <TableCell><strong>Payment Method</strong></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {invoices.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} align="center" sx={{ py: 4 }}>
                      <Typography color="text.secondary">No invoices found</Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  invoices.map((invoice) => (
                    <React.Fragment key={invoice.id}>
                      <TableRow hover>
                        <TableCell>
                          <IconButton size="small" onClick={() => toggleRow(invoice.id)}>
                            {expandedRows.has(invoice.id) ? <ExpandLess /> : <ExpandMore />}
                          </IconButton>
                        </TableCell>
                        <TableCell sx={{ fontWeight: 'bold' }}>{invoice.invoice_number}</TableCell>
                        <TableCell>{invoice.customer_name || 'Walk-in Customer'}</TableCell>
                        <TableCell>
                          {new Date(invoice.created_at).toLocaleDateString()}
                        </TableCell>
                        <TableCell align="right">{formatCurrency(invoice.total_amount)}</TableCell>
                        <TableCell align="right">{formatCurrency(invoice.amount_paid)}</TableCell>
                        <TableCell align="right">{formatCurrency(invoice.amount_due)}</TableCell>
                        <TableCell>
                          <Chip
                            label={invoice.status?.toUpperCase() || 'PENDING'}
                            color={getStatusColor(invoice.status) as any}
                            size="small"
                          />
                        </TableCell>
                        <TableCell>{invoice.payment_method || 'N/A'}</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell colSpan={9} sx={{ py: 0, border: 0 }}>
                          <Collapse in={expandedRows.has(invoice.id)} timeout="auto" unmountOnExit>
                            <Box sx={{ p: 2, bgcolor: '#f5f5f5' }}>
                              <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
                                Items in Invoice:
                              </Typography>
                              {invoice.items && invoice.items.length > 0 ? (
                                <Table size="small">
                                  <TableHead>
                                    <TableRow>
                                      <TableCell>Item</TableCell>
                                      <TableCell align="center">Qty</TableCell>
                                      <TableCell align="right">Unit Price</TableCell>
                                      <TableCell align="right">Total</TableCell>
                                    </TableRow>
                                  </TableHead>
                                  <TableBody>
                                    {invoice.items.map((item: any, idx: number) => (
                                      <TableRow key={idx}>
                                        <TableCell>{item.description || 'Item'}</TableCell>
                                        <TableCell align="center">{item.quantity || 1}</TableCell>
                                        <TableCell align="right">
                                          {formatCurrency(item.unit_price || 0)}
                                        </TableCell>
                                        <TableCell align="right">
                                          {formatCurrency(item.total || 0)}
                                        </TableCell>
                                      </TableRow>
                                    ))}
                                  </TableBody>
                                </Table>
                              ) : (
                                <Typography variant="body2" color="text.secondary">
                                  No items found
                                </Typography>
                              )}
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
        </CardContent>
      </Card>
    </Box>
  );
};

export default InvoiceAnalytics;

