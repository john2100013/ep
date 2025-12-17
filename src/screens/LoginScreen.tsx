import React, { useState, useEffect } from 'react';
import {
  Container,
  Paper,
  TextField,
  Button,
  Typography,
  Box,
  Alert,
  Link,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Tabs,
  Tab,
  IconButton,
  InputAdornment,
} from '@mui/material';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Receipt, Visibility, VisibilityOff } from '@mui/icons-material';
import ApiService from '../services/api';

const LoginScreen: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Password visibility states
  const [showPassword, setShowPassword] = useState(false);
  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showResetPassword, setShowResetPassword] = useState(false);
  const [showResetConfirmPassword, setShowResetConfirmPassword] = useState(false);

  // Change Password Dialog states
  const [changePasswordOpen, setChangePasswordOpen] = useState(false);
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [changePasswordLoading, setChangePasswordLoading] = useState(false);

  // Forgot Password Dialog states
  const [forgotPasswordOpen, setForgotPasswordOpen] = useState(false);
  const [forgotPasswordTab, setForgotPasswordTab] = useState(0); // 0: email, 1: OTP, 2: new password
  const [resetEmail, setResetEmail] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [resetNewPassword, setResetNewPassword] = useState('');
  const [resetConfirmPassword, setResetConfirmPassword] = useState('');
  const [resetToken, setResetToken] = useState('');
  const [forgotPasswordLoading, setForgotPasswordLoading] = useState(false);

  const { login, user } = useAuth();
  const navigate = useNavigate();

  // Check if user is logged in
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token && user) {
      // User is logged in, can access change password
    }
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      await login(email, password);
      setSuccess('Login successful!');
      setTimeout(() => {
        navigate('/dashboard');
      }, 500);
    } catch (error: any) {
      setError(error.message || 'Invalid email or password');
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async () => {
    setError('');
    setSuccess('');

    // Validation
    if (!oldPassword || !newPassword || !confirmPassword) {
      setError('All fields are required');
      return;
    }

    if (newPassword.length < 6) {
      setError('New password must be at least 6 characters long');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('New passwords do not match');
      return;
    }

    if (oldPassword === newPassword) {
      setError('New password must be different from old password');
      return;
    }

    setChangePasswordLoading(true);

    try {
      await ApiService.updatePassword(oldPassword, newPassword);
      setSuccess('Password changed successfully!');
      setTimeout(() => {
        setChangePasswordOpen(false);
        setOldPassword('');
        setNewPassword('');
        setConfirmPassword('');
        setSuccess('');
      }, 2000);
    } catch (error: any) {
      setError(error.response?.data?.message || 'Failed to change password');
    } finally {
      setChangePasswordLoading(false);
    }
  };

  const handleRequestPasswordReset = async () => {
    setError('');
    setSuccess('');

    if (!resetEmail) {
      setError('Email is required');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(resetEmail)) {
      setError('Invalid email format');
      return;
    }

    setForgotPasswordLoading(true);

    try {
      const response = await ApiService.requestPasswordReset(resetEmail);
      setSuccess(response.message || 'Password reset code sent to your email');
      // In development, show OTP in console/alert (remove in production)
      if (response.data?.otp) {
        console.log('OTP Code (Development only):', response.data.otp);
        alert(`Development Mode: OTP Code is ${response.data.otp}\n\nIn production, this will be sent via email.`);
      }
      setForgotPasswordTab(1); // Move to OTP tab
    } catch (error: any) {
      setError(error.response?.data?.message || 'Failed to send reset code');
    } finally {
      setForgotPasswordLoading(false);
    }
  };

  const handleVerifyOTP = async () => {
    setError('');
    setSuccess('');

    if (!otpCode || otpCode.length !== 6) {
      setError('Please enter a valid 6-digit OTP code');
      return;
    }

    setForgotPasswordLoading(true);

    try {
      const response = await ApiService.verifyPasswordResetOTP(resetEmail, otpCode);
      setSuccess('OTP verified successfully!');
      setResetToken(response.data?.token || '');
      setForgotPasswordTab(2); // Move to new password tab
    } catch (error: any) {
      setError(error.response?.data?.message || 'Invalid or expired OTP code');
    } finally {
      setForgotPasswordLoading(false);
    }
  };

  const handleResetPassword = async () => {
    setError('');
    setSuccess('');

    if (!resetNewPassword || !resetConfirmPassword) {
      setError('All fields are required');
      return;
    }

    if (resetNewPassword.length < 6) {
      setError('New password must be at least 6 characters long');
      return;
    }

    if (resetNewPassword !== resetConfirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setForgotPasswordLoading(true);

    try {
      await ApiService.resetPassword(resetEmail, otpCode, resetNewPassword, resetToken);
      setSuccess('Password reset successfully! You can now login with your new password.');
      setTimeout(() => {
        setForgotPasswordOpen(false);
        setForgotPasswordTab(0);
        setResetEmail('');
        setOtpCode('');
        setResetNewPassword('');
        setResetConfirmPassword('');
        setResetToken('');
        setSuccess('');
        setError('');
      }, 3000);
    } catch (error: any) {
      setError(error.response?.data?.message || 'Failed to reset password');
    } finally {
      setForgotPasswordLoading(false);
    }
  };

  const handleCloseForgotPassword = () => {
    setForgotPasswordOpen(false);
    setForgotPasswordTab(0);
    setResetEmail('');
    setOtpCode('');
    setResetNewPassword('');
    setResetConfirmPassword('');
    setResetToken('');
    setError('');
    setSuccess('');
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', bgcolor: '#f9fafb' }}>
      {/* Header with logo and back link */}
      <Box sx={{ p: 2, bgcolor: 'white', boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)' }}>
        <Container maxWidth="sm">
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Receipt sx={{ fontSize: 32, color: '#1976d2' }} />
            <Typography variant="h6" fontWeight="bold" sx={{ color: '#1976d2' }}>
              InvoiceHub
            </Typography>
          </Box>
        </Container>
      </Box>

      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', flex: 1, px: 2 }}>
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            width: '100%',
            maxWidth: '450px',
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
              <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
                {error}
              </Alert>
            )}

            {success && (
              <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess('')}>
                {success}
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
                      borderColor: '#1976d2',
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
                type={showPassword ? 'text' : 'password'}
                id="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        aria-label="toggle password visibility"
                        onClick={() => setShowPassword(!showPassword)}
                        edge="end"
                      >
                        {showPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    '&:hover fieldset': {
                      borderColor: '#1976d2',
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
                  backgroundColor: '#1976d2',
                  fontWeight: 'bold',
                  '&:hover': { backgroundColor: '#1565c0' },
                }}
                disabled={loading}
              >
                {loading ? 'Signing In...' : 'Sign In'}
              </Button>

              <Box sx={{ textAlign: 'center', mt: 2, display: 'flex', flexDirection: 'column', gap: 1 }}>
                <Link
                  component="button"
                  type="button"
                  variant="body2"
                  onClick={() => setForgotPasswordOpen(true)}
                  sx={{ color: '#6b7280', '&:hover': { color: '#1976d2' }, cursor: 'pointer', textDecoration: 'none' }}
                >
                  Forgot your password?
                </Link>
                {user && (
                  <Link
                    component="button"
                    type="button"
                    variant="body2"
                    onClick={() => setChangePasswordOpen(true)}
                    sx={{ color: '#6b7280', '&:hover': { color: '#1976d2' }, cursor: 'pointer', textDecoration: 'none' }}
                  >
                    Change Password
                  </Link>
                )}
              </Box>

              <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1, mt: 2 }}>
                <Typography variant="body2" color="text.secondary">
                  Don't have an account?
                </Typography>
                <Link component={RouterLink} to="/register" variant="body2" sx={{ fontWeight: 'bold', color: '#1976d2' }}>
                  Sign Up
                </Link>
              </Box>

              <Box sx={{ textAlign: 'center', mt: 3 }}>
                <Link component={RouterLink} to="/landing" variant="body2" sx={{ color: '#6b7280', '&:hover': { color: '#1976d2' } }}>
                  Back to Home
                </Link>
              </Box>
            </Box>
          </Paper>
        </Box>
      </Box>

      {/* Change Password Dialog */}
      <Dialog open={changePasswordOpen} onClose={() => setChangePasswordOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ backgroundColor: '#1976d2', color: 'white', fontWeight: 'bold' }}>
          Change Password
        </DialogTitle>
        <DialogContent sx={{ pt: 3 }}>
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
          <TextField
            margin="normal"
            required
            fullWidth
            label="Current Password"
            type={showOldPassword ? 'text' : 'password'}
            value={oldPassword}
            onChange={(e) => setOldPassword(e.target.value)}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    aria-label="toggle password visibility"
                    onClick={() => setShowOldPassword(!showOldPassword)}
                    edge="end"
                  >
                    {showOldPassword ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />
          <TextField
            margin="normal"
            required
            fullWidth
            label="New Password"
            type={showNewPassword ? 'text' : 'password'}
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            helperText="Must be at least 6 characters long"
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    aria-label="toggle password visibility"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    edge="end"
                  >
                    {showNewPassword ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />
          <TextField
            margin="normal"
            required
            fullWidth
            label="Confirm New Password"
            type={showConfirmPassword ? 'text' : 'password'}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    aria-label="toggle password visibility"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    edge="end"
                  >
                    {showConfirmPassword ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => {
            setChangePasswordOpen(false);
            setOldPassword('');
            setNewPassword('');
            setConfirmPassword('');
            setError('');
            setSuccess('');
          }}>
            Cancel
          </Button>
          <Button
            onClick={handleChangePassword}
            variant="contained"
            disabled={changePasswordLoading || !oldPassword || !newPassword || !confirmPassword}
            sx={{ backgroundColor: '#1976d2' }}
          >
            {changePasswordLoading ? 'Changing...' : 'Change Password'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Forgot Password Dialog */}
      <Dialog open={forgotPasswordOpen} onClose={handleCloseForgotPassword} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ backgroundColor: '#1976d2', color: 'white', fontWeight: 'bold' }}>
          Reset Password
        </DialogTitle>
        <DialogContent sx={{ pt: 3 }}>
          <Tabs value={forgotPasswordTab} sx={{ mb: 2 }} variant="fullWidth">
            <Tab label="Enter Email" disabled={forgotPasswordTab > 0} />
            <Tab label="Enter OTP" disabled={forgotPasswordTab < 1 || forgotPasswordTab > 1} />
            <Tab label="New Password" disabled={forgotPasswordTab < 2} />
          </Tabs>

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

          {forgotPasswordTab === 0 && (
            <Box>
              <TextField
                margin="normal"
                required
                fullWidth
                label="Email Address"
                type="email"
                value={resetEmail}
                onChange={(e) => setResetEmail(e.target.value)}
                helperText="We'll send a 6-digit OTP code to your email"
              />
              <Button
                fullWidth
                variant="contained"
                onClick={handleRequestPasswordReset}
                disabled={forgotPasswordLoading || !resetEmail}
                sx={{ mt: 2, backgroundColor: '#1976d2' }}
              >
                {forgotPasswordLoading ? 'Sending...' : 'Send OTP Code'}
              </Button>
            </Box>
          )}

          {forgotPasswordTab === 1 && (
            <Box>
              <TextField
                margin="normal"
                required
                fullWidth
                label="6-Digit OTP Code"
                value={otpCode}
                onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                helperText="Enter the 6-digit code sent to your email"
                inputProps={{ maxLength: 6, pattern: '[0-9]*' }}
              />
              <Button
                fullWidth
                variant="outlined"
                onClick={() => {
                  setForgotPasswordTab(0);
                  setOtpCode('');
                }}
                sx={{ mt: 1 }}
              >
                Back
              </Button>
              <Button
                fullWidth
                variant="contained"
                onClick={handleVerifyOTP}
                disabled={forgotPasswordLoading || otpCode.length !== 6}
                sx={{ mt: 2, backgroundColor: '#1976d2' }}
              >
                {forgotPasswordLoading ? 'Verifying...' : 'Verify OTP'}
              </Button>
            </Box>
          )}

          {forgotPasswordTab === 2 && (
            <Box>
              <TextField
                margin="normal"
                required
                fullWidth
                label="New Password"
                type={showResetPassword ? 'text' : 'password'}
                value={resetNewPassword}
                onChange={(e) => setResetNewPassword(e.target.value)}
                helperText="Must be at least 6 characters long"
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        aria-label="toggle password visibility"
                        onClick={() => setShowResetPassword(!showResetPassword)}
                        edge="end"
                      >
                        {showResetPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />
              <TextField
                margin="normal"
                required
                fullWidth
                label="Confirm New Password"
                type={showResetConfirmPassword ? 'text' : 'password'}
                value={resetConfirmPassword}
                onChange={(e) => setResetConfirmPassword(e.target.value)}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        aria-label="toggle password visibility"
                        onClick={() => setShowResetConfirmPassword(!showResetConfirmPassword)}
                        edge="end"
                      >
                        {showResetConfirmPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />
              <Button
                fullWidth
                variant="outlined"
                onClick={() => {
                  setForgotPasswordTab(1);
                  setResetNewPassword('');
                  setResetConfirmPassword('');
                }}
                sx={{ mt: 1 }}
              >
                Back
              </Button>
              <Button
                fullWidth
                variant="contained"
                onClick={handleResetPassword}
                disabled={forgotPasswordLoading || !resetNewPassword || !resetConfirmPassword}
                sx={{ mt: 2, backgroundColor: '#1976d2' }}
              >
                {forgotPasswordLoading ? 'Resetting...' : 'Reset Password'}
              </Button>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseForgotPassword}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default LoginScreen;
