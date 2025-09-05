import React, { useEffect, useMemo, useState } from 'react';
import { Box, Paper, Typography, Button, Dialog, DialogTitle, DialogContent, DialogActions, TextField, IconButton, Tooltip, Snackbar, Alert } from '@mui/material';
import LoadingOverlay from '../../components/LoadingOverlay';
import { DataGrid } from '@mui/x-data-grid';
import { Add, Refresh, Visibility } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { fetchCategories, createCategory, updateCategoryWithImages, deleteCategoryThunk } from '../../store/slices/categoriesSlice';

// All API calls are handled in Redux thunks imported above

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
        const res = await dispatch(updateCategoryWithImages({ id: editing.id, name, description, keepImages: [], files }));
        if (updateCategoryWithImages.rejected.match(res)) throw new Error(res.payload);
        setSnackbar({ open: true, message: 'Category updated', severity: 'success' });
      } else {
        const res = await dispatch(createCategory({ name, description, files }));
        if (createCategory.rejected.match(res)) throw new Error(res.payload);
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

      <Paper sx={{ height: 'calc(100% - 56px)', position: 'relative' }}>
        <DataGrid rows={Array.isArray(items) ? items : []} columns={columns} loading={loading} hideFooter sx={{ height: '100%' }} />
        <LoadingOverlay open={loading} text="Loading categories..." />
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
              <input
                hidden
                multiple
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const incoming = Array.from(e.target.files || []);
                  setFiles((prev) => [...prev, ...incoming]);
                }}
              />
            </Button>
            {files.length > 0 && (
              <Typography variant="caption" sx={{ ml: 1 }}>{files.length} file(s) selected</Typography>
            )}
          </Box>
        </DialogContent>
        <DialogActions sx={{ position: 'relative' }}>
          <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={save}>Save</Button>
          <LoadingOverlay open={loading} text="Saving..." />
        </DialogActions>
      </Dialog>

      <Snackbar open={snackbar.open} autoHideDuration={4000} onClose={() => setSnackbar({ ...snackbar, open: false })}>
        <Alert severity={snackbar.severity} onClose={() => setSnackbar({ ...snackbar, open: false })}>{snackbar.message}</Alert>
      </Snackbar>
    </Box>
  );
};

export default CategoriesPage;


