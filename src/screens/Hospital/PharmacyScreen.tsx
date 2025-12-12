import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Paper,
  Typography,
  TextField,
  Button,
  Alert,
  Grid,
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
  Search as SearchIcon,
  FilterList as FilterListIcon,
  Assessment as AssessmentIcon,
  Close as CloseIcon,
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { ApiService, api } from '../../services/api';

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
  
  // Payment-related state (from POSScreen)
  const [amountPaid, setAmountPaid] = useState<number>(0);
  const [mpesaCode, setMpesaCode] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<string>('Cash');
  const [mpesaConfirmations, setMpesaConfirmations] = useState<any[]>([]);
  const [mpesaModalOpen, setMpesaModalOpen] = useState(false);
  
  // Search and filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [allPrescriptionsModalOpen, setAllPrescriptionsModalOpen] = useState(false);
  const [allPrescriptions, setAllPrescriptions] = useState<Prescription[]>([]);
  const [dateFilter, setDateFilter] = useState<'today' | 'week' | 'month' | 'custom'>('today');
  const [startDate, setStartDate] = useState<Date | null>(new Date(new Date().setHours(0, 0, 0, 0)));
  const [endDate, setEndDate] = useState<Date | null>(new Date(new Date().setHours(23, 59, 59, 999)));
  const [loadingPrescriptions, setLoadingPrescriptions] = useState(false);

  // Helper function to safely get numeric value
  const getNumericValue = (value: any): number => {
    const num = Number(value);
    return isNaN(num) ? 0 : num;
  };

  useEffect(() => {
    loadPendingPrescriptions();
    loadFinancialAccounts();
    // Refresh every 30 seconds
    const interval = setInterval(loadPendingPrescriptions, 30000);
    return () => clearInterval(interval);
  }, []);

  // Update dates when filter changes
  useEffect(() => {
    const now = new Date();
    const todayStart = new Date(now.setHours(0, 0, 0, 0));
    const todayEnd = new Date(now.setHours(23, 59, 59, 999));
    
    switch (dateFilter) {
      case 'today':
        setStartDate(new Date(todayStart));
        setEndDate(new Date(todayEnd));
        break;
      case 'week':
        const weekStart = new Date(todayStart);
        weekStart.setDate(weekStart.getDate() - weekStart.getDay());
        setStartDate(weekStart);
        setEndDate(new Date(todayEnd));
        break;
      case 'month':
        const monthStart = new Date(todayStart);
        monthStart.setDate(1);
        setStartDate(monthStart);
        setEndDate(new Date(todayEnd));
        break;
      case 'custom':
        // Keep custom dates as is
        break;
    }
  }, [dateFilter]);

  // Load all prescriptions with filters
  const loadAllPrescriptions = async () => {
    try {
      setLoadingPrescriptions(true);
      setError('');
      
      // Format dates for API
      const startDateStr = startDate ? startDate.toISOString() : undefined;
      const endDateStr = endDate ? endDate.toISOString() : undefined;
      
      const response = await ApiService.getAllPrescriptions({
        startDate: startDateStr,
        endDate: endDateStr,
        search: searchQuery.trim() || undefined,
      });
      
      const prescriptions = response.data?.prescriptions || response.data || [];
      setAllPrescriptions(prescriptions);
      
      console.log('✅ Loaded prescriptions:', prescriptions.length);
    } catch (err: any) {
      console.error('Error loading all prescriptions:', err);
      console.error('Error response:', err.response?.data);
      setError(err.response?.data?.message || 'Failed to load prescriptions');
    } finally {
      setLoadingPrescriptions(false);
    }
  };

  // Calculate statistics
  const calculateStatistics = () => {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);
    
    const todayPrescriptions = allPrescriptions.filter((p) => {
      const date = new Date(p.created_at);
      return date >= todayStart && date <= todayEnd && (p.status === 'fulfilled' || p.status === 'partially_fulfilled');
    });
    
    const todayTotal = todayPrescriptions.reduce((sum, p) => sum + getNumericValue(p.total_amount), 0);
    
    const allFulfilled = allPrescriptions.filter((p) => 
      p.status === 'fulfilled' || p.status === 'partially_fulfilled'
    );
    const allFulfilledTotal = allFulfilled.reduce((sum, p) => sum + getNumericValue(p.total_amount), 0);
    
    return {
      todayTotal,
      allFulfilledTotal,
      todayCount: todayPrescriptions.length,
      allFulfilledCount: allFulfilled.length,
    };
  };

  // Calculate missing medicine statistics from prescription items
  const calculateMissingMedicineStats = async () => {
    let missingCount = 0;
    let missingValue = 0;
    
    try {
      // Fetch items for all prescriptions to check for missing medicines
      for (const prescription of allPrescriptions) {
        try {
          const response = await ApiService.getPrescriptionItems(prescription.id);
          if (response.success && response.data?.items) {
            const items = response.data.items;
            items.forEach((item: PrescriptionItem) => {
              if (item.is_missing || !item.is_available) {
                missingCount++;
                const itemValue = getNumericValue(item.quantity_prescribed) * getNumericValue(item.unit_price);
                missingValue += itemValue;
              }
            });
          }
        } catch (err) {
          // Skip if can't fetch items for this prescription
          console.warn(`Could not fetch items for prescription ${prescription.id}`);
        }
      }
    } catch (err) {
      console.error('Error calculating missing medicine stats:', err);
    }
    
    return { missingCount, missingValue };
  };

  const [missingStats, setMissingStats] = useState({ missingCount: 0, missingValue: 0 });

  useEffect(() => {
    if (allPrescriptions.length > 0 && allPrescriptionsModalOpen) {
      calculateMissingMedicineStats().then(setMissingStats);
    } else {
      setMissingStats({ missingCount: 0, missingValue: 0 });
    }
  }, [allPrescriptions, allPrescriptionsModalOpen]);

  // Load prescriptions when modal opens
  // Load prescriptions when modal opens or filters change
  useEffect(() => {
    if (allPrescriptionsModalOpen) {
      console.log('🔄 Modal opened, loading prescriptions with filters:', { dateFilter, startDate, endDate, searchQuery });
      loadAllPrescriptions();
    }
  }, [allPrescriptionsModalOpen, dateFilter]);

  const stats = calculateStatistics();

  // Fetch pending M-Pesa confirmations
  const fetchMpesaConfirmations = async () => {
    try {
      setLoading(true);
      const response = await ApiService.getPendingMpesaConfirmations();
      const confirmations = response.data?.confirmations || [];
      setMpesaConfirmations(confirmations);
    } catch (error) {
      console.error('Failed to fetch M-Pesa confirmations:', error);
      setError('Failed to load M-Pesa confirmations');
    } finally {
      setLoading(false);
    }
  };

  // Handle M-Pesa confirmation selection
  const handleMpesaConfirmationSelect = async (confirmation: any) => {
    try {
      setMpesaCode(confirmation.trans_id);
      setAmountPaid(parseFloat(confirmation.trans_amount) || 0);
      setMpesaModalOpen(false);
    } catch (error) {
      console.error('Error selecting M-Pesa confirmation:', error);
    }
  };

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
      if (!prescription?.id) {
        setError('Invalid prescription selected');
        console.error('Invalid prescription object:', prescription);
        return;
      }

      console.log('Requesting prescription items for id=', prescription.id);
      const response = await ApiService.getPrescriptionItems(prescription.id);
      if (response && response.success) {
        // Normalize numeric fields to ensure they are numbers
        const items = (response.data.items || []).map((item: PrescriptionItem) => ({
          ...item,
          unit_price: getNumericValue(item.unit_price),
          quantity_prescribed: getNumericValue(item.quantity_prescribed),
          quantity_fulfilled: getNumericValue(item.quantity_fulfilled),
          quantity_available: getNumericValue(item.quantity_available),
          current_stock: item.current_stock ? getNumericValue(item.current_stock) : undefined,
        }));
        setPrescriptionItems(items);
        setItemsDialogOpen(true);
      } else {
        // If API returned a non-success payload
        console.error('getPrescriptionItems returned non-success:', response);
        setError('Failed to load prescription items (server responded with unexpected payload)');
      }
    } catch (err: any) {
      // Log full error details to help diagnose 400 responses
      console.error('Error loading prescription items:', err);
      console.error('Error response status:', err.response?.status);
      console.error('Error response data:', err.response?.data);
      setError(
        (err.response && (err.response.data?.message || JSON.stringify(err.response.data))) ||
          err.message ||
          'Failed to load prescription items'
      );
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

  // Update prescribed quantity
  const handleUpdatePrescribedQuantity = (itemId: number, quantity: number) => {
    setPrescriptionItems(
      prescriptionItems.map((item) =>
        item.id === itemId
          ? {
              ...item,
              quantity_prescribed: Math.max(0, quantity),
              // Auto-adjust fulfilled quantity if it exceeds new prescribed amount
              quantity_fulfilled: Math.min(item.quantity_fulfilled, Math.max(0, quantity)),
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
      // Validate that we have items
      if (!prescriptionItems || prescriptionItems.length === 0) {
        setError('No prescription items to fulfill');
        setLoading(false);
        return;
      }

      // Map items with proper validation
      const items = prescriptionItems.map((item) => {
        const qtyFulfilled = getNumericValue(item.quantity_fulfilled);
        const isAvailable = item.is_available !== false;
        
        return {
          prescription_item_id: Number(item.id),
          quantity_fulfilled: isAvailable ? qtyFulfilled : 0,
          is_available: isAvailable,
        };
      }).filter(item => item.prescription_item_id > 0); // Filter out invalid items

      if (items.length === 0) {
        setError('No valid prescription items to fulfill');
        setLoading(false);
        return;
      }

      const total = calculateTotal();
      
      // Backend expects prescription_id in the body, not just in URL
      const response = await ApiService.fulfillPrescription(selectedPrescription.id, {
        prescription_id: Number(selectedPrescription.id),
        items,
        financial_account_id: Number(selectedAccount),
      });

      if (response.success) {
        // Link M-Pesa confirmation if M-Pesa code is provided
        if (paymentMethod === 'M-Pesa' && mpesaCode && response.data?.invoice?.id) {
          try {
            const confirmationsResponse = await ApiService.getAllMpesaConfirmations({ linked: false });
            const confirmations = confirmationsResponse.data?.confirmations || [];
            const matchingConfirmation = confirmations.find((c: any) => c.trans_id === mpesaCode);
            
            if (matchingConfirmation) {
              await ApiService.linkMpesaConfirmation(matchingConfirmation.id, response.data.invoice.id);
              console.log('✅ M-Pesa confirmation linked to invoice');
            }
          } catch (linkError) {
            console.error('⚠️ Failed to link M-Pesa confirmation:', linkError);
          }
        }

        // Update financial account balance
        try {
          await api.patch(`/financial-accounts/${selectedAccount}/balance`, {
            amount: total,
            operation: 'add'
          });
          console.log('✅ Financial account updated successfully');
        } catch (balanceError) {
          console.error('⚠️ Failed to update financial account balance:', balanceError);
        }

        setSuccess('Prescription fulfilled and billed successfully!');
        setItemsDialogOpen(false);
        setSelectedPrescription(null);
        setPrescriptionItems([]);
        setAmountPaid(0);
        setMpesaCode('');
        setPaymentMethod('Cash');
        await loadPendingPrescriptions();
        await loadFinancialAccounts();
      } else {
        setError('Failed to fulfill prescription');
      }
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || err.message || 'An error occurred';
      setError(errorMessage);
      console.error('Error fulfilling prescription:', err);
      console.error('Error response:', err.response?.data);
      console.error('Request data sent:', {
        prescription_id: selectedPrescription.id,
        items: prescriptionItems.map((item) => ({
          prescription_item_id: item.id,
          quantity_fulfilled: item.is_available ? item.quantity_fulfilled : 0,
          is_available: item.is_available,
        })),
        financial_account_id: Number(selectedAccount),
      });
    } finally {
      setLoading(false);
    }
  };

  const calculateTotal = () => {
    return prescriptionItems
      .filter((item) => item.is_available)
      .reduce((sum, item) => sum + item.quantity_fulfilled * getNumericValue(item.unit_price), 0);
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
                (item) => {
                  const unitPrice = getNumericValue(item.unit_price);
                  const qtyFulfilled = getNumericValue(item.quantity_fulfilled);
                  return `
              <tr>
                <td>${item.item_name}</td>
                <td>${qtyFulfilled}</td>
                <td>${unitPrice.toFixed(2)}</td>
                <td>${(qtyFulfilled * unitPrice).toFixed(2)}</td>
              </tr>
            `;
                }
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
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h4" component="h1">
            Pharmacy - Prescription Fulfillment
          </Typography>
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Button
              variant="outlined"
              startIcon={<SearchIcon />}
              onClick={() => {
                setAllPrescriptionsModalOpen(true);
              }}
            >
              View All Prescriptions
            </Button>
          </Box>
        </Box>

        {/* Statistics Cards */}
        <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap' }}>
          <Paper sx={{ p: 2, bgcolor: 'primary.light', color: 'white', flex: '1 1 200px', minWidth: '200px' }}>
            <Typography variant="subtitle2">Today's Total</Typography>
            <Typography variant="h5" fontWeight="bold">
              KES {stats.todayTotal.toFixed(2)}
            </Typography>
            <Typography variant="caption">
              {stats.todayCount} prescriptions
            </Typography>
          </Paper>
          <Paper sx={{ p: 2, bgcolor: 'success.light', color: 'white', flex: '1 1 200px', minWidth: '200px' }}>
            <Typography variant="subtitle2">All Fulfilled Total</Typography>
            <Typography variant="h5" fontWeight="bold">
              KES {stats.allFulfilledTotal.toFixed(2)}
            </Typography>
            <Typography variant="caption">
              {stats.allFulfilledCount} prescriptions
            </Typography>
          </Paper>
          <Paper sx={{ p: 2, bgcolor: 'warning.light', color: 'white', flex: '1 1 200px', minWidth: '200px' }}>
            <Typography variant="subtitle2">Missing Medicines</Typography>
            <Typography variant="h5" fontWeight="bold">
              {missingStats.missingCount} items
            </Typography>
            <Typography variant="caption">
              KES {missingStats.missingValue.toFixed(2)} value
            </Typography>
          </Paper>
          <Paper sx={{ p: 2, bgcolor: 'info.light', color: 'white', flex: '1 1 200px', minWidth: '200px' }}>
            <Typography variant="subtitle2">Pending</Typography>
            <Typography variant="h5" fontWeight="bold">
              {pendingPrescriptions.length}
            </Typography>
            <Typography variant="caption">
              Awaiting fulfillment
            </Typography>
          </Paper>
        </Box>

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
                        <TableCell align="right">Price</TableCell>
                        <TableCell align="right">Total</TableCell>
                        <TableCell>Status</TableCell>
                      </TableRow>
                  </TableHead>
                  <TableBody>
                    {prescriptionItems.map((item) => {
                      const unitPrice = getNumericValue(item.unit_price);
                      const qtyFulfilled = getNumericValue(item.quantity_fulfilled);
                      const itemTotal = qtyFulfilled * unitPrice;
                      
                      return (
                        <TableRow key={item.id}>
                          <TableCell>{item.item_name}</TableCell>
                          <TableCell>
                            <TextField
                              type="number"
                              size="small"
                              value={item.quantity_prescribed}
                              onChange={(e) => {
                                const qty = parseFloat(e.target.value) || 0;
                                handleUpdatePrescribedQuantity(item.id, qty);
                              }}
                              inputProps={{ min: 0 }}
                              sx={{ width: 80 }}
                            />
                          </TableCell>
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
                          <TableCell align="right">KES {unitPrice.toFixed(2)}</TableCell>
                          <TableCell align="right" sx={{ fontWeight: 'bold' }}>
                            KES {itemTotal.toFixed(2)}
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
                      );
                    })}
                  </TableBody>
                </Table>
              </TableContainer>

              <Box sx={{ mt: 3, p: 2, bgcolor: 'grey.100', borderRadius: 1 }}>
                <Typography variant="h6" gutterBottom>
                  Total: KES {calculateTotal().toFixed(2)}
                </Typography>
                
                {/* Payment Information Section */}
                <Box sx={{ mt: 2 }}>
                  <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 'bold', mb: 1 }}>
                    Payment Information
                  </Typography>
                  
                  <TextField
                    fullWidth
                    label="Amount Paid"
                    type="number"
                    size="small"
                    value={amountPaid}
                    onChange={(e) => setAmountPaid(parseFloat(e.target.value) || 0)}
                    inputProps={{ 
                      step: 0.01,
                      min: 0
                    }}
                    sx={{ mb: 1.5 }}
                  />
                  
                  {paymentMethod === 'M-Pesa' && (
                    <TextField
                      fullWidth
                      label="M-Pesa Transaction Code"
                      size="small"
                      value={mpesaCode}
                      onChange={(e) => setMpesaCode(e.target.value)}
                      onClick={() => {
                        if (paymentMethod === 'M-Pesa') {
                          fetchMpesaConfirmations();
                          setMpesaModalOpen(true);
                        }
                      }}
                      placeholder="Click to select from confirmations..."
                      sx={{ mb: 1.5, cursor: 'pointer' }}
                      InputProps={{
                        readOnly: true,
                        endAdornment: (
                          <IconButton
                            size="small"
                            onClick={(e) => {
                              e.stopPropagation();
                              fetchMpesaConfirmations();
                              setMpesaModalOpen(true);
                            }}
                          >
                            <SearchIcon />
                          </IconButton>
                        )
                      }}
                    />
                  )}
                  
                  <FormControl fullWidth size="small" sx={{ mb: 1.5 }}>
                    <InputLabel>Payment Method</InputLabel>
                    <Select
                      value={paymentMethod}
                      onChange={(e) => {
                        setPaymentMethod(e.target.value);
                        if (e.target.value !== 'M-Pesa') {
                          setMpesaCode('');
                        }
                      }}
                      label="Payment Method"
                    >
                      <MenuItem value="Cash">Cash</MenuItem>
                      <MenuItem value="M-Pesa">M-Pesa</MenuItem>
                      <MenuItem value="Card">Card</MenuItem>
                      <MenuItem value="Cheque">Cheque</MenuItem>
                    </Select>
                  </FormControl>
                  
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="body2" color="text.secondary">Amount Paid:</Typography>
                    <Typography variant="body2" fontWeight="bold" sx={{ color: 'primary.main' }}>
                      {Number(amountPaid).toFixed(2)}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="body2" color="text.secondary">Balance Due:</Typography>
                    <Typography 
                      variant="body2" 
                      fontWeight="bold"
                      sx={{ 
                        color: (calculateTotal() - amountPaid) > 0 ? 'error.main' : 'success.main'
                      }}
                    >
                      {Number(Math.max(0, calculateTotal() - amountPaid)).toFixed(2)}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 1.5 }}>
                    <Typography variant="body2" color="text.secondary">Status:</Typography>
                    <Chip 
                      label={
                        amountPaid === 0 ? 'Unpaid' :
                        amountPaid >= calculateTotal() ? 'Paid' : 'Partially Paid'
                      }
                      color={
                        amountPaid === 0 ? 'error' :
                        amountPaid >= calculateTotal() ? 'success' : 'warning'
                      }
                      size="small"
                    />
                  </Box>
                </Box>
                
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

      {/* M-Pesa Confirmations Modal */}
      <Dialog open={mpesaModalOpen} onClose={() => setMpesaModalOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle sx={{ backgroundColor: '#00A859', color: 'white', fontWeight: 'bold' }}>
          📱 Select M-Pesa Confirmation
        </DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          {loading ? (
            <Typography>Loading confirmations...</Typography>
          ) : mpesaConfirmations.length > 0 ? (
            <TableContainer sx={{ maxHeight: 400 }}>
              <Table stickyHeader>
                <TableHead>
                  <TableRow>
                    <TableCell>Transaction ID</TableCell>
                    <TableCell>Amount</TableCell>
                    <TableCell>Phone Number</TableCell>
                    <TableCell>Name</TableCell>
                    <TableCell>Date</TableCell>
                    <TableCell align="center">Action</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {mpesaConfirmations.map((confirmation) => (
                    <TableRow 
                      key={confirmation.id} 
                      hover
                      sx={{ 
                        cursor: 'pointer',
                        '&:hover': { 
                          backgroundColor: '#f5f5f5'
                        }
                      }}
                    >
                      <TableCell sx={{ fontWeight: 'bold' }}>{confirmation.trans_id}</TableCell>
                      <TableCell sx={{ fontWeight: 'bold', color: '#00A859' }}>
                        {Number(confirmation.trans_amount || 0).toFixed(2)}
                      </TableCell>
                      <TableCell>{confirmation.msisdn || 'N/A'}</TableCell>
                      <TableCell>
                        {[confirmation.first_name, confirmation.middle_name, confirmation.last_name]
                          .filter(Boolean).join(' ') || 'N/A'}
                      </TableCell>
                      <TableCell>
                        {confirmation.trans_time 
                          ? new Date(confirmation.trans_time).toLocaleString() 
                          : new Date(confirmation.created_at).toLocaleString()}
                      </TableCell>
                      <TableCell align="center">
                        <Button
                          size="small"
                          variant="contained"
                          onClick={() => handleMpesaConfirmationSelect(confirmation)}
                          sx={{ backgroundColor: '#00A859', '&:hover': { backgroundColor: '#008547' } }}
                        >
                          Select
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          ) : (
            <Typography color="textSecondary" sx={{ textAlign: 'center', py: 4 }}>
              No pending M-Pesa confirmations found
            </Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setMpesaModalOpen(false)}>Close</Button>
          <Button 
            onClick={() => {
              fetchMpesaConfirmations();
            }}
            variant="outlined"
          >
            Refresh
          </Button>
        </DialogActions>
      </Dialog>

      {/* All Prescriptions Modal with Search and Filters */}
      <Dialog 
        open={allPrescriptionsModalOpen} 
        onClose={() => setAllPrescriptionsModalOpen(false)} 
        maxWidth="lg" 
        fullWidth
      >
        <DialogTitle sx={{ backgroundColor: '#1976d2', color: 'white', fontWeight: 'bold' }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6">All Prescriptions</Typography>
            <IconButton onClick={() => setAllPrescriptionsModalOpen(false)} sx={{ color: 'white' }}>
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent sx={{ pt: 3 }}>
          {/* Search Bar */}
          <Box sx={{ mb: 3 }}>
            <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
              <TextField
                fullWidth
                placeholder="Search by prescription number, patient name, or ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    loadAllPrescriptions();
                  }
                }}
                InputProps={{
                  startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />,
                }}
              />
              <Button
                variant="contained"
                onClick={loadAllPrescriptions}
                disabled={loadingPrescriptions}
                startIcon={<SearchIcon />}
              >
                Search
              </Button>
            </Box>
            
            {/* Date Filters */}
            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', mb: 2 }}>
              <Button
                variant={dateFilter === 'today' ? 'contained' : 'outlined'}
                onClick={() => {
                  setDateFilter('today');
                  setTimeout(() => loadAllPrescriptions(), 100);
                }}
                size="small"
              >
                Today
              </Button>
              <Button
                variant={dateFilter === 'week' ? 'contained' : 'outlined'}
                onClick={() => {
                  setDateFilter('week');
                  setTimeout(() => loadAllPrescriptions(), 100);
                }}
                size="small"
              >
                This Week
              </Button>
              <Button
                variant={dateFilter === 'month' ? 'contained' : 'outlined'}
                onClick={() => {
                  setDateFilter('month');
                  setTimeout(() => loadAllPrescriptions(), 100);
                }}
                size="small"
              >
                This Month
              </Button>
              <Button
                variant={dateFilter === 'custom' ? 'contained' : 'outlined'}
                onClick={() => setDateFilter('custom')}
                size="small"
                startIcon={<FilterListIcon />}
              >
                Custom Range
              </Button>
              <Button
                variant="outlined"
                onClick={loadAllPrescriptions}
                size="small"
                startIcon={<RefreshIcon />}
                disabled={loadingPrescriptions}
              >
                Refresh
              </Button>
            </Box>

            {/* Custom Date Range */}
            {dateFilter === 'custom' && (
              <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
                <DatePicker
                  label="Start Date"
                  value={startDate}
                  onChange={(newValue) => {
                    if (newValue) {
                      const date = new Date(newValue);
                      date.setHours(0, 0, 0, 0);
                      setStartDate(date);
                    }
                  }}
                  slotProps={{ textField: { size: 'small', fullWidth: true } }}
                />
                <DatePicker
                  label="End Date"
                  value={endDate}
                  onChange={(newValue) => {
                    if (newValue) {
                      const date = new Date(newValue);
                      date.setHours(23, 59, 59, 999);
                      setEndDate(date);
                    }
                  }}
                  slotProps={{ textField: { size: 'small', fullWidth: true } }}
                />
              </Box>
            )}

            {/* Statistics Summary */}
            <Box sx={{ display: 'flex', gap: 2, mb: 2, flexWrap: 'wrap' }}>
              <Chip 
                label={`Today's Total: KES ${stats.todayTotal.toFixed(2)}`} 
                color="primary" 
                sx={{ fontWeight: 'bold' }}
              />
              <Chip 
                label={`All Fulfilled: KES ${stats.allFulfilledTotal.toFixed(2)}`} 
                color="success" 
                sx={{ fontWeight: 'bold' }}
              />
              <Chip 
                label={`Total Prescriptions: ${allPrescriptions.length}`} 
                color="info" 
                sx={{ fontWeight: 'bold' }}
              />
            </Box>
          </Box>

          {/* Prescriptions Table */}
          {loadingPrescriptions ? (
            <Typography>Loading prescriptions...</Typography>
          ) : (
            <TableContainer sx={{ maxHeight: 500 }}>
              <Table stickyHeader>
                <TableHead>
                  <TableRow>
                    <TableCell>Prescription #</TableCell>
                    <TableCell>Patient Name</TableCell>
                    <TableCell>ID Number</TableCell>
                    <TableCell>Date</TableCell>
                    <TableCell align="right">Total Amount</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Action</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {allPrescriptions.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
                        <Typography color="text.secondary">
                          No prescriptions found for the selected period.
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ) : (
                    allPrescriptions.map((prescription) => (
                      <TableRow key={prescription.id} hover>
                        <TableCell>{prescription.prescription_number}</TableCell>
                        <TableCell>{prescription.patient_name}</TableCell>
                        <TableCell>{prescription.national_id || 'N/A'}</TableCell>
                        <TableCell>
                          {new Date(prescription.created_at).toLocaleDateString()}
                        </TableCell>
                        <TableCell align="right">
                          KES {getNumericValue(prescription.total_amount).toFixed(2)}
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={prescription.status}
                            color={
                              prescription.status === 'fulfilled'
                                ? 'success'
                                : prescription.status === 'partially_fulfilled'
                                ? 'warning'
                                : prescription.status === 'cancelled'
                                ? 'error'
                                : 'default'
                            }
                            size="small"
                          />
                        </TableCell>
                        <TableCell>
                          <Button
                            size="small"
                            variant="outlined"
                            onClick={() => {
                              handleSelectPrescription(prescription);
                              setAllPrescriptionsModalOpen(false);
                            }}
                          >
                            View
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAllPrescriptionsModalOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>
      </Container>
    </LocalizationProvider>
  );
};

export default PharmacyScreen;

