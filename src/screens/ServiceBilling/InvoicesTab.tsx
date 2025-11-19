import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Card,
  Alert,
  TextField,
  InputAdornment,
  Chip,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  Search as SearchIcon,
  Visibility as ViewIcon,
  Print as PrintIcon,
} from '@mui/icons-material';
import { ServiceBillingAPI } from '../../services/serviceBillingApi';

const InvoicesTab: React.FC = () => {
  const [invoices, setInvoices] = useState<any[]>([]);
  const [filteredInvoices, setFilteredInvoices] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    filterInvoices();
  }, [searchQuery, invoices]);

  const loadData = async () => {
    try {
      setLoading(true);
      const response = await ServiceBillingAPI.getServiceInvoices();
      const invoicesData = response.data.data?.invoices || response.data.data || [];
      setInvoices(invoicesData);
      setFilteredInvoices(invoicesData);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load invoices');
    } finally {
      setLoading(false);
    }
  };

  const filterInvoices = () => {
    if (!searchQuery.trim()) {
      setFilteredInvoices(invoices);
      return;
    }

    const query = searchQuery.toLowerCase();
    const filtered = invoices.filter((invoice) => {
      return (
        invoice.invoice_number?.toLowerCase().includes(query) ||
        invoice.customer_name?.toLowerCase().includes(query) ||
        invoice.customer_phone?.toLowerCase().includes(query) ||
        invoice.payment_method?.toLowerCase().includes(query) ||
        invoice.notes?.toLowerCase().includes(query)
      );
    });
    setFilteredInvoices(filtered);
  };

  const handlePrintInvoice = (invoice: any) => {
    const business = JSON.parse(localStorage.getItem('business') || '{}');
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const subtotal = Number(invoice.subtotal);
    const vat = Number(invoice.vat_amount);
    const total = Number(invoice.total_amount);

    // Parse invoice items
    let itemsHTML = '';
    try {
      const items = typeof invoice.items === 'string' ? JSON.parse(invoice.items) : invoice.items;
      if (Array.isArray(items)) {
        itemsHTML = items.map((item: any) => `
          <tr>
            <td>
              ${item.service_name || item.name || 'Service'}
              ${item.employee_name ? `<div class="employee">by ${item.employee_name}</div>` : ''}
            </td>
            <td>${item.duration ? Math.round(item.duration) + 'min' : '-'}</td>
            <td>$${Number(item.price || 0).toFixed(2)}</td>
          </tr>
        `).join('');
      }
    } catch (e) {
      itemsHTML = '<tr><td colspan="3">Service items</td></tr>';
    }

    const receiptHTML = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Service Receipt - ${invoice.invoice_number}</title>
        <style>
          @media print { @page { margin: 0.5cm; size: 80mm auto; } }
          body { font-family: 'Courier New', monospace; width: 80mm; margin: 0 auto; padding: 10px; font-size: 12px; }
          .header { text-align: center; border-bottom: 2px dashed #000; padding-bottom: 10px; margin-bottom: 10px; }
          .header h2 { margin: 5px 0; font-size: 18px; }
          .info { margin: 10px 0; font-size: 11px; }
          table { width: 100%; margin: 10px 0; border-collapse: collapse; }
          th { border-bottom: 1px solid #000; padding: 5px 2px; text-align: left; font-size: 11px; }
          td { padding: 5px 2px; font-size: 11px; }
          .employee { font-size: 10px; color: #666; font-style: italic; }
          .totals { margin-top: 10px; padding-top: 10px; border-top: 2px dashed #000; }
          .totals-row { display: flex; justify-content: space-between; padding: 3px 0; font-size: 12px; }
          .total-final { font-weight: bold; font-size: 14px; border-top: 1px solid #000; margin-top: 5px; padding-top: 5px; }
          .footer { text-align: center; margin-top: 15px; padding-top: 10px; border-top: 2px dashed #000; font-size: 11px; }
        </style>
      </head>
      <body>
        <div class="header">
          <h2>${business.business_name || 'Service Business'}</h2>
          <p>${business.address || 'Business Address'}</p>
          <p>Tel: ${business.phone || 'N/A'} | Email: ${business.email || user.email || 'N/A'}</p>
        </div>
        <div class="info">
          <div><strong>Invoice:</strong> ${invoice.invoice_number}</div>
          <div><strong>Date:</strong> ${new Date(invoice.created_at).toLocaleString()}</div>
          <div><strong>Customer:</strong> ${invoice.customer_name || 'N/A'}</div>
          <div><strong>Phone:</strong> ${invoice.customer_phone || 'N/A'}</div>
          <div><strong>Payment:</strong> ${invoice.payment_method || 'Cash'}</div>
        </div>
        <table>
          <thead>
            <tr>
              <th>Service</th>
              <th>Duration</th>
              <th>Price</th>
            </tr>
          </thead>
          <tbody>
            ${itemsHTML}
          </tbody>
        </table>
        <div class="totals">
          <div class="totals-row"><span>Subtotal:</span><span>$${subtotal.toFixed(2)}</span></div>
          <div class="totals-row"><span>VAT (16%):</span><span>$${vat.toFixed(2)}</span></div>
          <div class="totals-row total-final"><span>TOTAL:</span><span>$${total.toFixed(2)}</span></div>
        </div>
        <div class="footer">
          <p>Thank you for choosing us!</p>
          <p>We look forward to serving you again</p>
        </div>
        <script>
          window.onload = function() {
            window.print();
            setTimeout(function() { window.close(); }, 100);
          };
        </script>
      </body>
      </html>
    `;
    printWindow.document.write(receiptHTML);
    printWindow.document.close();
  };

  const getPaymentChip = (method: string) => {
    const colorMap: any = {
      Cash: 'success',
      'Credit Card': 'info',
      'Debit Card': 'info',
      'Mobile Money': 'warning',
    };
    return <Chip label={method} color={colorMap[method] || 'default'} size="small" />;
  };

  return (
    <Box sx={{ p: 2 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h6">📄 Service Invoices</Typography>
        <TextField
          placeholder="Search by invoice #, customer, phone..."
          size="small"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          sx={{ width: 350 }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
          }}
        />
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>{error}</Alert>}

      {loading ? (
        <Card sx={{ p: 4, textAlign: 'center' }}>
          <Typography>Loading invoices...</Typography>
        </Card>
      ) : filteredInvoices.length === 0 ? (
        <Card sx={{ p: 4, textAlign: 'center' }}>
          <Typography color="text.secondary">
            {searchQuery ? 'No invoices found matching your search.' : 'No invoices yet. Create invoices from the Billing tab.'}
          </Typography>
        </Card>
      ) : (
        <Card>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
                  <TableCell><strong>Invoice #</strong></TableCell>
                  <TableCell><strong>Date</strong></TableCell>
                  <TableCell><strong>Customer</strong></TableCell>
                  <TableCell><strong>Phone</strong></TableCell>
                  <TableCell><strong>Payment</strong></TableCell>
                  <TableCell align="right"><strong>Subtotal</strong></TableCell>
                  <TableCell align="right"><strong>VAT</strong></TableCell>
                  <TableCell align="right"><strong>Total</strong></TableCell>
                  <TableCell align="center"><strong>Actions</strong></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredInvoices.map((invoice) => (
                  <TableRow key={invoice.id} hover>
                    <TableCell>
                      <Typography variant="body2" fontWeight="bold" color="primary">
                        {invoice.invoice_number}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {new Date(invoice.created_at).toLocaleDateString()}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {new Date(invoice.created_at).toLocaleTimeString()}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">{invoice.customer_name || 'N/A'}</Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">{invoice.customer_phone || 'N/A'}</Typography>
                    </TableCell>
                    <TableCell>
                      {getPaymentChip(invoice.payment_method || 'Cash')}
                    </TableCell>
                    <TableCell align="right">
                      <Typography variant="body2">${Number(invoice.subtotal).toFixed(2)}</Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Typography variant="body2">${Number(invoice.vat_amount).toFixed(2)}</Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Typography variant="body2" fontWeight="bold" color="primary">
                        ${Number(invoice.total_amount).toFixed(2)}
                      </Typography>
                    </TableCell>
                    <TableCell align="center">
                      <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center' }}>
                        <Tooltip title="Print Receipt">
                          <IconButton
                            size="small"
                            color="primary"
                            onClick={() => handlePrintInvoice(invoice)}
                          >
                            <PrintIcon />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Card>
      )}

      <Box sx={{ mt: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="body2" color="text.secondary">
          Showing {filteredInvoices.length} of {invoices.length} invoice(s)
        </Typography>
        {filteredInvoices.length > 0 && (
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Typography variant="body2">
              <strong>Total Revenue:</strong> ${filteredInvoices.reduce((sum, inv) => sum + Number(inv.total_amount), 0).toFixed(2)}
            </Typography>
          </Box>
        )}
      </Box>
    </Box>
  );
};

export default InvoicesTab;
