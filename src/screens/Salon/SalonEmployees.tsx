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
} from '@mui/material';
import { Add, Edit } from '@mui/icons-material';
import * as salonApi from '../../services/salonApi';
import type { SalonUser } from '../../types';

const SalonEmployees: React.FC = () => {
  const [employees, setEmployees] = useState<SalonUser[]>([]);
  const [showDialog, setShowDialog] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<SalonUser | null>(null);
  
  const [formData, setFormData] = useState({
    user_id: '',
    role: 'employee' as 'admin' | 'cashier' | 'employee',
    commission_rate: '50',
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    loadEmployees();
  }, []);

  const loadEmployees = async () => {
    try {
      const response = await salonApi.getSalonUsers();
      if (response.data.success) {
        setEmployees(response.data.data);
      }
    } catch (err: any) {
      console.error('Error loading employees:', err);
      setError(err.response?.data?.message || 'Failed to load employees');
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
        await salonApi.createSalonUser({
          user_id: formData.user_id,
          role: formData.role,
          commission_rate: parseFloat(formData.commission_rate),
        });
        setSuccess('Employee added successfully');
      }

      setShowDialog(false);
      setEditingEmployee(null);
      setFormData({ user_id: '', role: 'employee', commission_rate: '50' });
      loadEmployees();

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
    setFormData({
      user_id: employee.user_id,
      role: employee.role,
      commission_rate: employee.commission_rate.toString(),
    });
    setShowDialog(true);
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
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" fontWeight="bold">
          Salon Users
        </Typography>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => {
            setEditingEmployee(null);
            setFormData({ user_id: '', role: 'employee', commission_rate: '50' });
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
                {employees.map((employee) => (
                  <TableRow key={employee.id}>
                    <TableCell>{employee.name}</TableCell>
                    <TableCell>{employee.email}</TableCell>
                    <TableCell>{employee.phone_number}</TableCell>
                    <TableCell>
                      <Chip 
                        label={employee.role.toUpperCase()} 
                        size="small" 
                        color={getRoleColor(employee.role)}
                      />
                    </TableCell>
                    <TableCell align="center">{employee.commission_rate}%</TableCell>
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
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      {/* Add/Edit Dialog */}
      <Dialog open={showDialog} onClose={() => setShowDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editingEmployee ? 'Edit User' : 'Add User'}</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            {!editingEmployee && (
              <TextField
                fullWidth
                label="User ID"
                value={formData.user_id}
                onChange={(e) => setFormData({ ...formData, user_id: e.target.value })}
                sx={{ mb: 2 }}
                helperText="The user must be registered in the system first"
              />
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
          <Button onClick={() => setShowDialog(false)}>Cancel</Button>
          <Button onClick={handleSubmit} variant="contained" disabled={loading}>
            {loading ? 'Saving...' : 'Save'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default SalonEmployees;
