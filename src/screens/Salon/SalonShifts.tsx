import React, { useState, useEffect } from 'react';
import { Box, Card, CardContent, Typography, Button, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Dialog, DialogTitle, DialogContent, DialogActions, TextField, Alert, Chip, Grid } from '@mui/material';
import { AccessTime, CheckCircle } from '@mui/icons-material';
import * as salonApi from '../../services/salonApi';
import type { SalonShift } from '../../types';

const SalonShifts: React.FC = () => {
  const [shifts, setShifts] = useState<SalonShift[]>([]);
  const [currentShift, setCurrentShift] = useState<SalonShift | null>(null);
  const [showStartDialog, setShowStartDialog] = useState(false);
  const [showCloseDialog, setShowCloseDialog] = useState(false);
  const [startingFloat, setStartingFloat] = useState('');
  const [actualCash, setActualCash] = useState('');
  const [closeNotes, setCloseNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    try {
      const [shiftsRes, currentRes] = await Promise.all([salonApi.getShifts({}), salonApi.getCurrentShift()]);
      if (shiftsRes.data.success) setShifts(shiftsRes.data.data);
      if (currentRes.data.success && currentRes.data.data) setCurrentShift(currentRes.data.data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load shifts');
    }
  };

  const handleStartShift = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await salonApi.startShift({ starting_float: parseFloat(startingFloat) || 0 });
      if (response.data.success) {
        setSuccess('Shift started successfully');
        setShowStartDialog(false);
        setStartingFloat('');
        loadData();
        setTimeout(() => setSuccess(''), 3000);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to start shift');
    } finally {
      setLoading(false);
    }
  };

  const handleCloseShift = async () => {
    if (!currentShift) return;
    try {
      setLoading(true);
      setError('');
      const response = await salonApi.closeShift(currentShift.id, { actual_cash: parseFloat(actualCash) || 0, notes: closeNotes });
      if (response.data.success) {
        setSuccess('Shift closed successfully');
        setShowCloseDialog(false);
        setActualCash('');
        setCloseNotes('');
        setCurrentShift(null);
        loadData();
        setTimeout(() => setSuccess(''), 3000);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to close shift');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => `KES ${amount.toLocaleString('en-KE', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
  const formatDuration = (clockIn: string, clockOut?: string) => {
    const start = new Date(clockIn);
    const end = clockOut ? new Date(clockOut) : new Date();
    const hours = Math.floor((end.getTime() - start.getTime()) / (1000 * 60 * 60));
    const minutes = Math.floor(((end.getTime() - start.getTime()) % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours}h ${minutes}m`;
  };

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" fontWeight="bold">Shifts & Attendance</Typography>
        {currentShift ? (
          <Button variant="contained" color="error" startIcon={<CheckCircle />} onClick={() => setShowCloseDialog(true)}>Close Shift</Button>
        ) : (
          <Button variant="contained" startIcon={<AccessTime />} onClick={() => setShowStartDialog(true)}>Start Shift</Button>
        )}
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>{error}</Alert>}
      {success && <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess('')}>{success}</Alert>}

      {currentShift && (
        <Card sx={{ mb: 3, bgcolor: '#e3f2fd' }}>
          <CardContent>
            <Typography variant="h6" fontWeight="bold" gutterBottom>Current Shift</Typography>
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                <Typography variant="body2" color="text.secondary">Clock In</Typography>
                <Typography variant="h6">{new Date(currentShift.clock_in).toLocaleString()}</Typography>
              </Grid>
              <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                <Typography variant="body2" color="text.secondary">Duration</Typography>
                <Typography variant="h6">{formatDuration(currentShift.clock_in)}</Typography>
              </Grid>
              <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                <Typography variant="body2" color="text.secondary">Starting Float</Typography>
                <Typography variant="h6">{formatCurrency(currentShift.starting_float)}</Typography>
              </Grid>
              <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                <Typography variant="body2" color="text.secondary">Status</Typography>
                <Chip label="ACTIVE" color="success" />
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardContent>
          <Typography variant="h6" fontWeight="bold" gutterBottom>Shift History</Typography>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell><strong>User</strong></TableCell>
                  <TableCell><strong>Clock In</strong></TableCell>
                  <TableCell><strong>Clock Out</strong></TableCell>
                  <TableCell><strong>Duration</strong></TableCell>
                  <TableCell align="right"><strong>Total Sales</strong></TableCell>
                  <TableCell align="right"><strong>Expected Cash</strong></TableCell>
                  <TableCell align="right"><strong>Actual Cash</strong></TableCell>
                  <TableCell align="right"><strong>Difference</strong></TableCell>
                  <TableCell align="center"><strong>Status</strong></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {shifts.map((shift) => (
                  <TableRow key={shift.id}>
                    <TableCell>{shift.user_name}</TableCell>
                    <TableCell>{new Date(shift.clock_in).toLocaleString()}</TableCell>
                    <TableCell>{shift.clock_out ? new Date(shift.clock_out).toLocaleString() : '-'}</TableCell>
                    <TableCell>{formatDuration(shift.clock_in, shift.clock_out)}</TableCell>
                    <TableCell align="right">{formatCurrency(shift.total_sales)}</TableCell>
                    <TableCell align="right">{formatCurrency(shift.expected_cash)}</TableCell>
                    <TableCell align="right">{shift.actual_cash ? formatCurrency(shift.actual_cash) : '-'}</TableCell>
                    <TableCell align="right" sx={{ color: shift.difference > 0 ? 'success.main' : shift.difference < 0 ? 'error.main' : 'inherit' }}>{shift.difference !== 0 ? formatCurrency(shift.difference) : '-'}</TableCell>
                    <TableCell align="center"><Chip label={shift.status.toUpperCase()} size="small" color={shift.status === 'open' ? 'success' : 'default'} /></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      <Dialog open={showStartDialog} onClose={() => setShowStartDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Start Shift</DialogTitle>
        <DialogContent><Box sx={{ pt: 2 }}><TextField fullWidth type="number" label="Starting Cash Float (KES)" value={startingFloat} onChange={(e) => setStartingFloat(e.target.value)} helperText="Amount of cash you're starting with" /></Box></DialogContent>
        <DialogActions><Button onClick={() => setShowStartDialog(false)}>Cancel</Button><Button onClick={handleStartShift} variant="contained" disabled={loading}>{loading ? 'Starting...' : 'Start Shift'}</Button></DialogActions>
      </Dialog>

      <Dialog open={showCloseDialog} onClose={() => setShowCloseDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Close Shift</DialogTitle>
        <DialogContent><Box sx={{ pt: 2 }}><TextField fullWidth type="number" label="Actual Cash Count (KES) *" value={actualCash} onChange={(e) => setActualCash(e.target.value)} sx={{ mb: 2 }} helperText="Count all cash and enter total amount" /><TextField fullWidth multiline rows={3} label="Notes (Optional)" value={closeNotes} onChange={(e) => setCloseNotes(e.target.value)} /></Box></DialogContent>
        <DialogActions><Button onClick={() => setShowCloseDialog(false)}>Cancel</Button><Button onClick={handleCloseShift} variant="contained" disabled={loading}>{loading ? 'Closing...' : 'Close Shift'}</Button></DialogActions>
      </Dialog>
    </Box>
  );
};

export default SalonShifts;
