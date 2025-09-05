import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  Dialog, DialogTitle, DialogContent, DialogActions, Button, Box, Typography, 
  Grid, Card, CardContent, Chip, CircularProgress, Divider, Alert
} from '@mui/material';
import { Close, TrendingUp, TrendingDown, AccountBalance, Receipt, Person, Email } from '@mui/icons-material';
import { fetchTransactionById, clearCurrentTransaction } from '../store/slices/walletsSlice';

const TransactionDetailModal = ({ open, onClose, transactionId }) => {
  const dispatch = useDispatch();
  const { currentTransaction, transactionLoading, error } = useSelector(state => state.wallets);

  useEffect(() => {
    if (open && transactionId) {
      dispatch(fetchTransactionById(transactionId));
    }
    return () => {
      if (!open) {
        dispatch(clearCurrentTransaction());
      }
    };
  }, [open, transactionId, dispatch]);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString();
  };

  const getTransactionColor = (type) => {
    return type === 'credit' ? 'success' : 'error';
  };

  const getTransactionIcon = (type) => {
    return type === 'credit' ? <TrendingUp /> : <TrendingDown />;
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed':
        return 'success';
      case 'pending':
        return 'warning';
      case 'failed':
        return 'error';
      default:
        return 'default';
    }
  };

  if (error) {
    return (
      <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
        <DialogTitle>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6">Transaction Details</Typography>
            <Button onClick={onClose} size="small">
              <Close />
            </Button>
          </Box>
        </DialogTitle>
        <DialogContent>
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose}>Close</Button>
        </DialogActions>
      </Dialog>
    );
  }

  const exportTransactionToPDF = () => {
    if (!currentTransaction) return;
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8" />
          <title>Transaction ${currentTransaction.transaction_id}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 24px; color: #222; }
            h1 { color: #1976d2; margin-bottom: 8px; }
            h2 { margin: 16px 0 8px; }
            .section { border: 1px solid #e0e0e0; border-radius: 6px; padding: 12px 16px; margin: 12px 0; }
            .row { display: flex; justify-content: space-between; margin: 6px 0; }
            .label { color: #666; font-size: 12px; }
            .value { font-weight: 600; font-size: 14px; }
            .badge { display: inline-block; padding: 4px 8px; border-radius: 12px; color: white; font-size: 12px; }
            .badge-success { background: #2e7d32; }
            .badge-warning { background: #ed6c02; }
            .badge-error { background: #d32f2f; }
            .badge-default { background: #757575; }
            table { width: 100%; border-collapse: collapse; }
            td { vertical-align: top; padding: 6px 8px; }
            .header { display: flex; align-items: center; gap: 12px; margin-bottom: 16px; }
            .brand { display: flex; align-items: center; gap: 10px; }
            .brand-name { font-size: 20px; font-weight: 700; color: #0f172a; }
            .footer { margin-top: 28px; display: flex; justify-content: space-between; align-items: flex-end; }
            .sig-block { text-align: right; }
            .sig-line { width: 220px; border-bottom: 1px solid #333; height: 28px; margin-left: auto; }
            .muted { color: #6b7280; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="brand">
              <svg width="36" height="36" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <defs>
                  <linearGradient id="zg" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stop-color="#1976d2"/>
                    <stop offset="100%" stop-color="#42a5f5"/>
                  </linearGradient>
                </defs>
                <circle cx="12" cy="12" r="10" fill="url(#zg)"/>
                <path d="M7 13l3.5-4.5L13 12l4-5 1.5 1.5L13 15l-2.5-2L8.5 15 7 13z" fill="#fff"/>
              </svg>
              <div class="brand-name">Zareshop</div>
            </div>
            <div style="margin-left:auto" class="muted">${new Date().toLocaleString()}</div>
          </div>
          <h1>Transaction Details</h1>
          <div class="section">
            <div class="row"><div class="label">Transaction ID</div><div class="value">${currentTransaction.transaction_id}</div></div>
            <div class="row"><div class="label">Type</div><div class="value">${currentTransaction.type}</div></div>
            <div class="row"><div class="label">Amount</div><div class="value">$${Number(currentTransaction.amount).toFixed(2)}</div></div>
            <div class="row"><div class="label">Reason</div><div class="value">${currentTransaction.reason || ''}</div></div>
            <div class="row"><div class="label">Status</div>
              <div class="value">
                <span class="badge ${currentTransaction.status === 'completed' ? 'badge-success' : currentTransaction.status === 'pending' ? 'badge-warning' : currentTransaction.status === 'failed' ? 'badge-error' : 'badge-default'}">${currentTransaction.status}</span>
              </div>
            </div>
            <div class="row"><div class="label">Created At</div><div class="value">${new Date(currentTransaction.created_at).toLocaleString()}</div></div>
            <div class="row"><div class="label">Updated At</div><div class="value">${new Date(currentTransaction.updated_at).toLocaleString()}</div></div>
          </div>

          ${(currentTransaction.wallet && currentTransaction.wallet.user) ? `
            <h2>User Information</h2>
            <div class="section">
              <div class="row"><div class="label">User Name</div><div class="value">${currentTransaction.wallet.user.name || ''}</div></div>
              <div class="row"><div class="label">User Email</div><div class="value">${currentTransaction.wallet.user.email || ''}</div></div>
              <div class="row"><div class="label">User ID</div><div class="value">#${currentTransaction.wallet.user.id}</div></div>
              <div class="row"><div class="label">Wallet ID</div><div class="value">#${currentTransaction.wallet.id}</div></div>
            </div>
          ` : ''}

          <div class="footer">
            <div class="muted">Generated by Zareshop Wallet System</div>
            <div class="sig-block">
              <div class="sig-line"></div>
              <div class="muted">Authorized Signature</div>
            </div>
          </div>

        </body>
      </html>
    `;
    const w = window.open('', '_blank');
    w.document.write(html);
    w.document.close();
    w.focus();
    w.print();
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6">Transaction Details</Typography>
          <Button onClick={onClose} size="small">
            <Close />
          </Button>
        </Box>
      </DialogTitle>

      <DialogContent>
        {transactionLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress />
          </Box>
        ) : currentTransaction ? (
          <Box>
            {/* Transaction Overview */}
            <Grid container spacing={3} sx={{ mb: 3 }}>
              <Grid item xs={12} md={6}>
                <Card>
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                      {getTransactionIcon(currentTransaction.type)}
                      <Typography variant="h6" color={getTransactionColor(currentTransaction.type)}>
                        {currentTransaction.type.toUpperCase()}
                      </Typography>
                    </Box>
                    <Typography variant="h4" fontWeight="bold" color={getTransactionColor(currentTransaction.type)}>
                      {formatCurrency(currentTransaction.amount)}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Transaction Amount
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} md={6}>
                <Card>
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                      <Receipt />
                      <Typography variant="h6">Status</Typography>
                    </Box>
                    <Chip 
                      label={currentTransaction.status} 
                      color={getStatusColor(currentTransaction.status)}
                      size="large"
                    />
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                      Transaction Status
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>

            <Divider sx={{ my: 3 }} />

            {/* Transaction Details */}
            <Typography variant="h6" gutterBottom>Transaction Information</Typography>
            <Grid container spacing={2} sx={{ mb: 3 }}>
              <Grid item xs={12} sm={6}>
                <Box sx={{ p: 2, backgroundColor: 'grey.50', borderRadius: 1 }}>
                  <Typography variant="subtitle2" color="text.secondary">Transaction ID</Typography>
                  <Typography variant="body1" fontWeight="medium">
                    {currentTransaction.transaction_id}
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Box sx={{ p: 2, backgroundColor: 'grey.50', borderRadius: 1 }}>
                  <Typography variant="subtitle2" color="text.secondary">Date & Time</Typography>
                  <Typography variant="body1" fontWeight="medium">
                    {formatDate(currentTransaction.created_at)}
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={12}>
                <Box sx={{ p: 2, backgroundColor: 'grey.50', borderRadius: 1 }}>
                  <Typography variant="subtitle2" color="text.secondary">Description</Typography>
                  <Typography variant="body1" fontWeight="medium">
                    {currentTransaction.reason || 'No description provided'}
                  </Typography>
                </Box>
              </Grid>
            </Grid>

            <Divider sx={{ my: 3 }} />

            {/* User Information */}
            {currentTransaction.wallet?.user && (
              <>
                <Typography variant="h6" gutterBottom>User Information</Typography>
                <Grid container spacing={2} sx={{ mb: 3 }}>
                  <Grid item xs={12} sm={6}>
                    <Box sx={{ p: 2, backgroundColor: 'grey.50', borderRadius: 1 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                        <Person fontSize="small" />
                        <Typography variant="subtitle2" color="text.secondary">Name</Typography>
                      </Box>
                      <Typography variant="body1" fontWeight="medium">
                        {currentTransaction.wallet.user.name}
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Box sx={{ p: 2, backgroundColor: 'grey.50', borderRadius: 1 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                        <Email fontSize="small" />
                        <Typography variant="subtitle2" color="text.secondary">Email</Typography>
                      </Box>
                      <Typography variant="body1" fontWeight="medium">
                        {currentTransaction.wallet.user.email}
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Box sx={{ p: 2, backgroundColor: 'grey.50', borderRadius: 1 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                        <AccountBalance fontSize="small" />
                        <Typography variant="subtitle2" color="text.secondary">User ID</Typography>
                      </Box>
                      <Typography variant="body1" fontWeight="medium">
                        #{currentTransaction.wallet.user.id}
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Box sx={{ p: 2, backgroundColor: 'grey.50', borderRadius: 1 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                        <AccountBalance fontSize="small" />
                        <Typography variant="subtitle2" color="text.secondary">Wallet ID</Typography>
                      </Box>
                      <Typography variant="body1" fontWeight="medium">
                        #{currentTransaction.wallet.id}
                      </Typography>
                    </Box>
                  </Grid>
                </Grid>
              </>
            )}

            {/* Additional Details */}
            <Divider sx={{ my: 3 }} />
            <Typography variant="h6" gutterBottom>Additional Details</Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <Box sx={{ p: 2, backgroundColor: 'grey.50', borderRadius: 1 }}>
                  <Typography variant="subtitle2" color="text.secondary">Created At</Typography>
                  <Typography variant="body1" fontWeight="medium">
                    {formatDate(currentTransaction.created_at)}
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Box sx={{ p: 2, backgroundColor: 'grey.50', borderRadius: 1 }}>
                  <Typography variant="subtitle2" color="text.secondary">Last Updated</Typography>
                  <Typography variant="body1" fontWeight="medium">
                    {formatDate(currentTransaction.updated_at)}
                  </Typography>
                </Box>
              </Grid>
            </Grid>
          </Box>
        ) : (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <Typography variant="body1" color="text.secondary">
              Transaction not found
            </Typography>
          </Box>
        )}
      </DialogContent>

      <DialogActions>
        {currentTransaction && (
          <Button variant="contained" onClick={exportTransactionToPDF} startIcon={<Receipt />}>
            Export PDF
          </Button>
        )}
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
};

export default TransactionDetailModal;
