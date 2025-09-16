import React, { useEffect, useState } from 'react';
import { Box, Paper, Typography, TextField, Chip, Tooltip, IconButton, CircularProgress, Button, Dialog, DialogTitle, DialogContent, DialogActions, Stack, InputAdornment } from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import { Search, Visibility } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { usersApi, adminApi } from '../../utils/api';

export default function VendorOwnersPage() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 0, pageSize: 10, total: 0 });
  const [search, setSearch] = useState('');
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: '', phone_number: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [creating, setCreating] = useState(false);

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
        const res = await usersApi.list(pagination.page + 1, pagination.pageSize, 'vendor_owner');
        const list = res.data?.users || [];
        const total = res.data?.pagination?.total || list.length;
        setRows(list);
        setPagination((p) => ({ ...p, total }));
      } catch (e) {
        console.error('Failed to load vendor owners', e);
        setRows([]);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [pagination.page, pagination.pageSize]);

  const columns = [
    { field: 'id', headerName: 'ID', width: 70 },
    {
      field: 'name',
      headerName: 'Name',
      width: 200,
      renderCell: (params) => (
        <Box>
          <Typography variant="body2" fontWeight="medium">{params.value}</Typography>
          <Typography variant="caption" color="text.secondary">{params.row.email}</Typography>
        </Box>
      )
    },
    { field: 'phone_number', headerName: 'Phone', width: 160 },
    {
      field: 'is_verified',
      headerName: 'Verified',
      width: 110,
      renderCell: (params) => (
        <Chip size="small" label={params.value ? 'Yes' : 'No'} color={params.value ? 'success' : 'default'} />
      )
    },
    {
      field: 'created_at',
      headerName: 'Created',
      width: 140,
      renderCell: (params) => (
        <Typography variant="body2">{params.value ? new Date(params.value).toLocaleDateString() : '-'}</Typography>
      )
    },
    {
      field: 'actions',
      headerName: 'Actions',
      width: 120,
      renderCell: (params) => (
        <Tooltip title="View Details">
          <IconButton size="small" color="primary" onClick={() => navigate(`/users/${params.row.id}/detail`)}>
            <Visibility />
          </IconButton>
        </Tooltip>
      )
    }
  ];

  const filtered = rows.filter((u) =>
    (u.name || '').toLowerCase().includes(search.toLowerCase()) ||
    (u.email || '').toLowerCase().includes(search.toLowerCase()) ||
    (u.phone_number || '').includes(search)
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
        <Typography variant="h5" fontWeight={600}>Vendor Owners</Typography>
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
          <TextField
            placeholder="Search vendor owners..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            InputProps={{ startAdornment: <Search sx={{ mr: 1, color: 'text.secondary' }} /> }}
            sx={{ minWidth: 300 }}
          />
          <Button variant="contained" onClick={() => { setError(''); setOpen(true); }}>Create Vendor Owner</Button>
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

      {/* Create Vendor Owner Dialog */}
      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Create Vendor Owner</DialogTitle>
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
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>Cancel</Button>
          <Button variant="contained" disabled={creating} onClick={async () => {
            try {
              setError('');
              const fullPhone = '+251' + (form.phone_number || '');
              const normalized = normalizeEtPhone(fullPhone);
              if (!normalized || (form.phone_number || '').length !== 9) { setError('Enter a valid Ethiopian phone (9 digits after +251)'); return; }
              setCreating(true);
              await adminApi.createVendorOwner({ ...form, phone_number: normalized });
              setOpen(false);
              setForm({ name: '', phone_number: '', email: '', password: '' });
              // refresh list
              const res = await usersApi.list(pagination.page + 1, pagination.pageSize, 'vendor_owner');
              const list = res.data?.users || [];
              const total = res.data?.pagination?.total || list.length;
              setRows(list);
              setPagination((p) => ({ ...p, total }));
            } catch (e) {
              setError(e?.response?.data?.error || e.message || 'Failed to create vendor owner');
            } finally {
              setCreating(false);
            }
          }}>Create</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
