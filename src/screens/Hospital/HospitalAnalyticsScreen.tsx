import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Container,
  Paper,
  Typography,
  Button,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Chip,
} from '@mui/material';
import {
  Refresh as RefreshIcon,
  Assessment as AssessmentIcon,
  ArrowBack as ArrowBackIcon,
  Close as CloseIcon,
  Visibility as VisibilityIcon,
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { useNavigate } from 'react-router-dom';
import { ApiService } from '../../services/api';

interface DiagnosisData {
  symptoms: string;
  disease_diagnosis: string;
  other_analysis: string;
  blood_pressure: string;
  temperature: string;
  heart_rate: string;
  notes: string;
}

interface LabTest {
  id: number;
  test_name: string;
  test_type?: string;
  category?: string;
  others?: string;
  price: number;
  amount_paid: number;
  payment_status: string;
  test_status: string;
  test_requested_at: string;
}

interface ConsultationAnalytics {
  consultation_id: number;
  consultation_number: string;
  consultation_date: string;
  patient_id: number;
  patient_name: string;
  national_id?: string;
  doctor_id?: number;
  doctor_name: string;
  doctor_email: string;
  consultation_fee: number;
  diagnosis: DiagnosisData;
  lab_tests: LabTest[];
  lab_test_amount_paid: number;
  prescription_amount_paid: number;
  total_amount: number;
}

interface OverallTotals {
  total_consultation_fees: number;
  total_lab_test_amount: number;
  total_lab_test_paid: number;
  total_prescription_amount: number;
  total_prescription_paid: number;
  grand_total: number;
}

const HospitalAnalyticsScreen: React.FC = () => {
  const navigate = useNavigate();
  const [consultations, setConsultations] = useState<ConsultationAnalytics[]>([]);
  const [overallTotals, setOverallTotals] = useState<OverallTotals | null>(null);
  const [dateFilter, setDateFilter] = useState<'today' | 'week' | 'month' | 'custom'>('today');
  const [startDate, setStartDate] = useState<Date | null>(() => {
    const date = new Date();
    date.setHours(0, 0, 0, 0);
    return date;
  });
  const [endDate, setEndDate] = useState<Date | null>(() => {
    const date = new Date();
    date.setHours(23, 59, 59, 999);
    return date;
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // Modal states
  const [diagnosisModalOpen, setDiagnosisModalOpen] = useState(false);
  const [labTestsModalOpen, setLabTestsModalOpen] = useState(false);
  const [selectedConsultation, setSelectedConsultation] = useState<ConsultationAnalytics | null>(null);

  const getNumericValue = (value: any): number => {
    const num = Number(value);
    return isNaN(num) ? 0 : num;
  };

  const loadAnalytics = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      
      if (!startDate || !endDate) {
        setLoading(false);
        return;
      }
      
      const startDateStr = startDate.toISOString();
      const endDateStr = endDate.toISOString();
      
      const response = await ApiService.getHospitalAnalytics({
        startDate: startDateStr,
        endDate: endDateStr,
      });
      
      if (response.success) {
        setConsultations(response.data.consultations || []);
        setOverallTotals(response.data.overall_totals || null);
      } else {
        setError('Failed to load analytics');
      }
    } catch (err: any) {
      console.error('Error loading analytics:', err);
      setError(err.response?.data?.message || err.message || 'Failed to load analytics');
    } finally {
      setLoading(false);
    }
  }, [startDate, endDate]);

  // Update dates when filter changes
  useEffect(() => {
    const now = new Date();
    const todayStart = new Date(now);
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date(now);
    todayEnd.setHours(23, 59, 59, 999);
    
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

  // Load analytics when dates change
  useEffect(() => {
    if (startDate && endDate) {
      loadAnalytics();
    }
  }, [loadAnalytics]);

  const handleViewDiagnosis = (consultation: ConsultationAnalytics) => {
    setSelectedConsultation(consultation);
    setDiagnosisModalOpen(true);
  };

  const handleViewLabTests = (consultation: ConsultationAnalytics) => {
    setSelectedConsultation(consultation);
    setLabTestsModalOpen(true);
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <IconButton onClick={() => navigate('/hospital')} size="small">
              <ArrowBackIcon />
            </IconButton>
            <Typography variant="h4" component="h1">
              Hospital Analytics
            </Typography>
          </Box>
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={loadAnalytics}
            disabled={loading}
          >
            Refresh
          </Button>
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

        {/* Date Filters */}
        <Paper sx={{ p: 2, mb: 3 }}>
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
            <Button
              variant={dateFilter === 'today' ? 'contained' : 'outlined'}
              onClick={() => setDateFilter('today')}
              size="small"
            >
              Today
            </Button>
            <Button
              variant={dateFilter === 'week' ? 'contained' : 'outlined'}
              onClick={() => setDateFilter('week')}
              size="small"
            >
              This Week
            </Button>
            <Button
              variant={dateFilter === 'month' ? 'contained' : 'outlined'}
              onClick={() => setDateFilter('month')}
              size="small"
            >
              This Month
            </Button>
            <Button
              variant={dateFilter === 'custom' ? 'contained' : 'outlined'}
              onClick={() => setDateFilter('custom')}
              size="small"
            >
              Custom Range
            </Button>
            {dateFilter === 'custom' && (
              <>
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
                  slotProps={{ textField: { size: 'small' } }}
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
                  slotProps={{ textField: { size: 'small' } }}
                />
              </>
            )}
          </Box>
        </Paper>

        {/* Analytics Table */}
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>
            Patient Consultations Analytics
          </Typography>

          {loading ? (
            <Typography>Loading analytics...</Typography>
          ) : consultations.length === 0 ? (
            <Typography color="text.secondary" sx={{ py: 4, textAlign: 'center' }}>
              No consultations found for the selected period.
            </Typography>
          ) : (
            <>
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Patient ID</TableCell>
                      <TableCell>Employee Name</TableCell>
                      <TableCell>Consultation Fee</TableCell>
                      <TableCell>Diagnosis</TableCell>
                      <TableCell>Lab Tests</TableCell>
                      <TableCell align="right">Lab Amount Paid</TableCell>
                      <TableCell align="right">Prescription Amount Paid</TableCell>
                      <TableCell align="right">Total Amount</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {consultations.map((consultation) => (
                      <TableRow key={consultation.consultation_id} hover>
                        <TableCell>
                          {consultation.patient_name}
                          {consultation.national_id && (
                            <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                              ID: {consultation.national_id}
                            </Typography>
                          )}
                        </TableCell>
                        <TableCell>
                          {consultation.doctor_name}
                          {consultation.doctor_email && (
                            <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                              {consultation.doctor_email}
                            </Typography>
                          )}
                        </TableCell>
                        <TableCell>
                          KES {getNumericValue(consultation.consultation_fee).toFixed(2)}
                        </TableCell>
                        <TableCell>
                          <Button
                            size="small"
                            variant="outlined"
                            startIcon={<VisibilityIcon />}
                            onClick={() => handleViewDiagnosis(consultation)}
                          >
                            View
                          </Button>
                        </TableCell>
                        <TableCell>
                          <Button
                            size="small"
                            variant="outlined"
                            startIcon={<VisibilityIcon />}
                            onClick={() => handleViewLabTests(consultation)}
                            disabled={consultation.lab_tests.length === 0}
                          >
                            View ({consultation.lab_tests.length})
                          </Button>
                        </TableCell>
                        <TableCell align="right">
                          KES {getNumericValue(consultation.lab_test_amount_paid).toFixed(2)}
                        </TableCell>
                        <TableCell align="right">
                          KES {getNumericValue(consultation.prescription_amount_paid).toFixed(2)}
                        </TableCell>
                        <TableCell align="right">
                          <Typography variant="body2" fontWeight="bold">
                            KES {getNumericValue(consultation.total_amount).toFixed(2)}
                          </Typography>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>

              {/* Totals Row */}
              {overallTotals && (
                <Box sx={{ mt: 3, pt: 2, borderTop: 2, borderColor: 'divider' }}>
                  <Table>
                    <TableBody>
                      <TableRow>
                        <TableCell colSpan={2} align="right">
                          <Typography variant="h6" fontWeight="bold">
                            Totals:
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body1" fontWeight="bold">
                            KES {getNumericValue(overallTotals.total_consultation_fees).toFixed(2)}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            (Receptionist)
                          </Typography>
                        </TableCell>
                        <TableCell colSpan={2}></TableCell>
                        <TableCell align="right">
                          <Typography variant="body1" fontWeight="bold">
                            KES {getNumericValue(overallTotals.total_lab_test_paid).toFixed(2)}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            (Lab Tests)
                          </Typography>
                        </TableCell>
                        <TableCell align="right">
                          <Typography variant="body1" fontWeight="bold">
                            KES {getNumericValue(overallTotals.total_prescription_paid).toFixed(2)}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            (Prescription)
                          </Typography>
                        </TableCell>
                        <TableCell align="right">
                          <Typography variant="h6" fontWeight="bold" color="primary">
                            KES {getNumericValue(overallTotals.grand_total).toFixed(2)}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            (Grand Total)
                          </Typography>
                        </TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </Box>
              )}
            </>
          )}
        </Paper>

        {/* Diagnosis Modal */}
        <Dialog
          open={diagnosisModalOpen}
          onClose={() => setDiagnosisModalOpen(false)}
          maxWidth="md"
          fullWidth
        >
          <DialogTitle>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="h6">
                Diagnosis & Analysis - {selectedConsultation?.consultation_number}
              </Typography>
              <IconButton onClick={() => setDiagnosisModalOpen(false)} size="small">
                <CloseIcon />
              </IconButton>
            </Box>
          </DialogTitle>
          <DialogContent>
            {selectedConsultation && (
              <Box sx={{ mt: 2 }}>
                <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 'bold' }}>
                  Patient: {selectedConsultation.patient_name}
                  {selectedConsultation.national_id && ` (ID: ${selectedConsultation.national_id})`}
                </Typography>
                
                {selectedConsultation.diagnosis.symptoms && (
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                      Symptoms:
                    </Typography>
                    <Typography variant="body2">
                      {selectedConsultation.diagnosis.symptoms}
                    </Typography>
                  </Box>
                )}

                {selectedConsultation.diagnosis.disease_diagnosis && (
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                      Disease Diagnosis:
                    </Typography>
                    <Typography variant="body2">
                      {selectedConsultation.diagnosis.disease_diagnosis}
                    </Typography>
                  </Box>
                )}

                {selectedConsultation.diagnosis.other_analysis && (
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                      Other Analysis:
                    </Typography>
                    <Typography variant="body2">
                      {selectedConsultation.diagnosis.other_analysis}
                    </Typography>
                  </Box>
                )}

                <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
                  {selectedConsultation.diagnosis.blood_pressure && (
                    <Box>
                      <Typography variant="subtitle2" color="text.secondary">
                        Blood Pressure:
                      </Typography>
                      <Typography variant="body2">
                        {selectedConsultation.diagnosis.blood_pressure}
                      </Typography>
                    </Box>
                  )}
                  {selectedConsultation.diagnosis.temperature && (
                    <Box>
                      <Typography variant="subtitle2" color="text.secondary">
                        Temperature:
                      </Typography>
                      <Typography variant="body2">
                        {selectedConsultation.diagnosis.temperature}
                      </Typography>
                    </Box>
                  )}
                  {selectedConsultation.diagnosis.heart_rate && (
                    <Box>
                      <Typography variant="subtitle2" color="text.secondary">
                        Heart Rate:
                      </Typography>
                      <Typography variant="body2">
                        {selectedConsultation.diagnosis.heart_rate}
                      </Typography>
                    </Box>
                  )}
                </Box>

                {selectedConsultation.diagnosis.notes && (
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                      Notes:
                    </Typography>
                    <Typography variant="body2">
                      {selectedConsultation.diagnosis.notes}
                    </Typography>
                  </Box>
                )}
              </Box>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setDiagnosisModalOpen(false)}>Close</Button>
          </DialogActions>
        </Dialog>

        {/* Lab Tests Modal */}
        <Dialog
          open={labTestsModalOpen}
          onClose={() => setLabTestsModalOpen(false)}
          maxWidth="md"
          fullWidth
        >
          <DialogTitle>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="h6">
                Lab Tests - {selectedConsultation?.consultation_number}
              </Typography>
              <IconButton onClick={() => setLabTestsModalOpen(false)} size="small">
                <CloseIcon />
              </IconButton>
            </Box>
          </DialogTitle>
          <DialogContent>
            {selectedConsultation && (
              <Box sx={{ mt: 2 }}>
                <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 'bold' }}>
                  Patient: {selectedConsultation.patient_name}
                  {selectedConsultation.national_id && ` (ID: ${selectedConsultation.national_id})`}
                </Typography>

                {selectedConsultation.lab_tests.length === 0 ? (
                  <Typography color="text.secondary" sx={{ py: 2 }}>
                    No lab tests for this consultation.
                  </Typography>
                ) : (
                  <TableContainer sx={{ mt: 2 }}>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>Test Name</TableCell>
                          <TableCell>Test Type</TableCell>
                          <TableCell>Category</TableCell>
                          <TableCell>Others</TableCell>
                          <TableCell align="right">Price</TableCell>
                          <TableCell align="right">Amount Paid</TableCell>
                          <TableCell>Payment Status</TableCell>
                          <TableCell>Test Status</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {selectedConsultation.lab_tests.map((test) => (
                          <TableRow key={test.id}>
                            <TableCell>{test.test_name}</TableCell>
                            <TableCell>{test.test_type || 'N/A'}</TableCell>
                            <TableCell>{test.category || 'N/A'}</TableCell>
                            <TableCell>{test.others || 'N/A'}</TableCell>
                            <TableCell align="right">
                              KES {getNumericValue(test.price).toFixed(2)}
                            </TableCell>
                            <TableCell align="right">
                              KES {getNumericValue(test.amount_paid).toFixed(2)}
                            </TableCell>
                            <TableCell>
                              <Chip
                                label={test.payment_status || 'unpaid'}
                                color={test.payment_status === 'paid' ? 'success' : test.payment_status === 'partially_paid' ? 'warning' : 'error'}
                                size="small"
                              />
                            </TableCell>
                            <TableCell>
                              <Chip
                                label={test.test_status}
                                color={test.test_status === 'completed' ? 'success' : 'warning'}
                                size="small"
                              />
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                )}
              </Box>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setLabTestsModalOpen(false)}>Close</Button>
          </DialogActions>
        </Dialog>
      </Container>
    </LocalizationProvider>
  );
};

export default HospitalAnalyticsScreen;

