import React, { useState, useEffect } from 'react';
import {
  Container,
  Card,
  CardContent,
  Typography,
  Button,
  Box,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import {
  Add as AddIcon,
  Receipt as InvoiceIcon,
  Description as QuotationIcon,
  List as ListIcon,
  Inventory as ItemIcon,
  AccountCircle as SignatureIcon,
  Settings as SettingsIcon,
  KeyboardReturn as ReturnIcon,
  ReportProblem as DamageIcon,
  Analytics as AnalyticsIcon,
  Store as StoreIcon,
  LocalHospital as HospitalIcon,
  Storage as DatabaseIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { ApiService } from '../services/api';

const HomeScreen: React.FC = () => {
  const navigate = useNavigate();
  const { business, user } = useAuth();
  const [businessName, setBusinessName] = useState<string>('');
  const [advanceOpen, setAdvanceOpen] = useState(false);

  // Fetch business settings to get business name
  useEffect(() => {
    const fetchBusinessSettings = async () => {
      try {
        const data = await ApiService.getBusinessSettings();
        if (data.success && data.data && data.data.businessName) {
          setBusinessName(data.data.businessName);
        }
      } catch (error) {
        console.error('Error fetching business settings:', error);
        // Fallback to localStorage
        const savedSettings = localStorage.getItem('businessSettings');
        if (savedSettings) {
          const settings = JSON.parse(savedSettings);
          if (settings.businessName) {
            setBusinessName(settings.businessName);
          }
        }
      }
    };

    fetchBusinessSettings();
  }, []);

  return (
    <Box sx={{ 
      display: 'flex', 
      justifyContent: 'center', 
      width: '100vw', 
      minHeight: '100vh',
      padding: { xs: 2, sm: 3, md: 4 },
      boxSizing: 'border-box'
    }}>
      <Box sx={{ 
        width: '100%', 
        maxWidth: '1200px',
        display: 'flex',
        flexDirection: 'column',
        gap: 3
      }}>
        {/* Welcome Section */}
        <Card sx={{ elevation: 4 }}>
        <CardContent>
          <Typography variant="h4" component="h1" gutterBottom align="center" color="primary">
            Welcome to Invoice App
          </Typography>
          <Typography variant="h6" align="center" color="text.secondary">
            Create professional quotations and invoices for your business
          </Typography>
          {business && (
            <Typography variant="body1" align="center" sx={{ mt: 2 }}>
              Business: <strong>{businessName || business.name}</strong> | User: <strong>{user?.first_name} {user?.last_name}</strong>
            </Typography>
          )}
        </CardContent>
      </Card>

        {/* Quick Actions */}
        <Card sx={{ elevation: 4 }}>
          <CardContent>
            <Typography variant="h5" gutterBottom color="primary">
              Quick Actions
            </Typography>
          
          <Box sx={{ 
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: 2,
            mt: 1
          }}>
            <Button
              fullWidth
              variant="contained"
              startIcon={<StoreIcon />}
              onClick={() => navigate('/pos')}
              sx={{
                py: 2,
                bgcolor: '#1976d2',
                '&:hover': { bgcolor: '#1565c0' }
              }}
            >
              POS System
            </Button>

            {/* Advance package button (contains Salon, Service Billing, Hospital links) */}
            <Button
              fullWidth
              variant="contained"
              onClick={() => setAdvanceOpen(true)}
              sx={{
                py: 2,
                bgcolor: '#00796b',
                '&:hover': { bgcolor: '#00695c' }
              }}
            >
              Advance Package
            </Button>

            {/* Invoice Management */}
            <Button
              fullWidth
              variant="contained"
              startIcon={<InvoiceIcon />}
              onClick={() => navigate('/invoices')}
              sx={{
                py: 2,
                bgcolor: '#0066ff',
                '&:hover': { bgcolor: '#0056d3' }
              }}
            >
              Invoices
            </Button>

            <Button
              fullWidth
              variant="contained"
              startIcon={<QuotationIcon />}
              onClick={() => navigate('/quotations')}
              sx={{
                py: 2,
                bgcolor: '#2e7d32',
                '&:hover': { bgcolor: '#1b5e20' }
              }}
            >
              Quotations
            </Button>
            
            <Button
              fullWidth
              variant="outlined"
              startIcon={<InvoiceIcon />}
              onClick={() => navigate('/create-invoice')}
              sx={{ py: 2, borderColor: '#0066ff', color: '#0066ff' }}
            >
              Create Invoice
            </Button>

            <Button
              fullWidth
              variant="outlined"
              startIcon={<QuotationIcon />}
              onClick={() => navigate('/create-quotation')}
              sx={{ py: 2, borderColor: '#2e7d32', color: '#2e7d32' }}
            >
              Create Quotation
            </Button>
            
            <Button
              fullWidth
              variant="outlined"
              startIcon={<ItemIcon />}
              onClick={() => navigate('/customers')}
              sx={{ py: 2, borderColor: '#9c27b0', color: '#9c27b0' }}
            >
              👥 Customers
            </Button>
            
            <Button
              fullWidth
              variant="outlined"
              startIcon={<ItemIcon />}
              onClick={() => navigate('/customer-invoices-list')}
              sx={{ py: 2, borderColor: '#1976d2', color: '#1976d2' }}
            >
              📊 Customer Invoices
            </Button>
            
            {/* Item Management */}
            <Button
              fullWidth
              variant="outlined"
              startIcon={<ItemIcon />}
              onClick={() => navigate('/items-list')}
              sx={{ py: 2 }}
            >
              Items
            </Button>
            
            <Button
              fullWidth
              variant="outlined"
              startIcon={<AddIcon />}
              onClick={() => navigate('/item-categories')}
              sx={{ py: 2, borderColor: '#ff9800', color: '#ff9800' }}
            >
              📂 Item Categories
            </Button>
            
            <Button
              fullWidth
              variant="outlined"
              startIcon={<AddIcon />}
              onClick={() => navigate('/add-item')}
              sx={{ py: 2 }}
            >
              Add Item
            </Button>
            
            {/* Inventory Management */}
            <Button
              fullWidth
              variant="outlined"
              startIcon={<ReturnIcon />}
              onClick={() => navigate('/goods-returns')}
              sx={{ py: 2, borderColor: '#4CAF50', color: '#4CAF50' }}
            >
              Goods Returns
            </Button>
            
            <Button
              fullWidth
              variant="outlined"
              startIcon={<DamageIcon />}
              onClick={() => navigate('/damage-tracking')}
              sx={{ py: 2, borderColor: '#FF5722', color: '#FF5722' }}
            >
              Damage Tracking
            </Button>
            
            {/* Settings */}
            <Button
              fullWidth
              variant="outlined"
              startIcon={<SignatureIcon />}
              onClick={() => navigate('/order-signatures')}
              sx={{ py: 2 }}
            >
              Signatures
            </Button>
            
            <Button
              fullWidth
              variant="outlined"
              startIcon={<AnalyticsIcon />}
              onClick={() => navigate('/analytics')}
              sx={{ py: 2, borderColor: '#9C27B0', color: '#9C27B0' }}
            >
              Analytics
            </Button>
            
            <Button
              fullWidth
              variant="outlined"
              startIcon={<SettingsIcon />}
              onClick={() => navigate('/business-settings')}
              sx={{ py: 2 }}
            >
              Settings
            </Button>

            <Button
              fullWidth
              variant="outlined"
              startIcon={<DatabaseIcon />}
              onClick={() => navigate('/database-settings')}
              sx={{ py: 2, borderColor: '#1976D2', color: '#1976D2' }}
            >
              Database Settings
            </Button>

            {/* Previously Salon/Hospital buttons moved to Advance Package modal */}
          </Box>
          </CardContent>
        </Card>

        {/* Advance Package Modal */}
        <Dialog open={advanceOpen} onClose={() => setAdvanceOpen(false)} fullWidth maxWidth="sm">
          <DialogTitle>Advance Package</DialogTitle>
          <DialogContent>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
              <Button variant="outlined" onClick={() => { setAdvanceOpen(false); navigate('/salon'); }}>
                💈 Salon / Barber
              </Button>
              <Button variant="outlined" onClick={() => { setAdvanceOpen(false); navigate('/service-billing'); }}>
                💆 Service Billing
              </Button>
              <Button variant="outlined" onClick={() => { setAdvanceOpen(false); navigate('/hospital'); }}>
                🏥 Hospital Management
              </Button>
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setAdvanceOpen(false)}>Close</Button>
          </DialogActions>
        </Dialog>


        {/* Features Section */}
        <Card sx={{ elevation: 4 }}>
          <CardContent>
            <Typography variant="h5" gutterBottom color="primary">
              Features
            </Typography>
            <Box sx={{ mt: 2 }}>
              <Typography variant="body1" sx={{ mb: 1 }}>
                ✓ Complete invoice management with automatic numbering (JM0001)
              </Typography>
              <Typography variant="body1" sx={{ mb: 1 }}>
                ✓ Quotation system with conversion to invoices
              </Typography>
              <Typography variant="body1" sx={{ mb: 1 }}>
                ✓ Stock management with automatic quantity updates
              </Typography>
              <Typography variant="body1" sx={{ mb: 1 }}>
                ✓ Professional PDF generation and sharing
              </Typography>
              <Typography variant="body1" sx={{ mb: 1 }}>
                ✓ Complete item management system
              </Typography>
              <Typography variant="body1" sx={{ mb: 1 }}>
                ✓ Goods return processing with stock restoration
              </Typography>
              <Typography variant="body1" sx={{ mb: 1 }}>
                ✓ Damage tracking for inventory losses
              </Typography>
              <Typography variant="body1" sx={{ mb: 1 }}>
                ✓ Financial account impact management
              </Typography>
              <Typography variant="body1" sx={{ mb: 1 }}>
                ✓ Business settings with logo upload
              </Typography>
              <Typography variant="body1" sx={{ mb: 1 }}>
                ✓ Multi-tenant business accounts
              </Typography>
              <Typography variant="body1">
                ✓ Secure cloud-based data storage
              </Typography>
            </Box>
          </CardContent>
        </Card>
      </Box>
    </Box>
  );
};

export default HomeScreen;