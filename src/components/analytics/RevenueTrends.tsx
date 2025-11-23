import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  Card, 
  CardContent,
  CircularProgress,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip
} from '@mui/material';
import {
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  TrendingFlat as TrendingFlatIcon
} from '@mui/icons-material';

interface RevenueTrendsProps {
  dateRange: string;
}

interface MonthlyRevenue {
  month: string;
  revenue: number;
  growth: number;
  transactions: number;
  averageOrderValue: number;
}

interface RevenueSummary {
  totalRevenue: number;
  averageGrowth: number;
  bestMonth: string;
  totalTransactions: number;
}

const RevenueTrends: React.FC<RevenueTrendsProps> = ({ dateRange }) => {
  const [monthlyData, setMonthlyData] = useState<MonthlyRevenue[]>([]);
  const [summary, setSummary] = useState<RevenueSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchRevenueTrends();
  }, [dateRange]);

  const fetchRevenueTrends = async () => {
    try {
      setLoading(true);
      const { api } = await import('../../services/api');
      const response = await api.get('/analytics/revenue-trends');
      
      if (response.data) {
        setMonthlyData(response.data.monthlyData || response.data.monthly || []);
        setSummary(response.data.summary || null);
      }
    } catch (err: any) {
      console.error('Error fetching revenue trends:', err);
      setError(err?.response?.data?.error || err?.message || 'Failed to fetch revenue trends');
      setMonthlyData([]);
      setSummary(null);
    } finally {
      setLoading(false);
    }
  };

  const getTrendIcon = (growth: number) => {
    if (growth > 5) return <TrendingUpIcon color="success" />;
    if (growth < -5) return <TrendingDownIcon color="error" />;
    return <TrendingFlatIcon color="warning" />;
  };

  const getTrendColor = (growth: number) => {
    if (growth > 5) return 'success';
    if (growth < -5) return 'error';
    return 'warning';
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
        Revenue Trends
      </Typography>
      
      <Box display="flex" gap={3} flexDirection={{ xs: 'column', md: 'row' }}>
        <Box flex={1}>
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Revenue Summary
              </Typography>
              {summary && (
                <Box>
                  <Box display="flex" justifyContent="space-between" sx={{ mb: 2 }}>
                    <Typography variant="body2">Total Revenue</Typography>
                    <Typography variant="h6" color="primary">
                      ${summary.totalRevenue.toLocaleString()}
                    </Typography>
                  </Box>
                  
                  <Box display="flex" justifyContent="space-between" sx={{ mb: 2 }}>
                    <Typography variant="body2">Average Growth</Typography>
                    <Box display="flex" alignItems="center" gap={1}>
                      {getTrendIcon(summary.averageGrowth)}
                      <Typography variant="body2" color={`${getTrendColor(summary.averageGrowth)}.main`}>
                        {summary.averageGrowth > 0 ? '+' : ''}{summary.averageGrowth.toFixed(1)}%
                      </Typography>
                    </Box>
                  </Box>
                  
                  <Box display="flex" justifyContent="space-between" sx={{ mb: 2 }}>
                    <Typography variant="body2">Best Month</Typography>
                    <Typography variant="body2" fontWeight="bold">
                      {summary.bestMonth}
                    </Typography>
                  </Box>
                  
                  <Box display="flex" justifyContent="space-between">
                    <Typography variant="body2">Total Transactions</Typography>
                    <Typography variant="body2" fontWeight="bold">
                      {summary.totalTransactions.toLocaleString()}
                    </Typography>
                  </Box>
                </Box>
              )}
            </CardContent>
          </Card>
        </Box>
        
        <Box flex={2}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Monthly Revenue Breakdown
              </Typography>
              <TableContainer component={Paper} variant="outlined">
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Month</TableCell>
                      <TableCell align="right">Revenue</TableCell>
                      <TableCell align="center">Growth</TableCell>
                      <TableCell align="right">Transactions</TableCell>
                      <TableCell align="right">Avg Order</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {monthlyData.map((month) => (
                      <TableRow key={month.month}>
                        <TableCell>{month.month}</TableCell>
                        <TableCell align="right">
                          ${month.revenue.toLocaleString()}
                        </TableCell>
                        <TableCell align="center">
                          <Box display="flex" alignItems="center" justifyContent="center" gap={0.5}>
                            {getTrendIcon(month.growth)}
                            <Chip
                              label={`${month.growth > 0 ? '+' : ''}${month.growth.toFixed(1)}%`}
                              color={getTrendColor(month.growth) as any}
                              size="small"
                            />
                          </Box>
                        </TableCell>
                        <TableCell align="right">
                          {month.transactions.toLocaleString()}
                        </TableCell>
                        <TableCell align="right">
                          ${month.averageOrderValue.toFixed(2)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Box>
      </Box>
    </Box>
  );
};

export default RevenueTrends;