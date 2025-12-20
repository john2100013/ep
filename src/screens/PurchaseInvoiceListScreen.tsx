import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
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
  Add as AddIcon,
  Search as SearchIcon,
  MoreVert as MoreVertIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as ViewIcon,
  Receipt as ReceiptIcon,
} from '@mui/icons-material';
import Sidebar from '../components/Sidebar';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { ApiService } from '../services/api';

interface PurchaseInvoice {
  id: number;
  purchase_invoice_number: string;
  supplier_name: string;
  supplier_address?: string;
  supplier_pin?: string;
  subtotal: number;
  vat_amount: number;
  total_amount: number;
  status: 'draft' | 'sent' | 'paid' | 'partially_paid' | 'overdue' | 'cancelled';
  payment_status?: 'unpaid' | 'partial' | 'paid' | 'overpaid';
  amount_paid?: number;
  due_date: string;
  payment_terms?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
  created_by: number;
  first_name?: string;
  last_name?: string;
  line_count: number;
}

interface PaginationData {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

interface PurchaseInvoiceListResponse {
  success: boolean;
  data: {
    purchase_invoices: PurchaseInvoice[];
    pagination: PaginationData;
  };
  message?: string;
}

const PurchaseInvoiceListScreen: React.FC = () => {
  const navigate = useNavigate();
  const [purchaseInvoices, setPurchaseInvoices] = useState<PurchaseInvoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [pagination, setPagination] = useState<PaginationData>({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0
  });
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedPurchaseInvoice, setSelectedPurchaseInvoice] = useState<PurchaseInvoice | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const fetchPurchaseInvoices = async () => {
    try {
      setLoading(true);
      console.log('🔵 [PurchaseInvoiceList] fetchPurchaseInvoices called with params:', { page: pagination.page, limit: pagination.limit, searchTerm, statusFilter });
      
      const params: any = {
        page: pagination.page,
        limit: pagination.limit,
      };
      
      if (searchTerm) params.search = searchTerm;
      if (statusFilter) params.status = statusFilter;

      const data: PurchaseInvoiceListResponse = await ApiService.getPurchaseInvoices(params);
      console.log('🔵 [PurchaseInvoiceList] fetchPurchaseInvoices response:', data);
      
      if (data.success) {
        setPurchaseInvoices(data.data.purchase_invoices);
        setPagination(data.data.pagination);
        console.log('✅ [PurchaseInvoiceList] Purchase invoices updated, count:', data.data.purchase_invoices?.length);
      } else {
        throw new Error(data.message || 'Failed to fetch purchase invoices');
      }
    } catch (err) {
      console.error('❌ [PurchaseInvoiceList] Error fetching purchase invoices:', err);
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPurchaseInvoices();
  }, [pagination.page, searchTerm, statusFilter]);
  
  // Force refetch when component mounts or when purchase invoices array changes
  const forceRefresh = () => {
    fetchPurchaseInvoices();
  };

  const handleSearch = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(event.target.value);
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const handleStatusFilterChange = (status: string) => {
    setStatusFilter(status);
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const handlePageChange = (event: React.ChangeEvent<unknown>, value: number) => {
    setPagination(prev => ({ ...prev, page: value }));
  };

  const handleMenuClick = (event: React.MouseEvent<HTMLButtonElement>, purchaseInvoice: PurchaseInvoice) => {
    setAnchorEl(event.currentTarget);
    setSelectedPurchaseInvoice(purchaseInvoice);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedPurchaseInvoice(null);
  };

  const handleViewPurchaseInvoice = () => {
    if (selectedPurchaseInvoice) {
      // Navigate to purchase invoice preview
      navigate(`/purchase-invoices/${selectedPurchaseInvoice.id}/preview`);
    }
    handleMenuClose();
  };

  const handleEditPurchaseInvoice = () => {
    if (selectedPurchaseInvoice) {
      navigate(`/purchase-invoices/${selectedPurchaseInvoice.id}/edit`);
    }
    handleMenuClose();
  };

  const handleDeleteClick = () => {
    if (selectedPurchaseInvoice) {
      setDeleteDialogOpen(true);
      setAnchorEl(null);
    } else {
      console.error('❌ [FRONTEND] No purchase invoice selected when delete clicked');
      handleMenuClose();
    }
  };

  const handleDeleteConfirm = async () => {
    if (!selectedPurchaseInvoice) {
      console.error('❌ [FRONTEND] No purchase invoice selected for deletion');
      return;
    }

    console.log('🔴 [FRONTEND] Delete purchase invoice button clicked');
    console.log('🔴 [FRONTEND] Selected purchase invoice:', selectedPurchaseInvoice);

    try {
      setLoading(true);
      setError(null);
      console.log('🔴 [FRONTEND] Calling API to delete purchase invoice with ID:', selectedPurchaseInvoice.id);
      
      const response = await ApiService.deletePurchaseInvoice(selectedPurchaseInvoice.id);
      console.log('🔴 [FRONTEND] Delete API response:', response);
      
      if (response && response.success) {
        console.log('✅ [FRONTEND] Purchase invoice deleted successfully');
        setSuccess('Purchase invoice deleted successfully');
        setError(null);
        await fetchPurchaseInvoices();
        setDeleteDialogOpen(false);
        setSelectedPurchaseInvoice(null);
        setTimeout(() => setSuccess(null), 3000);
      } else {
        const errorMsg = response?.message || 'Failed to delete purchase invoice';
        console.error('❌ [FRONTEND] Delete failed:', errorMsg);
        setError(errorMsg);
      }
    } catch (err: any) {
      console.error('❌ [FRONTEND] Delete purchase invoice error:', err);
      const errorMsg = err.response?.data?.message || err.message || 'Failed to delete purchase invoice';
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string, paymentStatus?: string) => {
    if (status === 'partially_paid' || paymentStatus === 'partial') {
      return 'warning';
    }
    switch (status) {
      case 'draft': return 'default';
      case 'sent': return 'info';
      case 'paid': return 'success';
      case 'partially_paid': return 'warning';
      case 'overdue': return 'error';
      case 'cancelled': return 'warning';
      default: return 'default';
    }
  };

  const getStatusLabel = (purchaseInvoice: PurchaseInvoice) => {
    if (purchaseInvoice.status === 'partially_paid' || purchaseInvoice.payment_status === 'partial') {
      return 'Partially Paid';
    }
    return purchaseInvoice.status.toUpperCase();
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES'
    }).format(amount);
  };

  if (loading && purchaseInvoices.length === 0) {
    return (
      <Box sx={{ p: 3, textAlign: 'center' }}>
        <Typography>Loading purchase invoices...</Typography>
      </Box>
    );
  }

  // Calculate stats for sidebar
  const currentStats = {
    total: pagination.total,
    totalValue: purchaseInvoices.reduce((sum, inv) => sum + inv.total_amount, 0),
    statusCounts: {
      paid: purchaseInvoices.filter(inv => inv.status === 'paid').length,
      overdue: purchaseInvoices.filter(inv => inv.status === 'overdue').length,
      pending: purchaseInvoices.filter(inv => inv.status === 'sent').length,
      draft: purchaseInvoices.filter(inv => inv.status === 'draft').length,
    }
  };

  const statusOptions = [
    { value: '', label: 'All Status' },
    { value: 'draft', label: 'Draft' },
    { value: 'sent', label: 'Sent' },
    { value: 'paid', label: 'Paid' },
    { value: 'partially_paid', label: 'Partially Paid' },
    { value: 'overdue', label: 'Overdue' },
    { value: 'cancelled', label: 'Cancelled' },
  ];

  return (
    <Box sx={{ display: 'flex', width: '100vw', minHeight: '100vh', margin: 0 }}>
      {/* Sidebar - hidden on mobile */}
      <Box sx={{ display: { xs: 'none', md: 'block' } }}>
        <Sidebar
          title="Purchase Invoice Management"
          currentStats={currentStats}
          statusFilter={statusFilter}
          onStatusFilterChange={handleStatusFilterChange}
          statusOptions={statusOptions}
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
            Purchase Invoices
          </Typography>
          <Button
            variant="contained"
            color="primary"
            startIcon={<AddIcon />}
            onClick={() => navigate('/create-purchase-invoice')}
            sx={{ width: { xs: '100%', sm: 'auto' } }}
          >
            Create Purchase Invoice
          </Button>
        </Box>

        {/* Search */}
        <Paper sx={{ p: { xs: 1.5, md: 2 }, mb: 3 }}>
          <TextField
            placeholder="Search purchase invoices..."
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

      {/* Purchase Invoice List */}
      {purchaseInvoices.length === 0 && !loading ? (
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <ReceiptIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h6" color="text.secondary" gutterBottom>
            No purchase invoices found
          </Typography>
          <Typography color="text.secondary" sx={{ mb: 3 }}>
            Create your first purchase invoice to get started
          </Typography>
          <Button
            variant="contained"
            color="primary"
            startIcon={<AddIcon />}
            onClick={() => navigate('/create-purchase-invoice')}
          >
            Create Purchase Invoice
          </Button>
        </Paper>
      ) : (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: { xs: 1.5, md: 2 } }}>
          {purchaseInvoices.map((purchaseInvoice) => (
            <Card key={purchaseInvoice.id}>
              <CardContent sx={{ p: { xs: 2, md: 2.5 } }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 1 }}>
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 1, md: 2 }, mb: 1, flexWrap: 'wrap' }}>
                      <Typography variant="h6" component="h3" sx={{ fontWeight: 'bold', fontSize: { xs: '1rem', md: '1.25rem' } }}>
                        {purchaseInvoice.purchase_invoice_number}
                      </Typography>
                      <Chip 
                        label={getStatusLabel(purchaseInvoice)} 
                        color={getStatusColor(purchaseInvoice.status, purchaseInvoice.payment_status) as any}
                        size="small"
                      />
                    </Box>
                    
                    <Typography color="text.secondary" gutterBottom variant="body2">
                      Supplier: {purchaseInvoice.supplier_name}
                    </Typography>
                    
                    <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: { xs: 1, sm: 2, md: 4 }, mb: 2 }}>
                      <Typography variant="body2">
                        Amount: <strong>{formatCurrency(purchaseInvoice.total_amount)}</strong>
                      </Typography>
                      <Typography variant="body2" sx={{ display: { xs: 'none', sm: 'block' } }}>
                        Due: {format(new Date(purchaseInvoice.due_date), 'MMM dd, yyyy')}
                      </Typography>
                      <Typography variant="body2">
                        Items: {purchaseInvoice.line_count}
                      </Typography>
                    </Box>
                    
                    <Typography variant="caption" color="text.secondary">
                      Created: {format(new Date(purchaseInvoice.created_at), 'MMM dd, yyyy HH:mm')} 
                      {purchaseInvoice.first_name && ` by ${purchaseInvoice.first_name} ${purchaseInvoice.last_name}`}
                    </Typography>
                  </Box>
                  
                  <IconButton
                    onClick={(e) => handleMenuClick(e, purchaseInvoice)}
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
          <MenuOption onClick={handleViewPurchaseInvoice}>
            <ViewIcon sx={{ mr: 1 }} fontSize="small" />
            View Purchase Invoice
          </MenuOption>
          <MenuOption onClick={handleEditPurchaseInvoice}>
            <EditIcon sx={{ mr: 1 }} fontSize="small" />
            Edit Purchase Invoice
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
          setSelectedPurchaseInvoice(null);
        }}
      >
        <DialogTitle>Delete Purchase Invoice</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete purchase invoice {selectedPurchaseInvoice?.purchase_invoice_number}? 
            This action cannot be undone and will restore stock quantities.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={() => {
              setDeleteDialogOpen(false);
              setSelectedPurchaseInvoice(null);
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

export default PurchaseInvoiceListScreen;