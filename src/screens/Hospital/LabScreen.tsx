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
} from '@mui/material';
import {
  Refresh as RefreshIcon,
  CheckCircle as CheckCircleIcon,
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

const LabScreen: React.FC = () => {
  const [pendingTests, setPendingTests] = useState<LabTest[]>([]);
  const [selectedTest, setSelectedTest] = useState<LabTest | null>(null);
  const [testResult, setTestResult] = useState('');
  const [resultDialogOpen, setResultDialogOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    loadPendingTests();
    // Refresh every 30 seconds
    const interval = setInterval(loadPendingTests, 30000);
    return () => clearInterval(interval);
  }, []);

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

