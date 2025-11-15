import React, { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  Alert,
  Chip,
  LinearProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  Inventory as InventoryIcon,
  Warning as WarningIcon,
  Error as ErrorIcon,
  CheckCircle as CheckCircleIcon,
  TrendingUp as TrendingUpIcon,
  Info as InfoIcon,
} from '@mui/icons-material';

interface InventoryOverviewProps {
  dateRange: string;
}

interface InventoryItem {
  id: number;
  itemName: string;
  code: string;
  category: string;
  currentStock: number;
  minStockLevel: number;
  maxStockLevel: number;
  unitCost: number;
  totalValue: number;
  status: 'in_stock' | 'low_stock' | 'out_of_stock' | 'overstock';
  lastRestocked: string;
  turnoverRate: number;
}

interface InventoryMetrics {
  totalItems: number;
  totalValue: number;
  lowStockItems: number;
  outOfStockItems: number;
  overstockItems: number;
  averageTurnover: number;
  items: InventoryItem[];
}

const InventoryOverview: React.FC<InventoryOverviewProps> = ({ dateRange }) => {
  const [inventoryMetrics, setInventoryMetrics] = useState<InventoryMetrics>({
    totalItems: 0,
    totalValue: 0,
    lowStockItems: 0,
    outOfStockItems: 0,
    overstockItems: 0,
    averageTurnover: 0,
    items: []
  });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'in_stock': return 'success';
      case 'low_stock': return 'warning';
      case 'out_of_stock': return 'error';
      case 'overstock': return 'info';
      default: return 'default';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'in_stock': return <CheckCircleIcon fontSize="small" />;
      case 'low_stock': return <WarningIcon fontSize="small" />;
      case 'out_of_stock': return <ErrorIcon fontSize="small" />;
      case 'overstock': return <TrendingUpIcon fontSize="small" />;
      default: return <InfoIcon fontSize="small" />;
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'in_stock': return 'In Stock';
      case 'low_stock': return 'Low Stock';
      case 'out_of_stock': return 'Out of Stock';
      case 'overstock': return 'Overstock';
      default: return 'Unknown';
    }
  };

  const getStockLevel = (item: InventoryItem) => {
    if (item.currentStock === 0) return 'out_of_stock';
    if (item.currentStock <= item.minStockLevel) return 'low_stock';
    if (item.currentStock >= item.maxStockLevel) return 'overstock';
    return 'in_stock';
  };

  useEffect(() => {
    loadInventoryOverview();
  }, [dateRange]);

  const loadInventoryOverview = async () => {
    try {
      // Mock data - replace with actual API call
      const mockItems: InventoryItem[] = [
        {
          id: 1,
          itemName: 'Premium Coffee Beans',
          code: 'COF001',
          category: 'Beverages',
          currentStock: 15,
          minStockLevel: 20,
          maxStockLevel: 200,
          unitCost: 250,
          totalValue: 3750,
          status: 'low_stock',
          lastRestocked: '2024-11-10',
          turnoverRate: 8.5
        },
        {
          id: 2,
          itemName: 'Wireless Headphones',
          code: 'ELC002',
          category: 'Electronics',
          currentStock: 0,
          minStockLevel: 10,
          maxStockLevel: 100,
          unitCost: 1200,
          totalValue: 0,
          status: 'out_of_stock',
          lastRestocked: '2024-11-05',
          turnoverRate: 6.2
        },
        {
          id: 3,
          itemName: 'Office Chair',
          code: 'FUR003',
          category: 'Furniture',
          currentStock: 45,
          minStockLevel: 10,
          maxStockLevel: 30,
          unitCost: 2500,
          totalValue: 112500,
          status: 'overstock',
          lastRestocked: '2024-11-08',
          turnoverRate: 2.1
        },
        {
          id: 4,
          itemName: 'Notebook Set',
          code: 'STA004',
          category: 'Stationery',
          currentStock: 150,
          minStockLevel: 100,
          maxStockLevel: 500,
          unitCost: 80,
          totalValue: 12000,
          status: 'in_stock',
          lastRestocked: '2024-11-12',
          turnoverRate: 12.3
        },
        {
          id: 5,
          itemName: 'USB Cable',
          code: 'ELC005',
          category: 'Electronics',
          currentStock: 25,
          minStockLevel: 50,
          maxStockLevel: 200,
          unitCost: 120,
          totalValue: 3000,
          status: 'low_stock',
          lastRestocked: '2024-11-09',
          turnoverRate: 5.7
        }
      ];

      const metrics: InventoryMetrics = {
        totalItems: mockItems.length,
        totalValue: mockItems.reduce((sum, item) => sum + item.totalValue, 0),
        lowStockItems: mockItems.filter(item => getStockLevel(item) === 'low_stock').length,
        outOfStockItems: mockItems.filter(item => getStockLevel(item) === 'out_of_stock').length,
        overstockItems: mockItems.filter(item => getStockLevel(item) === 'overstock').length,
        averageTurnover: mockItems.reduce((sum, item) => sum + item.turnoverRate, 0) / mockItems.length,
        items: mockItems
      };

      setInventoryMetrics(metrics);
    } catch (error) {
      console.error('Error loading inventory overview:', error);
    }
  };

  return (
    <Box>
      <Typography variant="h5" fontWeight="bold" gutterBottom>
        Inventory Overview
      </Typography>

      {/* Key Inventory Metrics */}
      <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap', mb: 4 }}>
        <Box sx={{ flex: 1, minWidth: '280px' }}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                <InventoryIcon color="primary" sx={{ fontSize: 32 }} />
                <Typography variant="h4" fontWeight="bold" color="primary">
                  {inventoryMetrics.totalItems}
                </Typography>
              </Box>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Total Items
              </Typography>
              <Typography variant="body2" color="success.main">
                Value: {formatCurrency(inventoryMetrics.totalValue)}
              </Typography>
            </CardContent>
          </Card>
        </Box>

        <Box sx={{ flex: 1, minWidth: '280px' }}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                <WarningIcon color="warning" sx={{ fontSize: 32 }} />
                <Typography variant="h4" fontWeight="bold" color="warning.main">
                  {inventoryMetrics.lowStockItems}
                </Typography>
              </Box>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Low Stock Alerts
              </Typography>
              <Typography variant="body2" color="warning.main">
                Need immediate attention
              </Typography>
            </CardContent>
          </Card>
        </Box>

        <Box sx={{ flex: 1, minWidth: '280px' }}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                <ErrorIcon color="error" sx={{ fontSize: 32 }} />
                <Typography variant="h4" fontWeight="bold" color="error.main">
                  {inventoryMetrics.outOfStockItems}
                </Typography>
              </Box>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Out of Stock
              </Typography>
              <Typography variant="body2" color="error.main">
                Urgent restocking required
              </Typography>
            </CardContent>
          </Card>
        </Box>

        <Box sx={{ flex: 1, minWidth: '280px' }}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                <TrendingUpIcon color="info" sx={{ fontSize: 32 }} />
                <Typography variant="h4" fontWeight="bold" color="info.main">
                  {inventoryMetrics.overstockItems}
                </Typography>
              </Box>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Overstocked Items
              </Typography>
              <Typography variant="body2" color="info.main">
                Consider promotions
              </Typography>
            </CardContent>
          </Card>
        </Box>
      </Box>

      {/* Alerts Section */}
      {(inventoryMetrics.outOfStockItems > 0 || inventoryMetrics.lowStockItems > 0) && (
        <Box sx={{ mb: 4 }}>
          {inventoryMetrics.outOfStockItems > 0 && (
            <Alert severity="error" sx={{ mb: 2 }}>
              <strong>Urgent:</strong> {inventoryMetrics.outOfStockItems} item(s) are completely out of stock and need immediate restocking!
            </Alert>
          )}
          {inventoryMetrics.lowStockItems > 0 && (
            <Alert severity="warning">
              <strong>Warning:</strong> {inventoryMetrics.lowStockItems} item(s) are running low on stock. Consider reordering soon.
            </Alert>
          )}
        </Box>
      )}

      {/* Inventory Turnover */}
      <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap', mb: 4 }}>
        <Box sx={{ flex: 1, minWidth: '400px' }}>
          <Card>
            <CardContent>
              <Typography variant="h6" fontWeight="bold" gutterBottom>
                Average Inventory Turnover
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                <Typography variant="h3" fontWeight="bold" color="primary">
                  {inventoryMetrics.averageTurnover.toFixed(1)}
                </Typography>
                <Typography variant="body1" color="text.secondary">
                  times per month
                </Typography>
              </Box>
              <LinearProgress
                variant="determinate"
                value={Math.min((inventoryMetrics.averageTurnover / 15) * 100, 100)}
                color={inventoryMetrics.averageTurnover > 10 ? 'success' : inventoryMetrics.averageTurnover > 5 ? 'warning' : 'error'}
                sx={{ height: 8, borderRadius: 4 }}
              />
              <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                {inventoryMetrics.averageTurnover > 10 ? 'Excellent' : inventoryMetrics.averageTurnover > 5 ? 'Good' : 'Needs Improvement'} turnover rate
              </Typography>
            </CardContent>
          </Card>
        </Box>

        <Box sx={{ flex: 1, minWidth: '400px' }}>
          <Card>
            <CardContent>
              <Typography variant="h6" fontWeight="bold" gutterBottom>
                Inventory Health Score
              </Typography>
              <Box sx={{ mb: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body2">In Stock</Typography>
                  <Typography variant="body2" color="success.main">
                    {inventoryMetrics.totalItems - inventoryMetrics.lowStockItems - inventoryMetrics.outOfStockItems - inventoryMetrics.overstockItems} items
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body2">Low Stock</Typography>
                  <Typography variant="body2" color="warning.main">
                    {inventoryMetrics.lowStockItems} items
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body2">Out of Stock</Typography>
                  <Typography variant="body2" color="error.main">
                    {inventoryMetrics.outOfStockItems} items
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                  <Typography variant="body2">Overstock</Typography>
                  <Typography variant="body2" color="info.main">
                    {inventoryMetrics.overstockItems} items
                  </Typography>
                </Box>
              </Box>
              {inventoryMetrics.totalItems > 0 && (
                <LinearProgress
                  variant="determinate"
                  value={((inventoryMetrics.totalItems - inventoryMetrics.lowStockItems - inventoryMetrics.outOfStockItems) / inventoryMetrics.totalItems) * 100}
                  color="success"
                  sx={{ height: 8, borderRadius: 4 }}
                />
              )}
            </CardContent>
          </Card>
        </Box>
      </Box>

      {/* Detailed Inventory Table */}
      <Card>
        <CardContent>
          <Typography variant="h6" fontWeight="bold" gutterBottom>
            Detailed Inventory Status
          </Typography>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Item</TableCell>
                  <TableCell align="center">Current Stock</TableCell>
                  <TableCell align="center">Min/Max</TableCell>
                  <TableCell align="center">Status</TableCell>
                  <TableCell align="right">Unit Cost</TableCell>
                  <TableCell align="right">Total Value</TableCell>
                  <TableCell align="center">Turnover Rate</TableCell>
                  <TableCell align="center">Last Restocked</TableCell>
                  <TableCell align="center">Action</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {inventoryMetrics.items.map((item) => {
                  const status = getStockLevel(item);
                  const stockPercentage = item.maxStockLevel > 0 ? (item.currentStock / item.maxStockLevel) * 100 : 0;
                  
                  return (
                    <TableRow key={item.id} hover>
                      <TableCell>
                        <Box>
                          <Typography variant="subtitle2" fontWeight="bold">
                            {item.itemName}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {item.code} • {item.category}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell align="center">
                        <Box>
                          <Typography variant="h6" fontWeight="bold">
                            {item.currentStock}
                          </Typography>
                          <LinearProgress
                            variant="determinate"
                            value={Math.min(stockPercentage, 100)}
                            color={status === 'in_stock' ? 'success' : status === 'low_stock' ? 'warning' : status === 'out_of_stock' ? 'error' : 'info'}
                            sx={{ mt: 1, height: 4, borderRadius: 2, width: 80 }}
                          />
                        </Box>
                      </TableCell>
                      <TableCell align="center">
                        <Typography variant="body2">
                          {item.minStockLevel} / {item.maxStockLevel}
                        </Typography>
                      </TableCell>
                      <TableCell align="center">
                        <Chip
                          icon={getStatusIcon(status)}
                          label={getStatusLabel(status)}
                          color={getStatusColor(status) as any}
                          size="small"
                        />
                      </TableCell>
                      <TableCell align="right">
                        <Typography variant="body2">
                          {formatCurrency(item.unitCost)}
                        </Typography>
                      </TableCell>
                      <TableCell align="right">
                        <Typography variant="body2" fontWeight="bold" color="success.main">
                          {formatCurrency(item.totalValue)}
                        </Typography>
                      </TableCell>
                      <TableCell align="center">
                        <Typography variant="body2">
                          {item.turnoverRate.toFixed(1)}x
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          /month
                        </Typography>
                      </TableCell>
                      <TableCell align="center">
                        <Typography variant="body2">
                          {new Date(item.lastRestocked).toLocaleDateString('en-GB')}
                        </Typography>
                      </TableCell>
                      <TableCell align="center">
                        {status === 'out_of_stock' && (
                          <Tooltip title="Urgent: Restock immediately">
                            <IconButton color="error" size="small">
                              <WarningIcon />
                            </IconButton>
                          </Tooltip>
                        )}
                        {status === 'low_stock' && (
                          <Tooltip title="Warning: Stock running low">
                            <IconButton color="warning" size="small">
                              <WarningIcon />
                            </IconButton>
                          </Tooltip>
                        )}
                        {status === 'overstock' && (
                          <Tooltip title="Info: Consider promotion">
                            <IconButton color="info" size="small">
                              <InfoIcon />
                            </IconButton>
                          </Tooltip>
                        )}
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

export default InventoryOverview;