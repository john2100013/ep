import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  Paper,
  FormControl,
  Select,
  MenuItem,
} from '@mui/material';
import {
  Add as AddIcon,
  Receipt as ReceiptIcon,
  Dashboard as DashboardIcon,
  TrendingUp as TrendingUpIcon,
  AttachMoney as MoneyIcon,
  DateRange as DateRangeIcon,
  Assessment as AssessmentIcon,
  Inventory as InventoryIcon,
  KeyboardReturn as ReturnIcon,
  ReportProblem as DamageIcon,
  Description as QuotationIcon,
} from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';

interface SidebarProps {
  title: string;
  currentStats?: {
    total: number;
    totalValue: number;
    statusCounts: Record<string, number>;
  };
  statusFilter?: string;
  onStatusFilterChange?: (status: string) => void;
  statusOptions?: Array<{ value: string; label: string }>;
}

const Sidebar: React.FC<SidebarProps> = ({
  title,
  currentStats,
  statusFilter = '',
  onStatusFilterChange,
  statusOptions = []
}) => {
  const navigate = useNavigate();
  const location = useLocation();

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES'
    }).format(amount);
  };

  const isCurrentPath = (path: string) => {
    return location.pathname === path;
  };

  const getButtonVariant = (path: string) => {
    return isCurrentPath(path) ? 'contained' : 'outlined';
  };

  const getButtonColor = (path: string) => {
    return isCurrentPath(path) ? 'primary' : 'inherit';
  };

  return (
    <Box sx={{ 
      position: 'fixed',
      left: 0,
      top: 0,
      width: 350,
      minWidth: 350,
      height: '100vh',
      bgcolor: 'background.paper', 
      borderRight: '1px solid', 
      borderColor: 'divider',
      p: 2,
      display: 'flex',
      flexDirection: 'column',
      gap: 2,
      zIndex: 1200,
      overflowY: 'auto'
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
            variant={getButtonVariant('/create-invoice')}
            color={getButtonColor('/create-invoice')}
            startIcon={<AddIcon />}
            onClick={() => navigate('/create-invoice')}
            fullWidth
          >
            Create Invoice
          </Button>
          <Button
            variant={getButtonVariant('/create-quotation')}
            color={getButtonColor('/create-quotation')}
            startIcon={<QuotationIcon />}
            onClick={() => navigate('/create-quotation')}
            fullWidth
          >
            Create Quotation
          </Button>
          <Button
            variant={getButtonVariant('/invoices')}
            color={getButtonColor('/invoices')}
            startIcon={<ReceiptIcon />}
            onClick={() => navigate('/invoices')}
            fullWidth
          >
            Invoices
          </Button>
          <Button
            variant={getButtonVariant('/quotations')}
            color={getButtonColor('/quotations')}
            startIcon={<AssessmentIcon />}
            onClick={() => navigate('/quotations')}
            fullWidth
          >
            Quotations
          </Button>
          <Button
            variant={getButtonVariant('/items-list')}
            color={getButtonColor('/items-list')}
            startIcon={<InventoryIcon />}
            onClick={() => navigate('/items-list')}
            fullWidth
          >
            Items
          </Button>
          <Button
            variant={getButtonVariant('/add-item')}
            color={getButtonColor('/add-item')}
            startIcon={<AddIcon />}
            onClick={() => navigate('/add-item')}
            fullWidth
          >
            Add Item
          </Button>
          <Button
            variant={getButtonVariant('/goods-returns')}
            color={getButtonColor('/goods-returns')}
            startIcon={<ReturnIcon />}
            onClick={() => navigate('/goods-returns')}
            fullWidth
            sx={{ 
              color: isCurrentPath('/goods-returns') ? 'white' : '#4CAF50', 
              borderColor: '#4CAF50',
              '&:hover': { borderColor: '#4CAF50' }
            }}
          >
            Goods Returns
          </Button>
          <Button
            variant={getButtonVariant('/damage-tracking')}
            color={getButtonColor('/damage-tracking')}
            startIcon={<DamageIcon />}
            onClick={() => navigate('/damage-tracking')}
            fullWidth
            sx={{ 
              color: isCurrentPath('/damage-tracking') ? 'white' : '#FF5722', 
              borderColor: '#FF5722',
              '&:hover': { borderColor: '#FF5722' }
            }}
          >
            Damage Tracking
          </Button>
          <Button
            variant={getButtonVariant('/analytics')}
            color={getButtonColor('/analytics')}
            startIcon={<DashboardIcon />}
            onClick={() => navigate('/analytics')}
            fullWidth
            sx={{ 
              color: isCurrentPath('/analytics') ? 'white' : '#9C27B0', 
              borderColor: '#9C27B0',
              '&:hover': { borderColor: '#9C27B0' }
            }}
          >
            Analytics
          </Button>
        </Box>
      </Paper>

      {/* Quick Stats */}
      {currentStats && (
        <Paper sx={{ p: 2 }}>
          <Typography variant="subtitle2" color="primary" gutterBottom>
            Quick Stats
          </Typography>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <ReceiptIcon color="primary" fontSize="small" />
              <Box>
                <Typography variant="body2" color="text.secondary">
                  Total Items
                </Typography>
                <Typography variant="h6" fontWeight="bold">
                  {currentStats.total}
                </Typography>
              </Box>
            </Box>
            
            {currentStats.totalValue > 0 && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <MoneyIcon color="success" fontSize="small" />
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Total Value
                  </Typography>
                  <Typography variant="h6" fontWeight="bold" color="success.main">
                    {formatCurrency(currentStats.totalValue)}
                  </Typography>
                </Box>
              </Box>
            )}
            
            {Object.entries(currentStats.statusCounts).map(([status, count]) => (
              <Box key={status} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <TrendingUpIcon 
                  color={status === 'paid' ? 'success' : status === 'overdue' ? 'error' : 'info'} 
                  fontSize="small" 
                />
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    {status.charAt(0).toUpperCase() + status.slice(1)}
                  </Typography>
                  <Typography 
                    variant="h6" 
                    fontWeight="bold" 
                    color={status === 'paid' ? 'success.main' : status === 'overdue' ? 'error.main' : 'info.main'}
                  >
                    {count}
                  </Typography>
                </Box>
              </Box>
            ))}
          </Box>
        </Paper>
      )}

      {/* Status Filter */}
      {statusOptions.length > 0 && onStatusFilterChange && (
        <Paper sx={{ p: 2 }}>
          <Typography variant="subtitle2" color="primary" gutterBottom>
            Filter by Status
          </Typography>
          <FormControl size="small" fullWidth>
            <Select
              value={statusFilter}
              onChange={(e) => onStatusFilterChange(e.target.value as string)}
              displayEmpty
            >
              {statusOptions.map((option) => (
                <MenuItem key={option.value} value={option.value}>
                  {option.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Paper>
      )}
    </Box>
  );
};

export default Sidebar;