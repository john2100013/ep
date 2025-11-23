import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Button,
  Chip,
  Alert,
  Tabs,
  Tab,
  Paper,
} from '@mui/material';
import {
  AttachMoney,
  People,
  TrendingUp,
  Warning,
  AccessTime,
  Assignment,
  PointOfSale,
  Assessment,
  History,
} from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';
import * as salonApi from '../../services/salonApi';
import type { SalonDashboardStats } from '../../types';

const SalonDashboard: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [stats, setStats] = useState<SalonDashboardStats | null>(null);
  const [currentShift, setCurrentShift] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [tabValue, setTabValue] = useState(0);

  // Determine tab from route
  useEffect(() => {
    const path = location.pathname;
    if (path.includes('/salon/pos')) setTabValue(1);
    else if (path.includes('/salon/reports')) setTabValue(2);
    else if (path.includes('/salon/shifts')) setTabValue(3);
    else setTabValue(0);
  }, [location.pathname]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Get today's date range
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      const [statsRes, shiftRes] = await Promise.all([
        salonApi.getDashboardStats({
          start_date: today.toISOString(),
          end_date: tomorrow.toISOString(),
        }),
        salonApi.getCurrentShift(),
      ]);

      if (statsRes.data.success) {
        setStats(statsRes.data.data);
      }

      if (shiftRes.data.success && shiftRes.data.data) {
        setCurrentShift(shiftRes.data.data);
      }

      setError('');
    } catch (err: any) {
      console.error('Error loading dashboard:', err);
      setError(err.response?.data?.message || 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return `KES ${amount.toLocaleString('en-KE', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
  };

  if (loading) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography>Loading dashboard...</Typography>
      </Box>
    );
  }

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
    if (newValue === 0) navigate('/salon');
    else if (newValue === 1) navigate('/salon/pos');
    else if (newValue === 2) navigate('/salon/reports');
    else if (newValue === 3) navigate('/salon/shifts');
  };

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h4" fontWeight="bold">
          Salon/Barber Dashboard
        </Typography>
        
        {currentShift ? (
          <Chip 
            label={`Shift Active - Started ${new Date(currentShift.clock_in).toLocaleTimeString()}`}
            color="success"
            icon={<AccessTime />}
          />
        ) : (
          <Button 
            variant="contained" 
            color="primary"
            onClick={() => {
              setTabValue(3);
              navigate('/salon/shifts');
            }}
          >
            Start Shift
          </Button>
        )}
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      {/* Navigation Tabs */}
      <Paper sx={{ mb: 3 }}>
        <Tabs value={tabValue} onChange={handleTabChange} variant="scrollable" scrollButtons="auto">
          <Tab label="Dashboard" icon={<Assignment />} iconPosition="start" />
          <Tab label="POS" icon={<PointOfSale />} iconPosition="start" />
          <Tab label="Reports" icon={<Assessment />} iconPosition="start" />
          <Tab label="Shifts" icon={<History />} iconPosition="start" />
        </Tabs>
      </Paper>

      {/* Dashboard Content */}
      {tabValue === 0 && (
        <>

      {/* Quick Actions */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Button
            fullWidth
            variant="contained"
            size="large"
            onClick={() => navigate('/salon/pos')}
            disabled={!currentShift}
            sx={{ py: 2 }}
          >
            Record Service
          </Button>
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Button
            fullWidth
            variant="outlined"
            size="large"
            onClick={() => navigate('/salon/employees')}
            sx={{ py: 2 }}
          >
            Employees
          </Button>
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Button
            fullWidth
            variant="outlined"
            size="large"
            onClick={() => navigate('/salon/services')}
            sx={{ py: 2 }}
          >
            Services
          </Button>
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Button
            fullWidth
            variant="outlined"
            size="large"
            onClick={() => navigate('/salon/products')}
            sx={{ py: 2 }}
          >
            Products
          </Button>
        </Grid>
      </Grid>

      {/* Stats Cards */}
      {stats && (
        <Grid container spacing={3}>
          {/* Today's Revenue */}
          <Grid size={{ xs: 12, md: 3 }}>
            <Card sx={{ height: '100%' }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <AttachMoney sx={{ fontSize: 40, color: 'primary.main', mr: 1 }} />
                  <Typography variant="h6" color="text.secondary">
                    Today's Revenue
                  </Typography>
                </Box>
                <Typography variant="h4" fontWeight="bold">
                  {formatCurrency(stats.revenue.total_revenue)}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                  {stats.revenue.total_transactions} transactions
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          {/* Cash Revenue */}
          <Grid size={{ xs: 12, md: 3 }}>
            <Card sx={{ height: '100%' }}>
              <CardContent>
                <Typography variant="h6" color="text.secondary" gutterBottom>
                  Cash
                </Typography>
                <Typography variant="h4" fontWeight="bold" color="success.main">
                  {formatCurrency(stats.revenue.cash_revenue)}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                  M-Pesa: {formatCurrency(stats.revenue.mpesa_revenue)}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Card: {formatCurrency(stats.revenue.card_revenue)}
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          {/* Active Employees */}
          <Grid size={{ xs: 12, md: 3 }}>
            <Card sx={{ height: '100%' }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <People sx={{ fontSize: 40, color: 'info.main', mr: 1 }} />
                  <Typography variant="h6" color="text.secondary">
                    Active Employees
                  </Typography>
                </Box>
                <Typography variant="h4" fontWeight="bold">
                  {stats.active_employees}
                </Typography>
                <Button
                  size="small"
                  sx={{ mt: 2 }}
                  onClick={() => navigate('/salon/performance')}
                >
                  View Performance
                </Button>
              </CardContent>
            </Card>
          </Grid>

          {/* Low Stock Alert */}
          <Grid size={{ xs: 12, md: 3 }}>
            <Card sx={{ height: '100%', bgcolor: stats.low_stock_count > 0 ? '#fff3e0' : 'background.paper' }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Warning sx={{ fontSize: 40, color: 'warning.main', mr: 1 }} />
                  <Typography variant="h6" color="text.secondary">
                    Low Stock
                  </Typography>
                </Box>
                <Typography variant="h4" fontWeight="bold" color="warning.main">
                  {stats.low_stock_count}
                </Typography>
                <Button
                  size="small"
                  sx={{ mt: 2 }}
                  onClick={() => navigate('/salon/products')}
                >
                  Manage Stock
                </Button>
              </CardContent>
            </Card>
          </Grid>

          {/* Top Services */}
          <Grid size={{ xs: 12 }}>
            <Card>
              <CardContent>
                <Typography variant="h6" fontWeight="bold" gutterBottom>
                  Top Services Today
                </Typography>
                {stats.top_services.length === 0 ? (
                  <Typography color="text.secondary">No services recorded today</Typography>
                ) : (
                  <Grid container spacing={2} sx={{ mt: 1 }}>
                    {stats.top_services.map((service, index) => (
                      <Grid size={{ xs: 12, sm: 6, md: 4 }} key={index}>
                        <Box
                          sx={{
                            p: 2,
                            border: '1px solid',
                            borderColor: 'divider',
                            borderRadius: 2,
                          }}
                        >
                          <Typography variant="subtitle1" fontWeight="bold">
                            {service.name}
                          </Typography>
                          <Typography variant="h6" color="primary.main">
                            {formatCurrency(service.total_revenue)}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {service.service_count} services
                          </Typography>
                        </Box>
                      </Grid>
                    ))}
                  </Grid>
                )}
              </CardContent>
            </Card>
          </Grid>

          {/* More Navigation */}
          <Grid size={{ xs: 12 }}>
            <Card>
              <CardContent>
                <Typography variant="h6" fontWeight="bold" gutterBottom>
                  More Options
                </Typography>
                <Grid container spacing={2} sx={{ mt: 1 }}>
                  <Grid size={{ xs: 12, sm: 4 }}>
                    <Button
                      fullWidth
                      variant="outlined"
                      startIcon={<Assignment />}
                      onClick={() => navigate('/salon/shifts')}
                    >
                      Shift History
                    </Button>
                  </Grid>
                  <Grid size={{ xs: 12, sm: 4 }}>
                    <Button
                      fullWidth
                      variant="outlined"
                      startIcon={<TrendingUp />}
                      onClick={() => navigate('/salon/reports')}
                    >
                      Reports
                    </Button>
                  </Grid>
                  <Grid size={{ xs: 12, sm: 4 }}>
                    <Button
                      fullWidth
                      variant="outlined"
                      onClick={() => navigate('/salon/settings')}
                    >
                      Settings
                    </Button>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}
        </>
      )}
    </Box>
  );
};

export default SalonDashboard;
