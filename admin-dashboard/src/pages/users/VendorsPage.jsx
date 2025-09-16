import React, { useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchVendors, approveVendor, deleteVendor } from '../../store/slices/vendorsSlice';
import {
  Box, Paper, Typography, Chip, IconButton, Tooltip, Button, Dialog, DialogTitle, DialogContent, DialogActions,
  Grid, TextField, Select, MenuItem, FormControl, InputLabel, Snackbar, Alert, Stack, Autocomplete
} from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import { Visibility, CheckCircle, Delete, Refresh, RestoreFromTrash } from '@mui/icons-material';
import { useLocation, useNavigate } from 'react-router-dom';
import { categoriesApi, subscriptionsApi, vendorsApi, usersApi } from '../../utils/api';

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
  const [openCreate, setOpenCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({
    name: '',
    description: '',
    type: 'individual',
    category_ids: [],
    subscription_id: '',
    payment_method: { name: '', account_number: '', account_holder: '' },
    cover_image: null,
    fayda_image: null,
    business_license_image: null,
    owner_user_id: '',
  });
  const [categories, setCategories] = useState([]);
  const [subscriptions, setSubscriptions] = useState([]);
  const [vendorOwners, setVendorOwners] = useState([]);
  const [clients, setClients] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => { dispatch(fetchVendors()); }, [dispatch]);

  useEffect(() => {
    const loadRefs = async () => {
      try {
        const [catsRes, subsRes, ownersRes, clientsRes] = await Promise.all([
          categoriesApi.list(),
          subscriptionsApi.list(),
          usersApi.list(1, 200, 'vendor_owner'),
          usersApi.list(1, 200, 'client'),
        ]);
        setCategories(catsRes.data || []);
        setSubscriptions(subsRes.data || []);
        const owners = (ownersRes.data?.users || []).map(u => ({ id: u.id, name: u.name, phone: u.phone_number }));
        setVendorOwners(owners);
        const cls = (clientsRes.data?.users || []).map(u => ({ id: u.id, name: u.name, phone: u.phone_number }));
        setClients(cls);
        // Auto-select the first owner if none selected yet
        if (!form.owner_user_id && owners.length > 0) {
          setForm(prev => ({ ...prev, owner_user_id: owners[0].id }));
        }
      } catch (e) {
        console.error('Failed to load categories/subscriptions', e);
      }
    };
    loadRefs();
  }, []);

  // When type changes, ensure a default owner is selected from the appropriate list
  useEffect(() => {
    if (openCreate) {
      if (form.type === 'individual') {
        if (!form.owner_user_id && clients.length > 0) {
          setForm(prev => ({ ...prev, owner_user_id: clients[0].id }));
        }
      } else {
        if (!form.owner_user_id && vendorOwners.length > 0) {
          setForm(prev => ({ ...prev, owner_user_id: vendorOwners[0].id }));
        }
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.type, openCreate, clients, vendorOwners]);

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
          <Button variant="contained" sx={{ mr: 1 }} onClick={() => { setError(''); setOpenCreate(true); }}>Create Vendor</Button>
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

      {/* Create Vendor Dialog */}
      <Dialog open={openCreate} onClose={() => setOpenCreate(false)} maxWidth="md" fullWidth>
        <DialogTitle>Create Vendor</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ pt: 1 }}>
            {error && (<Alert severity="error">{error}</Alert>)}
            <FormControl fullWidth>
              <InputLabel>Type</InputLabel>
              <Select value={form.type} label="Type" onChange={(e) => setForm({ ...form, type: e.target.value })}>
                <MenuItem value="individual">Individual</MenuItem>
                <MenuItem value="business">Business</MenuItem>
              </Select>
            </FormControl>
            <TextField label="Name" fullWidth value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            <TextField label="Description" fullWidth multiline minRows={2} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            <FormControl fullWidth>
              <InputLabel>Categories</InputLabel>
              <Select
                multiple
                value={form.category_ids}
                label="Categories"
                onChange={(e) => setForm({ ...form, category_ids: e.target.value })}
                renderValue={(selected) => selected.map(id => categories.find(c => c.id === id)?.name).filter(Boolean).join(', ')}
              >
                {categories.map(c => (
                  <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>
                ))}
              </Select>
            </FormControl>
            <FormControl fullWidth>
              <InputLabel>Subscription</InputLabel>
              <Select value={form.subscription_id} label="Subscription" onChange={(e) => setForm({ ...form, subscription_id: e.target.value })}>
                {subscriptions.map(s => (
                  <MenuItem key={s.id} value={s.id}>{s.plan || s.name || `ID ${s.id}`}</MenuItem>
                ))}
              </Select>
            </FormControl>
            <Autocomplete
              options={(form.type === 'individual' ? clients : vendorOwners)}
              getOptionLabel={(opt) => opt ? `${opt.name || ''} (${opt.phone || ''})` : ''}
              isOptionEqualToValue={(o, v) => o.id === v.id}
              value={(form.type === 'individual'
                ? (clients.find(c => c.id === form.owner_user_id) || null)
                : (vendorOwners.find(o => o.id === form.owner_user_id) || null))}
              onChange={(_e, newVal) => setForm({ ...form, owner_user_id: newVal?.id || '' })}
              renderInput={(params) => (
                <TextField {...params} label={form.type === 'individual' ? 'Client (as Vendor Owner)' : 'Vendor Owner'} fullWidth />
              )}
            />
            <Typography variant="subtitle2">Payment Method</Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} md={4}>
                <TextField label="Name" fullWidth value={form.payment_method.name} onChange={(e) => setForm({ ...form, payment_method: { ...form.payment_method, name: e.target.value } })} />
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField label="Account Number" fullWidth value={form.payment_method.account_number} onChange={(e) => setForm({ ...form, payment_method: { ...form.payment_method, account_number: e.target.value } })} />
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField label="Account Holder" fullWidth value={form.payment_method.account_holder} onChange={(e) => setForm({ ...form, payment_method: { ...form.payment_method, account_holder: e.target.value } })} />
              </Grid>
            </Grid>
            <Typography variant="subtitle2">Images</Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <Button component="label" variant="outlined" fullWidth>
                  Upload Cover Image
                  <input hidden type="file" accept="image/*" onChange={(e) => setForm({ ...form, cover_image: e.target.files?.[0] || null })} />
                </Button>
                <Typography variant="caption" color="text.secondary">{form.cover_image?.name || 'No file selected'}</Typography>
              </Grid>
              {form.type === 'individual' ? (
                <Grid item xs={12} md={6}>
                  <Button component="label" variant="outlined" fullWidth>
                    Upload Fayda Image
                    <input hidden type="file" accept="image/*" onChange={(e) => setForm({ ...form, fayda_image: e.target.files?.[0] || null })} />
                  </Button>
                  <Typography variant="caption" color="text.secondary">{form.fayda_image?.name || 'No file selected'}</Typography>
                </Grid>
              ) : (
                <Grid item xs={12} md={6}>
                  <Button component="label" variant="outlined" fullWidth>
                    Upload Business License Image
                    <input hidden type="file" accept="image/*" onChange={(e) => setForm({ ...form, business_license_image: e.target.files?.[0] || null })} />
                  </Button>
                  <Typography variant="caption" color="text.secondary">{form.business_license_image?.name || 'No file selected'}</Typography>
                </Grid>
              )}
            </Grid>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenCreate(false)}>Cancel</Button>
          <Button variant="contained" disabled={creating} onClick={async () => {
            try {
              setError('');
              // Basic validation
              if (!form.name || !form.subscription_id || !Array.isArray(form.category_ids) || form.category_ids.length < 1 || form.category_ids.length > 3) {
                setError('Please provide name, select 1-3 categories, and choose a subscription.');
                return;
              }
              if (!form.owner_user_id) {
                setError('Please select a Vendor Owner.');
                return;
              }
              if (!form.payment_method.name || !form.payment_method.account_number || !form.payment_method.account_holder) {
                setError('Please complete the payment method fields.');
                return;
              }
              if (!form.cover_image) {
                setError('Cover image is required.');
                return;
              }
              if (form.type === 'business' && !form.business_license_image) {
                setError('Business license image is required for Business vendors.');
                return;
              }
              setCreating(true);
              if (form.type === 'individual') {
                await vendorsApi.createIndividual({
                  name: form.name,
                  description: form.description,
                  category_ids: form.category_ids,
                  payment_method: form.payment_method,
                  subscription_id: form.subscription_id,
                  cover_image: form.cover_image,
                  fayda_image: form.fayda_image,
                  owner_user_id: form.owner_user_id,
                });
              } else {
                await vendorsApi.createBusiness({
                  name: form.name,
                  description: form.description,
                  category_ids: form.category_ids,
                  payment_method: form.payment_method,
                  subscription_id: form.subscription_id,
                  cover_image: form.cover_image,
                  business_license_image: form.business_license_image,
                  owner_user_id: form.owner_user_id,
                });
              }
              setOpenCreate(false);
              setForm({
                name: '', description: '', type: 'individual', category_ids: [], subscription_id: '',
                payment_method: { name: '', account_number: '', account_holder: '' },
                cover_image: null, fayda_image: null, business_license_image: null, owner_user_id: '',
              });
              dispatch(fetchVendors());
              setSnackbar({ open: true, message: 'Vendor created successfully', severity: 'success' });
            } catch (e) {
              setError(e?.response?.data?.error || e.message || 'Failed to create vendor');
            } finally {
              setCreating(false);
            }
          }}>Create</Button>
        </DialogActions>
      </Dialog>

      <Snackbar open={snackbar.open} autoHideDuration={4000} onClose={() => setSnackbar({ ...snackbar, open: false })}>
        <Alert severity={snackbar.severity} onClose={() => setSnackbar({ ...snackbar, open: false })}>{snackbar.message}</Alert>
      </Snackbar>
    </Box>
  );
};

export default VendorsPage;

