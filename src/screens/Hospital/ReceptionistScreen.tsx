import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Paper,
  Typography,
  TextField,
  Button,
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
  FormControlLabel,
  Checkbox,
  IconButton,
  Card,
  CardContent,
} from '@mui/material';
import {
  Print as PrintIcon,
  Add as AddIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material';
import { ApiService } from '../../services/api';

interface Patient {
  id: number;
  patient_name: string;
  national_id?: string;
  location?: string;
  age?: number;
  phone_number?: string;
  email?: string;
  is_first_visit: boolean;
}

interface Consultation {
  id: number;
  consultation_number: string;
  consultation_fee: number;
  receipt_generated: boolean;
  status: string;
  patient_name: string;
  national_id?: string;
  created_at: string;
}

const ReceptionistScreen: React.FC = () => {
  const [patientForm, setPatientForm] = useState({
    patient_name: '',
    national_id: '',
    location: '',
    age: '',
    phone_number: '',
    email: '',
    is_first_visit: true,
  });
  const [consultationFee, setConsultationFee] = useState('');
  const [pendingConsultations, setPendingConsultations] = useState<Consultation[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [receiptDialogOpen, setReceiptDialogOpen] = useState(false);
  const [selectedConsultation, setSelectedConsultation] = useState<Consultation | null>(null);

  useEffect(() => {
    loadPendingConsultations();
  }, []);

  const loadPendingConsultations = async () => {
    try {
      const response = await ApiService.getPendingConsultations('pending');
      if (response.success) {
        setPendingConsultations(response.data.consultations || []);
      }
    } catch (err: any) {
      console.error('Error loading consultations:', err);
    }
  };

  const handlePatientSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      // Create or get patient
      const patientResponse = await ApiService.createOrGetPatient({
        patient_name: patientForm.patient_name,
        national_id: patientForm.national_id || undefined,
        location: patientForm.location || undefined,
        age: patientForm.age ? parseInt(patientForm.age) : undefined,
        phone_number: patientForm.phone_number || undefined,
        email: patientForm.email || undefined,
        is_first_visit: patientForm.is_first_visit,
      });

      if (patientResponse.success) {
        const patient = patientResponse.data.patient;

        // Create consultation
        const consultationResponse = await ApiService.createConsultation({
          patient_id: patient.id,
          consultation_fee: consultationFee ? parseFloat(consultationFee) : 0,
        });

        if (consultationResponse.success) {
          setSuccess('Patient registered and consultation created successfully!');
          setPatientForm({
            patient_name: '',
            national_id: '',
            location: '',
            age: '',
            phone_number: '',
            email: '',
            is_first_visit: true,
          });
          setConsultationFee('');
          await loadPendingConsultations();
        } else {
          setError('Failed to create consultation');
        }
      } else {
        setError('Failed to register patient');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'An error occurred');
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handlePrintReceipt = (consultation: Consultation) => {
    setSelectedConsultation(consultation);
    setReceiptDialogOpen(true);
  };

  const printReceipt = () => {
    if (!selectedConsultation) return;

    const business = JSON.parse(localStorage.getItem('business') || '{}');
    const user = JSON.parse(localStorage.getItem('user') || '{}');

    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert('Please allow popups to print receipt');
      return;
    }

    const receiptHTML = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Consultation Receipt</title>
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
          .header h2 {
            margin: 5px 0;
            font-size: 18px;
          }
          .info {
            margin: 10px 0;
            font-size: 11px;
          }
          .totals {
            margin-top: 10px;
            padding-top: 10px;
            border-top: 2px dashed #000;
          }
          .footer {
            text-align: center;
            margin-top: 15px;
            padding-top: 10px;
            border-top: 2px dashed #000;
            font-size: 11px;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h2>${business.business_name || 'Hospital'}</h2>
          <p>${business.address || 'Hospital Address'}</p>
          <p>Tel: ${business.phone || 'N/A'}</p>
        </div>
        
        <div class="info">
          <div style="display: flex; justify-content: space-between;">
            <span>Consultation #:</span>
            <span>${selectedConsultation.consultation_number}</span>
          </div>
          <div style="display: flex; justify-content: space-between;">
            <span>Patient:</span>
            <span>${selectedConsultation.patient_name}</span>
          </div>
          <div style="display: flex; justify-content: space-between;">
            <span>ID Number:</span>
            <span>${selectedConsultation.national_id || 'N/A'}</span>
          </div>
          <div style="display: flex; justify-content: space-between;">
            <span>Date:</span>
            <span>${new Date(selectedConsultation.created_at).toLocaleString()}</span>
          </div>
        </div>
        
        <div class="totals">
          <div style="display: flex; justify-content: space-between; font-weight: bold; font-size: 14px;">
            <span>Consultation Fee:</span>
            <span>KES ${Number(selectedConsultation.consultation_fee).toFixed(2)}</span>
          </div>
        </div>
        
        <div class="footer">
          <p>Thank you for visiting!</p>
          <p>Please proceed to doctor's office</p>
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
    setReceiptDialogOpen(false);
  };

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom sx={{ mb: 3 }}>
        Receptionist - Patient Registration
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

      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 3 }}>
        {/* Patient Registration Form */}
        <Box>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Register New Patient
            </Typography>
            <form onSubmit={handlePatientSubmit}>
              <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' } }}>
                <Box sx={{ gridColumn: '1 / -1' }}>
                  <TextField
                    fullWidth
                    label="Patient Name *"
                    value={patientForm.patient_name}
                    onChange={(e) => setPatientForm({ ...patientForm, patient_name: e.target.value })}
                    required
                  />
                </Box>

                <Box>
                  <TextField
                    fullWidth
                    label="National ID Number"
                    value={patientForm.national_id}
                    onChange={(e) => setPatientForm({ ...patientForm, national_id: e.target.value })}
                  />
                </Box>

                <Box>
                  <TextField
                    fullWidth
                    label="Age"
                    type="number"
                    value={patientForm.age}
                    onChange={(e) => setPatientForm({ ...patientForm, age: e.target.value })}
                  />
                </Box>

                <Box sx={{ gridColumn: '1 / -1' }}>
                  <TextField
                    fullWidth
                    label="Location"
                    value={patientForm.location}
                    onChange={(e) => setPatientForm({ ...patientForm, location: e.target.value })}
                  />
                </Box>

                <Box>
                  <TextField
                    fullWidth
                    label="Phone Number"
                    value={patientForm.phone_number}
                    onChange={(e) => setPatientForm({ ...patientForm, phone_number: e.target.value })}
                  />
                </Box>

                <Box>
                  <TextField
                    fullWidth
                    label="Email"
                    type="email"
                    value={patientForm.email}
                    onChange={(e) => setPatientForm({ ...patientForm, email: e.target.value })}
                  />
                </Box>

                <Box sx={{ gridColumn: '1 / -1' }}>
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={patientForm.is_first_visit}
                        onChange={(e) => setPatientForm({ ...patientForm, is_first_visit: e.target.checked })}
                      />
                    }
                    label="First Time Visit"
                  />
                </Box>

                <Box sx={{ gridColumn: '1 / -1' }}>
                  <TextField
                    fullWidth
                    label="Consultation Fee"
                    type="number"
                    value={consultationFee}
                    onChange={(e) => setConsultationFee(e.target.value)}
                    InputProps={{
                      startAdornment: <span style={{ marginRight: 8 }}>KES</span>,
                    }}
                  />
                </Box>

                <Box sx={{ gridColumn: '1 / -1' }}>
                  <Button
                    type="submit"
                    variant="contained"
                    fullWidth
                    disabled={loading}
                    startIcon={<AddIcon />}
                  >
                    {loading ? 'Processing...' : 'Register Patient & Generate Receipt'}
                  </Button>
                </Box>
              </Box>
            </form>
          </Paper>
        </Box>

        {/* Pending Consultations */}
        <Box>
          <Paper sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6">
                Pending Consultations (Not Served)
              </Typography>
              <IconButton onClick={loadPendingConsultations} size="small">
                <RefreshIcon />
              </IconButton>
            </Box>
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Consultation #</TableCell>
                    <TableCell>Patient Name</TableCell>
                    <TableCell>ID Number</TableCell>
                    <TableCell>Fee</TableCell>
                    <TableCell>Action</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {pendingConsultations.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} align="center">
                        No pending consultations
                      </TableCell>
                    </TableRow>
                  ) : (
                    pendingConsultations.map((consultation) => (
                      <TableRow key={consultation.id}>
                        <TableCell>{consultation.consultation_number}</TableCell>
                        <TableCell>{consultation.patient_name}</TableCell>
                        <TableCell>{consultation.national_id || 'N/A'}</TableCell>
                        <TableCell>KES {Number(consultation.consultation_fee).toFixed(2)}</TableCell>
                        <TableCell>
                          <IconButton
                            size="small"
                            onClick={() => handlePrintReceipt(consultation)}
                            color="primary"
                          >
                            <PrintIcon />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </Box>
      </Box>

      {/* Receipt Print Dialog */}
      <Dialog open={receiptDialogOpen} onClose={() => setReceiptDialogOpen(false)}>
        <DialogTitle>Print Receipt</DialogTitle>
        <DialogContent>
          <Typography>Ready to print consultation receipt?</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setReceiptDialogOpen(false)}>Cancel</Button>
          <Button onClick={printReceipt} variant="contained" startIcon={<PrintIcon />}>
            Print
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default ReceptionistScreen;

