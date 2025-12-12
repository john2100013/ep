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
  LinearProgress,
  Grid,
} from '@mui/material';
import { TrendingUp, TrendingDown } from '@mui/icons-material';
import * as salonApi from '../../../services/salonApi';

interface BestWorstPerformersProps {
  filter: 'day' | 'week' | 'month';
}

interface Performer {
  item_id?: number;
  item_name?: string;
  service_id?: number;
  service_name?: string;
  total_quantity?: number;
  total_revenue: number;
  count?: number;
}

interface PerformersData {
  products: {
    best: Performer[];
    worst: Performer[];
  };
  services: {
    best: Performer[];
    worst: Performer[];
  };
}

const BestWorstPerformers: React.FC<BestWorstPerformersProps> = ({ filter }) => {
  const [data, setData] = useState<PerformersData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    loadData();
  }, [filter]);

  const loadData = async () => {
    try {
      console.log(`🏆 [BestWorstPerformers] Loading data with filter: ${filter}`);
      setLoading(true);
      setError('');
      const response = await salonApi.getBestWorstPerformers({ filter });
      console.log(`🏆 [BestWorstPerformers] API Response:`, response);
      console.log(`🏆 [BestWorstPerformers] Response.data:`, response.data);
      
      // Handle different response formats
      let data: PerformersData | null = null;
      if (response.data?.success && response.data?.data) {
        data = response.data.data;
      } else if (response.data?.data) {
        data = response.data.data;
      } else if (response.data?.products && response.data?.services) {
        data = response.data;
      }
      
      if (data) {
        console.log(`🏆 [BestWorstPerformers] Loaded performers data:`, {
          products: { best: data.products.best.length, worst: data.products.worst.length },
          services: { best: data.services.best.length, worst: data.services.worst.length }
        });
        setData(data);
      } else {
        console.error(`🏆 [BestWorstPerformers] Invalid response format:`, response.data);
        setError('Failed to load performers data');
      }
    } catch (err: any) {
      console.error('❌ [BestWorstPerformers] Error loading data:', err);
      setError(err.response?.data?.message || 'Failed to load performers data');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return `KES ${Number(amount || 0).toFixed(2)}`;
  };

  const SimpleBarChart: React.FC<{ items: Performer[]; maxValue: number; type: 'product' | 'service' }> = ({ 
    items, 
    maxValue,
    type 
  }) => {
    if (items.length === 0) {
      return (
        <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 2 }}>
          No data available
        </Typography>
      );
    }

    return (
      <Box sx={{ mt: 2 }}>
        {items.map((item, index) => {
          const value = type === 'product' ? item.total_revenue : item.total_revenue;
          const percentage = maxValue > 0 ? (value / maxValue) * 100 : 0;
          const name = type === 'product' ? item.item_name : item.service_name;
          
          return (
            <Box key={index} sx={{ mb: 2 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                <Typography variant="body2" sx={{ fontWeight: 'bold', flex: 1 }}>
                  {name || 'N/A'}
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 'bold', color: 'primary.main' }}>
                  {formatCurrency(value)}
                </Typography>
              </Box>
              <LinearProgress
                variant="determinate"
                value={percentage}
                sx={{
                  height: 20,
                  borderRadius: 1,
                  backgroundColor: '#e0e0e0',
                  '& .MuiLinearProgress-bar': {
                    borderRadius: 1,
                    backgroundColor: index < 3 ? '#4caf50' : '#ff9800',
                  },
                }}
              />
            </Box>
          );
        })}
      </Box>
    );
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!data) {
    return (
      <Alert severity="info">No data available</Alert>
    );
  }

  const maxProductRevenue = Math.max(
    ...data.products.best.map(p => p.total_revenue),
    ...data.products.worst.map(p => p.total_revenue),
    1
  );

  const maxServiceRevenue = Math.max(
    ...data.services.best.map(s => s.total_revenue),
    ...data.services.worst.map(s => s.total_revenue),
    1
  );

  return (
    <Box>
      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      <Grid container spacing={3}>
        {/* Best Products */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <TrendingUp sx={{ color: 'success.main', fontSize: 30 }} />
                <Typography variant="h6" fontWeight="bold">
                  Best Performing Products
                </Typography>
              </Box>
              <SimpleBarChart
                items={data.products.best}
                maxValue={maxProductRevenue}
                type="product"
              />
              {data.products.best.length > 0 && (
                <TableContainer sx={{ mt: 2 }}>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell><strong>Product</strong></TableCell>
                        <TableCell align="right"><strong>Qty</strong></TableCell>
                        <TableCell align="right"><strong>Revenue</strong></TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {data.products.best.map((product, idx) => (
                        <TableRow key={idx}>
                          <TableCell>{product.item_name}</TableCell>
                          <TableCell align="right">{product.total_quantity?.toFixed(2) || 0}</TableCell>
                          <TableCell align="right" sx={{ fontWeight: 'bold', color: 'success.main' }}>
                            {formatCurrency(product.total_revenue)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Worst Products */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <TrendingDown sx={{ color: 'error.main', fontSize: 30 }} />
                <Typography variant="h6" fontWeight="bold">
                  Worst Performing Products
                </Typography>
              </Box>
              <SimpleBarChart
                items={data.products.worst}
                maxValue={maxProductRevenue}
                type="product"
              />
              {data.products.worst.length > 0 && (
                <TableContainer sx={{ mt: 2 }}>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell><strong>Product</strong></TableCell>
                        <TableCell align="right"><strong>Qty</strong></TableCell>
                        <TableCell align="right"><strong>Revenue</strong></TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {data.products.worst.map((product, idx) => (
                        <TableRow key={idx}>
                          <TableCell>{product.item_name}</TableCell>
                          <TableCell align="right">{product.total_quantity?.toFixed(2) || 0}</TableCell>
                          <TableCell align="right" sx={{ fontWeight: 'bold', color: 'error.main' }}>
                            {formatCurrency(product.total_revenue)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Best Services */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <TrendingUp sx={{ color: 'success.main', fontSize: 30 }} />
                <Typography variant="h6" fontWeight="bold">
                  Best Performing Services
                </Typography>
              </Box>
              <SimpleBarChart
                items={data.services.best}
                maxValue={maxServiceRevenue}
                type="service"
              />
              {data.services.best.length > 0 && (
                <TableContainer sx={{ mt: 2 }}>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell><strong>Service</strong></TableCell>
                        <TableCell align="right"><strong>Count</strong></TableCell>
                        <TableCell align="right"><strong>Revenue</strong></TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {data.services.best.map((service, idx) => (
                        <TableRow key={idx}>
                          <TableCell>{service.service_name}</TableCell>
                          <TableCell align="right">{service.count || 0}</TableCell>
                          <TableCell align="right" sx={{ fontWeight: 'bold', color: 'success.main' }}>
                            {formatCurrency(service.total_revenue)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Worst Services */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <TrendingDown sx={{ color: 'error.main', fontSize: 30 }} />
                <Typography variant="h6" fontWeight="bold">
                  Worst Performing Services
                </Typography>
              </Box>
              <SimpleBarChart
                items={data.services.worst}
                maxValue={maxServiceRevenue}
                type="service"
              />
              {data.services.worst.length > 0 && (
                <TableContainer sx={{ mt: 2 }}>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell><strong>Service</strong></TableCell>
                        <TableCell align="right"><strong>Count</strong></TableCell>
                        <TableCell align="right"><strong>Revenue</strong></TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {data.services.worst.map((service, idx) => (
                        <TableRow key={idx}>
                          <TableCell>{service.service_name}</TableCell>
                          <TableCell align="right">{service.count || 0}</TableCell>
                          <TableCell align="right" sx={{ fontWeight: 'bold', color: 'error.main' }}>
                            {formatCurrency(service.total_revenue)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default BestWorstPerformers;

