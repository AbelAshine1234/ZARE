import React, { useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchVendors, approveVendor, deleteVendor } from '../../store/slices/vendorsSlice';
import {
  Box, Paper, Typography, Chip, IconButton, Tooltip, Button, Dialog, DialogTitle, DialogContent, DialogActions,
  Grid, TextField, Select, MenuItem, FormControl, InputLabel, Snackbar, Alert
} from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import { Visibility, CheckCircle, Delete, Refresh, RestoreFromTrash } from '@mui/icons-material';
import { useLocation, useNavigate } from 'react-router-dom';

const VendorsPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { items, loading } = useSelector(state => state.vendors);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [approvalFilter, setApprovalFilter] = useState('all');
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [confirmDelete, setConfirmDelete] = useState(null);

  useEffect(() => { dispatch(fetchVendors()); }, [dispatch]);

  useEffect(() => {
    const s = location.state?.snackbar;
    if (s?.open) {
      setSnackbar(s);
      // clear state to avoid re-showing on next renders
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  const rows = useMemo(() => items.map(v => ({
    id: v.id,
    name: v.name,
    type: v.type,
    status: v.status,
    isApproved: v.isApproved,
    categories: v.vendorCategories?.map(c => c.name).join(', '),
    owner: v.user?.name,
    createdAt: v.createdAt || v.created_at || v.subscription?.start_date || null,
  })), [items]);

  const filtered = rows.filter(r => {
    const q = search.trim().toLowerCase();
    const matchSearch =
      !q ||
      r.name?.toLowerCase().includes(q) ||
      r.owner?.toLowerCase().includes(q) ||
      r.categories?.toLowerCase().includes(q) ||
      r.type?.toLowerCase().includes(q);
    const matchType = typeFilter === 'all' || r.type === typeFilter;
    const matchApproval = approvalFilter === 'all' || (approvalFilter === 'approved' ? r.isApproved : !r.isApproved);
    return matchSearch && matchType && matchApproval;
  });

  const columns = [
    { field: 'id', headerName: 'ID', width: 80 },
    { field: 'name', headerName: 'Name', width: 200, renderCell: (p) => (
      <Box>
        <Typography variant="body2" fontWeight="medium">{p.value}</Typography>
        <Typography variant="caption" color="text.secondary">{p.row.categories}</Typography>
      </Box>
    ) },
    { field: 'type', headerName: 'Type', width: 120, renderCell: (p) => (
      <Chip label={p.value} color={p.value === 'business' ? 'primary' : 'secondary'} size="small" />
    ) },
    { field: 'status', headerName: 'Active', width: 110, renderCell: (p) => (
      <Chip label={p.value ? 'Active' : 'Inactive'} color={p.value ? 'success' : 'default'} size="small" />
    ) },
    { field: 'isApproved', headerName: 'Approved', width: 130, renderCell: (p) => (
      <Chip label={p.value ? 'Approved' : 'Pending'} color={p.value ? 'success' : 'warning'} size="small" />
    ) },
    { field: 'owner', headerName: 'Owner', width: 160 },
    { field: 'createdAt', headerName: 'Created', width: 160, renderCell: (p) => {
      const d = p.value ? new Date(p.value) : null;
      const valid = d && !isNaN(d.getTime());
      return (
        <Typography variant="body2">{valid ? d.toLocaleDateString() : '-'}</Typography>
      );
    } },
    { field: 'actions', headerName: 'Actions', width: 120, renderCell: (p) => (
      <Box>
        <Tooltip title="Details">
          <IconButton size="small" color="primary" onClick={() => navigate(`/vendors/${p.row.id}`)}>
            <Visibility />
          </IconButton>
        </Tooltip>
      </Box>
    ) },
  ];

  return (
    <Box sx={{ height: 'calc(100vh - 112px)' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h4" fontWeight="bold">Vendors</Typography>
        <Box>
          <Button variant="outlined" startIcon={<Refresh />} onClick={() => dispatch(fetchVendors())} sx={{ mr: 1 }}>Refresh</Button>
          <Button variant="contained" color="warning" startIcon={<RestoreFromTrash />} onClick={() => navigate('/recycle-bin')}>Recycle Bin</Button>
        </Box>
      </Box>

      <Paper sx={{ p: 2, mb: 2 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={4}>
            <TextField fullWidth placeholder="Search vendors..." value={search} onChange={(e) => setSearch(e.target.value)} />
          </Grid>
          <Grid item xs={12} md={3}>
            <FormControl fullWidth>
              <InputLabel>Type</InputLabel>
              <Select value={typeFilter} label="Type" onChange={(e) => setTypeFilter(e.target.value)}>
                <MenuItem value="all">All</MenuItem>
                <MenuItem value="individual">Individual</MenuItem>
                <MenuItem value="business">Business</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={3}>
            <FormControl fullWidth>
              <InputLabel>Approval</InputLabel>
              <Select value={approvalFilter} label="Approval" onChange={(e) => setApprovalFilter(e.target.value)}>
                <MenuItem value="all">All</MenuItem>
                <MenuItem value="approved">Approved</MenuItem>
                <MenuItem value="pending">Pending</MenuItem>
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

      <Dialog open={Boolean(confirmDelete)} onClose={() => setConfirmDelete(null)}>
        <DialogTitle>Delete Vendor</DialogTitle>
        <DialogContent>
          <Typography>Are you sure you want to delete vendor "{confirmDelete?.name}"?</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmDelete(null)}>Cancel</Button>
          <Button color="error" variant="contained" onClick={async () => {
            if (confirmDelete) {
              const res = await dispatch(deleteVendor({ id: confirmDelete.id }));
              if (deleteVendor.fulfilled.match(res)) setSnackbar({ open: true, message: 'Vendor deleted', severity: 'success' });
              else setSnackbar({ open: true, message: res.payload || 'Error', severity: 'error' });
              setConfirmDelete(null);
            }
          }}>Delete</Button>
        </DialogActions>
      </Dialog>

      <Snackbar open={snackbar.open} autoHideDuration={4000} onClose={() => setSnackbar({ ...snackbar, open: false })}>
        <Alert severity={snackbar.severity} onClose={() => setSnackbar({ ...snackbar, open: false })}>{snackbar.message}</Alert>
      </Snackbar>
    </Box>
  );
};

export default VendorsPage;

