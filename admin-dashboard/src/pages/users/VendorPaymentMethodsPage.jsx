import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Box, Paper, Typography, Grid, TextField, Button, Stack, IconButton, Snackbar, Alert } from '@mui/material';
import { ArrowBack, Delete as DeleteIcon } from '@mui/icons-material';
import { vendorPaymentsApi } from '../../utils/api';
import { useDispatch, useSelector } from 'react-redux';
import { fetchVendorDetail } from '../../store/slices/vendorsSlice';

const VendorPaymentMethodsPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { current: vendor } = useSelector(state => state.vendors);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ name: '', account_holder: '', account_number: '', type: '', details: '' });

  useEffect(() => { dispatch(fetchVendorDetail(id)); }, [dispatch, id]);

  const addPaymentMethod = async () => {
    try {
      setLoading(true);
      const body = {
        name: form.name,
        account_holder: form.account_holder,
        account_number: form.account_number,
        type: form.type || undefined,
        details: form.details ? { notes: form.details } : undefined,
      };
      await vendorPaymentsApi.add(id, body);
      setSnackbar({ open: true, message: 'Payment method added', severity: 'success' });
      setForm({ name: '', account_holder: '', account_number: '', type: '', details: '' });
      await dispatch(fetchVendorDetail(id));
    } catch (e) {
      setSnackbar({ open: true, message: e.response?.data?.error || 'Failed to add payment method', severity: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const removePaymentMethod = async (pmId) => {
    try {
      await vendorPaymentsApi.remove(id, pmId);
      setSnackbar({ open: true, message: 'Payment method deleted', severity: 'success' });
      await dispatch(fetchVendorDetail(id));
    } catch (e) {
      setSnackbar({ open: true, message: e.response?.data?.error || 'Failed to delete payment method', severity: 'error' });
    }
  };

  return (
    <Box sx={{ p: 2 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h4" fontWeight="bold">Vendor Payment Methods</Typography>
        <Button startIcon={<ArrowBack />} variant="outlined" onClick={() => navigate(-1)}>Back</Button>
      </Box>

      <Paper sx={{ p: 2, mb: 2 }}>
        <Typography variant="subtitle1" fontWeight="bold">Add Payment Method</Typography>
        <Grid container spacing={2} sx={{ mt: 1 }}>
          <Grid item xs={12} md={3}>
            <TextField label="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} fullWidth />
          </Grid>
          <Grid item xs={12} md={3}>
            <TextField label="Account Holder" value={form.account_holder} onChange={(e) => setForm({ ...form, account_holder: e.target.value })} fullWidth />
          </Grid>
          <Grid item xs={12} md={3}>
            <TextField label="Account Number" value={form.account_number} onChange={(e) => setForm({ ...form, account_number: e.target.value })} fullWidth />
          </Grid>
          <Grid item xs={12} md={3}>
            <TextField label="Type" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} fullWidth />
          </Grid>
          <Grid item xs={12}>
            <TextField label="Details (optional notes)" value={form.details} onChange={(e) => setForm({ ...form, details: e.target.value })} fullWidth multiline rows={2} />
          </Grid>
          <Grid item xs={12}>
            <Button variant="contained" onClick={addPaymentMethod} disabled={loading || !form.name || !form.account_holder || !form.account_number}>Add</Button>
          </Grid>
        </Grid>
      </Paper>

      <Paper sx={{ p: 2 }}>
        <Typography variant="subtitle1" fontWeight="bold">Existing Payment Methods</Typography>
        <Stack spacing={1} sx={{ mt: 1 }}>
          {Array.isArray(vendor?.paymentMethods) && vendor.paymentMethods.length > 0 ? (
            vendor.paymentMethods.map((pm) => (
              <Paper key={pm.id} variant="outlined" sx={{ p: 1 }}>
                <Grid container spacing={2} alignItems="center">
                  <Grid item xs={12} md={3}><Typography variant="body2"><b>{pm.name}</b></Typography></Grid>
                  <Grid item xs={12} md={3}><Typography variant="body2">{pm.account_holder}</Typography></Grid>
                  <Grid item xs={12} md={3}><Typography variant="body2">{pm.account_number}</Typography></Grid>
                  <Grid item xs={12} md={2}><Typography variant="body2">{pm.type || '-'}</Typography></Grid>
                  <Grid item xs={12} md={1} sx={{ textAlign: 'right' }}>
                    <IconButton size="small" color="error" onClick={() => removePaymentMethod(pm.id)}>
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </Grid>
                </Grid>
              </Paper>
            ))
          ) : (
            <Typography variant="body2" color="text.secondary">No payment methods</Typography>
          )}
        </Stack>
      </Paper>

      <Snackbar open={snackbar.open} autoHideDuration={4000} onClose={() => setSnackbar({ ...snackbar, open: false })}>
        <Alert severity={snackbar.severity} onClose={() => setSnackbar({ ...snackbar, open: false })}>{snackbar.message}</Alert>
      </Snackbar>
    </Box>
  );
};

export default VendorPaymentMethodsPage;


