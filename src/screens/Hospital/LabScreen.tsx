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
  IconButton,
  Chip,
  Tabs,
  Tab,
  InputAdornment,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';
import {
  Refresh as RefreshIcon,
  CheckCircle as CheckCircleIcon,
  Search as SearchIcon,
} from '@mui/icons-material';
import { ApiService } from '../../services/api';

interface LabTest {
  id: number;
  test_name: string;
  test_type?: string;
  test_requested_at: string;
  test_status: string;
  patient_name: string;
  national_id?: string;
  symptoms?: string;
  disease_diagnosis?: string;
}

interface AllLabTest extends LabTest {
  consultation_number?: string;
  test_completed_at?: string;
  test_result?: string;
}

const LabScreen: React.FC = () => {
  const [tabValue, setTabValue] = useState(0);
  const [pendingTests, setPendingTests] = useState<LabTest[]>([]);
  const [allTests, setAllTests] = useState<AllLabTest[]>([]);
  const [selectedTest, setSelectedTest] = useState<LabTest | null>(null);
  const [testResult, setTestResult] = useState('');
  const [resultDialogOpen, setResultDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    loadPendingTests();
    // Refresh every 30 seconds
    const interval = setInterval(loadPendingTests, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (tabValue === 1) {
      loadAllTests();
    }
  }, [tabValue, searchQuery, statusFilter]);

  const loadPendingTests = async () => {
    try {
      const response = await ApiService.getPendingLabTests();
      if (response.success) {
        setPendingTests(response.data.lab_tests || []);
      }
    } catch (err: any) {
      console.error('Error loading lab tests:', err);
    }
  };

  const loadAllTests = async () => {
    try {
      setLoading(true);
      const response = await ApiService.getAllLabTests(
        searchQuery || undefined,
        statusFilter !== 'all' ? statusFilter : undefined
      );
      if (response.success) {
        setAllTests(response.data.lab_tests || []);
      }
    } catch (err: any) {
      console.error('Error loading all lab tests:', err);
      setError('Failed to load lab tests');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectTest = (test: LabTest) => {
    setSelectedTest(test);
    setTestResult('');
    setResultDialogOpen(true);
  };

  const handleSubmitResult = async () => {
    if (!selectedTest || !testResult.trim()) {
      setError('Please enter test result');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const response = await ApiService.updateLabTestResult(selectedTest.id, testResult);

      if (response.success) {
        setSuccess('Test result submitted successfully!');
        setResultDialogOpen(false);
        setSelectedTest(null);
        setTestResult('');
        await loadPendingTests();
        if (tabValue === 1) {
          await loadAllTests();
        }
      } else {
        setError('Failed to submit test result');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'An error occurred');
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom sx={{ mb: 3 }}>
        Lab Technician - Test Results
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
        <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
          <Tabs value={tabValue} onChange={(e, newValue) => setTabValue(newValue)}>
            <Tab label="Pending Tests" />
            <Tab label="All Tests & Results" />
          </Tabs>
        </Box>

        {tabValue === 0 && (
          <>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6">Pending Lab Tests</Typography>
              <IconButton onClick={loadPendingTests} size="small">
                <RefreshIcon />
              </IconButton>
            </Box>

        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Patient Name</TableCell>
                <TableCell>ID Number</TableCell>
                <TableCell>Test Name</TableCell>
                <TableCell>Test Type</TableCell>
                <TableCell>Requested At</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Action</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {pendingTests.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
                    <Typography color="text.secondary">
                      No pending lab tests. New tests will appear here when requested by doctors.
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                pendingTests.map((test) => (
                  <TableRow key={test.id} hover>
                    <TableCell>{test.patient_name}</TableCell>
                    <TableCell>{test.national_id || 'N/A'}</TableCell>
                    <TableCell>{test.test_name}</TableCell>
                    <TableCell>{test.test_type || 'N/A'}</TableCell>
                    <TableCell>
                      {new Date(test.test_requested_at).toLocaleString()}
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={test.test_status}
                        color={test.test_status === 'completed' ? 'success' : 'warning'}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <Button
                        size="small"
                        variant="contained"
                        onClick={() => handleSelectTest(test)}
                        startIcon={<CheckCircleIcon />}
                        disabled={test.test_status === 'completed'}
                      >
                        Enter Result
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
          </>
        )}

        {tabValue === 1 && (
          <>
            <Box sx={{ display: 'flex', gap: 2, mb: 2, flexWrap: 'wrap' }}>
              <TextField
                placeholder="Search by patient name, ID, test name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                size="small"
                sx={{ flex: 1, minWidth: 200 }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon />
                    </InputAdornment>
                  ),
                }}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    loadAllTests();
                  }
                }}
              />
              <FormControl size="small" sx={{ minWidth: 150 }}>
                <InputLabel>Status</InputLabel>
                <Select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  label="Status"
                >
                  <MenuItem value="all">All</MenuItem>
                  <MenuItem value="pending">Pending</MenuItem>
                  <MenuItem value="in_progress">In Progress</MenuItem>
                  <MenuItem value="completed">Completed</MenuItem>
                  <MenuItem value="cancelled">Cancelled</MenuItem>
                </Select>
              </FormControl>
              <Button
                variant="contained"
                onClick={loadAllTests}
                disabled={loading}
                startIcon={<RefreshIcon />}
              >
                Search
              </Button>
            </Box>

            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Consultation #</TableCell>
                    <TableCell>Patient Name</TableCell>
                    <TableCell>ID Number</TableCell>
                    <TableCell>Test Name</TableCell>
                    <TableCell>Test Type</TableCell>
                    <TableCell>Requested At</TableCell>
                    <TableCell>Completed At</TableCell>
                    <TableCell>Result</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Action</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {allTests.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={10} align="center" sx={{ py: 4 }}>
                        <Typography color="text.secondary">
                          {loading ? 'Loading...' : 'No lab tests found'}
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ) : (
                    allTests.map((test) => (
                      <TableRow key={test.id} hover>
                        <TableCell>{test.consultation_number || 'N/A'}</TableCell>
                        <TableCell>{test.patient_name}</TableCell>
                        <TableCell>{test.national_id || 'N/A'}</TableCell>
                        <TableCell>{test.test_name}</TableCell>
                        <TableCell>{test.test_type || 'N/A'}</TableCell>
                        <TableCell>
                          {new Date(test.test_requested_at).toLocaleString()}
                        </TableCell>
                        <TableCell>
                          {test.test_completed_at
                            ? new Date(test.test_completed_at).toLocaleString()
                            : 'N/A'}
                        </TableCell>
                        <TableCell>
                          <Box sx={{ maxWidth: 200, wordBreak: 'break-word' }}>
                            {test.test_result || 'N/A'}
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={test.test_status}
                            color={
                              test.test_status === 'completed'
                                ? 'success'
                                : test.test_status === 'pending'
                                ? 'warning'
                                : 'default'
                            }
                            size="small"
                          />
                        </TableCell>
                        <TableCell>
                          {test.test_status !== 'completed' && (
                            <Button
                              size="small"
                              variant="contained"
                              onClick={() => handleSelectTest(test)}
                              startIcon={<CheckCircleIcon />}
                            >
                              Enter Result
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </>
        )}
      </Paper>

      {/* Test Result Dialog */}
      <Dialog open={resultDialogOpen} onClose={() => setResultDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          Enter Test Result - {selectedTest?.test_name}
        </DialogTitle>
        <DialogContent>
          {selectedTest && (
            <Box sx={{ mt: 2 }}>
              <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' } }}>
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Patient: {selectedTest.patient_name}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    ID: {selectedTest.national_id || 'N/A'}
                  </Typography>
                </Box>
                {selectedTest.symptoms && (
                  <Box sx={{ gridColumn: '1 / -1' }}>
                    <Typography variant="body2" color="text.secondary">
                      Symptoms: {selectedTest.symptoms}
                    </Typography>
                  </Box>
                )}
                {selectedTest.disease_diagnosis && (
                  <Box sx={{ gridColumn: '1 / -1' }}>
                    <Typography variant="body2" color="text.secondary">
                      Diagnosis: {selectedTest.disease_diagnosis}
                    </Typography>
                  </Box>
                )}
                <Box sx={{ gridColumn: '1 / -1' }}>
                  <TextField
                    fullWidth
                    label="Test Result"
                    multiline
                    rows={6}
                    value={testResult}
                    onChange={(e) => setTestResult(e.target.value)}
                    placeholder="Enter detailed test results here..."
                    required
                  />
                </Box>
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setResultDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={handleSubmitResult}
            variant="contained"
            disabled={loading || !testResult.trim()}
          >
            {loading ? 'Submitting...' : 'Submit Result'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default LabScreen;

