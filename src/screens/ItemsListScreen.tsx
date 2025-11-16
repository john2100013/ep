import React, { useState, useEffect } from 'react';
import {
  Container,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Fab,
  Alert,
  InputAdornment,
  Chip,
  CircularProgress,
} from '@mui/material';
import {
  Add as AddIcon,
  Search as SearchIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { ApiService } from '../services/api';
import type { Item } from '../types';
import Sidebar from '../components/Sidebar';

const ItemsListScreen: React.FC = () => {
  const [items, setItems] = useState<Item[]>([]);
  const [filteredItems, setFilteredItems] = useState<Item[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [stats, setStats] = useState({
    totalItems: 0,
    totalValue: 0,
    lowStockItems: 0,
  });

  const navigate = useNavigate();

  useEffect(() => {
    loadItems();
    loadStats();
  }, []);

  useEffect(() => {
    // Filter items based on search query
    if (searchQuery.trim() === '') {
      setFilteredItems(items);
    } else {
      const filtered = items.filter(item => {
        const itemName = item.item_name || item.description || '';
        const description = item.description || '';
        const searchLower = searchQuery.toLowerCase();
        return itemName.toLowerCase().includes(searchLower) ||
               description.toLowerCase().includes(searchLower);
      });
      setFilteredItems(filtered);
    }
  }, [searchQuery, items]);

  const loadItems = async () => {
    try {
      setLoading(true);
      const response = await ApiService.getItems({ limit: 1000 });
      if (response.success) {
        setItems(response.data.items || []);
        setFilteredItems(response.data.items || []);
      }
    } catch (error: any) {
      console.error('Error loading items:', error);
      setError('Failed to load items');
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const response = await ApiService.getItemStats();
      if (response.success) {
        setStats(response.data.stats);
      }
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
  };

  const handleRefresh = () => {
    loadItems();
    loadStats();
  };

  const formatPrice = (price: any) => {
    const numPrice = parseFloat(price);
    if (isNaN(numPrice)) {
      return 'KSH 0.00';
    }
    return `KSH ${numPrice.toFixed(2)}`;
  };

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, display: 'flex', justifyContent: 'center' }}>
        <CircularProgress />
      </Container>
    );
  }

  // Calculate stats for sidebar
  const currentStats = {
    total: stats.totalItems,
    totalValue: stats.totalValue,
    statusCounts: {
      'in-stock': items.filter(item => item.stock_quantity > 0).length,
      'low-stock': stats.lowStockItems,
      'out-of-stock': items.filter(item => item.stock_quantity === 0).length,
      'showing': filteredItems.length,
    }
  };

  return (
    <Box sx={{ display: 'flex', width: '100vw', minHeight: '100vh', margin: 0 }}>
      {/* Sidebar - hidden on mobile */}
      <Box sx={{ display: { xs: 'none', md: 'block' } }}>
        <Sidebar
          title="Items Management"
          currentStats={currentStats}
        />
      </Box>

      {/* Main Content */}
      <Box sx={{ 
        marginLeft: { xs: 0, md: '350px' }, 
        width: { xs: '100%', md: 'calc(100vw - 350px - 24px)' }, 
        p: { xs: 2, md: 3 }, 
        paddingRight: { xs: 0, md: '24px' },
        overflow: 'auto'
      }}>
        {/* Header */}
        <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, justifyContent: 'space-between', alignItems: { xs: 'stretch', sm: 'center' }, gap: 2, mb: 3 }}>
          <Typography variant="h4" component="h1" sx={{ fontSize: { xs: '1.5rem', md: '2.125rem' } }}>
            Items List
          </Typography>
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={handleRefresh}
          >
            Refresh
          </Button>
        </Box>

        {/* Search */}
        <Paper sx={{ p: { xs: 1.5, md: 2 }, mb: 3 }}>
          <TextField
            placeholder="Search items..."
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
            size="small"
            fullWidth
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
            }}
          />
        </Paper>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError('')}>
            {error}
          </Alert>
        )}

      {/* Items Table */}
      <Card sx={{ elevation: 4, overflowX: { xs: 'auto', md: 'visible' } }}>
        <CardContent sx={{ p: { xs: 1.5, md: 2 } }}>
          <Typography variant="h6" gutterBottom sx={{ fontSize: { xs: '1rem', md: '1.25rem' } }}>
            Items ({filteredItems.length})
          </Typography>
          
          {/* Hint */}
          {filteredItems.length > 0 && (
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2, fontSize: { xs: '0.75rem', md: '0.875rem' } }}>
              💡 Scroll horizontally to see all columns
            </Typography>
          )}

          <TableContainer component={Paper} variant="outlined" sx={{ maxHeight: { xs: 400, md: 600 }, fontSize: { xs: '0.75rem', md: '0.875rem' } }}>
            <Table stickyHeader size="small">
              <TableHead>
                <TableRow>
                  <TableCell sx={{ bgcolor: 'grey.100', minWidth: 60 }}><strong>ITEM NO</strong></TableCell>
                  <TableCell sx={{ bgcolor: 'grey.100', minWidth: 120 }}><strong>ITEM NAME</strong></TableCell>
                  <TableCell sx={{ bgcolor: 'grey.100', minWidth: 200 }}><strong>DESCRIPTION</strong></TableCell>
                  <TableCell sx={{ bgcolor: 'grey.100', minWidth: 80 }}><strong>QTY</strong></TableCell>
                  <TableCell sx={{ bgcolor: 'grey.100', minWidth: 80 }}><strong>UOM</strong></TableCell>
                  <TableCell sx={{ bgcolor: 'grey.100', minWidth: 120 }}><strong>UNIT PRICE</strong></TableCell>
                  <TableCell sx={{ bgcolor: 'grey.100', minWidth: 120 }}><strong>TOTAL AMOUNT</strong></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredItems.map((item, index) => (
                  <TableRow 
                    key={item.id}
                    hover
                    sx={{ 
                      '&:hover': { bgcolor: 'rgba(0, 102, 255, 0.04)' },
                      cursor: 'pointer'
                    }}
                  >
                    <TableCell>{index + 1}</TableCell>
                    <TableCell>{item.item_name || item.description || 'Unnamed Item'}</TableCell>
                    <TableCell>
                      <Typography variant="body2" sx={{ 
                        maxWidth: 200, 
                        overflow: 'hidden', 
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap'
                      }}>
                        {item.description || 'No description'}
                      </Typography>
                    </TableCell>
                    <TableCell align="center">{item.quantity || item.stock_quantity || 0}</TableCell>
                    <TableCell align="center">{item.unit || item.uom || 'PCS'}</TableCell>
                    <TableCell align="right">{formatPrice(item.rate || item.unit_price || 0)}</TableCell>
                    <TableCell align="right">{formatPrice(item.amount || (item.quantity || item.stock_quantity || 0) * (item.rate || item.unit_price || 0))}</TableCell>
                  </TableRow>
                ))}

                {filteredItems.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
                      <Typography variant="body2" color="text.secondary">
                        {searchQuery ? 'No items found matching your search' : 'No items available'}
                      </Typography>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>

          {/* Scroll Hint */}
          {filteredItems.length > 0 && (
            <Box sx={{ mt: 2, p: { xs: 1, md: 1.5 }, bgcolor: 'grey.50', borderRadius: 1, textAlign: 'center' }}>
              <Typography variant="caption" color="text.secondary" sx={{ fontSize: { xs: '0.7rem', md: '0.75rem' } }}>
                💡 Swipe left/right for columns • Scroll up/down for more items
              </Typography>
            </Box>
          )}
        </CardContent>
      </Card>

      {/* Add Item FAB */}
      <Fab
        color="primary"
        aria-label="add item"
        sx={{
          position: 'fixed',
          bottom: { xs: 16, md: 24 },
          right: { xs: 16, md: 24 },
        }}
        onClick={() => navigate('/add-item')}
      >
        <AddIcon />
      </Fab>
      </Box>
    </Box>
  );
};

export default ItemsListScreen;