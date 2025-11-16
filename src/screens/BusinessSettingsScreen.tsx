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
  Paper,
  Avatar,
  IconButton,
} from '@mui/material';
import {
  Delete as DeleteIcon,
  Save as SaveIcon,
  Business as BusinessIcon,
  Person as PersonIcon,
  Camera as CameraIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';

interface BusinessSettings {
  businessName: string;
  street: string;
  city: string;
  email: string;
  telephone: string;
  createdBy: string;
  approvedBy: string;
  createdBySignature: string;
  approvedBySignature: string;
  logo: string;
}

const BusinessSettingsScreen: React.FC = () => {
  const navigate = useNavigate();
  const [settings, setSettings] = useState<BusinessSettings>({
    businessName: '',
    street: '',
    city: '',
    email: '',
    telephone: '',
    createdBy: '',
    approvedBy: '',
    createdBySignature: '',
    approvedBySignature: '',
    logo: '',
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const response = await fetch('https://erp-backend-beryl.vercel.app/api/business-settings', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json',
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.data) {
          setSettings(data.data);
        }
      }
    } catch (error) {
      console.error('Error loading business settings:', error);
      // Fallback to localStorage for backward compatibility
      const savedSettings = localStorage.getItem('businessSettings');
      if (savedSettings) {
        setSettings(JSON.parse(savedSettings));
      }
    }
  };

  const handleInputChange = (field: keyof BusinessSettings) => (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    setSettings(prev => ({
      ...prev,
      [field]: event.target.value,
    }));
  };

  const handleImageUpload = (field: 'createdBySignature' | 'approvedBySignature' | 'logo') => (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 1024 * 1024) { // 1MB limit
        setError('Image size should be less than 1MB');
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          // Create canvas for resizing
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          
          // Set max dimensions based on field type
          let maxWidth, maxHeight;
          if (field === 'logo') {
            maxWidth = 200;
            maxHeight = 100;
          } else {
            maxWidth = 150;
            maxHeight = 60;
          }
          
          let { width, height } = img;
          
          // Calculate new dimensions
          if (width > height) {
            if (width > maxWidth) {
              height = (height * maxWidth) / width;
              width = maxWidth;
            }
          } else {
            if (height > maxHeight) {
              width = (width * maxHeight) / height;
              height = maxHeight;
            }
          }
          
          canvas.width = width;
          canvas.height = height;
          
          // Draw and compress
          ctx?.drawImage(img, 0, 0, width, height);
          const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.8);
          
          setSettings(prev => ({
            ...prev,
            [field]: compressedDataUrl,
          }));
        };
        img.src = e.target?.result as string;
      };
      reader.readAsDataURL(file);
    }
  };

  const removeSignature = (field: 'createdBySignature' | 'approvedBySignature' | 'logo') => {
    setSettings(prev => ({
      ...prev,
      [field]: '',
    }));
  };

  const handleSave = async () => {
    setLoading(true);
    setError('');
    setSuccess('');
    
    try {
      // Validate required fields
      if (!settings.businessName.trim()) {
        throw new Error('Business name is required');
      }
      if (!settings.email.trim()) {
        throw new Error('Email is required');
      }
      if (!settings.telephone.trim()) {
        throw new Error('Telephone is required');
      }

      // Save to database
      const response = await fetch('https://erp-backend-beryl.vercel.app/api/business-settings', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(settings),
      });
      
      if (!response.ok) {
        throw new Error('Failed to save settings to database');
      }
      
      // Also save to localStorage as backup
      localStorage.setItem('businessSettings', JSON.stringify(settings));
      
      setSuccess('Business settings saved successfully!');
      
      // Navigate back after a short delay
      setTimeout(() => {
        navigate(-1);
      }, 1500);
      
    } catch (error: any) {
      setError(error.message || 'Failed to save settings');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ display: 'flex', width: '100vw', minHeight: '100vh', margin: 0 }}>
      {/* Sidebar */}
      <Sidebar title="Business Settings" />

      {/* Main Content */}
      <Box sx={{ 
        marginLeft: '350px', 
        width: 'calc(100vw - 350px - 24px)', 
        p: 3, 
        paddingRight: '24px',
        overflow: 'hidden',
        display: 'flex',
        justifyContent: 'center'
      }}>
        <Box sx={{ maxWidth: 'lg', width: '100%' }}>
      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}
      
      {success && (
        <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess('')}>
          {success}
        </Alert>
      )}

      {/* Header */}
      <Card sx={{ mb: 3, elevation: 4 }}>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <BusinessIcon color="primary" sx={{ fontSize: 32 }} />
            <Box>
              <Typography variant="h4" color="primary">
                Business Settings
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Configure your business information and signatures for invoices
              </Typography>
            </Box>
          </Box>
        </CardContent>
      </Card>

      {/* Business Information */}
      <Card sx={{ mb: 3, elevation: 4 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom color="primary" sx={{ mb: 3 }}>
            <BusinessIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
            Business Information
          </Typography>
          
          {/* Company Logo Section */}
          <Box sx={{ mb: 4 }}>
            <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 'bold' }}>
              Company Logo
            </Typography>
            <Paper sx={{ p: 3, border: '1px dashed #ccc', textAlign: 'center' }}>
              {settings.logo ? (
                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                  <Avatar
                    src={settings.logo}
                    variant="rounded"
                    sx={{ width: 160, height: 80 }}
                  />
                  <Box sx={{ display: 'flex', gap: 2 }}>
                    <input
                      accept="image/*"
                      style={{ display: 'none' }}
                      id="company-logo"
                      type="file"
                      onChange={handleImageUpload('logo')}
                    />
                    <label htmlFor="company-logo">
                      <Button
                        variant="outlined"
                        component="span"
                        startIcon={<CameraIcon />}
                        size="small"
                      >
                        Change Logo
                      </Button>
                    </label>
                    <IconButton
                      color="error"
                      onClick={() => removeSignature('logo')}
                      size="small"
                    >
                      <DeleteIcon />
                    </IconButton>
                  </Box>
                </Box>
              ) : (
                <Box sx={{ py: 3 }}>
                  <input
                    accept="image/*"
                    style={{ display: 'none' }}
                    id="company-logo"
                    type="file"
                    onChange={handleImageUpload('logo')}
                  />
                  <label htmlFor="company-logo">
                    <Button
                      variant="outlined"
                      component="span"
                      startIcon={<CameraIcon />}
                      size="large"
                    >
                      Upload Company Logo
                    </Button>
                  </label>
                  <Typography variant="caption" display="block" sx={{ mt: 2, color: 'text.secondary' }}>
                    Max size: 1MB, Recommended: 200x100px (PNG, JPG, JPEG)
                  </Typography>
                </Box>
              )}
            </Paper>
          </Box>
          
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            <Box sx={{ display: 'flex', gap: 3, flexDirection: { xs: 'column', md: 'row' } }}>
              <TextField
                fullWidth
                label="Business Name *"
                value={settings.businessName}
                onChange={handleInputChange('businessName')}
                variant="outlined"
              />
              <TextField
                fullWidth
                label="Email Address *"
                type="email"
                value={settings.email}
                onChange={handleInputChange('email')}
                variant="outlined"
              />
            </Box>
            
            <Box sx={{ display: 'flex', gap: 3, flexDirection: { xs: 'column', md: 'row' } }}>
              <TextField
                fullWidth
                label="Street Address"
                value={settings.street}
                onChange={handleInputChange('street')}
                variant="outlined"
              />
              <TextField
                fullWidth
                label="City"
                value={settings.city}
                onChange={handleInputChange('city')}
                variant="outlined"
              />
            </Box>
            
            <Box sx={{ display: 'flex', gap: 3, flexDirection: { xs: 'column', md: 'row' } }}>
              <TextField
                fullWidth
                label="Telephone *"
                value={settings.telephone}
                onChange={handleInputChange('telephone')}
                variant="outlined"
              />
              <Box sx={{ flex: 1 }} /> {/* Spacer */}
            </Box>
          </Box>
        </CardContent>
      </Card>

      {/* Order Signatures */}
      <Card sx={{ mb: 3, elevation: 4 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom color="primary" sx={{ mb: 3 }}>
            <PersonIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
            Order Signatures
          </Typography>
          
          <Box sx={{ display: 'flex', gap: 3, flexDirection: { xs: 'column', md: 'row' } }}>
            <Box sx={{ flex: 1 }}>
              <TextField
                fullWidth
                label="Created By"
                value={settings.createdBy}
                onChange={handleInputChange('createdBy')}
                variant="outlined"
                sx={{ mb: 2 }}
              />
              
              {/* Created By Signature */}
              <Paper sx={{ p: 2, border: '1px dashed #ccc' }}>
                <Typography variant="subtitle2" gutterBottom>
                  Created By Signature
                </Typography>
                
                {settings.createdBySignature ? (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Avatar
                      src={settings.createdBySignature}
                      variant="rounded"
                      sx={{ width: 120, height: 48 }}
                    />
                    <IconButton
                      color="error"
                      onClick={() => removeSignature('createdBySignature')}
                    >
                      <DeleteIcon />
                    </IconButton>
                  </Box>
                ) : (
                  <Box sx={{ textAlign: 'center', py: 2 }}>
                    <input
                      accept="image/*"
                      style={{ display: 'none' }}
                      id="created-by-signature"
                      type="file"
                      onChange={handleImageUpload('createdBySignature')}
                    />
                    <label htmlFor="created-by-signature">
                      <Button
                        variant="outlined"
                        component="span"
                        startIcon={<CameraIcon />}
                      >
                        Upload Signature
                      </Button>
                    </label>
                    <Typography variant="caption" display="block" sx={{ mt: 1 }}>
                      Max size: 1MB, Recommended: 150x60px
                    </Typography>
                  </Box>
                )}
              </Paper>
            </Box>
            
            <Box sx={{ flex: 1 }}>
              <TextField
                fullWidth
                label="Approved By"
                value={settings.approvedBy}
                onChange={handleInputChange('approvedBy')}
                variant="outlined"
                sx={{ mb: 2 }}
              />
              
              {/* Approved By Signature */}
              <Paper sx={{ p: 2, border: '1px dashed #ccc' }}>
                <Typography variant="subtitle2" gutterBottom>
                  Approved By Signature
                </Typography>
                
                {settings.approvedBySignature ? (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Avatar
                      src={settings.approvedBySignature}
                      variant="rounded"
                      sx={{ width: 120, height: 48 }}
                    />
                    <IconButton
                      color="error"
                      onClick={() => removeSignature('approvedBySignature')}
                    >
                      <DeleteIcon />
                    </IconButton>
                  </Box>
                ) : (
                  <Box sx={{ textAlign: 'center', py: 2 }}>
                    <input
                      accept="image/*"
                      style={{ display: 'none' }}
                      id="approved-by-signature"
                      type="file"
                      onChange={handleImageUpload('approvedBySignature')}
                    />
                    <label htmlFor="approved-by-signature">
                      <Button
                        variant="outlined"
                        component="span"
                        startIcon={<CameraIcon />}
                      >
                        Upload Signature
                      </Button>
                    </label>
                    <Typography variant="caption" display="block" sx={{ mt: 1 }}>
                      Max size: 1MB, Recommended: 150x60px
                    </Typography>
                  </Box>
                )}
              </Paper>
            </Box>
          </Box>
        </CardContent>
      </Card>

      {/* Save Button */}
      <Card sx={{ elevation: 4 }}>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Box>
              <Typography variant="body2" color="text.secondary">
                These settings will be applied to all new invoices
              </Typography>
            </Box>
            
            <Box sx={{ display: 'flex', gap: 2 }}>
              <Button
                variant="outlined"
                onClick={() => navigate(-1)}
                disabled={loading}
              >
                Cancel
              </Button>
              
              <Button
                variant="contained"
                startIcon={<SaveIcon />}
                onClick={handleSave}
                disabled={loading}
              >
                {loading ? 'Saving...' : 'Save Settings'}
              </Button>
            </Box>
          </Box>
        </CardContent>
      </Card>
        </Box>
      </Box>
    </Box>
  );
};

export default BusinessSettingsScreen;