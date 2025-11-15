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

const OrderSignatureScreen: React.FC = () => {
  const navigate = useNavigate();

  return (
    <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
      <Card elevation={4}>
        <CardContent>
          <Box sx={{ textAlign: 'center', mb: 3 }}>
            <SignatureIcon sx={{ fontSize: 60, color: 'primary.main', mb: 2 }} />
            <Typography variant="h4" component="h1" gutterBottom color="primary">
              Order Signatures
            </Typography>
            <Typography variant="h6" color="text.secondary">
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
              <Typography variant="h6" gutterBottom>
                Planned Features:
              </Typography>
              <Box sx={{ pl: 2 }}>
                <Typography variant="body2" sx={{ mb: 1 }}>
                  • <strong>Created By:</strong> Configure who can create orders and invoices
                </Typography>
                <Typography variant="body2" sx={{ mb: 1 }}>
                  • <strong>Approved By:</strong> Set approval authority for orders
                </Typography>
                <Typography variant="body2" sx={{ mb: 1 }}>
                  • <strong>Digital Signatures:</strong> Upload signature images or use digital signing
                </Typography>
                <Typography variant="body2" sx={{ mb: 1 }}>
                  • <strong>Employee Management:</strong> Assign signature permissions to team members
                </Typography>
                <Typography variant="body2">
                  • <strong>Audit Trail:</strong> Track all signature activities and approvals
                </Typography>
              </Box>
            </CardContent>
          </Card>

          <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center' }}>
            <Button
              variant="outlined"
              onClick={() => navigate(-1)}
            >
              Go Back
            </Button>
            <Button
              variant="contained"
              onClick={() => {
                alert('This feature is under development and will be available in a future update!');
              }}
            >
              Request Feature
            </Button>
          </Box>
        </CardContent>
      </Card>
    </Container>
  );
};

export default OrderSignatureScreen;