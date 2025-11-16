import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Box } from '@mui/material';
import { useAuth } from './contexts/AuthContext';

// Components
import Header from './components/Header';
import ProtectedRoute from './components/ProtectedRoute';

// Screens
import LandingPage from './screens/LandingPage';
import LoginScreen from './screens/LoginScreen';
import RegisterScreen from './screens/RegisterScreen';
import HomeScreen from './screens/HomeScreen';
import AddItemScreen from './screens/AddItemScreen';
import ItemsListScreen from './screens/ItemsListScreen';
import InvoicePreviewScreen from './screens/InvoicePreviewScreen';
import OrderSignatureScreen from './screens/OrderSignatureScreen';
import BusinessSettingsScreen from './screens/BusinessSettingsScreen';
import InvoiceListScreen from './screens/InvoiceListScreen';
import QuotationListScreen from './screens/QuotationListScreen';
import CreateQuotationScreen from './screens/CreateQuotationScreen';
import CreateInvoiceScreenWeb from './screens/CreateInvoiceScreenWeb';
import FinancialAccountsScreen from './screens/FinancialAccountsScreen';
import GoodsReturnScreen from './screens/GoodsReturnScreen';
import DamageTrackingScreen from './screens/DamageTrackingScreen';
import AnalyticsScreen from './screens/AnalyticsScreen';

function App() {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
        Loading...
      </Box>
    );
  }

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#f8f9fa' }}>
      <Routes>
        {/* Public routes - Landing page without header */}
        <Route 
          path="/landing" 
          element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <LandingPage />} 
        />
        
        {/* Auth routes - without header */}
        <Route 
          path="/login" 
          element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <LoginScreen />} 
        />
        <Route 
          path="/register" 
          element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <RegisterScreen />} 
        />

        {/* Protected routes - with header */}
        <Route 
          path="/dashboard" 
          element={
            <Box>
              <Header />
              <ProtectedRoute>
                <HomeScreen />
              </ProtectedRoute>
            </Box>
          } 
        />
        
        {/* Redirect / to landing page for non-authenticated, or dashboard for authenticated */}
        <Route 
          path="/" 
          element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <Navigate to="/landing" replace />} 
        />
        <Route 
          path="/add-item" 
          element={
            <Box>
              <Header />
              <ProtectedRoute>
                <AddItemScreen />
              </ProtectedRoute>
            </Box>
          } 
        />
        <Route 
          path="/items-list" 
          element={
            <Box>
              <Header />
              <ProtectedRoute>
                <ItemsListScreen />
              </ProtectedRoute>
            </Box>
          } 
        />
        <Route 
          path="/invoices" 
          element={
            <Box>
              <Header />
              <ProtectedRoute>
                <InvoiceListScreen />
              </ProtectedRoute>
            </Box>
          } 
        />
        <Route 
          path="/invoices/:id" 
          element={
            <Box>
              <Header />
              <ProtectedRoute>
                <InvoicePreviewScreen />
              </ProtectedRoute>
            </Box>
          } 
        />
        <Route 
          path="/invoices/:invoiceId/edit" 
          element={
            <Box>
              <Header />
              <ProtectedRoute>
                <CreateInvoiceScreenWeb />
              </ProtectedRoute>
            </Box>
          } 
        />
        <Route 
          path="/quotations" 
          element={
            <Box>
              <Header />
              <ProtectedRoute>
                <QuotationListScreen />
              </ProtectedRoute>
            </Box>
          } 
        />
        <Route 
          path="/create-quotation" 
          element={
            <Box>
              <Header />
              <ProtectedRoute>
                <CreateQuotationScreen />
              </ProtectedRoute>
            </Box>
          } 
        />
        <Route 
          path="/create-invoice" 
          element={
            <Box>
              <Header />
              <ProtectedRoute>
                <CreateInvoiceScreenWeb />
              </ProtectedRoute>
            </Box>
          } 
        />
        <Route 
          path="/create-invoice/:quotationId" 
          element={
            <Box>
              <Header />
              <ProtectedRoute>
                <CreateInvoiceScreenWeb />
              </ProtectedRoute>
            </Box>
          } 
        />
        <Route 
          path="/invoice-preview" 
          element={
            <Box>
              <Header />
              <ProtectedRoute>
                <InvoicePreviewScreen />
              </ProtectedRoute>
            </Box>
          } 
        />
        <Route 
          path="/order-signatures" 
          element={
            <Box>
              <Header />
              <ProtectedRoute>
                <OrderSignatureScreen />
              </ProtectedRoute>
            </Box>
          } 
        />
        <Route 
          path="/business-settings" 
          element={
            <Box>
              <Header />
              <ProtectedRoute>
                <BusinessSettingsScreen />
              </ProtectedRoute>
            </Box>
          } 
        />
        <Route 
          path="/financial-accounts" 
          element={
            <Box>
              <Header />
              <ProtectedRoute>
                <FinancialAccountsScreen />
              </ProtectedRoute>
            </Box>
          } 
        />
        <Route 
          path="/goods-returns" 
          element={
            <Box>
              <Header />
              <ProtectedRoute>
                <GoodsReturnScreen />
              </ProtectedRoute>
            </Box>
          } 
        />
        <Route 
          path="/damage-tracking" 
          element={
            <Box>
              <Header />
              <ProtectedRoute>
                <DamageTrackingScreen />
              </ProtectedRoute>
            </Box>
          } 
        />
        <Route 
          path="/analytics" 
          element={
            <Box>
              <Header />
              <ProtectedRoute>
                <AnalyticsScreen />
              </ProtectedRoute>
            </Box>
          } 
        />

        {/* Redirect to home for any unknown routes */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Box>
  );
}

export default App;
