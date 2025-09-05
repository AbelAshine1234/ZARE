import React, { useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchDeletedVendors, restoreVendor, purgeVendor } from '../../store/slices/vendorsSlice';
import { Box, Paper, Typography, Button, Snackbar, Alert, IconButton, Tooltip } from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import { DeleteForever, Restore } from '@mui/icons-material';

const RecycleBinVendorsPage = () => {
  const dispatch = useDispatch();
  const { deleted, loading } = useSelector(state => state.vendors);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  useEffect(() => { dispatch(fetchDeletedVendors()); }, [dispatch]);

  const rows = useMemo(() => deleted.map(v => ({
    id: v.id,
    name: v.name,
    owner: v.user?.name,
    categories: v.categories?.map(c => c.name).join(', '),
    deletedAt: v.deletedAt ? new Date(v.deletedAt).toLocaleString() : '-',
  })), [deleted]);

  const columns = [
    { field: 'id', headerName: 'ID', width: 80 },
    { field: 'name', headerName: 'Name', width: 220 },
    { field: 'owner', headerName: 'Owner', width: 180 },
    { field: 'categories', headerName: 'Categories', width: 260 },
    { field: 'deletedAt', headerName: 'Deleted At', width: 180 },
    { field: 'actions', headerName: 'Actions', width: 140, renderCell: (p) => (
      <Box>
        <Tooltip title="Restore">
          <IconButton size="small" color="success" onClick={async () => {
            const res = await dispatch(restoreVendor({ id: p.row.id }));
            if (restoreVendor.fulfilled.match(res)) setSnackbar({ open: true, message: 'Vendor restored', severity: 'success' });
            else setSnackbar({ open: true, message: res.payload || 'Failed to restore', severity: 'error' });
          }}>
            <Restore />
          </IconButton>
        </Tooltip>
        <Tooltip title="Delete Permanently">
          <IconButton size="small" color="error" onClick={async () => {
            const res = await dispatch(purgeVendor({ id: p.row.id }));
            if (purgeVendor.fulfilled.match(res)) setSnackbar({ open: true, message: 'Vendor permanently deleted', severity: 'success' });
            else setSnackbar({ open: true, message: res.payload || 'Failed to delete', severity: 'error' });
          }}>
            <DeleteForever />
          </IconButton>
        </Tooltip>
      </Box>
    ) },
  ];

  return (
    <Box sx={{ height: 'calc(100vh - 112px)' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h4" fontWeight="bold">Recycle Bin - Vendors</Typography>
        <Button variant="outlined" onClick={() => dispatch(fetchDeletedVendors())}>Refresh</Button>
      </Box>
      <Paper sx={{ height: 'calc(100% - 60px)' }}>
        <DataGrid rows={rows} columns={columns} loading={loading} hideFooter sx={{ height: '100%' }} />
      </Paper>
      <Snackbar open={snackbar.open} autoHideDuration={4000} onClose={() => setSnackbar({ ...snackbar, open: false })}>
        <Alert severity={snackbar.severity} onClose={() => setSnackbar({ ...snackbar, open: false })}>{snackbar.message}</Alert>
      </Snackbar>
    </Box>
  );
};

export default RecycleBinVendorsPage;


