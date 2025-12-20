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
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  People as PeopleIcon,
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
}

const UsersManagementScreen: React.FC = () => {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    first_name: '',
    last_name: '',
    role: 'User' as 'Admin' | 'User',
    status: 'active' as 'active' | 'inactive',
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
                        >
                          <EditIcon />
                        </IconButton>
                        <IconButton
                          size="small"
                          onClick={() => handleDelete(user.id)}
                          color="error"
                          disabled={user.id === currentUser?.id}
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
        </Box>
      </Box>
    </Box>
  );
};

export default UsersManagementScreen;

