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
  IconButton,
  Alert,
  Fab,
  List,
  ListItem,
  ListItemText,
  ListItemButton,
  Divider,
  Chip,
} from '@mui/material';
import {
  Add as AddIcon,
  Remove as RemoveIcon,
  Delete as DeleteIcon,
  Visibility as PreviewIcon,
  Search as SearchIcon,
  Close as CloseIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { ApiService } from '../services/api';
import type { Item, InvoiceLine } from '../types';

const CreateInvoiceScreen: React.FC = () => {
  const [customerName, setCustomerName] = useState('');
  const [customerAddress, setCustomerAddress] = useState('');
  const [customerPin, setCustomerPin] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [items, setItems] = useState<Item[]>([]);
  const [selectedItems, setSelectedItems] = useState<InvoiceLine[]>([]);
  const [showItemsList, setShowItemsList] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const navigate = useNavigate();

  const formatPrice = (price: any) => {
    const numPrice = parseFloat(price);
    if (isNaN(numPrice)) {
      return '0.00';
    }
    return numPrice.toFixed(2);
  };

  const getItemPrice = (item: Item) => {
    const rateValue = typeof item.rate === 'string' ? parseFloat(item.rate) : (item.rate || 0);
    const unitPriceValue = typeof item.unit_price === 'string' ? parseFloat(item.unit_price) : (item.unit_price || 0);
    return rateValue || unitPriceValue || 0;
  };

  useEffect(() => {
    loadItems();
  }, []);

  const loadItems = async () => {
    try {
      setLoading(true);
      const response = await ApiService.getItems({ limit: 100 });
      if (response.success) {
        setItems(response.data.items || []);
      }
    } catch (error) {
      console.error('Error loading items:', error);
      setError('Failed to load items');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    if (!query.trim()) {
      loadItems();
      return;
    }

    try {
      setLoading(true);
      const response = await ApiService.getItems({ search: query, limit: 100 });
      if (response.success) {
        setItems(response.data.items || []);
      }
    } catch (error) {
      console.error('Error searching items:', error);
      setError('Failed to search items');
    } finally {
      setLoading(false);
    }
  };

  const addItemToInvoice = (item: Item) => {
    const existingIndex = selectedItems.findIndex(selected => selected.item_id === item.id);
    
    if (existingIndex >= 0) {
      // Item already exists, increase quantity
      const updated = [...selectedItems];
      updated[existingIndex].quantity += 1;
      updated[existingIndex].total = updated[existingIndex].quantity * updated[existingIndex].unit_price;
      setSelectedItems(updated);
    } else {
      // Add new item - handle missing properties safely
      const unitPrice = getItemPrice(item);
      
      const newLine: InvoiceLine = {
        item_id: item.id,
        code: item.code || `ITEM${item.id.toString().padStart(3, '0')}`,
        description: item.item_name || item.description || 'Unnamed Item',
        quantity: 1,
        unit_price: unitPrice,
        uom: item.unit || item.uom || 'PCS',
        total: unitPrice
      };
      setSelectedItems([...selectedItems, newLine]);
    }
    
    setShowItemsList(false);
    setSearchQuery('');
  };

  const updateQuantity = (index: number, quantity: number) => {
    if (quantity <= 0) {
      removeItem(index);
      return;
    }

    const updated = [...selectedItems];
    updated[index].quantity = quantity;
    updated[index].total = quantity * updated[index].unit_price;
    setSelectedItems(updated);
  };

  const removeItem = (index: number) => {
    const updated = selectedItems.filter((_, i) => i !== index);
    setSelectedItems(updated);
  };

  const calculateTotals = () => {
    const subtotal = selectedItems.reduce((sum, item) => sum + item.total, 0);
    const vat = subtotal * 0.16;
    const total = subtotal + vat;
    return { subtotal, vat, total };
  };

  const goPreview = () => {
    if (!customerName.trim()) {
      setError('Please enter customer name');
      return;
    }

    if (selectedItems.length === 0) {
      setError('Please add at least one item');
      return;
    }

    navigate('/invoice-preview', {
      state: {
        lines: selectedItems,
        customerName: customerName.trim(),
        customerAddress: customerAddress.trim() || undefined,
        customerPin: customerPin.trim() || undefined,
      }
    });
  };

  const { subtotal, vat, total } = calculateTotals();

  const filteredItems = items.filter(item => {
    const itemName = item.item_name || item.description || '';
    const description = item.description || '';
    const searchLower = searchQuery.toLowerCase();
    return itemName.toLowerCase().includes(searchLower) ||
           description.toLowerCase().includes(searchLower);
  });

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      {/* Customer Information */}
      <Card sx={{ mb: 3, elevation: 4 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom color="primary">
            Customer Information
          </Typography>
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', '& > *': { flex: '1 1 250px', minWidth: '200px' } }}>
            <TextField
              fullWidth
              label="Customer Name *"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              margin="normal"
            />
            <TextField
              fullWidth
              label="Customer Address"
              value={customerAddress}
              onChange={(e) => setCustomerAddress(e.target.value)}
              margin="normal"
              multiline
            />
            <TextField
              fullWidth
              label="Customer PIN"
              value={customerPin}
              onChange={(e) => setCustomerPin(e.target.value)}
              margin="normal"
            />
          </Box>
        </CardContent>
      </Card>

      {/* Order Signatures */}
      <Card sx={{ mb: 3, elevation: 4 }}>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6" color="primary">
              Order Signatures
            </Typography>
            <Button
              variant="outlined"
              startIcon={<SearchIcon />}
              onClick={() => navigate('/business-settings')}
            >
              Configure
            </Button>
          </Box>
          <Typography variant="body2" color="text.secondary">
            Set who creates and approves orders. This information will be automatically included in all invoices.
          </Typography>
          <Button 
            variant="outlined" 
            startIcon={<SearchIcon />}
            onClick={() => navigate('/business-settings')}
            sx={{ mt: 2 }}
          >
            Configure Signatures
          </Button>
        </CardContent>
      </Card>

      {/* Item Search */}
      <Card sx={{ mb: 3, elevation: 4 }}>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6" color="primary">
              Add Items
            </Typography>
            {showItemsList && (
              <IconButton onClick={() => {
                setShowItemsList(false);
                setSearchQuery('');
              }}>
                <CloseIcon />
              </IconButton>
            )}
          </Box>
          
          <TextField
            fullWidth
            label="Search items..."
            value={searchQuery}
            onChange={(e) => {
              handleSearch(e.target.value);
              setShowItemsList(true);
            }}
            onFocus={() => setShowItemsList(true)}
            disabled={loading}
            InputProps={{
              endAdornment: <SearchIcon />
            }}
          />
          
          {showItemsList && (
            <Paper sx={{ mt: 2, maxHeight: 300, overflow: 'auto' }}>
              <List>
                {filteredItems.map((item) => (
                  <React.Fragment key={item.id}>
                    <ListItemButton onClick={() => addItemToInvoice(item)}>
                      <ListItemText
                        primary={item.item_name || 'Unnamed Item'}
                        secondary={`Price: KSH ${formatPrice(getItemPrice(item))} • Unit: ${item.unit || item.uom || 'PCS'} • Description: ${item.description || 'N/A'}`}
                      />
                      <AddIcon color="primary" />
                    </ListItemButton>
                    <Divider />
                  </React.Fragment>
                ))}
                {filteredItems.length === 0 && (
                  <ListItem>
                    <ListItemText primary="No items found" />
                  </ListItem>
                )}
              </List>
            </Paper>
          )}
        </CardContent>
      </Card>

      {/* Selected Items Table */}
      <Card sx={{ mb: 3, elevation: 4 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom color="primary">
            Selected Items
          </Typography>
          
          <Chip 
            label={`${selectedItems.length} items selected`}
            color="primary" 
            sx={{ mb: 2 }}
          />
          
          {selectedItems.length === 0 ? (
            <Typography variant="body2" color="text.secondary" align="center" sx={{ py: 4 }}>
              No items added yet
            </Typography>
          ) : (
            <TableContainer component={Paper} variant="outlined">
              <Table size="small">
                <TableHead>
                  <TableRow sx={{ bgcolor: 'grey.100' }}>
                    <TableCell><strong>NO</strong></TableCell>
                    <TableCell><strong>ITEM CODE</strong></TableCell>
                    <TableCell><strong>DESCRIPTION</strong></TableCell>
                    <TableCell><strong>QTY</strong></TableCell>
                    <TableCell><strong>UOM</strong></TableCell>
                    <TableCell><strong>UNIT PRICE</strong></TableCell>
                    <TableCell><strong>TOTAL</strong></TableCell>
                    <TableCell><strong>ACTION</strong></TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {selectedItems.map((item, index) => (
                    <TableRow key={index}>
                      <TableCell>{index + 1}</TableCell>
                      <TableCell>{item.code}</TableCell>
                      <TableCell>{item.description}</TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <IconButton 
                            size="small"
                            onClick={() => updateQuantity(index, item.quantity - 1)}
                          >
                            <RemoveIcon />
                          </IconButton>
                          <Typography>{item.quantity}</Typography>
                          <IconButton 
                            size="small"
                            onClick={() => updateQuantity(index, item.quantity + 1)}
                          >
                            <AddIcon />
                          </IconButton>
                        </Box>
                      </TableCell>
                      <TableCell>{item.uom || ''}</TableCell>
                      <TableCell>KSH {formatPrice(item.unit_price)}</TableCell>
                      <TableCell>KSH {formatPrice(item.total)}</TableCell>
                      <TableCell>
                        <IconButton 
                          size="small"
                          color="error"
                          onClick={() => removeItem(index)}
                        >
                          <DeleteIcon />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </CardContent>
      </Card>

      {/* Totals */}
      {selectedItems.length > 0 && (
        <Card sx={{ mb: 3, elevation: 4 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Summary
            </Typography>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
              <Typography>Subtotal:</Typography>
              <Typography>KSH {formatPrice(subtotal)}</Typography>
            </Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
              <Typography>VAT (16%):</Typography>
              <Typography>KSH {formatPrice(vat)}</Typography>
            </Box>
            <Divider sx={{ my: 1 }} />
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Typography variant="h6">Total:</Typography>
              <Typography variant="h6">KSH {formatPrice(total)}</Typography>
            </Box>
          </CardContent>
        </Card>
      )}

      {/* Preview Button */}
      <Fab
        variant="extended"
        color="primary"
        onClick={goPreview}
        disabled={selectedItems.length === 0 || !customerName.trim()}
        sx={{
          position: 'fixed',
          bottom: 16,
          right: 16,
        }}
      >
        <PreviewIcon sx={{ mr: 1 }} />
        Preview Quotation
      </Fab>
    </Container>
  );
};

export default CreateInvoiceScreen;