import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { CircularProgress, Box, Alert } from '@mui/material';

interface AdminRouteProps {
  children: React.ReactNode;
}

const AdminRoute: React.FC<AdminRouteProps> = ({ children }) => {
  const { isAuthenticated, loading, user } = useAuth();

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
        <CircularProgress />
      </Box>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Check if user is Admin (admin, owner, or Admin)
  const isAdmin = user?.role === 'Admin' || user?.role === 'admin' || user?.role === 'owner';

  if (!isAdmin) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh" p={3}>
        <Alert severity="error" sx={{ maxWidth: 600 }}>
          Access denied. Admin privileges required.
        </Alert>
      </Box>
    );
  }

  return <>{children}</>;
};

export default AdminRoute;

