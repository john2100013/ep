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
      console.log('🔄 Loading shifts...');
      const [shiftsRes, currentRes] = await Promise.all([
        salonApi.getShifts({}), 
        salonApi.getCurrentShift()
      ]);
      
      console.log('📥 Shifts response:', shiftsRes.data);
      console.log('📥 Current shift response:', currentRes.data);
      
      // Handle shifts response
      let shiftsData: SalonShift[] = [];
      if (Array.isArray(shiftsRes.data)) {
        shiftsData = shiftsRes.data;
      } else if (shiftsRes.data?.success && Array.isArray(shiftsRes.data.data)) {
        shiftsData = shiftsRes.data.data;
      } else if (shiftsRes.data?.data && Array.isArray(shiftsRes.data.data)) {
        shiftsData = shiftsRes.data.data;
      }
      setShifts(shiftsData);
      console.log('✅ Shifts loaded:', shiftsData.length);
      
      // Handle current shift response
      if (currentRes.data?.success && currentRes.data.data) {
        setCurrentShift(currentRes.data.data);
      } else if (currentRes.data && currentRes.data.data) {
        setCurrentShift(currentRes.data.data);
      } else if (currentRes.data && !currentRes.data.success && currentRes.data.data === null) {
        // No current shift
        setCurrentShift(null);
      }
    } catch (err: any) {
      console.error('❌ Error loading shifts:', err);
      console.error('Error details:', err.response?.data);
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
      console.error('❌ Error starting shift:', err);
      console.error('Error details:', err.response?.data);
      const errorMessage = err.response?.data?.message || 'Failed to start shift';
      // If there's an existing shift in the error response, show it
      if (err.response?.data?.existing_shift) {
        setError(`${errorMessage}. Shift ID: ${err.response.data.existing_shift.id}`);
        // Try to load the existing shift
        setCurrentShift(err.response.data.existing_shift);
      } else {
        setError(errorMessage);
      }
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
                <Typography variant="h6">
                  {formatCurrency(typeof currentShift.starting_float === 'string' 
                    ? parseFloat(currentShift.starting_float) 
                    : currentShift.starting_float || 0)}
                </Typography>
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
                {shifts.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} align="center" sx={{ py: 4 }}>
                      <Typography color="text.secondary">
                        No shifts found. Click "Start Shift" to begin.
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  shifts.map((shift) => {
                    // Convert numeric fields to numbers if they're strings
                    const totalSales = typeof shift.total_sales === 'string' 
                      ? parseFloat(shift.total_sales) 
                      : shift.total_sales || 0;
                    const expectedCash = typeof shift.expected_cash === 'string'
                      ? parseFloat(shift.expected_cash)
                      : shift.expected_cash || 0;
                    const actualCash = typeof shift.actual_cash === 'string'
                      ? parseFloat(shift.actual_cash)
                      : shift.actual_cash || 0;
                    const difference = typeof shift.difference === 'string'
                      ? parseFloat(shift.difference)
                      : shift.difference || 0;
                    
                    return (
                      <TableRow key={shift.id}>
                        <TableCell>{shift.user_name || 'N/A'}</TableCell>
                        <TableCell>{new Date(shift.clock_in).toLocaleString()}</TableCell>
                        <TableCell>{shift.clock_out ? new Date(shift.clock_out).toLocaleString() : '-'}</TableCell>
                        <TableCell>{formatDuration(shift.clock_in, shift.clock_out)}</TableCell>
                        <TableCell align="right">{formatCurrency(totalSales)}</TableCell>
                        <TableCell align="right">{formatCurrency(expectedCash)}</TableCell>
                        <TableCell align="right">{actualCash ? formatCurrency(actualCash) : '-'}</TableCell>
                        <TableCell align="right" sx={{ color: difference > 0 ? 'success.main' : difference < 0 ? 'error.main' : 'inherit' }}>{difference !== 0 ? formatCurrency(difference) : '-'}</TableCell>
                        <TableCell align="center"><Chip label={shift.status?.toUpperCase() || 'N/A'} size="small" color={shift.status === 'open' ? 'success' : 'default'} /></TableCell>
                      </TableRow>
                    );
                  })
                )}
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
