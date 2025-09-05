import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { Box, Paper, Typography, Chip, Grid, Button, Divider, CircularProgress, Snackbar, Alert, Card, CardContent, CardHeader, Stack, Switch, FormControlLabel, Dialog, DialogTitle, DialogContent, DialogActions, TextField, IconButton } from '@mui/material';
import { AccountBalance, Visibility, Delete as DeleteIcon } from '@mui/icons-material';
import { fetchVendorDetail, approveVendor, deleteVendor } from '../../store/slices/vendorsSlice';
import WalletDetailModal from '../../components/WalletDetailModal';
import { vendorNotesApi, vendorPaymentsApi } from '../../utils/api';

const VendorDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { current: vendor, loading } = useSelector(state => state.vendors);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [confirmApproveOpen, setConfirmApproveOpen] = useState(false);
  const [pendingApprovalValue, setPendingApprovalValue] = useState(null);
  const [saving, setSaving] = useState(false);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [walletModalOpen, setWalletModalOpen] = useState(false);
  const [notes, setNotes] = useState([]);
  const [notesLoading, setNotesLoading] = useState(false);
  const [noteDialogOpen, setNoteDialogOpen] = useState(false);
  const [noteSaving, setNoteSaving] = useState(false);
  const [noteTitle, setNoteTitle] = useState('');
  const [noteDescription, setNoteDescription] = useState('');
  const [pmDialogOpen, setPmDialogOpen] = useState(false);
  const [pmSaving, setPmSaving] = useState(false);
  const [pmForm, setPmForm] = useState({ name: '', account_holder: '', account_number: '', type: '', details: '' });

  useEffect(() => {
    const run = async () => {
      const res = await dispatch(fetchVendorDetail(id));
      if (fetchVendorDetail.rejected.match(res)) {
        setSnackbar({ open: true, message: res.payload || 'Failed to load vendor', severity: 'error' });
      }
      await loadNotes();
    };
    run();
  }, [dispatch, id]);

  const loadNotes = async () => {
    try {
      setNotesLoading(true);
      const res = await vendorNotesApi.list(id);
      setNotes(Array.isArray(res.data?.notes) ? res.data.notes : []);
    } catch (e) {
      setSnackbar({ open: true, message: e.response?.data?.error || 'Failed to load notes', severity: 'error' });
    } finally {
      setNotesLoading(false);
    }
  };

  const openAddNote = () => {
    setNoteTitle('');
    setNoteDescription('');
    setNoteDialogOpen(true);
  };

  const saveNote = async () => {
    try {
      setNoteSaving(true);
      await vendorNotesApi.create(id, { title: noteTitle, description: noteDescription });
      setNoteDialogOpen(false);
      setSnackbar({ open: true, message: 'Note added', severity: 'success' });
      await loadNotes();
    } catch (e) {
      setSnackbar({ open: true, message: e.response?.data?.error || 'Failed to add note', severity: 'error' });
    } finally {
      setNoteSaving(false);
    }
  };

  const deleteNote = async (noteId) => {
    try {
      await vendorNotesApi.remove(id, noteId);
      setNotes((prev) => prev.filter((n) => n.id !== noteId));
      setSnackbar({ open: true, message: 'Note deleted', severity: 'success' });
    } catch (e) {
      setSnackbar({ open: true, message: e.response?.data?.error || 'Failed to delete note', severity: 'error' });
    }
  };

  const openAddPaymentMethod = () => {
    setPmForm({ name: '', account_holder: '', account_number: '', type: '', details: '' });
    setPmDialogOpen(true);
  };

  const savePaymentMethod = async () => {
    try {
      setPmSaving(true);
      const body = {
        name: pmForm.name,
        account_holder: pmForm.account_holder,
        account_number: pmForm.account_number,
        type: pmForm.type || undefined,
        details: pmForm.details ? { notes: pmForm.details } : undefined,
      };
      await vendorPaymentsApi.add(id, body);
      setPmDialogOpen(false);
      setSnackbar({ open: true, message: 'Payment method added', severity: 'success' });
      await dispatch(fetchVendorDetail(id));
    } catch (e) {
      setSnackbar({ open: true, message: e.response?.data?.error || 'Failed to add payment method', severity: 'error' });
    } finally {
      setPmSaving(false);
    }
  };

  const deletePaymentMethod = async (pmId) => {
    try {
      await vendorPaymentsApi.remove(id, pmId);
      setSnackbar({ open: true, message: 'Payment method deleted', severity: 'success' });
      await dispatch(fetchVendorDetail(id));
    } catch (e) {
      setSnackbar({ open: true, message: e.response?.data?.error || 'Failed to delete payment method', severity: 'error' });
    }
  };

  if (loading) return (
    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 400 }}>
      <CircularProgress />
    </Box>
  );

  if (!vendor) return null;

  return (
    <Box sx={{ width: '100%', p: 2 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2, width: '100%' }}>
        <Typography variant="h4" fontWeight="bold">Vendor Detail</Typography>
        <Button variant="outlined" onClick={() => navigate(-1)}>Back</Button>
      </Box>

      <Paper sx={{ p: 3, mb: 3, width: '100%' }}>
        <Grid container spacing={2}>
          <Grid item xs={12} md={8}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 2 }}>
              <Typography variant="h5" fontWeight="bold">{vendor.name}</Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Button color="error" variant="outlined" onClick={() => setConfirmDeleteOpen(true)}>Delete</Button>
                <FormControlLabel
                  control={
                    <Switch
                      checked={!!vendor.isApproved}
                      onChange={(e) => {
                        setPendingApprovalValue(e.target.checked);
                        setConfirmApproveOpen(true);
                      }}
                      color="success"
                    />
                  }
                  label={vendor.isApproved ? 'Approved' : 'Pending'}
                />
              </Box>
            </Box>
            <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
              <Chip label={vendor.type} color={vendor.type === 'business' ? 'primary' : 'secondary'} size="small" />
              <Chip label={vendor.isApproved ? 'Approved' : 'Pending'} color={vendor.isApproved ? 'success' : 'warning'} size="small" />
              <Chip label={vendor.status ? 'Active' : 'Inactive'} color={vendor.status ? 'success' : 'default'} size="small" />
            </Box>
            {/* Summary */}
            <Grid container spacing={2} sx={{ mt: 2 }}>
              <Grid item xs={12} md={6}>
                <Typography variant="caption" color="text.secondary">Name</Typography>
                <Typography variant="body2">{vendor.name || 'N/A'}</Typography>
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="caption" color="text.secondary">Type</Typography>
                <Typography variant="body2">{vendor.type}</Typography>
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="caption" color="text.secondary">Approved</Typography>
                <Box>
                  <Chip label={vendor.isApproved ? 'Yes' : 'No'} color={vendor.isApproved ? 'success' : 'warning'} size="small" />
                </Box>
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="caption" color="text.secondary">Active</Typography>
                <Box>
                  <Chip label={vendor.status ? 'Active' : 'Inactive'} color={vendor.status ? 'success' : 'default'} size="small" />
                </Box>
              </Grid>
              <Grid item xs={12}>
                <Typography variant="caption" color="text.secondary">Description</Typography>
                <Typography variant="body2">{vendor.description || 'No description provided.'}</Typography>
              </Grid>
            </Grid>

            <Divider sx={{ my: 2 }} />
            <Typography variant="subtitle1" fontWeight="bold">Categories</Typography>
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mt: 1 }}>
              {vendor.vendorCategories?.length ? vendor.vendorCategories.map(c => (
                <Chip key={c.id} label={c.name} size="small" />
              )) : (
                <Typography variant="body2" color="text.secondary">No categories</Typography>
              )}
            </Box>

            <Divider sx={{ my: 2 }} />
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="subtitle1" fontWeight="bold">Payment Methods</Typography>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Button size="small" variant="text" onClick={() => navigate(`/vendors/${id}/payment-methods`)}>See more</Button>
                <Button size="small" variant="outlined" onClick={openAddPaymentMethod}>Add</Button>
              </Box>
            </Box>
            {Array.isArray(vendor.paymentMethods) && vendor.paymentMethods.length > 0 ? (
              <Stack direction="column" spacing={2} sx={{ mt: 1 }}>
                {vendor.paymentMethods.map((pm, idx) => (
                  <Card key={idx} variant="outlined">
                    <CardHeader
                      title={pm.name || pm.type || 'Payment Method'}
                      subheader={pm.provider || pm.details?.provider || ''}
                      action={
                        <IconButton size="small" color="error" onClick={() => deletePaymentMethod(pm.id)}>
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      }
                    />
                    <CardContent>
                      <Grid container spacing={2}>
                        {pm.type && (
                          <Grid item xs={12} md={4}>
                            <Typography variant="caption" color="text.secondary">Type</Typography>
                            <Typography variant="body2">{pm.type}</Typography>
                          </Grid>
                        )}
                        {pm.account_holder && (
                          <Grid item xs={12} md={4}>
                            <Typography variant="caption" color="text.secondary">Account Holder</Typography>
                            <Typography variant="body2">{pm.account_holder}</Typography>
                          </Grid>
                        )}
                        {pm.account_number && (
                          <Grid item xs={12} md={4}>
                            <Typography variant="caption" color="text.secondary">Account / Number</Typography>
                            <Typography variant="body2">{pm.account_number}</Typography>
                          </Grid>
                        )}
                        {pm.details?.branch && (
                          <Grid item xs={12} md={4}>
                            <Typography variant="caption" color="text.secondary">Branch</Typography>
                            <Typography variant="body2">{pm.details.branch}</Typography>
                          </Grid>
                        )}
                        {pm.details?.notes && (
                          <Grid item xs={12}>
                            <Typography variant="caption" color="text.secondary">Notes</Typography>
                            <Typography variant="body2">{pm.details.notes}</Typography>
                          </Grid>
                        )}
                        {pm.created_at && (
                          <Grid item xs={12} md={4}>
                            <Typography variant="caption" color="text.secondary">Added</Typography>
                            <Typography variant="body2">{new Date(pm.created_at).toLocaleString()}</Typography>
                          </Grid>
                        )}
                      </Grid>
                    </CardContent>
                  </Card>
                ))}
              </Stack>
            ) : (
              <Typography variant="body2" color="text.secondary">No payment methods</Typography>
            )}

            {/* Notes below payment methods */}
            <Divider sx={{ my: 2 }} />
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="subtitle1" fontWeight="bold">Notes</Typography>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Button size="small" variant="text" onClick={() => navigate(`/vendors/${id}/notes`)}>See all</Button>
                <Button size="small" variant="outlined" onClick={openAddNote}>Add Note</Button>
              </Box>
            </Box>
            <Box sx={{ mt: 1, maxHeight: 260, overflowY: 'auto' }}>
              {notesLoading ? (
                <Typography variant="body2" color="text.secondary">Loading notes...</Typography>
              ) : notes.length === 0 ? (
                <Typography variant="body2" color="text.secondary">No notes yet</Typography>
              ) : (
                <Stack spacing={1}>
                  {notes.map((n) => (
                    <Paper key={n.id} variant="outlined" sx={{ p: 1 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography variant="subtitle2">{n.title}</Typography>
                        <IconButton size="small" color="error" onClick={() => deleteNote(n.id)}>
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Box>
                      <Typography variant="caption" color="text.secondary">{new Date(n.created_at).toLocaleString()}</Typography>
                      <Typography variant="body2" sx={{ mt: 0.5 }}>{n.description}</Typography>
                    </Paper>
                  ))}
                </Stack>
              )}
            </Box>
          </Grid>

          <Grid item xs={12} md={4}>
            <Typography variant="subtitle1" fontWeight="bold">Images</Typography>
            <Stack spacing={2} sx={{ mt: 1 }}>
              <Box>
                <Typography variant="caption" color="text.secondary">Cover Image</Typography>
                <Box sx={{ mt: 0.5 }}>
                  {vendor.cover_image?.image_url ? (
                    <img src={vendor.cover_image.image_url} alt="cover" style={{ width: '100%', maxWidth: 260, height: 140, objectFit: 'cover', borderRadius: 8 }} />
                  ) : (
                    <Typography variant="body2" color="text.secondary">No cover image</Typography>
                  )}
                </Box>
                {vendor.cover_image?.image_url && (
                  <Box sx={{ mt: 1 }}>
                    <Button size="small" variant="outlined" component="a" href={vendor.cover_image.image_url} target="_blank" rel="noopener noreferrer">View Fullscreen</Button>
                  </Box>
                )}
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary">Fayda Image</Typography>
                <Box sx={{ mt: 0.5 }}>
                  {vendor.fayda_image?.image_url ? (
                    <img src={vendor.fayda_image.image_url} alt="fayda" style={{ width: '100%', maxWidth: 260, height: 140, objectFit: 'cover', borderRadius: 8 }} />
                  ) : (
                    <Typography variant="body2" color="text.secondary">No fayda image</Typography>
                  )}
                </Box>
                {vendor.fayda_image?.image_url && (
                  <Box sx={{ mt: 1 }}>
                    <Button size="small" variant="outlined" component="a" href={vendor.fayda_image.image_url} target="_blank" rel="noopener noreferrer">View Fullscreen</Button>
                  </Box>
                )}
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary">Business License Image</Typography>
                <Box sx={{ mt: 0.5 }}>
                  {vendor.business_license_image?.image_url ? (
                    <img src={vendor.business_license_image.image_url} alt="license" style={{ width: '100%', maxWidth: 260, height: 140, objectFit: 'cover', borderRadius: 8 }} />
                  ) : (
                    <Typography variant="body2" color="text.secondary">No business license image</Typography>
                  )}
                </Box>
                {vendor.business_license_image?.image_url && (
                  <Box sx={{ mt: 1 }}>
                    <Button size="small" variant="outlined" component="a" href={vendor.business_license_image.image_url} target="_blank" rel="noopener noreferrer">View Fullscreen</Button>
                  </Box>
                )}
              </Box>
            </Stack>

            {/* Notes moved to left column */}

            <Dialog open={noteDialogOpen} onClose={() => setNoteDialogOpen(false)} maxWidth="sm" fullWidth>
              <DialogTitle>Add Note</DialogTitle>
              <DialogContent>
                <TextField
                  label="Title"
                  value={noteTitle}
                  onChange={(e) => setNoteTitle(e.target.value)}
                  fullWidth
                  sx={{ mt: 1 }}
                />
                <TextField
                  label="Description"
                  value={noteDescription}
                  onChange={(e) => setNoteDescription(e.target.value)}
                  fullWidth
                  multiline
                  rows={3}
                  sx={{ mt: 2 }}
                />
              </DialogContent>
              <DialogActions>
                <Button onClick={() => setNoteDialogOpen(false)} disabled={noteSaving}>Cancel</Button>
                <Button variant="contained" onClick={saveNote} disabled={noteSaving || !noteTitle || !noteDescription}>Save</Button>
              </DialogActions>
            </Dialog>
            <Typography variant="subtitle1" fontWeight="bold">Owner</Typography>
            <Stack spacing={0.5} sx={{ mt: 1 }}>
              <Typography variant="caption" color="text.secondary">Name</Typography>
              <Typography variant="body2">{vendor.user?.name || 'N/A'}</Typography>
              <Typography variant="caption" color="text.secondary" sx={{ mt: 1 }}>Phone</Typography>
              <Typography variant="body2">{vendor.user?.phone_number || 'N/A'}</Typography>
              <Typography variant="caption" color="text.secondary" sx={{ mt: 1 }}>Email</Typography>
              <Typography variant="body2">{vendor.user?.email || 'N/A'}</Typography>
              <Typography variant="caption" color="text.secondary" sx={{ mt: 1 }}>User Type</Typography>
              <Typography variant="body2">{vendor.user?.type || 'N/A'}</Typography>
            </Stack>

            <Divider sx={{ my: 2 }} />
            <Typography variant="subtitle1" fontWeight="bold">Subscription</Typography>
            {vendor.subscription ? (
              <Stack spacing={0.5} sx={{ mt: 1 }}>
                <Typography variant="caption" color="text.secondary">Plan</Typography>
                <Typography variant="body2">{vendor.subscription.plan}</Typography>
                <Typography variant="caption" color="text.secondary" sx={{ mt: 1 }}>Amount</Typography>
                <Typography variant="body2">{vendor.subscription.amount}</Typography>
                <Typography variant="caption" color="text.secondary" sx={{ mt: 1 }}>Start</Typography>
                <Typography variant="body2">{new Date(vendor.subscription.start_date).toLocaleString()}</Typography>
                <Typography variant="caption" color="text.secondary" sx={{ mt: 1 }}>End</Typography>
                <Typography variant="body2">{new Date(vendor.subscription.end_date).toLocaleString()}</Typography>
                <Typography variant="caption" color="text.secondary" sx={{ mt: 1 }}>Status</Typography>
                <Typography variant="body2">{vendor.subscription.status}</Typography>
              </Stack>
            ) : (
              <Typography variant="body2" color="text.secondary">No subscription</Typography>
            )}

            <Divider sx={{ my: 2 }} />
            <Typography variant="subtitle1" fontWeight="bold">Wallet</Typography>
            {vendor.wallet ? (
              <Stack spacing={1} sx={{ mt: 1 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Box>
                    <Typography variant="caption" color="text.secondary">Balance</Typography>
                    <Typography variant="h6" color="primary" fontWeight="bold">
                      ${vendor.wallet.balance?.toFixed(2) || '0.00'}
                    </Typography>
                  </Box>
                  <Chip 
                    label={vendor.wallet.status} 
                    color={vendor.wallet.status === 'active' ? 'success' : 'default'}
                    size="small"
                  />
                </Box>
                <Button
                  variant="outlined"
                  startIcon={<AccountBalance />}
                  onClick={() => setWalletModalOpen(true)}
                  size="small"
                  fullWidth
                >
                  See Wallet
                </Button>
              </Stack>
            ) : (
              <Box>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                  No wallet found
                </Typography>
                <Button
                  variant="outlined"
                  startIcon={<AccountBalance />}
                  onClick={() => setWalletModalOpen(true)}
                  size="small"
                  disabled
                >
                  See Vendor Wallet
                </Button>
              </Box>
            )}
          </Grid>
        </Grid>
      </Paper>

      {/* Confirm approval dialog */}
      <Dialog open={confirmApproveOpen} onClose={() => setConfirmApproveOpen(false)}>
        <DialogTitle>Confirm Approval Change</DialogTitle>
        <DialogContent>
          <Typography>Are you sure you want to set approval to "{pendingApprovalValue ? 'Approved' : 'Pending'}"?</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmApproveOpen(false)} disabled={saving}>Cancel</Button>
          <Button
            onClick={async () => {
              setSaving(true);
              try {
                const res = await dispatch(approveVendor({ vendor_id: vendor.id, isApproved: pendingApprovalValue }));
                if (approveVendor.fulfilled.match(res)) {
                  setSnackbar({ open: true, message: 'Approval updated', severity: 'success' });
                } else {
                  throw new Error(res.payload || 'Failed to update approval');
                }
              } catch (err) {
                setSnackbar({ open: true, message: err.message || 'Failed to update approval', severity: 'error' });
              } finally {
                setSaving(false);
                setConfirmApproveOpen(false);
              }
            }}
            variant="contained"
            color={pendingApprovalValue ? 'success' : 'warning'}
            disabled={saving}
          >
            {pendingApprovalValue ? 'Approve' : 'Set Pending'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Confirm delete dialog */}
      <Dialog open={confirmDeleteOpen} onClose={() => setConfirmDeleteOpen(false)}>
        <DialogTitle>Delete Vendor</DialogTitle>
        <DialogContent>
          <Typography>Are you sure you want to delete vendor "{vendor?.name}"? This action cannot be undone.</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmDeleteOpen(false)} disabled={saving}>Cancel</Button>
          <Button
            onClick={async () => {
              setSaving(true);
              try {
                const res = await dispatch(deleteVendor({ id: vendor.id }));
                if (deleteVendor.fulfilled.match(res)) {
                  setSnackbar({ open: true, message: 'Vendor deleted', severity: 'success' });
                  setConfirmDeleteOpen(false);
                  setTimeout(() => navigate('/vendors', { state: { snackbar: { open: true, message: 'Vendor deleted', severity: 'success' } } }), 300);
                } else {
                  throw new Error(res.payload || 'Failed to delete vendor');
                }
              } catch (err) {
                setSnackbar({ open: true, message: err.message || 'Failed to delete vendor', severity: 'error' });
              } finally {
                setSaving(false);
              }
            }}
            variant="contained"
            color="error"
            disabled={saving}
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar open={snackbar.open} autoHideDuration={4000} onClose={() => setSnackbar({ ...snackbar, open: false })}>
        <Alert severity={snackbar.severity} onClose={() => setSnackbar({ ...snackbar, open: false })}>{snackbar.message}</Alert>
      </Snackbar>

      {/* Add Payment Method Dialog */}
      <Dialog open={pmDialogOpen} onClose={() => setPmDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Add Payment Method</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 0 }}>
            <Grid item xs={12} md={6}>
              <TextField label="Name" value={pmForm.name} onChange={(e) => setPmForm({ ...pmForm, name: e.target.value })} fullWidth />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField label="Type" value={pmForm.type} onChange={(e) => setPmForm({ ...pmForm, type: e.target.value })} fullWidth />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField label="Account Holder" value={pmForm.account_holder} onChange={(e) => setPmForm({ ...pmForm, account_holder: e.target.value })} fullWidth />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField label="Account Number" value={pmForm.account_number} onChange={(e) => setPmForm({ ...pmForm, account_number: e.target.value })} fullWidth />
            </Grid>
            <Grid item xs={12}>
              <TextField label="Details (optional notes)" value={pmForm.details} onChange={(e) => setPmForm({ ...pmForm, details: e.target.value })} fullWidth multiline rows={2} />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPmDialogOpen(false)} disabled={pmSaving}>Cancel</Button>
          <Button variant="contained" onClick={savePaymentMethod} disabled={pmSaving || !pmForm.name || !pmForm.account_holder || !pmForm.account_number}>Save</Button>
        </DialogActions>
      </Dialog>

      {/* Wallet Detail Modal */}
      <WalletDetailModal
        open={walletModalOpen}
        onClose={() => setWalletModalOpen(false)}
        vendor={vendor}
      />
    </Box>
  );
};

export default VendorDetailPage;


