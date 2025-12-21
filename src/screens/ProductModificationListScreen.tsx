import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  TextField,
  Chip,
  Pagination,
  IconButton,
  Menu,
  MenuList,
  MenuItem as MenuOption,
  Paper,
  InputAdornment,
  Alert,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
} from '@mui/material';
import {
  Search as SearchIcon,
  MoreVert as MoreVertIcon,
  Delete as DeleteIcon,
  Visibility as ViewIcon,
  History as HistoryIcon,
} from '@mui/icons-material';
import Sidebar from '../components/Sidebar';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { ApiService } from '../services/api';

interface ProductModification {
  id: number;
  item_id: number;
  item_name?: string;
  item_code?: string;
  modification_number: string;
  modified_by: number;
  first_name?: string;
  last_name?: string;
  old_item_name?: string;
  new_item_name?: string;
  modification_reason?: string;
  created_at: string;
  updated_at: string;
}

interface PaginationData {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

interface ProductModificationListResponse {
  success: boolean;
  data: {
    modifications: ProductModification[];
    pagination: PaginationData;
  };
  message?: string;
}

const ProductModificationListScreen: React.FC = () => {
  const navigate = useNavigate();
  const [modifications, setModifications] = useState<ProductModification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [pagination, setPagination] = useState<PaginationData>({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0
  });
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedModification, setSelectedModification] = useState<ProductModification | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const fetchModifications = async () => {
    try {
      setLoading(true);
      console.log('🔵 [ProductModificationList] fetchModifications called with params:', { page: pagination.page, limit: pagination.limit, searchTerm });
      
      const params: any = {
        page: pagination.page,
        limit: pagination.limit,
      };

      const data: ProductModificationListResponse = await ApiService.getProductModifications(params);
      console.log('🔵 [ProductModificationList] fetchModifications response:', data);
      
      if (data.success) {
        // Filter by search term if provided
        let filteredModifications = data.data.modifications || [];
        if (searchTerm) {
          filteredModifications = filteredModifications.filter(mod => 
            mod.modification_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            mod.item_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            mod.item_code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            mod.old_item_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            mod.new_item_name?.toLowerCase().includes(searchTerm.toLowerCase())
          );
        }
        
        setModifications(filteredModifications);
        setPagination(data.data.pagination);
        console.log('✅ [ProductModificationList] Modifications updated, count:', filteredModifications.length);
      } else {
        throw new Error(data.message || 'Failed to fetch product modifications');
      }
    } catch (err) {
      console.error('❌ [ProductModificationList] Error fetching modifications:', err);
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchModifications();
  }, [pagination.page, searchTerm]);

  const handleSearch = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(event.target.value);
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const handlePageChange = (event: React.ChangeEvent<unknown>, value: number) => {
    setPagination(prev => ({ ...prev, page: value }));
  };

  const handleMenuClick = (event: React.MouseEvent<HTMLButtonElement>, modification: ProductModification) => {
    setAnchorEl(event.currentTarget);
    setSelectedModification(modification);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedModification(null);
  };

  const handleViewModification = () => {
    if (selectedModification) {
      navigate(`/product-modifications/${selectedModification.id}`);
    }
    handleMenuClose();
  };

  const handleDeleteClick = () => {
    if (selectedModification) {
      setDeleteDialogOpen(true);
      setAnchorEl(null);
    } else {
      console.error('❌ [FRONTEND] No modification selected when delete clicked');
      handleMenuClose();
    }
  };

  const handleDeleteConfirm = async () => {
    if (!selectedModification) {
      console.error('❌ [FRONTEND] No modification selected for deletion');
      return;
    }

    console.log('🔴 [FRONTEND] Delete modification button clicked');
    console.log('🔴 [FRONTEND] Selected modification:', selectedModification);

    try {
      setLoading(true);
      setError(null);
      console.log('🔴 [FRONTEND] Calling API to delete modification with ID:', selectedModification.id);
      
      const response = await ApiService.deleteProductModification(selectedModification.id);
      console.log('🔴 [FRONTEND] Delete API response:', response);
      
      if (response && response.success) {
        console.log('✅ [FRONTEND] Modification deleted successfully');
        setSuccess('Product modification deleted successfully');
        setError(null);
        await fetchModifications();
        setDeleteDialogOpen(false);
        setSelectedModification(null);
        setTimeout(() => setSuccess(null), 3000);
      } else {
        const errorMsg = response?.message || 'Failed to delete product modification';
        console.error('❌ [FRONTEND] Delete failed:', errorMsg);
        setError(errorMsg);
      }
    } catch (err: any) {
      console.error('❌ [FRONTEND] Delete modification error:', err);
      const errorMsg = err.response?.data?.message || err.message || 'Failed to delete product modification';
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  if (loading && modifications.length === 0) {
    return (
      <Box sx={{ p: 3, textAlign: 'center' }}>
        <Typography>Loading product modifications...</Typography>
      </Box>
    );
  }

  // Calculate stats for sidebar
  const currentStats = {
    total: pagination.total,
    totalValue: 0, // Not applicable for modifications
    statusCounts: {
      paid: 0,
      overdue: 0,
      pending: 0,
      draft: 0,
    }
  };

  return (
    <Box sx={{ display: 'flex', width: '100vw', minHeight: '100vh', margin: 0 }}>
      {/* Sidebar - hidden on mobile */}
      <Box sx={{ display: { xs: 'none', md: 'block' } }}>
        <Sidebar
          title="Product Modifications"
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
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <HistoryIcon sx={{ fontSize: 32, color: 'primary.main' }} />
            <Typography variant="h4" component="h1" sx={{ fontSize: { xs: '1.5rem', md: '2.125rem' } }}>
              Product Modifications
            </Typography>
          </Box>
        </Box>

        {/* Search */}
        <Paper sx={{ p: { xs: 1.5, md: 2 }, mb: 3 }}>
          <TextField
            placeholder="Search by modification number, item name, or code..."
            value={searchTerm}
            onChange={handleSearch}
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

      {/* Error Alert */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Success Alert */}
      {success && (
        <Alert severity="success" sx={{ mb: 3 }} onClose={() => setSuccess(null)}>
          {success}
        </Alert>
      )}

      {/* Modification List */}
      {modifications.length === 0 && !loading ? (
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <HistoryIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h6" color="text.secondary" gutterBottom>
            No product modifications found
          </Typography>
          <Typography color="text.secondary" sx={{ mb: 3 }}>
            Product modifications will appear here when items are edited
          </Typography>
        </Paper>
      ) : (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: { xs: 1.5, md: 2 } }}>
          {modifications.map((modification) => (
            <Card key={modification.id}>
              <CardContent sx={{ p: { xs: 2, md: 2.5 } }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 1 }}>
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 1, md: 2 }, mb: 1, flexWrap: 'wrap' }}>
                      <Typography variant="h6" component="h3" sx={{ fontWeight: 'bold', fontSize: { xs: '1rem', md: '1.25rem' } }}>
                        {modification.modification_number}
                      </Typography>
                      {modification.item_code && (
                        <Chip 
                          label={`Item: ${modification.item_code}`}
                          color="primary"
                          size="small"
                          variant="outlined"
                        />
                      )}
                    </Box>
                    
                    <Typography color="text.secondary" gutterBottom variant="body2">
                      Product: {modification.item_name || modification.new_item_name || 'N/A'}
                    </Typography>
                    
                    {(modification.old_item_name || modification.new_item_name) && (
                      <Box sx={{ mb: 1 }}>
                        {modification.old_item_name && (
                          <Typography variant="body2" color="text.secondary">
                            <strong>Old Name:</strong> {modification.old_item_name}
                          </Typography>
                        )}
                        {modification.new_item_name && (
                          <Typography variant="body2" color="text.secondary">
                            <strong>New Name:</strong> {modification.new_item_name}
                          </Typography>
                        )}
                      </Box>
                    )}
                    
                    {modification.modification_reason && (
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                        <strong>Reason:</strong> {modification.modification_reason}
                      </Typography>
                    )}
                    
                    <Typography variant="caption" color="text.secondary">
                      Modified: {format(new Date(modification.created_at), 'MMM dd, yyyy HH:mm')} 
                      {modification.first_name && ` by ${modification.first_name} ${modification.last_name}`}
                    </Typography>
                  </Box>
                  
                  <IconButton
                    onClick={(e) => handleMenuClick(e, modification)}
                    size="small"
                  >
                    <MoreVertIcon />
                  </IconButton>
                </Box>
              </CardContent>
            </Card>
          ))}
        </Box>
      )}

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
          <Pagination
            count={pagination.totalPages}
            page={pagination.page}
            onChange={handlePageChange}
            color="primary"
          />
        </Box>
      )}

      {/* Context Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        <MenuList>
          <MenuOption onClick={handleViewModification}>
            <ViewIcon sx={{ mr: 1 }} fontSize="small" />
            View Modification
          </MenuOption>
          <MenuOption onClick={handleDeleteClick} sx={{ color: 'error.main' }}>
            <DeleteIcon sx={{ mr: 1 }} fontSize="small" />
            Delete
          </MenuOption>
        </MenuList>
      </Menu>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => {
          setDeleteDialogOpen(false);
          setSelectedModification(null);
        }}
      >
        <DialogTitle>Delete Product Modification</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete product modification {selectedModification?.modification_number}? 
            This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={() => {
              setDeleteDialogOpen(false);
              setSelectedModification(null);
            }} 
            disabled={loading}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleDeleteConfirm} 
            color="error" 
            variant="contained"
            disabled={loading}
            type="button"
          >
            {loading ? 'Deleting...' : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>
      </Box>
    </Box>
  );
};

export default ProductModificationListScreen;

