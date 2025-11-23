import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  Card, 
  CardContent,
  CircularProgress,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip
} from '@mui/material';
import {
  ArrowUpward as ArrowUpIcon,
  ArrowDownward as ArrowDownIcon,
  Inventory as InventoryIcon
} from '@mui/icons-material';

interface StockMovementProps {
  dateRange: string;
}

interface StockMovementItem {
  id: number;
  itemName: string;
  sku: string;
  category: string;
  inwardMovement: number;
  outwardMovement: number;
  netMovement: number;
  currentStock: number;
  averageMovement: number;
  movementType: 'Fast' | 'Medium' | 'Slow';
}

interface MovementSummary {
  totalInward: number;
  totalOutward: number;
  netMovement: number;
  activeItems: number;
}

const StockMovement: React.FC<StockMovementProps> = ({ dateRange }) => {
  const [movements, setMovements] = useState<StockMovementItem[]>([]);
  const [summary, setSummary] = useState<MovementSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchStockMovement();
  }, [dateRange]);

  const fetchStockMovement = async () => {
    try {
      setLoading(true);
      const { api } = await import('../../services/api');
      const response = await api.get('/analytics/stock-movement');
      
      if (response.data) {
        setMovements(response.data.movements || []);
        setSummary(response.data.summary || null);
      }
    } catch (err: any) {
      console.error('Error fetching stock movement:', err);
      setError(err?.response?.data?.error || err?.message || 'Failed to fetch stock movement data');
      setMovements([]);
      setSummary(null);
    } finally {
      setLoading(false);
    }
  };

  const getMovementColor = (type: string) => {
    switch (type) {
      case 'Fast': return 'success';
      case 'Medium': return 'warning';
      case 'Slow': return 'error';
      default: return 'default';
    }
  };

  const getNetMovementIcon = (netMovement: number) => {
    if (netMovement > 0) return <ArrowUpIcon color="success" />;
    if (netMovement < 0) return <ArrowDownIcon color="error" />;
    return <InventoryIcon color="warning" />;
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight={300}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ mt: 2 }}>
        {error}
      </Alert>
    );
  }

  return (
    <Box>
      <Typography variant="h5" fontWeight="bold" gutterBottom>
        Stock Movement Analysis
      </Typography>
      
      <Box display="flex" gap={3} flexDirection={{ xs: 'column', md: 'row' }}>
        <Box flex={1}>
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Movement Summary
              </Typography>
              {summary && (
                <Box>
                  <Box display="flex" justifyContent="space-between" sx={{ mb: 2 }}>
                    <Typography variant="body2">Total Inward</Typography>
                    <Box display="flex" alignItems="center" gap={1}>
                      <ArrowUpIcon color="success" fontSize="small" />
                      <Typography variant="body2" color="success.main" fontWeight="bold">
                        {summary.totalInward.toLocaleString()}
                      </Typography>
                    </Box>
                  </Box>
                  
                  <Box display="flex" justifyContent="space-between" sx={{ mb: 2 }}>
                    <Typography variant="body2">Total Outward</Typography>
                    <Box display="flex" alignItems="center" gap={1}>
                      <ArrowDownIcon color="error" fontSize="small" />
                      <Typography variant="body2" color="error.main" fontWeight="bold">
                        {summary.totalOutward.toLocaleString()}
                      </Typography>
                    </Box>
                  </Box>
                  
                  <Box display="flex" justifyContent="space-between" sx={{ mb: 2 }}>
                    <Typography variant="body2">Net Movement</Typography>
                    <Box display="flex" alignItems="center" gap={1}>
                      {getNetMovementIcon(summary.netMovement)}
                      <Typography 
                        variant="body2" 
                        color={summary.netMovement > 0 ? 'success.main' : summary.netMovement < 0 ? 'error.main' : 'warning.main'}
                        fontWeight="bold"
                      >
                        {summary.netMovement > 0 ? '+' : ''}{summary.netMovement.toLocaleString()}
                      </Typography>
                    </Box>
                  </Box>
                  
                  <Box display="flex" justifyContent="space-between">
                    <Typography variant="body2">Active Items</Typography>
                    <Typography variant="body2" fontWeight="bold">
                      {summary.activeItems.toLocaleString()}
                    </Typography>
                  </Box>
                </Box>
              )}
            </CardContent>
          </Card>
        </Box>
        
        <Box flex={2}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Item Movement Details
              </Typography>
              <TableContainer component={Paper} variant="outlined">
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Item</TableCell>
                      <TableCell align="right">Inward</TableCell>
                      <TableCell align="right">Outward</TableCell>
                      <TableCell align="right">Net</TableCell>
                      <TableCell align="right">Current Stock</TableCell>
                      <TableCell align="center">Movement</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {movements.slice(0, 10).map((item) => (
                      <TableRow key={item.id}>
                        <TableCell>
                          <Box>
                            <Typography variant="body2" fontWeight="medium">
                              {item.itemName}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {item.sku} • {item.category}
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell align="right">
                          <Typography variant="body2" color="success.main">
                            +{item.inwardMovement}
                          </Typography>
                        </TableCell>
                        <TableCell align="right">
                          <Typography variant="body2" color="error.main">
                            -{item.outwardMovement}
                          </Typography>
                        </TableCell>
                        <TableCell align="right">
                          <Box display="flex" alignItems="center" justifyContent="flex-end" gap={0.5}>
                            {getNetMovementIcon(item.netMovement)}
                            <Typography 
                              variant="body2" 
                              color={item.netMovement > 0 ? 'success.main' : item.netMovement < 0 ? 'error.main' : 'warning.main'}
                            >
                              {item.netMovement > 0 ? '+' : ''}{item.netMovement}
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell align="right">
                          {item.currentStock}
                        </TableCell>
                        <TableCell align="center">
                          <Chip
                            label={item.movementType}
                            color={getMovementColor(item.movementType) as any}
                            size="small"
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Box>
      </Box>
    </Box>
  );
};

export default StockMovement;