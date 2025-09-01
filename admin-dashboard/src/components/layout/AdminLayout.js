import React, { useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import {
  Box,
  Drawer,
  AppBar,
  Toolbar,
  List,
  Typography,
  Divider,
  IconButton,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Avatar,
  Menu,
  MenuItem,
  Badge,
  Chip
} from '@mui/material';
import {
  Menu as MenuIcon,
  Dashboard,
  People,
  Store,
  LocalShipping,
  ShoppingCart,
  Category,
  AccountBalance,
  Receipt,
  Report,
  Settings,
  Notifications,
  AccountCircle,
  Logout,
  ChevronLeft,
  ChevronRight
} from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';

const drawerWidth = 280;

const menuItems = [
  {
    text: 'Dashboard',
    icon: <Dashboard />,
    path: '/',
    color: '#1976d2'
  },
  {
    text: 'User Management',
    icon: <People />,
    path: '/users',
    color: '#388e3c',
    subItems: [
      { text: 'All Users', path: '/users' },
      { text: 'Vendors', path: '/vendors' },
      { text: 'Drivers', path: '/drivers' },
      { text: 'Employees', path: '/employees' }
    ]
  },
  {
    text: 'Products',
    icon: <Store />,
    path: '/products',
    color: '#f57c00',
    subItems: [
      { text: 'All Products', path: '/products' },
      { text: 'Categories', path: '/categories' },
      { text: 'Subcategories', path: '/subcategories' }
    ]
  },
  {
    text: 'Orders & Delivery',
    icon: <LocalShipping />,
    path: '/orders',
    color: '#7b1fa2',
    subItems: [
      { text: 'All Orders', path: '/orders' },
      { text: 'Deliveries', path: '/deliveries' }
    ]
  },
  {
    text: 'Financial',
    icon: <AccountBalance />,
    path: '/wallets',
    color: '#d32f2f',
    subItems: [
      { text: 'Wallets', path: '/wallets' },
      { text: 'Transactions', path: '/transactions' },
      { text: 'Cash-out Requests', path: '/cashout-requests' },
      { text: 'Refunds', path: '/refunds' }
    ]
  },
  {
    text: 'Communication',
    icon: <Notifications />,
    path: '/complaints',
    color: '#c2185b',
    subItems: [
      { text: 'Complaints', path: '/complaints' },
      { text: 'Notifications', path: '/notifications' },
      { text: 'Chat', path: '/chat' }
    ]
  },
  {
    text: 'Settings',
    icon: <Settings />,
    path: '/subscriptions',
    color: '#455a64',
    subItems: [
      { text: 'Subscriptions', path: '/subscriptions' },
      { text: 'Payment Methods', path: '/payment-methods' }
    ]
  }
];

const AdminLayout = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [open, setOpen] = useState(true);
  const [anchorEl, setAnchorEl] = useState(null);
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleProfileMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleProfileMenuClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
    handleProfileMenuClose();
  };

  const handleNavigation = (path) => {
    navigate(path);
    setMobileOpen(false);
  };

  const isActive = (path) => {
    return location.pathname === path;
  };

  const drawer = (
    <Box>
      <Box sx={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center', 
        p: 2,
        borderBottom: '1px solid #e0e0e0'
      }}>
        <Typography variant="h6" sx={{ fontWeight: 'bold', color: '#1976d2' }}>
          ZareShop Admin
        </Typography>
      </Box>
      
      <List sx={{ pt: 1 }}>
        {menuItems.map((item) => (
          <Box key={item.text}>
            <ListItem disablePadding>
              <ListItemButton
                onClick={() => handleNavigation(item.path)}
                sx={{
                  backgroundColor: isActive(item.path) ? 'rgba(25, 118, 210, 0.08)' : 'transparent',
                  borderLeft: isActive(item.path) ? '4px solid #1976d2' : 'none',
                  '&:hover': {
                    backgroundColor: 'rgba(25, 118, 210, 0.04)',
                  }
                }}
              >
                <ListItemIcon sx={{ color: isActive(item.path) ? '#1976d2' : item.color }}>
                  {item.icon}
                </ListItemIcon>
                <ListItemText 
                  primary={item.text}
                  sx={{
                    '& .MuiTypography-root': {
                      fontWeight: isActive(item.path) ? 600 : 400,
                      color: isActive(item.path) ? '#1976d2' : 'inherit'
                    }
                  }}
                />
              </ListItemButton>
            </ListItem>
            
            {item.subItems && isActive(item.path) && (
              <List component="div" disablePadding>
                {item.subItems.map((subItem) => (
                  <ListItem key={subItem.text} disablePadding>
                    <ListItemButton
                      sx={{ pl: 4 }}
                      onClick={() => handleNavigation(subItem.path)}
                    >
                      <ListItemText 
                        primary={subItem.text}
                        sx={{
                          '& .MuiTypography-root': {
                            fontSize: '0.875rem'
                          }
                        }}
                      />
                    </ListItemButton>
                  </ListItem>
                ))}
              </List>
            )}
          </Box>
        ))}
      </List>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex' }}>
      <AppBar
        position="fixed"
        sx={{
          width: { sm: `calc(100% - ${drawerWidth}px)` },
          ml: { sm: `${drawerWidth}px` },
          backgroundColor: 'white',
          color: '#333',
          boxShadow: '0 1px 3px rgba(0,0,0,0.12)'
        }}
      >
        <Toolbar>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ mr: 2, display: { sm: 'none' } }}
          >
            <MenuIcon />
          </IconButton>
          
          <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1 }}>
            {menuItems.find(item => item.path === location.pathname)?.text || 'Dashboard'}
          </Typography>
          
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <IconButton color="inherit">
              <Badge badgeContent={4} color="error">
                <Notifications />
              </Badge>
            </IconButton>
            
            <Chip
              label={`${user?.name || 'Admin'}`}
              avatar={<Avatar sx={{ width: 24, height: 24 }}>{user?.name?.[0] || 'A'}</Avatar>}
              onClick={handleProfileMenuOpen}
              sx={{ cursor: 'pointer' }}
            />
            
            <Menu
              anchorEl={anchorEl}
              open={Boolean(anchorEl)}
              onClose={handleProfileMenuClose}
            >
              <MenuItem onClick={handleProfileMenuClose}>
                <AccountCircle sx={{ mr: 1 }} />
                Profile
              </MenuItem>
              <MenuItem onClick={handleLogout}>
                <Logout sx={{ mr: 1 }} />
                Logout
              </MenuItem>
            </Menu>
          </Box>
        </Toolbar>
      </AppBar>
      
      <Box
        component="nav"
        sx={{ width: { sm: drawerWidth }, flexShrink: { sm: 0 } }}
      >
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{
            keepMounted: true,
          }}
          sx={{
            display: { xs: 'block', sm: 'none' },
            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
          }}
        >
          {drawer}
        </Drawer>
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: 'none', sm: 'block' },
            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
          }}
          open
        >
          {drawer}
        </Drawer>
      </Box>
      
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          width: { sm: `calc(100% - ${drawerWidth}px)` },
          mt: '64px'
        }}
      >
        <Outlet />
      </Box>
    </Box>
  );
};

export default AdminLayout; 