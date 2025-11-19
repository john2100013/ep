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
  Chip,
  Checkbox,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import { Receipt as ReceiptIcon } from '@mui/icons-material';
import { ServiceBillingAPI } from '../../services/serviceBillingApi';

const BillingTab: React.FC = () => {
  const [assignments, setAssignments] = useState<any[]>([]);
  const [selectedAssignments, setSelectedAssignments] = useState<number[]>([]);
  const [groupedByCustomer, setGroupedByCustomer] = useState<Map<number, any[]>>(new Map());
  const [openBilling, setOpenBilling] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const response = await ServiceBillingAPI.getAssignmentsForBilling();
      const assignmentsData = response.data.data.assignments;
      setAssignments(assignmentsData);
      
      // Group assignments by customer
      const grouped = new Map<number, any[]>();
      assignmentsData.forEach((assignment: any) => {
        const customerId = assignment.customer_id;
        if (!grouped.has(customerId)) {
          grouped.set(customerId, []);
        }
        grouped.get(customerId)!.push(assignment);
      });
      setGroupedByCustomer(grouped);
    } catch (err) {
      console.error('Failed to load billing data:', err);
    }
  };

  const getStatusChip = (status: string) => {
    const statusMap: any = {
      in_progress: { label: 'In Progress', color: 'warning' },
      completed: { label: 'Completed', color: 'success' },
    };
    const config = statusMap[status] || { label: status, color: 'default' };
    return <Chip label={config.label} color={config.color} size="small" />;
  };

  const handleSelectAssignment = (assignmentId: number) => {
    setSelectedAssignments(prev => {
      if (prev.includes(assignmentId)) {
        return prev.filter(id => id !== assignmentId);
      } else {
        return [...prev, assignmentId];
      }
    });
  };

  const handleSelectAllForCustomer = (customerId: number) => {
    const customerAssignments = groupedByCustomer.get(customerId) || [];
    const customerAssignmentIds = customerAssignments.map(a => a.id);
    
    const allSelected = customerAssignmentIds.every(id => selectedAssignments.includes(id));
    
    if (allSelected) {
      setSelectedAssignments(prev => prev.filter(id => !customerAssignmentIds.includes(id)));
    } else {
      setSelectedAssignments(prev => [...new Set([...prev, ...customerAssignmentIds])]);
    }
  };

  const handleOpenBilling = (customerId: number) => {
    const customerAssignments = groupedByCustomer.get(customerId) || [];
    if (customerAssignments.length === 0) return;
    
    setSelectedCustomer({
      id: customerId,
      name: customerAssignments[0].customer_name,
      phone: customerAssignments[0].customer_phone,
      assignments: customerAssignments.filter(a => selectedAssignments.includes(a.id))
    });
    setOpenBilling(true);
  };

  const handleCreateInvoice = async () => {
    if (!selectedCustomer || selectedCustomer.assignments.length === 0) {
      setError('Please select at least one service to bill');
      return;
    }

    try {
      setLoading(true);
      setError('');
      
      const response = await ServiceBillingAPI.createInvoiceFromAssignments({
        customer_id: selectedCustomer.id,
        assignment_ids: selectedCustomer.assignments.map((a: any) => a.id),
        payment_method: 'Cash',
        notes: `Service billing for ${selectedCustomer.name}`
      });

      const invoice = response.data.data.invoice;
      printReceipt(invoice, selectedCustomer);
      
      setSuccess(`Invoice ${invoice.invoice_number} created successfully!`);
      setSelectedAssignments([]);
      setOpenBilling(false);
      loadData();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create invoice');
    } finally {
      setLoading(false);
    }
  };

  const printReceipt = (invoice: any, customerData: any) => {
    const business = JSON.parse(localStorage.getItem('business') || '{}');
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const subtotal = Number(invoice.subtotal);
    const vat = Number(invoice.vat_amount);
    const total = Number(invoice.total_amount);

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
          <div><strong>Customer:</strong> ${customerData.name}</div>
          <div><strong>Phone:</strong> ${customerData.phone}</div>
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
            ${customerData.assignments.map((a: any) => `
              <tr>
                <td>
                  ${a.service_name}
                  <div class="employee">by ${a.employee_name}</div>
                </td>
                <td>${Math.round(a.actual_duration || a.estimated_duration)}min</td>
                <td>$${Number(a.service_price).toFixed(2)}</td>
              </tr>
            `).join('')}
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

  const calculateTotal = (customerAssignments: any[]) => {
    const selectedCustomerAssignments = customerAssignments.filter(a => 
      selectedAssignments.includes(a.id)
    );
    const subtotal = selectedCustomerAssignments.reduce((sum, a) => sum + Number(a.service_price), 0);
    const vat = subtotal * 0.16;
    return subtotal + vat;
  };

  return (
    <Box sx={{ p: 2 }}>
      <Typography variant="h6" sx={{ mb: 3 }}>Billing - Service Assignments</Typography>

      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>{error}</Alert>}
      {success && <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess('')}>{success}</Alert>}

      <Alert severity="info" sx={{ mb: 2 }}>
        <Typography variant="body2">
          <strong>Note:</strong> You can bill services even if they're still in progress. Some customers may prefer to pay before service completion.
        </Typography>
      </Alert>

      {assignments.length === 0 ? (
        <Card sx={{ p: 4, textAlign: 'center' }}>
          <Typography color="text.secondary">
            No services available for billing. Assign customers to employees in the Assignments tab first.
          </Typography>
        </Card>
      ) : (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          {Array.from(groupedByCustomer.entries()).map(([customerId, customerAssignments]) => {
            const customerName = customerAssignments[0].customer_name;
            const customerPhone = customerAssignments[0].customer_phone;
            const selectedCount = customerAssignments.filter(a => selectedAssignments.includes(a.id)).length;
            const total = calculateTotal(customerAssignments);
            
            return (
              <Card key={customerId}>
                <Box sx={{ p: 2, backgroundColor: '#f5f5f5', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Checkbox
                      checked={customerAssignments.every(a => selectedAssignments.includes(a.id))}
                      indeterminate={
                        customerAssignments.some(a => selectedAssignments.includes(a.id)) &&
                        !customerAssignments.every(a => selectedAssignments.includes(a.id))
                      }
                      onChange={() => handleSelectAllForCustomer(customerId)}
                    />
                    <Box>
                      <Typography variant="h6">{customerName}</Typography>
                      <Typography variant="body2" color="text.secondary">
                        {customerPhone} • {customerAssignments.length} service(s) completed
                      </Typography>
                    </Box>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    {selectedCount > 0 && (
                      <Chip 
                        label={`${selectedCount} selected • Total: $${total.toFixed(2)}`}
                        color="primary"
                      />
                    )}
                    <Button
                      variant="contained"
                      startIcon={<ReceiptIcon />}
                      onClick={() => handleOpenBilling(customerId)}
                      disabled={selectedCount === 0}
                      sx={{ backgroundColor: '#4caf50' }}
                    >
                      Bill Customer
                    </Button>
                  </Box>
                </Box>
                
                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell padding="checkbox"></TableCell>
                        <TableCell><strong>Date</strong></TableCell>
                        <TableCell><strong>Service</strong></TableCell>
                        <TableCell><strong>Employee</strong></TableCell>
                        <TableCell><strong>Status</strong></TableCell>
                        <TableCell><strong>Duration</strong></TableCell>
                        <TableCell align="right"><strong>Price</strong></TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {customerAssignments.map((assignment) => (
                        <TableRow key={assignment.id} hover>
                          <TableCell padding="checkbox">
                            <Checkbox
                              checked={selectedAssignments.includes(assignment.id)}
                              onChange={() => handleSelectAssignment(assignment.id)}
                            />
                          </TableCell>
                          <TableCell>
                            {new Date(assignment.start_time).toLocaleDateString()}
                            <br />
                            <Typography variant="caption" color="text.secondary">
                              {new Date(assignment.start_time).toLocaleTimeString()}
                            </Typography>
                          </TableCell>
                          <TableCell>{assignment.service_name}</TableCell>
                          <TableCell>{assignment.employee_name}</TableCell>
                          <TableCell>{getStatusChip(assignment.status)}</TableCell>
                          <TableCell>
                            {Math.round(assignment.actual_duration || assignment.estimated_duration)} min
                            {assignment.status === 'in_progress' && (
                              <Typography variant="caption" color="warning.main" display="block">
                                (Ongoing)
                              </Typography>
                            )}
                          </TableCell>
                          <TableCell align="right">
                            <Typography fontWeight="bold">
                              ${Number(assignment.service_price).toFixed(2)}
                            </Typography>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Card>
            );
          })}
        </Box>
      )}

      {/* Billing Confirmation Dialog */}
      <Dialog open={openBilling} onClose={() => setOpenBilling(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Create Invoice</DialogTitle>
        <DialogContent>
          {selectedCustomer && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="body1" gutterBottom>
                <strong>Customer:</strong> {selectedCustomer.name}
              </Typography>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                {selectedCustomer.phone}
              </Typography>
              
              <Box sx={{ mt: 3, p: 2, backgroundColor: '#f5f5f5', borderRadius: 1 }}>
                <Typography variant="body2" gutterBottom>
                  <strong>Services to bill:</strong>
                </Typography>
                {selectedCustomer.assignments.map((a: any, index: number) => (
                  <Box key={index} sx={{ display: 'flex', justifyContent: 'space-between', mt: 1 }}>
                    <Typography variant="body2">
                      {a.service_name} <span style={{ color: '#666' }}>by {a.employee_name}</span>
                    </Typography>
                    <Typography variant="body2">${Number(a.service_price).toFixed(2)}</Typography>
                  </Box>
                ))}
                
                <Box sx={{ mt: 2, pt: 2, borderTop: '1px solid #ddd' }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                    <Typography variant="body2">Subtotal:</Typography>
                    <Typography variant="body2">
                      ${selectedCustomer.assignments.reduce((sum: number, a: any) => 
                        sum + Number(a.service_price), 0
                      ).toFixed(2)}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                    <Typography variant="body2">VAT (16%):</Typography>
                    <Typography variant="body2">
                      ${(selectedCustomer.assignments.reduce((sum: number, a: any) => 
                        sum + Number(a.service_price), 0
                      ) * 0.16).toFixed(2)}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1, pt: 1, borderTop: '1px solid #000' }}>
                    <Typography variant="h6">Total:</Typography>
                    <Typography variant="h6" color="primary">
                      ${(selectedCustomer.assignments.reduce((sum: number, a: any) => 
                        sum + Number(a.service_price), 0
                      ) * 1.16).toFixed(2)}
                    </Typography>
                  </Box>
                </Box>
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenBilling(false)}>Cancel</Button>
          <Button
            onClick={handleCreateInvoice}
            variant="contained"
            disabled={loading}
            sx={{ backgroundColor: '#4caf50' }}
          >
            Create Invoice & Print
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default BillingTab;
