import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Tabs,
  Tab,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Alert,
  CircularProgress,
} from '@mui/material';
import { Analytics as AnalyticsIcon } from '@mui/icons-material';
import * as salonApi from '../../services/salonApi';
import InvoiceAnalytics from './components/InvoiceAnalytics';
import EmployeeServiceAnalytics from './components/EmployeeServiceAnalytics';
import ProductSalesAnalytics from './components/ProductSalesAnalytics';
import ServiceSalesAnalytics from './components/ServiceSalesAnalytics';
import LowStockAlert from './components/LowStockAlert';
import BestWorstPerformers from './components/BestWorstPerformers';

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
      {value === index && <Box sx={{ pt: 3 }}>{children}</Box>}
    </div>
  );
}

const PerformanceAnalyticsSalonScreen: React.FC = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [filter, setFilter] = useState<'day' | 'week' | 'month'>('day');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  return (
    <Box sx={{ p: { xs: 2, md: 3 } }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <AnalyticsIcon sx={{ fontSize: 40, color: 'primary.main' }} />
          <Typography variant="h4" fontWeight="bold">
            Performance Analytics
          </Typography>
        </Box>
        <FormControl size="small" sx={{ minWidth: 150 }}>
          <InputLabel>Time Period</InputLabel>
          <Select
            value={filter}
            label="Time Period"
            onChange={(e) => setFilter(e.target.value as 'day' | 'week' | 'month')}
          >
            <MenuItem value="day">Today</MenuItem>
            <MenuItem value="week">This Week</MenuItem>
            <MenuItem value="month">This Month</MenuItem>
          </Select>
        </FormControl>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Tabs value={activeTab} onChange={handleTabChange} variant="scrollable" scrollButtons="auto">
            <Tab label="Invoices" />
            <Tab label="Employees" />
            <Tab label="Products" />
            <Tab label="Services" />
            <Tab label="Low Stock" />
            <Tab label="Best/Worst" />
          </Tabs>
        </CardContent>
      </Card>

      <TabPanel value={activeTab} index={0}>
        <InvoiceAnalytics filter={filter} />
      </TabPanel>

      <TabPanel value={activeTab} index={1}>
        <EmployeeServiceAnalytics filter={filter} />
      </TabPanel>

      <TabPanel value={activeTab} index={2}>
        <ProductSalesAnalytics filter={filter} />
      </TabPanel>

      <TabPanel value={activeTab} index={3}>
        <ServiceSalesAnalytics filter={filter} />
      </TabPanel>

      <TabPanel value={activeTab} index={4}>
        <LowStockAlert />
      </TabPanel>

      <TabPanel value={activeTab} index={5}>
        <BestWorstPerformers filter={filter} />
      </TabPanel>
    </Box>
  );
};

export default PerformanceAnalyticsSalonScreen;

