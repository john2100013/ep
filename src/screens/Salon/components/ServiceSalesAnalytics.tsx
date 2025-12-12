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
  CircularProgress,
  Alert,
} from '@mui/material';
import * as salonApi from '../../../services/salonApi';

interface ServiceSalesAnalyticsProps {
  filter: 'day' | 'week' | 'month';
}

interface Service {
  service_id: number;
  service_name: string;
  count: number;
  total_revenue: number;
  avg_price: number;
}

const ServiceSalesAnalytics: React.FC<ServiceSalesAnalyticsProps> = ({ filter }) => {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    loadData();
  }, [filter]);

  const loadData = async () => {
    try {
      console.log(`💇 [ServiceSalesAnalytics] Loading data with filter: ${filter}`);
      setLoading(true);
      setError('');
      const response = await salonApi.getServiceSalesAnalytics({ filter });
      console.log(`💇 [ServiceSalesAnalytics] API Response:`, response);
      console.log(`💇 [ServiceSalesAnalytics] Response.data:`, response.data);
      
      // Handle different response formats
      let services: Service[] = [];
      if (response.data?.success && response.data?.data) {
        services = Array.isArray(response.data.data) ? response.data.data : [];
      } else if (Array.isArray(response.data)) {
        services = response.data;
      } else if (response.data?.data && Array.isArray(response.data.data)) {
        services = response.data.data;
      }
      
      console.log(`💇 [ServiceSalesAnalytics] Loaded ${services.length} services`);
      setServices(services);
    } catch (err: any) {
      console.error('❌ [ServiceSalesAnalytics] Error loading data:', err);
      setError(err.response?.data?.message || 'Failed to load service analytics');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return `KES ${Number(amount || 0).toFixed(2)}`;
  };

  const totalRevenue = services.reduce((sum, srv) => sum + srv.total_revenue, 0);
  const totalCount = services.reduce((sum, srv) => sum + srv.count, 0);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap' }}>
        <Card sx={{ flex: 1, minWidth: 200 }}>
          <CardContent>
            <Typography variant="body2" color="text.secondary">Total Services</Typography>
            <Typography variant="h4" fontWeight="bold">{services.length}</Typography>
          </CardContent>
        </Card>
        <Card sx={{ flex: 1, minWidth: 200 }}>
          <CardContent>
            <Typography variant="body2" color="text.secondary">Total Count</Typography>
            <Typography variant="h4" fontWeight="bold">{totalCount}</Typography>
          </CardContent>
        </Card>
        <Card sx={{ flex: 1, minWidth: 200 }}>
          <CardContent>
            <Typography variant="body2" color="text.secondary">Total Revenue</Typography>
            <Typography variant="h4" fontWeight="bold" color="primary.main">
              {formatCurrency(totalRevenue)}
            </Typography>
          </CardContent>
        </Card>
      </Box>

      <Card>
        <CardContent>
          <Typography variant="h6" fontWeight="bold" gutterBottom>
            Service Sales Breakdown
          </Typography>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell><strong>Service Name</strong></TableCell>
                  <TableCell align="right"><strong>Count</strong></TableCell>
                  <TableCell align="right"><strong>Avg Price</strong></TableCell>
                  <TableCell align="right"><strong>Total Revenue</strong></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {services.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} align="center" sx={{ py: 4 }}>
                      <Typography color="text.secondary">No service sales found</Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  services.map((service) => (
                    <TableRow key={service.service_id} hover>
                      <TableCell sx={{ fontWeight: 'bold' }}>{service.service_name}</TableCell>
                      <TableCell align="right">{service.count}</TableCell>
                      <TableCell align="right">{formatCurrency(service.avg_price)}</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 'bold', color: 'primary.main' }}>
                        {formatCurrency(service.total_revenue)}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>
    </Box>
  );
};

export default ServiceSalesAnalytics;

