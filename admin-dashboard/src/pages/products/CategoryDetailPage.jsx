import React, { useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Paper,
  Typography,
  Grid,
  Chip,
  Button,
  IconButton,
  Tooltip,
  Divider,
  Snackbar,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField
} from '@mui/material';
import { Add, Delete, Refresh, Save, DeleteOutline } from '@mui/icons-material';
import api from '../../utils/api';
import { useDispatch, useSelector } from 'react-redux';
import { fetchCategoryDetail, updateCategoryWithImages, fetchCategorySubcategories, deleteCategoryThunk } from '../../store/slices/categoriesSlice';

const CategoryDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { current, loading: catLoading } = useSelector(s => s.categories || {});
  const [category, setCategory] = useState(null);
  const { currentSubcategories } = useSelector(s => s.categories || {});
  const [loading, setLoading] = useState(true);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [selectedImageIds, setSelectedImageIds] = useState(new Set());
  const [newFiles, setNewFiles] = useState([]);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showNewPreviews, setShowNewPreviews] = useState([]);
  const [confirmSaveOpen, setConfirmSaveOpen] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const action = await dispatch(fetchCategoryDetail(id));
      if (fetchCategoryDetail.fulfilled.match(action)) {
        const cat = action.payload;
        setCategory(cat);
        setName(cat?.name || '');
        setDescription(cat?.description || '');
        setSelectedImageIds(new Set((cat?.images || []).map(img => img.id)));
        await dispatch(fetchCategorySubcategories(id));
      } else {
        setSnackbar({ open: true, message: action.payload || 'Failed to load category', severity: 'error' });
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [id]);

  const keepImagesArray = useMemo(() => Array.from(selectedImageIds), [selectedImageIds]);

  const toggleKeepImage = (imageId) => {
    setSelectedImageIds(prev => {
      const copy = new Set(prev);
      if (copy.has(imageId)) copy.delete(imageId); else copy.add(imageId);
      return copy;
    });
  };

  const onSave = async () => {
    setSaving(true);
    try {
      const action = await dispatch(updateCategoryWithImages({ id, name, description, keepImages: keepImagesArray, files: newFiles }));
      if (updateCategoryWithImages.fulfilled.match(action)) {
        setSnackbar({ open: true, message: 'Category updated', severity: 'success' });
    setConfirmSaveOpen(false);

        setNewFiles([]);
        setShowNewPreviews([]);
        await load();
      } else {
        setSnackbar({ open: true, message: action.payload || 'Update failed', severity: 'error' });
      }
    } finally {
      setSaving(false);
    setConfirmSaveOpen(false);

    }
  };

  const deleteCategory = async () => {
    setSaving(true);
    try {
      await dispatch(deleteCategoryThunk({ id }));
      setSnackbar({ open: true, message: 'Category deleted', severity: 'success' });
      setConfirmDeleteOpen(false);
      setTimeout(() => navigate('/categories'), 300);
    } catch (e) {
      setSnackbar({ open: true, message: e.response?.data?.error || 'Delete failed', severity: 'error' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 400 }}>
        <Typography>Loading...</Typography>
      </Box>
    );
  }

  if (!category) return null;

  return (
    <Box sx={{ height: 'calc(100vh - 64px)', width: '100%', p: 2 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Box>
          <Typography variant="h4" fontWeight="bold">Category Detail</Typography>
          <Typography variant="caption" color="text.secondary">API: /api/category/{id} | Subcategories: /api/category/{id}/subcategories</Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button variant="outlined" color="secondary" startIcon={<Refresh />} onClick={load}>Refresh</Button>
          <Button variant="contained" color="success" startIcon={<Save />} onClick={() => setConfirmSaveOpen(true)} disabled={saving}>Save Changes</Button>
          <Button color="error" variant="contained" startIcon={<Delete />} onClick={() => setConfirmDeleteOpen(true)}>Delete</Button>
        </Box>
      </Box>

      <Paper sx={{ p: 3, mb: 3 }}>
        <Grid container spacing={2}>
          <Grid item xs={12} md={12}>
            <TextField
              label="Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              fullWidth
            />
            <TextField
              label="Description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              fullWidth
              multiline
              rows={3}
              sx={{ mt: 2 }}
            />

            <Divider sx={{ my: 2 }} />
            <Typography variant="subtitle1" fontWeight="bold">Subcategories ({currentSubcategories.length})</Typography>
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mt: 1 }}>
              {currentSubcategories.length ? currentSubcategories.map(sc => (
                <Chip key={sc.id} label={sc.name} />
              )) : (
                <Typography variant="body2" color="text.secondary">No subcategories</Typography>
              )}
            </Box>
            <Divider sx={{ my: 2 }} />
            <Typography variant="subtitle1" fontWeight="bold">Images</Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', mt: 1, mb: 1 }}>
              <Button component="label" variant="outlined" startIcon={<Add />}>Add Images
                <input hidden multiple type="file" accept="image/*" onChange={(e) => {
                  const files = Array.from(e.target.files || []);
                  setNewFiles(files);
                  setShowNewPreviews(files.map(f => URL.createObjectURL(f)));
                }} />
              </Button>
            </Box>
            <Grid container spacing={1}>
              {(category.images || []).map(img => (
                <Grid item xs={12} sm={6} md={4} key={img.id}>
                  <Box sx={{ position: 'relative', borderRadius: 1, overflow: 'hidden', border: '1px solid #eee' }}>
                    <img src={img.image_url} alt="category" style={{ width: '100%', height: 200, objectFit: 'cover', filter: selectedImageIds.has(img.id) ? 'none' : 'grayscale(60%)' }} />
                    <IconButton
                      size="small"
                      onClick={() => toggleKeepImage(img.id)}
                      sx={{ position: 'absolute', top: 6, right: 6, bgcolor: 'rgba(255,255,255,0.8)' }}
                      color={selectedImageIds.has(img.id) ? 'default' : 'error'}
                    >
                      <DeleteOutline />
                    </IconButton>
                  </Box>
                </Grid>
              ))}
              {showNewPreviews.length > 0 && showNewPreviews.map((src, idx) => (
                <Grid item xs={12} sm={6} md={4} key={`new-${idx}`}>
                  <Box sx={{ position: 'relative', borderRadius: 1, overflow: 'hidden', border: '1px solid #c8e6c9' }}>
                    <img src={src} alt="new" style={{ width: '100%', height: 200, objectFit: 'cover' }} />
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mt: 0.5 }}>
                    <Chip label="New image" color="primary" size="small" />
                  </Box>
                </Grid>
              ))}
            </Grid>
          </Grid>
        </Grid>
      </Paper>

      {/* Confirm delete */}
      <Dialog open={confirmDeleteOpen} onClose={() => setConfirmDeleteOpen(false)}>
        <DialogTitle>Delete Category</DialogTitle>
        <DialogContent>
          <Typography>Are you sure you want to delete "{category?.name}"? This will also remove its images.</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmDeleteOpen(false)} disabled={saving}>Cancel</Button>
          <Button color="error" variant="contained" onClick={deleteCategory} disabled={saving}>Delete</Button>
        </DialogActions>
      </Dialog>

      {/* Confirm save */}
      <Dialog open={confirmSaveOpen} onClose={() => setConfirmSaveOpen(false)}>
        <DialogTitle>Confirm Save</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to save changes? Images with the minus icon are marked for deletion. Kept images remain; new images will be added.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmSaveOpen(false)} disabled={saving}>Cancel</Button>
          <Button variant="contained" onClick={onSave} disabled={saving}>Save</Button>
        </DialogActions>
      </Dialog>

      <Snackbar open={snackbar.open} autoHideDuration={4000} onClose={() => setSnackbar({ ...snackbar, open: false })}>
        <Alert severity={snackbar.severity} onClose={() => setSnackbar({ ...snackbar, open: false })}>{snackbar.message}</Alert>
      </Snackbar>
    </Box>
  );
};

export default CategoryDetailPage;


