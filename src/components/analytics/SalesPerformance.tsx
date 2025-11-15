import React, { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  LinearProgress,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from '@mui/material';
import {
  TrendingUp as TrendingUpIcon,
  Receipt as ReceiptIcon,
  AttachMoney as MoneyIcon,
  TrackChanges as TargetIcon,
  Assessment as AssessmentIcon,
} from '@mui/icons-material';

interface SalesPerformanceProps {
  dateRange: string;
}

interface SalesMetrics {
  totalSales: number;
  totalInvoices: number;
  averageOrderValue: number;
  targetSales: number;
  grossProfit: number;
  profitMargin: number;
  salesGrowth: number;
  dailySales: DailySales[];
}

interface DailySales {
  date: string;
  sales: number;
  invoices: number;
  profit: number;
}

const SalesPerformance: React.FC<SalesPerformanceProps> = ({ dateRange }) => {
  const [salesMetrics, setSalesMetrics] = useState<SalesMetrics>({
    totalSales: 0,
    totalInvoices: 0,
    averageOrderValue: 0,
    targetSales: 0,
    grossProfit: 0,
    profitMargin: 0,
    salesGrowth: 0,
    dailySales: []
  });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatPercentage = (value: number) => {
    return `${value >= 0 ? '+' : ''}${value.toFixed(1)}%`;
  };

  const getProgressColor = (progress: number) => {
    if (progress >= 100) return 'success';
    if (progress >= 75) return 'info';
    if (progress >= 50) return 'warning';
    return 'error';
  };

  useEffect(() => {
    loadSalesPerformance();
  }, [dateRange]);

  const loadSalesPerformance = async () => {
    try {
      // Mock data - replace with actual API call
      const mockData: SalesMetrics = {
        totalSales: 256780,
        totalInvoices: 89,
        averageOrderValue: 2885,
        targetSales: 300000,
        grossProfit: 89370,
        profitMargin: 34.8,
        salesGrowth: 12.5,
        dailySales: [
          { date: '2024-11-01', sales: 12500, invoices: 4, profit: 4200 },
          { date: '2024-11-02', sales: 18200, invoices: 6, profit: 6100 },
          { date: '2024-11-03', sales: 9800, invoices: 3, profit: 3300 },
          { date: '2024-11-04', sales: 22100, invoices: 8, profit: 7400 },
          { date: '2024-11-05', sales: 15600, invoices: 5, profit: 5200 },
          { date: '2024-11-06', sales: 28300, invoices: 10, profit: 9500 },
          { date: '2024-11-07', sales: 19400, invoices: 7, profit: 6500 }
        ]
      };

      setSalesMetrics(mockData);
    } catch (error) {
      console.error('Error loading sales performance:', error);
    }
  };

  const targetProgress = (salesMetrics.totalSales / salesMetrics.targetSales) * 100;

  return (
    <Box>
      <Typography variant="h5" fontWeight="bold" gutterBottom>
        Sales Performance Overview
      </Typography>

      {/* Key Performance Indicators */}
      <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap', mb: 4 }}>
        <Box sx={{ flex: 1, minWidth: '280px' }}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                <MoneyIcon color="primary" sx={{ fontSize: 32 }} />
                <Typography variant="h4" fontWeight="bold" color="primary">
                  {formatCurrency(salesMetrics.totalSales)}
                </Typography>
              </Box>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Total Sales
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <TrendingUpIcon color="success" fontSize="small" />
                <Typography variant="body2" color="success.main">
                  {formatPercentage(salesMetrics.salesGrowth)} vs last period
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Box>

        <Box sx={{ flex: 1, minWidth: '280px' }}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                <ReceiptIcon color="secondary" sx={{ fontSize: 32 }} />
                <Typography variant="h4" fontWeight="bold" color="secondary">
                  {salesMetrics.totalInvoices}
                </Typography>
              </Box>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Total Invoices
              </Typography>
              <Typography variant="body2" color="text.primary">
                Avg: {formatCurrency(salesMetrics.averageOrderValue)} per invoice
              </Typography>
            </CardContent>
          </Card>
        </Box>

        <Box sx={{ flex: 1, minWidth: '280px' }}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                <AssessmentIcon color="success" sx={{ fontSize: 32 }} />
                <Typography variant="h4" fontWeight="bold" color="success.main">
                  {formatCurrency(salesMetrics.grossProfit)}
                </Typography>
              </Box>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Gross Profit
              </Typography>
              <Typography variant="body2" color="success.main">
                {salesMetrics.profitMargin}% margin
              </Typography>
            </CardContent>
          </Card>
        </Box>

        <Box sx={{ flex: 1, minWidth: '280px' }}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                <TargetIcon color="warning" sx={{ fontSize: 32 }} />
                <Typography variant="h4" fontWeight="bold" color="warning.main">
                  {targetProgress.toFixed(0)}%
                </Typography>
              </Box>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Target Achievement
              </Typography>
              <LinearProgress
                variant="determinate"
                value={Math.min(targetProgress, 100)}
                color={getProgressColor(targetProgress)}
                sx={{ height: 6, borderRadius: 3 }}
              />
            </CardContent>
          </Card>
        </Box>
      </Box>

      {/* Target vs Actual */}
      <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap', mb: 4 }}>
        <Box sx={{ flex: 1, minWidth: '400px' }}>
          <Card>
            <CardContent>
              <Typography variant="h6" fontWeight="bold" gutterBottom>
                Sales vs Target
              </Typography>
              <Box sx={{ mb: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body2">Actual Sales</Typography>
                  <Typography variant="body2" fontWeight="bold">
                    {formatCurrency(salesMetrics.totalSales)}
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body2">Target Sales</Typography>
                  <Typography variant="body2" fontWeight="bold">
                    {formatCurrency(salesMetrics.targetSales)}
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                  <Typography variant="body2">Remaining</Typography>
                  <Typography 
                    variant="body2" 
                    fontWeight="bold"
                    color={targetProgress >= 100 ? 'success.main' : 'warning.main'}
                  >
                    {formatCurrency(Math.max(0, salesMetrics.targetSales - salesMetrics.totalSales))}
                  </Typography>
                </Box>
                <LinearProgress
                  variant="determinate"
                  value={Math.min(targetProgress, 100)}
                  color={getProgressColor(targetProgress)}
                  sx={{ height: 8, borderRadius: 4 }}
                />
              </Box>
              {targetProgress >= 100 ? (
                <Alert severity="success" sx={{ mt: 2 }}>
                  🎉 Congratulations! Target achieved with {formatPercentage(targetProgress - 100)} extra!
                </Alert>
              ) : (
                <Alert severity="info" sx={{ mt: 2 }}>
                  {formatCurrency(salesMetrics.targetSales - salesMetrics.totalSales)} more needed to reach target
                </Alert>
              )}
            </CardContent>
          </Card>
        </Box>

        <Box sx={{ flex: 1, minWidth: '400px' }}>
          <Card>
            <CardContent>
              <Typography variant="h6" fontWeight="bold" gutterBottom>
                Profitability Breakdown
              </Typography>
              <Box sx={{ mb: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body2">Total Revenue</Typography>
                  <Typography variant="body2" fontWeight="bold">
                    {formatCurrency(salesMetrics.totalSales)}
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body2">Cost of Goods</Typography>
                  <Typography variant="body2" fontWeight="bold" color="error.main">
                    {formatCurrency(salesMetrics.totalSales - salesMetrics.grossProfit)}
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                  <Typography variant="body2">Gross Profit</Typography>
                  <Typography variant="body2" fontWeight="bold" color="success.main">
                    {formatCurrency(salesMetrics.grossProfit)}
                  </Typography>
                </Box>
                <LinearProgress
                  variant="determinate"
                  value={salesMetrics.profitMargin}
                  color="success"
                  sx={{ height: 8, borderRadius: 4 }}
                />
                <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                  Profit Margin: {salesMetrics.profitMargin}%
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Box>
      </Box>

      {/* Daily Sales Performance */}
      <Card>
        <CardContent>
          <Typography variant="h6" fontWeight="bold" gutterBottom>
            Daily Sales Performance
          </Typography>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Date</TableCell>
                  <TableCell align="right">Sales</TableCell>
                  <TableCell align="center">Invoices</TableCell>
                  <TableCell align="right">Profit</TableCell>
                  <TableCell align="right">Avg Order Value</TableCell>
                  <TableCell align="center">Performance</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {salesMetrics.dailySales.map((day) => {
                  const avgOrderValue = day.sales / day.invoices;
                  const profitMargin = (day.profit / day.sales) * 100;
                  const performance = day.sales > 20000 ? 'Excellent' : day.sales > 15000 ? 'Good' : day.sales > 10000 ? 'Average' : 'Below Average';
                  const performanceColor = day.sales > 20000 ? 'success' : day.sales > 15000 ? 'info' : day.sales > 10000 ? 'warning' : 'error';
                  
                  return (
                    <TableRow key={day.date} hover>
                      <TableCell>
                        {new Date(day.date).toLocaleDateString('en-GB', {
                          weekday: 'short',
                          month: 'short',
                          day: 'numeric'
                        })}
                      </TableCell>
                      <TableCell align="right">
                        <Typography variant="body2" fontWeight="bold">
                          {formatCurrency(day.sales)}
                        </Typography>
                      </TableCell>
                      <TableCell align="center">
                        <Typography variant="body2">
                          {day.invoices}
                        </Typography>
                      </TableCell>
                      <TableCell align="right">
                        <Typography variant="body2" color="success.main">
                          {formatCurrency(day.profit)}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          ({profitMargin.toFixed(1)}%)
                        </Typography>
                      </TableCell>
                      <TableCell align="right">
                        <Typography variant="body2">
                          {formatCurrency(avgOrderValue)}
                        </Typography>
                      </TableCell>
                      <TableCell align="center">
                        <Typography 
                          variant="caption" 
                          sx={{ 
                            px: 1, 
                            py: 0.5, 
                            borderRadius: 1, 
                            bgcolor: `${performanceColor}.light`,
                            color: `${performanceColor}.dark`
                          }}
                        >
                          {performance}
                        </Typography>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>
    </Box>
  );
};

export default SalesPerformance;