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
  LinearProgress,
  Chip
} from '@mui/material';
import {
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  AttachMoney as MoneyIcon
} from '@mui/icons-material';

interface ProfitabilityAnalysisProps {
  dateRange: string;
}

interface ProfitabilityItem {
  id: number;
  itemName: string;
  category: string;
  revenue: number;
  cost: number;
  grossProfit: number;
  marginPercentage: number;
  unitsSold: number;
  profitPerUnit: number;
  profitTrend: 'increasing' | 'decreasing' | 'stable';
}

interface ProfitabilitySummary {
  totalRevenue: number;
  totalCost: number;
  totalGrossProfit: number;
  overallMargin: number;
  bestPerformingCategory: string;
  worstPerformingCategory: string;
}

const ProfitabilityAnalysis: React.FC<ProfitabilityAnalysisProps> = ({ dateRange }) => {
  const [profitabilityData, setProfitabilityData] = useState<ProfitabilityItem[]>([]);
  const [summary, setSummary] = useState<ProfitabilitySummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchProfitabilityAnalysis();
  }, [dateRange]);

  const fetchProfitabilityAnalysis = async () => {
    try {
      setLoading(true);
      const { api } = await import('../../services/api');
      const response = await api.get('/analytics/profitability-analysis');
      
      if (response.data) {
        setProfitabilityData(response.data.items || []);
        setSummary(response.data.summary || null);
      }
    } catch (err: any) {
      console.error('Error fetching profitability analysis:', err);
      setError(err?.response?.data?.error || err?.message || 'Failed to fetch profitability analysis');
      setProfitabilityData([]);
      setSummary(null);
    } finally {
      setLoading(false);
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'increasing': return <TrendingUpIcon color="success" fontSize="small" />;
      case 'decreasing': return <TrendingDownIcon color="error" fontSize="small" />;
      default: return <MoneyIcon color="warning" fontSize="small" />;
    }
  };

  const getMarginColor = (margin: number) => {
    if (margin >= 30) return 'success';
    if (margin >= 15) return 'warning';
    return 'error';
  };

  const getTrendColor = (trend: string) => {
    switch (trend) {
      case 'increasing': return 'success';
      case 'decreasing': return 'error';
      default: return 'warning';
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
        Profitability Analysis
      </Typography>
      
      <Box display="flex" gap={3} flexDirection={{ xs: 'column', md: 'row' }}>
        <Box flex={1}>
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Profitability Summary
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
                    <Typography variant="body2">Total Cost</Typography>
                    <Typography variant="body2" color="error.main" fontWeight="bold">
                      ${summary.totalCost.toLocaleString()}
                    </Typography>
                  </Box>
                  
                  <Box display="flex" justifyContent="space-between" sx={{ mb: 2 }}>
                    <Typography variant="body2">Gross Profit</Typography>
                    <Typography variant="body2" color="success.main" fontWeight="bold">
                      ${summary.totalGrossProfit.toLocaleString()}
                    </Typography>
                  </Box>
                  
                  <Box sx={{ mb: 2 }}>
                    <Box display="flex" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
                      <Typography variant="body2">Overall Margin</Typography>
                      <Typography variant="h6" color={`${getMarginColor(summary.overallMargin)}.main`}>
                        {summary.overallMargin.toFixed(1)}%
                      </Typography>
                    </Box>
                    <LinearProgress 
                      variant="determinate" 
                      value={Math.min(summary.overallMargin, 100)} 
                      color={getMarginColor(summary.overallMargin) as any}
                      sx={{ height: 8, borderRadius: 1 }}
                    />
                  </Box>
                  
                  <Box display="flex" justifyContent="space-between" sx={{ mb: 1 }}>
                    <Typography variant="body2">Best Category</Typography>
                    <Typography variant="body2" color="success.main" fontWeight="bold">
                      {summary.bestPerformingCategory}
                    </Typography>
                  </Box>
                  
                  <Box display="flex" justifyContent="space-between">
                    <Typography variant="body2">Needs Attention</Typography>
                    <Typography variant="body2" color="error.main" fontWeight="bold">
                      {summary.worstPerformingCategory}
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
                Item Profitability Breakdown
              </Typography>
              <TableContainer component={Paper} variant="outlined">
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Item</TableCell>
                      <TableCell align="right">Revenue</TableCell>
                      <TableCell align="right">Cost</TableCell>
                      <TableCell align="right">Profit</TableCell>
                      <TableCell align="center">Margin</TableCell>
                      <TableCell align="center">Trend</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {profitabilityData.slice(0, 10).map((item) => (
                      <TableRow key={item.id}>
                        <TableCell>
                          <Box>
                            <Typography variant="body2" fontWeight="medium">
                              {item.itemName}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {item.category} • {item.unitsSold} units
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell align="right">
                          ${item.revenue.toLocaleString()}
                        </TableCell>
                        <TableCell align="right">
                          <Typography variant="body2" color="error.main">
                            ${item.cost.toLocaleString()}
                          </Typography>
                        </TableCell>
                        <TableCell align="right">
                          <Typography variant="body2" color="success.main" fontWeight="medium">
                            ${item.grossProfit.toLocaleString()}
                          </Typography>
                        </TableCell>
                        <TableCell align="center">
                          <Box>
                            <Chip
                              label={`${item.marginPercentage.toFixed(1)}%`}
                              color={getMarginColor(item.marginPercentage) as any}
                              size="small"
                            />
                            <LinearProgress
                              variant="determinate"
                              value={Math.min(item.marginPercentage, 100)}
                              color={getMarginColor(item.marginPercentage) as any}
                              sx={{ 
                                mt: 0.5, 
                                height: 4, 
                                borderRadius: 1,
                                width: '100%'
                              }}
                            />
                          </Box>
                        </TableCell>
                        <TableCell align="center">
                          <Box display="flex" alignItems="center" justifyContent="center" gap={0.5}>
                            {getTrendIcon(item.profitTrend)}
                            <Chip
                              label={item.profitTrend}
                              color={getTrendColor(item.profitTrend) as any}
                              size="small"
                              variant="outlined"
                            />
                          </Box>
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

export default ProfitabilityAnalysis;