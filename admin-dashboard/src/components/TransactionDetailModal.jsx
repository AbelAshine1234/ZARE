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
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
};

export default TransactionDetailModal;
