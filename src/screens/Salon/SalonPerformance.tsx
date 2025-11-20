import React, { useState, useEffect } from 'react';
import { Box, Card, CardContent, Typography, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Alert, Grid, TextField, Button } from '@mui/material';
import { TrendingUp, People, AttachMoney } from '@mui/icons-material';
import * as salonApi from '../../services/salonApi';
import type { EmployeePerformance } from '../../types';

const SalonPerformance: React.FC = () => {
  const [performance, setPerformance] = useState<EmployeePerformance[]>([]);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => { loadPerformance(); }, []);

  const loadPerformance = async () => {
    try {
      setLoading(true);
      const params: any = {};
      if (startDate) params.start_date = new Date(startDate).toISOString();
      if (endDate) params.end_date = new Date(endDate).toISOString();
      const response = await salonApi.getEmployeePerformance(params);
      if (response.data.success) setPerformance(response.data.data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load performance data');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => `KES ${amount.toLocaleString('en-KE', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;

  const totals = performance.reduce((acc, emp) => ({
    clients: acc.clients + emp.total_clients,
    revenue: acc.revenue + parseFloat(emp.total_revenue.toString()),
    earnings: acc.earnings + parseFloat(emp.total_earnings.toString()),
  }), { clients: 0, revenue: 0, earnings: 0 });

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" fontWeight="bold" gutterBottom>Employee Performance</Typography>

      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>{error}</Alert>}

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" fontWeight="bold" gutterBottom>Filter by Date Range</Typography>
          <Grid container spacing={2} alignItems="center">
            <Grid size={{ xs: 12, sm: 4 }}>
              <TextField
                fullWidth
                type="date"
                label="Start Date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 4 }}>
              <TextField
                fullWidth
                type="date"
                label="End Date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 4 }}>
              <Button
                fullWidth
                variant="contained"
                onClick={loadPerformance}
                disabled={loading}
              >
                {loading ? 'Loading...' : 'Apply Filter'}
              </Button>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid size={{ xs: 12, md: 4 }}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <People sx={{ fontSize: 40, color: 'primary.main', mr: 1 }} />
                <Typography variant="h6" color="text.secondary">Total Clients</Typography>
              </Box>
              <Typography variant="h3" fontWeight="bold">{totals.clients}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, md: 4 }}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <AttachMoney sx={{ fontSize: 40, color: 'success.main', mr: 1 }} />
                <Typography variant="h6" color="text.secondary">Total Revenue</Typography>
              </Box>
              <Typography variant="h3" fontWeight="bold">{formatCurrency(totals.revenue)}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, md: 4 }}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <TrendingUp sx={{ fontSize: 40, color: 'info.main', mr: 1 }} />
                <Typography variant="h6" color="text.secondary">Total Earnings</Typography>
              </Box>
              <Typography variant="h3" fontWeight="bold">{formatCurrency(totals.earnings)}</Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Card>
        <CardContent>
          <Typography variant="h6" fontWeight="bold" gutterBottom>Employee Breakdown</Typography>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell><strong>Employee Name</strong></TableCell>
                  <TableCell><strong>Email</strong></TableCell>
                  <TableCell align="center"><strong>Commission %</strong></TableCell>
                  <TableCell align="center"><strong>Clients Served</strong></TableCell>
                  <TableCell align="right"><strong>Revenue Generated</strong></TableCell>
                  <TableCell align="right"><strong>Earnings</strong></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {performance.map((emp) => (
                  <TableRow key={emp.employee_id}>
                    <TableCell>{emp.employee_name}</TableCell>
                    <TableCell>{emp.email}</TableCell>
                    <TableCell align="center">{emp.commission_rate}%</TableCell>
                    <TableCell align="center">{emp.total_clients}</TableCell>
                    <TableCell align="right">{formatCurrency(parseFloat(emp.total_revenue.toString()))}</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 'bold', color: 'success.main' }}>{formatCurrency(parseFloat(emp.total_earnings.toString()))}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>
    </Box>
  );
};

export default SalonPerformance;
