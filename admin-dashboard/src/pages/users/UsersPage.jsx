import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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
  Stack,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  Snackbar,
  CircularProgress,
  InputAdornment
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
import { usersApi, adminApi } from '../../utils/api';
import { useAuth } from '../../contexts/AuthContext';

const UsersPage = () => {
  const [users, setUsers] = useState([]);
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [pagination, setPagination] = useState({ page: 0, pageSize: 10, total: 0 });
  const [createOpen, setCreateOpen] = useState(false);
  const [createForm, setCreateForm] = useState({ name: '', phone_number: '', email: '', password: '' });
  const [createError, setCreateError] = useState('');
  const [creating, setCreating] = useState(false);
  const [pwdOpen, setPwdOpen] = useState(false);
  const [pwdValue, setPwdValue] = useState('');

  // Normalize Ethiopian phone numbers to +2519XXXXXXXX
  const normalizeEtPhone = (input) => {
    if (!input) return null;
    let v = String(input).replace(/\s|-/g, '');
    if (v.startsWith('+251')) return v; // assume already correct
    if (v.startsWith('0') && v.length === 10) {
      // 0XXXXXXXXX -> +251XXXXXXXXX (drop leading 0)
      return '+251' + v.slice(1);
    }
    if (v.length === 9 && v[0] === '9') {
      // 9XXXXXXXX -> +2519XXXXXXXX
      return '+251' + v;
    }
    return null; // invalid
  };

  useEffect(() => {
    fetchUsers(pagination.page, pagination.pageSize, filterType);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pagination.page, pagination.pageSize, filterType]);

  const fetchUsers = async (page = 0, pageSize = 10, type = 'all') => {
    try {
      setLoading(true);
      const res = await usersApi.list(page + 1, pageSize, type !== 'all' ? type : undefined);
      const list = res.data?.users || [];
      const total = res.data?.pagination?.total || list.length;
      setUsers(list);
      setPagination(prev => ({ ...prev, total }));
    } catch (error) {
      console.error('Error fetching users:', error);
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  // UI-only for now; edit/delete/status actions are disabled until backend endpoints are provided consistently.

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
    // Status column hidden until backend supports it uniformly on users
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
      width: 120,
      renderCell: (params) => (
        <Box>
          <Tooltip title="View Details">
            <IconButton size="small" color="primary" onClick={() => navigate(`/users/${params.row.id}/detail`)}>
              <Visibility />
            </IconButton>
          </Tooltip>
        </Box>
      ),
    },
  ];

  const filteredUsers = (Array.isArray(users) ? users : []).filter(user => {
    const matchesSearch = user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.phone_number?.includes(searchTerm);
    const matchesStatus = filterStatus === 'all' || user.status === filterStatus;
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
        <Typography variant="h4" fontWeight="bold">
          User Management
        </Typography>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => { setCreateError(''); setCreateOpen(true); }}
        >
          Create Client
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
          rows={Array.isArray(filteredUsers) ? filteredUsers : []}
          columns={columns}
          pagination
          paginationMode="server"
          rowCount={pagination.total}
          paginationModel={{ page: pagination.page, pageSize: pagination.pageSize }}
          onPaginationModelChange={(model) => setPagination(model)}
          pageSizeOptions={[10, 25, 50]}
          checkboxSelection
          disableSelectionOnClick
          sx={{
            '& .MuiDataGrid-cell:focus': {
              outline: 'none',
            },
          }}
        />
      </Paper>

      {/* Edit/Delete dialogs removed for now to simplify and avoid unsupported endpoints */}

      {/* Create Client Dialog */}
      <Dialog open={createOpen} onClose={() => setCreateOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Create Client</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ pt: 1 }}>
            {createError && (
              <Typography variant="body2" color="error">{createError}</Typography>
            )}
            <TextField label="Name" fullWidth value={createForm.name} onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })} />
            <TextField
              label="Phone Number"
              fullWidth
              helperText="Ethiopia only. Enter 9 digits after +251."
              value={createForm.phone_number}
              onChange={(e) => {
                const digits = (e.target.value || '').replace(/\D/g, '').slice(0, 9);
                setCreateForm({ ...createForm, phone_number: digits });
              }}
              InputProps={{
                startAdornment: <InputAdornment position="start">+251</InputAdornment>,
                inputMode: 'numeric',
              }}
            />
            <TextField label="Email (optional)" type="email" fullWidth helperText="Optional" value={createForm.email} onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })} />
            <TextField label="Password" type="password" fullWidth value={createForm.password} onChange={(e) => setCreateForm({ ...createForm, password: e.target.value })} />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateOpen(false)}>Cancel</Button>
          <Button variant="contained" disabled={creating} onClick={async () => {
            try {
              setCreateError('');
              const fullPhone = '+251' + (createForm.phone_number || '');
              const normalized = normalizeEtPhone(fullPhone);
              if (!normalized || (createForm.phone_number || '').length !== 9 || !createForm.password) {
                setCreateError('Enter a valid Ethiopian phone (9 digits after +251) and password');
                return;
              }
              setCreating(true);
              const resp = await adminApi.createClient({
                name: createForm.name,
                phone_number: normalized,
                email: createForm.email,
                password: createForm.password,
              });
              const dp = resp?.data?.defaultPassword;
              if (dp) { setPwdValue(dp); setPwdOpen(true); }
              setCreateOpen(false);
              setCreateForm({ name: '', phone_number: '', email: '', password: '' });
              // Refresh list
              fetchUsers(pagination.page, pagination.pageSize, filterType);
              setSnackbar({ open: true, message: 'Client created successfully', severity: 'success' });
            } catch (e) {
              setCreateError(e?.response?.data?.error || e.message || 'Failed to create client');
            } finally {
              setCreating(false);
            }
          }}>Create</Button>
        </DialogActions>
      </Dialog>

      {/* Default password dialog */}
      <Dialog open={pwdOpen} onClose={() => setPwdOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Default Password</DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ mb: 1 }}>A default password was generated for this user. Please save it permanently.</Typography>
          <Typography variant="h6" sx={{ fontWeight: 700 }}>"{pwdValue}"</Typography>
        </DialogContent>
        <DialogActions>
          <Button variant="contained" onClick={() => setPwdOpen(false)}>I Saved It</Button>
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

