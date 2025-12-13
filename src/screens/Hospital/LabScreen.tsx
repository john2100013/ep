import React, { useState, useEffect, Fragment } from 'react';
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
  Assessment as AssessmentIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
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
  payment_status?: string;
  amount_due?: number;
  amount_paid?: number;
  price?: number;
}

interface AllLabTest extends LabTest {
  consultation_number?: string;
  test_completed_at?: string;
  test_result?: string;
  attachment_url?: string;
  attachment_filename?: string;
}

interface GroupedLabTest {
  doctor_visit_id: number;
  patient_id: number;
  patient_name: string;
  national_id?: string;
  requested_at: string;
  test_count: number;
  paid_count: number;
  unpaid_count: number;
  payment_status: string;
  test_status: string;
  tests: LabTest[];
}

const LabScreen: React.FC = () => {
  const navigate = useNavigate();
  const [tabValue, setTabValue] = useState(0);
  const [pendingTests, setPendingTests] = useState<LabTest[]>([]);
  const [groupedPendingTests, setGroupedPendingTests] = useState<GroupedLabTest[]>([]);
  const [expandedGroups, setExpandedGroups] = useState<Set<number>>(new Set());
  const [allTests, setAllTests] = useState<AllLabTest[]>([]);
  const [selectedTest, setSelectedTest] = useState<LabTest | null>(null);
  const [testResult, setTestResult] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [attachmentUrl, setAttachmentUrl] = useState('');
  const [attachmentFilename, setAttachmentFilename] = useState('');
  const [resultDialogOpen, setResultDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [paymentFilter, setPaymentFilter] = useState<'all' | 'paid' | 'unpaid'>('all');
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
  }, [tabValue, searchQuery, statusFilter, paymentFilter]);

  const loadPendingTests = async () => {
    try {
      const response = await ApiService.getGroupedPendingLabTests();
      if (response.success) {
        setGroupedPendingTests(response.data.grouped_lab_tests || []);
        // Also keep individual tests for backward compatibility
        const allTests: LabTest[] = [];
        (response.data.grouped_lab_tests || []).forEach((group: GroupedLabTest) => {
          allTests.push(...group.tests);
        });
        setPendingTests(allTests);
      }
    } catch (err: any) {
      console.error('Error loading lab tests:', err);
    }
  };

  const toggleGroupExpansion = (doctorVisitId: number) => {
    const newExpanded = new Set(expandedGroups);
    if (newExpanded.has(doctorVisitId)) {
      newExpanded.delete(doctorVisitId);
    } else {
      newExpanded.add(doctorVisitId);
    }
    setExpandedGroups(newExpanded);
  };

  const loadAllTests = async () => {
    try {
      setLoading(true);
      const response = await ApiService.getAllLabTests(
        searchQuery || undefined,
        statusFilter !== 'all' ? statusFilter : undefined
      );
      if (response.success) {
        let tests = response.data.lab_tests || [];
        // Filter by payment status
        if (paymentFilter !== 'all') {
          tests = tests.filter((test: LabTest) => {
            if (paymentFilter === 'paid') {
              return test.payment_status === 'paid' || test.payment_status === 'partially_paid';
            } else {
              return test.payment_status !== 'paid' && test.payment_status !== 'partially_paid';
            }
          });
        }
        setAllTests(tests);
      }
    } catch (err: any) {
      console.error('Error loading all lab tests:', err);
      setError('Failed to load lab tests');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectTest = (test: LabTest) => {
    // Check if test is paid before allowing result entry
    if (test.payment_status !== 'paid' && test.payment_status !== 'partially_paid') {
      setError('This test has not been paid for. Please send the patient to pharmacy to pay first.');
      return;
    }
    setSelectedTest(test);
    setTestResult('');
    setSelectedFile(null);
    setAttachmentUrl('');
    setAttachmentFilename('');
    setResultDialogOpen(true);
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      // For now, we'll store the file name and create a data URL
      // In production, you'd upload to a file storage service (S3, Cloudinary, etc.)
      const reader = new FileReader();
      reader.onloadend = () => {
        setAttachmentUrl(reader.result as string);
        setAttachmentFilename(file.name);
      };
      reader.readAsDataURL(file);
    }
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
      const response = await ApiService.updateLabTestResult(
        selectedTest.id, 
        testResult,
        attachmentUrl || undefined,
        attachmentFilename || undefined
      );

      if (response.success) {
        setSuccess('Test result submitted successfully!');
        setResultDialogOpen(false);
        setSelectedTest(null);
        setTestResult('');
        setSelectedFile(null);
        setAttachmentUrl('');
        setAttachmentFilename('');
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
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
          Lab Technician - Test Results
        </Typography>
        <Button
          variant="outlined"
          startIcon={<AssessmentIcon />}
          onClick={() => navigate('/hospital/lab-analytics')}
        >
          View Analytics
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
                <TableCell width="50px"></TableCell>
                <TableCell>Patient Name</TableCell>
                <TableCell>ID Number</TableCell>
                <TableCell>Requested At</TableCell>
                <TableCell>Payment Status</TableCell>
                <TableCell>Test Status</TableCell>
                <TableCell>Tests Count</TableCell>
                <TableCell>Action</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {groupedPendingTests.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} align="center" sx={{ py: 4 }}>
                    <Typography color="text.secondary">
                      No pending lab tests. New tests will appear here when requested by doctors.
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                groupedPendingTests.map((group) => (
                  <Fragment key={group.doctor_visit_id}>
                    <TableRow 
                      hover 
                      sx={{ 
                        cursor: 'pointer',
                        backgroundColor: expandedGroups.has(group.doctor_visit_id) ? 'action.selected' : 'inherit'
                      }}
                      onClick={() => toggleGroupExpansion(group.doctor_visit_id)}
                    >
                      <TableCell>
                        {expandedGroups.has(group.doctor_visit_id) ? '▼' : '▶'}
                      </TableCell>
                      <TableCell><strong>{group.patient_name}</strong></TableCell>
                      <TableCell>{group.national_id || 'N/A'}</TableCell>
                      <TableCell>
                        {new Date(group.requested_at).toLocaleString()}
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={group.payment_status || 'unpaid'}
                          color={group.payment_status === 'paid' ? 'success' : group.payment_status === 'partially_paid' ? 'warning' : 'error'}
                          size="small"
                        />
                        {group.payment_status !== 'paid' && (
                          <Typography variant="caption" color="error" sx={{ display: 'block', mt: 0.5 }}>
                            Send to pharmacy
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={group.test_status || 'pending'}
                          color={group.test_status === 'completed' ? 'success' : 'warning'}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        <Chip label={`${group.test_count} test(s)`} size="small" />
                      </TableCell>
                      <TableCell onClick={(e) => e.stopPropagation()}>
                        {group.payment_status === 'paid' && (
                          <Button
                            size="small"
                            variant="outlined"
                            onClick={() => toggleGroupExpansion(group.doctor_visit_id)}
                          >
                            View Tests
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                    {expandedGroups.has(group.doctor_visit_id) && (
                      <TableRow>
                        <TableCell colSpan={8} sx={{ py: 2, backgroundColor: 'grey.50' }}>
                          <Table size="small">
                            <TableHead>
                              <TableRow>
                                <TableCell>Test Name</TableCell>
                                <TableCell>Test Type</TableCell>
                                <TableCell>Category</TableCell>
                                <TableCell>Others</TableCell>
                                <TableCell align="right">Price</TableCell>
                                <TableCell>Status</TableCell>
                                <TableCell>Action</TableCell>
                              </TableRow>
                            </TableHead>
                            <TableBody>
                              {group.tests.map((test) => (
                                <TableRow key={test.id}>
                                  <TableCell>{test.test_name}</TableCell>
                                  <TableCell>{test.test_type || 'N/A'}</TableCell>
                                  <TableCell>{(test as any).category || 'N/A'}</TableCell>
                                  <TableCell>{(test as any).others || 'N/A'}</TableCell>
                                  <TableCell align="right">KES {Number((test as any).price || 0).toFixed(2)}</TableCell>
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
                                      disabled={test.test_status === 'completed' || test.payment_status !== 'paid'}
                                    >
                                      {test.payment_status !== 'paid' ? 'Not Paid' : test.test_status === 'completed' ? 'Completed' : 'Enter Result'}
                                    </Button>
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </TableCell>
                      </TableRow>
                    )}
                  </Fragment>
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
                <InputLabel>Test Status</InputLabel>
                <Select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  label="Test Status"
                >
                  <MenuItem value="all">All</MenuItem>
                  <MenuItem value="pending">Pending</MenuItem>
                  <MenuItem value="in_progress">In Progress</MenuItem>
                  <MenuItem value="completed">Completed</MenuItem>
                  <MenuItem value="cancelled">Cancelled</MenuItem>
                </Select>
              </FormControl>
              <FormControl size="small" sx={{ minWidth: 150 }}>
                <InputLabel>Payment Status</InputLabel>
                <Select
                  value={paymentFilter}
                  onChange={(e) => setPaymentFilter(e.target.value as 'all' | 'paid' | 'unpaid')}
                  label="Payment Status"
                >
                  <MenuItem value="all">All</MenuItem>
                  <MenuItem value="paid">Paid</MenuItem>
                  <MenuItem value="unpaid">Unpaid</MenuItem>
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
                    <TableCell>Payment Status</TableCell>
                    <TableCell>Test Status</TableCell>
                    <TableCell>Action</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {allTests.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={11} align="center" sx={{ py: 4 }}>
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
                            label={test.payment_status || 'unpaid'}
                            color={test.payment_status === 'paid' ? 'success' : test.payment_status === 'partially_paid' ? 'warning' : 'error'}
                            size="small"
                          />
                          {test.amount_due && test.amount_due > 0 && (
                            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
                              Due: KES {Number(test.amount_due).toFixed(2)}
                            </Typography>
                          )}
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
                              disabled={test.payment_status !== 'paid' && test.payment_status !== 'partially_paid'}
                            >
                              {test.payment_status !== 'paid' && test.payment_status !== 'partially_paid' ? 'Not Paid' : 'Enter Result'}
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
                    rows={12}
                    value={testResult}
                    onChange={(e) => setTestResult(e.target.value)}
                    placeholder="Enter detailed test results here..."
                    required
                    sx={{ mb: 2 }}
                  />
                </Box>
                <Box sx={{ gridColumn: '1 / -1' }}>
                  <Typography variant="subtitle2" gutterBottom>
                    Attach File (Optional)
                  </Typography>
                  <input
                    type="file"
                    accept="image/*,.pdf,.doc,.docx"
                    onChange={handleFileChange}
                    style={{ marginBottom: '8px' }}
                  />
                  {selectedFile && (
                    <Box sx={{ mt: 1 }}>
                      <Typography variant="body2" color="success.main">
                        ✓ File selected: {selectedFile.name} ({(selectedFile.size / 1024).toFixed(2)} KB)
                      </Typography>
                    </Box>
                  )}
                  {attachmentFilename && !selectedFile && (
                    <Box sx={{ mt: 1 }}>
                      <Typography variant="body2" color="text.secondary">
                        Current attachment: {attachmentFilename}
                      </Typography>
                    </Box>
                  )}
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

