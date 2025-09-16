import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Box,
  Paper,
  Typography,
  Stack,
  Chip,
  Divider,
  Skeleton,
  Avatar,
  Button,
  Grid,
  TextField,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import { ArrowBack, Edit, Delete } from '@mui/icons-material';
import { usersApi } from '../../utils/api';

const Row = ({ label, value }) => (
  <Stack direction="row" spacing={2} sx={{ py: 0.5 }}>
    <Typography variant="body2" color="text.secondary" sx={{ minWidth: 180 }}>
      {label}
    </Typography>
    <Typography variant="body2">{value ?? '-'}</Typography>
  </Stack>
);

const Section = ({ title, children, sx }) => (
  <Paper sx={{ p: 2, ...sx }}>
    <Typography variant="h6" sx={{ mb: 1 }}>{title}</Typography>
    <Divider sx={{ mb: 2 }} />
    {children}
  </Paper>
);

export default function UserDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [adding, setAdding] = useState(false);
  const [pmForm, setPmForm] = useState({ name: '', account_number: '', account_holder: '', type: 'external', details: '' });
  const [pmError, setPmError] = useState('');
  const [editingPmId, setEditingPmId] = useState(null);
  const [editPmForm, setEditPmForm] = useState({ name: '', account_number: '', account_holder: '', type: 'external', details: '' });
  const [notes, setNotes] = useState([]);
  const [notesLoading, setNotesLoading] = useState(false);
  const [noteError, setNoteError] = useState('');
  const [noteForm, setNoteForm] = useState({ title: '', description: '' });
  const [addNoteOpen, setAddNoteOpen] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        setError('');
        const res = await usersApi.detail(id);
        setData(res.data);
      } catch (e) {
        setError(e?.response?.data?.error || e.message || 'Failed to load user');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  useEffect(() => {
    const loadNotes = async () => {
      try {
        setNotesLoading(true);
        setNoteError('');
        const res = await usersApi.listNotes(id);
        setNotes(res.data?.notes || []);
      } catch (e) {
        setNoteError(e?.response?.data?.error || 'Failed to load notes');
      } finally {
        setNotesLoading(false);
      }
    };
    loadNotes();
  }, [id]);

  const typeColor = (type) => {
    switch (type) {
      case 'client': return 'primary';
      case 'vendor_owner': return 'success';
      case 'driver': return 'warning';
      case 'employee': return 'info';
      case 'admin': return 'error';
      default: return 'default';
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 2 }}>
        <Button startIcon={<ArrowBack />} onClick={() => navigate(-1)}>Back</Button>
        <Typography variant="h5" sx={{ fontWeight: 600 }}>User Detail</Typography>
      </Stack>

      {loading ? (
        <Box>
          <Skeleton variant="rectangular" height={120} sx={{ mb: 2 }} />
          <Skeleton variant="rectangular" height={200} sx={{ mb: 2 }} />
          <Skeleton variant="rectangular" height={200} sx={{ mb: 2 }} />
        </Box>
      ) : error ? (
        <Paper sx={{ p: 2, borderLeft: '4px solid #c62828', background: '#fdecea' }}>
          <Typography color="error">{error}</Typography>
        </Paper>
      ) : (
        data && (
          <Stack spacing={2}>
            {/* Basic */}
            <Section title="Basic Information">
              <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 2 }}>
                <Avatar sx={{ width: 56, height: 56 }}>
                  {data?.name?.[0] || data?.phone_number?.slice(-2) || '?'}
                </Avatar>
                <Stack>
                  <Stack direction="row" spacing={1} alignItems="center">
                    <Typography variant="h6">{data?.name || '—'}</Typography>
                    <Chip size="small" label={(data?.type || '').replace('_', ' ')} color={typeColor(data?.type)} />
                    <Chip size="small" label={data?.is_verified ? 'Verified' : 'Unverified'} color={data?.is_verified ? 'success' : 'default'} />
                  </Stack>
                  <Typography variant="body2" color="text.secondary">ID: {data?.id}</Typography>
                </Stack>
              </Stack>
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <Row label="Phone" value={data?.phone_number} />
                  <Row label="Email" value={data?.email} />
                </Grid>
                <Grid item xs={12} md={6}>
                  <Row label="Created At" value={data?.created_at ? new Date(data.created_at).toLocaleString() : '-'} />
                </Grid>
              </Grid>
            </Section>

            {/* Wallet */}
            <Section title="Wallet">
              <Stack direction="row" spacing={2}>
                <Row label="Wallet ID" value={data?.wallet?.id} />
                <Row label="Balance" value={data?.wallet ? data.wallet.balance.toFixed(2) : '0.00'} />
                <Row label="Status" value={data?.wallet?.status} />
              </Stack>
            </Section>

            {/* Payment Methods */}
            <Section title="Payment Methods">
              <Stack spacing={1}>
                {(data?.paymentMethods || []).length === 0 && (
                  <Typography variant="body2" color="text.secondary">No payment methods.</Typography>
                )}
                {(data?.paymentMethods || []).map(pm => (
                  <Paper key={pm.id} sx={{ p: 1.5 }}>
                    {editingPmId === pm.id ? (
                      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} useFlexGap flexWrap="wrap" alignItems="center">
                        <TextField label="Name" size="small" value={editPmForm.name} onChange={(e) => setEditPmForm({ ...editPmForm, name: e.target.value })} />
                        <TextField label="Account Number" size="small" value={editPmForm.account_number} onChange={(e) => setEditPmForm({ ...editPmForm, account_number: e.target.value })} />
                        <TextField label="Account Holder" size="small" value={editPmForm.account_holder} onChange={(e) => setEditPmForm({ ...editPmForm, account_holder: e.target.value })} />
                        <TextField label="Type" size="small" value={editPmForm.type} onChange={(e) => setEditPmForm({ ...editPmForm, type: e.target.value })} />
                        <TextField label="Details" size="small" value={editPmForm.details ?? ''} onChange={(e) => setEditPmForm({ ...editPmForm, details: e.target.value })} sx={{ minWidth: 200 }} />
                        <Stack direction="row" spacing={1}>
                          <Button variant="contained" size="small" onClick={async () => {
                            try {
                              setPmError('');
                              await usersApi.updatePaymentMethod(id, pm.id, { ...editPmForm });
                              const res = await usersApi.detail(id);
                              setData(res.data);
                              setEditingPmId(null);
                            } catch (e) {
                              setPmError(e?.response?.data?.error || 'Failed to update payment method');
                            }
                          }}>Save</Button>
                          <Button size="small" onClick={() => setEditingPmId(null)}>Cancel</Button>
                        </Stack>
                      </Stack>
                    ) : (
                      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} useFlexGap flexWrap="wrap" alignItems="center">
                        <Row label="Name" value={pm.name} />
                        <Row label="Account Number" value={pm.account_number} />
                        <Row label="Holder" value={pm.account_holder} />
                        <Row label="Type" value={pm.type} />
                        <Row label="Details" value={typeof pm.details === 'object' ? JSON.stringify(pm.details) : (pm.details ?? '')} />
                        <Stack direction="row" spacing={1} sx={{ ml: 'auto' }}>
                          <Tooltip title="Edit">
                            <IconButton size="small" onClick={() => { setEditingPmId(pm.id); setEditPmForm({ name: pm.name || '', account_number: pm.account_number || '', account_holder: pm.account_holder || '', type: pm.type || 'external', details: typeof pm.details === 'object' ? JSON.stringify(pm.details) : (pm.details ?? '') }); }}>
                              <Edit fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Delete">
                            <IconButton size="small" color="error" onClick={async () => {
                              try {
                                setPmError('');
                                await usersApi.deletePaymentMethod(id, pm.id);
                                const res = await usersApi.detail(id);
                                setData(res.data);
                              } catch (e) {
                                setPmError(e?.response?.data?.error || 'Failed to delete payment method');
                              }
                            }}>
                              <Delete fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </Stack>
                      </Stack>
                    )}
                  </Paper>
                ))}
                {/* Add new payment method */}
                <Paper sx={{ p: 2, mt: 1 }}>
                  <Typography variant="subtitle1" sx={{ mb: 1 }}>Add Payment Method</Typography>
                  {pmError && (
                    <Typography variant="body2" color="error" sx={{ mb: 1 }}>{pmError}</Typography>
                  )}
                  <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} useFlexGap flexWrap="wrap">
                    <TextField label="Name" size="small" value={pmForm.name} onChange={(e) => setPmForm({ ...pmForm, name: e.target.value })} />
                    <TextField label="Account Number" size="small" value={pmForm.account_number} onChange={(e) => setPmForm({ ...pmForm, account_number: e.target.value })} />
                    <TextField label="Account Holder" size="small" value={pmForm.account_holder} onChange={(e) => setPmForm({ ...pmForm, account_holder: e.target.value })} />
                    <TextField label="Type" size="small" value={pmForm.type} onChange={(e) => setPmForm({ ...pmForm, type: e.target.value })} />
                    <TextField label="Details" size="small" value={pmForm.details} onChange={(e) => setPmForm({ ...pmForm, details: e.target.value })} sx={{ minWidth: 240 }} />
                    <Button variant="contained" disabled={adding} onClick={async () => {
                      try {
                        setPmError('');
                        setAdding(true);
                        await usersApi.addPaymentMethod(id, { ...pmForm, details: pmForm.details || undefined });
                        // refresh detail
                        const res = await usersApi.detail(id);
                        setData(res.data);
                        setPmForm({ name: '', account_number: '', account_holder: '', type: 'external', details: '' });
                      } catch (e) {
                        setPmError(e?.response?.data?.error || 'Failed to add payment method');
                      } finally {
                        setAdding(false);
                      }
                    }}>Add</Button>
                  </Stack>
                </Paper>
              </Stack>
            </Section>

            {/* Role-specific sections */}
            {data?.type === 'client' && (
              <Section title="Client Profile">
                <Stack direction="row" spacing={2}>
                  <Row label="Client Wallet" value={data?.client?.wallet ? `${data.client.wallet.balance.toFixed(2)}` : '-'} />
                  <Row label="Has Image" value={data?.client?.image ? 'Yes' : 'No'} />
                </Stack>
              </Section>
            )}

            {data?.type === 'vendor_owner' && (
              <Section title="Vendor Profile">
                <Stack spacing={1}>
                  <Row label="Vendor ID" value={data?.vendor?.id} />
                  <Row label="Name" value={data?.vendor?.name} />
                  <Row label="Type" value={data?.vendor?.type} />
                  <Row label="Subscription" value={data?.vendor?.subscription?.plan} />
                  <Row label="Wallet Balance" value={data?.vendor?.wallet ? data.vendor.wallet.balance.toFixed(2) : '0.00'} />
                  <Typography variant="subtitle2" sx={{ mt: 1 }}>Categories</Typography>
                  <Stack direction="row" useFlexGap flexWrap="wrap" spacing={1}>
                    {(data?.vendor?.vendorCategories || []).map(vc => (
                      <Chip key={vc.id} label={vc.category?.name} size="small" />
                    ))}
                  </Stack>
                </Stack>
              </Section>
            )}

            {data?.type === 'driver' && (
              <Section title="Driver Profile">
                <Stack spacing={1}>
                  <Row label="Driver ID" value={data?.driver?.id} />
                  <Row label="Status" value={data?.driver?.current_status} />
                  <Row label="Wallet Balance" value={data?.driver?.wallet ? data.driver.wallet.balance.toFixed(2) : '0.00'} />
                  <Typography variant="subtitle2" sx={{ mt: 1 }}>Recent Deliveries</Typography>
                  <Stack spacing={1}>
                    {(data?.driver?.deliveries || []).length === 0 && (
                      <Typography variant="body2" color="text.secondary">No recent deliveries.</Typography>
                    )}
                    {(data?.driver?.deliveries || []).map(d => (
                      <Paper key={d.id} sx={{ p: 1 }}>
                        <Stack direction="row" spacing={2}>
                          <Row label="Delivery ID" value={d.id} />
                          <Row label="Status" value={d.status || d.delivery_status} />
                        </Stack>
                      </Paper>
                    ))}
                  </Stack>
                </Stack>
              </Section>
            )}

            {data?.type === 'employee' && (
              <Section title="Employee Profile">
                <Stack spacing={1}>
                  <Row label="Employee ID" value={data?.employee?.id} />
                  <Row label="Role" value={data?.employee?.role} />
                  <Row label="Vendor" value={data?.employee?.vendor?.name} />
                </Stack>
              </Section>
            )}

            {/* Notes section for all user types */}
            <Section title="Notes">
              {noteError && (
                <Typography variant="body2" color="error" sx={{ mb: 1 }}>{noteError}</Typography>
              )}
              <Stack spacing={1} sx={{ mb: 2 }}>
                {notesLoading ? (
                  <Skeleton variant="rectangular" height={80} />
                ) : (notes.length === 0 ? (
                  <Typography variant="body2" color="text.secondary">No notes yet.</Typography>
                ) : (
                  notes.map((n) => (
                    <Paper key={n.id} sx={{ p: 1.5 }}>
                      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems="center" useFlexGap flexWrap="wrap">
                        <Stack sx={{ flex: 1 }}>
                          <Typography variant="subtitle2">{n.title}</Typography>
                          <Typography variant="body2" color="text.secondary">{n.description}</Typography>
                          <Typography variant="caption" color="text.secondary">{n.created_at ? new Date(n.created_at).toLocaleString() : ''}</Typography>
                        </Stack>
                        <Tooltip title="Delete">
                          <IconButton size="small" color="error" onClick={async () => {
                            try {
                              setNoteError('');
                              await usersApi.deleteNote(id, n.id);
                              const res = await usersApi.listNotes(id);
                              setNotes(res.data?.notes || []);
                            } catch (e) {
                              setNoteError(e?.response?.data?.error || 'Failed to delete note');
                            }
                          }}>
                            <Delete fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </Stack>
                    </Paper>
                  ))
                ))}
              </Stack>

              {/* Add note dialog trigger */}
              <Box>
                <Button variant="contained" size="small" onClick={() => { setNoteError(''); setAddNoteOpen(true); }}>Add Note</Button>
              </Box>
              <Dialog open={addNoteOpen} onClose={() => setAddNoteOpen(false)} maxWidth="sm" fullWidth>
                <DialogTitle>Add Note</DialogTitle>
                <DialogContent>
                  <Stack spacing={2} sx={{ pt: 1 }}>
                    {noteError && (
                      <Typography variant="body2" color="error">{noteError}</Typography>
                    )}
                    <TextField label="Title" fullWidth value={noteForm.title} onChange={(e) => setNoteForm({ ...noteForm, title: e.target.value })} />
                    <TextField label="Description" fullWidth multiline minRows={3} value={noteForm.description} onChange={(e) => setNoteForm({ ...noteForm, description: e.target.value })} />
                  </Stack>
                </DialogContent>
                <DialogActions>
                  <Button onClick={() => setAddNoteOpen(false)}>Cancel</Button>
                  <Button variant="contained" onClick={async () => {
                    try {
                      setNoteError('');
                      if (!noteForm.title || !noteForm.description) { setNoteError('Title and description are required'); return; }
                      await usersApi.createNote(id, { title: noteForm.title, description: noteForm.description });
                      setNoteForm({ title: '', description: '' });
                      const res = await usersApi.listNotes(id);
                      setNotes(res.data?.notes || []);
                      setAddNoteOpen(false);
                    } catch (e) {
                      setNoteError(e?.response?.data?.error || 'Failed to add note');
                    }
                  }}>Save</Button>
                </DialogActions>
              </Dialog>
            </Section>
          </Stack>
        )
      )}
    </Box>
  );
}
