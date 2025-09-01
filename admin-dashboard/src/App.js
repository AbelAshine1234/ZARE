import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { Box } from '@mui/material';

// Layout Components
import AdminLayout from './components/layout/AdminLayout';
import LoginPage from './pages/auth/LoginPage';

// Dashboard Pages
import DashboardPage from './pages/dashboard/DashboardPage';

// User Management Pages
import UsersPage from './pages/users/UsersPage';
import VendorsPage from './pages/users/VendorsPage';
import DriversPage from './pages/users/DriversPage';
import EmployeesPage from './pages/users/EmployeesPage';

// Product Management Pages
import ProductsPage from './pages/products/ProductsPage';
import CategoriesPage from './pages/products/CategoriesPage';
import SubcategoriesPage from './pages/products/SubcategoriesPage';

// Order Management Pages
import OrdersPage from './pages/orders/OrdersPage';
import DeliveriesPage from './pages/orders/DeliveriesPage';

// Financial Management Pages
import WalletsPage from './pages/finance/WalletsPage';
import TransactionsPage from './pages/finance/TransactionsPage';
import CashOutRequestsPage from './pages/finance/CashOutRequestsPage';
import RefundsPage from './pages/finance/RefundsPage';

// Communication Pages
import ComplaintsPage from './pages/communication/ComplaintsPage';
import NotificationsPage from './pages/communication/NotificationsPage';
import ChatPage from './pages/communication/ChatPage';

// Settings Pages
import SubscriptionsPage from './pages/settings/SubscriptionsPage';
import PaymentMethodsPage from './pages/settings/PaymentMethodsPage';

// Context
import { AuthProvider, useAuth } from './contexts/AuthContext';

const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
    background: {
      default: '#f5f5f5',
    },
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
  },
});

// Protected Route Component
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? children : <Navigate to="/login" replace />;
};

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      
      <Route path="/" element={
        <ProtectedRoute>
          <AdminLayout />
        </ProtectedRoute>
      }>
        <Route index element={<DashboardPage />} />
        
        {/* User Management */}
        <Route path="users" element={<UsersPage />} />
        <Route path="vendors" element={<VendorsPage />} />
        <Route path="drivers" element={<DriversPage />} />
        <Route path="employees" element={<EmployeesPage />} />
        
        {/* Product Management */}
        <Route path="products" element={<ProductsPage />} />
        <Route path="categories" element={<CategoriesPage />} />
        <Route path="subcategories" element={<SubcategoriesPage />} />
        
        {/* Order Management */}
        <Route path="orders" element={<OrdersPage />} />
        <Route path="deliveries" element={<DeliveriesPage />} />
        
        {/* Financial Management */}
        <Route path="wallets" element={<WalletsPage />} />
        <Route path="transactions" element={<TransactionsPage />} />
        <Route path="cashout-requests" element={<CashOutRequestsPage />} />
        <Route path="refunds" element={<RefundsPage />} />
        
        {/* Communication */}
        <Route path="complaints" element={<ComplaintsPage />} />
        <Route path="notifications" element={<NotificationsPage />} />
        <Route path="chat" element={<ChatPage />} />
        
        {/* Settings */}
        <Route path="subscriptions" element={<SubscriptionsPage />} />
        <Route path="payment-methods" element={<PaymentMethodsPage />} />
      </Route>
    </Routes>
  );
}

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AuthProvider>
        <Router>
          <Box sx={{ display: 'flex' }}>
            <AppRoutes />
          </Box>
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App; 