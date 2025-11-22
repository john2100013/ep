// Type for top selling items
type TopSellingItem = {
  id: number;
  itemName: string;
  velocity: 'fast' | 'medium' | 'slow';
  sales: number;
  quantity: number;
};
import React, { useState, useEffect } from 'react';
import { Box, Typography, LinearProgress, Alert, Card, CardContent, TableContainer, Table, TableHead, TableRow, TableCell, TableBody, Button, ButtonGroup, Chip } from '@mui/material';
import { TrendingUp as TrendingUpIcon, TrendingDown as TrendingDownIcon } from '@mui/icons-material';



const TopSellingItems = ({ dateRange }: { dateRange: string }) => {
  const [topItems, setTopItems] = useState<TopSellingItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');

  useEffect(() => {
    setLoading(true);
    setError(null);
    // Fetch from backend API
    fetch(`/analytics/top-selling-items?dateRange=${dateRange}`)
      .then(res => res.json())
      .then(data => {
        setTopItems(data.items || []);
        setLoading(false);
      })
      .catch(err => {
        setError('Failed to fetch top selling items');
        setLoading(false);
      });
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
                <TableCell>Sales</TableCell>
                <TableCell>Quantity</TableCell>
                <TableCell>Velocity</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {topItems.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>{item.itemName}</TableCell>
                  <TableCell>{item.sales}</TableCell>
                  <TableCell>{item.quantity}</TableCell>
                  <TableCell>{item.velocity}</TableCell>
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
                  Sales: {item.sales}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Quantity: {item.quantity}
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