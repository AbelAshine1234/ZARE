import React, { useEffect, useMemo, useState } from 'react';
import { Box, Paper, Typography, Button, Dialog, DialogTitle, DialogContent, DialogActions, TextField, IconButton, Tooltip, Snackbar, Alert } from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import { Add, Refresh, Visibility } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { fetchCategories } from '../../store/slices/categoriesSlice';
import { createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../utils/api';

// Local thunk to create category with images
export const createCategoryThunk = createAsyncThunk('categories/createOne', async ({ name, description, files }, thunkAPI) => {
  try {
    const form = new FormData();
    form.append('name', name);
    form.append('description', description);
    files?.forEach(f => form.append('category_pictures', f));
    const res = await api.post('/api/category', form, { headers: { 'Content-Type': 'multipart/form-data' } });
    return res.data?.category;
  } catch (e) {
    return thunkAPI.rejectWithValue(e.response?.data?.error || 'Failed to create category');
  }
});

const CategoriesPage = () => {
  const dispatch = useDispatch();
  const { list: items, loading } = useSelector(state => state.categories);
  const navigate = useNavigate();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [files, setFiles] = useState([]);

  useEffect(() => { dispatch(fetchCategories()); }, [dispatch]);

  const openCreate = () => { setEditing(null); setName(''); setDescription(''); setFiles([]); setDialogOpen(true); };
  const openEdit = (row) => { setEditing(row); setName(row.name || ''); setDescription(row.description || ''); setFiles([]); setDialogOpen(true); };

  const save = async () => {
    try {
      if (editing) {
        const form = new FormData();
        form.append('name', name);
        form.append('description', description);
        files.forEach((f) => form.append('category_pictures', f));
        await api.put(`/api/category/${editing.id}`, form, { headers: { 'Content-Type': 'multipart/form-data' } });
        setSnackbar({ open: true, message: 'Category updated', severity: 'success' });
      } else {
        const res = await dispatch(createCategoryThunk({ name, description, files }));
        if (createCategoryThunk.rejected.match(res)) throw new Error(res.payload);
        setSnackbar({ open: true, message: 'Category created', severity: 'success' });
      }
      setDialogOpen(false);
      dispatch(fetchCategories());
    } catch (e) {
      setSnackbar({ open: true, message: e.message || 'Save failed', severity: 'error' });
    }
  };

  const remove = async (row) => {
    try {
      const res = await dispatch(deleteCategoryThunk({ id: row.id }));
      if (deleteCategoryThunk.rejected.match(res)) throw new Error(res.payload);
      setSnackbar({ open: true, message: 'Category deleted', severity: 'success' });
    } catch (e) {
      setSnackbar({ open: true, message: e.message || 'Delete failed', severity: 'error' });
    }
  };

  const columns = [
    { field: 'id', headerName: 'ID', width: 80 },
    { field: 'name', headerName: 'Name', width: 220 },
    { field: 'description', headerName: 'Description', flex: 1, minWidth: 200 },
    {
      field: 'actions', headerName: 'Actions', width: 100, renderCell: (p) => (
        <Box>
          <Tooltip title="View"><IconButton size="small" color="primary" onClick={() => navigate(`/categories/${p.row.id}`)}><Visibility /></IconButton></Tooltip>
        </Box>
      )
    }
  ];

  return (
    <Box sx={{ height: 'calc(100vh - 112px)' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h4" fontWeight="bold">Categories</Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button variant="outlined" startIcon={<Refresh />} onClick={() => dispatch(fetchCategories())}>Refresh</Button>
          <Button variant="contained" startIcon={<Add />} onClick={openCreate}>Add Category</Button>
        </Box>
      </Box>

      <Paper sx={{ height: 'calc(100% - 56px)' }}>
        <DataGrid rows={items} columns={columns} loading={loading} pagination={false} hideFooter sx={{ height: '100%' }} />
      </Paper>

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editing ? 'Edit Category' : 'Create Category'}</DialogTitle>
        <DialogContent>
          <TextField label="Name" value={name} onChange={(e) => setName(e.target.value)} fullWidth sx={{ mt: 1 }} />
          <TextField label="Description" value={description} onChange={(e) => setDescription(e.target.value)} fullWidth multiline rows={3} sx={{ mt: 2 }} />
          <Box sx={{ mt: 2 }}>
            <Typography variant="subtitle2" sx={{ mb: 1 }}>Images</Typography>
            <Button component="label" variant="outlined">
              Upload Images
              <input hidden multiple type="file" accept="image/*" onChange={(e) => setFiles(Array.from(e.target.files || []))} />
            </Button>
            {files.length > 0 && (
              <Typography variant="caption" sx={{ ml: 1 }}>{files.length} file(s) selected</Typography>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={save}>Save</Button>
        </DialogActions>
      </Dialog>

      <Snackbar open={snackbar.open} autoHideDuration={4000} onClose={() => setSnackbar({ ...snackbar, open: false })}>
        <Alert severity={snackbar.severity} onClose={() => setSnackbar({ ...snackbar, open: false })}>{snackbar.message}</Alert>
      </Snackbar>
    </Box>
  );
};

export default CategoriesPage;


