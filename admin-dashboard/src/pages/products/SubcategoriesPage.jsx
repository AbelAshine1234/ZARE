import React, { useEffect, useState } from 'react';
import { Box, Paper, Typography, Button, Dialog, DialogTitle, DialogContent, DialogActions, TextField, IconButton, Tooltip, Snackbar, Alert, FormControl, InputLabel, Select, MenuItem } from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import { Add, Edit, Delete, Refresh, Visibility } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { fetchSubcategories, createSubcategory, updateSubcategoryWithImages, deleteSubcategory } from '../../store/slices/subcategoriesSlice';
import { fetchCategories } from '../../store/slices/categoriesSlice';
import LoadingOverlay from '../../components/LoadingOverlay';

const SubcategoriesPage = () => {
  const dispatch = useDispatch();
  const { list: items, loading, createLoading, updateLoading } = useSelector(state => state.subcategories);
  const { list: categories } = useSelector(state => state.categories);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [name, setName] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [files, setFiles] = useState([]);
  const navigate = useNavigate();

  useEffect(() => { dispatch(fetchSubcategories()); dispatch(fetchCategories()); }, [dispatch]);

  const openCreate = () => { setEditing(null); setName(''); setCategoryId(''); setFiles([]); setDialogOpen(true); };
  const openEdit = (row) => { setEditing(row); setName(row.name || ''); setCategoryId(row.category_id || row.category?.id || ''); setFiles([]); setDialogOpen(true); };

  const save = async () => {
    try {
      if (!name || !categoryId) {
        setSnackbar({ open: true, message: 'Name and Category are required', severity: 'error' });
        return;
      }
      if (!editing) {
        if (!files.length) {
          setSnackbar({ open: true, message: 'subcategory_pictures is required', severity: 'error' });
          return;
        }
      }

      if (editing) {
        const res = await dispatch(updateSubcategoryWithImages({ id: editing.id, name, category_id: categoryId, keepImages: [], files }));
        if (updateSubcategoryWithImages.rejected.match(res)) {
          setSnackbar({ open: true, message: res.payload || 'Update failed', severity: 'error' });
          return;
        }
        setSnackbar({ open: true, message: 'Subcategory updated', severity: 'success' });
      } else {
        const res = await dispatch(createSubcategory({ name, category_id: categoryId, files }));
        if (createSubcategory.rejected.match(res)) {
          setSnackbar({ open: true, message: res.payload || 'Create failed', severity: 'error' });
          return;
        }
        setSnackbar({ open: true, message: 'Subcategory created', severity: 'success' });
      }
      setDialogOpen(false);
    } catch (e) {
      setSnackbar({ open: true, message: e.message || 'Save failed', severity: 'error' });
    }
  };

  const remove = async (row) => {
    try {
      const res = await dispatch(deleteSubcategory({ id: row.id }));
      if (deleteSubcategory.rejected.match(res)) {
        setSnackbar({ open: true, message: res.payload || 'Delete failed', severity: 'error' });
        return;
      }
      setSnackbar({ open: true, message: 'Subcategory deleted', severity: 'success' });
    } catch (e) {
      setSnackbar({ open: true, message: e.message || 'Delete failed', severity: 'error' });
    }
  };

  const columns = [
    { field: 'id', headerName: 'ID', width: 80 },
    { field: 'name', headerName: 'Name', width: 220 },
    { field: 'category', headerName: 'Category', flex: 1, minWidth: 200, valueGetter: (p) => p.row.category?.name || '' },
    {
      field: 'actions', headerName: 'Actions', width: 120, renderCell: (p) => (
        <Box>
          <Tooltip title="View"><IconButton size="small" color="primary" onClick={() => navigate(`/subcategories/${p.row.id}`)}><Visibility /></IconButton></Tooltip>
        </Box>
      )
    }
  ];

  return (
    <Box sx={{ height: 'calc(100vh - 112px)' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h4" fontWeight="bold">Subcategories</Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button variant="outlined" startIcon={<Refresh />} onClick={() => { dispatch(fetchSubcategories()); }}>Refresh</Button>
          <Button variant="contained" startIcon={<Add />} onClick={openCreate}>Add Subcategory</Button>
        </Box>
      </Box>

      <Paper sx={{ height: 'calc(100% - 56px)' }}>
        <DataGrid rows={Array.isArray(items) ? items : []} columns={columns} loading={loading} hideFooter sx={{ height: '100%' }} />
      </Paper>

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editing ? 'Edit Subcategory' : 'Create Subcategory'}</DialogTitle>
        <DialogContent sx={{ position: 'relative' }}>
          <LoadingOverlay open={createLoading || updateLoading} message={editing ? 'Updating...' : 'Creating...'} />
          <TextField label="Name" value={name} onChange={(e) => setName(e.target.value)} fullWidth sx={{ mt: 1 }} />
          <FormControl fullWidth sx={{ mt: 2 }}>
            <InputLabel>Category</InputLabel>
            <Select value={categoryId} label="Category" onChange={(e) => setCategoryId(e.target.value)}>
              {(Array.isArray(categories) ? categories : []).map(c => (
                <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>
              ))}
            </Select>
          </FormControl>
          <Box sx={{ mt: 2 }}>
            <Typography variant="subtitle2" sx={{ mb: 1 }}>Images (subcategory_pictures)</Typography>
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
          <Button onClick={() => setDialogOpen(false)} disabled={createLoading || updateLoading}>Cancel</Button>
          <Button variant="contained" onClick={save} disabled={createLoading || updateLoading}>Save</Button>
        </DialogActions>
      </Dialog>

      <Snackbar open={snackbar.open} autoHideDuration={4000} onClose={() => setSnackbar({ ...snackbar, open: false })}>
        <Alert severity={snackbar.severity} onClose={() => setSnackbar({ ...snackbar, open: false })}>{snackbar.message}</Alert>
      </Snackbar>
    </Box>
  );
};

export default SubcategoriesPage;


