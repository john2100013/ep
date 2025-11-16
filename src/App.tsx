import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Box } from '@mui/material';
import { useAuth } from './contexts/AuthContext';

// Components
import Header from './components/Header';
import ProtectedRoute from './components/ProtectedRoute';

// Screens
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
      <Header />
      <Routes>
        {/* Public routes */}
        <Route 
          path="/login" 
          element={isAuthenticated ? <Navigate to="/" replace /> : <LoginScreen />} 
        />
        <Route 
          path="/register" 
          element={isAuthenticated ? <Navigate to="/" replace /> : <RegisterScreen />} 
        />

        {/* Protected routes */}
        <Route 
          path="/" 
          element={
            <ProtectedRoute>
              <HomeScreen />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/add-item" 
          element={
            <ProtectedRoute>
              <AddItemScreen />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/items-list" 
          element={
            <ProtectedRoute>
              <ItemsListScreen />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/invoices" 
          element={
            <ProtectedRoute>
              <InvoiceListScreen />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/invoices/:id" 
          element={
            <ProtectedRoute>
              <InvoicePreviewScreen />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/invoices/:invoiceId/edit" 
          element={
            <ProtectedRoute>
              <CreateInvoiceScreenWeb />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/quotations" 
          element={
            <ProtectedRoute>
              <QuotationListScreen />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/create-quotation" 
          element={
            <ProtectedRoute>
              <CreateQuotationScreen />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/create-invoice" 
          element={
            <ProtectedRoute>
              <CreateInvoiceScreenWeb />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/create-invoice/:quotationId" 
          element={
            <ProtectedRoute>
              <CreateInvoiceScreenWeb />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/invoice-preview" 
          element={
            <ProtectedRoute>
              <InvoicePreviewScreen />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/order-signatures" 
          element={
            <ProtectedRoute>
              <OrderSignatureScreen />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/business-settings" 
          element={
            <ProtectedRoute>
              <BusinessSettingsScreen />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/financial-accounts" 
          element={
            <ProtectedRoute>
              <FinancialAccountsScreen />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/goods-returns" 
          element={
            <ProtectedRoute>
              <GoodsReturnScreen />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/damage-tracking" 
          element={
            <ProtectedRoute>
              <DamageTrackingScreen />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/analytics" 
          element={
            <ProtectedRoute>
              <AnalyticsScreen />
            </ProtectedRoute>
          } 
        />

        {/* Redirect to home for any unknown routes */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Box>
  );
}

export default App;
