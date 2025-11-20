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
  Alert,
  IconButton,
  Chip,
} from '@mui/material';
import { Add, Edit } from '@mui/icons-material';
import * as salonApi from '../../services/salonApi';
import type { SalonService } from '../../types';

const SalonServices: React.FC = () => {
  const [services, setServices] = useState<SalonService[]>([]);
  const [showDialog, setShowDialog] = useState(false);
  const [editingService, setEditingService] = useState<SalonService | null>(null);
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    base_price: '',
    duration_minutes: '',
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    loadServices();
  }, []);

  const loadServices = async () => {
    try {
      const response = await salonApi.getServices();
      if (response.data.success) {
        setServices(response.data.data);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load services');
    }
  };

  const handleSubmit = async () => {
    if (!formData.name || !formData.base_price) {
      setError('Name and price are required');
      return;
    }

    try {
      setLoading(true);
      setError('');

      const data = {
        name: formData.name,
        description: formData.description,
        base_price: parseFloat(formData.base_price),
        duration_minutes: formData.duration_minutes ? parseInt(formData.duration_minutes) : null,
        is_active: true,
      };

      if (editingService) {
        await salonApi.updateService(editingService.id, data);
        setSuccess('Service updated successfully');
      } else {
        await salonApi.createService(data);
        setSuccess('Service added successfully');
      }

      setShowDialog(false);
      setEditingService(null);
      setFormData({ name: '', description: '', base_price: '', duration_minutes: '' });
      loadServices();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to save service');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (service: SalonService) => {
    setEditingService(service);
    setFormData({
      name: service.name,
      description: service.description || '',
      base_price: service.base_price.toString(),
      duration_minutes: service.duration_minutes?.toString() || '',
    });
    setShowDialog(true);
  };

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" fontWeight="bold">
          Services
        </Typography>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => {
            setEditingService(null);
            setFormData({ name: '', description: '', base_price: '', duration_minutes: '' });
            setShowDialog(true);
          }}
        >
          Add Service
        </Button>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>{error}</Alert>}
      {success && <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess('')}>{success}</Alert>}

      <Card>
        <CardContent>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell><strong>Service Name</strong></TableCell>
                  <TableCell><strong>Description</strong></TableCell>
                  <TableCell align="right"><strong>Price (KES)</strong></TableCell>
                  <TableCell align="center"><strong>Duration</strong></TableCell>
                  <TableCell align="center"><strong>Status</strong></TableCell>
                  <TableCell align="center"><strong>Actions</strong></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {services.map((service) => (
                  <TableRow key={service.id}>
                    <TableCell>{service.name}</TableCell>
                    <TableCell>{service.description || '-'}</TableCell>
                    <TableCell align="right">{service.base_price.toFixed(2)}</TableCell>
                    <TableCell align="center">
                      {service.duration_minutes ? `${service.duration_minutes} min` : '-'}
                    </TableCell>
                    <TableCell align="center">
                      <Chip label={service.is_active ? 'Active' : 'Inactive'} size="small" color={service.is_active ? 'success' : 'default'} />
                    </TableCell>
                    <TableCell align="center">
                      <IconButton size="small" onClick={() => handleEdit(service)}>
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

      <Dialog open={showDialog} onClose={() => setShowDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editingService ? 'Edit Service' : 'Add Service'}</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            <TextField fullWidth label="Service Name *" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} sx={{ mb: 2 }} />
            <TextField fullWidth multiline rows={2} label="Description" value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} sx={{ mb: 2 }} />
            <TextField fullWidth type="number" label="Base Price (KES) *" value={formData.base_price} onChange={(e) => setFormData({ ...formData, base_price: e.target.value })} sx={{ mb: 2 }} />
            <TextField fullWidth type="number" label="Duration (minutes)" value={formData.duration_minutes} onChange={(e) => setFormData({ ...formData, duration_minutes: e.target.value })} />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowDialog(false)}>Cancel</Button>
          <Button onClick={handleSubmit} variant="contained" disabled={loading}>{loading ? 'Saving...' : 'Save'}</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default SalonServices;
