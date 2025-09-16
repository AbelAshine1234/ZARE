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
  CircularProgress
} from '@mui/material';
import { Search, Visibility } from '@mui/icons-material';
import { DataGrid } from '@mui/x-data-grid';
import api from '../../utils/api';
import { useAuth } from '../../contexts/AuthContext';

const OrdersPage = () => {
  const [orders, setOrders] = useState([]);
  const { user: currentUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const response = await api.get('/api/admin/orders');
      const payload = Array.isArray(response.data) ? response.data : (response.data?.orders || []);
      setOrders(payload);
    } catch (error) {
      console.error('Error fetching orders:', error);
      // Set empty array instead of mock data
      setOrders([]);
    } finally {
      setLoading(false);
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

  const columns = [
    { field: 'id', headerName: 'ID', width: 70 },
    {
      field: 'order_number',
      headerName: 'Order #',
      width: 130,
      renderCell: (params) => (
        <Typography variant="body2" fontWeight="medium">{params.value}</Typography>
      )
    },
    {
      field: 'customer_name',
      headerName: 'Customer',
      width: 180,
      renderCell: (params) => (
        <Box>
          <Typography variant="body2" fontWeight="medium">{params.value}</Typography>
          <Typography variant="caption" color="textSecondary">{params.row.customer_phone}</Typography>
        </Box>
      )
    },
    {
      field: 'total_amount',
      headerName: 'Total',
      width: 100,
      renderCell: (params) => (
        <Typography variant="body2" fontWeight="bold">${params.value}</Typography>
      )
    },
    {
      field: 'payment_method',
      headerName: 'Payment',
      width: 140,
      renderCell: (params) => (
        <Chip label={(params.value || '').replaceAll('_', ' ')} size="small" />
      )
    },
    {
      field: 'status',
      headerName: 'Status',
      width: 120,
      renderCell: (params) => (
        <Chip label={params.value} color={getStatusColor(params.value)} size="small" />
      )
    },
    {
      field: 'created_at',
      headerName: 'Created',
      width: 140,
      renderCell: (params) => (
        <Typography variant="body2">{new Date(params.value).toLocaleDateString()}</Typography>
      )
    },
    {
      field: 'actions',
      headerName: 'Actions',
      width: 120,
      renderCell: (params) => (
        <Tooltip title="View Details">
          <IconButton size="small" color="primary" onClick={() => handleView(params.row)}>
            <Visibility />
          </IconButton>
        </Tooltip>
      )
    }
  ];

  const handleView = (order) => {
    setSelectedOrder(order);
    setDialogOpen(true);
  };

  const filteredOrders = orders.filter((order) => {
    const matchesSearch =
      order.order_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.customer_name?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = filterStatus === 'all' || order.status === filterStatus;
    return matchesSearch && matchesStatus;
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
        <Typography variant="h4" fontWeight="bold">Order Management</Typography>
        <Box />
      </Box>

      <Paper sx={{ p: 2, mb: 3 }}>
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
          <TextField
            placeholder="Search by order # or customer..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            InputProps={{ startAdornment: <Search sx={{ mr: 1, color: 'text.secondary' }} /> }}
            sx={{ minWidth: 300 }}
          />

          <FormControl sx={{ minWidth: 160 }}>
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
        </Box>
      </Paper>

      <Paper sx={{ height: 600 }}>
        <DataGrid
          rows={filteredOrders}
          columns={columns}
          pageSize={10}
          rowsPerPageOptions={[10, 25, 50]}
          checkboxSelection
          disableSelectionOnClick
          sx={{
            '& .MuiDataGrid-cell:focus': { outline: 'none' }
          }}
        />
      </Paper>

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Order Details</DialogTitle>
        <DialogContent>
          {selectedOrder && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, pt: 1 }}>
              <Typography><b>Order #:</b> {selectedOrder.order_number}</Typography>
              <Typography><b>Customer:</b> {selectedOrder.customer_name}</Typography>
              <Typography><b>Phone:</b> {selectedOrder.customer_phone}</Typography>
              <Typography><b>Status:</b> {selectedOrder.status}</Typography>
              <Typography><b>Total:</b> ${selectedOrder.total_amount}</Typography>
              <Typography><b>Payment:</b> {selectedOrder.payment_method}</Typography>
              <Typography><b>Created:</b> {new Date(selectedOrder.created_at).toLocaleString()}</Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>

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


