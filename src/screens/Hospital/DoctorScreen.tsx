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
  Close as CloseIcon,
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
  test_completed_at?: string;
  test_requested_at?: string;
  patient_name?: string;
  national_id?: string;
  consultation_number?: string;
  doctor_viewed_at?: string;
  attachment_url?: string;
  attachment_filename?: string;
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
  const [allLabResults, setAllLabResults] = useState<LabTest[]>([]);
  const [items, setItems] = useState<Item[]>([]);
  const [selectedItems, setSelectedItems] = useState<Array<{ item_id: number; quantity_prescribed: number; unit_price: number }>>([]);
  const [searchItemQuery, setSearchItemQuery] = useState('');
  const [patientSearchQuery, setPatientSearchQuery] = useState('');
  const [allPatients, setAllPatients] = useState<any[]>([]);
  const [showPatientHistory, setShowPatientHistory] = useState(false);
  const [patientHistoryData, setPatientHistoryData] = useState<any>(null);
  const [labResultModalOpen, setLabResultModalOpen] = useState(false);
  const [selectedLabResult, setSelectedLabResult] = useState<LabTest | null>(null);
  const [prescriptionModalOpen, setPrescriptionModalOpen] = useState(false);
  const [selectedPrescription, setSelectedPrescription] = useState<any>(null);
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
  const [labTestRows, setLabTestRows] = useState<Array<{ test_name: string; test_type: string; category: string; others: string; price: number }>>([]);

  useEffect(() => {
    loadPendingConsultations();
    loadItems();
    loadAllLabResults();
  }, []);

  const loadAllLabResults = async () => {
    try {
      const response = await ApiService.getLabTestResults(undefined, true);
      if (response.success) {
        setAllLabResults(response.data.lab_tests || []);
      }
    } catch (err: any) {
      console.error('Error loading all lab results:', err);
    }
  };

  const loadPatientHistory = async () => {
    try {
      setLoading(true);
      const response = await ApiService.getDoctorPatients(patientSearchQuery || undefined);
      if (response.success) {
        setAllPatients(response.data.patients || []);
      }
    } catch (err: any) {
      console.error('Error loading patient history:', err);
      setError('Failed to load patient history');
    } finally {
      setLoading(false);
    }
  };

  const handleMarkResultViewed = async (labTestId: number) => {
    try {
      await ApiService.markLabResultViewed(labTestId);
      await loadAllLabResults();
      if (doctorVisit) {
        await loadLabTestResults();
      }
    } catch (err: any) {
      console.error('Error marking result as viewed:', err);
    }
  };

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
      // Poll for new lab results every 5 seconds when doctor visit is loaded
      const interval = setInterval(() => {
        loadLabTestResults();
        loadAllLabResults(); // Also refresh all results
      }, 5000); // Check every 5 seconds
      
      return () => clearInterval(interval);
    }
  }, [doctorVisit, loadLabTestResults]);

  // Also poll for all lab results periodically
  useEffect(() => {
    const interval = setInterval(() => {
      loadAllLabResults();
    }, 10000); // Check every 10 seconds
    
    return () => clearInterval(interval);
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

  const handleSelectConsultation = async (consultation: Consultation) => {
    setSelectedConsultation(consultation);
    setTabValue(0);
    setError('');
    setSuccess('');
    
    // Load complete patient history to autopopulate all information
    try {
      const historyResponse = await ApiService.getPatientConsultationHistory(
        undefined,
        consultation.national_id
      );

      if (historyResponse.success && historyResponse.data) {
        const { latest_doctor_visit, lab_tests, prescriptions } = historyResponse.data;

        // Store patient history data for HISTORY PRESCRIPTION card
        console.log('📋 Patient History Data:', {
          prescriptions: prescriptions?.length || 0,
          prescriptionsData: prescriptions,
          fullData: historyResponse.data
        });
        setPatientHistoryData(historyResponse.data);

        // If there's a latest doctor visit, populate the form
        if (latest_doctor_visit) {
          setDoctorVisit(latest_doctor_visit);
          setSymptoms(latest_doctor_visit.symptoms || '');
          setBloodPressure(latest_doctor_visit.blood_pressure || '');
          setTemperature(latest_doctor_visit.temperature?.toString() || '');
          setHeartRate(latest_doctor_visit.heart_rate?.toString() || '');
          setOtherAnalysis(latest_doctor_visit.other_analysis || '');
          setDiseaseDiagnosis(latest_doctor_visit.disease_diagnosis || '');
          setNotes(latest_doctor_visit.notes || '');

          // Load lab tests for this visit
          const visitLabTests = lab_tests.filter(
            (test: any) => test.doctor_visit_id === latest_doctor_visit.id
          );
          setLabTests(visitLabTests);

          // Load all completed lab test results for this patient
          const completedTests = lab_tests.filter(
            (test: any) => test.test_status === 'completed' && test.test_result
          );
          setLabTestResults(completedTests);
        } else {
          // Even if no doctor visit, still set patient history data for prescriptions
          setPatientHistoryData(historyResponse.data);
        }
      }
    } catch (err: any) {
      console.error('Error loading patient history:', err);
      // Don't show error, just continue with normal flow
    }
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

  const handleAddLabTestRow = () => {
    if (labTestRows.length >= 7) {
      setError('Maximum of 7 lab tests allowed');
      return;
    }
    setLabTestRows([...labTestRows, { test_name: '', test_type: '', category: '', others: '', price: 0 }]);
  };

  const handleUpdateLabTestRow = (index: number, field: string, value: string | number) => {
    const updated = [...labTestRows];
    updated[index] = { ...updated[index], [field]: value };
    setLabTestRows(updated);
  };

  const handleRemoveLabTestRow = (index: number) => {
    setLabTestRows(labTestRows.filter((_, i) => i !== index));
  };

  const handleRequestLabTest = async () => {
    if (!doctorVisit) {
      setError('Please select a consultation first');
      return;
    }

    if (labTestRows.length === 0) {
      setError('Please add at least one lab test');
      return;
    }

    // Validate all rows have test name
    const invalidRows = labTestRows.filter(row => !row.test_name.trim());
    if (invalidRows.length > 0) {
      setError('Please enter test name for all tests');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const tests = labTestRows.map(row => ({
        test_name: row.test_name.trim(),
        test_type: row.test_type.trim() || undefined,
        category: row.category.trim() || undefined,
        others: row.others.trim() || undefined,
        price: parseFloat(row.price.toString()) || 0
      }));

      const response = await ApiService.requestLabTests({
        doctor_visit_id: doctorVisit.id,
        tests,
      });

      if (response.success) {
        setSuccess(`Lab tests requested successfully! Total: KES ${response.data.total_amount?.toFixed(2) || '0.00'}`);
        setLabTestRows([]);
        await loadDoctorVisit(); // Reload to get updated lab tests
      } else {
        setError('Failed to request lab tests');
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
        {/* Left Panel - Pending Consultations and Lab Results */}
        <Box>
          {/* Pending Consultations List */}
          <Paper sx={{ p: 2, mb: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6">Pending Patients</Typography>
              <Box>
                <Button
                  size="small"
                  variant="outlined"
                  onClick={() => {
                    setShowPatientHistory(!showPatientHistory);
                    if (!showPatientHistory) {
                      loadPatientHistory();
                    }
                  }}
                  sx={{ mr: 1 }}
                >
                  {showPatientHistory ? 'Hide' : 'View'} All Patients
                </Button>
                <IconButton onClick={loadPendingConsultations} size="small">
                  <RefreshIcon />
                </IconButton>
              </Box>
            </Box>

            {/* Patient History Search */}
            {showPatientHistory && (
              <Box sx={{ mb: 2 }}>
                <TextField
                  fullWidth
                  size="small"
                  placeholder="Search patients by name, ID, or phone..."
                  value={patientSearchQuery}
                  onChange={(e) => setPatientSearchQuery(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      loadPatientHistory();
                    }
                  }}
                  InputProps={{
                    startAdornment: <SearchIcon sx={{ mr: 1, color: 'action.active' }} />,
                  }}
                  sx={{ mb: 1 }}
                />
                <Button
                  fullWidth
                  variant="contained"
                  size="small"
                  onClick={loadPatientHistory}
                  disabled={loading}
                >
                  {loading ? 'Loading...' : 'Search Patients'}
                </Button>
                {allPatients.length > 0 && (
                  <TableContainer sx={{ maxHeight: 300, mt: 2 }}>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>Patient</TableCell>
                          <TableCell>Visits</TableCell>
                          <TableCell>Last Visit</TableCell>
                          <TableCell>Action</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {allPatients.map((patient: any) => {
                          // Find consultation for this patient
                          const consultation = pendingConsultations.find(
                            (c) => c.national_id === patient.national_id
                          );
                          
                          return (
                            <TableRow
                              key={patient.id}
                              sx={{
                                backgroundColor:
                                  selectedConsultation?.id === consultation?.id ? 'action.selected' : 'inherit',
                              }}
                            >
                              <TableCell
                                onClick={() => {
                                  if (consultation) {
                                    handleSelectConsultation(consultation);
                                  }
                                }}
                                sx={{ cursor: consultation ? 'pointer' : 'default' }}
                              >
                                <Box>
                                  <Typography variant="body2" fontWeight="medium">
                                    {patient.patient_name}
                                  </Typography>
                                  <Typography variant="caption" color="text.secondary">
                                    {patient.national_id || 'N/A'}
                                  </Typography>
                                </Box>
                              </TableCell>
                              <TableCell
                                onClick={() => {
                                  if (consultation) {
                                    handleSelectConsultation(consultation);
                                  }
                                }}
                                sx={{ cursor: consultation ? 'pointer' : 'default' }}
                              >
                                {patient.visit_count}
                              </TableCell>
                              <TableCell
                                onClick={() => {
                                  if (consultation) {
                                    handleSelectConsultation(consultation);
                                  }
                                }}
                                sx={{ cursor: consultation ? 'pointer' : 'default' }}
                              >
                                {patient.last_visit
                                  ? new Date(patient.last_visit).toLocaleDateString()
                                  : 'N/A'}
                              </TableCell>
                              <TableCell>
                                <Button
                                  size="small"
                                  variant="outlined"
                                  onClick={async (e) => {
                                    e.stopPropagation();
                                    try {
                                      const historyResponse = await ApiService.getPatientConsultationHistory(
                                        undefined,
                                        patient.national_id
                                      );
                                      if (historyResponse.success && historyResponse.data) {
                                        console.log('📋 Patient History Response:', {
                                          prescriptions: historyResponse.data.prescriptions?.length || 0,
                                          hasData: !!historyResponse.data
                                        });
                                        setPatientHistoryData(historyResponse.data);
                                        // If there's a consultation, select it; otherwise create a consultation object
                                        if (consultation) {
                                          await handleSelectConsultation(consultation);
                                        } else {
                                          // Create a consultation-like object from patient data
                                          const patientConsultation: Consultation = {
                                            id: patient.id,
                                            consultation_number: `PAT-${patient.national_id}`,
                                            patient_name: patient.patient_name,
                                            national_id: patient.national_id,
                                            age: patient.age,
                                            is_first_visit: patient.visit_count === 1,
                                          };
                                          await handleSelectConsultation(patientConsultation);
                                        }
                                        setSuccess('Patient history loaded successfully');
                                        setTimeout(() => setSuccess(''), 3000);
                                      }
                                    } catch (err: any) {
                                      console.error('Error loading patient history:', err);
                                      setError('Failed to load patient history');
                                      setTimeout(() => setError(''), 3000);
                                    }
                                  }}
                                >
                                  View History
                                </Button>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </TableContainer>
                )}
              </Box>
            )}
            <TableContainer sx={{ maxHeight: 600 }}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Consultation #</TableCell>
                    <TableCell>Patient Name</TableCell>
                    <TableCell>Action</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {pendingConsultations.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={3} align="center">
                        No pending consultations
                      </TableCell>
                    </TableRow>
                  ) : (
                    pendingConsultations.map((consultation) => (
                      <TableRow
                        key={consultation.id}
                        sx={{
                          backgroundColor:
                            selectedConsultation?.id === consultation.id ? 'action.selected' : 'inherit',
                        }}
                      >
                        <TableCell 
                          onClick={() => handleSelectConsultation(consultation)}
                          sx={{ cursor: 'pointer' }}
                        >
                          {consultation.consultation_number}
                        </TableCell>
                        <TableCell 
                          onClick={() => handleSelectConsultation(consultation)}
                          sx={{ cursor: 'pointer' }}
                        >
                          {consultation.patient_name}
                        </TableCell>
                        <TableCell>
                          <Button
                            size="small"
                            variant="outlined"
                            onClick={async (e) => {
                              e.stopPropagation();
                              try {
                                const historyResponse = await ApiService.getPatientConsultationHistory(
                                  undefined,
                                  consultation.national_id
                                );
                                if (historyResponse.success) {
                                  setPatientHistoryData(historyResponse.data);
                                  await handleSelectConsultation(consultation);
                                  setSuccess('Patient history loaded');
                                  setTimeout(() => setSuccess(''), 3000);
                                }
                              } catch (err: any) {
                                setError('Failed to load patient history');
                                setTimeout(() => setError(''), 3000);
                              }
                            }}
                          >
                            View History
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>

          {/* Results from Lab Card - Always Visible */}
          <Paper sx={{ p: 2, mt: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Box>
                <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <LabIcon fontSize="small" />
                  Results from Lab
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {allLabResults.length} completed result{allLabResults.length !== 1 ? 's' : ''}
                </Typography>
              </Box>
              <IconButton onClick={loadAllLabResults} size="small" title="Refresh results">
                <RefreshIcon />
              </IconButton>
            </Box>
            {allLabResults.length === 0 ? (
              <Box sx={{ textAlign: 'center', py: 3 }}>
                <LabIcon sx={{ fontSize: 40, color: 'text.secondary', mb: 1 }} />
                <Typography variant="body2" color="text.secondary">
                  No completed results yet
                </Typography>
                <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                  Results will appear here once submitted by lab technicians
                </Typography>
              </Box>
            ) : (
              <TableContainer sx={{ maxHeight: 400 }}>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell><strong>Patient</strong></TableCell>
                      <TableCell><strong>Test</strong></TableCell>
                      <TableCell align="center"><strong>Status</strong></TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {allLabResults.slice(0, 10).map((test: any) => (
                      <TableRow 
                        key={test.id} 
                        hover
                        sx={{ 
                          cursor: 'pointer',
                          backgroundColor: test.doctor_viewed_at ? 'action.hover' : 'inherit',
                          '&:hover': { backgroundColor: 'action.selected' }
                        }}
                        onClick={async () => {
                          try {
                            // Try to find and select the patient's consultation
                            let consultation = pendingConsultations.find(
                              (c) => c.national_id === test.national_id
                            );
                            
                            // If not in pending, try to load patient history and get latest consultation
                            if (!consultation) {
                              await loadPatientHistory();
                              // Try to find consultation by matching patient
                              consultation = pendingConsultations.find(
                                (c) => c.national_id === test.national_id
                              );
                              
                              // If still not found, try to get patient history and create a consultation object
                              if (!consultation && test.national_id) {
                                const historyResponse = await ApiService.getPatientConsultationHistory(
                                  undefined,
                                  test.national_id
                                );
                                if (historyResponse.success && historyResponse.data.latest_consultation) {
                                  // Use the latest consultation from history
                                  const latestConsultation = historyResponse.data.latest_consultation;
                                  consultation = {
                                    id: latestConsultation.id,
                                    consultation_number: latestConsultation.consultation_number,
                                    patient_name: test.patient_name,
                                    national_id: test.national_id,
                                    age: undefined,
                                    location: undefined,
                                    phone_number: undefined,
                                    is_first_visit: false
                                  };
                                }
                              }
                            }
                            
                            if (consultation) {
                              await handleSelectConsultation(consultation);
                              setTabValue(4); // Switch to Results from Lab tab
                              setSuccess(`Viewing results for ${test.patient_name}`);
                              setTimeout(() => setSuccess(''), 3000);
                            } else {
                              setError(`Patient ${test.patient_name} consultation not found. Please register them first.`);
                              setTimeout(() => setError(''), 5000);
                            }
                          } catch (err: any) {
                            console.error('Error selecting patient from lab result:', err);
                            setError('Failed to load patient information');
                            setTimeout(() => setError(''), 5000);
                          }
                        }}
                      >
                        <TableCell>
                          <Box>
                            <Typography variant="body2" fontWeight="medium">
                              {test.patient_name || 'Unknown'}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {test.national_id || 'N/A'}
                            </Typography>
                            {test.consultation_number && (
                              <Typography variant="caption" color="primary.main" sx={{ display: 'block', mt: 0.5 }}>
                                #{test.consultation_number}
                              </Typography>
                            )}
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" fontWeight="medium">
                            {test.test_name}
                          </Typography>
                          {test.test_type && (
                            <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                              {test.test_type}
                            </Typography>
                          )}
                          {test.test_result && (
                            <Typography 
                              variant="caption" 
                              sx={{ 
                                display: 'block', 
                                mt: 0.5,
                                color: 'success.main',
                                fontWeight: 'medium'
                              }}
                            >
                              ✓ Result available
                            </Typography>
                          )}
                        </TableCell>
                        <TableCell align="center">
                          <Chip
                            label={test.test_status === 'completed' ? 'Done' : test.test_status}
                            color={test.test_status === 'completed' ? 'success' : 'warning'}
                            size="small"
                          />
                          {test.doctor_viewed_at && (
                            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
                              Viewed
                            </Typography>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                {allLabResults.length > 10 && (
                  <Box sx={{ p: 1, textAlign: 'center', borderTop: 1, borderColor: 'divider' }}>
                    <Typography variant="caption" color="text.secondary">
                      Showing 10 of {allLabResults.length} results. Click to view patient details.
                    </Typography>
                  </Box>
                )}
              </TableContainer>
            )}
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
                  <Tab label="Results from Lab" />
                </Tabs>
              </Box>

              {/* Symptoms & Analysis Tab */}
              {tabValue === 0 && (
                <Box sx={{ mt: 3 }}>
                  {/* Patient History Prescription Card */}
                  {patientHistoryData?.prescriptions && patientHistoryData.prescriptions.length > 0 ? (
                    <Paper sx={{ p: 2, mb: 3, bgcolor: 'info.light', color: 'white' }}>
                      <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold' }}>
                        HISTORY PRESCRIPTION
                      </Typography>
                      <TableContainer>
                        <Table size="small" sx={{ bgcolor: 'transparent' }}>
                          <TableHead>
                            <TableRow>
                              <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Prescription #</TableCell>
                              <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Date</TableCell>
                              <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Medicines</TableCell>
                              <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Status</TableCell>
                              <TableCell sx={{ color: 'white', fontWeight: 'bold' }} align="center">Action</TableCell>
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            {patientHistoryData.prescriptions.slice(0, 5).map((prescription: any) => {
                              // Extract medicine names from items array
                              const medicineNames = prescription.items && Array.isArray(prescription.items)
                                ? prescription.items
                                    .map((item: any) => item.item_name || item.name || 'Unknown Medicine')
                                    .filter((name: string) => name !== 'Unknown Medicine')
                                    .join(', ')
                                : 'No medicines';
                              
                              return (
                                <TableRow key={prescription.id}>
                                  <TableCell sx={{ color: 'white' }}>
                                    {prescription.prescription_number || `PRES-${prescription.id}`}
                                  </TableCell>
                                  <TableCell sx={{ color: 'white' }}>
                                    {prescription.created_at 
                                      ? new Date(prescription.created_at).toLocaleDateString()
                                      : 'N/A'}
                                  </TableCell>
                                  <TableCell sx={{ color: 'white', maxWidth: 300 }}>
                                    <TextField
                                      multiline
                                      rows={2}
                                      value={medicineNames || 'No medicines'}
                                      InputProps={{
                                        readOnly: true,
                                        sx: {
                                          color: 'white',
                                          fontSize: '0.875rem',
                                          '& .MuiInputBase-input': {
                                            color: 'white',
                                            fontSize: '0.875rem',
                                            padding: '4px 8px',
                                          },
                                          '& fieldset': {
                                            borderColor: 'rgba(255, 255, 255, 0.3)',
                                          },
                                          '&:hover fieldset': {
                                            borderColor: 'rgba(255, 255, 255, 0.5)',
                                          },
                                        }
                                      }}
                                      sx={{
                                        width: '100%',
                                        '& .MuiInputBase-root': {
                                          backgroundColor: 'transparent',
                                        }
                                      }}
                                    />
                                  </TableCell>
                                  <TableCell sx={{ color: 'white' }}>
                                    <Chip
                                      label={prescription.status || 'pending'}
                                      size="small"
                                      sx={{ bgcolor: 'white', color: 'primary.main' }}
                                    />
                                  </TableCell>
                                  <TableCell sx={{ color: 'white' }} align="center">
                                    <Button
                                      size="small"
                                      variant="contained"
                                      onClick={() => {
                                        setSelectedPrescription(prescription);
                                        setPrescriptionModalOpen(true);
                                      }}
                                      sx={{
                                        bgcolor: 'white',
                                        color: 'primary.main',
                                        '&:hover': {
                                          bgcolor: 'grey.100',
                                        }
                                      }}
                                    >
                                      View
                                    </Button>
                                  </TableCell>
                                </TableRow>
                              );
                            })}
                          </TableBody>
                        </Table>
                      </TableContainer>
                    </Paper>
                  ) : patientHistoryData && (!patientHistoryData.prescriptions || patientHistoryData.prescriptions.length === 0) ? (
                    <Paper sx={{ p: 2, mb: 3, bgcolor: 'grey.100', border: '1px dashed', borderColor: 'grey.300' }}>
                      <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold', color: 'text.secondary' }}>
                        HISTORY PRESCRIPTION
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        No previous prescriptions found for this patient.
                      </Typography>
                    </Paper>
                  ) : null}
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
                  <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="h6">Lab Tests (Maximum 7 tests)</Typography>
                    <Button
                      variant="outlined"
                      onClick={handleAddLabTestRow}
                      disabled={labTestRows.length >= 7}
                      startIcon={<AddIcon />}
                    >
                      Add Test Row
                    </Button>
                  </Box>

                  {labTestRows.length === 0 ? (
                    <Box sx={{ textAlign: 'center', py: 4, border: '2px dashed', borderColor: 'divider', borderRadius: 2 }}>
                      <Typography color="text.secondary" gutterBottom>
                        No lab tests added yet
                      </Typography>
                      <Button
                        variant="outlined"
                        onClick={handleAddLabTestRow}
                        startIcon={<AddIcon />}
                        sx={{ mt: 2 }}
                      >
                        Add First Test
                      </Button>
                    </Box>
                  ) : (
                    <>
                      <TableContainer component={Paper} sx={{ mb: 2 }}>
                        <Table size="small">
                          <TableHead>
                            <TableRow>
                              <TableCell width="25%">Test Name *</TableCell>
                              <TableCell width="20%">Test Type</TableCell>
                              <TableCell width="15%">Category</TableCell>
                              <TableCell width="20%">Others</TableCell>
                              <TableCell width="15%">Price (KES)</TableCell>
                              <TableCell width="5%" align="center">Action</TableCell>
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            {labTestRows.map((row, index) => (
                              <TableRow key={index}>
                                <TableCell>
                                  <TextField
                                    fullWidth
                                    size="small"
                                    value={row.test_name}
                                    onChange={(e) => handleUpdateLabTestRow(index, 'test_name', e.target.value)}
                                    placeholder="e.g., Blood Test"
                                    required
                                  />
                                </TableCell>
                                <TableCell>
                                  <TextField
                                    fullWidth
                                    size="small"
                                    value={row.test_type}
                                    onChange={(e) => handleUpdateLabTestRow(index, 'test_type', e.target.value)}
                                    placeholder="e.g., CBC"
                                  />
                                </TableCell>
                                <TableCell>
                                  <TextField
                                    fullWidth
                                    size="small"
                                    value={row.category}
                                    onChange={(e) => handleUpdateLabTestRow(index, 'category', e.target.value)}
                                    placeholder="e.g., Hematology"
                                  />
                                </TableCell>
                                <TableCell>
                                  <TextField
                                    fullWidth
                                    size="small"
                                    value={row.others}
                                    onChange={(e) => handleUpdateLabTestRow(index, 'others', e.target.value)}
                                    placeholder="Additional notes"
                                  />
                                </TableCell>
                                <TableCell>
                                  <TextField
                                    fullWidth
                                    size="small"
                                    type="number"
                                    value={row.price}
                                    onChange={(e) => handleUpdateLabTestRow(index, 'price', parseFloat(e.target.value) || 0)}
                                    inputProps={{ min: 0, step: 0.01 }}
                                  />
                                </TableCell>
                                <TableCell align="center">
                                  <IconButton
                                    size="small"
                                    onClick={() => handleRemoveLabTestRow(index)}
                                    color="error"
                                  >
                                    <CloseIcon />
                                  </IconButton>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </TableContainer>

                      <Box sx={{ mb: 2, p: 2, bgcolor: 'grey.100', borderRadius: 1 }}>
                        <Typography variant="h6" gutterBottom>
                          Total: KES {labTestRows.reduce((sum, row) => sum + (parseFloat(row.price.toString()) || 0), 0).toFixed(2)}
                        </Typography>
                      </Box>

                      <Button
                        variant="contained"
                        onClick={handleRequestLabTest}
                        disabled={loading || !doctorVisit || labTestRows.length === 0}
                        startIcon={<LabIcon />}
                        fullWidth
                        size="large"
                      >
                        {loading ? 'Requesting...' : 'Request Lab Tests'}
                      </Button>
                    </>
                  )}

                  {labTests.length > 0 && (
                    <Box sx={{ mt: 3 }}>
                      <Typography variant="subtitle2" gutterBottom>
                        Previously Requested Tests:
                      </Typography>
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                        {labTests.map((test) => (
                          <Chip
                            key={test.id}
                            label={`${test.test_name}${test.test_type ? ` (${test.test_type})` : ''} - KES ${(test as any).price || 0}`}
                            sx={{ mb: 1 }}
                          />
                        ))}
                      </Box>
                    </Box>
                  )}
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

              {/* Lab Results Tab - Current Patient */}
              {tabValue === 3 && (
                <Box sx={{ mt: 3 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Typography variant="subtitle1">
                      Lab Test Results - Current Patient
                    </Typography>
                    <Button
                      variant="contained"
                      onClick={() => {
                        if (labTestResults.length > 0) {
                          setSelectedLabResult(labTestResults[0]);
                          setLabResultModalOpen(true);
                        }
                      }}
                      disabled={labTestResults.length === 0}
                    >
                      View Results
                    </Button>
                  </Box>
                  {labTestResults.length === 0 ? (
                    <Typography color="text.secondary">No lab test results available for this patient</Typography>
                  ) : (
                    <TableContainer>
                      <Table size="small">
                        <TableHead>
                          <TableRow>
                            <TableCell>Test Name</TableCell>
                            <TableCell>Type</TableCell>
                            <TableCell>Status</TableCell>
                            <TableCell>Completed At</TableCell>
                            <TableCell>Action</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {labTestResults.map((test) => (
                            <TableRow key={test.id}>
                              <TableCell>{test.test_name}</TableCell>
                              <TableCell>{test.test_type || 'N/A'}</TableCell>
                              <TableCell>
                                <Chip
                                  label={test.test_status}
                                  color={test.test_status === 'completed' ? 'success' : 'default'}
                                  size="small"
                                />
                              </TableCell>
                              <TableCell>
                                {test.test_completed_at 
                                  ? new Date(test.test_completed_at).toLocaleString()
                                  : 'N/A'}
                              </TableCell>
                              <TableCell>
                                <Button
                                  size="small"
                                  variant="outlined"
                                  onClick={() => {
                                    setSelectedLabResult(test);
                                    setLabResultModalOpen(true);
                                  }}
                                >
                                  View Details
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  )}
                </Box>
              )}

              {/* Results from Lab Tab - All Completed Results */}
              {tabValue === 4 && (
                <Box sx={{ mt: 3 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Typography variant="subtitle1">
                      All Lab Results from Lab
                    </Typography>
                    <Button
                      variant="outlined"
                      size="small"
                      onClick={loadAllLabResults}
                      startIcon={<RefreshIcon />}
                    >
                      Refresh
                    </Button>
                  </Box>
                  {allLabResults.length === 0 ? (
                    <Typography color="text.secondary">No completed lab test results available</Typography>
                  ) : (
                    <TableContainer>
                      <Table size="small">
                        <TableHead>
                          <TableRow>
                            <TableCell>Patient</TableCell>
                            <TableCell>Test Name</TableCell>
                            <TableCell>Type</TableCell>
                            <TableCell>Result</TableCell>
                            <TableCell>Completed At</TableCell>
                            <TableCell>Action</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {allLabResults.map((test: any) => (
                            <TableRow key={test.id} hover>
                              <TableCell>
                                <Box>
                                  <Typography variant="body2" fontWeight="medium">
                                    {test.patient_name}
                                  </Typography>
                                  <Typography variant="caption" color="text.secondary">
                                    {test.national_id || 'N/A'}
                                  </Typography>
                                </Box>
                              </TableCell>
                              <TableCell>{test.test_name}</TableCell>
                              <TableCell>{test.test_type || 'N/A'}</TableCell>
                              <TableCell>
                                <Box sx={{ maxWidth: 300, wordBreak: 'break-word' }}>
                                  {test.test_result || 'N/A'}
                                </Box>
                              </TableCell>
                              <TableCell>
                                {test.test_completed_at 
                                  ? new Date(test.test_completed_at).toLocaleString()
                                  : 'N/A'}
                              </TableCell>
                              <TableCell>
                                <Button
                                  size="small"
                                  variant="outlined"
                                  onClick={() => handleMarkResultViewed(test.id)}
                                  disabled={test.doctor_viewed_at}
                                >
                                  {test.doctor_viewed_at ? 'Viewed' : 'Mark as Used'}
                                </Button>
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
            <Box>
              <Paper sx={{ p: 3, textAlign: 'center', mb: 3 }}>
                <Typography color="text.secondary">
                  Please select a patient from the list to begin consultation
                </Typography>
              </Paper>

              {/* Results from Lab Card - Always Visible */}
              <Paper sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Typography variant="h6" gutterBottom>
                    Results from Lab
                  </Typography>
                  <Button
                    variant="outlined"
                    size="small"
                    onClick={loadAllLabResults}
                    startIcon={<RefreshIcon />}
                  >
                    Refresh
                  </Button>
                </Box>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  All lab test results submitted by lab technicians, linked to patients
                </Typography>
                {allLabResults.length === 0 ? (
                  <Box sx={{ textAlign: 'center', py: 4 }}>
                    <LabIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
                    <Typography color="text.secondary">
                      No completed lab test results available
                    </Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                      Results will appear here once lab technicians submit them
                    </Typography>
                  </Box>
                ) : (
                  <TableContainer sx={{ maxHeight: 600 }}>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell><strong>Patient</strong></TableCell>
                          <TableCell><strong>Consultation #</strong></TableCell>
                          <TableCell><strong>Test Name</strong></TableCell>
                          <TableCell><strong>Type</strong></TableCell>
                          <TableCell><strong>Result</strong></TableCell>
                          <TableCell><strong>Completed At</strong></TableCell>
                          <TableCell align="center"><strong>Status</strong></TableCell>
                          <TableCell align="center"><strong>Action</strong></TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {allLabResults.map((test: any) => (
                          <TableRow 
                            key={test.id} 
                            hover
                            sx={{ 
                              cursor: 'pointer',
                              '&:hover': { backgroundColor: 'action.hover' }
                            }}
                            onClick={() => {
                              // Try to find and select the patient's consultation
                              const consultation = pendingConsultations.find(
                                (c) => c.national_id === test.national_id
                              );
                              if (consultation) {
                                handleSelectConsultation(consultation);
                                setTabValue(4); // Switch to Results from Lab tab
                              }
                            }}
                          >
                            <TableCell>
                              <Box>
                                <Typography variant="body2" fontWeight="medium">
                                  {test.patient_name || 'Unknown'}
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                  ID: {test.national_id || 'N/A'}
                                </Typography>
                              </Box>
                            </TableCell>
                            <TableCell>
                              <Typography variant="body2">
                                {test.consultation_number || 'N/A'}
                              </Typography>
                            </TableCell>
                            <TableCell>
                              <Typography variant="body2" fontWeight="medium">
                                {test.test_name}
                              </Typography>
                            </TableCell>
                            <TableCell>
                              <Typography variant="body2">
                                {test.test_type || 'N/A'}
                              </Typography>
                            </TableCell>
                            <TableCell>
                              <Box sx={{ maxWidth: 250, wordBreak: 'break-word' }}>
                                <Typography variant="body2">
                                  {test.test_result ? (
                                    <Box
                                      sx={{
                                        p: 1,
                                        bgcolor: 'success.light',
                                        borderRadius: 1,
                                        color: 'success.dark',
                                      }}
                                    >
                                      {test.test_result}
                                    </Box>
                                  ) : (
                                    <Typography color="text.secondary">Pending</Typography>
                                  )}
                                </Typography>
                              </Box>
                            </TableCell>
                            <TableCell>
                              <Typography variant="body2">
                                {test.test_completed_at 
                                  ? new Date(test.test_completed_at).toLocaleString()
                                  : 'N/A'}
                              </Typography>
                            </TableCell>
                            <TableCell align="center">
                              <Chip
                                label={test.test_status.toUpperCase()}
                                color={test.test_status === 'completed' ? 'success' : 'warning'}
                                size="small"
                              />
                            </TableCell>
                            <TableCell align="center">
                              {test.doctor_viewed_at ? (
                                <Button
                                  size="small"
                                  variant="outlined"
                                  disabled
                                >
                                  Viewed
                                </Button>
                              ) : (
                                <Button
                                  size="small"
                                  variant="contained"
                                  color="primary"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleMarkResultViewed(test.id);
                                  }}
                                >
                                  Mark as Used
                                </Button>
                              )}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                )}
              </Paper>
            </Box>
          )}
        </Box>
      </Box>

      {/* Lab Result Modal - Vertical Layout */}
      <Dialog 
        open={labResultModalOpen} 
        onClose={() => setLabResultModalOpen(false)} 
        maxWidth="md" 
        fullWidth
        PaperProps={{
          sx: { maxHeight: '90vh' }
        }}
      >
        <DialogTitle sx={{ backgroundColor: '#1976d2', color: 'white', fontWeight: 'bold' }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6">
              Lab Test Result - {selectedLabResult?.test_name}
            </Typography>
            <IconButton onClick={() => setLabResultModalOpen(false)} sx={{ color: 'white' }}>
              ×
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent sx={{ pt: 3 }}>
          {selectedLabResult && (
            <Box>
              <Box sx={{ mb: 3 }}>
                <Typography variant="subtitle2" color="text.secondary">Patient:</Typography>
                <Typography variant="body1" fontWeight="medium">
                  {selectedLabResult.patient_name} ({selectedLabResult.national_id || 'N/A'})
                </Typography>
              </Box>
              
              <Box sx={{ mb: 3 }}>
                <Typography variant="subtitle2" color="text.secondary">Test Type:</Typography>
                <Typography variant="body1">{selectedLabResult.test_type || 'N/A'}</Typography>
              </Box>

              <Box sx={{ mb: 3 }}>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  Test Result:
                </Typography>
                <TextField
                  fullWidth
                  multiline
                  rows={15}
                  value={selectedLabResult.test_result || 'No result available'}
                  InputProps={{
                    readOnly: true,
                  }}
                  sx={{
                    '& .MuiInputBase-input': {
                      fontSize: '14px',
                      fontFamily: 'monospace',
                    }
                  }}
                />
              </Box>

              {selectedLabResult.attachment_url && (
                <Box sx={{ mb: 3 }}>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    Attachment:
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Typography variant="body2">{selectedLabResult.attachment_filename || 'File'}</Typography>
                    <Button
                      variant="outlined"
                      size="small"
                      onClick={() => {
                        if (selectedLabResult.attachment_url) {
                          window.open(selectedLabResult.attachment_url, '_blank');
                        }
                      }}
                    >
                      View File
                    </Button>
                  </Box>
                </Box>
              )}

              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle2" color="text.secondary">Completed At:</Typography>
                <Typography variant="body2">
                  {selectedLabResult.test_completed_at 
                    ? new Date(selectedLabResult.test_completed_at).toLocaleString()
                    : 'N/A'}
                </Typography>
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setLabResultModalOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Prescription Details Modal - Vertical Layout */}
      <Dialog 
        open={prescriptionModalOpen} 
        onClose={() => setPrescriptionModalOpen(false)} 
        maxWidth="md" 
        fullWidth
        PaperProps={{
          sx: { maxHeight: '90vh' }
        }}
      >
        <DialogTitle sx={{ backgroundColor: '#1976d2', color: 'white', fontWeight: 'bold' }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6">
              Prescription Details - {selectedPrescription?.prescription_number || 'N/A'}
            </Typography>
            <IconButton onClick={() => setPrescriptionModalOpen(false)} sx={{ color: 'white' }}>
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent sx={{ pt: 3 }}>
          {selectedPrescription && (
            <Box>
              {/* Prescription Information */}
              <Box sx={{ mb: 3 }}>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  Prescription Number:
                </Typography>
                <Typography variant="body1" fontWeight="medium">
                  {selectedPrescription.prescription_number || `PRES-${selectedPrescription.id}`}
                </Typography>
              </Box>

              <Box sx={{ mb: 3 }}>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  Date:
                </Typography>
                <Typography variant="body1">
                  {selectedPrescription.created_at 
                    ? new Date(selectedPrescription.created_at).toLocaleString()
                    : 'N/A'}
                </Typography>
              </Box>

              <Box sx={{ mb: 3 }}>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  Status:
                </Typography>
                <Chip
                  label={selectedPrescription.status || 'pending'}
                  color={
                    selectedPrescription.status === 'fulfilled' ? 'success' :
                    selectedPrescription.status === 'partially_fulfilled' ? 'warning' :
                    selectedPrescription.status === 'cancelled' ? 'error' : 'default'
                  }
                  sx={{ mb: 1 }}
                />
              </Box>

              {/* Consultation Information */}
              {selectedPrescription.consultation_number && (
                <Box sx={{ mb: 3 }}>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    Consultation Number:
                  </Typography>
                  <Typography variant="body1">
                    {selectedPrescription.consultation_number}
                  </Typography>
                </Box>
              )}

              {/* Medicines List */}
              <Box sx={{ mb: 3 }}>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  Medicines Prescribed:
                </Typography>
                {selectedPrescription.items && Array.isArray(selectedPrescription.items) && selectedPrescription.items.length > 0 ? (
                  <TableContainer sx={{ maxHeight: 300, border: 1, borderColor: 'divider', borderRadius: 1 }}>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell><strong>Medicine Name</strong></TableCell>
                          <TableCell align="right"><strong>Quantity Prescribed</strong></TableCell>
                          <TableCell align="right"><strong>Quantity Fulfilled</strong></TableCell>
                          <TableCell align="right"><strong>Unit Price</strong></TableCell>
                          <TableCell align="right"><strong>Total Price</strong></TableCell>
                          <TableCell align="center"><strong>Status</strong></TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {selectedPrescription.items.map((item: any, index: number) => {
                          const itemTotal = (item.quantity_prescribed || 0) * (item.unit_price || 0);
                          return (
                            <TableRow key={item.id || index}>
                              <TableCell>{item.item_name || item.name || 'Unknown Medicine'}</TableCell>
                              <TableCell align="right">{item.quantity_prescribed || 0}</TableCell>
                              <TableCell align="right">{item.quantity_fulfilled || 0}</TableCell>
                              <TableCell align="right">KES {(item.unit_price || 0).toFixed(2)}</TableCell>
                              <TableCell align="right">KES {itemTotal.toFixed(2)}</TableCell>
                              <TableCell align="center">
                                <Chip
                                  label={item.is_available ? 'Available' : 'Missing'}
                                  color={item.is_available ? 'success' : 'error'}
                                  size="small"
                                />
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </TableContainer>
                ) : (
                  <Typography variant="body2" color="text.secondary">
                    No medicines found for this prescription.
                  </Typography>
                )}
              </Box>

              {/* Medicines Summary (Textarea) */}
              <Box sx={{ mb: 3 }}>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  Medicines Summary:
                </Typography>
                <TextField
                  fullWidth
                  multiline
                  rows={4}
                  value={
                    selectedPrescription.items && Array.isArray(selectedPrescription.items)
                      ? selectedPrescription.items
                          .map((item: any) => {
                            const name = item.item_name || item.name || 'Unknown Medicine';
                            const qty = item.quantity_prescribed || 0;
                            return `${name} (Qty: ${qty})`;
                          })
                          .join('\n')
                      : 'No medicines'
                  }
                  InputProps={{
                    readOnly: true,
                  }}
                  sx={{
                    '& .MuiInputBase-input': {
                      fontSize: '0.875rem',
                      fontFamily: 'monospace',
                    }
                  }}
                />
              </Box>

              {/* Total Amount */}
              {selectedPrescription.total_amount && (
                <Box sx={{ mb: 2 }}>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    Total Amount:
                  </Typography>
                  <Typography variant="h6" color="primary.main" fontWeight="bold">
                    KES {Number(selectedPrescription.total_amount).toFixed(2)}
                  </Typography>
                </Box>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPrescriptionModalOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default DoctorScreen;