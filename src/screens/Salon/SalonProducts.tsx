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
      const response = await salonApi.getProducts();
      if (response.data.success) setProducts(response.data.data);
    } catch (err: any) {
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
    setFormData({ name: product.name, description: product.description || '', unit: product.unit, current_stock: product.current_stock.toString(), min_stock_level: product.min_stock_level.toString(), unit_cost: product.unit_cost.toString() });
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
                {products.map((product) => (
                  <TableRow key={product.id} sx={{ bgcolor: isLowStock(product) ? '#fff3e0' : 'inherit' }}>
                    <TableCell>{product.name} {isLowStock(product) && <Warning fontSize="small" color="warning" />}</TableCell>
                    <TableCell>{product.unit}</TableCell>
                    <TableCell align="right">{product.current_stock}</TableCell>
                    <TableCell align="right">{product.min_stock_level}</TableCell>
                    <TableCell align="right">{product.unit_cost.toFixed(2)}</TableCell>
                    <TableCell align="center"><Chip label={isLowStock(product) ? 'Low Stock' : 'OK'} size="small" color={isLowStock(product) ? 'warning' : 'success'} /></TableCell>
                    <TableCell align="center"><IconButton size="small" onClick={() => handleEdit(product)}><Edit fontSize="small" /></IconButton></TableCell>
                  </TableRow>
                ))}
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
