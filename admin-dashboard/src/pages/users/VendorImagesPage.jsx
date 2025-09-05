import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Box, Typography, Button, Grid, CircularProgress, Snackbar, Alert, Paper } from '@mui/material';
import api from '../../utils/api';

const VendorImagesPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [vendor, setVendor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  const load = async () => {
    try {
      const res = await api.get(`/api/vendors/${id}`);
      setVendor(res.data.vendor);
    } catch (e) {
      setSnackbar({ open: true, message: e.response?.data?.error || 'Failed to load images', severity: 'error' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [id]);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 400 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!vendor) return null;

  const images = [
    { key: 'cover_image', title: 'Cover Image', url: vendor.cover_image?.image_url },
    { key: 'fayda_image', title: 'Fayda Image', url: vendor.fayda_image?.image_url },
    { key: 'business_license_image', title: 'Business License Image', url: vendor.business_license_image?.image_url },
  ];

  return (
    <Box sx={{ width: '100%', p: 2 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
        <Typography variant="h4" fontWeight="bold">Vendor Images</Typography>
        <Button variant="outlined" onClick={() => navigate(-1)}>Back</Button>
      </Box>

      <Paper sx={{ p: 2 }}>
        <Grid container spacing={2}>
          {images.map(img => (
            <Grid item xs={12} md={4} key={img.key}>
              <Typography variant="subtitle2" sx={{ mb: 1 }}>{img.title}</Typography>
              {img.url ? (
                <img src={img.url} alt={img.key} style={{ width: '100%', height: 'auto', borderRadius: 8 }} />
              ) : (
                <Typography variant="body2" color="text.secondary">No image</Typography>
              )}
            </Grid>
          ))}
        </Grid>
      </Paper>

      <Snackbar open={snackbar.open} autoHideDuration={4000} onClose={() => setSnackbar({ ...snackbar, open: false })}>
        <Alert severity={snackbar.severity} onClose={() => setSnackbar({ ...snackbar, open: false })}>{snackbar.message}</Alert>
      </Snackbar>
    </Box>
  );
};

export default VendorImagesPage;


