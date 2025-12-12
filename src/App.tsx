import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Box } from '@mui/material';
import { useAuth } from './contexts/AuthContext';

// Components
import Header from './components/Header';
import SalonHeader from './components/SalonHeader';
import SalonSidebar from './components/SalonSidebar';
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
import POSScreen from './screens/POSScreen';
import ServiceBillingScreen from './screens/ServiceBilling/ServiceBillingScreen';
import CustomersScreen from './screens/CustomersScreen';
import CustomerInvoicesScreen from './screens/CustomerInvoicesScreen';
import ItemCategoriesScreen from './screens/ItemCategoriesScreen';
import CustomerInvoicesListScreen from './screens/CustomerInvoicesListScreen';

// Salon Module
import { 
  SalonDashboard, 
  SalonPOS, 
  SalonEmployees, 
  SalonServices, 
  SalonProducts, 
  SalonShifts, 
  SalonPerformance, 
  SalonReports,
  PerformanceAnalyticsSalonScreen
} from './screens/Salon';

// Hospital Module
import {
  ReceptionistScreen,
  DoctorScreen,
  LabScreen,
  PharmacyScreen
  , HospitalScreen
} from './screens/Hospital';

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
          path="/quotations/:id" 
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
        <Route 
          path="/pos" 
          element={
            <Box>
              <Header />
              <ProtectedRoute>
                <POSScreen />
              </ProtectedRoute>
            </Box>
          } 
        />
        <Route 
          path="/service-billing" 
          element={
            <Box>
              <Header />
              <ProtectedRoute>
                <ServiceBillingScreen />
              </ProtectedRoute>
            </Box>
          } 
        />
        <Route 
          path="/customers" 
          element={
            <Box>
              <Header />
              <ProtectedRoute>
                <CustomersScreen />
              </ProtectedRoute>
            </Box>
          } 
        />
        <Route 
          path="/customers/:customerId/invoices" 
          element={
            <Box>
              <Header />
              <ProtectedRoute>
                <CustomerInvoicesScreen />
              </ProtectedRoute>
            </Box>
          } 
        />
        <Route 
          path="/item-categories" 
          element={
            <Box>
              <Header />
              <ProtectedRoute>
                <ItemCategoriesScreen />
              </ProtectedRoute>
            </Box>
          } 
        />
        <Route 
          path="/customer-invoices-list" 
          element={
            <Box>
              <Header />
              <ProtectedRoute>
                <CustomerInvoicesListScreen />
              </ProtectedRoute>
            </Box>
          } 
        />

        {/* Salon Module Routes */}
        <Route 
          path="/salon" 
          element={
            <Box>
              <SalonHeader />
              <Box sx={{ display: { xs: 'none', md: 'block' } }}>
                <SalonSidebar />
              </Box>
              <Box sx={{ 
                marginLeft: { xs: 0, md: '350px' }, 
                pt: 2, 
                width: { xs: '100%', md: 'calc(100% - 350px)' }, 
                minHeight: 'calc(100vh - 100px)' 
              }}>
              <ProtectedRoute>
                <SalonDashboard />
              </ProtectedRoute>
              </Box>
            </Box>
          } 
        />
        <Route 
          path="/salon/pos" 
          element={
            <Box>
              <SalonHeader />
              <Box sx={{ display: { xs: 'none', md: 'block' } }}>
                <SalonSidebar />
              </Box>
              <Box sx={{ 
                marginLeft: { xs: 0, md: '350px' }, 
                pt: 2, 
                width: { xs: '100%', md: 'calc(100% - 350px)' }, 
                minHeight: 'calc(100vh - 100px)' 
              }}>
              <ProtectedRoute>
                <SalonPOS />
              </ProtectedRoute>
              </Box>
            </Box>
          } 
        />
        <Route 
          path="/salon/employees" 
          element={
            <Box>
              <SalonHeader />
              <Box sx={{ display: { xs: 'none', md: 'block' } }}>
                <SalonSidebar />
              </Box>
              <Box sx={{ 
                marginLeft: { xs: 0, md: '350px' }, 
                pt: 2, 
                width: { xs: '100%', md: 'calc(100% - 350px)' }, 
                minHeight: 'calc(100vh - 100px)' 
              }}>
              <ProtectedRoute>
                <SalonEmployees />
              </ProtectedRoute>
              </Box>
            </Box>
          } 
        />
        <Route 
          path="/salon/services" 
          element={
            <Box>
              <SalonHeader />
              <Box sx={{ display: { xs: 'none', md: 'block' } }}>
                <SalonSidebar />
              </Box>
              <Box sx={{ 
                marginLeft: { xs: 0, md: '350px' }, 
                pt: 2, 
                width: { xs: '100%', md: 'calc(100% - 350px)' }, 
                minHeight: 'calc(100vh - 100px)' 
              }}>
              <ProtectedRoute>
                <SalonServices />
              </ProtectedRoute>
              </Box>
            </Box>
          } 
        />
        <Route 
          path="/salon/products" 
          element={
            <Box>
              <SalonHeader />
              <Box sx={{ display: { xs: 'none', md: 'block' } }}>
                <SalonSidebar />
              </Box>
              <Box sx={{ 
                marginLeft: { xs: 0, md: '350px' }, 
                pt: 2, 
                width: { xs: '100%', md: 'calc(100% - 350px)' }, 
                minHeight: 'calc(100vh - 100px)' 
              }}>
              <ProtectedRoute>
                <SalonProducts />
              </ProtectedRoute>
              </Box>
            </Box>
          } 
        />
        <Route 
          path="/salon/shifts" 
          element={
            <Box>
              <SalonHeader />
              <Box sx={{ display: { xs: 'none', md: 'block' } }}>
                <SalonSidebar />
              </Box>
              <Box sx={{ 
                marginLeft: { xs: 0, md: '350px' }, 
                pt: 2, 
                width: { xs: '100%', md: 'calc(100% - 350px)' }, 
                minHeight: 'calc(100vh - 100px)' 
              }}>
              <ProtectedRoute>
                <SalonShifts />
              </ProtectedRoute>
              </Box>
            </Box>
          } 
        />
        <Route 
          path="/salon/performance" 
          element={
            <Box>
              <SalonHeader />
              <Box sx={{ display: { xs: 'none', md: 'block' } }}>
                <SalonSidebar />
              </Box>
              <Box sx={{ 
                marginLeft: { xs: 0, md: '350px' }, 
                pt: 2, 
                width: { xs: '100%', md: 'calc(100% - 350px)' }, 
                minHeight: 'calc(100vh - 100px)' 
              }}>
              <ProtectedRoute>
                <SalonPerformance />
              </ProtectedRoute>
              </Box>
            </Box>
          } 
        />
        <Route 
          path="/salon/analytics" 
          element={
            <Box>
              <SalonHeader />
              <Box sx={{ display: { xs: 'none', md: 'block' } }}>
                <SalonSidebar />
              </Box>
              <Box sx={{ 
                marginLeft: { xs: 0, md: '350px' }, 
                pt: 2, 
                width: { xs: '100%', md: 'calc(100% - 350px)' }, 
                minHeight: 'calc(100vh - 100px)' 
              }}>
                <ProtectedRoute>
                  <PerformanceAnalyticsSalonScreen />
                </ProtectedRoute>
              </Box>
            </Box>
          } 
        />
        <Route 
          path="/salon/reports" 
          element={
            <Box>
              <SalonHeader />
              <Box sx={{ display: { xs: 'none', md: 'block' } }}>
                <SalonSidebar />
              </Box>
              <Box sx={{ 
                marginLeft: { xs: 0, md: '350px' }, 
                pt: 2, 
                width: { xs: '100%', md: 'calc(100% - 350px)' }, 
                minHeight: 'calc(100vh - 100px)' 
              }}>
              <ProtectedRoute>
                <SalonReports />
              </ProtectedRoute>
              </Box>
            </Box>
          } 
        />

        {/* Hospital Module Routes */}
        <Route 
          path="/hospital" 
          element={
            <Box>
              <Header />
              <ProtectedRoute>
                <HospitalScreen />
              </ProtectedRoute>
            </Box>
          } 
        />
        <Route 
          path="/hospital/receptionist" 
          element={
            <Box>
              <Header />
              <ProtectedRoute>
                <ReceptionistScreen />
              </ProtectedRoute>
            </Box>
          } 
        />
        <Route 
          path="/hospital/doctor" 
          element={
            <Box>
              <Header />
              <ProtectedRoute>
                <DoctorScreen />
              </ProtectedRoute>
            </Box>
          } 
        />
        <Route 
          path="/hospital/lab" 
          element={
            <Box>
              <Header />
              <ProtectedRoute>
                <LabScreen />
              </ProtectedRoute>
            </Box>
          } 
        />
        <Route 
          path="/hospital/pharmacy" 
          element={
            <Box>
              <Header />
              <ProtectedRoute>
                <PharmacyScreen />
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
