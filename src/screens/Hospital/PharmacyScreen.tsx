import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Paper,
  Typography,
  TextField,
  Button,
  Grid,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Chip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Checkbox,
  FormControlLabel,
} from '@mui/material';
import {
  Refresh as RefreshIcon,
  LocalPharmacy as PharmacyIcon,
  Print as PrintIcon,
} from '@mui/icons-material';
import { ApiService } from '../../services/api';

interface Prescription {
  id: number;
  prescription_number: string;
  patient_name: string;
  national_id?: string;
  disease_diagnosis?: string;
  total_amount: number;
  status: string;
  created_at: string;
}

interface PrescriptionItem {
  id: number;
  item_name: string;
  quantity_prescribed: number;
  quantity_available: number;
  quantity_fulfilled: number;
  unit_price: number;
  total_price: number;
  is_available: boolean;
  is_missing: boolean;
  current_stock?: number;
}

const PharmacyScreen: React.FC = () => {
  const [pendingPrescriptions, setPendingPrescriptions] = useState<Prescription[]>([]);
  const [selectedPrescription, setSelectedPrescription] = useState<Prescription | null>(null);
  const [prescriptionItems, setPrescriptionItems] = useState<PrescriptionItem[]>([]);
  const [financialAccounts, setFinancialAccounts] = useState<any[]>([]);
  const [selectedAccount, setSelectedAccount] = useState('');
  const [itemsDialogOpen, setItemsDialogOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    loadPendingPrescriptions();
    loadFinancialAccounts();
    // Refresh every 30 seconds
    const interval = setInterval(loadPendingPrescriptions, 30000);
    return () => clearInterval(interval);
  }, []);

  const loadPendingPrescriptions = async () => {
    try {
      const response = await ApiService.getPendingPrescriptions();
      if (response.success) {
        setPendingPrescriptions(response.data.prescriptions || []);
      }
    } catch (err: any) {
      console.error('Error loading prescriptions:', err);
    }
  };

  const loadFinancialAccounts = async () => {
    try {
      const response = await ApiService.getFinancialAccounts();
      if (response.success) {
        const accounts = response.data.accounts || response.accounts || [];
        setFinancialAccounts(accounts);
        if (accounts.length > 0) {
          setSelectedAccount(accounts[0].id);
        }
      }
    } catch (err: any) {
      console.error('Error loading financial accounts:', err);
    }
  };

  const handleSelectPrescription = async (prescription: Prescription) => {
    setSelectedPrescription(prescription);
    try {
      const response = await ApiService.getPrescriptionItems(prescription.id);
      if (response.success) {
        setPrescriptionItems(response.data.items || []);
        setItemsDialogOpen(true);
      }
    } catch (err: any) {
      setError('Failed to load prescription items');
      console.error('Error:', err);
    }
  };

  const handleUpdateItemAvailability = (itemId: number, isAvailable: boolean, quantityFulfilled: number) => {
    setPrescriptionItems(
      prescriptionItems.map((item) =>
        item.id === itemId
          ? {
              ...item,
              is_available: isAvailable,
              is_missing: !isAvailable,
              quantity_fulfilled: isAvailable ? quantityFulfilled : 0,
            }
          : item
      )
    );
  };

  const handleFulfillPrescription = async () => {
    if (!selectedPrescription) return;

    if (!selectedAccount) {
      setError('Please select a financial account');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const items = prescriptionItems.map((item) => ({
        prescription_item_id: item.id,
        quantity_fulfilled: item.is_available ? item.quantity_fulfilled : 0,
        is_available: item.is_available,
      }));

      const response = await ApiService.fulfillPrescription(selectedPrescription.id, {
        items,
        financial_account_id: Number(selectedAccount),
      });

      if (response.success) {
        setSuccess('Prescription fulfilled and billed successfully!');
        setItemsDialogOpen(false);
        setSelectedPrescription(null);
        setPrescriptionItems([]);
        await loadPendingPrescriptions();
      } else {
        setError('Failed to fulfill prescription');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'An error occurred');
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  const calculateTotal = () => {
    return prescriptionItems
      .filter((item) => item.is_available)
      .reduce((sum, item) => sum + item.quantity_fulfilled * item.unit_price, 0);
  };

  const printReceipt = () => {
    if (!selectedPrescription) return;

    const business = JSON.parse(localStorage.getItem('business') || '{}');
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const total = calculateTotal();

    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert('Please allow popups to print receipt');
      return;
    }

    const receiptHTML = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Pharmacy Receipt</title>
        <style>
          @media print {
            @page { margin: 0.5cm; size: 80mm auto; }
          }
          body {
            font-family: 'Courier New', monospace;
            width: 80mm;
            margin: 0 auto;
            padding: 10px;
            font-size: 12px;
          }
          .header {
            text-align: center;
            border-bottom: 2px dashed #000;
            padding-bottom: 10px;
            margin-bottom: 10px;
          }
          .items {
            width: 100%;
            margin: 10px 0;
            border-collapse: collapse;
          }
          .items td {
            padding: 5px 2px;
            font-size: 11px;
          }
          .totals {
            margin-top: 10px;
            padding-top: 10px;
            border-top: 2px dashed #000;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h2>${business.business_name || 'Pharmacy'}</h2>
          <p>${business.address || 'Pharmacy Address'}</p>
        </div>
        
        <div>
          <div style="display: flex; justify-content: space-between;">
            <span>Prescription #:</span>
            <span>${selectedPrescription.prescription_number}</span>
          </div>
          <div style="display: flex; justify-content: space-between;">
            <span>Patient:</span>
            <span>${selectedPrescription.patient_name}</span>
          </div>
        </div>
        
        <table class="items">
          <thead>
            <tr>
              <th>Medicine</th>
              <th>Qty</th>
              <th>Price</th>
              <th>Total</th>
            </tr>
          </thead>
          <tbody>
            ${prescriptionItems
              .filter((item) => item.is_available)
              .map(
                (item) => `
              <tr>
                <td>${item.item_name}</td>
                <td>${item.quantity_fulfilled}</td>
                <td>${item.unit_price.toFixed(2)}</td>
                <td>${(item.quantity_fulfilled * item.unit_price).toFixed(2)}</td>
              </tr>
            `
              )
              .join('')}
          </tbody>
        </table>
        
        <div class="totals">
          <div style="display: flex; justify-content: space-between; font-weight: bold;">
            <span>TOTAL:</span>
            <span>KES ${total.toFixed(2)}</span>
          </div>
        </div>
        
        <script>
          window.onload = function() {
            window.print();
            setTimeout(function() {
              window.close();
            }, 100);
          };
        </script>
      </body>
      </html>
    `;

    printWindow.document.write(receiptHTML);
    printWindow.document.close();
  };

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom sx={{ mb: 3 }}>
        Pharmacy - Prescription Fulfillment
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess('')}>
          {success}
        </Alert>
      )}

      <Paper sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6">Pending Prescriptions</Typography>
          <IconButton onClick={loadPendingPrescriptions} size="small">
            <RefreshIcon />
          </IconButton>
        </Box>

        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Prescription #</TableCell>
                <TableCell>Patient Name</TableCell>
                <TableCell>ID Number</TableCell>
                <TableCell>Diagnosis</TableCell>
                <TableCell>Total Amount</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Action</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {pendingPrescriptions.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
                    <Typography color="text.secondary">
                      No pending prescriptions. New prescriptions will appear here when created by doctors.
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                pendingPrescriptions.map((prescription) => (
                  <TableRow key={prescription.id} hover>
                    <TableCell>{prescription.prescription_number}</TableCell>
                    <TableCell>{prescription.patient_name}</TableCell>
                    <TableCell>{prescription.national_id || 'N/A'}</TableCell>
                    <TableCell>{prescription.disease_diagnosis || 'N/A'}</TableCell>
                    <TableCell>KES {Number(prescription.total_amount).toFixed(2)}</TableCell>
                    <TableCell>
                      <Chip
                        label={prescription.status}
                        color={
                          prescription.status === 'fulfilled'
                            ? 'success'
                            : prescription.status === 'partially_fulfilled'
                            ? 'warning'
                            : 'default'
                        }
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <Button
                        size="small"
                        variant="contained"
                        onClick={() => handleSelectPrescription(prescription)}
                        startIcon={<PharmacyIcon />}
                      >
                        View & Bill
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* Prescription Items Dialog */}
      <Dialog
        open={itemsDialogOpen}
        onClose={() => setItemsDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          Prescription Items - {selectedPrescription?.prescription_number}
        </DialogTitle>
        <DialogContent>
          {selectedPrescription && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Patient: {selectedPrescription.patient_name} | ID: {selectedPrescription.national_id || 'N/A'}
              </Typography>

              <TableContainer sx={{ mt: 2 }}>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Medicine</TableCell>
                      <TableCell>Prescribed</TableCell>
                      <TableCell>Available</TableCell>
                      <TableCell>Fulfill</TableCell>
                      <TableCell>Price</TableCell>
                      <TableCell>Total</TableCell>
                      <TableCell>Status</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {prescriptionItems.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell>{item.item_name}</TableCell>
                        <TableCell>{item.quantity_prescribed}</TableCell>
                        <TableCell>{item.current_stock ?? item.quantity_available}</TableCell>
                        <TableCell>
                          <TextField
                            type="number"
                            size="small"
                            value={item.quantity_fulfilled}
                            onChange={(e) => {
                              const qty = parseFloat(e.target.value) || 0;
                              const maxQty = Math.min(
                                item.quantity_prescribed,
                                item.current_stock ?? item.quantity_available
                              );
                              const finalQty = Math.min(qty, maxQty);
                              handleUpdateItemAvailability(item.id, finalQty > 0, finalQty);
                            }}
                            inputProps={{ min: 0, max: item.quantity_prescribed }}
                            sx={{ width: 80 }}
                            disabled={!item.is_available}
                          />
                        </TableCell>
                        <TableCell>KES {item.unit_price.toFixed(2)}</TableCell>
                        <TableCell>
                          KES {(item.quantity_fulfilled * item.unit_price).toFixed(2)}
                        </TableCell>
                        <TableCell>
                          <FormControlLabel
                            control={
                              <Checkbox
                                checked={item.is_available}
                                onChange={(e) => {
                                  handleUpdateItemAvailability(
                                    item.id,
                                    e.target.checked,
                                    e.target.checked ? item.quantity_fulfilled : 0
                                  );
                                }}
                              />
                            }
                            label={item.is_available ? 'Available' : 'Missing'}
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>

              <Box sx={{ mt: 3, p: 2, bgcolor: 'grey.100', borderRadius: 1 }}>
                <Typography variant="h6" gutterBottom>
                  Total: KES {calculateTotal().toFixed(2)}
                </Typography>
                <FormControl fullWidth sx={{ mt: 2 }}>
                  <InputLabel>Financial Account</InputLabel>
                  <Select
                    value={selectedAccount}
                    onChange={(e) => setSelectedAccount(e.target.value)}
                    label="Financial Account"
                  >
                    {financialAccounts.map((account) => (
                      <MenuItem key={account.id} value={account.id}>
                        {account.account_name} - Balance: KES{' '}
                        {Number(account.current_balance || account.balance || 0).toFixed(2)}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setItemsDialogOpen(false)}>Cancel</Button>
          <Button onClick={printReceipt} variant="outlined" startIcon={<PrintIcon />}>
            Print Receipt
          </Button>
          <Button
            onClick={handleFulfillPrescription}
            variant="contained"
            disabled={loading || !selectedAccount}
            startIcon={<PharmacyIcon />}
          >
            {loading ? 'Processing...' : 'Bill & Fulfill'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default PharmacyScreen;

