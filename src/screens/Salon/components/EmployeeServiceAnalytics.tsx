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
  Collapse,
  IconButton,
  Chip,
} from '@mui/material';
import { ExpandMore, ExpandLess } from '@mui/icons-material';
import * as salonApi from '../../../services/salonApi';

interface EmployeeServiceAnalyticsProps {
  filter: 'day' | 'week' | 'month';
}

interface Service {
  service_id: number;
  service_name: string;
  count: number;
  total: number;
  avg_price: number;
}

interface Employee {
  employee_id: number;
  employee_name: string;
  services: Service[];
  total: number;
}

const EmployeeServiceAnalytics: React.FC<EmployeeServiceAnalyticsProps> = ({ filter }) => {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set());

  useEffect(() => {
    loadData();
  }, [filter]);

  const loadData = async () => {
    try {
      console.log(`👥 [EmployeeServiceAnalytics] Loading data with filter: ${filter}`);
      setLoading(true);
      setError('');
      const response = await salonApi.getEmployeeServiceAnalytics({ filter });
      console.log(`👥 [EmployeeServiceAnalytics] API Response:`, response);
      console.log(`👥 [EmployeeServiceAnalytics] Response.data:`, response.data);
      
      // Handle different response formats
      let employees: Employee[] = [];
      if (response.data?.success && response.data?.data) {
        employees = Array.isArray(response.data.data) ? response.data.data : [];
      } else if (Array.isArray(response.data)) {
        employees = response.data;
      } else if (response.data?.data && Array.isArray(response.data.data)) {
        employees = response.data.data;
      }
      
      console.log(`👥 [EmployeeServiceAnalytics] Loaded ${employees.length} employees`);
      setEmployees(employees);
    } catch (err: any) {
      console.error('❌ [EmployeeServiceAnalytics] Error loading data:', err);
      setError(err.response?.data?.message || 'Failed to load employee analytics');
    } finally {
      setLoading(false);
    }
  };

  const toggleRow = (id: number) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedRows(newExpanded);
  };

  const formatCurrency = (amount: number) => {
    return `KES ${Number(amount || 0).toFixed(2)}`;
  };

  const grandTotal = employees.reduce((sum, emp) => sum + emp.total, 0);

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

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6" fontWeight="bold">
              Total Revenue: {formatCurrency(grandTotal)}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {employees.length} Employee(s)
            </Typography>
          </Box>
        </CardContent>
      </Card>

      <Card>
        <CardContent>
          <Typography variant="h6" fontWeight="bold" gutterBottom>
            Employee Performance by Service
          </Typography>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell width={50}></TableCell>
                  <TableCell><strong>Employee</strong></TableCell>
                  <TableCell align="right"><strong>Total Services</strong></TableCell>
                  <TableCell align="right"><strong>Total Revenue</strong></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {employees.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} align="center" sx={{ py: 4 }}>
                      <Typography color="text.secondary">No employee data found</Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  employees.map((employee) => (
                    <React.Fragment key={employee.employee_id}>
                      <TableRow hover>
                        <TableCell>
                          <IconButton size="small" onClick={() => toggleRow(employee.employee_id)}>
                            {expandedRows.has(employee.employee_id) ? <ExpandLess /> : <ExpandMore />}
                          </IconButton>
                        </TableCell>
                        <TableCell sx={{ fontWeight: 'bold' }}>{employee.employee_name}</TableCell>
                        <TableCell align="right">
                          {employee.services.reduce((sum, srv) => sum + srv.count, 0)}
                        </TableCell>
                        <TableCell align="right" sx={{ fontWeight: 'bold', color: 'primary.main' }}>
                          {formatCurrency(employee.total)}
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell colSpan={4} sx={{ py: 0, border: 0 }}>
                          <Collapse in={expandedRows.has(employee.employee_id)} timeout="auto" unmountOnExit>
                            <Box sx={{ p: 2, bgcolor: '#f5f5f5' }}>
                              <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
                                Services Breakdown:
                              </Typography>
                              <Table size="small">
                                <TableHead>
                                  <TableRow>
                                    <TableCell>Service Name</TableCell>
                                    <TableCell align="center">Count</TableCell>
                                    <TableCell align="right">Avg Price</TableCell>
                                    <TableCell align="right">Total</TableCell>
                                  </TableRow>
                                </TableHead>
                                <TableBody>
                                  {employee.services.map((service) => (
                                    <TableRow key={service.service_id}>
                                      <TableCell>{service.service_name}</TableCell>
                                      <TableCell align="center">
                                        <Chip label={service.count} size="small" />
                                      </TableCell>
                                      <TableCell align="right">
                                        {formatCurrency(service.avg_price)}
                                      </TableCell>
                                      <TableCell align="right" sx={{ fontWeight: 'bold' }}>
                                        {formatCurrency(service.total)}
                                      </TableCell>
                                    </TableRow>
                                  ))}
                                </TableBody>
                              </Table>
                            </Box>
                          </Collapse>
                        </TableCell>
                      </TableRow>
                    </React.Fragment>
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

export default EmployeeServiceAnalytics;

