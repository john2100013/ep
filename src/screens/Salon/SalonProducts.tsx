import React, { useState, useEffect } from 'react';
import { Box, Card, CardContent, Typography, Button, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Dialog, DialogTitle, DialogContent, DialogActions, TextField, Alert, IconButton, Chip } from '@mui/material';
import { Add, Edit, Warning } from '@mui/icons-material';
import * as salonApi from '../../services/salonApi';
import type { SalonProduct } from '../../types';

const SalonProducts: React.FC = () => {
  const [products, setProducts] = useState<SalonProduct[]>([]);
  const [showDialog, setShowDialog] = useState(false);
  const [editingProduct, setEditingProduct] = useState<SalonProduct | null>(null);
  const [formData, setFormData] = useState({ name: '', description: '', unit: 'piece', current_stock: '', min_stock_level: '', unit_cost: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => { loadProducts(); }, []);

  const loadProducts = async () => {
    try {
      console.log('🔄 Loading salon products...');
      const response = await salonApi.getProducts();
      console.log('📥 Products response:', response.data);
      
      // Handle both response formats: { success: true, data: [...] } or direct array
      let productsData: SalonProduct[] = [];
      
      if (Array.isArray(response.data)) {
        productsData = response.data;
      } else if (response.data?.success && Array.isArray(response.data.data)) {
        productsData = response.data.data;
      } else if (response.data?.data && Array.isArray(response.data.data)) {
        productsData = response.data.data;
      } else {
        console.error('❌ Unexpected response format:', response.data);
        setError('Unexpected response format from server');
        return;
      }
      
      console.log('✅ Products loaded:', productsData.length, 'products');
      setProducts(productsData);
    } catch (err: any) {
      console.error('❌ Error loading products:', err);
      console.error('Error details:', err.response?.data);
      setError(err.response?.data?.message || 'Failed to load products');
    }
  };

  const handleSubmit = async () => {
    if (!formData.name) { setError('Product name is required'); return; }
    try {
      setLoading(true);
      setError('');
      const data = { name: formData.name, description: formData.description, unit: formData.unit, current_stock: parseFloat(formData.current_stock) || 0, min_stock_level: parseFloat(formData.min_stock_level) || 0, unit_cost: parseFloat(formData.unit_cost) || 0, is_active: true };
      if (editingProduct) {
        await salonApi.updateProduct(editingProduct.id, data);
        setSuccess('Product updated successfully');
      } else {
        await salonApi.createProduct(data);
        setSuccess('Product added successfully');
      }
      setShowDialog(false);
      setEditingProduct(null);
      setFormData({ name: '', description: '', unit: 'piece', current_stock: '', min_stock_level: '', unit_cost: '' });
      loadProducts();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to save product');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (product: SalonProduct) => {
    setEditingProduct(product);
    // Convert numeric fields to numbers if they're strings
    const currentStock = typeof product.current_stock === 'string' 
      ? parseFloat(product.current_stock) 
      : product.current_stock || 0;
    const minStock = typeof product.min_stock_level === 'string'
      ? parseFloat(product.min_stock_level)
      : product.min_stock_level || 0;
    const unitCost = typeof product.unit_cost === 'string'
      ? parseFloat(product.unit_cost)
      : product.unit_cost || 0;
    
    setFormData({ 
      name: product.name, 
      description: product.description || '', 
      unit: product.unit, 
      current_stock: currentStock.toString(), 
      min_stock_level: minStock.toString(), 
      unit_cost: unitCost.toString() 
    });
    setShowDialog(true);
  };

  const isLowStock = (product: SalonProduct) => product.current_stock <= product.min_stock_level;

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" fontWeight="bold">Products / Stock</Typography>
        <Button variant="contained" startIcon={<Add />} onClick={() => { setEditingProduct(null); setFormData({ name: '', description: '', unit: 'piece', current_stock: '', min_stock_level: '', unit_cost: '' }); setShowDialog(true); }}>Add Product</Button>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>{error}</Alert>}
      {success && <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess('')}>{success}</Alert>}

      <Card>
        <CardContent>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell><strong>Product Name</strong></TableCell>
                  <TableCell><strong>Unit</strong></TableCell>
                  <TableCell align="right"><strong>Current Stock</strong></TableCell>
                  <TableCell align="right"><strong>Min Level</strong></TableCell>
                  <TableCell align="right"><strong>Unit Cost (KES)</strong></TableCell>
                  <TableCell align="center"><strong>Status</strong></TableCell>
                  <TableCell align="center"><strong>Actions</strong></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {products.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
                      <Typography color="text.secondary">
                        No products found. Click "Add Product" to create one.
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  products.map((product) => {
                    // Convert numeric fields to numbers if they're strings
                    const currentStock = typeof product.current_stock === 'string' 
                      ? parseFloat(product.current_stock) 
                      : product.current_stock || 0;
                    const minStock = typeof product.min_stock_level === 'string'
                      ? parseFloat(product.min_stock_level)
                      : product.min_stock_level || 0;
                    const unitCost = typeof product.unit_cost === 'string'
                      ? parseFloat(product.unit_cost)
                      : product.unit_cost || 0;
                    
                    const lowStock = currentStock <= minStock;
                    
                    return (
                      <TableRow key={product.id} sx={{ bgcolor: lowStock ? '#fff3e0' : 'inherit' }}>
                        <TableCell>{product.name} {lowStock && <Warning fontSize="small" color="warning" />}</TableCell>
                        <TableCell>{product.unit}</TableCell>
                        <TableCell align="right">{currentStock}</TableCell>
                        <TableCell align="right">{minStock}</TableCell>
                        <TableCell align="right">{unitCost.toFixed(2)}</TableCell>
                        <TableCell align="center"><Chip label={lowStock ? 'Low Stock' : 'OK'} size="small" color={lowStock ? 'warning' : 'success'} /></TableCell>
                        <TableCell align="center"><IconButton size="small" onClick={() => handleEdit(product)}><Edit fontSize="small" /></IconButton></TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      <Dialog open={showDialog} onClose={() => setShowDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editingProduct ? 'Edit Product' : 'Add Product'}</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            <TextField fullWidth label="Product Name *" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} sx={{ mb: 2 }} />
            <TextField fullWidth multiline rows={2} label="Description" value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} sx={{ mb: 2 }} />
            <TextField fullWidth label="Unit (ml, piece, bottle, etc.)" value={formData.unit} onChange={(e) => setFormData({ ...formData, unit: e.target.value })} sx={{ mb: 2 }} />
            <TextField fullWidth type="number" label="Current Stock" value={formData.current_stock} onChange={(e) => setFormData({ ...formData, current_stock: e.target.value })} sx={{ mb: 2 }} />
            <TextField fullWidth type="number" label="Minimum Stock Level" value={formData.min_stock_level} onChange={(e) => setFormData({ ...formData, min_stock_level: e.target.value })} sx={{ mb: 2 }} />
            <TextField fullWidth type="number" label="Unit Cost (KES)" value={formData.unit_cost} onChange={(e) => setFormData({ ...formData, unit_cost: e.target.value })} />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowDialog(false)}>Cancel</Button>
          <Button onClick={handleSubmit} variant="contained" disabled={loading}>{loading ? 'Saving...' : 'Save'}</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default SalonProducts;
