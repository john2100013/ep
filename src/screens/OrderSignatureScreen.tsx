import React from 'react';
import {
  Container,
  Card,
  CardContent,
  Typography,
  Button,
  Box,
  Alert,
} from '@mui/material';
import { AccountCircle as SignatureIcon } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';

const OrderSignatureScreen: React.FC = () => {
  const navigate = useNavigate();

  return (
    <Box sx={{ display: 'flex', width: '100vw', minHeight: '100vh', margin: 0 }}>
      {/* Sidebar - hidden on mobile */}
      <Box sx={{ display: { xs: 'none', md: 'block' } }}>
        <Sidebar title="Order Signatures" />
      </Box>

      {/* Main Content */}
      <Box sx={{ 
        marginLeft: { xs: 0, md: '350px' }, 
        width: { xs: '100%', md: 'calc(100vw - 350px - 24px)' }, 
        p: { xs: 2, md: 4 }, 
        paddingRight: { xs: 0, md: '24px' },
        overflow: 'auto',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'flex-start'
      }}>
        <Box sx={{ maxWidth: 'md', width: '100%' }}>
          <Card elevation={4}>
            <CardContent>
              <Box sx={{ textAlign: 'center', mb: 3 }}>
                <SignatureIcon sx={{ fontSize: { xs: 40, md: 60 }, color: 'primary.main', mb: 2 }} />
                <Typography variant="h4" component="h1" gutterBottom color="primary" sx={{ fontSize: { xs: '1.5rem', md: '2.125rem' } }}>
                  Order Signatures
                </Typography>
                <Typography variant="h6" color="text.secondary" sx={{ fontSize: { xs: '0.9rem', md: '1rem' } }}>
                  Configure signature settings for your invoices
                </Typography>
              </Box>

              <Alert severity="info" sx={{ mb: 3 }}>
                <Typography variant="body1">
                  <strong>Feature Coming Soon!</strong>
                </Typography>
                <Typography variant="body2" sx={{ mt: 1 }}>
                  This feature will allow you to:
                  <ul style={{ marginTop: 8, marginBottom: 0 }}>
                    <li>Set up digital signatures for order creation and approval</li>
                    <li>Define roles and permissions for signature authority</li>
                    <li>Automatically include signature information in generated invoices</li>
                    <li>Manage multiple signatories within your business</li>
                    <li>Track signature history and approval workflows</li>
                  </ul>
                </Typography>
              </Alert>

              <Card variant="outlined" sx={{ mb: 3 }}>
                <CardContent>
                  <Typography variant="h6" gutterBottom sx={{ fontSize: { xs: '1rem', md: '1.25rem' } }}>
                    Planned Features:
                  </Typography>
                  <Box sx={{ pl: { xs: 1, md: 2 } }}>
                    <Typography variant="body2" sx={{ mb: 1, fontSize: { xs: '0.8rem', md: '0.875rem' } }}>
                      • <strong>Created By:</strong> Configure who can create orders and invoices
                    </Typography>
                    <Typography variant="body2" sx={{ mb: 1, fontSize: { xs: '0.8rem', md: '0.875rem' } }}>
                      • <strong>Approved By:</strong> Set approval authority for orders
                    </Typography>
                    <Typography variant="body2" sx={{ mb: 1, fontSize: { xs: '0.8rem', md: '0.875rem' } }}>
                      • <strong>Digital Signatures:</strong> Upload signature images or use digital signing
                    </Typography>
                    <Typography variant="body2" sx={{ mb: 1, fontSize: { xs: '0.8rem', md: '0.875rem' } }}>
                      • <strong>Employee Management:</strong> Assign signature permissions to team members
                    </Typography>
                    <Typography variant="body2" sx={{ fontSize: { xs: '0.8rem', md: '0.875rem' } }}>
                      • <strong>Audit Trail:</strong> Track all signature activities and approvals
                    </Typography>
                  </Box>
                </CardContent>
              </Card>

              <Box sx={{ display: 'flex', gap: { xs: 1, md: 2 }, justifyContent: 'center', flexDirection: { xs: 'column', sm: 'row' } }}>
                <Button
                  variant="outlined"
                  onClick={() => navigate(-1)}
                  sx={{ width: { xs: '100%', sm: 'auto' } }}
                >
                  Go Back
                </Button>
                <Button
                  variant="contained"
                  onClick={() => {
                    alert('This feature is under development and will be available in a future update!');
                  }}
                  sx={{ width: { xs: '100%', sm: 'auto' } }}
                >
                  Request Feature
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Box>
      </Box>
    </Box>
  );
};

export default OrderSignatureScreen;