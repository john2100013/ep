import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Typography,
  TextField,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Card,
  CardContent,
  Alert,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Autocomplete,
  Tooltip,
} from '@mui/material';
import {
  Add as AddIcon,
  CheckCircle as CompleteIcon,
  Search as SearchIcon,
  AddCircle as AddServiceIcon,
} from '@mui/icons-material';
import { ServiceBillingAPI } from '../../services/serviceBillingApi';

const AssignmentTab: React.FC = () => {
  const [assignments, setAssignments] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [services, setServices] = useState<any[]>([]);
  const [bookings, setBookings] = useState<any[]>([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [openAddServiceDialog, setOpenAddServiceDialog] = useState(false);
  const [selectedAssignment, setSelectedAssignment] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  
  const [formData, setFormData] = useState({
    customer_id: '',
    employee_id: '',
    service_id: '',
    booking_id: '',
    notes: '',
  });

  const [addServiceForm, setAddServiceForm] = useState({
    service_id: '',
    employee_id: '',
    notes: '',
  });

  useEffect(() => {
    loadData();
  }, [filterStatus]);

  const loadData = async () => {
    try {
      const [assignmentsRes, customersRes, employeesRes, servicesRes, bookingsRes] = await Promise.all([
        ServiceBillingAPI.getAssignments(filterStatus ? { status: filterStatus } : undefined),
        ServiceBillingAPI.getCustomers(),
        ServiceBillingAPI.getEmployees(),
        ServiceBillingAPI.getServices(),
        ServiceBillingAPI.getBookings()
      ]);
      
      setAssignments(assignmentsRes.data.data.assignments);
      setCustomers(customersRes.data.data.customers);
      setEmployees(employeesRes.data.data.employees);
      setServices(servicesRes.data.data.services);
      setBookings(bookingsRes.data.data.bookings);
    } catch (err) {
      console.error('Failed to load data:', err);
    }
  };

  const handleCreateAssignment = async () => {
    if (!formData.customer_id || !formData.employee_id || !formData.service_id) {
      setError('Customer, Employee, and Service are required');
      return;
    }

    try {
      setLoading(true);
      setError('');
      
      await ServiceBillingAPI.createAssignment({
        customer_id: parseInt(formData.customer_id),
        employee_id: parseInt(formData.employee_id),
        service_id: parseInt(formData.service_id),
        booking_id: formData.booking_id ? parseInt(formData.booking_id) : undefined,
        notes: formData.notes
      });
      
      setSuccess('Customer assigned to employee successfully!');
      loadData();
      setOpenDialog(false);
      setFormData({
        customer_id: '',
        employee_id: '',
        service_id: '',
        booking_id: '',
        notes: '',
      });
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create assignment');
    } finally {
      setLoading(false);
    }
  };

  const handleCompleteAssignment = async (assignmentId: number) => {
    try {
      setLoading(true);
      await ServiceBillingAPI.completeAssignment(assignmentId);
      setSuccess('Service marked as completed!');
      loadData();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to complete assignment');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenAddService = (assignment: any) => {
    setSelectedAssignment(assignment);
    setAddServiceForm({
      service_id: '',
      employee_id: assignment.employee_id.toString(),
      notes: '',
    });
    setOpenAddServiceDialog(true);
  };

  const handleAddService = async () => {
    if (!addServiceForm.service_id || !addServiceForm.employee_id) {
      setError('Service and Employee are required');
      return;
    }

    try {
      setLoading(true);
      setError('');
      
      await ServiceBillingAPI.createAssignment({
        customer_id: selectedAssignment.customer_id,
        employee_id: parseInt(addServiceForm.employee_id),
        service_id: parseInt(addServiceForm.service_id),
        notes: addServiceForm.notes || `Additional service requested during ${selectedAssignment.service_name}`
      });
      
      setSuccess(`Additional service added for ${selectedAssignment.customer_name}!`);
      loadData();
      setOpenAddServiceDialog(false);
      setAddServiceForm({ service_id: '', employee_id: '', notes: '' });
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to add service');
    } finally {
      setLoading(false);
    }
  };

  const getStatusChip = (status: string) => {
    const statusConfig: any = {
      in_progress: { label: 'In Progress', color: 'warning' },
      completed: { label: 'Completed', color: 'success' },
      billed: { label: 'Billed', color: 'default' },
    };
    
    const config = statusConfig[status] || { label: status, color: 'default' };
    return <Chip label={config.label} color={config.color} size="small" />;
  };

  const getDurationStatus = (assignment: any) => {
    if (assignment.status !== 'in_progress') return null;
    
    const startTime = new Date(assignment.start_time);
    const now = new Date();
    const elapsedMinutes = (now.getTime() - startTime.getTime()) / 60000;
    const exceeded = elapsedMinutes > assignment.estimated_duration;
    
    return exceeded ? (
      <Chip label={`Overdue (${Math.round(elapsedMinutes)}min)`} color="error" size="small" />
    ) : (
      <Chip label={`${Math.round(elapsedMinutes)}/${assignment.estimated_duration}min`} color="info" size="small" />
    );
  };

  // Get pending bookings (bookings not yet assigned)
  const getPendingBookings = () => {
    const assignedBookingIds = new Set(
      assignments
        .filter(a => a.booking_id)
        .map(a => a.booking_id)
    );
    
    return bookings.filter(b => !assignedBookingIds.has(b.id) && b.status === 'pending');
  };

  return (
    <Box sx={{ p: 2 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h6">Customer Assignments</Typography>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <FormControl size="small" sx={{ minWidth: 150 }}>
            <InputLabel>Filter Status</InputLabel>
            <Select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              label="Filter Status"
            >
              <MenuItem value="">All</MenuItem>
              <MenuItem value="in_progress">In Progress</MenuItem>
              <MenuItem value="completed">Completed</MenuItem>
              <MenuItem value="billed">Billed</MenuItem>
            </Select>
          </FormControl>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setOpenDialog(true)}
            sx={{ backgroundColor: '#673ab7' }}
          >
            Assign Customer
          </Button>
        </Box>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>{error}</Alert>}
      {success && <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess('')}>{success}</Alert>}

      {/* Pending Bookings Alert */}
      {getPendingBookings().length > 0 && (
        <Alert severity="info" sx={{ mb: 2 }}>
          <Typography variant="body2" fontWeight="bold">
            {getPendingBookings().length} pending booking(s) waiting for assignment
          </Typography>
        </Alert>
      )}

      <TableContainer component={Card}>
        <Table>
          <TableHead sx={{ backgroundColor: '#f5f5f5' }}>
            <TableRow>
              <TableCell><strong>Date</strong></TableCell>
              <TableCell><strong>Customer</strong></TableCell>
              <TableCell><strong>Employee</strong></TableCell>
              <TableCell><strong>Service</strong></TableCell>
              <TableCell><strong>Duration</strong></TableCell>
              <TableCell><strong>Status</strong></TableCell>
              <TableCell><strong>Source</strong></TableCell>
              <TableCell align="center"><strong>Actions</strong></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {assignments.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} align="center">
                  No assignments found. Start by assigning customers to employees.
                </TableCell>
              </TableRow>
            ) : (
              assignments.map((assignment) => (
                <TableRow key={assignment.id} hover>
                  <TableCell>
                    {new Date(assignment.start_time).toLocaleDateString()}
                    <br />
                    <Typography variant="caption" color="text.secondary">
                      {new Date(assignment.start_time).toLocaleTimeString()}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    {assignment.customer_name}
                    <br />
                    <Typography variant="caption" color="text.secondary">
                      {assignment.customer_phone}
                    </Typography>
                  </TableCell>
                  <TableCell>{assignment.employee_name}</TableCell>
                  <TableCell>{assignment.service_name}</TableCell>
                  <TableCell>
                    {getDurationStatus(assignment)}
                    {assignment.end_time && (
                      <Typography variant="caption" color="text.secondary" display="block">
                        Ended: {new Date(assignment.end_time).toLocaleTimeString()}
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell>{getStatusChip(assignment.status)}</TableCell>
                  <TableCell>
                    {assignment.booking_id ? (
                      <Chip label="Booking" color="primary" size="small" variant="outlined" />
                    ) : (
                      <Chip label="Walk-in" color="secondary" size="small" variant="outlined" />
                    )}
                  </TableCell>
                  <TableCell align="center">
                    <Box sx={{ display: 'flex', gap: 0.5, justifyContent: 'center' }}>
                      {assignment.status === 'in_progress' && (
                        <Tooltip title="Mark as completed">
                          <IconButton
                            color="success"
                            size="small"
                            onClick={() => handleCompleteAssignment(assignment.id)}
                            disabled={loading}
                          >
                            <CompleteIcon />
                          </IconButton>
                        </Tooltip>
                      )}
                      {assignment.status !== 'billed' && (
                        <Tooltip title="Add another service">
                          <IconButton
                            color="primary"
                            size="small"
                            onClick={() => handleOpenAddService(assignment)}
                          >
                            <AddServiceIcon />
                          </IconButton>
                        </Tooltip>
                      )}
                    </Box>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Assignment Dialog */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Assign Customer to Employee</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
            <FormControl fullWidth>
              <InputLabel>Select Customer *</InputLabel>
              <Select
                value={formData.customer_id}
                onChange={(e) => setFormData({ ...formData, customer_id: e.target.value })}
                label="Select Customer *"
              >
                {customers.map((customer) => (
                  <MenuItem key={customer.id} value={customer.id}>
                    {customer.name} - {customer.phone}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl fullWidth>
              <InputLabel>Select Employee *</InputLabel>
              <Select
                value={formData.employee_id}
                onChange={(e) => setFormData({ ...formData, employee_id: e.target.value })}
                label="Select Employee *"
              >
                {employees.map((employee) => (
                  <MenuItem key={employee.id} value={employee.id}>
                    {employee.name} {employee.position && `- ${employee.position}`}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl fullWidth>
              <InputLabel>Select Service *</InputLabel>
              <Select
                value={formData.service_id}
                onChange={(e) => setFormData({ ...formData, service_id: e.target.value })}
                label="Select Service *"
              >
                {services.map((service) => (
                  <MenuItem key={service.id} value={service.id}>
                    {service.service_name} - ${Number(service.price).toFixed(2)} ({service.estimated_duration}min)
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl fullWidth>
              <InputLabel>From Booking (Optional)</InputLabel>
              <Select
                value={formData.booking_id}
                onChange={(e) => setFormData({ ...formData, booking_id: e.target.value })}
                label="From Booking (Optional)"
              >
                <MenuItem value="">None (Walk-in)</MenuItem>
                {getPendingBookings().map((booking) => (
                  <MenuItem key={booking.id} value={booking.id}>
                    {booking.customer_name} - {booking.booking_date} {booking.booking_time}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <TextField
              fullWidth
              label="Notes"
              multiline
              rows={3}
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>Cancel</Button>
          <Button
            onClick={handleCreateAssignment}
            variant="contained"
            disabled={loading}
            sx={{ backgroundColor: '#673ab7' }}
          >
            Assign Customer
          </Button>
        </DialogActions>
      </Dialog>

      {/* Add Service Dialog */}
      <Dialog open={openAddServiceDialog} onClose={() => setOpenAddServiceDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Add Another Service</DialogTitle>
        <DialogContent>
          {selectedAssignment && (
            <Box sx={{ mb: 2, p: 2, backgroundColor: '#f5f5f5', borderRadius: 1 }}>
              <Typography variant="body2" gutterBottom>
                <strong>Customer:</strong> {selectedAssignment.customer_name}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Currently receiving: {selectedAssignment.service_name} from {selectedAssignment.employee_name}
              </Typography>
            </Box>
          )}
          
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
            <FormControl fullWidth>
              <InputLabel>Select Additional Service *</InputLabel>
              <Select
                value={addServiceForm.service_id}
                onChange={(e) => setAddServiceForm({ ...addServiceForm, service_id: e.target.value })}
                label="Select Additional Service *"
              >
                {services.map((service) => (
                  <MenuItem key={service.id} value={service.id}>
                    {service.service_name} - ${Number(service.price).toFixed(2)} ({service.estimated_duration}min)
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl fullWidth>
              <InputLabel>Assign to Employee *</InputLabel>
              <Select
                value={addServiceForm.employee_id}
                onChange={(e) => setAddServiceForm({ ...addServiceForm, employee_id: e.target.value })}
                label="Assign to Employee *"
              >
                {employees.map((employee) => (
                  <MenuItem key={employee.id} value={employee.id}>
                    {employee.name} {employee.position && `- ${employee.position}`}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <TextField
              fullWidth
              label="Notes"
              multiline
              rows={2}
              value={addServiceForm.notes}
              onChange={(e) => setAddServiceForm({ ...addServiceForm, notes: e.target.value })}
              placeholder="e.g., Customer requested massage during waxing session"
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenAddServiceDialog(false)}>Cancel</Button>
          <Button
            onClick={handleAddService}
            variant="contained"
            disabled={loading}
            sx={{ backgroundColor: '#4caf50' }}
          >
            Add Service
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default AssignmentTab;
