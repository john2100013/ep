import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  Card, 
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  CircularProgress,
  Alert
} from '@mui/material';

interface CustomerInsightsProps {
  dateRange: string;
}

interface Customer {
  id: number;
  name: string;
  email: string;
  totalPurchases: number;
  totalAmount: number;
  lastPurchase: string;
  frequency: 'High' | 'Medium' | 'Low';
}

const CustomerInsights: React.FC<CustomerInsightsProps> = ({ dateRange }) => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchCustomerInsights();
  }, [dateRange]);

  const fetchCustomerInsights = async () => {
    try {
      setLoading(true);
      const { api } = await import('../../services/api');
      const response = await api.get('/analytics/customer-insights');
      
      if (response.data) {
        setCustomers(Array.isArray(response.data) ? response.data : []);
      }
    } catch (err: any) {
      console.error('Error fetching customer insights:', err);
      setError(err?.response?.data?.error || err?.message || 'Failed to fetch customer insights');
      setCustomers([]);
    } finally {
      setLoading(false);
    }
  };

  const getFrequencyColor = (frequency: string) => {
    switch (frequency) {
      case 'High': return 'success';
      case 'Medium': return 'warning';
      case 'Low': return 'error';
      default: return 'default';
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight={300}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ mt: 2 }}>
        {error}
      </Alert>
    );
  }

  return (
    <Box>
      <Typography variant="h5" fontWeight="bold" gutterBottom>
        Customer Insights
      </Typography>
      
      <Box display="flex" gap={3} flexDirection={{ xs: 'column', md: 'row' }}>
        <Box flex={1}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Top Customers by Purchases
              </Typography>
              <TableContainer component={Paper} variant="outlined">
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Customer</TableCell>
                      <TableCell align="right">Purchases</TableCell>
                      <TableCell align="right">Total Amount</TableCell>
                      <TableCell align="center">Frequency</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {customers.slice(0, 10).map((customer) => (
                      <TableRow key={customer.id}>
                        <TableCell>
                          <Box>
                            <Typography variant="body2" fontWeight="medium">
                              {customer.name}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {customer.email}
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell align="right">{customer.totalPurchases}</TableCell>
                        <TableCell align="right">
                          ${customer.totalAmount.toLocaleString()}
                        </TableCell>
                        <TableCell align="center">
                          <Chip
                            label={customer.frequency}
                            color={getFrequencyColor(customer.frequency) as any}
                            size="small"
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Box>
        
        <Box flex={1}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Customer Purchase Frequency Distribution
              </Typography>
              <Box sx={{ mt: 2 }}>
                {['High', 'Medium', 'Low'].map((frequency) => {
                  const count = customers.filter(c => c.frequency === frequency).length;
                  const percentage = customers.length > 0 ? (count / customers.length * 100).toFixed(1) : '0';
                  
                  return (
                    <Box key={frequency} sx={{ mb: 2 }}>
                      <Box display="flex" justifyContent="space-between" alignItems="center">
                        <Typography variant="body2">{frequency} Frequency</Typography>
                        <Typography variant="body2" fontWeight="bold">
                          {count} ({percentage}%)
                        </Typography>
                      </Box>
                      <Box 
                        sx={{ 
                          height: 8, 
                          backgroundColor: 'grey.200', 
                          borderRadius: 1,
                          mt: 0.5
                        }}
                      >
                        <Box 
                          sx={{ 
                            height: '100%', 
                            backgroundColor: 
                              frequency === 'High' ? 'success.main' :
                              frequency === 'Medium' ? 'warning.main' : 'error.main',
                            borderRadius: 1,
                            width: `${percentage}%`,
                            transition: 'width 0.3s ease'
                          }}
                        />
                      </Box>
                    </Box>
                  );
                })}
              </Box>
            </CardContent>
          </Card>
        </Box>
      </Box>
    </Box>
  );
};

export default CustomerInsights;