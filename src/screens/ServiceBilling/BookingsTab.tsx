import React, { useState, useEffect } from 'react';
import { Box, Button, Typography, Alert, TextField, Dialog, DialogTitle, DialogContent, DialogActions, Select, MenuItem, FormControl, InputLabel, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Chip, IconButton, Checkbox, FormGroup, FormControlLabel } from '@mui/material';
import { Add as AddIcon, Delete as DeleteIcon } from '@mui/icons-material';
import { ServiceBillingAPI } from '../../services/serviceBillingApi';

const BookingsTab = () => {
  const [bookings, setBookings] = useState<any[]>([]);
  const [services, setServices] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [openBooking, setOpenBooking] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [bookingForm, setBookingForm] = useState({ 
    customer_id: '', 
    booking_date: '', 
    booking_time: '', 
    selectedServices: [] as number[], 
    notes: '' 
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [bookingsRes, servicesRes, customersRes] = await Promise.all([
        ServiceBillingAPI.getBookings(),
        ServiceBillingAPI.getServices(),
        ServiceBillingAPI.getCustomers()
      ]);
      setBookings(bookingsRes.data.data.bookings);
      setServices(servicesRes.data.data.services);
      setCustomers(customersRes.data.data.customers);
    } catch (err) {
      console.error('Failed to load data:', err);
    }
  };

  const handleCreateBooking = async () => {
    if (!bookingForm.customer_id || !bookingForm.booking_date || !bookingForm.booking_time || bookingForm.selectedServices.length === 0) {
      setError('Please fill all required fields and select at least one service');
      return;
    }
    try {
      await ServiceBillingAPI.createBooking({
        customer_id: bookingForm.customer_id,
        booking_date: bookingForm.booking_date,
        booking_time: bookingForm.booking_time,
        services: bookingForm.selectedServices.map(id => ({ service_id: id })),
        notes: bookingForm.notes
      });
      setSuccess('Booking created successfully! Go to Assignments tab to assign employees.');
      loadData();
      setOpenBooking(false);
      setBookingForm({ customer_id: '', booking_date: '', booking_time: '', selectedServices: [], notes: '' });
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create booking');
    }
  };

  const handleServiceToggle = (serviceId: number) => {
    setBookingForm(prev => ({
      ...prev,
      selectedServices: prev.selectedServices.includes(serviceId)
        ? prev.selectedServices.filter(id => id !== serviceId)
        : [...prev.selectedServices, serviceId]
    }));
  };

  return (
    <Box sx={{ p: 2 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h6">Bookings Management</Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => setOpenBooking(true)} sx={{ backgroundColor: '#673ab7' }}>
          New Booking
        </Button>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>{error}</Alert>}
      {success && <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess('')}>{success}</Alert>}

      <Alert severity="info" sx={{ mb: 2 }}>
        Bookings are appointments scheduled by customers. After creating a booking, go to the <strong>Assignments</strong> tab to assign employees to customers.
      </Alert>

      <TableContainer sx={{ bgcolor: 'white', borderRadius: 1 }}>
        <Table>
          <TableHead sx={{ backgroundColor: '#f5f5f5' }}>
            <TableRow>
              <TableCell><strong>Date</strong></TableCell>
              <TableCell><strong>Time</strong></TableCell>
              <TableCell><strong>Customer</strong></TableCell>
              <TableCell><strong>Services</strong></TableCell>
              <TableCell><strong>Notes</strong></TableCell>
              <TableCell><strong>Status</strong></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {bookings.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} align="center">
                  No bookings found. Create a booking to get started.
                </TableCell>
              </TableRow>
            ) : (
              bookings.map((booking) => (
                <TableRow key={booking.id} hover>
                  <TableCell>{new Date(booking.booking_date).toLocaleDateString()}</TableCell>
                  <TableCell>{booking.booking_time}</TableCell>
                  <TableCell>
                    {booking.customer_name}
                    <br />
                    <Typography variant="caption" color="text.secondary">
                      {booking.customer_phone}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    {booking.services && booking.services.length > 0 ? (
                      booking.services.map((s: any, idx: number) => (
                        <Chip 
                          key={idx} 
                          label={s.service_name} 
                          size="small" 
                          sx={{ mr: 0.5, mb: 0.5 }} 
                        />
                      ))
                    ) : (
                      <Typography variant="caption" color="text.secondary">No services</Typography>
                    )}
                  </TableCell>
                  <TableCell>
                    <Typography variant="caption">{booking.notes || '-'}</Typography>
                  </TableCell>
                  <TableCell>
                    <Chip 
                      label={booking.status} 
                      color={booking.status === 'completed' ? 'success' : 'default'} 
                      size="small" 
                    />
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* New Booking Dialog */}
      <Dialog open={openBooking} onClose={() => setOpenBooking(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Create New Booking</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
            <FormControl fullWidth>
              <InputLabel>Select Customer *</InputLabel>
              <Select
                value={bookingForm.customer_id}
                onChange={(e) => setBookingForm({ ...bookingForm, customer_id: e.target.value })}
                label="Select Customer *"
              >
                {customers.map((customer) => (
                  <MenuItem key={customer.id} value={customer.id}>
                    {customer.name} - {customer.phone}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <TextField
              fullWidth
              label="Booking Date *"
              type="date"
              value={bookingForm.booking_date}
              onChange={(e) => setBookingForm({ ...bookingForm, booking_date: e.target.value })}
              InputLabelProps={{ shrink: true }}
            />

            <TextField
              fullWidth
              label="Booking Time *"
              type="time"
              value={bookingForm.booking_time}
              onChange={(e) => setBookingForm({ ...bookingForm, booking_time: e.target.value })}
              InputLabelProps={{ shrink: true }}
            />

            <Box>
              <Typography variant="subtitle2" gutterBottom>Select Services *</Typography>
              <FormGroup>
                {services.map((service) => (
                  <FormControlLabel
                    key={service.id}
                    control={
                      <Checkbox
                        checked={bookingForm.selectedServices.includes(service.id)}
                        onChange={() => handleServiceToggle(service.id)}
                      />
                    }
                    label={`${service.service_name} - $${Number(service.price).toFixed(2)} (${service.estimated_duration}min)`}
                  />
                ))}
              </FormGroup>
            </Box>

            <TextField
              fullWidth
              label="Notes"
              multiline
              rows={3}
              value={bookingForm.notes}
              onChange={(e) => setBookingForm({ ...bookingForm, notes: e.target.value })}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenBooking(false)}>Cancel</Button>
          <Button onClick={handleCreateBooking} variant="contained" sx={{ backgroundColor: '#673ab7' }}>
            Create Booking
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default BookingsTab;
