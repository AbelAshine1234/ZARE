import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  Chip,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  Snackbar,
  CircularProgress,
  Grid,
  Card,
  CardContent,
  Badge,
  Stepper,
  Step,
  StepLabel,
  StepContent
} from '@mui/material';
import {
  Search,
  Visibility,
  Edit,
  LocalShipping,
  CheckCircle,
  Cancel,
  Refresh,
  FilterList,
  Assignment
} from '@mui/icons-material';
import { DataGrid } from '@mui/x-data-grid';
import axios from 'axios';

const OrdersPage = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterVendor, setFilterVendor] = useState('all');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [orderDetailsOpen, setOrderDetailsOpen] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const response = await axios.get('/api/orders');
      setOrders(response.data);
    } catch (error) {
      console.error('Error fetching orders:', error);
      // Mock data for demonstration
      setOrders([
        {
          id: 1,
          order_number: 'ORD-001',
          customer: 'John Doe',
          customer_email: 'john@example.com',
          customer_phone: '+1234567890',
          vendor: 'Tech Store',
          total_amount: 299.99,
          status: 'processing',
          payment_status: 'paid',
          delivery_address: '123 Main St, City, State 12345',
          items: [
            { name: 'iPhone 15 Pro', quantity: 1, price: 299.99 }
          ],
          created_at: '2024-01-15T10:30:00Z',
          updated_at: '2024-01-15T14:20:00Z'
        },
        {
          id: 2,
          order_number: 'ORD-002',
          customer: 'Jane Smith',
          customer_email: 'jane@example.com',
          customer_phone: '+1234567891',
          vendor: 'Fashion Hub',
          total_amount: 89.99,
          status: 'delivered',
          payment_status: 'paid',
          delivery_address: '456 Oak Ave, City, State 12345',
          items: [
            { name: 'Nike Air Max', quantity: 1, price: 89.99 }
          ],
          created_at: '2024-01-14T09:15:00Z',
          updated_at: '2024-01-16T11:30:00Z'
        },
        {
          id: 3,
          order_number: 'ORD-003',
          customer: 'Mike Johnson',
          customer_email: 'mike@example.com',
          customer_phone: '+1234567892',
          vendor: 'Home Goods',
          total_amount: 159.98,
          status: 'pending',
          payment_status: 'pending',
          delivery_address: '789 Pine Rd, City, State 12345',
          items: [
            { name: 'Coffee Maker', quantity: 1, price: 89.99 },
            { name: 'Blender', quantity: 1, price: 69.99 }
          ],
          created_at: '2024-01-16T16:45:00Z',
          updated_at: '2024-01-16T16:45:00Z'
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleViewOrder = (order) => {
    setSelectedOrder(order);
    setOrderDetailsOpen(true);
  };

  const handleStatusUpdate = async (orderId, newStatus) => {
    try {
      await axios.patch(`/api/orders/${orderId}/status`, { status: newStatus });
      setSnackbar({ open: true, message: 'Order status updated successfully', severity: 'success' });
      fetchOrders();
    } catch (error) {
      setSnackbar({ open: true, message: 'Error updating order status', severity: 'error' });
    }
  };

  const handleAssignDriver = async (orderId, driverId) => {
    try {
      await axios.post(`/api/orders/${orderId}/assign-driver`, { driver_id: driverId });
      setSnackbar({ open: true, message: 'Driver assigned successfully', severity: 'success' });
      fetchOrders();
    } catch (error) {
      setSnackbar({ open: true, message: 'Error assigning driver', severity: 'error' });
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending':
        return 'warning';
      case 'processing':
        return 'info';
      case 'shipped':
        return 'primary';
      case 'delivered':
        return 'success';
      case 'cancelled':
        return 'error';
      default:
        return 'default';
    }
  };

  const getPaymentStatusColor = (status) => {
    switch (status) {
      case 'paid':
        return 'success';
      case 'pending':
        return 'warning';
      case 'failed':
        return 'error';
      default:
        return 'default';
    }
  };

  const getOrderSteps = (status) => {
    const steps = [
      { label: 'Order Placed', completed: true },
      { label: 'Processing', completed: ['processing', 'shipped', 'delivered'].includes(status) },
      { label: 'Shipped', completed: ['shipped', 'delivered'].includes(status) },
      { label: 'Delivered', completed: status === 'delivered' }
    ];
    return steps;
  };

  const columns = [
    {
      field: 'order_number',
      headerName: 'Order #',
      width: 120,
      renderCell: (params) => (
        <Typography variant="body2" fontWeight="bold">
          {params.value}
        </Typography>
      ),
    },
    {
      field: 'customer',
      headerName: 'Customer',
      width: 150,
      renderCell: (params) => (
        <Box>
          <Typography variant="body2" fontWeight="medium">
            {params.value}
          </Typography>
          <Typography variant="caption" color="textSecondary">
            {params.row.customer_email}
          </Typography>
        </Box>
      ),
    },
    {
      field: 'vendor',
      headerName: 'Vendor',
      width: 120,
      renderCell: (params) => (
        <Chip
          label={params.value}
          color="primary"
          size="small"
        />
      ),
    },
    {
      field: 'total_amount',
      headerName: 'Total',
      width: 100,
      renderCell: (params) => (
        <Typography variant="body2" fontWeight="bold">
          ${params.value}
        </Typography>
      ),
    },
    {
      field: 'status',
      headerName: 'Status',
      width: 120,
      renderCell: (params) => (
        <Chip
          label={params.value}
          color={getStatusColor(params.value)}
          size="small"
        />
      ),
    },
    {
      field: 'payment_status',
      headerName: 'Payment',
      width: 100,
      renderCell: (params) => (
        <Chip
          label={params.value}
          color={getPaymentStatusColor(params.value)}
          size="small"
        />
      ),
    },
    {
      field: 'items',
      headerName: 'Items',
      width: 100,
      renderCell: (params) => (
        <Badge badgeContent={params.value.length} color="primary">
          <Typography variant="body2">
            {params.value.length} item{params.value.length !== 1 ? 's' : ''}
          </Typography>
        </Badge>
      ),
    },
    {
      field: 'created_at',
      headerName: 'Created',
      width: 130,
      renderCell: (params) => (
        <Typography variant="body2">
          {new Date(params.value).toLocaleDateString()}
        </Typography>
      ),
    },
    {
      field: 'actions',
      headerName: 'Actions',
      width: 200,
      renderCell: (params) => (
        <Box>
          <Tooltip title="View Details">
            <IconButton 
              size="small" 
              color="primary"
              onClick={() => handleViewOrder(params.row)}
            >
              <Visibility />
            </IconButton>
          </Tooltip>
          <Tooltip title="Update Status">
            <IconButton 
              size="small" 
              color="warning"
              onClick={() => handleStatusUpdate(params.row.id, 'processing')}
            >
              <Edit />
            </IconButton>
          </Tooltip>
          <Tooltip title="Assign Driver">
            <IconButton 
              size="small" 
              color="info"
              onClick={() => handleAssignDriver(params.row.id, 1)}
            >
              <Assignment />
            </IconButton>
          </Tooltip>
          {params.row.status === 'processing' && (
            <Tooltip title="Mark as Shipped">
              <IconButton 
                size="small" 
                color="primary"
                onClick={() => handleStatusUpdate(params.row.id, 'shipped')}
              >
                <LocalShipping />
              </IconButton>
            </Tooltip>
          )}
          {params.row.status === 'shipped' && (
            <Tooltip title="Mark as Delivered">
              <IconButton 
                size="small" 
                color="success"
                onClick={() => handleStatusUpdate(params.row.id, 'delivered')}
              >
                <CheckCircle />
              </IconButton>
            </Tooltip>
          )}
        </Box>
      ),
    },
  ];

  const filteredOrders = orders.filter(order => {
    const matchesSearch = order.order_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         order.customer?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         order.customer_email?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = filterStatus === 'all' || order.status === filterStatus;
    const matchesVendor = filterVendor === 'all' || order.vendor === filterVendor;
    
    return matchesSearch && matchesStatus && matchesVendor;
  });

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '400px' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" fontWeight="bold">
          Order Management
        </Typography>
        <Button
          variant="outlined"
          startIcon={<Refresh />}
          onClick={fetchOrders}
        >
          Refresh Orders
        </Button>
      </Box>

      {/* Filters */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={4}>
            <TextField
              placeholder="Search orders..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: <Search sx={{ mr: 1, color: 'text.secondary' }} />,
              }}
              fullWidth
            />
          </Grid>
          
          <Grid item xs={12} md={3}>
            <FormControl fullWidth>
              <InputLabel>Status</InputLabel>
              <Select
                value={filterStatus}
                label="Status"
                onChange={(e) => setFilterStatus(e.target.value)}
              >
                <MenuItem value="all">All Status</MenuItem>
                <MenuItem value="pending">Pending</MenuItem>
                <MenuItem value="processing">Processing</MenuItem>
                <MenuItem value="shipped">Shipped</MenuItem>
                <MenuItem value="delivered">Delivered</MenuItem>
                <MenuItem value="cancelled">Cancelled</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          
          <Grid item xs={12} md={3}>
            <FormControl fullWidth>
              <InputLabel>Vendor</InputLabel>
              <Select
                value={filterVendor}
                label="Vendor"
                onChange={(e) => setFilterVendor(e.target.value)}
              >
                <MenuItem value="all">All Vendors</MenuItem>
                <MenuItem value="Tech Store">Tech Store</MenuItem>
                <MenuItem value="Fashion Hub">Fashion Hub</MenuItem>
                <MenuItem value="Home Goods">Home Goods</MenuItem>
              </Select>
            </FormControl>
          </Grid>
        </Grid>
      </Paper>

      {/* Orders Data Grid */}
      <Paper sx={{ height: 600 }}>
        <DataGrid
          rows={filteredOrders}
          columns={columns}
          pageSize={10}
          rowsPerPageOptions={[10, 25, 50]}
          checkboxSelection
          disableSelectionOnClick
          sx={{
            '& .MuiDataGrid-cell:focus': {
              outline: 'none',
            },
          }}
        />
      </Paper>

      {/* Order Details Dialog */}
      <Dialog 
        open={orderDetailsOpen} 
        onClose={() => setOrderDetailsOpen(false)} 
        maxWidth="md" 
        fullWidth
      >
        <DialogTitle>
          Order Details - {selectedOrder?.order_number}
        </DialogTitle>
        <DialogContent>
          {selectedOrder && (
            <Grid container spacing={3} sx={{ pt: 1 }}>
              <Grid item xs={12} md={6}>
                <Typography variant="h6" gutterBottom>Customer Information</Typography>
                <Card variant="outlined" sx={{ p: 2 }}>
                  <Typography><strong>Name:</strong> {selectedOrder.customer}</Typography>
                  <Typography><strong>Email:</strong> {selectedOrder.customer_email}</Typography>
                  <Typography><strong>Phone:</strong> {selectedOrder.customer_phone}</Typography>
                  <Typography><strong>Address:</strong> {selectedOrder.delivery_address}</Typography>
                </Card>
              </Grid>
              
              <Grid item xs={12} md={6}>
                <Typography variant="h6" gutterBottom>Order Information</Typography>
                <Card variant="outlined" sx={{ p: 2 }}>
                  <Typography><strong>Order Number:</strong> {selectedOrder.order_number}</Typography>
                  <Typography><strong>Vendor:</strong> {selectedOrder.vendor}</Typography>
                  <Typography><strong>Total Amount:</strong> ${selectedOrder.total_amount}</Typography>
                  <Typography><strong>Status:</strong> 
                    <Chip 
                      label={selectedOrder.status} 
                      color={getStatusColor(selectedOrder.status)} 
                      size="small" 
                      sx={{ ml: 1 }}
                    />
                  </Typography>
                  <Typography><strong>Payment:</strong> 
                    <Chip 
                      label={selectedOrder.payment_status} 
                      color={getPaymentStatusColor(selectedOrder.payment_status)} 
                      size="small" 
                      sx={{ ml: 1 }}
                    />
                  </Typography>
                </Card>
              </Grid>
              
              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom>Order Items</Typography>
                <Card variant="outlined" sx={{ p: 2 }}>
                  {selectedOrder.items.map((item, index) => (
                    <Box key={index} sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Typography>{item.name} x{item.quantity}</Typography>
                      <Typography fontWeight="bold">${item.price}</Typography>
                    </Box>
                  ))}
                </Card>
              </Grid>
              
              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom>Order Progress</Typography>
                <Stepper orientation="vertical">
                  {getOrderSteps(selectedOrder.status).map((step, index) => (
                    <Step key={index} active={step.completed} completed={step.completed}>
                      <StepLabel>{step.label}</StepLabel>
                    </Step>
                  ))}
                </Stepper>
              </Grid>
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOrderDetailsOpen(false)}>Close</Button>
          <Button 
            variant="contained" 
            onClick={() => {
              if (selectedOrder) {
                handleStatusUpdate(selectedOrder.id, 'processing');
                setOrderDetailsOpen(false);
              }
            }}
          >
            Process Order
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert severity={snackbar.severity} onClose={() => setSnackbar({ ...snackbar, open: false })}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default OrdersPage; 