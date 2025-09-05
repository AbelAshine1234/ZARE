import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  IconButton,
  Tooltip,
  CircularProgress
} from '@mui/material';
import {
  People,
  Store,
  LocalShipping,
  AccountBalance,
  TrendingUp,
  TrendingDown,
  Visibility,
  Edit,
  Delete
} from '@mui/icons-material';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';
import axios from 'axios';

const DashboardPage = () => {
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalVendors: 0,
    totalProducts: 0,
    totalOrders: 0,
    totalRevenue: 0,
    pendingDeliveries: 0,
    activeDrivers: 0,
    pendingCashouts: 0
  });
  const [recentOrders, setRecentOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      // Fetch dashboard statistics
      const statsResponse = await axios.get('/api/admin/dashboard/stats');
      setStats(statsResponse.data);

      // Fetch recent orders
      const ordersResponse = await axios.get('/api/admin/dashboard/recent-orders');
      setRecentOrders(ordersResponse.data);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      // Set mock data for demonstration
      setStats({
        totalUsers: 1247,
        totalVendors: 89,
        totalProducts: 2156,
        totalOrders: 3421,
        totalRevenue: 1250000,
        pendingDeliveries: 23,
        activeDrivers: 45,
        pendingCashouts: 12
      });
      setRecentOrders([
        { id: 1, customer: 'John Doe', vendor: 'Tech Store', amount: 250, status: 'processing' },
        { id: 2, customer: 'Jane Smith', vendor: 'Fashion Hub', amount: 180, status: 'delivered' },
        { id: 3, customer: 'Mike Johnson', vendor: 'Home Goods', amount: 320, status: 'pending' },
        { id: 4, customer: 'Sarah Wilson', vendor: 'Electronics Plus', amount: 450, status: 'processing' },
        { id: 5, customer: 'David Brown', vendor: 'Sports World', amount: 120, status: 'delivered' }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const StatCard = ({ title, value, icon, color, trend, trendValue }) => (
    <Card sx={{ height: '100%' }}>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box>
            <Typography color="textSecondary" gutterBottom variant="body2">
              {title}
            </Typography>
            <Typography variant="h4" component="div" sx={{ fontWeight: 'bold' }}>
              {title.includes('Revenue') ? `$${(value / 1000).toFixed(1)}K` : value.toLocaleString()}
            </Typography>
            {trend && (
              <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                {trend === 'up' ? (
                  <TrendingUp sx={{ color: 'success.main', fontSize: 16, mr: 0.5 }} />
                ) : (
                  <TrendingDown sx={{ color: 'error.main', fontSize: 16, mr: 0.5 }} />
                )}
                <Typography
                  variant="body2"
                  color={trend === 'up' ? 'success.main' : 'error.main'}
                >
                  {trendValue}%
                </Typography>
              </Box>
            )}
          </Box>
          <Box
            sx={{
              backgroundColor: `${color}20`,
              borderRadius: '50%',
              p: 1.5,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            {icon}
          </Box>
        </Box>
      </CardContent>
    </Card>
  );

  const getStatusColor = (status) => {
    switch (status) {
      case 'delivered':
        return 'success';
      case 'processing':
        return 'warning';
      case 'pending':
        return 'info';
      default:
        return 'default';
    }
  };

  const chartData = [
    { name: 'Jan', users: 400, orders: 240, revenue: 2400 },
    { name: 'Feb', users: 300, orders: 139, revenue: 2210 },
    { name: 'Mar', users: 200, orders: 980, revenue: 2290 },
    { name: 'Apr', users: 278, orders: 390, revenue: 2000 },
    { name: 'May', users: 189, orders: 480, revenue: 2181 },
    { name: 'Jun', users: 239, orders: 380, revenue: 2500 },
    { name: 'Jul', users: 349, orders: 430, revenue: 2100 },
  ];

  const pieData = [
    { name: 'Clients', value: 65, color: '#8884d8' },
    { name: 'Vendors', value: 20, color: '#82ca9d' },
    { name: 'Drivers', value: 10, color: '#ffc658' },
    { name: 'Employees', value: 5, color: '#ff7300' },
  ];

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '400px' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h4" sx={{ mb: 3, fontWeight: 'bold' }}>
        Dashboard Overview
      </Typography>

      {/* Statistics Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Total Users"
            value={stats.totalUsers}
            icon={<People sx={{ color: '#1976d2' }} />}
            color="#1976d2"
            trend="up"
            trendValue={12}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Total Vendors"
            value={stats.totalVendors}
            icon={<Store sx={{ color: '#388e3c' }} />}
            color="#388e3c"
            trend="up"
            trendValue={8}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Total Products"
            value={stats.totalProducts}
            icon={<Store sx={{ color: '#f57c00' }} />}
            color="#f57c00"
            trend="up"
            trendValue={15}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Total Revenue"
            value={stats.totalRevenue}
            icon={<AccountBalance sx={{ color: '#d32f2f' }} />}
            color="#d32f2f"
            trend="up"
            trendValue={23}
          />
        </Grid>
      </Grid>

      {/* Charts Row */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 3, height: '400px' }}>
            <Typography variant="h6" sx={{ mb: 2 }}>
              Growth Trends
            </Typography>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <RechartsTooltip />
                <Line type="monotone" dataKey="users" stroke="#1976d2" strokeWidth={2} />
                <Line type="monotone" dataKey="orders" stroke="#388e3c" strokeWidth={2} />
                <Line type="monotone" dataKey="revenue" stroke="#d32f2f" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3, height: '400px' }}>
            <Typography variant="h6" sx={{ mb: 2 }}>
              User Distribution
            </Typography>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <RechartsTooltip />
              </PieChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>
      </Grid>

      {/* Additional Stats */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Pending Deliveries"
            value={stats.pendingDeliveries}
            icon={<LocalShipping sx={{ color: '#7b1fa2' }} />}
            color="#7b1fa2"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Active Drivers"
            value={stats.activeDrivers}
            icon={<LocalShipping sx={{ color: '#388e3c' }} />}
            color="#388e3c"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Pending Cashouts"
            value={stats.pendingCashouts}
            icon={<AccountBalance sx={{ color: '#f57c00' }} />}
            color="#f57c00"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Total Orders"
            value={stats.totalOrders}
            icon={<Store sx={{ color: '#d32f2f' }} />}
            color="#d32f2f"
            trend="up"
            trendValue={18}
          />
        </Grid>
      </Grid>

      {/* Recent Orders Table */}
      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" sx={{ mb: 2 }}>
          Recent Orders
        </Typography>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Order ID</TableCell>
                <TableCell>Customer</TableCell>
                <TableCell>Vendor</TableCell>
                <TableCell>Amount</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {recentOrders.map((order) => (
                <TableRow key={order.id}>
                  <TableCell>#{order.id}</TableCell>
                  <TableCell>{order.customer}</TableCell>
                  <TableCell>{order.vendor}</TableCell>
                  <TableCell>${order.amount}</TableCell>
                  <TableCell>
                    <Chip
                      label={order.status}
                      color={getStatusColor(order.status)}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    <Tooltip title="View Details">
                      <IconButton size="small" color="primary">
                        <Visibility />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Edit Order">
                      <IconButton size="small" color="warning">
                        <Edit />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
    </Box>
  );
};

export default DashboardPage;

