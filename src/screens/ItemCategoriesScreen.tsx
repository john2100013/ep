import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Alert,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Category as CategoryIcon,
} from '@mui/icons-material';
import { ApiService } from '../services/api';
import Sidebar from '../components/Sidebar';

interface ItemCategory {
  id: number;
  name: string;
  description: string;
  created_at: string;
  updated_at: string;
}

const ItemCategoriesScreen: React.FC = () => {
  const [categories, setCategories] = useState<ItemCategory[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<ItemCategory | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<ItemCategory | null>(null);
  
  // Business custom category names
  const [businessCategoryNames, setBusinessCategoryNames] = useState({
    category_name: 'Category',
    category_1_name: 'Category 1',
    category_2_name: 'Category 2'
  });
  const [categoryNamesDialogOpen, setCategoryNamesDialogOpen] = useState(false);
  const [categoryNamesFormData, setCategoryNamesFormData] = useState({
    category_name: 'Category',
    category_1_name: 'Category 1',
    category_2_name: 'Category 2'
  });
  
  const [formData, setFormData] = useState({
    name: '',
    description: ''
  });

  useEffect(() => {
    fetchCategories();
    fetchBusinessCategoryNames();
  }, []);

  useEffect(() => {
    if (success || error) {
      const timer = setTimeout(() => {
        setSuccess(null);
        setError(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [success, error]);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const response = await ApiService.getItemCategories();
      if (response.success) {
        setCategories(response.data.categories || []);
      }
    } catch (err) {
      console.error('Error fetching categories:', err);
      setError('Failed to fetch categories');
    } finally {
      setLoading(false);
    }
  };

  const fetchBusinessCategoryNames = async () => {
    try {
      const response = await ApiService.getBusinessCategoryNames();
      if (response.success && response.data) {
        setBusinessCategoryNames({
          category_name: response.data.category_name || 'Category',
          category_1_name: response.data.category_1_name || 'Category 1',
          category_2_name: response.data.category_2_name || 'Category 2'
        });
        setCategoryNamesFormData({
          category_name: response.data.category_name || 'Category',
          category_1_name: response.data.category_1_name || 'Category 1',
          category_2_name: response.data.category_2_name || 'Category 2'
        });
      }
    } catch (err) {
      console.error('Error fetching business category names:', err);
    }
  };

  const handleSaveCategoryNames = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await ApiService.updateBusinessCategoryNames(categoryNamesFormData);
      if (response.success) {
        setSuccess('Category names updated successfully!');
        setBusinessCategoryNames(categoryNamesFormData);
        setCategoryNamesDialogOpen(false);
        fetchBusinessCategoryNames();
      } else {
        setError(response.message || 'Failed to update category names');
      }
    } catch (err: any) {
      console.error('Error updating category names:', err);
      setError(err.response?.data?.message || 'Failed to update category names');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (category?: ItemCategory) => {
    if (category) {
      setEditingCategory(category);
      setFormData({
        name: category.name,
        description: category.description || ''
      });
    } else {
      setEditingCategory(null);
      setFormData({
        name: '',
        description: ''
      });
    }
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingCategory(null);
    setFormData({
      name: '',
      description: ''
    });
  };

  const handleSubmit = async () => {
    try {
      setLoading(true);
      setError(null);

      if (!formData.name.trim()) {
        setError('Category name is required');
        return;
      }

      let response;
      if (editingCategory) {
        response = await ApiService.updateItemCategory(editingCategory.id, formData);
        setSuccess('Category updated successfully!');
      } else {
        response = await ApiService.createItemCategory(formData);
        setSuccess('Category created successfully!');
      }

      if (response.success) {
        handleCloseDialog();
        fetchCategories();
      } else {
        setError(response.message || 'Failed to save category');
      }
    } catch (err: any) {
      console.error('Error saving category:', err);
      setError(err.response?.data?.message || 'Failed to save category');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDeleteDialog = (category: ItemCategory) => {
    setSelectedCategory(category);
    setDeleteDialogOpen(true);
  };

  const handleCloseDeleteDialog = () => {
    setDeleteDialogOpen(false);
    setSelectedCategory(null);
  };

  const handleDelete = async () => {
    if (!selectedCategory) return;

    try {
      setLoading(true);
      setError(null);

      const response = await ApiService.deleteItemCategory(selectedCategory.id);
      
      if (response.success) {
        setSuccess('Category deleted successfully!');
        fetchCategories();
      } else {
        setError(response.message || 'Failed to delete category');
      }
      handleCloseDeleteDialog();
    } catch (err: any) {
      console.error('Error deleting category:', err);
      setError(err.response?.data?.message || 'Failed to delete category');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ display: 'flex', width: '100vw', minHeight: '100vh', margin: 0 }}>
      <Box sx={{ display: { xs: 'none', md: 'block' } }}>
        <Sidebar title="Item Categories" />
      </Box>

      <Box sx={{ 
        marginLeft: { xs: 0, md: '350px' }, 
        width: { xs: '100%', md: 'calc(100vw - 350px - 24px)' }, 
        p: { xs: 2, md: 3 }, 
        paddingRight: { xs: 0, md: '24px' },
        overflow: 'auto'
      }}>
        {/* Header */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <CategoryIcon sx={{ fontSize: 32 }} />
            <Typography variant="h4" component="h1">
              Item Categories
            </Typography>
          </Box>
          <Button
            variant="contained"
            color="primary"
            startIcon={<AddIcon />}
            onClick={() => handleOpenDialog()}
          >
            Add Category
          </Button>
        </Box>

        {/* Success Alert */}
        {success && (
          <Alert severity="success" sx={{ mb: 3 }} onClose={() => setSuccess(null)}>
            {success}
          </Alert>
        )}

        {/* Error Alert */}
        {error && (
          <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        {/* Category Names Settings */}
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6">Category Label Settings</Typography>
              <Button
                variant="outlined"
                size="small"
                startIcon={<EditIcon />}
                onClick={() => {
                  setCategoryNamesFormData(businessCategoryNames);
                  setCategoryNamesDialogOpen(true);
                }}
              >
                Edit Category Labels
              </Button>
            </Box>
            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
              <Paper sx={{ p: 2, flex: '1 1 200px', bgcolor: 'primary.light', color: 'white' }}>
                <Typography variant="subtitle2">Main Category</Typography>
                <Typography variant="body1" fontWeight="bold">{businessCategoryNames.category_name}</Typography>
              </Paper>
              <Paper sx={{ p: 2, flex: '1 1 200px', bgcolor: 'info.light', color: 'white' }}>
                <Typography variant="subtitle2">First Additional Category</Typography>
                <Typography variant="body1" fontWeight="bold">{businessCategoryNames.category_1_name}</Typography>
              </Paper>
              <Paper sx={{ p: 2, flex: '1 1 200px', bgcolor: 'success.light', color: 'white' }}>
                <Typography variant="subtitle2">Second Additional Category</Typography>
                <Typography variant="body1" fontWeight="bold">{businessCategoryNames.category_2_name}</Typography>
              </Paper>
            </Box>
          </CardContent>
        </Card>

        {/* Categories Table */}
        <Card>
          <CardContent>
            <TableContainer component={Paper} variant="outlined">
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Name</TableCell>
                    <TableCell>Description</TableCell>
                    <TableCell>Created</TableCell>
                    <TableCell align="right">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {categories.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} align="center">
                        <Typography variant="body2" color="text.secondary">
                          No categories found. Click "Add Category" to create one.
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ) : (
                    categories.map((category) => (
                      <TableRow key={category.id}>
                        <TableCell>
                          <Typography variant="body1" fontWeight="medium">
                            {category.name}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" color="text.secondary">
                            {category.description || '-'}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          {new Date(category.created_at).toLocaleDateString()}
                        </TableCell>
                        <TableCell align="right">
                          <IconButton
                            size="small"
                            color="primary"
                            onClick={() => handleOpenDialog(category)}
                          >
                            <EditIcon />
                          </IconButton>
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() => handleOpenDeleteDialog(category)}
                          >
                            <DeleteIcon />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>

        {/* Add/Edit Dialog */}
        <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
          <DialogTitle>
            {editingCategory ? 'Edit Category' : 'Add New Category'}
          </DialogTitle>
          <DialogContent>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
              <TextField
                label="Category Name *"
                fullWidth
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
              <TextField
                label="Description"
                fullWidth
                multiline
                rows={3}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseDialog}>Cancel</Button>
            <Button 
              onClick={handleSubmit} 
              variant="contained" 
              color="primary"
              disabled={loading}
            >
              {loading ? 'Saving...' : editingCategory ? 'Update' : 'Create'}
            </Button>
          </DialogActions>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <Dialog open={deleteDialogOpen} onClose={handleCloseDeleteDialog}>
          <DialogTitle>Confirm Delete</DialogTitle>
          <DialogContent>
            <Typography>
              Are you sure you want to delete the category "{selectedCategory?.name}"?
              This action cannot be undone.
            </Typography>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseDeleteDialog}>Cancel</Button>
            <Button 
              onClick={handleDelete} 
              color="error" 
              variant="contained"
              disabled={loading}
            >
              {loading ? 'Deleting...' : 'Delete'}
            </Button>
          </DialogActions>
        </Dialog>

        {/* Category Names Edit Dialog */}
        <Dialog open={categoryNamesDialogOpen} onClose={() => setCategoryNamesDialogOpen(false)} maxWidth="sm" fullWidth>
          <DialogTitle>Edit Category Labels</DialogTitle>
          <DialogContent>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
              <TextField
                label="Main Category Label"
                fullWidth
                value={categoryNamesFormData.category_name}
                onChange={(e) => setCategoryNamesFormData({ ...categoryNamesFormData, category_name: e.target.value })}
                helperText="This label will be used for the main Category in items"
              />
              <TextField
                label={`${businessCategoryNames.category_1_name} Label`}
                fullWidth
                value={categoryNamesFormData.category_1_name}
                onChange={(e) => setCategoryNamesFormData({ ...categoryNamesFormData, category_1_name: e.target.value })}
                helperText="This label will be used for Category 1 in items"
              />
              <TextField
                label={`${businessCategoryNames.category_2_name} Label`}
                fullWidth
                value={categoryNamesFormData.category_2_name}
                onChange={(e) => setCategoryNamesFormData({ ...categoryNamesFormData, category_2_name: e.target.value })}
                helperText="This label will be used for Category 2 in items"
              />
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setCategoryNamesDialogOpen(false)}>Cancel</Button>
            <Button 
              onClick={handleSaveCategoryNames} 
              variant="contained" 
              color="primary"
              disabled={loading}
            >
              {loading ? 'Saving...' : 'Save'}
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </Box>
  );
};

export default ItemCategoriesScreen;
