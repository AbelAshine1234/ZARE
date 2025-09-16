import React, { useEffect, useState } from 'react';
import { Box, Paper, Typography, TextField, Chip, Tooltip, IconButton, CircularProgress, Button, Dialog, DialogTitle, DialogContent, DialogActions, Stack, FormControl, InputLabel, Select, MenuItem, InputAdornment } from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import { Search, Visibility } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { adminApi } from '../../utils/api';

const EmployeesPage = () => {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 0, pageSize: 10, total: 0 });
  const [search, setSearch] = useState('');
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: '', phone_number: '', email: '', password: '', vendor_id: '', role: '' });
  const [error, setError] = useState('');
  const [creating, setCreating] = useState(false);
  const [vendors, setVendors] = useState([]);

  // Normalize Ethiopian phone numbers to +2519XXXXXXXX
  const normalizeEtPhone = (input) => {
    if (!input) return null;
    let v = String(input).replace(/\s|-/g, '');
    if (v.startsWith('+251')) return v;
    if (v.startsWith('0') && v.length === 10) return '+251' + v.slice(1);
    if (v.length === 9 && v[0] === '9') return '+251' + v;
    return null;
  };

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const res = await adminApi.employees(pagination.page + 1, pagination.pageSize);
        const list = res.data?.employees || [];
        const total = res.data?.pagination?.total || list.length;
        setRows(list);
        setPagination((p) => ({ ...p, total }));
      } catch (e) {
        console.error('Failed to load employees', e);
        setRows([]);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [pagination.page, pagination.pageSize]);

  useEffect(() => {
    const loadVendors = async () => {
      try {
        const res = await adminApi.vendors(1, 100);
        setVendors(res.data?.vendors || []);
      } catch (e) {
        console.error('Failed to load vendors for employees dialog', e);
      }
    };
    loadVendors();
  }, []);

  const columns = [
    { field: 'id', headerName: 'ID', width: 70 },
    {
      field: 'user_name',
      headerName: 'Name',
      width: 180,
      valueGetter: (params) => params.row.user?.name || '',
      renderCell: (params) => (
        <Box>
          <Typography variant="body2" fontWeight="medium">{params.row.user?.name || '-'}</Typography>
          <Typography variant="caption" color="text.secondary">{params.row.user?.email || ''}</Typography>
        </Box>
      )
    },
    { field: 'phone', headerName: 'Phone', width: 140, valueGetter: (p) => p.row.user?.phone_number || '' },
    {
      field: 'role',
      headerName: 'Role',
      width: 130,
      renderCell: (params) => (
        <Chip size="small" label={params.row.role} />
      )
    },
    { field: 'vendor', headerName: 'Vendor', width: 180, valueGetter: (p) => p.row.vendor?.name || '' },
    {
      field: 'actions',
      headerName: 'Actions',
      width: 120,
      renderCell: (params) => (
        <Tooltip title="View Details">
          <IconButton size="small" color="primary" onClick={() => navigate(`/users/${params.row.user?.id}/detail`)}>
            <Visibility />
          </IconButton>
        </Tooltip>
      )
    }
  ];

  const filtered = rows.filter((r) =>
    (r.user?.name || '').toLowerCase().includes(search.toLowerCase()) ||
    (r.user?.email || '').toLowerCase().includes(search.toLowerCase()) ||
    (r.user?.phone_number || '').includes(search) ||
    (r.vendor?.name || '').toLowerCase().includes(search.toLowerCase())
  );

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 400 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h5" fontWeight={600}>Employees</Typography>
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
          <TextField
            placeholder="Search employees..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            InputProps={{ startAdornment: <Search sx={{ mr: 1, color: 'text.secondary' }} /> }}
            sx={{ minWidth: 300 }}
          />
          <Button variant="contained" onClick={() => { setError(''); setOpen(true); }}>Create Employee</Button>
        </Box>
      </Box>

      <Paper sx={{ height: 600 }}>
        <DataGrid
          rows={filtered}
          columns={columns}
          pagination
          paginationMode="server"
          rowCount={pagination.total}
          paginationModel={{ page: pagination.page, pageSize: pagination.pageSize }}
          onPaginationModelChange={(m) => setPagination(m)}
          pageSizeOptions={[10, 25, 50]}
          disableSelectionOnClick
        />
      </Paper>

      {/* Create Employee Dialog */}
      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Create Employee</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ pt: 1 }}>
            {error && (<Typography variant="body2" color="error">{error}</Typography>)}
            <TextField label="Name" fullWidth value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            <TextField
              label="Phone Number"
              fullWidth
              helperText="Ethiopia only. Enter 9 digits after +251."
              value={form.phone_number}
              onChange={(e) => {
                const digits = (e.target.value || '').replace(/\D/g, '').slice(0, 9);
                setForm({ ...form, phone_number: digits });
              }}
              InputProps={{
                startAdornment: <InputAdornment position="start">+251</InputAdornment>,
                inputMode: 'numeric',
              }}
            />
            <TextField label="Email (optional)" type="email" fullWidth helperText="Optional" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            <TextField label="Password" type="password" fullWidth value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
            <FormControl fullWidth>
              <InputLabel>Vendor</InputLabel>
              <Select value={form.vendor_id} label="Vendor" onChange={(e) => setForm({ ...form, vendor_id: e.target.value })}>
                {vendors.map(v => (
                  <MenuItem key={v.id} value={v.id}>{v.name}</MenuItem>
                ))}
              </Select>
            </FormControl>
            <TextField label="Role" fullWidth value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>Cancel</Button>
          <Button variant="contained" disabled={creating} onClick={async () => {
            try {
              setError('');
              const fullPhone = '+251' + (form.phone_number || '');
              const normalized = normalizeEtPhone(fullPhone);
              if (!normalized || (form.phone_number || '').length !== 9 || !form.vendor_id || !form.role) { setError('Enter a valid Ethiopian phone (9 digits after +251), vendor and role'); return; }
              setCreating(true);
              await adminApi.createEmployee({ ...form, phone_number: normalized });
              setOpen(false);
              setForm({ name: '', phone_number: '', email: '', password: '', vendor_id: '', role: '' });
              // refresh list
              const res = await adminApi.employees(pagination.page + 1, pagination.pageSize);
              const list = res.data?.employees || [];
              const total = res.data?.pagination?.total || list.length;
              setRows(list);
              setPagination((p) => ({ ...p, total }));
            } catch (e) {
              setError(e?.response?.data?.error || e.message || 'Failed to create employee');
            } finally {
              setCreating(false);
            }
          }}>Create</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default EmployeesPage;
