import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  AppBar,
  Toolbar,
  Typography,
  Tabs,
  Tab,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Button,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Card,
  CardContent,
  Alert,
  CircularProgress,
  Divider,
} from '@mui/material';
import {
  Close as CloseIcon,
  Visibility as ViewIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
} from '@mui/icons-material';
import { ServiceBillingAPI } from '../../services/serviceBillingApi';

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
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  );
}

const ServiceBillingAnalyticsScreen: React.FC = () => {
  const [currentTab, setCurrentTab] = useState(0);
  const [dateFilter, setDateFilter] = useState<'today' | 'week' | 'month' | 'custom'>('today');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Services Analytics
  const [servicesData, setServicesData] = useState<any[]>([]);

  // Employee Analytics
  const [employeesData, setEmployeesData] = useState<any[]>([]);
  const [selectedEmployee, setSelectedEmployee] = useState<any>(null);
  const [employeeModalOpen, setEmployeeModalOpen] = useState(false);
  const [employeeModalType, setEmployeeModalType] = useState<'customers' | 'services'>('customers');

  // Product Analytics
  const [productsData, setProductsData] = useState<any[]>([]);

  // Performance Analytics
  const [performanceData, setPerformanceData] = useState<any>(null);
  const [topEmployeeCustomersOpen, setTopEmployeeCustomersOpen] = useState(false);
  const [selectedTopEmployee, setSelectedTopEmployee] = useState<any>(null);

  // Returning Customers
  const [returningCustomers, setReturningCustomers] = useState<any[]>([]);

  // Helper function to get date range
  const getDateRange = () => {
    const now = new Date();
    let start: string = '';
    let end: string = '';

    switch (dateFilter) {
      case 'today':
        // Today from midnight
        const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        todayStart.setHours(0, 0, 0, 0);
        start = todayStart.toISOString();
        end = now.toISOString();
        break;
      case 'week':
        // This week from beginning of week (Sunday)
        const weekStart = new Date(now);
        weekStart.setDate(now.getDate() - now.getDay()); // Start of week (Sunday)
        weekStart.setHours(0, 0, 0, 0);
        start = weekStart.toISOString();
        end = now.toISOString();
        break;
      case 'month':
        // This month from beginning
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
        monthStart.setHours(0, 0, 0, 0);
        start = monthStart.toISOString();
        end = now.toISOString();
        break;
      case 'custom':
        if (startDate) {
          const customStart = new Date(startDate);
          customStart.setHours(0, 0, 0, 0);
          start = customStart.toISOString();
        }
        if (endDate) {
          const customEnd = new Date(endDate);
          customEnd.setHours(23, 59, 59, 999);
          end = customEnd.toISOString();
        }
        break;
    }

    return { start, end };
  };

  // Load Services Analytics
  const loadServicesAnalytics = async () => {
    try {
      setLoading(true);
      setError('');
      const { start, end } = getDateRange();
      const params: any = {};
      if (start) params.startDate = start;
      if (end) params.endDate = end;

      const response = await ServiceBillingAPI.getServiceAnalytics(params);
      const data = response.data?.data?.analytics || response.data?.analytics || [];
      setServicesData(data);
    } catch (err: any) {
      console.error('Error loading services analytics:', err);
      setError(err.response?.data?.message || 'Failed to load services analytics');
    } finally {
      setLoading(false);
    }
  };

  // Load Employee Analytics
  const loadEmployeeAnalytics = async () => {
    try {
      setLoading(true);
      setError('');
      const { start, end } = getDateRange();
      const params: any = {};
      if (start) params.startDate = start;
      if (end) params.endDate = end;

      const response = await ServiceBillingAPI.getEmployeeAnalytics(params);
      const data = response.data?.data?.analytics || response.data?.analytics || [];
      setEmployeesData(data);
    } catch (err: any) {
      console.error('Error loading employee analytics:', err);
      setError(err.response?.data?.message || 'Failed to load employee analytics');
    } finally {
      setLoading(false);
    }
  };

  // Load Product Analytics
  const loadProductAnalytics = async () => {
    try {
      setLoading(true);
      setError('');
      const { start, end } = getDateRange();
      const params: any = {};
      if (start) params.startDate = start;
      if (end) params.endDate = end;

      const response = await ServiceBillingAPI.getProductAnalytics(params);
      const data = response.data?.data?.analytics || response.data?.analytics || [];
      setProductsData(data);
    } catch (err: any) {
      console.error('Error loading product analytics:', err);
      setError(err.response?.data?.message || 'Failed to load product analytics');
    } finally {
      setLoading(false);
    }
  };

  // Load Performance Analytics
  const loadPerformanceAnalytics = async () => {
    try {
      setLoading(true);
      setError('');
      const { start, end } = getDateRange();
      const params: any = {};
      if (start) params.startDate = start;
      if (end) params.endDate = end;

      const response = await ServiceBillingAPI.getPerformanceAnalytics(params);
      const data = response.data?.data || response.data || response;
      setPerformanceData(data);
    } catch (err: any) {
      console.error('Error loading performance analytics:', err);
      setError(err.response?.data?.message || 'Failed to load performance analytics');
    } finally {
      setLoading(false);
    }
  };

  // Load Returning Customers
  const loadReturningCustomers = async () => {
    try {
      setLoading(true);
      setError('');
      const { start, end } = getDateRange();
      const params: any = {};
      if (start) params.startDate = start;
      if (end) params.endDate = end;

      const response = await ServiceBillingAPI.getReturningCustomers(params);
      const data = response.data?.data?.customers || response.data?.customers || [];
      setReturningCustomers(data);
    } catch (err: any) {
      console.error('Error loading returning customers:', err);
      setError(err.response?.data?.message || 'Failed to load returning customers');
    } finally {
      setLoading(false);
    }
  };

  // Load data based on current tab
  useEffect(() => {
    switch (currentTab) {
      case 0:
        loadServicesAnalytics();
        break;
      case 1:
        loadEmployeeAnalytics();
        break;
      case 2:
        loadProductAnalytics();
        break;
      case 3:
        loadPerformanceAnalytics();
        break;
      case 4:
        loadReturningCustomers();
        break;
    }
  }, [currentTab, dateFilter, startDate, endDate]);

  // Format currency
  const formatCurrency = (amount: number) => {
    return `KES ${Math.round(amount).toLocaleString('en-KE')}`;
  };

  // Calculate totals
  const calculateServicesTotal = () => {
    return servicesData.reduce((sum, s) => sum + parseFloat(s.total_amount || 0), 0);
  };

  const calculateProductsTotal = () => {
    return productsData.reduce((sum, p) => sum + parseFloat(p.total_amount || 0), 0);
  };

  const calculateEmployeesTotal = () => {
    return employeesData.reduce((sum, e) => sum + parseFloat(e.total_amount || 0), 0);
  };

  const calculateTopEmployeesTotal = () => {
    if (!performanceData?.top_employees) return 0;
    return performanceData.top_employees.reduce((sum: number, e: any) => sum + parseFloat(e.total_amount || 0), 0);
  };

  return (
    <Box sx={{ width: '100vw', minHeight: '100vh', bgcolor: '#f5f5f5' }}>
      <Container maxWidth="xl" sx={{ p: { xs: 2, md: 3 } }}>
        {/* Header */}
        <AppBar position="static" sx={{ backgroundColor: '#673ab7', mb: 3, borderRadius: 1 }}>
          <Toolbar>
            <Typography variant="h6" fontWeight="bold" sx={{ flexGrow: 1 }}>
              📊 Service Billing Analytics
            </Typography>
          </Toolbar>
        </AppBar>

        {/* Date Filter */}
        <Paper sx={{ p: 2, mb: 3 }}>
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
            <Button
              variant={dateFilter === 'today' ? 'contained' : 'outlined'}
              onClick={() => setDateFilter('today')}
              size="small"
            >
              Today
            </Button>
            <Button
              variant={dateFilter === 'week' ? 'contained' : 'outlined'}
              onClick={() => setDateFilter('week')}
              size="small"
            >
              This Week
            </Button>
            <Button
              variant={dateFilter === 'month' ? 'contained' : 'outlined'}
              onClick={() => setDateFilter('month')}
              size="small"
            >
              This Month
            </Button>
            <Button
              variant={dateFilter === 'custom' ? 'contained' : 'outlined'}
              onClick={() => setDateFilter('custom')}
              size="small"
            >
              Custom Range
            </Button>
            {dateFilter === 'custom' && (
              <>
                <TextField
                  type="date"
                  label="Start Date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  size="small"
                  InputLabelProps={{ shrink: true }}
                />
                <TextField
                  type="date"
                  label="End Date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  size="small"
                  InputLabelProps={{ shrink: true }}
                />
              </>
            )}
          </Box>
        </Paper>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
            {error}
          </Alert>
        )}

        {/* Tabs */}
        <Paper sx={{ borderRadius: 2 }}>
          <Tabs
            value={currentTab}
            onChange={(e, newValue) => setCurrentTab(newValue)}
            variant="scrollable"
            scrollButtons="auto"
            sx={{
              borderBottom: 1,
              borderColor: 'divider',
            }}
          >
            <Tab label="Services" />
            <Tab label="Employees" />
            <Tab label="Products" />
            <Tab label="Performance" />
            <Tab label="Returning Customers" />
          </Tabs>

          {/* Services Tab */}
          <TabPanel value={currentTab} index={0}>
            {loading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                <CircularProgress />
              </Box>
            ) : (
              <>
                <Box sx={{ mb: 3, p: 2, bgcolor: 'primary.main', color: 'white', borderRadius: 1 }}>
                  <Typography variant="h6">Total Services Revenue: {formatCurrency(calculateServicesTotal())}</Typography>
                </Box>
                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell><strong>Service</strong></TableCell>
                        <TableCell align="right"><strong>Count</strong></TableCell>
                        <TableCell align="right"><strong>Total Amount</strong></TableCell>
                        <TableCell align="right"><strong>Avg Price</strong></TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {servicesData.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={4} align="center">No services data found</TableCell>
                        </TableRow>
                      ) : (
                        servicesData.map((service, index) => (
                          <TableRow key={index}>
                            <TableCell>{service.service_name || service.description?.replace('Service: ', '').split(' (by')[0] || 'Unknown'}</TableCell>
                            <TableCell align="right">{service.service_count || 0}</TableCell>
                            <TableCell align="right">{formatCurrency(parseFloat(service.total_amount || 0))}</TableCell>
                            <TableCell align="right">{formatCurrency(parseFloat(service.avg_price || 0))}</TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>
              </>
            )}
          </TabPanel>

          {/* Employees Tab */}
          <TabPanel value={currentTab} index={1}>
            {loading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                <CircularProgress />
              </Box>
            ) : (
              <>
                <Box sx={{ mb: 3, p: 2, bgcolor: 'primary.main', color: 'white', borderRadius: 1 }}>
                  <Typography variant="h6">Total Employee Revenue: {formatCurrency(calculateEmployeesTotal())}</Typography>
                </Box>
                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell><strong>Employee</strong></TableCell>
                        <TableCell align="right"><strong>Customers</strong></TableCell>
                        <TableCell align="right"><strong>Services</strong></TableCell>
                        <TableCell align="right"><strong>Total Amount</strong></TableCell>
                        <TableCell align="center"><strong>Actions</strong></TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {employeesData.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={5} align="center">No employee data found</TableCell>
                        </TableRow>
                      ) : (
                        employeesData.map((employee, index) => (
                          <TableRow key={index}>
                            <TableCell>{employee.employee_name || 'Unknown'}</TableCell>
                            <TableCell align="right">{employee.customer_count || 0}</TableCell>
                            <TableCell align="right">{employee.service_count || 0}</TableCell>
                            <TableCell align="right">{formatCurrency(parseFloat(employee.total_amount || 0))}</TableCell>
                            <TableCell align="center">
                              <IconButton
                                size="small"
                                onClick={() => {
                                  setSelectedEmployee(employee);
                                  setEmployeeModalType('customers');
                                  setEmployeeModalOpen(true);
                                }}
                                title="View Customers"
                              >
                                <ViewIcon />
                              </IconButton>
                              <IconButton
                                size="small"
                                onClick={() => {
                                  setSelectedEmployee(employee);
                                  setEmployeeModalType('services');
                                  setEmployeeModalOpen(true);
                                }}
                                title="View Services"
                              >
                                <ViewIcon color="secondary" />
                              </IconButton>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>
              </>
            )}
          </TabPanel>

          {/* Products Tab */}
          <TabPanel value={currentTab} index={2}>
            {loading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                <CircularProgress />
              </Box>
            ) : (
              <>
                <Box sx={{ mb: 3, p: 2, bgcolor: 'primary.main', color: 'white', borderRadius: 1 }}>
                  <Typography variant="h6">Total Products Revenue: {formatCurrency(calculateProductsTotal())}</Typography>
                </Box>
                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell><strong>Product</strong></TableCell>
                        <TableCell align="right"><strong>Quantity Sold</strong></TableCell>
                        <TableCell align="right"><strong>Total Amount</strong></TableCell>
                        <TableCell align="right"><strong>Avg Price</strong></TableCell>
                        <TableCell align="right"><strong>Sales Count</strong></TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {productsData.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={5} align="center">No products data found</TableCell>
                        </TableRow>
                      ) : (
                        productsData.map((product, index) => (
                          <TableRow key={index}>
                            <TableCell>{product.product_name || 'Unknown'}</TableCell>
                            <TableCell align="right">{Math.round(parseFloat(product.total_quantity || 0))}</TableCell>
                            <TableCell align="right">{formatCurrency(parseFloat(product.total_amount || 0))}</TableCell>
                            <TableCell align="right">{formatCurrency(parseFloat(product.avg_price || 0))}</TableCell>
                            <TableCell align="right">{product.sale_count || 0}</TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>
              </>
            )}
          </TabPanel>

          {/* Performance Tab */}
          <TabPanel value={currentTab} index={3}>
            {loading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                <CircularProgress />
              </Box>
            ) : performanceData ? (
              <>
                <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 3, mb: 3 }}>
                  {/* Top Employees */}
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Card>
                      <CardContent>
                        <Typography variant="h6" gutterBottom>
                          Top Performing Employees
                        </Typography>
                        <Box sx={{ mb: 2, p: 1, bgcolor: 'primary.light', borderRadius: 1 }}>
                          <Typography variant="body2" fontWeight="bold">
                            Total: {formatCurrency(calculateTopEmployeesTotal())}
                          </Typography>
                        </Box>
                        <TableContainer>
                          <Table size="small">
                            <TableHead>
                              <TableRow>
                                <TableCell><strong>Employee</strong></TableCell>
                                <TableCell align="right"><strong>Customers</strong></TableCell>
                                <TableCell align="right"><strong>Total</strong></TableCell>
                                <TableCell align="center"><strong>View</strong></TableCell>
                              </TableRow>
                            </TableHead>
                            <TableBody>
                              {performanceData.top_employees?.map((emp: any, index: number) => (
                                <TableRow key={index}>
                                  <TableCell>{emp.employee_name || 'Unknown'}</TableCell>
                                  <TableCell align="right">{emp.customer_count || 0}</TableCell>
                                  <TableCell align="right">{formatCurrency(parseFloat(emp.total_amount || 0))}</TableCell>
                                  <TableCell align="center">
                                    <IconButton
                                      size="small"
                                      onClick={() => {
                                        setSelectedTopEmployee(emp);
                                        setTopEmployeeCustomersOpen(true);
                                      }}
                                    >
                                      <ViewIcon />
                                    </IconButton>
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </TableContainer>
                      </CardContent>
                    </Card>
                  </Box>

                  {/* Best/Worst Services & Products */}
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Card>
                      <CardContent>
                        <Typography variant="h6" gutterBottom>
                          Service Performance
                        </Typography>
                        {performanceData.best_service && (
                          <Box sx={{ mb: 2, p: 2, bgcolor: 'success.light', borderRadius: 1 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                              <TrendingUpIcon color="success" />
                              <Typography variant="subtitle1" fontWeight="bold">Best Service</Typography>
                            </Box>
                            <Typography variant="body2">
                              {performanceData.best_service.description?.replace('Service: ', '').split(' (by')[0] || 'Unknown'}
                            </Typography>
                            <Typography variant="body2">
                              Count: {performanceData.best_service.service_count} | 
                              Total: {formatCurrency(parseFloat(performanceData.best_service.total_amount || 0))}
                            </Typography>
                          </Box>
                        )}
                        {performanceData.worst_service && (
                          <Box sx={{ p: 2, bgcolor: 'error.light', borderRadius: 1 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                              <TrendingDownIcon color="error" />
                              <Typography variant="subtitle1" fontWeight="bold">Worst Service</Typography>
                            </Box>
                            <Typography variant="body2">
                              {performanceData.worst_service.description?.replace('Service: ', '').split(' (by')[0] || 'Unknown'}
                            </Typography>
                            <Typography variant="body2">
                              Count: {performanceData.worst_service.service_count} | 
                              Total: {formatCurrency(parseFloat(performanceData.worst_service.total_amount || 0))}
                            </Typography>
                          </Box>
                        )}
                      </CardContent>
                    </Card>

                    <Card sx={{ mt: 2 }}>
                      <CardContent>
                        <Typography variant="h6" gutterBottom>
                          Product Performance
                        </Typography>
                        {performanceData.best_product && (
                          <Box sx={{ mb: 2, p: 2, bgcolor: 'success.light', borderRadius: 1 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                              <TrendingUpIcon color="success" />
                              <Typography variant="subtitle1" fontWeight="bold">Best Product</Typography>
                            </Box>
                            <Typography variant="body2">
                              {performanceData.best_product.product_name || 'Unknown'}
                            </Typography>
                            <Typography variant="body2">
                              Quantity: {Math.round(parseFloat(performanceData.best_product.total_quantity || 0))} | 
                              Total: {formatCurrency(parseFloat(performanceData.best_product.total_amount || 0))}
                            </Typography>
                          </Box>
                        )}
                        {performanceData.worst_product && (
                          <Box sx={{ p: 2, bgcolor: 'error.light', borderRadius: 1 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                              <TrendingDownIcon color="error" />
                              <Typography variant="subtitle1" fontWeight="bold">Worst Product</Typography>
                            </Box>
                            <Typography variant="body2">
                              {performanceData.worst_product.product_name || 'Unknown'}
                            </Typography>
                            <Typography variant="body2">
                              Quantity: {Math.round(parseFloat(performanceData.worst_product.total_quantity || 0))} | 
                              Total: {formatCurrency(parseFloat(performanceData.worst_product.total_amount || 0))}
                            </Typography>
                          </Box>
                        )}
                      </CardContent>
                    </Card>
                  </Box>
                </Box>
              </>
            ) : (
              <Typography>No performance data available</Typography>
            )}
          </TabPanel>

          {/* Returning Customers Tab */}
          <TabPanel value={currentTab} index={4}>
            {loading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                <CircularProgress />
              </Box>
            ) : (
              <>
                <Box sx={{ mb: 3, p: 2, bgcolor: 'info.main', color: 'white', borderRadius: 1 }}>
                  <Typography variant="h6">
                    Returning Customers: {returningCustomers.length}
                  </Typography>
                </Box>
                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell><strong>Customer Name</strong></TableCell>
                        <TableCell><strong>Phone Number</strong></TableCell>
                        <TableCell align="right"><strong>Visit Count</strong></TableCell>
                        <TableCell align="right"><strong>Total Spent</strong></TableCell>
                        <TableCell><strong>First Visit</strong></TableCell>
                        <TableCell><strong>Last Visit</strong></TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {returningCustomers.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={6} align="center">No returning customers found</TableCell>
                        </TableRow>
                      ) : (
                        returningCustomers.map((customer, index) => (
                          <TableRow key={index}>
                            <TableCell>{customer.customer_name || 'Unknown'}</TableCell>
                            <TableCell>{customer.phone_number || 'N/A'}</TableCell>
                            <TableCell align="right">{customer.visit_count || 0}</TableCell>
                            <TableCell align="right">{formatCurrency(parseFloat(customer.total_spent || 0))}</TableCell>
                            <TableCell>
                              {customer.first_visit ? new Date(customer.first_visit).toLocaleDateString() : 'N/A'}
                            </TableCell>
                            <TableCell>
                              {customer.last_visit ? new Date(customer.last_visit).toLocaleDateString() : 'N/A'}
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>
              </>
            )}
          </TabPanel>
        </Paper>

        {/* Employee Details Modal */}
        <Dialog
          open={employeeModalOpen}
          onClose={() => setEmployeeModalOpen(false)}
          maxWidth="md"
          fullWidth
        >
          <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>
              {selectedEmployee?.employee_name} - {employeeModalType === 'customers' ? 'Customers' : 'Services'}
            </span>
            <IconButton onClick={() => setEmployeeModalOpen(false)}>
              <CloseIcon />
            </IconButton>
          </DialogTitle>
          <DialogContent>
            {employeeModalType === 'customers' ? (
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell><strong>Customer Name</strong></TableCell>
                      <TableCell><strong>Phone</strong></TableCell>
                      <TableCell align="right"><strong>Visits</strong></TableCell>
                      <TableCell align="right"><strong>Total Spent</strong></TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {selectedEmployee?.customers?.map((customer: any, index: number) => (
                      <TableRow key={index}>
                        <TableCell>{customer.customer_name || 'Unknown'}</TableCell>
                        <TableCell>{customer.customer_address?.replace('Phone: ', '') || 'N/A'}</TableCell>
                        <TableCell align="right">{customer.visit_count || 0}</TableCell>
                        <TableCell align="right">{formatCurrency(parseFloat(customer.total_spent || 0))}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            ) : (
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell><strong>Service</strong></TableCell>
                      <TableCell align="right"><strong>Price</strong></TableCell>
                      <TableCell align="right"><strong>Count</strong></TableCell>
                      <TableCell align="right"><strong>Total</strong></TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {selectedEmployee?.services?.map((service: any, index: number) => (
                      <TableRow key={index}>
                        <TableCell>{service.description?.replace('Service: ', '').split(' (by')[0] || 'Unknown'}</TableCell>
                        <TableCell align="right">{formatCurrency(parseFloat(service.unit_price || 0))}</TableCell>
                        <TableCell align="right">{service.count || 0}</TableCell>
                        <TableCell align="right">{formatCurrency(parseFloat(service.total || 0))}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setEmployeeModalOpen(false)}>Close</Button>
          </DialogActions>
        </Dialog>

        {/* Top Employee Customers Modal */}
        <Dialog
          open={topEmployeeCustomersOpen}
          onClose={() => setTopEmployeeCustomersOpen(false)}
          maxWidth="md"
          fullWidth
        >
          <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>{selectedTopEmployee?.employee_name} - Customers Served</span>
            <IconButton onClick={() => setTopEmployeeCustomersOpen(false)}>
              <CloseIcon />
            </IconButton>
          </DialogTitle>
          <DialogContent>
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell><strong>Customer Name</strong></TableCell>
                    <TableCell><strong>Phone</strong></TableCell>
                    <TableCell align="right"><strong>Visits</strong></TableCell>
                    <TableCell align="right"><strong>Total Spent</strong></TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {selectedTopEmployee?.customers?.map((customer: any, index: number) => (
                    <TableRow key={index}>
                      <TableCell>{customer.customer_name || 'Unknown'}</TableCell>
                      <TableCell>{customer.customer_address?.replace('Phone: ', '') || 'N/A'}</TableCell>
                      <TableCell align="right">{customer.visit_count || 0}</TableCell>
                      <TableCell align="right">{formatCurrency(parseFloat(customer.total_spent || 0))}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setTopEmployeeCustomersOpen(false)}>Close</Button>
          </DialogActions>
        </Dialog>
      </Container>
    </Box>
  );
};

export default ServiceBillingAnalyticsScreen;

