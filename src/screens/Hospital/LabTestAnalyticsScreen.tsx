import React, { useState, useEffect, Fragment, useCallback } from 'react';
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
  Chip,
  IconButton,
} from '@mui/material';
import {
  Refresh as RefreshIcon,
  Assessment as AssessmentIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  ArrowBack as ArrowBackIcon,
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { useNavigate } from 'react-router-dom';
import { ApiService } from '../../services/api';

interface PatientGroup {
  patient_id: number;
  patient_name: string;
  national_id?: string;
  total_tests: number;
  total_amount: number;
  total_paid: number;
  total_due: number;
  paid_tests: number;
  unpaid_tests: number;
  completed_tests: number;
  pending_tests: number;
  tests: LabTest[];
  requested_at: string;
  consultation_number?: string;
}

interface LabTest {
  id: number;
  patient_id: number;
  test_name: string;
  test_type?: string;
  category?: string;
  others?: string;
  price: number;
  amount_due: number;
  amount_paid: number;
  payment_status: string;
  test_status: string;
  patient_name: string;
  national_id?: string;
  consultation_number?: string;
  test_requested_at: string;
  test_completed_at?: string;
  doctor_name?: string;
  doctor_visit_id?: number;
}

interface OverallTotals {
  total_tests: number;
  total_patients: number;
  total_doctors: number;
  total_amount: number;
  total_paid: number;
  total_due: number;
  paid_tests: number;
  unpaid_tests: number;
  completed_tests: number;
  pending_tests: number;
}

const LabTestAnalyticsScreen: React.FC = () => {
  const navigate = useNavigate();
  const [patientGroups, setPatientGroups] = useState<PatientGroup[]>([]);
  const [overallTotals, setOverallTotals] = useState<OverallTotals | null>(null);
  const [expandedPatients, setExpandedPatients] = useState<Set<number>>(new Set());
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
      
      const response = await ApiService.getLabTestAnalytics({
        startDate: startDateStr,
        endDate: endDateStr,
      });
      
      if (response.success) {
        // Get all tests from all employees
        const allTests: LabTest[] = [];
        (response.data.employees || []).forEach((emp: any) => {
          if (emp.tests && Array.isArray(emp.tests)) {
            allTests.push(...emp.tests);
          }
        });
        
        // Group tests by patient_id
        const testsByPatient: { [key: number]: LabTest[] } = {};
        allTests.forEach((test: LabTest) => {
          const patientId = test.patient_id || 0;
          if (!testsByPatient[patientId]) {
            testsByPatient[patientId] = [];
          }
          testsByPatient[patientId].push(test);
        });
        
        // Create patient groups with aggregated data
        const groups: PatientGroup[] = Object.keys(testsByPatient).map((patientIdStr) => {
          const patientId = parseInt(patientIdStr, 10);
          const tests = testsByPatient[patientId];
          const firstTest = tests[0];
          
          const totalAmount = tests.reduce((sum, t) => sum + getNumericValue(t.price), 0);
          const totalPaid = tests.reduce((sum, t) => sum + getNumericValue(t.amount_paid), 0);
          const totalDue = tests.reduce((sum, t) => sum + getNumericValue(t.amount_due), 0);
          const paidTests = tests.filter(t => t.payment_status === 'paid').length;
          const unpaidTests = tests.filter(t => t.payment_status !== 'paid').length;
          const completedTests = tests.filter(t => t.test_status === 'completed').length;
          const pendingTests = tests.filter(t => t.test_status === 'pending').length;
          
          // Get earliest requested_at
          const requestedAts = tests.map(t => new Date(t.test_requested_at).getTime());
          const earliestRequested = new Date(Math.min(...requestedAts));
          
          return {
            patient_id: patientId,
            patient_name: firstTest.patient_name || 'Unknown',
            national_id: firstTest.national_id,
            total_tests: tests.length,
            total_amount: totalAmount,
            total_paid: totalPaid,
            total_due: totalDue,
            paid_tests: paidTests,
            unpaid_tests: unpaidTests,
            completed_tests: completedTests,
            pending_tests: pendingTests,
            tests: tests.sort((a, b) => 
              new Date(b.test_requested_at).getTime() - new Date(a.test_requested_at).getTime()
            ),
            requested_at: earliestRequested.toISOString(),
            consultation_number: firstTest.consultation_number,
          };
        });
        
        // Sort by requested_at (most recent first)
        groups.sort((a, b) => 
          new Date(b.requested_at).getTime() - new Date(a.requested_at).getTime()
        );
        
        setPatientGroups(groups);
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

  const togglePatientExpansion = (patientId: number) => {
    const newExpanded = new Set(expandedPatients);
    if (newExpanded.has(patientId)) {
      newExpanded.delete(patientId);
    } else {
      newExpanded.add(patientId);
    }
    setExpandedPatients(newExpanded);
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <IconButton onClick={() => navigate('/hospital/lab')} size="small">
              <ArrowBackIcon />
            </IconButton>
            <Typography variant="h4" component="h1">
              Lab Test Analytics
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

        {/* Overall Totals Cards */}
        {overallTotals && (
          <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap' }}>
            <Paper sx={{ p: 2, bgcolor: 'primary.light', color: 'white', flex: '1 1 200px', minWidth: '200px' }}>
              <Typography variant="subtitle2">Total Tests</Typography>
              <Typography variant="h5" fontWeight="bold">
                {getNumericValue(overallTotals.total_tests)}
              </Typography>
              <Typography variant="caption">
                {getNumericValue(overallTotals.total_patients)} patients
              </Typography>
            </Paper>
            <Paper sx={{ p: 2, bgcolor: 'info.light', color: 'white', flex: '1 1 200px', minWidth: '200px' }}>
              <Typography variant="subtitle2">Total Amount</Typography>
              <Typography variant="h5" fontWeight="bold">
                KES {getNumericValue(overallTotals.total_amount).toFixed(2)}
              </Typography>
              <Typography variant="caption">
                All lab tests
              </Typography>
            </Paper>
            <Paper sx={{ p: 2, bgcolor: 'success.light', color: 'white', flex: '1 1 200px', minWidth: '200px' }}>
              <Typography variant="subtitle2">Total Paid</Typography>
              <Typography variant="h5" fontWeight="bold">
                KES {getNumericValue(overallTotals.total_paid).toFixed(2)}
              </Typography>
              <Typography variant="caption">
                {getNumericValue(overallTotals.paid_tests)} paid tests
              </Typography>
            </Paper>
            <Paper sx={{ p: 2, bgcolor: 'error.light', color: 'white', flex: '1 1 200px', minWidth: '200px' }}>
              <Typography variant="subtitle2">Total Due</Typography>
              <Typography variant="h5" fontWeight="bold">
                KES {getNumericValue(overallTotals.total_due).toFixed(2)}
              </Typography>
              <Typography variant="caption">
                {getNumericValue(overallTotals.unpaid_tests)} unpaid tests
              </Typography>
            </Paper>
          </Box>
        )}

        {/* Patients Table */}
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>
            Lab Tests by Patient
          </Typography>

          {loading ? (
            <Typography>Loading analytics...</Typography>
          ) : patientGroups.length === 0 ? (
            <Typography color="text.secondary" sx={{ py: 4, textAlign: 'center' }}>
              No lab tests found for the selected period.
            </Typography>
          ) : (
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell width="50px"></TableCell>
                    <TableCell>Patient Name</TableCell>
                    <TableCell>ID Number</TableCell>
                    <TableCell>Consultation #</TableCell>
                    <TableCell>Requested At</TableCell>
                    <TableCell align="right">Total Amount</TableCell>
                    <TableCell align="right">Paid</TableCell>
                    <TableCell align="right">Due</TableCell>
                    <TableCell>Payment Status</TableCell>
                    <TableCell>Test Status</TableCell>
                    <TableCell>Tests Count</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {patientGroups.map((group) => {
                    const patientId = group.patient_id || 0;
                    const isExpanded = expandedPatients.has(patientId);
                    return (
                      <Fragment key={patientId}>
                        <TableRow 
                          hover 
                          sx={{ 
                            cursor: 'pointer',
                            backgroundColor: isExpanded ? 'action.selected' : 'inherit'
                          }}
                        >
                          <TableCell onClick={() => togglePatientExpansion(patientId)}>
                            {isExpanded ? '▼' : '▶'}
                          </TableCell>
                          <TableCell onClick={() => togglePatientExpansion(patientId)}>
                            <strong>{group.patient_name}</strong>
                          </TableCell>
                          <TableCell onClick={() => togglePatientExpansion(patientId)}>
                            {group.national_id || 'N/A'}
                          </TableCell>
                          <TableCell onClick={() => togglePatientExpansion(patientId)}>
                            {group.consultation_number || 'N/A'}
                          </TableCell>
                          <TableCell onClick={() => togglePatientExpansion(patientId)}>
                            {new Date(group.requested_at).toLocaleString()}
                          </TableCell>
                          <TableCell align="right" onClick={() => togglePatientExpansion(patientId)}>
                            KES {getNumericValue(group.total_amount).toFixed(2)}
                          </TableCell>
                          <TableCell align="right" onClick={() => togglePatientExpansion(patientId)}>
                            <Typography color="success.main">
                              KES {getNumericValue(group.total_paid).toFixed(2)}
                            </Typography>
                          </TableCell>
                          <TableCell align="right" onClick={() => togglePatientExpansion(patientId)}>
                            <Typography color="error.main">
                              KES {getNumericValue(group.total_due).toFixed(2)}
                            </Typography>
                          </TableCell>
                          <TableCell onClick={() => togglePatientExpansion(patientId)}>
                            <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                              <Chip label={`${group.paid_tests} paid`} color="success" size="small" />
                              <Chip label={`${group.unpaid_tests} unpaid`} color="error" size="small" />
                            </Box>
                          </TableCell>
                          <TableCell onClick={() => togglePatientExpansion(patientId)}>
                            <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                              <Chip label={`${group.completed_tests} done`} color="info" size="small" />
                              <Chip label={`${group.pending_tests} pending`} color="warning" size="small" />
                            </Box>
                          </TableCell>
                          <TableCell onClick={() => togglePatientExpansion(patientId)}>
                            <Chip label={`${group.total_tests} test(s)`} size="small" />
                          </TableCell>
                        </TableRow>
                        {isExpanded && (
                          <TableRow>
                            <TableCell colSpan={11} sx={{ py: 2, backgroundColor: 'grey.50' }}>
                              <Table size="small">
                                <TableHead>
                                  <TableRow>
                                    <TableCell>Test Name</TableCell>
                                    <TableCell>Test Type</TableCell>
                                    <TableCell>Category</TableCell>
                                    <TableCell>Others</TableCell>
                                    <TableCell align="right">Price</TableCell>
                                    <TableCell>Payment Status</TableCell>
                                    <TableCell>Test Status</TableCell>
                                    <TableCell>Requested At</TableCell>
                                  </TableRow>
                                </TableHead>
                                <TableBody>
                                  {group.tests.length === 0 ? (
                                    <TableRow>
                                      <TableCell colSpan={8} align="center">
                                        <Typography color="text.secondary">No tests found</Typography>
                                      </TableCell>
                                    </TableRow>
                                  ) : (
                                    group.tests.map((test) => (
                                      <TableRow key={test.id}>
                                        <TableCell>{test.test_name}</TableCell>
                                        <TableCell>{test.test_type || 'N/A'}</TableCell>
                                        <TableCell>{test.category || 'N/A'}</TableCell>
                                        <TableCell>{test.others || 'N/A'}</TableCell>
                                        <TableCell align="right">KES {getNumericValue(test.price).toFixed(2)}</TableCell>
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
                                        <TableCell>
                                          {new Date(test.test_requested_at).toLocaleString()}
                                        </TableCell>
                                      </TableRow>
                                    ))
                                  )}
                                </TableBody>
                              </Table>
                            </TableCell>
                          </TableRow>
                        )}
                      </Fragment>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </Paper>
      </Container>
    </LocalizationProvider>
  );
};

export default LabTestAnalyticsScreen;

