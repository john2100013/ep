import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { CircularProgress, Box, Alert } from '@mui/material';

interface AdminRouteProps {
  children: React.ReactNode;
  requiredPermission?: string; // e.g., 'can_access_analytics', 'can_access_business_settings'
}

const AdminRoute: React.FC<AdminRouteProps> = ({ children, requiredPermission }) => {
  const { isAuthenticated, loading, user } = useAuth();
  const location = useLocation();

  console.log('🔒 [AdminRoute] Checking access:', {
    path: location.pathname,
    isAuthenticated,
    loading,
    userId: user?.id,
    userRole: user?.role,
    requiredPermission,
    userPermissions: user ? {
      can_access_analytics: user.can_access_analytics,
      can_access_business_settings: user.can_access_business_settings,
      can_access_financial_accounts: user.can_access_financial_accounts,
      can_access_invoices: user.can_access_invoices
    } : null
  });

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
        <CircularProgress />
      </Box>
    );
  }

  if (!isAuthenticated) {
    console.log('🔒 [AdminRoute] Not authenticated, redirecting to login');
    return <Navigate to="/login" replace />;
  }

  // Check if user is Admin (admin, owner, or Admin) - admins have all permissions
  const isAdmin = user?.role === 'Admin' || user?.role === 'admin' || user?.role === 'owner';

  // If a specific permission is required, check it
  if (requiredPermission && !isAdmin) {
    const hasPermission = (user as any)?.[requiredPermission] === true;
    console.log('🔒 [AdminRoute] Permission check:', {
      requiredPermission,
      hasPermission,
      userValue: (user as any)?.[requiredPermission]
    });

    if (!hasPermission) {
      console.log('🔒 [AdminRoute] Access denied - missing permission:', requiredPermission);
      return (
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh" p={3}>
          <Alert severity="error" sx={{ maxWidth: 600 }}>
            Access denied. You do not have permission to access this page.
          </Alert>
        </Box>
      );
    }
  } else if (!isAdmin) {
    // For routes without specific permission, still require admin role
    console.log('🔒 [AdminRoute] Access denied - not admin');
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh" p={3}>
        <Alert severity="error" sx={{ maxWidth: 600 }}>
          Access denied. Admin privileges required.
        </Alert>
      </Box>
    );
  }

  console.log('🔒 [AdminRoute] Access granted');
  return <>{children}</>;
};

export default AdminRoute;

