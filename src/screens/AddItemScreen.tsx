import React, { useState, useEffect } from 'react';
import {
  Container,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Box,
  Alert,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';
import { Save as SaveIcon, Cancel as CancelIcon } from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { useNavigate } from 'react-router-dom';
import { ApiService } from '../services/api';
import Sidebar from '../components/Sidebar';

const AddItemScreen: React.FC = () => {
  const [formData, setFormData] = useState({
    item_name: '',
    description: '',
    quantity: '',
    buying_price: '',
    selling_price: '',
    rate: '',
    unit: '',
    category_id: '',
  });
  const [manufacturingDate, setManufacturingDate] = useState<Date | null>(null);
  const [expiryDate, setExpiryDate] = useState<Date | null>(null);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const navigate = useNavigate();

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const response = await ApiService.getItemCategories();
      if (response.success) {
        setCategories(response.data.categories || []);
      }
    } catch (err) {
      console.error('Error fetching categories:', err);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSave = async () => {
    setError('');
    setSuccess('');

    // Validation
    if (!formData.item_name.trim()) {
      setError('Item name is required');
      return;
    }

    if (!formData.category_id) {
      setError('Category is required');
      return;
    }

    if (!formData.quantity || parseFloat(formData.quantity) < 0) {
      setError('Valid quantity is required');
      return;
    }

    if (!formData.buying_price || parseFloat(formData.buying_price) < 0) {
      setError('Valid buying price is required');
      return;
    }

    if (!formData.selling_price || parseFloat(formData.selling_price) < 0) {
      setError('Valid selling price is required');
      return;
    }

    setLoading(true);

    try {
      await ApiService.createItem({
        item_name: formData.item_name.trim(),
        description: formData.description.trim(),
        quantity: parseFloat(formData.quantity),
        buying_price: parseFloat(formData.buying_price),
        selling_price: parseFloat(formData.selling_price),
        rate: parseFloat(formData.selling_price), // Use selling price as rate for compatibility
        unit: formData.unit.trim() || undefined,
        category_id: parseInt(formData.category_id),
        manufacturing_date: manufacturingDate?.toISOString().split('T')[0] || undefined,
        expiry_date: expiryDate?.toISOString().split('T')[0] || undefined,
      });

      setSuccess('Item added successfully!');
      
      // Reset form
      setFormData({
        item_name: '',
        description: '',
        quantity: '',
        buying_price: '',
        selling_price: '',
        rate: '',
        unit: '',
        category_id: '',
      });
      setManufacturingDate(null);
      setExpiryDate(null);
      
      // Navigate back after short delay
      setTimeout(() => {
        navigate('/items-list');
      }, 1500);
    } catch (error: any) {
      setError(error.response?.data?.message || 'Failed to add item');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    navigate(-1);
  };

  return (
    <Box sx={{ display: 'flex', width: '100vw', minHeight: '100vh', margin: 0 }}>
      {/* Sidebar - hidden on mobile */}
      <Box sx={{ display: { xs: 'none', md: 'block' } }}>
        <Sidebar title="Add New Item" />
      </Box>

      {/* Main Content */}
      <Box sx={{ 
        marginLeft: { xs: 0, md: '350px' }, 
        width: { xs: '100%', md: 'calc(100vw - 350px - 24px)' }, 
        p: { xs: 2, md: 3 }, 
        paddingRight: { xs: 0, md: '24px' },
        overflow: 'auto',
        display: 'flex',
        justifyContent: 'center'
      }}>
        <Box sx={{ maxWidth: 'md', width: '100%' }}>
          <Card elevation={4}>
            <CardContent sx={{ p: { xs: 1.5, md: 2 } }}>
              <Typography variant="h4" component="h1" gutterBottom color="primary" align="center" sx={{ fontSize: { xs: '1.5rem', md: '2.125rem' } }}>
                Add New Item
              </Typography>

              {error && (
                <Alert severity="error" sx={{ mb: 2 }}>
                  {error}
                </Alert>
              )}

              {success && (
                <Alert severity="success" sx={{ mb: 2 }}>
                  {success}
                </Alert>
              )}

              <Card variant="outlined" sx={{ mt: 3 }}>
                <CardContent>
                  <Typography variant="h6" gutterBottom sx={{ fontSize: { xs: '1rem', md: '1.25rem' } }}>
                    Item Information
                  </Typography>

                  <Box sx={{ display: 'flex', gap: { xs: 1, md: 2 }, flexWrap: 'wrap', '& > *': { flex: '1 1 100%', md: { flex: '1 1 300px' }, minWidth: '250px' } }}>
                    <TextField
                      fullWidth
                      label="Item Name *"
                      name="item_name"
                      value={formData.item_name}
                      onChange={handleChange}
                      margin="normal"
                      placeholder="e.g., Product Name"
                    />
                    
                    <FormControl fullWidth margin="normal" required>
                      <InputLabel>Category *</InputLabel>
                      <Select
                        name="category_id"
                        value={formData.category_id}
                        onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
                        label="Category *"
                      >
                        <MenuItem value="">
                          <em>Select a category</em>
                        </MenuItem>
                        {categories.map((category) => (
                          <MenuItem key={category.id} value={category.id}>
                            {category.name}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                    
                    <TextField
                      fullWidth
                      label="Unit (UOM)"
                      name="unit"
                      value={formData.unit}
                      onChange={handleChange}
                      margin="normal"
                      placeholder="e.g., PCS, KG, M"
                    />
                      </Box>

                  <TextField
                    fullWidth
                    label="Description *"
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    margin="normal"
                    multiline
                    rows={3}
                    placeholder="Detailed description of the item"
                  />

                  <LocalizationProvider dateAdapter={AdapterDateFns}>
                    <Box sx={{ display: 'flex', gap: { xs: 1, md: 2 }, flexWrap: 'wrap', '& > *': { flex: '1 1 100%', md: { flex: '1 1 300px' }, minWidth: '250px' } }}>
                      <DatePicker
                        label="Manufacturing Date"
                        value={manufacturingDate}
                        onChange={(newValue) => setManufacturingDate(newValue)}
                        slotProps={{
                          textField: {
                            fullWidth: true,
                            margin: 'normal'
                          }
                        }}
                      />
                      
                      <DatePicker
                        label="Expiry Date"
                        value={expiryDate}
                        onChange={(newValue) => setExpiryDate(newValue)}
                        slotProps={{
                          textField: {
                            fullWidth: true,
                            margin: 'normal'
                          }
                        }}
                      />
                    </Box>
                  </LocalizationProvider>

                  <Box sx={{ display: 'flex', gap: { xs: 1, md: 2 }, flexWrap: 'wrap', '& > *': { flex: '1 1 100%', md: { flex: '1 1 200px' }, minWidth: '200px' } }}>
                    <TextField
                      fullWidth
                      label="Quantity *"
                      name="quantity"
                      type="number"
                      value={formData.quantity}
                      onChange={handleChange}
                      margin="normal"
                      inputProps={{ min: 0, step: 0.01 }}
                    />
                    
                    <TextField
                      fullWidth
                      label="Buying Price *"
                      name="buying_price"
                      type="number"
                      value={formData.buying_price}
                      onChange={handleChange}
                      margin="normal"
                      inputProps={{ min: 0, step: 0.01 }}
                      InputProps={{
                        startAdornment: <Typography sx={{ mr: 1 }}>KSH</Typography>,
                      }}
                    />
                    
                    <TextField
                      fullWidth
                      label="Selling Price *"
                  name="selling_price"
                  type="number"
                  value={formData.selling_price}
                  onChange={handleChange}
                  margin="normal"
                  inputProps={{ min: 0, step: 0.01 }}
                  InputProps={{
                    startAdornment: <Typography sx={{ mr: 1 }}>KSH</Typography>,
                  }}
                  helperText="This will be used as the default unit price"
                />
                  </Box>

                  {formData.quantity && formData.buying_price && formData.selling_price && (
                    <Box sx={{ mt: 2, p: { xs: 1.5, md: 2 }, bgcolor: 'grey.100', borderRadius: 1 }}>
                      <Typography variant="body2" gutterBottom sx={{ fontSize: { xs: '0.8rem', md: '0.875rem' } }}>
                        <strong>Total Investment: KSH {(parseFloat(formData.quantity) * parseFloat(formData.buying_price)).toFixed(2)}</strong>
                      </Typography>
                      <Typography variant="body2" gutterBottom sx={{ fontSize: { xs: '0.8rem', md: '0.875rem' } }}>
                        <strong>Total Selling Value: KSH {(parseFloat(formData.quantity) * parseFloat(formData.selling_price)).toFixed(2)}</strong>
                      </Typography>
                      <Typography variant="body1" color="success.main" sx={{ fontSize: { xs: '0.9rem', md: '1rem' } }}>
                        <strong>Potential Profit: KSH {(parseFloat(formData.quantity) * (parseFloat(formData.selling_price) - parseFloat(formData.buying_price))).toFixed(2)}</strong>
                      </Typography>
                    </Box>
                  )}
                </CardContent>
              </Card>

              <Box sx={{ mt: 3, display: 'flex', gap: { xs: 1, md: 2 }, justifyContent: { xs: 'stretch', sm: 'flex-end' }, flexDirection: { xs: 'column', sm: 'row' } }}>
                <Button
                  variant="outlined"
                  startIcon={<CancelIcon />}
                  onClick={handleCancel}
                  disabled={loading}
                  sx={{ width: { xs: '100%', sm: 'auto' } }}
                >
                  Cancel
                </Button>
                <Button
                  variant="contained"
                  startIcon={<SaveIcon />}
                  onClick={handleSave}
                  disabled={loading}
                  sx={{ width: { xs: '100%', sm: 'auto' } }}
                >
                  {loading ? 'Saving...' : 'Save Item'}
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Box>
      </Box>
    </Box>
  );
};

export default AddItemScreen;