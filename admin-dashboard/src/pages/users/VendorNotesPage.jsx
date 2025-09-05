import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Box, Paper, Typography, Button, Stack, IconButton, Snackbar, Alert } from '@mui/material';
import { ArrowBack, Delete as DeleteIcon } from '@mui/icons-material';
import { vendorNotesApi } from '../../utils/api';

const VendorNotesPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  const loadNotes = async () => {
    try {
      setLoading(true);
      const res = await vendorNotesApi.list(id);
      setNotes(Array.isArray(res.data?.notes) ? res.data.notes : []);
    } catch (e) {
      setSnackbar({ open: true, message: e.response?.data?.error || 'Failed to load notes', severity: 'error' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadNotes(); }, [id]);

  const deleteNote = async (noteId) => {
    try {
      await vendorNotesApi.remove(id, noteId);
      setNotes((prev) => prev.filter((n) => n.id !== noteId));
      setSnackbar({ open: true, message: 'Note deleted', severity: 'success' });
    } catch (e) {
      setSnackbar({ open: true, message: e.response?.data?.error || 'Failed to delete note', severity: 'error' });
    }
  };

  return (
    <Box sx={{ p: 2 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h4" fontWeight="bold">Vendor Notes</Typography>
        <Button startIcon={<ArrowBack />} variant="outlined" onClick={() => navigate(-1)}>Back</Button>
      </Box>

      <Paper sx={{ p: 2 }}>
        {loading ? (
          <Typography variant="body2" color="text.secondary">Loading...</Typography>
        ) : notes.length === 0 ? (
          <Typography variant="body2" color="text.secondary">No notes yet</Typography>
        ) : (
          <Stack spacing={1}>
            {notes.map((n) => (
              <Paper key={n.id} variant="outlined" sx={{ p: 1.5 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="subtitle1" fontWeight="bold">{n.title}</Typography>
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
      </Paper>

      <Snackbar open={snackbar.open} autoHideDuration={4000} onClose={() => setSnackbar({ ...snackbar, open: false })}>
        <Alert severity={snackbar.severity} onClose={() => setSnackbar({ ...snackbar, open: false })}>{snackbar.message}</Alert>
      </Snackbar>
    </Box>
  );
};

export default VendorNotesPage;


