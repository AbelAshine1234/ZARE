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
import ClientsPage from './pages/users/ClientsPage';
import UserDetailPage from './pages/users/UserDetailPage';
import VendorsPage from './pages/users/VendorsPage';
import VendorOwnersPage from './pages/users/VendorOwnersPage';
import VendorDetailPage from './pages/users/VendorDetailPage';
import VendorImagesPage from './pages/users/VendorImagesPage';
import VendorNotesPage from './pages/users/VendorNotesPage';
import VendorPaymentMethodsPage from './pages/users/VendorPaymentMethodsPage';
import DriversPage from './pages/users/DriversPage';
import EmployeesPage from './pages/users/EmployeesPage';
import RecycleBinVendorsPage from './pages/users/RecycleBinVendorsPage';

// Product Management Pages
import ProductsPage from './pages/products/ProductsPage';
import CategoriesPage from './pages/products/CategoriesPage';
import SubcategoriesPage from './pages/products/SubcategoriesPage';
import SubcategoryDetailPage from './pages/products/SubcategoryDetailPage';
import CategoryDetailPage from './pages/products/CategoryDetailPage';

// Order Management Pages
import OrdersPage from './pages/orders/OrdersPage';
import DeliveriesPage from './pages/orders/DeliveriesPage';

// Financial Management Pages
import WalletsPage from './pages/finance/WalletsPage';
import WalletDetailPage from './pages/finance/WalletDetailPage';
import UserWalletDetailPage from './pages/finance/UserWalletDetailPage';
import TransactionsPage from './pages/finance/TransactionsPage';
import CashOutRequestsPage from './pages/finance/CashOutRequestsPage';
import RefundsPage from './pages/finance/RefundsPage';

// Communication Pages
import ComplaintsPage from './pages/communication/ComplaintsPage';
import NotificationsPage from './pages/communication/NotificationsPage';
import ChatPage from './pages/communication/ChatPage';

// Settings Pages
import SubscriptionsPage from './pages/settings/SubscriptionsPage';
import SubscriptionDetailPage from './pages/settings/SubscriptionDetailPage';
import PaymentMethodsPage from './pages/settings/PaymentMethodsPage';
import AnalyticsPage from './pages/analytics/AnalyticsPage';

// Context
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { Provider } from 'react-redux';
import store from './store';

const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#2e7d32', // green
      light: '#60ad5e',
      dark: '#005005'
    },
    secondary: {
      main: '#00796b', // teal
      light: '#48a999',
      dark: '#004c40'
    },
    success: { main: '#2e7d32' },
    warning: { main: '#f9a825' },
    error: { main: '#c62828' },
    info: { main: '#0288d1' },
    background: {
      default: '#f4f9f4',
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
        {/* Make AnalyticsPage the default landing page */}
        <Route index element={<AnalyticsPage />} />
        
        {/* User Management */}
        <Route path="users" element={<UsersPage />} />
        <Route path="clients" element={<ClientsPage />} />
        <Route path="users/:id/detail" element={<UserDetailPage />} />
        <Route path="vendors" element={<VendorsPage />} />
        <Route path="vendor-owners" element={<VendorOwnersPage />} />
        <Route path="vendors/:id" element={<VendorDetailPage />} />
        <Route path="vendors/:id/notes" element={<VendorNotesPage />} />
        <Route path="vendors/:id/payment-methods" element={<VendorPaymentMethodsPage />} />
        <Route path="vendors/:id/images" element={<VendorImagesPage />} />
        <Route path="recycle-bin" element={<RecycleBinVendorsPage />} />
        <Route path="drivers" element={<DriversPage />} />
        <Route path="employees" element={<EmployeesPage />} />
        
        {/* Product Management */}
        <Route path="products" element={<ProductsPage />} />
        <Route path="categories" element={<CategoriesPage />} />
        <Route path="categories/:id" element={<CategoryDetailPage />} />
        <Route path="subcategories" element={<SubcategoriesPage />} />
        <Route path="subcategories/:id" element={<SubcategoryDetailPage />} />
        
        {/* Order Management */}
        <Route path="orders" element={<OrdersPage />} />
        <Route path="deliveries" element={<DeliveriesPage />} />
        
        {/* Financial Management */}
        <Route path="wallets" element={<WalletsPage />} />
        <Route path="wallets/:id" element={<WalletDetailPage />} />
        <Route path="user-wallets/:id" element={<UserWalletDetailPage />} />
        <Route path="transactions" element={<TransactionsPage />} />
        <Route path="cashout-requests" element={<CashOutRequestsPage />} />
        <Route path="refunds" element={<RefundsPage />} />

        {/* Analytics */}
        <Route path="analytics-dashboard" element={<AnalyticsPage />} />
        
        {/* Communication */}
        <Route path="complaints" element={<ComplaintsPage />} />
        <Route path="notifications" element={<NotificationsPage />} />
        <Route path="chat" element={<ChatPage />} />
        
        {/* Settings */}
        <Route path="subscriptions" element={<SubscriptionsPage />} />
        <Route path="subscriptions/:id" element={<SubscriptionDetailPage />} />
        <Route path="payment-methods" element={<PaymentMethodsPage />} />
      </Route>
    </Routes>
  );
}

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Provider store={store}>
        <AuthProvider>
          <Router>
            <Box sx={{ display: 'flex' }}>
              <AppRoutes />
            </Box>
          </Router>
        </AuthProvider>
      </Provider>
    </ThemeProvider>
  );
}

export default App;

