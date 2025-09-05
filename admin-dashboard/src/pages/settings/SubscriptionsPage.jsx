import React, { useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchSubscriptions, createSubscriptionThunk, updateSubscriptionThunk, deleteSubscriptionThunk } from '../../store/slices/subscriptionsSlice';
import {
  Box, Paper, Typography, Chip, IconButton, Tooltip, Button, Dialog, DialogTitle, DialogContent, DialogActions,
  Grid, TextField, Select, MenuItem, FormControl, InputLabel, Snackbar, Alert
} from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import { Add, Refresh, Visibility, Edit, Delete } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

const SubscriptionsPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { list: items, loading } = useSelector(state => state.subscriptions);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [planFilter, setPlanFilter] = useState('all');
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);
  
  // Form state
  const [formData, setFormData] = useState({
    plan: '',
    amount: '',
    start_date: '',
    end_date: '',
    status: 'active'
  });

  useEffect(() => { 
    dispatch(fetchSubscriptions()); 
  }, [dispatch]);

  const openCreate = () => { 
    setEditing(null); 
    setFormData({
      plan: '',
      amount: '',
      start_date: '',
      end_date: '',
      status: 'active'
    }); 
    setDialogOpen(true); 
  };

  const openEdit = (row) => { 
    setEditing(row); 
    setFormData({
      plan: row.plan || '',
      amount: row.amount || '',
      start_date: row.start_date ? new Date(row.start_date).toISOString().split('T')[0] : '',
      end_date: row.end_date ? new Date(row.end_date).toISOString().split('T')[0] : '',
      status: row.status || 'active'
    }); 
    setDialogOpen(true); 
  };

  const save = async () => {
    try {
      const subscriptionData = {
        plan: formData.plan,
        amount: parseFloat(formData.amount),
        start_date: formData.start_date,
        end_date: formData.end_date,
        status: formData.status
      };

      if (editing) {
        const res = await dispatch(updateSubscriptionThunk({ id: editing.id, ...subscriptionData }));
        if (updateSubscriptionThunk.rejected.match(res)) throw new Error(res.payload);
        setSnackbar({ open: true, message: 'Subscription updated successfully', severity: 'success' });
      } else {
        const res = await dispatch(createSubscriptionThunk(subscriptionData));
        if (createSubscriptionThunk.rejected.match(res)) throw new Error(res.payload);
        setSnackbar({ open: true, message: 'Subscription created successfully', severity: 'success' });
      }
      setDialogOpen(false);
      dispatch(fetchSubscriptions());
    } catch (e) {
      setSnackbar({ open: true, message: e.message || 'Save failed', severity: 'error' });
    }
  };

  const handleDelete = async (row) => {
    try {
      const res = await dispatch(deleteSubscriptionThunk(row.id));
      if (deleteSubscriptionThunk.rejected.match(res)) throw new Error(res.payload);
      setSnackbar({ open: true, message: 'Subscription deleted successfully', severity: 'success' });
      setConfirmDelete(null);
    } catch (e) {
      setSnackbar({ open: true, message: e.message || 'Delete failed', severity: 'error' });
    }
  };

  const rows = useMemo(() => items.map(s => ({
    id: s.id,
    plan: s.plan,
    amount: s.amount,
    start_date: s.start_date,
    end_date: s.end_date,
    status: s.status,
    createdAt: s.createdAt || s.created_at
  })), [items]);

  const filtered = rows.filter(r => {
    const q = search.trim().toLowerCase();
    const matchSearch = !q || r.plan?.toLowerCase().includes(q);
    const matchStatus = statusFilter === 'all' || r.status === statusFilter;
    const matchPlan = planFilter === 'all' || r.plan === planFilter;
    return matchSearch && matchStatus && matchPlan;
  });

  const columns = [
    { field: 'id', headerName: 'ID', width: 80 },
    { field: 'plan', headerName: 'Plan', width: 150, renderCell: (p) => (
      <Typography variant="body2" fontWeight="medium">{p.value}</Typography>
    ) },
    { field: 'amount', headerName: 'Amount', width: 120, renderCell: (p) => (
      <Typography variant="body2">${p.value?.toFixed(2)}</Typography>
    ) },
    { field: 'start_date', headerName: 'Start Date', width: 120, renderCell: (p) => {
      const d = p.value ? new Date(p.value) : null;
      const valid = d && !isNaN(d.getTime());
      return (
        <Typography variant="body2">{valid ? d.toLocaleDateString() : '-'}</Typography>
      );
    } },
    { field: 'end_date', headerName: 'End Date', width: 120, renderCell: (p) => {
      const d = p.value ? new Date(p.value) : null;
      const valid = d && !isNaN(d.getTime());
      return (
        <Typography variant="body2">{valid ? d.toLocaleDateString() : '-'}</Typography>
      );
    } },
    { field: 'status', headerName: 'Status', width: 120, renderCell: (p) => (
      <Chip 
        label={p.value} 
        color={p.value === 'active' ? 'success' : 'default'} 
        size="small" 
      />
    ) },
    { field: 'actions', headerName: 'Actions', width: 150, renderCell: (p) => (
      <Box>
        <Tooltip title="View Details">
          <IconButton size="small" color="info" onClick={() => navigate(`/subscriptions/${p.row.id}`)}>
            <Visibility />
          </IconButton>
        </Tooltip>
        <Tooltip title="Edit">
          <IconButton size="small" color="primary" onClick={() => openEdit(p.row)}>
            <Edit />
          </IconButton>
        </Tooltip>
        <Tooltip title="Delete">
          <IconButton size="small" color="error" onClick={() => setConfirmDelete(p.row)}>
            <Delete />
          </IconButton>
        </Tooltip>
      </Box>
    ) },
  ];

  return (
    <Box sx={{ height: 'calc(100vh - 112px)' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h4" fontWeight="bold">Subscriptions</Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button variant="outlined" startIcon={<Refresh />} onClick={() => dispatch(fetchSubscriptions())}>
            Refresh
          </Button>
          <Button variant="contained" startIcon={<Add />} onClick={openCreate}>
            Add Subscription
          </Button>
        </Box>
      </Box>

      <Paper sx={{ p: 2, mb: 2 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={4}>
            <TextField 
              fullWidth 
              placeholder="Search subscriptions..." 
              value={search} 
              onChange={(e) => setSearch(e.target.value)} 
            />
          </Grid>
          <Grid item xs={12} md={3}>
            <FormControl fullWidth>
              <InputLabel>Status</InputLabel>
              <Select value={statusFilter} label="Status" onChange={(e) => setStatusFilter(e.target.value)}>
                <MenuItem value="all">All</MenuItem>
                <MenuItem value="active">Active</MenuItem>
                <MenuItem value="inactive">Inactive</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={3}>
            <FormControl fullWidth>
              <InputLabel>Plan</InputLabel>
              <Select value={planFilter} label="Plan" onChange={(e) => setPlanFilter(e.target.value)}>
                <MenuItem value="all">All Plans</MenuItem>
                {[...new Set(items.map(s => s.plan))].map(plan => (
                  <MenuItem key={plan} value={plan}>{plan}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
        </Grid>
      </Paper>

      <Paper sx={{ height: 'calc(100% - 110px)' }}>
        <DataGrid
          rows={filtered}
          columns={columns}
          pagination={false}
          loading={loading}
          disableSelectionOnClick
          hideFooter
          sx={{
            height: '100%',
            '& .MuiDataGrid-cell:focus': { outline: 'none' }
          }}
        />
      </Paper>

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editing ? 'Edit Subscription' : 'Create Subscription'}</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                label="Plan"
                value={formData.plan}
                onChange={(e) => setFormData({ ...formData, plan: e.target.value })}
                fullWidth
                required
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                label="Amount"
                type="number"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                fullWidth
                required
                inputProps={{ step: "0.01", min: "0" }}
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                label="Start Date"
                type="date"
                value={formData.start_date}
                onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                fullWidth
                required
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                label="End Date"
                type="date"
                value={formData.end_date}
                onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                fullWidth
                required
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Status</InputLabel>
                <Select
                  value={formData.status}
                  label="Status"
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                >
                  <MenuItem value="active">Active</MenuItem>
                  <MenuItem value="inactive">Inactive</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={save}>
            {editing ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={Boolean(confirmDelete)} onClose={() => setConfirmDelete(null)}>
        <DialogTitle>Delete Subscription</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete subscription "{confirmDelete?.plan}"?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmDelete(null)}>Cancel</Button>
          <Button color="error" variant="contained" onClick={() => handleDelete(confirmDelete)}>
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar open={snackbar.open} autoHideDuration={4000} onClose={() => setSnackbar({ ...snackbar, open: false })}>
        <Alert severity={snackbar.severity} onClose={() => setSnackbar({ ...snackbar, open: false })}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default SubscriptionsPage;


