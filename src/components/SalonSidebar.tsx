import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  Paper,
  Chip,
} from '@mui/material';
import {
  Add as AddIcon,
  People as PeopleIcon,
  ContentCut as ServicesIcon,
  Inventory as ProductsIcon,
  AccessTime as ShiftsIcon,
  PointOfSale as POSIcon,
  Assessment as ReportsIcon,
  TrendingUp as PerformanceIcon,
  Dashboard as DashboardIcon,
  AttachMoney as MoneyIcon,
  Warning as WarningIcon,
} from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';
import * as salonApi from '../services/salonApi';

interface SalonSidebarProps {
  title?: string;
  currentStats?: {
    totalEmployees?: number;
    activeShifts?: number;
    todayRevenue?: number;
    lowStockProducts?: number;
  };
}

const SalonSidebar: React.FC<SalonSidebarProps> = ({
  title = 'Salon/Barber',
  currentStats
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [stats, setStats] = useState<any>(null);
  const [currentShift, setCurrentShift] = useState<any>(null);

  useEffect(() => {
    loadStats();
    loadCurrentShift();
  }, []);

  const loadStats = async () => {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      const [statsRes, employeesRes, productsRes] = await Promise.all([
        salonApi.getDashboardStats({
          start_date: today.toISOString(),
          end_date: tomorrow.toISOString(),
        }),
        salonApi.getSalonUsers(),
        salonApi.getLowStockProducts(),
      ]);

      if (statsRes.data.success) {
        setStats(statsRes.data.data);
      }

      if (employeesRes.data.success) {
        const employees = Array.isArray(employeesRes.data.data) 
          ? employeesRes.data.data 
          : employeesRes.data.data?.data || [];
        setStats((prev: any) => ({
          ...prev,
          totalEmployees: employees.length,
        }));
      }

      if (productsRes.data.success) {
        const products = Array.isArray(productsRes.data.data)
          ? productsRes.data.data
          : productsRes.data.data?.data || [];
        setStats((prev: any) => ({
          ...prev,
          lowStockProducts: products.length,
        }));
      }
    } catch (err) {
      console.error('Error loading stats:', err);
    }
  };

  const loadCurrentShift = async () => {
    try {
      const response = await salonApi.getCurrentShift();
      if (response.data.success && response.data.data) {
        setCurrentShift(response.data.data);
      }
    } catch (err) {
      console.error('Error loading current shift:', err);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES'
    }).format(amount);
  };

  const isCurrentPath = (path: string) => {
    if (path === '/salon') {
      return location.pathname === '/salon';
    }
    return location.pathname.startsWith(path);
  };

  const getButtonVariant = (path: string) => {
    return isCurrentPath(path) ? 'contained' : 'outlined';
  };

  const getButtonColor = (path: string) => {
    return isCurrentPath(path) ? 'primary' : 'inherit';
  };

  const displayStats = currentStats || stats || {};

  return (
    <Box sx={{ 
      position: 'fixed',
      left: 0,
      top: 100, // Account for header height (minHeight: 100)
      width: 350,
      minWidth: 350,
      height: 'calc(100vh - 100px)',
      bgcolor: 'background.paper', 
      borderRight: '1px solid', 
      borderColor: 'divider',
      p: 2,
      display: 'flex',
      flexDirection: 'column',
      gap: 2,
      zIndex: 1100,
      overflowY: 'auto',
    }}>
      {/* Sidebar Header */}
      <Typography variant="h6" fontWeight="bold" sx={{ mb: 2, mt: 1 }}>
        {title}
      </Typography>

      {/* Quick Actions */}
      <Paper sx={{ p: 2 }}>
        <Typography variant="subtitle2" color="primary" gutterBottom>
          Quick Actions
        </Typography>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
          <Button
            variant={getButtonVariant('/salon/pos')}
            color={getButtonColor('/salon/pos')}
            startIcon={<POSIcon />}
            onClick={() => navigate('/salon/pos')}
            fullWidth
          >
            Record Service
          </Button>
          <Button
            variant={getButtonVariant('/salon/employees')}
            color={getButtonColor('/salon/employees')}
            startIcon={<PeopleIcon />}
            onClick={() => navigate('/salon/employees')}
            fullWidth
          >
            Employees
          </Button>
          <Button
            variant={getButtonVariant('/salon/services')}
            color={getButtonColor('/salon/services')}
            startIcon={<ServicesIcon />}
            onClick={() => navigate('/salon/services')}
            fullWidth
          >
            Services
          </Button>
          <Button
            variant={getButtonVariant('/salon/products')}
            color={getButtonColor('/salon/products')}
            startIcon={<ProductsIcon />}
            onClick={() => navigate('/salon/products')}
            fullWidth
          >
            Products
          </Button>
          <Button
            variant={getButtonVariant('/salon/shifts')}
            color={getButtonColor('/salon/shifts')}
            startIcon={<ShiftsIcon />}
            onClick={() => navigate('/salon/shifts')}
            fullWidth
          >
            Shifts
          </Button>
          <Button
            variant={getButtonVariant('/salon/performance')}
            color={getButtonColor('/salon/performance')}
            startIcon={<PerformanceIcon />}
            onClick={() => navigate('/salon/performance')}
            fullWidth
          >
            Performance
          </Button>
          <Button
            variant={getButtonVariant('/salon/reports')}
            color={getButtonColor('/salon/reports')}
            startIcon={<ReportsIcon />}
            onClick={() => navigate('/salon/reports')}
            fullWidth
          >
            Reports
          </Button>
          <Button
            variant="outlined"
            startIcon={<DashboardIcon />}
            onClick={() => navigate('/dashboard')}
            fullWidth
            sx={{ 
              color: '#9C27B0', 
              borderColor: '#9C27B0',
              '&:hover': { borderColor: '#9C27B0', bgcolor: 'rgba(156, 39, 176, 0.04)' }
            }}
          >
            Main Dashboard
          </Button>
        </Box>
      </Paper>

      {/* Quick Stats */}
      {(displayStats.totalEmployees !== undefined || 
        displayStats.activeShifts !== undefined || 
        displayStats.todayRevenue !== undefined || 
        displayStats.lowStockProducts !== undefined) && (
        <Paper sx={{ p: 2 }}>
          <Typography variant="subtitle2" color="primary" gutterBottom>
            Quick Stats
          </Typography>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
            {displayStats.totalEmployees !== undefined && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <PeopleIcon color="primary" fontSize="small" />
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Total Employees
                  </Typography>
                  <Typography variant="h6" fontWeight="bold">
                    {displayStats.totalEmployees}
                  </Typography>
                </Box>
              </Box>
            )}
            
            {currentShift && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <ShiftsIcon color="success" fontSize="small" />
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Active Shift
                  </Typography>
                  <Chip 
                    label="Open" 
                    size="small" 
                    color="success"
                    sx={{ mt: 0.5 }}
                  />
                </Box>
              </Box>
            )}
            
            {displayStats.todayRevenue !== undefined && displayStats.todayRevenue > 0 && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <MoneyIcon color="success" fontSize="small" />
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Today's Revenue
                  </Typography>
                  <Typography variant="h6" fontWeight="bold" color="success.main">
                    {formatCurrency(displayStats.todayRevenue)}
                  </Typography>
                </Box>
              </Box>
            )}
            
            {displayStats.lowStockProducts !== undefined && displayStats.lowStockProducts > 0 && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <WarningIcon color="warning" fontSize="small" />
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Low Stock Products
                  </Typography>
                  <Typography variant="h6" fontWeight="bold" color="warning.main">
                    {displayStats.lowStockProducts}
                  </Typography>
                </Box>
              </Box>
            )}

            {displayStats.revenue && displayStats.revenue.total_revenue && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <MoneyIcon color="success" fontSize="small" />
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Today's Revenue
                  </Typography>
                  <Typography variant="h6" fontWeight="bold" color="success.main">
                    {formatCurrency(parseFloat(displayStats.revenue.total_revenue))}
                  </Typography>
                </Box>
              </Box>
            )}
          </Box>
        </Paper>
      )}
    </Box>
  );
};

export default SalonSidebar;

