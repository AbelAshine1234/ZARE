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
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem
} from '@mui/material';
import { Add, Delete, Refresh, Save, DeleteOutline } from '@mui/icons-material';
import { useDispatch, useSelector } from 'react-redux';
import { fetchSubcategoryDetail, updateSubcategoryWithImages, deleteSubcategory as deleteSubcategoryThunk } from '../../store/slices/subcategoriesSlice';
import { fetchCategories } from '../../store/slices/categoriesSlice';
// no direct API calls here; all via Redux thunks
import LoadingOverlay from '../../components/LoadingOverlay';

const SubcategoryDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { current: subcategory, loading: subLoading } = useSelector(state => state.subcategories);
  const { list: categories } = useSelector(state => state.categories);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [selectedImageIds, setSelectedImageIds] = useState(new Set());
  const [newFiles, setNewFiles] = useState([]);
  const [name, setName] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showNewPreviews, setShowNewPreviews] = useState([]);
  const [confirmSaveOpen, setConfirmSaveOpen] = useState(false);

  useEffect(() => {
    (async () => {
      await dispatch(fetchCategories());
      const action = await dispatch(fetchSubcategoryDetail(id));
      if (fetchSubcategoryDetail.fulfilled.match(action)) {
        const sc = action.payload;
        setName(sc?.name || '');
        setCategoryId(sc?.category_id || sc?.category?.id || '');
        setSelectedImageIds(new Set((sc?.images || []).map(img => img.id)));
      } else {
        setSnackbar({ open: true, message: action.payload || 'Failed to load subcategory', severity: 'error' });
      }
    })();
  }, [dispatch, id]);

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
      const res = await dispatch(updateSubcategoryWithImages({ id, name, category_id: categoryId, keepImages: keepImagesArray, files: newFiles }));
      if (updateSubcategoryWithImages.rejected.match(res)) throw new Error(res.payload);
      setSnackbar({ open: true, message: 'Subcategory updated', severity: 'success' });
      setConfirmSaveOpen(false);
      setNewFiles([]);
      setShowNewPreviews([]);
    } catch (e) {
      setSnackbar({ open: true, message: e.message || 'Update failed', severity: 'error' });
    } finally {
      setSaving(false);
      setConfirmSaveOpen(false);
    }
  };

  const handleDelete = async () => {
    setSaving(true);
    try {
      const res = await dispatch(deleteSubcategoryThunk({ id }));
      if (deleteSubcategoryThunk.rejected.match(res)) throw new Error(res.payload);
      setSnackbar({ open: true, message: 'Subcategory deleted', severity: 'success' });
      setConfirmDeleteOpen(false);
      setTimeout(() => navigate('/subcategories'), 300);
    } catch (e) {
      setSnackbar({ open: true, message: e.message || 'Delete failed', severity: 'error' });
    } finally {
      setSaving(false);
    }
  };

  if (subLoading && !subcategory) {
    return (
      <Box sx={{ position: 'relative', height: 400 }}>
        <LoadingOverlay open text="Loading subcategory..." />
      </Box>
    );
  }

  if (!subcategory) return null;

  return (
    <Box sx={{ height: 'calc(100vh - 64px)', width: '100%', p: 2 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Box>
          <Typography variant="h4" fontWeight="bold">Subcategory Detail</Typography>
          <Typography variant="caption" color="text.secondary">API: /api/subcategory/{id}</Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button variant="outlined" color="secondary" startIcon={<Refresh />} onClick={async () => { await dispatch(fetchCategories()); await dispatch(fetchSubcategoryDetail(id)); }}>Refresh</Button>
          <Button variant="contained" color="success" startIcon={<Save />} onClick={() => setConfirmSaveOpen(true)} disabled={saving}>Save Changes</Button>
          <Button color="error" variant="contained" startIcon={<Delete />} onClick={() => setConfirmDeleteOpen(true)}>Delete</Button>
        </Box>
      </Box>

      <Paper sx={{ p: 3, mb: 3, position: 'relative' }}>
        <LoadingOverlay open={saving} text={saving ? 'Saving...' : ''} />
        <Grid container spacing={2}>
          <Grid item xs={12} md={12}>
            <TextField
              label="Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              fullWidth
            />
            <FormControl fullWidth sx={{ mt: 2 }}>
              <InputLabel>Category</InputLabel>
              <Select value={categoryId} label="Category" onChange={(e) => setCategoryId(e.target.value)}>
                {categories.map(c => (
                  <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>
                ))}
              </Select>
            </FormControl>

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
              {(subcategory.images || []).map(img => (
                <Grid item xs={12} sm={6} md={4} key={img.id}>
                  <Box sx={{ position: 'relative', borderRadius: 1, overflow: 'hidden', border: '1px solid #eee' }}>
                    <img src={img.image_url} alt="subcategory" style={{ width: '100%', height: 200, objectFit: 'cover', filter: selectedImageIds.has(img.id) ? 'none' : 'grayscale(60%)' }} />
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
      <Dialog open={confirmDeleteOpen && !saving} onClose={() => setConfirmDeleteOpen(false)}>
        <DialogTitle>Delete Subcategory</DialogTitle>
        <DialogContent>
          <Typography>Are you sure you want to delete "{subcategory?.name}"? This will also remove its images.</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmDeleteOpen(false)} disabled={saving}>Cancel</Button>
          <Button color="error" variant="contained" onClick={handleDelete} disabled={saving}>Delete</Button>
        </DialogActions>
      </Dialog>

      {/* Confirm save */}
      <Dialog open={confirmSaveOpen && !saving} onClose={() => setConfirmSaveOpen(false)}>
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

export default SubcategoryDetailPage;


