import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
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
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Alert,
  IconButton,
  ToggleButton,
  ToggleButtonGroup,
} from '@mui/material';
import { Add, Edit } from '@mui/icons-material';
import * as salonApi from '../../services/salonApi';
import type { SalonUser } from '../../types';

interface AvailableUser {
  id: number;
  name: string;
  email: string;
}

const SalonEmployees: React.FC = () => {
  const [employees, setEmployees] = useState<SalonUser[]>([]);
  const [availableUsers, setAvailableUsers] = useState<AvailableUser[]>([]);
  const [showDialog, setShowDialog] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<SalonUser | null>(null);
  const [userMode, setUserMode] = useState<'new' | 'existing'>('new');
  
  const [formData, setFormData] = useState({
    user_id: '',
    first_name: '',
    last_name: '',
    email: '',
    role: 'employee' as 'admin' | 'cashier' | 'employee',
    commission_rate: '50',
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    loadEmployees();
    loadAvailableUsers();
  }, []);

  const loadEmployees = async () => {
    try {
      console.log('🔄 Loading salon employees...');
      const response = await salonApi.getSalonUsers();
      console.log('📥 Response:', response.data);
      
      // Handle both response formats: { success: true, data: [...] } or direct array
      let employeesData: SalonUser[] = [];
      
      if (Array.isArray(response.data)) {
        // Direct array response (what we're actually receiving)
        employeesData = response.data;
      } else if (response.data?.success && Array.isArray(response.data.data)) {
        // Wrapped response with success flag
        employeesData = response.data.data;
      } else if (response.data?.data && Array.isArray(response.data.data)) {
        // Response with data property
        employeesData = response.data.data;
      } else {
        console.error('❌ Unexpected response format:', response.data);
        setError('Unexpected response format from server');
        return;
      }
      
      console.log('✅ Employees loaded:', employeesData.length, 'employees');
      setEmployees(employeesData);
    } catch (err: any) {
      console.error('❌ Error loading employees:', err);
      console.error('Error details:', err.response?.data);
      setError(err.response?.data?.message || 'Failed to load employees');
    }
  };

  const loadAvailableUsers = async () => {
    try {
      const response = await salonApi.getAvailableUsers();
      if (response.data.success) {
        setAvailableUsers(response.data.data);
      }
    } catch (err: any) {
      console.error('Error loading available users:', err);
    }
  };

  const handleSubmit = async () => {
    try {
      setLoading(true);
      setError('');

      if (editingEmployee) {
        await salonApi.updateSalonUser(editingEmployee.id, {
          role: formData.role,
          commission_rate: parseFloat(formData.commission_rate),
          is_active: true,
        });
        setSuccess('Employee updated successfully');
      } else {
        const payload: any = {
          role: formData.role,
          commission_rate: parseFloat(formData.commission_rate),
        };

        if (userMode === 'existing') {
          if (!formData.user_id) {
            setError('Please select a user');
            setLoading(false);
            return;
          }
          payload.user_id = formData.user_id;
        } else {
          if (!formData.first_name || !formData.last_name) {
            setError('Please enter first name and last name');
            setLoading(false);
            return;
          }
          payload.first_name = formData.first_name;
          payload.last_name = formData.last_name;
          if (formData.email) {
            payload.email = formData.email;
          }
        }

        await salonApi.createSalonUser(payload);
        setSuccess('Employee added successfully');
      }

      setShowDialog(false);
      setEditingEmployee(null);
      setUserMode('new');
      setFormData({ user_id: '', first_name: '', last_name: '', email: '', role: 'employee', commission_rate: '50' });
      loadEmployees();
      loadAvailableUsers();

      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      console.error('Error saving employee:', err);
      setError(err.response?.data?.message || 'Failed to save employee');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (employee: SalonUser) => {
    setEditingEmployee(employee);
    setUserMode('existing');
    setFormData({
      user_id: employee.user_id.toString(),
      first_name: '',
      last_name: '',
      email: '',
      role: employee.role,
      commission_rate: employee.commission_rate.toString(),
    });
    setShowDialog(true);
  };

  const handleDialogClose = () => {
    setShowDialog(false);
    setEditingEmployee(null);
    setUserMode('new');
    setFormData({ user_id: '', first_name: '', last_name: '', email: '', role: 'employee', commission_rate: '50' });
    setError('');
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin': return 'error';
      case 'cashier': return 'warning';
      case 'employee': return 'success';
      default: return 'default';
    }
  };

  return (
    <Box sx={{ p: 3, width: '100%', minHeight: 'calc(100vh - 100px)' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" fontWeight="bold">
          Salon Users
        </Typography>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => {
            setEditingEmployee(null);
            setUserMode('new');
            setFormData({ user_id: '', first_name: '', last_name: '', email: '', role: 'employee', commission_rate: '50' });
            setShowDialog(true);
          }}
        >
          Add User
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

      <Card>
        <CardContent>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell><strong>Name</strong></TableCell>
                  <TableCell><strong>Email</strong></TableCell>
                  <TableCell><strong>Phone</strong></TableCell>
                  <TableCell><strong>Role</strong></TableCell>
                  <TableCell align="center"><strong>Commission %</strong></TableCell>
                  <TableCell align="center"><strong>Status</strong></TableCell>
                  <TableCell align="center"><strong>Actions</strong></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {employees.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
                      <Typography color="text.secondary">
                        No salon users found. Click "Add User" to create one.
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  employees.map((employee) => (
                  <TableRow key={employee.id}>
                      <TableCell>{employee.name || 'N/A'}</TableCell>
                      <TableCell>{employee.email || 'N/A'}</TableCell>
                      <TableCell>{employee.phone_number || '-'}</TableCell>
                    <TableCell>
                      <Chip 
                          label={employee.role?.toUpperCase() || 'N/A'} 
                        size="small" 
                        color={getRoleColor(employee.role)}
                      />
                    </TableCell>
                      <TableCell align="center">{employee.commission_rate || 0}%</TableCell>
                    <TableCell align="center">
                      <Chip 
                        label={employee.is_active ? 'Active' : 'Inactive'} 
                        size="small"
                        color={employee.is_active ? 'success' : 'default'}
                      />
                    </TableCell>
                    <TableCell align="center">
                      <IconButton size="small" onClick={() => handleEdit(employee)}>
                        <Edit fontSize="small" />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      {/* Add/Edit Dialog */}
      <Dialog open={showDialog} onClose={handleDialogClose} maxWidth="sm" fullWidth>
        <DialogTitle>{editingEmployee ? 'Edit User' : 'Add User'}</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            {!editingEmployee && (
              <>
                <Box sx={{ mb: 2 }}>
                  <ToggleButtonGroup
                    value={userMode}
                    exclusive
                    onChange={(e, newMode) => newMode && setUserMode(newMode)}
                    fullWidth
                    size="small"
                  >
                    <ToggleButton value="new">Create New User</ToggleButton>
                    <ToggleButton value="existing">Select Existing User</ToggleButton>
                  </ToggleButtonGroup>
                </Box>

                {userMode === 'new' ? (
                  <>
                    <TextField
                      fullWidth
                      label="First Name"
                      value={formData.first_name}
                      onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                      sx={{ mb: 2 }}
                      required
                    />
                    <TextField
                      fullWidth
                      label="Last Name"
                      value={formData.last_name}
                      onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                      sx={{ mb: 2 }}
                      required
                    />
              <TextField
                fullWidth
                      label="Email (Optional)"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      sx={{ mb: 2 }}
                      helperText="If not provided, a default email will be generated"
                    />
                  </>
                ) : (
                  <FormControl fullWidth sx={{ mb: 2 }}>
                    <InputLabel>Select User</InputLabel>
                    <Select
                value={formData.user_id}
                onChange={(e) => setFormData({ ...formData, user_id: e.target.value })}
                      label="Select User"
                    >
                      {availableUsers.length === 0 ? (
                        <MenuItem disabled>No available users</MenuItem>
                      ) : (
                        availableUsers.map((user) => (
                          <MenuItem key={user.id} value={user.id}>
                            {user.name} ({user.email})
                          </MenuItem>
                        ))
                      )}
                    </Select>
                  </FormControl>
                )}
              </>
            )}

            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel>Role</InputLabel>
              <Select
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value as any })}
                label="Role"
              >
                <MenuItem value="admin">Admin</MenuItem>
                <MenuItem value="cashier">Cashier</MenuItem>
                <MenuItem value="employee">Employee (Barber/Salonist)</MenuItem>
              </Select>
            </FormControl>

            <TextField
              fullWidth
              type="number"
              label="Commission Rate (%)"
              value={formData.commission_rate}
              onChange={(e) => setFormData({ ...formData, commission_rate: e.target.value })}
              helperText="Percentage of service amount employee earns"
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDialogClose}>Cancel</Button>
          <Button onClick={handleSubmit} variant="contained" disabled={loading}>
            {loading ? 'Saving...' : 'Save'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default SalonEmployees;
