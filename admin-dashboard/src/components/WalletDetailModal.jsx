import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import {
  Dialog, DialogTitle, DialogContent, DialogActions, Button, Box, Typography, 
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper,
  Chip, CircularProgress, Snackbar, Alert, Grid, Card, CardContent, IconButton
} from '@mui/material';
import { Close, Refresh, OpenInNew } from '@mui/icons-material';
import { fetchWalletByUserId, fetchWalletTransactions, clearCurrentWallet } from '../store/slices/walletsSlice';
import TransactionDetailModal from './TransactionDetailModal';

const WalletDetailModal = ({ open, onClose, vendor }) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { currentWallet, transactions, loading, transactionsLoading, error } = useSelector(state => state.wallets);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [currentPage, setCurrentPage] = useState(1);
  const [transactionDetailOpen, setTransactionDetailOpen] = useState(false);
  const [selectedTransactionId, setSelectedTransactionId] = useState(null);

  useEffect(() => {
    if (open && vendor?.user?.id) {
      dispatch(fetchWalletByUserId(vendor.user.id));
      dispatch(fetchWalletTransactions({ userId: vendor.user.id, page: 1, limit: 10 }));
    }
    return () => {
      if (!open) {
        dispatch(clearCurrentWallet());
      }
    };
  }, [open, vendor?.user?.id, dispatch]);

  useEffect(() => {
    if (error) {
      setSnackbar({ open: true, message: error, severity: 'error' });
    }
  }, [error]);

  const handleRefresh = () => {
    if (vendor?.user?.id) {
      dispatch(fetchWalletByUserId(vendor.user.id));
      dispatch(fetchWalletTransactions({ userId: vendor.user.id, page: currentPage, limit: 10 }));
    }
  };

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
    return type === 'credit' ? '+' : '-';
  };

  const handleTransactionClick = (transactionId) => {
    setSelectedTransactionId(transactionId);
    setTransactionDetailOpen(true);
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6">
            Wallet Details - {vendor?.name}
          </Typography>
          <Box>
            <IconButton onClick={handleRefresh} size="small">
              <Refresh />
            </IconButton>
            <IconButton onClick={onClose} size="small">
              <Close />
            </IconButton>
          </Box>
        </Box>
      </DialogTitle>

      <DialogContent>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress />
          </Box>
        ) : currentWallet ? (
          <Box>
            {/* Wallet Summary */}
            <Grid container spacing={2} sx={{ mb: 3 }}>
              <Grid item xs={12} md={4}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" color="primary" gutterBottom>
                      Current Balance
                    </Typography>
                    <Typography variant="h4" fontWeight="bold">
                      {formatCurrency(currentWallet.balance)}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} md={4}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" color="text.secondary" gutterBottom>
                      Wallet Status
                    </Typography>
                    <Chip 
                      label={currentWallet.status} 
                      color={currentWallet.status === 'active' ? 'success' : 'default'}
                      size="small"
                    />
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} md={4}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" color="text.secondary" gutterBottom>
                      Wallet ID
                    </Typography>
                    <Typography variant="body2">
                      #{currentWallet.id}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>

            {/* Recent Transactions */}
            <Typography variant="h6" gutterBottom>
              Recent Transactions
            </Typography>
            
            {transactionsLoading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
                <CircularProgress size={24} />
              </Box>
            ) : transactions.length > 0 ? (
              <TableContainer component={Paper} variant="outlined">
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Date</TableCell>
                      <TableCell>Type</TableCell>
                      <TableCell>Amount</TableCell>
                      <TableCell>Reason</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell>Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {transactions.map((transaction) => (
                      <TableRow key={transaction.id}>
                        <TableCell>
                          <Typography variant="body2">
                            {formatDate(transaction.created_at)}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Chip 
                            label={transaction.type} 
                            color={getTransactionColor(transaction.type)}
                            size="small"
                          />
                        </TableCell>
                        <TableCell>
                          <Typography 
                            variant="body2" 
                            color={getTransactionColor(transaction.type)}
                            fontWeight="medium"
                          >
                            {getTransactionIcon(transaction.type)}{formatCurrency(transaction.amount)}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">
                            {transaction.reason || 'N/A'}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Chip 
                            label={transaction.status} 
                            color={transaction.status === 'completed' ? 'success' : 'warning'}
                            size="small"
                          />
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="outlined"
                            size="small"
                            onClick={() => handleTransactionClick(transaction.transaction_id)}
                          >
                            View Details
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            ) : (
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <Typography variant="body1" color="text.secondary">
                  No transactions found
                </Typography>
              </Box>
            )}
          </Box>
        ) : (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <Typography variant="body1" color="text.secondary">
              No wallet found for this vendor
            </Typography>
          </Box>
        )}
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose}>Close</Button>
        <Button 
          variant="contained" 
          startIcon={<OpenInNew />}
          onClick={() => {
            onClose();
            navigate(`/wallets/${vendor?.id}`);
          }}
        >
          See More
        </Button>
      </DialogActions>

      {/* Transaction Detail Modal */}
      <TransactionDetailModal
        open={transactionDetailOpen}
        onClose={() => {
          setTransactionDetailOpen(false);
          setSelectedTransactionId(null);
        }}
        transactionId={selectedTransactionId}
      />

      <Snackbar open={snackbar.open} autoHideDuration={4000} onClose={() => setSnackbar({ ...snackbar, open: false })}>
        <Alert severity={snackbar.severity} onClose={() => setSnackbar({ ...snackbar, open: false })}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Dialog>
  );
};

export default WalletDetailModal;
