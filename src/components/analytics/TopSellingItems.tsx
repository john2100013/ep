import React, { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  LinearProgress,
  Alert,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  ButtonGroup,
  Button,
} from '@mui/material';
import {
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
} from '@mui/icons-material';

interface TopSellingItemsProps {
  dateRange: string;
}

interface TopSellingItem {
  id: number;
  itemName: string;
  code: string;
  quantitySold: number;
  revenue: number;
  unitPrice: number;
  category?: string;
  trend: 'up' | 'down' | 'stable';
  trendPercentage: number;
  stockLevel: number;
  velocity: 'fast' | 'medium' | 'slow';
}

const TopSellingItems: React.FC<TopSellingItemsProps> = ({ dateRange }) => {
  const [loading, setLoading] = useState(false);
  const [sortBy, setSortBy] = useState<'quantity' | 'revenue'>('quantity');
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');
  const [topItems, setTopItems] = useState<TopSellingItem[]>([]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const getVelocityColor = (velocity: string) => {
    switch (velocity) {
      case 'fast': return 'success';
      case 'medium': return 'warning';
      case 'slow': return 'error';
      default: return 'default';
    }
  };



  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up': return <TrendingUpIcon fontSize="small" color="success" />;
      case 'down': return <TrendingDownIcon fontSize="small" color="error" />;
      default: return null;
    }
  };

  useEffect(() => {
    loadTopSellingItems();
  }, [dateRange, sortBy]);

  const loadTopSellingItems = async () => {
    setLoading(true);
    try {
      // Mock data - replace with actual API call
      const mockData: TopSellingItem[] = [
        {
          id: 1,
          itemName: 'Premium Coffee Beans',
          code: 'COF001',
          quantitySold: 150,
          revenue: 45000,
          unitPrice: 300,
          category: 'Beverages',
          trend: 'up',
          trendPercentage: 15.2,
          stockLevel: 85,
          velocity: 'fast'
        },
        {
          id: 2,
          itemName: 'Wireless Headphones',
          code: 'ELC002',
          quantitySold: 85,
          revenue: 127500,
          unitPrice: 1500,
          category: 'Electronics',
          trend: 'up',
          trendPercentage: 8.7,
          stockLevel: 42,
          velocity: 'fast'
        },
        {
          id: 3,
          itemName: 'Office Chair',
          code: 'FUR003',
          quantitySold: 45,
          revenue: 135000,
          unitPrice: 3000,
          category: 'Furniture',
          trend: 'stable',
          trendPercentage: 0,
          stockLevel: 25,
          velocity: 'medium'
        },
        {
          id: 4,
          itemName: 'Notebook Set',
          code: 'STA004',
          quantitySold: 200,
          revenue: 20000,
          unitPrice: 100,
          category: 'Stationery',
          trend: 'down',
          trendPercentage: -5.3,
          stockLevel: 150,
          velocity: 'medium'
        },
        {
          id: 5,
          itemName: 'USB Cable',
          code: 'ELC005',
          quantitySold: 75,
          revenue: 11250,
          unitPrice: 150,
          category: 'Electronics',
          trend: 'up',
          trendPercentage: 12.1,
          stockLevel: 180,
          velocity: 'slow'
        }
      ];

      // Sort based on selection
      const sorted = [...mockData].sort((a, b) => {
        if (sortBy === 'quantity') {
          return b.quantitySold - a.quantitySold;
        } else {
          return b.revenue - a.revenue;
        }
      });

      setTopItems(sorted);
    } catch (error) {
      console.error('Error loading top selling items:', error);
    } finally {
      setLoading(false);
    }
  };

  const maxQuantity = Math.max(...topItems.map(item => item.quantitySold));

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" fontWeight="bold">
          Top Selling Items
        </Typography>
        
        <Box sx={{ display: 'flex', gap: 2 }}>
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel>Sort By</InputLabel>
            <Select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as 'quantity' | 'revenue')}
              label="Sort By"
            >
              <MenuItem value="quantity">Quantity</MenuItem>
              <MenuItem value="revenue">Revenue</MenuItem>
            </Select>
          </FormControl>
          
          <ButtonGroup size="small">
            <Button 
              variant={viewMode === 'table' ? 'contained' : 'outlined'}
              onClick={() => setViewMode('table')}
            >
              Table
            </Button>
            <Button 
              variant={viewMode === 'cards' ? 'contained' : 'outlined'}
              onClick={() => setViewMode('cards')}
            >
              Cards
            </Button>
          </ButtonGroup>
        </Box>
      </Box>

      {/* Summary Cards */}
      <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap', mb: 4 }}>
        <Box sx={{ flex: 1, minWidth: '280px' }}>
          <Card>
            <CardContent>
              <Typography variant="h6" color="primary" gutterBottom>
                Fast Moving Items
              </Typography>
              <Typography variant="h4" fontWeight="bold">
                {topItems.filter(item => item.velocity === 'fast').length}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                High velocity products
              </Typography>
            </CardContent>
          </Card>
        </Box>
        
        <Box sx={{ flex: 1, minWidth: '280px' }}>
          <Card>
            <CardContent>
              <Typography variant="h6" color="warning.main" gutterBottom>
                Slow Moving Items
              </Typography>
              <Typography variant="h4" fontWeight="bold">
                {topItems.filter(item => item.velocity === 'slow').length}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Need attention
              </Typography>
            </CardContent>
          </Card>
        </Box>
        
        <Box sx={{ flex: 1, minWidth: '280px' }}>
          <Card>
            <CardContent>
              <Typography variant="h6" color="success.main" gutterBottom>
                Total Revenue
              </Typography>
              <Typography variant="h4" fontWeight="bold">
                {formatCurrency(topItems.reduce((sum, item) => sum + item.revenue, 0))}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                From top items
              </Typography>
            </CardContent>
          </Card>
        </Box>
      </Box>

      {/* Data Display */}
      {viewMode === 'table' ? (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Rank</TableCell>
                <TableCell>Item</TableCell>
                <TableCell align="center">Quantity Sold</TableCell>
                <TableCell align="right">Revenue</TableCell>
                <TableCell align="center">Unit Price</TableCell>
                <TableCell align="center">Velocity</TableCell>
                <TableCell align="center">Trend</TableCell>
                <TableCell align="center">Stock Level</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {topItems.map((item, index) => (
                <TableRow key={item.id} hover>
                  <TableCell>
                    <Typography variant="h6" color="primary" fontWeight="bold">
                      #{index + 1}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Box>
                      <Typography variant="subtitle1" fontWeight="bold">
                        {item.itemName}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {item.code} • {item.category}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell align="center">
                    <Box>
                      <Typography variant="h6" fontWeight="bold">
                        {item.quantitySold}
                      </Typography>
                      <LinearProgress
                        variant="determinate"
                        value={(item.quantitySold / maxQuantity) * 100}
                        sx={{ mt: 1, height: 4, borderRadius: 2 }}
                      />
                    </Box>
                  </TableCell>
                  <TableCell align="right">
                    <Typography variant="h6" fontWeight="bold" color="success.main">
                      {formatCurrency(item.revenue)}
                    </Typography>
                  </TableCell>
                  <TableCell align="center">
                    <Typography variant="body1">
                      {formatCurrency(item.unitPrice)}
                    </Typography>
                  </TableCell>
                  <TableCell align="center">
                    <Chip
                      label={item.velocity.toUpperCase()}
                      color={getVelocityColor(item.velocity) as any}
                      size="small"
                    />
                  </TableCell>
                  <TableCell align="center">
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
                      {getTrendIcon(item.trend)}
                      <Typography 
                        variant="body2" 
                        color={item.trend === 'up' ? 'success.main' : item.trend === 'down' ? 'error.main' : 'text.secondary'}
                      >
                        {item.trendPercentage > 0 ? '+' : ''}{item.trendPercentage}%
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell align="center">
                    <Typography 
                      variant="body2" 
                      color={item.stockLevel < 50 ? 'error.main' : 'text.primary'}
                    >
                      {item.stockLevel} units
                    </Typography>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      ) : (
        <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
          {topItems.map((item, index) => (
            <Box key={item.id} sx={{ flex: '1 1 300px', minWidth: '300px' }}>
              <Card sx={{ height: '100%' }}>
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                    <Typography variant="h6" color="primary" fontWeight="bold">
                      #{index + 1}
                    </Typography>
                    <Chip
                      label={item.velocity}
                      color={getVelocityColor(item.velocity) as any}
                      size="small"
                    />
                  </Box>
                  
                  <Typography variant="h6" fontWeight="bold" gutterBottom>
                    {item.itemName}
                  </Typography>
                  
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    {item.code} • {item.category}
                  </Typography>
                  
                  <Box sx={{ mt: 2, mb: 2 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Typography variant="body2">Quantity Sold:</Typography>
                      <Typography variant="body2" fontWeight="bold">{item.quantitySold}</Typography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Typography variant="body2">Revenue:</Typography>
                      <Typography variant="body2" fontWeight="bold" color="success.main">
                        {formatCurrency(item.revenue)}
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Typography variant="body2">Stock Level:</Typography>
                      <Typography 
                        variant="body2" 
                        fontWeight="bold"
                        color={item.stockLevel < 50 ? 'error.main' : 'text.primary'}
                      >
                        {item.stockLevel} units
                      </Typography>
                    </Box>
                  </Box>
                  
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      {getTrendIcon(item.trend)}
                      <Typography 
                        variant="body2" 
                        color={item.trend === 'up' ? 'success.main' : item.trend === 'down' ? 'error.main' : 'text.secondary'}
                      >
                        {item.trendPercentage > 0 ? '+' : ''}{item.trendPercentage}%
                      </Typography>
                    </Box>
                    <Typography variant="body2" color="text.secondary">
                      vs previous period
                    </Typography>
                  </Box>
                </CardContent>
              </Card>
            </Box>
          ))}
        </Box>
      )}

      {topItems.length === 0 && !loading && (
        <Alert severity="info">
          No sales data available for the selected period.
        </Alert>
      )}
    </Box>
  );
};

export default TopSellingItems;