import React, { useState } from 'react';
import {
  Container,
  Paper,
  TextField,
  Button,
  Typography,
  Box,
  Alert,
  Link,
  Grid,
} from '@mui/material';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Receipt } from '@mui/icons-material';

const LoginScreen: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (error: any) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#f9fafb' }}>
      {/* Header with logo and back link */}
      <Box sx={{ p: 2, bgcolor: 'white', boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)' }}>
        <Container maxWidth="sm">
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Receipt sx={{ fontSize: 32, color: '#8B5CF6' }} />
            <Typography variant="h6" fontWeight="bold" sx={{ color: '#8B5CF6' }}>
              InvoiceHub
            </Typography>
          </Box>
        </Container>
      </Box>

      <Container component="main" maxWidth="sm">
        <Box
          sx={{
            marginTop: 8,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
          }}
        >
          <Paper
            elevation={3}
            sx={{
              padding: 4,
              width: '100%',
              borderRadius: '12px',
              backgroundColor: 'white',
            }}
          >
            <Typography component="h1" variant="h4" align="center" gutterBottom fontWeight="bold">
              Welcome Back
            </Typography>
            <Typography variant="body2" align="center" color="text.secondary" gutterBottom sx={{ mb: 3 }}>
              Sign in to your account to continue
            </Typography>

            {error && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {error}
              </Alert>
            )}

            <Box component="form" onSubmit={handleSubmit}>
              <TextField
                margin="normal"
                required
                fullWidth
                id="email"
                label="Email Address"
                name="email"
                autoComplete="email"
                autoFocus
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    '&:hover fieldset': {
                      borderColor: '#8B5CF6',
                    },
                  },
                }}
              />
              <TextField
                margin="normal"
                required
                fullWidth
                name="password"
                label="Password"
                type="password"
                id="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    '&:hover fieldset': {
                      borderColor: '#8B5CF6',
                    },
                  },
                }}
              />
              <Button
                type="submit"
                fullWidth
                variant="contained"
                sx={{
                  mt: 3,
                  mb: 2,
                  py: 1.5,
                  backgroundColor: '#8B5CF6',
                  fontWeight: 'bold',
                  '&:hover': { backgroundColor: '#7c3aed' },
                }}
                disabled={loading}
              >
                {loading ? 'Signing In...' : 'Sign In'}
              </Button>

              <Box sx={{ textAlign: 'center', mt: 2 }}>
                <Link component={RouterLink} to="/reset-password" variant="body2" sx={{ color: '#6b7280', '&:hover': { color: '#8B5CF6' }, display: 'block', mb: 1 }}>
                  Forgot your password?
                </Link>
              </Box>

              <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1, mt: 2 }}>
                <Typography variant="body2" color="text.secondary">
                  Don't have an account?
                </Typography>
                <Link component={RouterLink} to="/register" variant="body2" sx={{ fontWeight: 'bold', color: '#8B5CF6' }}>
                  Sign Up
                </Link>
              </Box>

              <Box sx={{ textAlign: 'center', mt: 3 }}>
                <Link component={RouterLink} to="/landing" variant="body2" sx={{ color: '#6b7280', '&:hover': { color: '#8B5CF6' } }}>
                  Back to Home
                </Link>
              </Box>
            </Box>
          </Paper>
        </Box>
      </Container>
    </Box>
  );
};

export default LoginScreen;