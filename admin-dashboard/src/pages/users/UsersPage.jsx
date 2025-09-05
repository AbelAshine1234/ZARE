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
import {
  Add,
  Search,
  Edit,
  Delete,
  Visibility,
  Block,
  CheckCircle,
  FilterList
} from '@mui/icons-material';
import { DataGrid } from '@mui/x-data-grid';
import axios from 'axios';

const UsersPage = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [selectedUser, setSelectedUser] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const response = await axios.get('/api/users');
      setUsers(response.data);
    } catch (error) {
      console.error('Error fetching users:', error);
      // Mock data for demonstration
      setUsers([
        {
          id: 1,
          name: 'John Doe',
          email: 'john@example.com',
          phone_number: '+1234567890',
          type: 'client',
          is_verified: true,
          created_at: '2024-01-15T10:30:00Z',
          status: 'active'
        },
        {
          id: 2,
          name: 'Jane Smith',
          email: 'jane@example.com',
          phone_number: '+1234567891',
          type: 'vendor_owner',
          is_verified: true,
          created_at: '2024-01-10T14:20:00Z',
          status: 'active'
        },
        {
          id: 3,
          name: 'Mike Johnson',
          email: 'mike@example.com',
          phone_number: '+1234567892',
          type: 'driver',
          is_verified: false,
          created_at: '2024-01-20T09:15:00Z',
          status: 'pending'
        },
        {
          id: 4,
          name: 'Sarah Wilson',
          email: 'sarah@example.com',
          phone_number: '+1234567893',
          type: 'client',
          is_verified: true,
          created_at: '2024-01-12T16:45:00Z',
          status: 'active'
        },
        {
          id: 5,
          name: 'David Brown',
          email: 'david@example.com',
          phone_number: '+1234567894',
          type: 'employee',
          is_verified: true,
          created_at: '2024-01-08T11:30:00Z',
          status: 'active'
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleEditUser = (user) => {
    setSelectedUser(user);
    setDialogOpen(true);
  };

  const handleDeleteUser = (user) => {
    setSelectedUser(user);
    setDeleteDialogOpen(true);
  };

  const handleSaveUser = async () => {
    try {
      if (selectedUser.id) {
        await axios.put(`/api/users/${selectedUser.id}`, selectedUser);
        setSnackbar({ open: true, message: 'User updated successfully', severity: 'success' });
      } else {
        await axios.post('/api/users', selectedUser);
        setSnackbar({ open: true, message: 'User created successfully', severity: 'success' });
      }
      setDialogOpen(false);
      setSelectedUser(null);
      fetchUsers();
    } catch (error) {
      setSnackbar({ open: true, message: 'Error saving user', severity: 'error' });
    }
  };

  const handleDeleteConfirm = async () => {
    try {
      await axios.delete(`/api/users/${selectedUser.id}`);
      setSnackbar({ open: true, message: 'User deleted successfully', severity: 'success' });
      setDeleteDialogOpen(false);
      setSelectedUser(null);
      fetchUsers();
    } catch (error) {
      setSnackbar({ open: true, message: 'Error deleting user', severity: 'error' });
    }
  };

  const handleStatusChange = async (userId, newStatus) => {
    try {
      await axios.patch(`/api/users/${userId}/status`, { status: newStatus });
      setSnackbar({ open: true, message: 'User status updated successfully', severity: 'success' });
      fetchUsers();
    } catch (error) {
      setSnackbar({ open: true, message: 'Error updating user status', severity: 'error' });
    }
  };

  const getTypeColor = (type) => {
    switch (type) {
      case 'client':
        return 'primary';
      case 'vendor_owner':
        return 'success';
      case 'driver':
        return 'warning';
      case 'employee':
        return 'info';
      case 'admin':
        return 'error';
      default:
        return 'default';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active':
        return 'success';
      case 'pending':
        return 'warning';
      case 'suspended':
        return 'error';
      default:
        return 'default';
    }
  };

  const columns = [
    {
      field: 'id',
      headerName: 'ID',
      width: 70,
    },
    {
      field: 'name',
      headerName: 'Name',
      width: 150,
      renderCell: (params) => (
        <Box>
          <Typography variant="body2" fontWeight="medium">
            {params.value}
          </Typography>
          <Typography variant="caption" color="textSecondary">
            {params.row.email}
          </Typography>
        </Box>
      ),
    },
    {
      field: 'phone_number',
      headerName: 'Phone',
      width: 130,
    },
    {
      field: 'type',
      headerName: 'Type',
      width: 120,
      renderCell: (params) => (
        <Chip
          label={params.value.replace('_', ' ')}
          color={getTypeColor(params.value)}
          size="small"
        />
      ),
    },
    {
      field: 'is_verified',
      headerName: 'Verified',
      width: 100,
      renderCell: (params) => (
        <Chip
          label={params.value ? 'Yes' : 'No'}
          color={params.value ? 'success' : 'default'}
          size="small"
        />
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
            <IconButton size="small" color="primary">
              <Visibility />
            </IconButton>
          </Tooltip>
          <Tooltip title="Edit User">
            <IconButton 
              size="small" 
              color="warning"
              onClick={() => handleEditUser(params.row)}
            >
              <Edit />
            </IconButton>
          </Tooltip>
          <Tooltip title="Delete User">
            <IconButton 
              size="small" 
              color="error"
              onClick={() => handleDeleteUser(params.row)}
            >
              <Delete />
            </IconButton>
          </Tooltip>
          {params.row.status === 'active' ? (
            <Tooltip title="Suspend User">
              <IconButton 
                size="small" 
                color="warning"
                onClick={() => handleStatusChange(params.row.id, 'suspended')}
              >
                <Block />
              </IconButton>
            </Tooltip>
          ) : (
            <Tooltip title="Activate User">
              <IconButton 
                size="small" 
                color="success"
                onClick={() => handleStatusChange(params.row.id, 'active')}
              >
                <CheckCircle />
              </IconButton>
            </Tooltip>
          )}
        </Box>
      ),
    },
  ];

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.phone_number?.includes(searchTerm);
    
    const matchesType = filterType === 'all' || user.type === filterType;
    const matchesStatus = filterStatus === 'all' || user.status === filterStatus;
    
    return matchesSearch && matchesType && matchesStatus;
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
          User Management
        </Typography>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => {
            setSelectedUser({
              name: '',
              email: '',
              phone_number: '',
              type: 'client',
              is_verified: false,
              status: 'active'
            });
            setDialogOpen(true);
          }}
        >
          Add New User
        </Button>
      </Box>

      {/* Filters */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
          <TextField
            placeholder="Search users..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            InputProps={{
              startAdornment: <Search sx={{ mr: 1, color: 'text.secondary' }} />,
            }}
            sx={{ minWidth: 300 }}
          />
          
          <FormControl sx={{ minWidth: 120 }}>
            <InputLabel>Type</InputLabel>
            <Select
              value={filterType}
              label="Type"
              onChange={(e) => setFilterType(e.target.value)}
            >
              <MenuItem value="all">All Types</MenuItem>
              <MenuItem value="client">Client</MenuItem>
              <MenuItem value="vendor_owner">Vendor</MenuItem>
              <MenuItem value="driver">Driver</MenuItem>
              <MenuItem value="employee">Employee</MenuItem>
              <MenuItem value="admin">Admin</MenuItem>
            </Select>
          </FormControl>
          
          <FormControl sx={{ minWidth: 120 }}>
            <InputLabel>Status</InputLabel>
            <Select
              value={filterStatus}
              label="Status"
              onChange={(e) => setFilterStatus(e.target.value)}
            >
              <MenuItem value="all">All Status</MenuItem>
              <MenuItem value="active">Active</MenuItem>
              <MenuItem value="pending">Pending</MenuItem>
              <MenuItem value="suspended">Suspended</MenuItem>
            </Select>
          </FormControl>
        </Box>
      </Paper>

      {/* Users Data Grid */}
      <Paper sx={{ height: 600 }}>
        <DataGrid
          rows={filteredUsers}
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

      {/* Edit/Create User Dialog */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          {selectedUser?.id ? 'Edit User' : 'Create New User'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
            <TextField
              label="Name"
              value={selectedUser?.name || ''}
              onChange={(e) => setSelectedUser({ ...selectedUser, name: e.target.value })}
              fullWidth
            />
            <TextField
              label="Email"
              type="email"
              value={selectedUser?.email || ''}
              onChange={(e) => setSelectedUser({ ...selectedUser, email: e.target.value })}
              fullWidth
            />
            <TextField
              label="Phone Number"
              value={selectedUser?.phone_number || ''}
              onChange={(e) => setSelectedUser({ ...selectedUser, phone_number: e.target.value })}
              fullWidth
            />
            <FormControl fullWidth>
              <InputLabel>Type</InputLabel>
              <Select
                value={selectedUser?.type || 'client'}
                label="Type"
                onChange={(e) => setSelectedUser({ ...selectedUser, type: e.target.value })}
              >
                <MenuItem value="client">Client</MenuItem>
                <MenuItem value="vendor_owner">Vendor Owner</MenuItem>
                <MenuItem value="driver">Driver</MenuItem>
                <MenuItem value="employee">Employee</MenuItem>
                <MenuItem value="admin">Admin</MenuItem>
              </Select>
            </FormControl>
            <FormControl fullWidth>
              <InputLabel>Status</InputLabel>
              <Select
                value={selectedUser?.status || 'active'}
                label="Status"
                onChange={(e) => setSelectedUser({ ...selectedUser, status: e.target.value })}
              >
                <MenuItem value="active">Active</MenuItem>
                <MenuItem value="pending">Pending</MenuItem>
                <MenuItem value="suspended">Suspended</MenuItem>
              </Select>
            </FormControl>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleSaveUser} variant="contained">Save</Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete user "{selectedUser?.name}"? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleDeleteConfirm} color="error" variant="contained">
            Delete
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

export default UsersPage;

