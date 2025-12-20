import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { CircularProgress, Box, Alert } from '@mui/material';

interface PermissionRouteProps {
  children: React.ReactNode;
  requiredPermission: string; // e.g., 'can_access_invoices', 'can_access_quotations'
}

const PermissionRoute: React.FC<PermissionRouteProps> = ({ children, requiredPermission }) => {
  const { isAuthenticated, loading, user } = useAuth();
  const location = useLocation();

  console.log('🔒 [PermissionRoute] Checking access:', {
    path: location.pathname,
    isAuthenticated,
    loading,
    userId: user?.id,
    userRole: user?.role,
    requiredPermission,
    userPermissionValue: user ? (user as any)[requiredPermission] : null
  });

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
        <CircularProgress />
      </Box>
    );
  }

  if (!isAuthenticated) {
    console.log('🔒 [PermissionRoute] Not authenticated, redirecting to login');
    return <Navigate to="/login" replace />;
  }

  // Admin/owner roles have all permissions
  const isAdmin = user?.role === 'Admin' || user?.role === 'admin' || user?.role === 'owner';

  if (isAdmin) {
    console.log('🔒 [PermissionRoute] Access granted - user is admin');
    return <>{children}</>;
  }

  // Check specific permission
  const hasPermission = (user as any)?.[requiredPermission] === true;

  console.log('🔒 [PermissionRoute] Permission check result:', {
    requiredPermission,
    hasPermission,
    userPermissionValue: (user as any)?.[requiredPermission]
  });

  if (!hasPermission) {
    console.log('🔒 [PermissionRoute] Access denied - missing permission:', requiredPermission);
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh" p={3}>
        <Alert severity="error" sx={{ maxWidth: 600 }}>
          Access denied. You do not have permission to access this page.
        </Alert>
      </Box>
    );
  }

  console.log('🔒 [PermissionRoute] Access granted');
  return <>{children}</>;
};

export default PermissionRoute;

