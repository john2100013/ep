import React, { useState, useEffect } from 'react';
import {
  Container,
  Card,
  CardContent,
  Typography,
  Box,
  Tab,
  Tabs,
  Paper,
  Alert,
  CircularProgress,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
} from '@mui/material';
import {
  TrendingUp as TrendingUpIcon,
  Inventory as InventoryIcon,
  People as PeopleIcon,
  Receipt as ReceiptIcon,
  Assessment as AssessmentIcon,
  AttachMoney as MoneyIcon,
  Warning as WarningIcon,
  Analytics as AnalyticsIcon,
} from '@mui/icons-material';

// Component imports - all analytics components with backend data
import TopSellingItems from '../components/analytics/TopSellingItems';
import SalesPerformance from '../components/analytics/SalesPerformance';
import InventoryOverview from '../components/analytics/InventoryOverview';
import CustomerInsights from '../components/analytics/CustomerInsights';
import QuotationAnalysis from '../components/analytics/QuotationAnalysis';
import RevenueTrends from '../components/analytics/RevenueTrends';
import ProfitabilityAnalysis from '../components/analytics/ProfitabilityAnalysis';
import StockMovement from '../components/analytics/StockMovement';
import PendingActions from '../components/analytics/PendingActions';


interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`analytics-tabpanel-${index}`}
      aria-labelledby={`analytics-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ py: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

const AnalyticsScreen: React.FC = () => {
  const [tabValue, setTabValue] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState('this_month');
  const [refreshing, setRefreshing] = useState(false);

  // Overview metrics state
  const [overviewMetrics, setOverviewMetrics] = useState({
    totalSales: 0,
    totalInvoices: 0,
    totalCustomers: 0,
    totalItems: 0,
    lowStockItems: 0,
    pendingQuotations: 0,
    grossProfit: 0,
    conversionRate: 0
  });

  const handleTabChange = (_: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleDateRangeChange = (event: any) => {
    setDateRange(event.target.value);
    refreshData();
  };

  const refreshData = async () => {
    setRefreshing(true);
    try {
      // Fetch real analytics overview data from backend
      const { api } = await import('../services/api');
      const response = await api.get('/analytics/overview');

      if (response.data) {
        const data = response.data;
        setOverviewMetrics({
          totalSales: data.totalSales || 0,
          totalInvoices: data.totalInvoices || 0,
          totalCustomers: data.totalCustomers || 0,
          totalItems: data.totalItems || 0,
          lowStockItems: data.lowStockItems || 0,
          pendingQuotations: data.pendingQuotations || 0,
          grossProfit: data.grossProfit || 0,
          conversionRate: data.conversionRate || 0
        });
      }
    } catch (err: any) {
      console.error('Error fetching analytics overview:', err);
      setError('Failed to load analytics data');
      // Fallback to zero values if API fails
      setOverviewMetrics({
        totalSales: 0,
        totalInvoices: 0,
        totalCustomers: 0,
        totalItems: 0,
        lowStockItems: 0,
        pendingQuotations: 0,
        grossProfit: 0,
        conversionRate: 0
      });
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    refreshData();
  }, [dateRange]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  return (
    <Box sx={{ width: '100%', minHeight: '100vh', margin: 0 }}>
      {/* Main Content */}
      <Box sx={{ 
        width: '100%', 
        p: { xs: 2, md: 4 }, 
        overflow: 'auto',
        mt: 0
      }}>
        {/* Header */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: { xs: 'stretch', md: 'center' }, mb: 4, flexDirection: { xs: 'column', md: 'row' }, gap: { xs: 2, md: 3 } }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <AnalyticsIcon sx={{ fontSize: { xs: 28, md: 40 }, color: 'primary.main' }} />
            <Typography variant="h4" component="h1" fontWeight="bold" sx={{ fontSize: { xs: '1.5rem', md: '2.125rem' } }}>
              Business Analytics
            </Typography>
          </Box>
          
          <Box sx={{ display: 'flex', gap: { xs: 1, md: 2 }, alignItems: 'center', flexDirection: { xs: 'column', sm: 'row' } }}>
            <FormControl size="small" sx={{ minWidth: { xs: '100%', sm: 150 } }}>
              <InputLabel>Period</InputLabel>
              <Select
                value={dateRange}
                onChange={handleDateRangeChange}
                label="Period"
              >
                <MenuItem value="today">Today</MenuItem>
                <MenuItem value="this_week">This Week</MenuItem>
                <MenuItem value="this_month">This Month</MenuItem>
                <MenuItem value="this_quarter">This Quarter</MenuItem>
                <MenuItem value="this_year">This Year</MenuItem>
                <MenuItem value="last_month">Last Month</MenuItem>
                <MenuItem value="last_quarter">Last Quarter</MenuItem>
              </Select>
            </FormControl>
            
            <Button 
              variant="outlined" 
              onClick={refreshData}
              disabled={refreshing}
              sx={{ width: { xs: '100%', sm: 'auto' } }}
            >
              {refreshing ? <CircularProgress size={20} /> : 'Refresh'}
            </Button>
          </Box>
        </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Key Metrics Overview */}
      <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap', mb: 4 }}>
        <Box sx={{ flex: 1, minWidth: '280px' }}>
          <Card sx={{ height: '100%', background: 'linear-gradient(45deg, #2196F3 30%, #21CBF3 90%)' }}>
            <CardContent sx={{ color: 'white' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography variant="h4" fontWeight="bold">
                    {formatCurrency(overviewMetrics.totalSales)}
                  </Typography>
                  <Typography variant="body2" sx={{ opacity: 0.9 }}>
                    Total Sales
                  </Typography>
                </Box>
                <MoneyIcon sx={{ fontSize: 40, opacity: 0.8 }} />
              </Box>
            </CardContent>
          </Card>
        </Box>

        <Box sx={{ flex: 1, minWidth: '280px' }}>
          <Card sx={{ height: '100%', background: 'linear-gradient(45deg, #4CAF50 30%, #8BC34A 90%)' }}>
            <CardContent sx={{ color: 'white' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography variant="h4" fontWeight="bold">
                    {overviewMetrics.totalInvoices}
                  </Typography>
                  <Typography variant="body2" sx={{ opacity: 0.9 }}>
                    Total Invoices
                  </Typography>
                </Box>
                <ReceiptIcon sx={{ fontSize: 40, opacity: 0.8 }} />
              </Box>
            </CardContent>
          </Card>
        </Box>

        <Box sx={{ flex: 1, minWidth: '280px' }}>
          <Card sx={{ height: '100%', background: 'linear-gradient(45deg, #FF9800 30%, #FFC107 90%)' }}>
            <CardContent sx={{ color: 'white' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography variant="h4" fontWeight="bold">
                    {overviewMetrics.totalCustomers}
                  </Typography>
                  <Typography variant="body2" sx={{ opacity: 0.9 }}>
                    Active Customers
                  </Typography>
                </Box>
                <PeopleIcon sx={{ fontSize: 40, opacity: 0.8 }} />
              </Box>
            </CardContent>
          </Card>
        </Box>

        <Box sx={{ flex: 1, minWidth: '280px' }}>
          <Card sx={{ height: '100%', background: 'linear-gradient(45deg, #9C27B0 30%, #E91E63 90%)' }}>
            <CardContent sx={{ color: 'white' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography variant="h4" fontWeight="bold">
                    {overviewMetrics.conversionRate}%
                  </Typography>
                  <Typography variant="body2" sx={{ opacity: 0.9 }}>
                    Conversion Rate
                  </Typography>
                </Box>
                <TrendingUpIcon sx={{ fontSize: 40, opacity: 0.8 }} />
              </Box>
            </CardContent>
          </Card>
        </Box>
      </Box>

      {/* Secondary Metrics */}
      <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap', mb: 4 }}>
        <Box sx={{ flex: 1, minWidth: '300px' }}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <InventoryIcon color="primary" />
                <Box>
                  <Typography variant="h6" fontWeight="bold">
                    {overviewMetrics.totalItems}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Total Items
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Box>

        <Box sx={{ flex: 1, minWidth: '300px' }}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <WarningIcon color="warning" />
                <Box>
                  <Typography variant="h6" fontWeight="bold" color="warning.main">
                    {overviewMetrics.lowStockItems}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Low Stock Alerts
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Box>

        <Box sx={{ flex: 1, minWidth: '300px' }}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <AssessmentIcon color="secondary" />
                <Box>
                  <Typography variant="h6" fontWeight="bold">
                    {formatCurrency(overviewMetrics.grossProfit)}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Gross Profit
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Box>
      </Box>

      {/* Analytics Tabs */}
      <Paper sx={{ mb: 4 }}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs 
            value={tabValue} 
            onChange={handleTabChange}
            variant="scrollable"
            scrollButtons="auto"
            sx={{ px: 2 }}
          >
            <Tab label="Top Selling Items" />
            <Tab label="Sales Performance" />
            <Tab label="Inventory Overview" />
            <Tab label="Customer Insights" />
            <Tab label="Quotation Analysis" />
            <Tab label="Revenue Trends" />
            <Tab label="Profitability" />
            <Tab label="Stock Movement" />
            <Tab label="Pending Actions" />
          </Tabs>
        </Box>

        <TabPanel value={tabValue} index={0}>
          <TopSellingItems dateRange={dateRange} />
        </TabPanel>

        <TabPanel value={tabValue} index={1}>
          <SalesPerformance dateRange={dateRange} />
        </TabPanel>

        <TabPanel value={tabValue} index={2}>
          <InventoryOverview dateRange={dateRange} />
        </TabPanel>

        <TabPanel value={tabValue} index={3}>
          <CustomerInsights dateRange={dateRange} />
        </TabPanel>

        <TabPanel value={tabValue} index={4}>
          <QuotationAnalysis dateRange={dateRange} />
        </TabPanel>

        <TabPanel value={tabValue} index={5}>
          <RevenueTrends dateRange={dateRange} />
        </TabPanel>

        <TabPanel value={tabValue} index={6}>
          <ProfitabilityAnalysis dateRange={dateRange} />
        </TabPanel>

        <TabPanel value={tabValue} index={7}>
          <StockMovement dateRange={dateRange} />
        </TabPanel>

        <TabPanel value={tabValue} index={8}>
          <PendingActions dateRange={dateRange} />
        </TabPanel>
      </Paper>
      </Box>
    </Box>
  );
};

export default AnalyticsScreen;