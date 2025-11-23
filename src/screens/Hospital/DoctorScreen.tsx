import React, { useState, useEffect, useCallback } from 'react';
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
  Tabs,
  Tab,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Chip,
  IconButton,
  Autocomplete,
} from '@mui/material';
import {
  Search as SearchIcon,
  Add as AddIcon,
  Refresh as RefreshIcon,
  LocalPharmacy as PharmacyIcon,
  Science as LabIcon,
} from '@mui/icons-material';
import { ApiService } from '../../services/api';

interface Consultation {
  id: number;
  consultation_number: string;
  patient_name: string;
  national_id?: string;
  age?: number;
  location?: string;
  phone_number?: string;
  is_first_visit: boolean;
}

interface DoctorVisit {
  id: number;
  symptoms?: string;
  blood_pressure?: string;
  temperature?: number;
  heart_rate?: number;
  other_analysis?: string;
  disease_diagnosis?: string;
  notes?: string;
  status: string;
  lab_test_required: boolean;
}

interface LabTest {
  id: number;
  test_name: string;
  test_type?: string;
  test_result?: string;
  test_status: string;
}

interface Item {
  id: number;
  item_name: string;
  quantity: number;
  selling_price: number;
}

const DoctorScreen: React.FC = () => {
  const [tabValue, setTabValue] = useState(0);
  const [pendingConsultations, setPendingConsultations] = useState<Consultation[]>([]);
  const [selectedConsultation, setSelectedConsultation] = useState<Consultation | null>(null);
  const [doctorVisit, setDoctorVisit] = useState<DoctorVisit | null>(null);
  const [labTests, setLabTests] = useState<LabTest[]>([]);
  const [labTestResults, setLabTestResults] = useState<LabTest[]>([]);
  const [items, setItems] = useState<Item[]>([]);
  const [selectedItems, setSelectedItems] = useState<Array<{ item_id: number; quantity_prescribed: number; unit_price: number }>>([]);
  const [searchItemQuery, setSearchItemQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Form states
  const [symptoms, setSymptoms] = useState('');
  const [bloodPressure, setBloodPressure] = useState('');
  const [temperature, setTemperature] = useState('');
  const [heartRate, setHeartRate] = useState('');
  const [otherAnalysis, setOtherAnalysis] = useState('');
  const [diseaseDiagnosis, setDiseaseDiagnosis] = useState('');
  const [notes, setNotes] = useState('');
  const [labTestName, setLabTestName] = useState('');
  const [labTestType, setLabTestType] = useState('');

  useEffect(() => {
    loadPendingConsultations();
    loadItems();
  }, []);

  const loadLabTestResults = useCallback(async () => {
    if (!selectedConsultation || !doctorVisit) return;
    try {
      // Pass doctor_visit_id to get results for this specific visit
      const response = await ApiService.getLabTestResults(doctorVisit.id);
      if (response.success) {
        const results = response.data.lab_tests || [];
        
        // Check if there are new completed results before updating state
        setLabTestResults((prevResults) => {
          const completedResults = results.filter((test: LabTest) => test.test_status === 'completed' && test.test_result);
          if (completedResults.length > 0) {
            // Check if we have new results that weren't there before
            const hasNewResults = completedResults.some((test: LabTest) => {
              const existing = prevResults.find((t) => t.id === test.id);
              return !existing || existing.test_status !== 'completed' || !existing.test_result;
            });
            
            if (hasNewResults) {
              // Use setTimeout to avoid state update during render
              setTimeout(() => {
                setSuccess(`Lab test results are now available! ${completedResults.length} test(s) completed.`);
                // Auto-switch to Lab Results tab if not already there
                setTabValue((currentTab) => {
                  if (currentTab !== 3) {
                    return 3;
                  }
                  return currentTab;
                });
              }, 100);
            }
          }
          return results;
        });
      }
    } catch (err: any) {
      console.error('Error loading lab test results:', err);
    }
  }, [selectedConsultation, doctorVisit]);

  useEffect(() => {
    if (selectedConsultation) {
      loadDoctorVisit();
    }
  }, [selectedConsultation]);

  useEffect(() => {
    if (doctorVisit) {
      loadLabTestResults();
      // Poll for new lab results every 10 seconds when doctor visit is loaded
      const interval = setInterval(() => {
        loadLabTestResults();
      }, 10000); // Check every 10 seconds
      
      return () => clearInterval(interval);
    }
  }, [doctorVisit, loadLabTestResults]);

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

  const loadItems = async () => {
    try {
      const response = await ApiService.getItems({ limit: 1000 });
      if (response.success) {
        setItems(response.data.items || []);
      }
    } catch (err: any) {
      console.error('Error loading items:', err);
    }
  };

  const loadDoctorVisit = async () => {
    if (!selectedConsultation) return;
    
    try {
      const response = await ApiService.getDoctorVisitByConsultation(selectedConsultation.id);
      if (response.success && response.data.doctor_visit) {
        const visit = response.data.doctor_visit;
        setDoctorVisit(visit);
        setSymptoms(visit.symptoms || '');
        setBloodPressure(visit.blood_pressure || '');
        setTemperature(visit.temperature?.toString() || '');
        setHeartRate(visit.heart_rate?.toString() || '');
        setOtherAnalysis(visit.other_analysis || '');
        setDiseaseDiagnosis(visit.disease_diagnosis || '');
        setNotes(visit.notes || '');
        if (visit.lab_tests) {
          setLabTests(visit.lab_tests);
        }
      } else {
        // Reset form if no visit exists
        setDoctorVisit(null);
        setSymptoms('');
        setBloodPressure('');
        setTemperature('');
        setHeartRate('');
        setOtherAnalysis('');
        setDiseaseDiagnosis('');
        setNotes('');
        setLabTests([]);
      }
      setSelectedItems([]);
    } catch (err: any) {
      console.error('Error loading doctor visit:', err);
      // Reset form on error
      setDoctorVisit(null);
      setSymptoms('');
      setBloodPressure('');
      setTemperature('');
      setHeartRate('');
      setOtherAnalysis('');
      setDiseaseDiagnosis('');
      setNotes('');
      setSelectedItems([]);
    }
  };

  const handleSelectConsultation = (consultation: Consultation) => {
    setSelectedConsultation(consultation);
    setTabValue(0);
  };

  const handleSaveVisit = async () => {
    if (!selectedConsultation) {
      setError('Please select a consultation');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const response = await ApiService.createOrUpdateDoctorVisit({
        consultation_id: selectedConsultation.id,
        symptoms,
        blood_pressure: bloodPressure || undefined,
        temperature: temperature ? parseFloat(temperature) : undefined,
        heart_rate: heartRate ? parseInt(heartRate) : undefined,
        other_analysis: otherAnalysis || undefined,
        disease_diagnosis: diseaseDiagnosis || undefined,
        notes: notes || undefined,
      });

      if (response.success) {
        setSuccess('Visit information saved successfully!');
        setDoctorVisit(response.data.doctor_visit);
        await loadDoctorVisit(); // Reload to get updated data
        await loadPendingConsultations();
      } else {
        setError('Failed to save visit information');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'An error occurred');
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleRequestLabTest = async () => {
    if (!doctorVisit || !labTestName) {
      setError('Please enter a test name');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await ApiService.requestLabTests({
        doctor_visit_id: doctorVisit.id,
        tests: [{ test_name: labTestName, test_type: labTestType || undefined }],
      });

      if (response.success) {
        setSuccess('Lab test requested successfully!');
        setLabTestName('');
        setLabTestType('');
        setLabTests([...labTests, ...response.data.lab_tests]);
      } else {
        setError('Failed to request lab test');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'An error occurred');
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddMedicine = (item: Item) => {
    const existing = selectedItems.find((si) => si.item_id === item.id);
    if (existing) {
      setSelectedItems(
        selectedItems.map((si) =>
          si.item_id === item.id
            ? { ...si, quantity_prescribed: si.quantity_prescribed + 1 }
            : si
        )
      );
    } else {
      setSelectedItems([
        ...selectedItems,
        {
          item_id: item.id,
          quantity_prescribed: 1,
          unit_price: item.selling_price,
        },
      ]);
    }
  };

  const handleCreatePrescription = async () => {
    if (!doctorVisit || selectedItems.length === 0) {
      setError('Please add at least one medicine');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const response = await ApiService.createPrescription({
        doctor_visit_id: doctorVisit.id,
        items: selectedItems,
      });

      if (response.success) {
        setSuccess('Prescription created successfully!');
        setSelectedItems([]);
        await loadPendingConsultations();
      } else {
        setError('Failed to create prescription');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'An error occurred');
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredItems = items.filter(
    (item) =>
      item.item_name.toLowerCase().includes(searchItemQuery.toLowerCase()) &&
      item.quantity > 0
  );

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom sx={{ mb: 3 }}>
        Doctor - Patient Consultation
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

      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 2fr' }, gap: 3 }}>
        {/* Pending Consultations List */}
        <Box>
          <Paper sx={{ p: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6">Pending Patients</Typography>
              <IconButton onClick={loadPendingConsultations} size="small">
                <RefreshIcon />
              </IconButton>
            </Box>
            <TableContainer sx={{ maxHeight: 600 }}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Consultation #</TableCell>
                    <TableCell>Patient Name</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {pendingConsultations.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={2} align="center">
                        No pending consultations
                      </TableCell>
                    </TableRow>
                  ) : (
                    pendingConsultations.map((consultation) => (
                      <TableRow
                        key={consultation.id}
                        onClick={() => handleSelectConsultation(consultation)}
                        sx={{
                          cursor: 'pointer',
                          backgroundColor:
                            selectedConsultation?.id === consultation.id ? 'action.selected' : 'inherit',
                        }}
                      >
                        <TableCell>{consultation.consultation_number}</TableCell>
                        <TableCell>{consultation.patient_name}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </Box>

        {/* Patient Details and Consultation */}
        <Box>
          {selectedConsultation ? (
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                Patient: {selectedConsultation.patient_name}
              </Typography>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                ID: {selectedConsultation.national_id || 'N/A'} | Age: {selectedConsultation.age || 'N/A'} |{' '}
                {selectedConsultation.is_first_visit ? 'First Visit' : 'Revisit'}
              </Typography>

              <Box sx={{ borderBottom: 1, borderColor: 'divider', mt: 2 }}>
                <Tabs value={tabValue} onChange={(e, newValue) => setTabValue(newValue)}>
                  <Tab label="Symptoms & Analysis" />
                  <Tab label="Lab Tests" />
                  <Tab label="Prescribe Medicine" />
                  <Tab label="Lab Results" />
                </Tabs>
              </Box>

              {/* Symptoms & Analysis Tab */}
              {tabValue === 0 && (
                <Box sx={{ mt: 3 }}>
                  <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr', sm: 'repeat(3, 1fr)' } }}>
                    <Box sx={{ gridColumn: '1 / -1' }}>
                      <TextField
                        fullWidth
                        label="Symptoms"
                        multiline
                        rows={4}
                        value={symptoms}
                        onChange={(e) => setSymptoms(e.target.value)}
                        placeholder="Enter patient symptoms..."
                      />
                    </Box>

                    <Box>
                      <TextField
                        fullWidth
                        label="Blood Pressure"
                        value={bloodPressure}
                        onChange={(e) => setBloodPressure(e.target.value)}
                        placeholder="e.g., 120/80"
                      />
                    </Box>

                    <Box>
                      <TextField
                        fullWidth
                        label="Temperature (°C)"
                        type="number"
                        value={temperature}
                        onChange={(e) => setTemperature(e.target.value)}
                      />
                    </Box>

                    <Box>
                      <TextField
                        fullWidth
                        label="Heart Rate (bpm)"
                        type="number"
                        value={heartRate}
                        onChange={(e) => setHeartRate(e.target.value)}
                      />
                    </Box>

                    <Box sx={{ gridColumn: '1 / -1' }}>
                      <TextField
                        fullWidth
                        label="Other Analysis"
                        multiline
                        rows={3}
                        value={otherAnalysis}
                        onChange={(e) => setOtherAnalysis(e.target.value)}
                      />
                    </Box>

                    <Box sx={{ gridColumn: '1 / -1' }}>
                      <TextField
                        fullWidth
                        label="Disease Diagnosis"
                        value={diseaseDiagnosis}
                        onChange={(e) => setDiseaseDiagnosis(e.target.value)}
                        placeholder="Enter disease name if known..."
                      />
                    </Box>

                    <Box sx={{ gridColumn: '1 / -1' }}>
                      <TextField
                        fullWidth
                        label="Notes"
                        multiline
                        rows={2}
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                      />
                    </Box>

                    <Box sx={{ gridColumn: '1 / -1' }}>
                      <Button
                        variant="contained"
                        onClick={handleSaveVisit}
                        disabled={loading}
                        startIcon={<AddIcon />}
                      >
                        {loading ? 'Saving...' : 'Save Visit Information'}
                      </Button>
                    </Box>
                  </Box>
                </Box>
              )}

              {/* Lab Tests Tab */}
              {tabValue === 1 && (
                <Box sx={{ mt: 3 }}>
                  <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' } }}>
                    <Box>
                      <TextField
                        fullWidth
                        label="Test Name"
                        value={labTestName}
                        onChange={(e) => setLabTestName(e.target.value)}
                        placeholder="e.g., Blood Test, X-Ray"
                      />
                    </Box>
                    <Box>
                      <TextField
                        fullWidth
                        label="Test Type"
                        value={labTestType}
                        onChange={(e) => setLabTestType(e.target.value)}
                        placeholder="e.g., CBC, Chest X-Ray"
                      />
                    </Box>
                    <Box sx={{ gridColumn: '1 / -1' }}>
                      <Button
                        variant="contained"
                        onClick={handleRequestLabTest}
                        disabled={loading || !doctorVisit}
                        startIcon={<LabIcon />}
                      >
                        Request Lab Test
                      </Button>
                    </Box>
                    {labTests.length > 0 && (
                      <Box sx={{ gridColumn: '1 / -1' }}>
                        <Typography variant="subtitle2" gutterBottom>
                          Requested Tests:
                        </Typography>
                        {labTests.map((test) => (
                          <Chip
                            key={test.id}
                            label={`${test.test_name}${test.test_type ? ` (${test.test_type})` : ''}`}
                            sx={{ mr: 1, mb: 1 }}
                          />
                        ))}
                      </Box>
                    )}
                  </Box>
                </Box>
              )}

              {/* Prescribe Medicine Tab */}
              {tabValue === 2 && (
                <Box sx={{ mt: 3 }}>
                  <Box sx={{ display: 'grid', gap: 2 }}>
                    <Box>
                      <TextField
                        fullWidth
                        label="Search Medicine"
                        value={searchItemQuery}
                        onChange={(e) => setSearchItemQuery(e.target.value)}
                        InputProps={{
                          startAdornment: <SearchIcon sx={{ mr: 1, color: 'action.active' }} />,
                        }}
                      />
                    </Box>
                    <Box>
                      <TableContainer>
                        <Table size="small">
                          <TableHead>
                            <TableRow>
                              <TableCell>Medicine</TableCell>
                              <TableCell>Stock</TableCell>
                              <TableCell>Price</TableCell>
                              <TableCell>Action</TableCell>
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            {filteredItems.slice(0, 10).map((item) => (
                              <TableRow key={item.id}>
                                <TableCell>{item.item_name}</TableCell>
                                <TableCell>{item.quantity}</TableCell>
                                <TableCell>KES {item.selling_price.toFixed(2)}</TableCell>
                                <TableCell>
                                  <Button
                                    size="small"
                                    onClick={() => handleAddMedicine(item)}
                                    variant="outlined"
                                  >
                                    Add
                                  </Button>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </TableContainer>
                    </Box>
                    {selectedItems.length > 0 && (
                      <>
                        <Box>
                          <Typography variant="subtitle2" gutterBottom>
                            Selected Medicines:
                          </Typography>
                          <TableContainer>
                            <Table size="small">
                              <TableHead>
                                <TableRow>
                                  <TableCell>Medicine</TableCell>
                                  <TableCell>Quantity</TableCell>
                                  <TableCell>Price</TableCell>
                                  <TableCell>Total</TableCell>
                                  <TableCell>Action</TableCell>
                                </TableRow>
                              </TableHead>
                              <TableBody>
                                {selectedItems.map((item, index) => {
                                  const itemDetails = items.find((i) => i.id === item.item_id);
                                  return (
                                    <TableRow key={index}>
                                      <TableCell>{itemDetails?.item_name || 'Unknown'}</TableCell>
                                      <TableCell>
                                        <TextField
                                          type="number"
                                          size="small"
                                          value={item.quantity_prescribed}
                                          onChange={(e) => {
                                            const newItems = [...selectedItems];
                                            newItems[index].quantity_prescribed = parseFloat(e.target.value) || 1;
                                            setSelectedItems(newItems);
                                          }}
                                          sx={{ width: 80 }}
                                        />
                                      </TableCell>
                                      <TableCell>KES {item.unit_price.toFixed(2)}</TableCell>
                                      <TableCell>
                                        KES {(item.quantity_prescribed * item.unit_price).toFixed(2)}
                                      </TableCell>
                                      <TableCell>
                                        <IconButton
                                          size="small"
                                          onClick={() => {
                                            setSelectedItems(selectedItems.filter((_, i) => i !== index));
                                          }}
                                        >
                                          ×
                                        </IconButton>
                                      </TableCell>
                                    </TableRow>
                                  );
                                })}
                              </TableBody>
                            </Table>
                          </TableContainer>
                        </Box>
                        <Box>
                          <Button
                            variant="contained"
                            color="primary"
                            onClick={handleCreatePrescription}
                            disabled={loading || !doctorVisit}
                            startIcon={<PharmacyIcon />}
                          >
                            {loading ? 'Creating...' : 'Create Prescription'}
                          </Button>
                        </Box>
                      </>
                    )}
                  </Box>
                </Box>
              )}

              {/* Lab Results Tab */}
              {tabValue === 3 && (
                <Box sx={{ mt: 3 }}>
                  <Typography variant="subtitle1" gutterBottom>
                    Lab Test Results
                  </Typography>
                  {labTestResults.length === 0 ? (
                    <Typography color="text.secondary">No lab test results available</Typography>
                  ) : (
                    <TableContainer>
                      <Table size="small">
                        <TableHead>
                          <TableRow>
                            <TableCell>Test Name</TableCell>
                            <TableCell>Type</TableCell>
                            <TableCell>Result</TableCell>
                            <TableCell>Status</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {labTestResults.map((test) => (
                            <TableRow key={test.id}>
                              <TableCell>{test.test_name}</TableCell>
                              <TableCell>{test.test_type || 'N/A'}</TableCell>
                              <TableCell>{test.test_result || 'Pending'}</TableCell>
                              <TableCell>
                                <Chip
                                  label={test.test_status}
                                  color={test.test_status === 'completed' ? 'success' : 'default'}
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
            </Paper>
          ) : (
            <Paper sx={{ p: 3, textAlign: 'center' }}>
              <Typography color="text.secondary">
                Please select a patient from the list to begin consultation
              </Typography>
            </Paper>
          )}
        </Box>
      </Box>
    </Container>
  );
};

export default DoctorScreen;