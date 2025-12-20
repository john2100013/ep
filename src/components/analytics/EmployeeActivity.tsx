import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  CircularProgress,
  Alert,
  Chip,
} from '@mui/material';
import { ApiService } from '../../services/api';

interface EmployeeActivity {
  user_id: number;
  invoice_count: number;
  quotation_count: number;
  total_amount: number;
  user?: {
    id: number;
    first_name: string;
    last_name: string;
    email: string;
    role: string;
  };
}

interface EmployeeActivityProps {
  dateRange: string;
}

const EmployeeActivity: React.FC<EmployeeActivityProps> = ({ dateRange }) => {
  const [activities, setActivities] = useState<EmployeeActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchEmployeeActivity();
  }, [dateRange]);

  const fetchEmployeeActivity = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await ApiService.getEmployeeActivity({ dateRange });
      
      if (response.success) {
        setActivities(response.data.activities || []);
      } else {
        setError(response.message || 'Failed to fetch employee activity');
      }
    } catch (err: any) {
      console.error('Error fetching employee activity:', err);
      setError(err.response?.data?.message || 'Failed to fetch employee activity');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ mb: 2 }}>
        {error}
      </Alert>
    );
  }

  return (
    <Box>
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom sx={{ mb: 3, fontWeight: 'bold' }}>
            Employee Activity
          </Typography>
          
          {activities.length === 0 ? (
            <Typography color="textSecondary" align="center" sx={{ py: 4 }}>
              No employee activity found for the selected period
            </Typography>
          ) : (
            <TableContainer component={Paper} variant="outlined">
              <Table>
                <TableHead>
                  <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
                    <TableCell><strong>Employee</strong></TableCell>
                    <TableCell align="right"><strong>Invoices Created</strong></TableCell>
                    <TableCell align="right"><strong>Quotations Created</strong></TableCell>
                    <TableCell align="right"><strong>Total Amount</strong></TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {activities.map((activity) => (
                    <TableRow key={activity.user_id} hover>
                      <TableCell>
                        <Box>
                          <Typography variant="body1" fontWeight="medium">
                            {activity.user?.first_name} {activity.user?.last_name}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {activity.user?.email}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell align="right">
                        <Chip 
                          label={activity.invoice_count} 
                          color="primary" 
                          variant="outlined"
                        />
                      </TableCell>
                      <TableCell align="right">
                        <Chip 
                          label={activity.quotation_count} 
                          color="secondary" 
                          variant="outlined"
                        />
                      </TableCell>
                      <TableCell align="right">
                        <Typography variant="body1" fontWeight="bold" color="success.main">
                          {formatCurrency(activity.total_amount)}
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </CardContent>
      </Card>
    </Box>
  );
};

export default EmployeeActivity;

