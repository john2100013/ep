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
  Description as QuoteIcon,
  Transform as ConvertIcon,
  ChangeCircle as StatusIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { ApiService } from '../services/api';
import Sidebar from '../components/Sidebar';

interface QuotationLine {
  id: number;
  item_id: number;
  quantity: number;
  unit_price: number;
  total: number;
  description: string;
  code: string;
  uom: string;
  item_name?: string;
}

interface Quotation {
  id: number;
  quotation_number: string;
  customer_name: string;
  customer_address?: string;
  customer_pin?: string;
  subtotal: number;
  vat_amount: number;
  total_amount: number;
  status: 'draft' | 'sent' | 'accepted' | 'rejected' | 'expired' | 'converted';
  valid_until: string;
  converted_to_invoice_id?: number;
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

interface QuotationListResponse {
  success: boolean;
  data: {
    quotations: Quotation[];
    pagination: PaginationData;
  };
  message?: string;
}

const QuotationListScreen: React.FC = () => {
  const navigate = useNavigate();
  const [quotations, setQuotations] = useState<Quotation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [pagination, setPagination] = useState<PaginationData>({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0
  });
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedQuotation, setSelectedQuotation] = useState<Quotation | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [convertDialogOpen, setConvertDialogOpen] = useState(false);
  const [statusDialogOpen, setStatusDialogOpen] = useState(false);
  const [newStatus, setNewStatus] = useState('');

  const fetchQuotations = async () => {
    try {
      setLoading(true);
      
      const params: any = {
        page: pagination.page,
        limit: pagination.limit,
      };
      
      if (searchTerm) params.search = searchTerm;
      if (statusFilter) params.status = statusFilter;

      const response = await ApiService.getQuotations(params);
      
      if (response.success) {
        setQuotations(response.data.quotations);
        setPagination(response.data.pagination);
      } else {
        throw new Error(response.message || 'Failed to fetch quotations');
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQuotations();
  }, [pagination.page, searchTerm, statusFilter]);

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

  const handleMenuClick = (event: React.MouseEvent<HTMLButtonElement>, quotation: Quotation) => {
    setAnchorEl(event.currentTarget);
    setSelectedQuotation(quotation);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedQuotation(null);
  };

  const handleViewQuotation = () => {
    if (selectedQuotation) {
      navigate(`/quotations/${selectedQuotation.id}`);
    }
    handleMenuClose();
  };

  const handleEditQuotation = () => {
    if (selectedQuotation) {
      navigate(`/create-quotation?edit=${selectedQuotation.id}`);
    }
    handleMenuClose();
  };

  const handleChangeStatusClick = () => {
    setNewStatus(selectedQuotation?.status || '');
    setStatusDialogOpen(true);
    handleMenuClose();
  };

  const handleStatusChange = async () => {
    if (!selectedQuotation || !newStatus) return;

    try {
      console.log('Updating status for quotation:', selectedQuotation.id, 'to:', newStatus);
      const response = await ApiService.updateQuotationStatus(selectedQuotation.id, newStatus);
      console.log('Status update response:', response);
      
      if (response.success) {
        await fetchQuotations();
        setStatusDialogOpen(false);
        setSelectedQuotation(null);
        setNewStatus('');
      } else {
        throw new Error(response.message || 'Failed to update quotation status');
      }
    } catch (err: any) {
      console.error('Status update error:', err);
      setError(err.message || 'Failed to update quotation status');
    }
  };

  const handleConvertClick = () => {
    setConvertDialogOpen(true);
    handleMenuClose();
  };

  const handleConvertConfirm = async () => {
    if (!selectedQuotation) return;

    try {
      console.log('Converting quotation to invoice:', selectedQuotation.id);
      const result = await ApiService.convertQuotationToInvoice(selectedQuotation.id);
      console.log('Convert response:', result);
      
      if (result.success) {
        await fetchQuotations();
        setConvertDialogOpen(false);
        setSelectedQuotation(null);
        
        // Navigate to the created invoice or show success message
        if (result.data?.invoice?.id) {
          navigate(`/invoices/${result.data.invoice.id}`);
        } else {
          // If no invoice ID, just show success and refresh
          setError(null);
        }
      } else {
        throw new Error(result.message || 'Failed to convert quotation');
      }
    } catch (err: any) {
      console.error('Convert error:', err);
      setError(err.message || 'Failed to convert quotation');
    }
  };

  const handleDeleteClick = () => {
    setDeleteDialogOpen(true);
    handleMenuClose();
  };

  const handleDeleteConfirm = async () => {
    if (!selectedQuotation) return;

    try {
      await ApiService.deleteQuotation(selectedQuotation.id);
      await fetchQuotations();
      setDeleteDialogOpen(false);
      setSelectedQuotation(null);
    } catch (err: any) {
      setError(err.message || 'Failed to delete quotation');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft': return 'default';
      case 'sent': return 'info';
      case 'accepted': return 'success';
      case 'rejected': return 'error';
      case 'expired': return 'warning';
      case 'converted': return 'primary';
      default: return 'default';
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES'
    }).format(amount);
  };

  const isExpired = (validUntil: string) => {
    return new Date(validUntil) < new Date();
  };

  if (loading && quotations.length === 0) {
    return (
      <Box sx={{ p: 3, textAlign: 'center' }}>
        <Typography>Loading quotations...</Typography>
      </Box>
    );
  }

  // Calculate stats for sidebar
  const currentStats = {
    total: pagination.total,
    totalValue: quotations.reduce((sum, quot) => sum + quot.total_amount, 0),
    statusCounts: {
      draft: quotations.filter(quot => quot.status === 'draft').length,
      sent: quotations.filter(quot => quot.status === 'sent').length,
      accepted: quotations.filter(quot => quot.status === 'accepted').length,
      rejected: quotations.filter(quot => quot.status === 'rejected').length,
      expired: quotations.filter(quot => quot.status === 'expired').length,
      converted: quotations.filter(quot => quot.status === 'converted').length,
    }
  };

  const statusOptions = [
    { value: '', label: 'All Status' },
    { value: 'draft', label: 'Draft' },
    { value: 'sent', label: 'Sent' },
    { value: 'accepted', label: 'Accepted' },
    { value: 'rejected', label: 'Rejected' },
    { value: 'expired', label: 'Expired' },
    { value: 'converted', label: 'Converted' },
  ];

  return (
    <Box sx={{ display: 'flex', width: '100vw', minHeight: '100vh', margin: 0 }}>
      {/* Sidebar */}
      <Sidebar
        title="Quotation Management"
        currentStats={currentStats}
        statusFilter={statusFilter}
        onStatusFilterChange={handleStatusFilterChange}
        statusOptions={statusOptions}
      />

      {/* Main Content */}
      <Box sx={{ 
        marginLeft: '350px', 
        width: 'calc(100vw - 350px - 24px)', 
        p: 3, 
        paddingRight: '24px',
        overflow: 'hidden' 
      }}>
        {/* Header */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h4" component="h1">
            Quotations
          </Typography>
          <Button
            variant="contained"
            color="primary"
            startIcon={<AddIcon />}
            onClick={() => navigate('/create-quotation')}
          >
            Create Quotation
          </Button>
        </Box>

        {/* Search */}
        <Paper sx={{ p: 2, mb: 3 }}>
          <TextField
            placeholder="Search quotations..."
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

      {/* Quotation List */}
      {quotations.length === 0 && !loading ? (
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <QuoteIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h6" color="text.secondary" gutterBottom>
            No quotations found
          </Typography>
          <Typography color="text.secondary" sx={{ mb: 3 }}>
            Create your first quotation to get started
          </Typography>
          <Button
            variant="contained"
            color="primary"
            startIcon={<AddIcon />}
            onClick={() => navigate('/create-quotation')}
          >
            Create Quotation
          </Button>
        </Paper>
      ) : (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {quotations.map((quotation) => (
            <Card key={quotation.id}>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <Box sx={{ flex: 1 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
                      <Typography variant="h6" component="h3">
                        {quotation.quotation_number}
                      </Typography>
                      <Chip 
                        label={quotation.status.toUpperCase()} 
                        color={getStatusColor(quotation.status) as any}
                        size="small"
                      />
                      {isExpired(quotation.valid_until) && quotation.status !== 'converted' && quotation.status !== 'accepted' && (
                        <Chip 
                          label="EXPIRED" 
                          color="error"
                          size="small"
                          variant="outlined"
                        />
                      )}
                    </Box>
                    
                    <Typography color="text.secondary" gutterBottom>
                      Customer: {quotation.customer_name}
                    </Typography>
                    
                    <Box sx={{ display: 'flex', gap: 4, mb: 2 }}>
                      <Typography variant="body2">
                        Amount: <strong>{formatCurrency(quotation.total_amount)}</strong>
                      </Typography>
                      <Typography variant="body2">
                        Valid Until: {format(new Date(quotation.valid_until), 'MMM dd, yyyy')}
                      </Typography>
                      <Typography variant="body2">
                        Items: {quotation.line_count}
                      </Typography>
                    </Box>
                    
                    <Typography variant="caption" color="text.secondary">
                      Created: {format(new Date(quotation.created_at), 'MMM dd, yyyy HH:mm')} 
                      {quotation.first_name && ` by ${quotation.first_name} ${quotation.last_name}`}
                    </Typography>
                  </Box>
                  
                  <IconButton
                    onClick={(e) => handleMenuClick(e, quotation)}
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
          <MenuOption onClick={handleViewQuotation}>
            <ViewIcon sx={{ mr: 1 }} fontSize="small" />
            View Quotation
          </MenuOption>
          <MenuOption onClick={handleEditQuotation}>
            <EditIcon sx={{ mr: 1 }} fontSize="small" />
            Edit Quotation
          </MenuOption>
          {selectedQuotation?.status !== 'converted' && (
            <MenuOption onClick={handleChangeStatusClick}>
              <StatusIcon sx={{ mr: 1 }} fontSize="small" />
              Change Status
            </MenuOption>
          )}
          {selectedQuotation?.status !== 'converted' && (
            <MenuOption onClick={handleConvertClick}>
              <ConvertIcon sx={{ mr: 1 }} fontSize="small" />
              Convert to Invoice
            </MenuOption>
          )}
          <MenuOption onClick={handleDeleteClick} sx={{ color: 'error.main' }}>
            <DeleteIcon sx={{ mr: 1 }} fontSize="small" />
            Delete
          </MenuOption>
        </MenuList>
      </Menu>

      {/* Convert Confirmation Dialog */}
      <Dialog
        open={convertDialogOpen}
        onClose={() => setConvertDialogOpen(false)}
      >
        <DialogTitle>Convert to Invoice</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to convert quotation {selectedQuotation?.quotation_number} to an invoice? 
            This will affect your stock quantities and create a new invoice.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConvertDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleConvertConfirm} color="primary" variant="contained">
            Convert to Invoice
          </Button>
        </DialogActions>
      </Dialog>

      {/* Status Change Dialog */}
      <Dialog
        open={statusDialogOpen}
        onClose={() => setStatusDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Change Quotation Status</DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ mb: 2 }}>
            Change the status of quotation {selectedQuotation?.quotation_number}.
          </DialogContentText>
          <FormControl fullWidth>
            <InputLabel>Status</InputLabel>
            <Select
              value={newStatus}
              onChange={(e) => setNewStatus(e.target.value)}
              label="Status"
            >
              <MenuItem value="draft">Draft</MenuItem>
              <MenuItem value="sent">Sent</MenuItem>
              <MenuItem value="accepted">Accepted</MenuItem>
              <MenuItem value="rejected">Rejected</MenuItem>
              <MenuItem value="expired">Expired</MenuItem>
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setStatusDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleStatusChange} color="primary" variant="contained">
            Update Status
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
      >
        <DialogTitle>Delete Quotation</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete quotation {selectedQuotation?.quotation_number}? 
            This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleDeleteConfirm} color="error" variant="contained">
            Delete
          </Button>
        </DialogActions>
      </Dialog>
      </Box>
    </Box>
  );
};

export default QuotationListScreen;