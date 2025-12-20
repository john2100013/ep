import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
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
  Paper,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  IconButton,
  Alert,
  Chip,
  Checkbox,
  FormControlLabel,
  Divider,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  People as PeopleIcon,
  Save as SaveIcon,
} from '@mui/icons-material';
import { ApiService } from '../services/api';
import Sidebar from '../components/Sidebar';
import { useAuth } from '../contexts/AuthContext';

interface User {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  role: 'Admin' | 'User' | 'owner' | 'admin' | 'employee';
  status: 'active' | 'inactive';
  is_active: boolean;
  created_at: string;
  updated_at: string;
  can_access_analytics?: boolean;
  can_access_business_settings?: boolean;
  can_access_financial_accounts?: boolean;
  can_access_pos?: boolean;
  can_access_advanced_package?: boolean;
  can_access_salon?: boolean;
  can_access_service_billing?: boolean;
  can_access_hospital?: boolean;
  can_access_invoices?: boolean;
  can_access_quotations?: boolean;
  can_access_items?: boolean;
  can_access_customers?: boolean;
  can_access_goods_returns?: boolean;
  can_access_damage_tracking?: boolean;
  can_access_signatures?: boolean;
  can_access_database_settings?: boolean;
}

const UsersManagementScreen: React.FC = () => {
  const { user: currentUser, refreshUser } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [permissionsDialogOpen, setPermissionsDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [editingPermissionsUser, setEditingPermissionsUser] = useState<User | null>(null);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    first_name: '',
    last_name: '',
    role: 'User' as 'Admin' | 'User',
    status: 'active' as 'active' | 'inactive',
  });
  const [permissions, setPermissions] = useState({
    can_access_analytics: false,
    can_access_business_settings: false,
    can_access_financial_accounts: false,
    can_access_pos: true,
    can_access_advanced_package: false,
    can_access_salon: false,
    can_access_service_billing: false,
    can_access_hospital: false,
    can_access_invoices: true,
    can_access_quotations: true,
    can_access_items: true,
    can_access_customers: true,
    can_access_goods_returns: true,
    can_access_damage_tracking: true,
    can_access_signatures: true,
    can_access_database_settings: false,
  });

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const response = await ApiService.getUsers();
      if (response.success) {
        // Convert role from database format to display format
        const formattedUsers = response.data.users.map((u: any) => ({
          ...u,
          role: u.role === 'admin' || u.role === 'owner' ? 'Admin' : 'User'
        }));
        setUsers(formattedUsers);
      } else {
        setError(response.message || 'Failed to load users');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load users');
      console.error('Load users error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (user?: User) => {
    if (user) {
      setEditingUser(user);
      setFormData({
        email: user.email,
        password: '', // Don't populate password
        first_name: user.first_name,
        last_name: user.last_name,
        role: user.role === 'admin' || user.role === 'owner' ? 'Admin' : 'User',
        status: user.status || 'active',
      });
    } else {
      setEditingUser(null);
      setFormData({
        email: '',
        password: '',
        first_name: '',
        last_name: '',
        role: 'User',
        status: 'active',
      });
    }
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingUser(null);
    setFormData({
      email: '',
      password: '',
      first_name: '',
      last_name: '',
      role: 'User',
      status: 'active',
    });
  };

  const handleOpenPermissionsDialog = (user: User) => {
    setEditingPermissionsUser(user);
    setPermissions({
      can_access_analytics: user.can_access_analytics || false,
      can_access_business_settings: user.can_access_business_settings || false,
      can_access_financial_accounts: user.can_access_financial_accounts || false,
      can_access_pos: user.can_access_pos !== undefined ? user.can_access_pos : true,
      can_access_advanced_package: user.can_access_advanced_package || false,
      can_access_salon: user.can_access_salon || false,
      can_access_service_billing: user.can_access_service_billing || false,
      can_access_hospital: user.can_access_hospital || false,
      can_access_invoices: user.can_access_invoices !== undefined ? user.can_access_invoices : true,
      can_access_quotations: user.can_access_quotations !== undefined ? user.can_access_quotations : true,
      can_access_items: user.can_access_items !== undefined ? user.can_access_items : true,
      can_access_customers: user.can_access_customers !== undefined ? user.can_access_customers : true,
      can_access_goods_returns: user.can_access_goods_returns !== undefined ? user.can_access_goods_returns : true,
      can_access_damage_tracking: user.can_access_damage_tracking !== undefined ? user.can_access_damage_tracking : true,
      can_access_signatures: user.can_access_signatures !== undefined ? user.can_access_signatures : true,
      can_access_database_settings: user.can_access_database_settings || false,
    });
    setPermissionsDialogOpen(true);
  };

  const handleClosePermissionsDialog = () => {
    setPermissionsDialogOpen(false);
    setEditingPermissionsUser(null);
  };

  const handleUpdatePermissions = async () => {
    if (!editingPermissionsUser) return;

    try {
      setError(null);
      const response = await ApiService.updateUser(editingPermissionsUser.id, {
        permissions: permissions
      } as any);
      
      if (response.success) {
        setSuccess('Permissions updated successfully!');
        await loadUsers();
        
        // If we updated the current user's permissions, refresh their data
        if (editingPermissionsUser?.id === currentUser?.id) {
          console.log('🔄 [UsersManagement] Refreshing current user data after permission update');
          await refreshUser();
        }
        
        handleClosePermissionsDialog();
        setTimeout(() => setSuccess(null), 3000);
      } else {
        setError(response.message || 'Failed to update permissions');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to update permissions');
      console.error('Update permissions error:', err);
    }
  };

  const handleSubmit = async () => {
    try {
      setError(null);
      
      if (!formData.email || !formData.first_name || !formData.last_name) {
        setError('Email, first name, and last name are required');
        return;
      }

      if (!editingUser && !formData.password) {
        setError('Password is required for new users');
        return;
      }

      if (formData.password && formData.password.length < 6) {
        setError('Password must be at least 6 characters long');
        return;
      }

      if (editingUser) {
        const updateData: any = {
          email: formData.email,
          first_name: formData.first_name,
          last_name: formData.last_name,
          role: formData.role,
          status: formData.status,
        };
        
        // Only include password if it's provided
        if (formData.password) {
          updateData.password = formData.password;
        }

        const response = await ApiService.updateUser(editingUser.id, updateData);
        if (response.success) {
          setSuccess('User updated successfully!');
          await loadUsers();
          handleCloseDialog();
          setTimeout(() => setSuccess(null), 3000);
        } else {
          setError(response.message || 'Failed to update user');
        }
      } else {
        const response = await ApiService.createUser({
          email: formData.email,
          password: formData.password,
          first_name: formData.first_name,
          last_name: formData.last_name,
          role: formData.role,
        });
        if (response.success) {
          setSuccess('User created successfully!');
          await loadUsers();
          handleCloseDialog();
          setTimeout(() => setSuccess(null), 3000);
        } else {
          setError(response.message || 'Failed to create user');
        }
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to save user');
      console.error('Save user error:', err);
    }
  };

  const handleDelete = async (userId: number) => {
    if (!window.confirm('Are you sure you want to delete this user?')) {
      return;
    }

    try {
      const response = await ApiService.deleteUser(userId);
      if (response.success) {
        setSuccess('User deleted successfully!');
        await loadUsers();
        setTimeout(() => setSuccess(null), 3000);
      } else {
        setError(response.message || 'Failed to delete user');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to delete user');
      console.error('Delete user error:', err);
    }
  };

  // Check if current user is Admin
  const isAdmin = currentUser?.role === 'Admin' || currentUser?.role === 'admin' || currentUser?.role === 'owner';

  if (!isAdmin) {
    return (
      <Box sx={{ display: 'flex', width: '100vw', minHeight: '100vh', margin: 0 }}>
        <Box sx={{ display: { xs: 'none', md: 'block' } }}>
          <Sidebar title="Users Management" />
        </Box>
        <Box sx={{ 
          marginLeft: { xs: 0, md: '350px' }, 
          width: { xs: '100%', md: 'calc(100vw - 350px - 24px)' }, 
          p: { xs: 2, md: 3 }, 
          paddingRight: { xs: 0, md: '24px' },
          overflow: 'auto',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center'
        }}>
          <Alert severity="error">
            Access denied. Admin privileges required.
          </Alert>
        </Box>
      </Box>
    );
  }

  return (
    <Box sx={{ display: 'flex', width: '100vw', minHeight: '100vh', margin: 0 }}>
      {/* Sidebar - hidden on mobile */}
      <Box sx={{ display: { xs: 'none', md: 'block' } }}>
        <Sidebar title="Users Management" />
      </Box>

      {/* Main Content */}
      <Box sx={{ 
        marginLeft: { xs: 0, md: '350px' }, 
        width: { xs: '100%', md: 'calc(100vw - 350px - 24px)' }, 
        p: { xs: 2, md: 3 }, 
        paddingRight: { xs: 0, md: '24px' },
        overflow: 'auto',
        display: 'flex',
        justifyContent: 'center'
      }}>
        <Box sx={{ maxWidth: 'lg', width: '100%' }}>
          <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: { xs: 'stretch', sm: 'center' }, flexDirection: { xs: 'column', sm: 'row' }, gap: { xs: 1, sm: 2 } }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <PeopleIcon sx={{ fontSize: 32, color: 'primary.main' }} />
              <Typography variant="h4" component="h1" sx={{ fontSize: { xs: '1.5rem', md: '2.125rem' } }}>
                Users / Employees
              </Typography>
            </Box>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => handleOpenDialog()}
              sx={{ width: { xs: '100%', sm: 'auto' } }}
            >
              Add User
            </Button>
          </Box>

          {error && (
            <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
              {error}
            </Alert>
          )}

          {success && (
            <Alert severity="success" sx={{ mb: 3 }} onClose={() => setSuccess(null)}>
              {success}
            </Alert>
          )}

          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell><strong>Name</strong></TableCell>
                  <TableCell><strong>Email</strong></TableCell>
                  <TableCell><strong>Role</strong></TableCell>
                  <TableCell><strong>Status</strong></TableCell>
                  <TableCell><strong>Created</strong></TableCell>
                  <TableCell align="center"><strong>Actions</strong></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={6} align="center">
                      <Typography>Loading users...</Typography>
                    </TableCell>
                  </TableRow>
                ) : users.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} align="center">
                      <Typography variant="body2" color="textSecondary">
                        No users found. Add your first user to get started.
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  users.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell>
                        {user.first_name} {user.last_name}
                      </TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>
                        <Chip
                          label={user.role === 'admin' || user.role === 'owner' ? 'Admin' : 'User'}
                          color={user.role === 'admin' || user.role === 'owner' ? 'primary' : 'default'}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={user.status === 'active' ? 'Active' : 'Inactive'}
                          color={user.status === 'active' ? 'success' : 'default'}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        {new Date(user.created_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell align="center">
                        <IconButton
                          size="small"
                          onClick={() => handleOpenDialog(user)}
                          color="primary"
                          disabled={user.id === currentUser?.id}
                          title="Edit User"
                        >
                          <EditIcon />
                        </IconButton>
                        <IconButton
                          size="small"
                          onClick={() => handleOpenPermissionsDialog(user)}
                          color="secondary"
                          disabled={user.id === currentUser?.id || (user.role === 'admin' || user.role === 'owner')}
                          title="Manage Permissions"
                        >
                          <SaveIcon />
                        </IconButton>
                        <IconButton
                          size="small"
                          onClick={() => handleDelete(user.id)}
                          color="error"
                          disabled={user.id === currentUser?.id}
                          title="Delete User"
                        >
                          <DeleteIcon />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>

          {/* Add/Edit Dialog */}
          <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
            <DialogTitle>
              {editingUser ? 'Edit User' : 'Add New User'}
            </DialogTitle>
            <DialogContent>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
                <TextField
                  label="Email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  fullWidth
                  required
                  type="email"
                />
                <TextField
                  label="Password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  fullWidth
                  required={!editingUser}
                  type="password"
                  helperText={editingUser ? 'Leave blank to keep current password' : 'Minimum 6 characters'}
                />
                <TextField
                  label="First Name"
                  value={formData.first_name}
                  onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                  fullWidth
                  required
                />
                <TextField
                  label="Last Name"
                  value={formData.last_name}
                  onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                  fullWidth
                  required
                />
                <FormControl fullWidth>
                  <InputLabel>Role</InputLabel>
                  <Select
                    value={formData.role}
                    label="Role"
                    onChange={(e) => setFormData({ ...formData, role: e.target.value as 'Admin' | 'User' })}
                  >
                    <MenuItem value="Admin">Admin</MenuItem>
                    <MenuItem value="User">User</MenuItem>
                  </Select>
                </FormControl>
                {editingUser && (
                  <FormControl fullWidth>
                    <InputLabel>Status</InputLabel>
                    <Select
                      value={formData.status}
                      label="Status"
                      onChange={(e) => setFormData({ ...formData, status: e.target.value as 'active' | 'inactive' })}
                    >
                      <MenuItem value="active">Active</MenuItem>
                      <MenuItem value="inactive">Inactive</MenuItem>
                    </Select>
                  </FormControl>
                )}
              </Box>
            </DialogContent>
            <DialogActions>
              <Button onClick={handleCloseDialog}>Cancel</Button>
              <Button onClick={handleSubmit} variant="contained">
                {editingUser ? 'Update' : 'Create'}
              </Button>
            </DialogActions>
          </Dialog>

          {/* Permissions Dialog */}
          <Dialog open={permissionsDialogOpen} onClose={handleClosePermissionsDialog} maxWidth="md" fullWidth>
            <DialogTitle>
              Manage Permissions - {editingPermissionsUser?.first_name} {editingPermissionsUser?.last_name}
            </DialogTitle>
            <DialogContent>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 2 }}>
                <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                  Core Modules
                </Typography>
                <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)' }, gap: 2 }}>
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={permissions.can_access_invoices}
                        onChange={(e) => setPermissions({ ...permissions, can_access_invoices: e.target.checked })}
                      />
                    }
                    label="Invoices"
                  />
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={permissions.can_access_quotations}
                        onChange={(e) => setPermissions({ ...permissions, can_access_quotations: e.target.checked })}
                      />
                    }
                    label="Quotations"
                  />
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={permissions.can_access_items}
                        onChange={(e) => setPermissions({ ...permissions, can_access_items: e.target.checked })}
                      />
                    }
                    label="Items"
                  />
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={permissions.can_access_customers}
                        onChange={(e) => setPermissions({ ...permissions, can_access_customers: e.target.checked })}
                      />
                    }
                    label="Customers"
                  />
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={permissions.can_access_pos}
                        onChange={(e) => setPermissions({ ...permissions, can_access_pos: e.target.checked })}
                      />
                    }
                    label="POS System"
                  />
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={permissions.can_access_goods_returns}
                        onChange={(e) => setPermissions({ ...permissions, can_access_goods_returns: e.target.checked })}
                      />
                    }
                    label="Goods Returns"
                  />
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={permissions.can_access_damage_tracking}
                        onChange={(e) => setPermissions({ ...permissions, can_access_damage_tracking: e.target.checked })}
                      />
                    }
                    label="Damage Tracking"
                  />
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={permissions.can_access_signatures}
                        onChange={(e) => setPermissions({ ...permissions, can_access_signatures: e.target.checked })}
                      />
                    }
                    label="Signatures"
                  />
                </Box>

                <Divider sx={{ my: 2 }} />

                <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                  Administrative Modules
                </Typography>
                <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)' }, gap: 2 }}>
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={permissions.can_access_analytics}
                        onChange={(e) => setPermissions({ ...permissions, can_access_analytics: e.target.checked })}
                      />
                    }
                    label="Analytics"
                  />
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={permissions.can_access_business_settings}
                        onChange={(e) => setPermissions({ ...permissions, can_access_business_settings: e.target.checked })}
                      />
                    }
                    label="Business Settings"
                  />
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={permissions.can_access_financial_accounts}
                        onChange={(e) => setPermissions({ ...permissions, can_access_financial_accounts: e.target.checked })}
                      />
                    }
                    label="Financial Accounts"
                  />
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={permissions.can_access_database_settings}
                        onChange={(e) => setPermissions({ ...permissions, can_access_database_settings: e.target.checked })}
                      />
                    }
                    label="Database Settings"
                  />
                </Box>

                <Divider sx={{ my: 2 }} />

                <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                  Advanced Package
                </Typography>
                <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)' }, gap: 2 }}>
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={permissions.can_access_advanced_package}
                        onChange={(e) => {
                          const isChecked = e.target.checked;
                          setPermissions({
                            ...permissions,
                            can_access_advanced_package: isChecked,
                            // When "Advanced Package (All)" is checked, automatically check all sub-modules
                            can_access_salon: isChecked ? true : permissions.can_access_salon,
                            can_access_service_billing: isChecked ? true : permissions.can_access_service_billing,
                            can_access_hospital: isChecked ? true : permissions.can_access_hospital,
                          });
                        }}
                      />
                    }
                    label="Advanced Package (All)"
                  />
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={permissions.can_access_salon}
                        onChange={(e) => {
                          const isChecked = e.target.checked;
                          const newSalon = isChecked;
                          const newServiceBilling = permissions.can_access_service_billing;
                          const newHospital = permissions.can_access_hospital;
                          // If all individual modules are unchecked, uncheck "Advanced Package (All)"
                          const allUnchecked = !newSalon && !newServiceBilling && !newHospital;
                          setPermissions({
                            ...permissions,
                            can_access_salon: newSalon,
                            can_access_advanced_package: allUnchecked ? false : permissions.can_access_advanced_package,
                          });
                        }}
                      />
                    }
                    label="Salon / Barber"
                  />
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={permissions.can_access_service_billing}
                        onChange={(e) => {
                          const isChecked = e.target.checked;
                          const newSalon = permissions.can_access_salon;
                          const newServiceBilling = isChecked;
                          const newHospital = permissions.can_access_hospital;
                          // If all individual modules are unchecked, uncheck "Advanced Package (All)"
                          const allUnchecked = !newSalon && !newServiceBilling && !newHospital;
                          setPermissions({
                            ...permissions,
                            can_access_service_billing: newServiceBilling,
                            can_access_advanced_package: allUnchecked ? false : permissions.can_access_advanced_package,
                          });
                        }}
                      />
                    }
                    label="Service Billing"
                  />
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={permissions.can_access_hospital}
                        onChange={(e) => {
                          const isChecked = e.target.checked;
                          const newSalon = permissions.can_access_salon;
                          const newServiceBilling = permissions.can_access_service_billing;
                          const newHospital = isChecked;
                          // If all individual modules are unchecked, uncheck "Advanced Package (All)"
                          const allUnchecked = !newSalon && !newServiceBilling && !newHospital;
                          setPermissions({
                            ...permissions,
                            can_access_hospital: newHospital,
                            can_access_advanced_package: allUnchecked ? false : permissions.can_access_advanced_package,
                          });
                        }}
                      />
                    }
                    label="Hospital Management"
                  />
                </Box>
              </Box>
            </DialogContent>
            <DialogActions>
              <Button onClick={handleClosePermissionsDialog}>Cancel</Button>
              <Button onClick={handleUpdatePermissions} variant="contained" startIcon={<SaveIcon />}>
                Update Permissions
              </Button>
            </DialogActions>
          </Dialog>
        </Box>
      </Box>
    </Box>
  );
};

export default UsersManagementScreen;

