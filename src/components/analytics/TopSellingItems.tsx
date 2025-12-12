// Type for top selling items
type TopSellingItem = {
  id: number;
  itemName: string;
  velocity: 'fast' | 'medium' | 'slow';
  sales: number;
  quantity: number;
  buyingPrice: number;
  sellingPrice: number;
  profit: number;
};
import React, { useState, useEffect } from 'react';
import { Box, Typography, LinearProgress, Alert, Card, CardContent, TableContainer, Table, TableHead, TableRow, TableCell, TableBody, Button, ButtonGroup, Chip } from '@mui/material';
import { TrendingUp as TrendingUpIcon, TrendingDown as TrendingDownIcon } from '@mui/icons-material';

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-KE', {
    style: 'currency',
    currency: 'KES',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount);
};



const TopSellingItems = ({ dateRange }: { dateRange: string }) => {
  const [topItems, setTopItems] = useState<TopSellingItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');

  useEffect(() => {
    const fetchTopSellingItems = async () => {
      setLoading(true);
      setError(null);
      try {
        const { api } = await import('../../services/api');
        const response = await api.get('/analytics/top-selling-items', {
          params: { dateRange }
        });
        
        console.log('📊 Top Selling Items Response:', response.data);
        
        if (response.data) {
          const items = response.data.items || response.data || [];
          console.log('📊 Top Selling Items Parsed:', items.length, 'items');
          console.log('📊 Sample item:', items[0] || 'No items');
          setTopItems(items);
        } else {
          console.log('📊 No data in response');
          setTopItems([]);
        }
      } catch (err: any) {
        console.error('Error fetching top selling items:', err);
        console.error('Error details:', err.response?.data);
        setError(err?.response?.data?.error || 'Failed to fetch top selling items');
        setTopItems([]);
      } finally {
        setLoading(false);
      }
    };
    
    fetchTopSellingItems();
  }, [dateRange]);

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" fontWeight="bold">
          Top Selling Items
        </Typography>
        <ButtonGroup variant="outlined" size="small">
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
      {loading && <LinearProgress sx={{ mb: 2 }} />}
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
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
                Medium Velocity Items
              </Typography>
              <Typography variant="h4" fontWeight="bold">
                {topItems.filter(item => item.velocity === 'medium').length}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Moderate sales
              </Typography>
            </CardContent>
          </Card>
        </Box>
      </Box>
      {/* Table or Cards view */}
      {viewMode === 'table' ? (
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Item Name</TableCell>
                <TableCell align="right">Quantity</TableCell>
                <TableCell align="right">Buying Price</TableCell>
                <TableCell align="right">Selling Price</TableCell>
                <TableCell align="right">Sales</TableCell>
                <TableCell align="right">Profit</TableCell>
                <TableCell>Velocity</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {topItems.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>{item.itemName}</TableCell>
                  <TableCell align="right">{item.quantity}</TableCell>
                  <TableCell align="right">{formatCurrency(item.buyingPrice)}</TableCell>
                  <TableCell align="right">{formatCurrency(item.sellingPrice)}</TableCell>
                  <TableCell align="right">
                    <Typography variant="body2" fontWeight="bold">
                      {formatCurrency(item.sales)}
                    </Typography>
                  </TableCell>
                  <TableCell align="right">
                    <Typography variant="body2" sx={{ color: 'success.main' }} fontWeight="bold">
                      {formatCurrency(item.profit)}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={item.velocity}
                      color={
                        item.velocity === 'fast' ? 'success' :
                        item.velocity === 'medium' ? 'warning' : 'default'
                      }
                      size="small"
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      ) : (
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
          {topItems.map((item) => (
            <Card key={item.id} sx={{ minWidth: 220, mb: 2 }}>
              <CardContent>
                <Typography variant="h6" fontWeight="bold">
                  {item.itemName}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Quantity: {item.quantity}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Sales: {formatCurrency(item.sales)}
                </Typography>
                <Typography variant="body2" color="success.main" fontWeight="bold">
                  Profit: {formatCurrency(item.profit)}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Velocity: {item.velocity}
                </Typography>
              </CardContent>
            </Card>
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