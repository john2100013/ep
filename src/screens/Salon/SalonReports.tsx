import React, { useState } from 'react';
import { Box, Card, CardContent, Typography, Grid, TextField, Button, Alert } from '@mui/material';
import { Assessment } from '@mui/icons-material';
import * as salonApi from '../../services/salonApi';

const SalonReports: React.FC = () => {
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const loadReport = async () => {
    try {
      setLoading(true);
      setError('');
      const params: any = {};
      if (startDate) params.start_date = new Date(startDate).toISOString();
      if (endDate) params.end_date = new Date(endDate).toISOString();
      const response = await salonApi.getDashboardStats(params);
      if (response.data.success) setStats(response.data.data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load report');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => `KES ${amount.toLocaleString('en-KE', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" fontWeight="bold" gutterBottom>Reports & Analytics</Typography>

      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>{error}</Alert>}

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" fontWeight="bold" gutterBottom>Generate Report</Typography>
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
                size="large"
                startIcon={<Assessment />}
                onClick={loadReport}
                disabled={loading}
              >
                {loading ? 'Loading...' : 'Generate Report'}
              </Button>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {stats && (
        <>
          <Grid container spacing={3} sx={{ mb: 3 }}>
            <Grid size={{ xs: 12, md: 3 }}>
              <Card>
                <CardContent>
                  <Typography variant="body2" color="text.secondary">Total Transactions</Typography>
                  <Typography variant="h4" fontWeight="bold">{stats.revenue.total_transactions}</Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid size={{ xs: 12, md: 3 }}>
              <Card>
                <CardContent>
                  <Typography variant="body2" color="text.secondary">Total Revenue</Typography>
                  <Typography variant="h4" fontWeight="bold" color="primary.main">{formatCurrency(stats.revenue.total_revenue)}</Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid size={{ xs: 12, md: 2 }}>
              <Card>
                <CardContent>
                  <Typography variant="body2" color="text.secondary">Cash</Typography>
                  <Typography variant="h5" fontWeight="bold">{formatCurrency(stats.revenue.cash_revenue)}</Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid size={{ xs: 12, md: 2 }}>
              <Card>
                <CardContent>
                  <Typography variant="body2" color="text.secondary">M-Pesa</Typography>
                  <Typography variant="h5" fontWeight="bold">{formatCurrency(stats.revenue.mpesa_revenue)}</Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid size={{ xs: 12, md: 2 }}>
              <Card>
                <CardContent>
                  <Typography variant="body2" color="text.secondary">Card</Typography>
                  <Typography variant="h5" fontWeight="bold">{formatCurrency(stats.revenue.card_revenue)}</Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          <Card>
            <CardContent>
              <Typography variant="h6" fontWeight="bold" gutterBottom>Top Performing Services</Typography>
              {stats.top_services.length === 0 ? (
                <Typography color="text.secondary">No services recorded in this period</Typography>
              ) : (
                <Grid container spacing={2}>
                  {stats.top_services.map((service: any, index: number) => (
                    <Grid size={{ xs: 12, sm: 6, md: 4 }} key={index}>
                      <Card variant="outlined">
                        <CardContent>
                          <Typography variant="subtitle2" color="text.secondary">#{index + 1}</Typography>
                          <Typography variant="h6" fontWeight="bold">{service.name}</Typography>
                          <Typography variant="h5" color="primary.main">{formatCurrency(service.total_revenue)}</Typography>
                          <Typography variant="body2" color="text.secondary">{service.service_count} services</Typography>
                        </CardContent>
                      </Card>
                    </Grid>
                  ))}
                </Grid>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </Box>
  );
};

export default SalonReports;
