import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Typography,
  TextField,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Card,
  CardContent,
  Alert,
  Chip,
} from '@mui/material';
import { Calculate as CalculateIcon, Save as SaveIcon } from '@mui/icons-material';
import { ServiceBillingAPI } from '../../services/serviceBillingApi';

const CommissionTab: React.FC = () => {
  const [settings, setSettings] = useState<any>(null);
  const [commissions, setCommissions] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [formData, setFormData] = useState({
    min_customers: '10',
    commission_rate: '10.00',
  });
  const [periodData, setPeriodData] = useState({
    period_start: '',
    period_end: '',
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [settingsRes, commissionsRes] = await Promise.all([
        ServiceBillingAPI.getCommissionSettings(),
        ServiceBillingAPI.getEmployeeCommissions()
      ]);
      
      const settingsData = settingsRes.data.data.settings;
      if (settingsData) {
        setSettings(settingsData);
        setFormData({
          min_customers: settingsData.min_customers.toString(),
          commission_rate: settingsData.commission_rate.toString(),
        });
      }
      setCommissions(commissionsRes.data.data.commissions);
    } catch (err) {
      console.error('Failed to load commission data:', err);
    }
  };

  const handleSaveSettings = async () => {
    if (!formData.min_customers || !formData.commission_rate) {
      setError('Both fields are required');
      return;
    }

    try {
      setLoading(true);
      setError('');
      await ServiceBillingAPI.updateCommissionSettings({
        min_customers: parseInt(formData.min_customers),
        commission_rate: parseFloat(formData.commission_rate)
      });
      setSuccess('Commission settings saved successfully!');
      loadData();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to save settings');
    } finally {
      setLoading(false);
    }
  };

  const handleCalculateCommissions = async () => {
    if (!periodData.period_start || !periodData.period_end) {
      setError('Please select both start and end dates');
      return;
    }

    try {
      setLoading(true);
      setError('');
      const response = await ServiceBillingAPI.calculateCommissions(
        periodData.period_start,
        periodData.period_end
      );
      const calculatedCommissions = response.data.data.commissions;
      
      if (calculatedCommissions.length === 0) {
        setSuccess('No employees qualified for commission in this period');
      } else {
        setSuccess(`Commissions calculated for ${calculatedCommissions.length} employee(s)!`);
      }
      loadData();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to calculate commissions');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ p: 2 }}>
      <Typography variant="h6" sx={{ mb: 3 }}>Commission Management</Typography>

      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>{error}</Alert>}
      {success && <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess('')}>{success}</Alert>}

      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 3 }}>
        {/* Commission Settings */}
        <Box>
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2 }}>💼 Commission Settings</Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Configure minimum requirements and commission rates
              </Typography>
              
              <TextField
                fullWidth
                label="Minimum Customers Required"
                type="number"
                value={formData.min_customers}
                onChange={(e) => setFormData({ ...formData, min_customers: e.target.value })}
                helperText="Minimum number of customers served to qualify for commission"
                sx={{ mb: 2 }}
              />
              
              <TextField
                fullWidth
                label="Commission Rate (%)"
                type="number"
                value={formData.commission_rate}
                onChange={(e) => setFormData({ ...formData, commission_rate: e.target.value })}
                helperText="Percentage of total revenue given as commission"
                sx={{ mb: 2 }}
              />
              
              <Button
                fullWidth
                variant="contained"
                startIcon={<SaveIcon />}
                onClick={handleSaveSettings}
                disabled={loading}
                sx={{ backgroundColor: '#673ab7' }}
              >
                Save Settings
              </Button>
            </CardContent>
          </Card>
        </Box>

        {/* Calculate Commissions */}
        <Box>
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2 }}>📊 Calculate Commissions</Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Calculate commissions for a specific period
              </Typography>
              
              <TextField
                fullWidth
                label="Period Start"
                type="date"
                value={periodData.period_start}
                onChange={(e) => setPeriodData({ ...periodData, period_start: e.target.value })}
                InputLabelProps={{ shrink: true }}
                sx={{ mb: 2 }}
              />
              
              <TextField
                fullWidth
                label="Period End"
                type="date"
                value={periodData.period_end}
                onChange={(e) => setPeriodData({ ...periodData, period_end: e.target.value })}
                InputLabelProps={{ shrink: true }}
                sx={{ mb: 2 }}
              />
              
              <Button
                fullWidth
                variant="contained"
                startIcon={<CalculateIcon />}
                onClick={handleCalculateCommissions}
                disabled={loading}
                sx={{ backgroundColor: '#4caf50' }}
              >
                Calculate Commissions
              </Button>
            </CardContent>
          </Card>
        </Box>
      </Box>

      {/* Commission Records */}
      <Box sx={{ mt: 4 }}>
        <Typography variant="h6" sx={{ mb: 2 }}>Commission Records</Typography>
        <TableContainer>
          <Table>
            <TableHead sx={{ backgroundColor: '#f5f5f5' }}>
              <TableRow>
                <TableCell><strong>Employee</strong></TableCell>
                <TableCell><strong>Period</strong></TableCell>
                <TableCell align="right"><strong>Customers Served</strong></TableCell>
                <TableCell align="right"><strong>Total Revenue</strong></TableCell>
                <TableCell align="right"><strong>Commission</strong></TableCell>
                <TableCell align="center"><strong>Status</strong></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {commissions.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} align="center">
                    No commission records found. Calculate commissions to see records here.
                  </TableCell>
                </TableRow>
              ) : (
                commissions.map((commission) => (
                  <TableRow key={commission.id} hover>
                    <TableCell>{commission.employee_name}</TableCell>
                    <TableCell>
                      {new Date(commission.period_start).toLocaleDateString()} - {new Date(commission.period_end).toLocaleDateString()}
                    </TableCell>
                    <TableCell align="right">{commission.total_customers}</TableCell>
                    <TableCell align="right">${Number(commission.total_revenue).toFixed(2)}</TableCell>
                    <TableCell align="right">
                      <Typography sx={{ fontWeight: 'bold', color: '#4caf50' }}>
                        ${Number(commission.commission_amount).toFixed(2)}
                      </Typography>
                    </TableCell>
                    <TableCell align="center">
                      <Chip 
                        label={commission.status.toUpperCase()} 
                        color={commission.status === 'paid' ? 'success' : 'warning'} 
                        size="small"
                      />
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Box>

      {/* Current Settings Display */}
      {settings && (
        <Box sx={{ mt: 3, p: 2, backgroundColor: '#f5f5f5', borderRadius: 1 }}>
          <Typography variant="body2" color="text.secondary">
            <strong>Current Settings:</strong> Employees serving {settings.min_customers}+ customers receive {settings.commission_rate}% commission
          </Typography>
        </Box>
      )}
    </Box>
  );
};

export default CommissionTab;
