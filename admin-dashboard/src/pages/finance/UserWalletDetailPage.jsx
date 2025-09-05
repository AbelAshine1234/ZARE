import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { fetchWalletByUserId, fetchWalletTransactions, addFunds, deductFunds, exportTransactionsCSV } from '../../store/slices/walletsSlice';
import TransactionDetailModal from '../../components/TransactionDetailModal';
import {
  Box, Paper, Typography, Chip, Grid, Button, Divider, CircularProgress, Snackbar, Alert, 
  Card, CardContent, Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Dialog, DialogTitle, DialogContent, DialogActions, TextField, FormControl, InputLabel, Select, MenuItem,
  Menu, ListItemIcon, ListItemText, IconButton, Tooltip
} from '@mui/material';
import { ArrowBack, Refresh, Add, Remove, AccountBalance, TrendingUp, TrendingDown, MoreVert, FileDownload, PictureAsPdf, TableChart, Person } from '@mui/icons-material';

const UserWalletDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { currentWallet, transactions, loading: walletLoading, transactionsLoading, error } = useSelector(state => state.wallets);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [addFundsOpen, setAddFundsOpen] = useState(false);
  const [deductFundsOpen, setDeductFundsOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [formData, setFormData] = useState({ amount: '', reason: '' });
  const [exportMenuAnchor, setExportMenuAnchor] = useState(null);
  const [transactionDetailOpen, setTransactionDetailOpen] = useState(false);
  const [selectedTransactionId, setSelectedTransactionId] = useState(null);
  
  // Prefer the paginated transactions slice; if empty, fall back to the wallet payload's embedded transactions
  const displayTransactions = (transactions && transactions.length > 0)
    ? transactions
    : (currentWallet?.transactions || []);

  useEffect(() => {
    if (id) {
      const userId = Number(id);
      dispatch(fetchWalletByUserId({ id: userId, isVendor: false }));
      dispatch(fetchWalletTransactions({ id: userId, page: currentPage, limit: 20, isVendor: false }));
    }
  }, [dispatch, id, currentPage]);

  useEffect(() => {
    if (error) {
      setSnackbar({ open: true, message: error, severity: 'error' });
    }
  }, [error]);

  const handleRefresh = () => {
    if (id) {
      const userId = Number(id);
      dispatch(fetchWalletByUserId({ id: userId, isVendor: false }));
      dispatch(fetchWalletTransactions({ id: userId, page: currentPage, limit: 20, isVendor: false }));
    }
  };

  // Export functions
  const exportToCSV = async () => {
    if (!id) {
      setSnackbar({ open: true, message: 'No user ID available for export', severity: 'error' });
      return;
    }

    try {
      const res = await dispatch(exportTransactionsCSV({ id: Number(id), isVendor: false }));
      if (exportTransactionsCSV.fulfilled.match(res)) {
        // Create download link for the blob
        const blob = new Blob([res.payload.data], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        const ownerLabel = currentWallet?.user?.name || 'user';
        link.download = `wallet-transactions-${ownerLabel}-${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
        
        setSnackbar({ open: true, message: 'Transactions exported to CSV successfully', severity: 'success' });
      } else {
        throw new Error(res.payload);
      }
    } catch (e) {
      setSnackbar({ open: true, message: e.message || 'Failed to export CSV', severity: 'error' });
    }
  };

  const exportToPDF = () => {
    if (!displayTransactions || displayTransactions.length === 0) {
      setSnackbar({ open: true, message: 'No transactions to export', severity: 'warning' });
      return;
    }

    // Simple PDF generation using browser's print functionality
    const printWindow = window.open('', '_blank');
    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>User Wallet Transactions - ${currentWallet?.user?.name || 'User'}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            h1 { color: #1976d2; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background-color: #f5f5f5; }
            .header { margin-bottom: 20px; }
            .summary { background-color: #f9f9f9; padding: 15px; border-radius: 5px; margin-bottom: 20px; }
            .brand { display:flex; align-items:center; gap:10px; }
            .brand-name { font-size: 20px; font-weight: 700; color: #0f172a; }
            .footer { margin-top: 24px; display:flex; justify-content: space-between; align-items: flex-end; }
            .sig-block { text-align: right; }
            .sig-line { width: 240px; border-bottom: 1px solid #333; height: 28px; margin-left: auto; }
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
              <div>
                <div class="brand-name">Zareshop</div>
                <div class="muted">${new Date().toLocaleString()}</div>
              </div>
            </div>
            <h1>User Wallet Transactions Report</h1>
            <p><strong>User:</strong> ${currentWallet?.user?.name || 'N/A'} (ID: ${currentWallet?.user?.id || 'N/A'})</p>
            <p><strong>Generated:</strong> ${new Date().toLocaleString()}</p>
          </div>
          
          <div class="summary">
            <h3>Wallet Summary</h3>
            <p><strong>Current Balance:</strong> $${currentWallet?.balance?.toFixed(2) || '0.00'}</p>
            <p><strong>Wallet Status:</strong> ${currentWallet?.status || 'N/A'}</p>
            <p><strong>Total Transactions:</strong> ${displayTransactions.length}</p>
          </div>

          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Type</th>
                <th>Amount</th>
                <th>Reason</th>
                <th>Status</th>
                <th>Transaction ID</th>
              </tr>
            </thead>
            <tbody>
              ${displayTransactions.map(transaction => `
                <tr>
                  <td>${new Date(transaction.created_at).toLocaleDateString()}</td>
                  <td>${transaction.type}</td>
                  <td>$${transaction.amount}</td>
                  <td>${transaction.reason || ''}</td>
                  <td>${transaction.status}</td>
                  <td>${transaction.transaction_id}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
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
    
    printWindow.document.write(htmlContent);
    printWindow.document.close();
    printWindow.print();
    
    setSnackbar({ open: true, message: 'PDF generated successfully', severity: 'success' });
  };

  const handleAddFunds = async () => {
    try {
      const res = await dispatch(addFunds({ 
        id: Number(id), 
        amount: parseFloat(formData.amount), 
        reason: formData.reason,
        isVendor: false
      }));
      if (addFunds.fulfilled.match(res)) {
        setSnackbar({ open: true, message: 'Funds added successfully', severity: 'success' });
        setAddFundsOpen(false);
        setFormData({ amount: '', reason: '' });
        // No refetch; state already updated via reducers
      } else {
        throw new Error(res.payload);
      }
    } catch (e) {
      setSnackbar({ open: true, message: e.message || 'Failed to add funds', severity: 'error' });
    }
  };

  const handleDeductFunds = async () => {
    try {
      const res = await dispatch(deductFunds({ 
        id: Number(id), 
        amount: parseFloat(formData.amount), 
        reason: formData.reason,
        isVendor: false
      }));
      if (deductFunds.fulfilled.match(res)) {
        setSnackbar({ open: true, message: 'Funds deducted successfully', severity: 'success' });
        setDeductFundsOpen(false);
        setFormData({ amount: '', reason: '' });
        // No refetch; state already updated via reducers
      } else {
        throw new Error(res.payload);
      }
    } catch (e) {
      setSnackbar({ open: true, message: e.message || 'Failed to deduct funds', severity: 'error' });
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
    return type === 'credit' ? <TrendingUp /> : <TrendingDown />;
  };

  const handleTransactionClick = (transactionId) => {
    setSelectedTransactionId(transactionId);
    setTransactionDetailOpen(true);
  };

  if (walletLoading) {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: 400, gap: 2 }}>
        <CircularProgress />
        <Typography variant="body2" color="text.secondary">
          Loading wallet data...
        </Typography>
      </Box>
    );
  }

  if (!currentWallet) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">
          Wallet not found. Please check the URL and try again.
        </Alert>
        <Button 
          variant="outlined" 
          startIcon={<ArrowBack />} 
          onClick={() => navigate('/wallets')}
          sx={{ mt: 2 }}
        >
          Back to Wallets
        </Button>
      </Box>
    );
  }

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <IconButton onClick={() => navigate('/wallets')}>
            <ArrowBack />
          </IconButton>
          <Typography variant="h4" fontWeight="bold">
            User Wallet Details
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button variant="outlined" startIcon={<Refresh />} onClick={handleRefresh}>
            Refresh
          </Button>
          <Button 
            variant="contained" 
            color="success" 
            startIcon={<Add />} 
            onClick={() => setAddFundsOpen(true)}
            disabled={!currentWallet}
          >
            Add Funds
          </Button>
          <Button 
            variant="contained" 
            color="error" 
            startIcon={<Remove />} 
            onClick={() => setDeductFundsOpen(true)}
            disabled={!currentWallet}
          >
            Deduct Funds
          </Button>
          <Tooltip title="Export Transactions">
            <IconButton
              onClick={(e) => setExportMenuAnchor(e.currentTarget)}
              disabled={!transactions || transactions.length === 0}
            >
              <MoreVert />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      <Grid container spacing={3}>
        {/* Wallet Information */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>Wallet Information</Typography>
              {currentWallet?.user && (
                <Box sx={{ mb: 3, p: 2, backgroundColor: 'grey.50', borderRadius: 1 }}>
                  <Typography variant="subtitle2" color="text.secondary">User</Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                    <Person fontSize="small" />
                    <Typography variant="h6" fontWeight="medium">
                      {currentWallet.user.name} (ID: #{currentWallet.user.id})
                    </Typography>
                  </Box>
                  <Typography variant="body2" color="text.secondary">
                    Email: {currentWallet.user.email}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Type: {currentWallet.user.type}
                  </Typography>
                </Box>
              )}
              {currentWallet ? (
                <Grid container spacing={2}>
                  <Grid item xs={12} md={4}>
                    <Box sx={{ textAlign: 'center', p: 2, border: '1px solid', borderColor: 'divider', borderRadius: 1 }}>
                      <AccountBalance color="primary" sx={{ fontSize: 40, mb: 1 }} />
                      <Typography variant="h4" fontWeight="bold" color="primary">
                        {formatCurrency(currentWallet.balance)}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">Current Balance</Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <Box sx={{ textAlign: 'center', p: 2, border: '1px solid', borderColor: 'divider', borderRadius: 1 }}>
                      <Typography variant="h6" color="text.secondary">Wallet Status</Typography>
                      <Chip 
                        label={currentWallet.status} 
                        color={currentWallet.status === 'active' ? 'success' : 'default'}
                        size="small"
                        sx={{ mt: 1 }}
                      />
                    </Box>
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <Box sx={{ textAlign: 'center', p: 2, border: '1px solid', borderColor: 'divider', borderRadius: 1 }}>
                      <Typography variant="h6" color="text.secondary">Wallet ID</Typography>
                      <Typography variant="body1" fontWeight="medium" sx={{ mt: 1 }}>
                        #{currentWallet.id}
                      </Typography>
                    </Box>
                  </Grid>
                </Grid>
              ) : (
                <Box sx={{ textAlign: 'center', py: 4 }}>
                  <Typography variant="body1" color="text.secondary">
                    No wallet found for this user
                  </Typography>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Transaction History */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>Transaction History</Typography>
              {transactionsLoading && displayTransactions.length === 0 ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
                  <CircularProgress />
                </Box>
              ) : displayTransactions.length > 0 ? (
                <TableContainer component={Paper} variant="outlined">
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Date</TableCell>
                        <TableCell>Type</TableCell>
                        <TableCell>Amount</TableCell>
                        <TableCell>Reason</TableCell>
                        <TableCell>Status</TableCell>
                        <TableCell>Transaction ID</TableCell>
                        <TableCell>Actions</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {displayTransactions.map((transaction) => (
                        <TableRow key={transaction.id}>
                          <TableCell>
                            <Typography variant="body2">
                              {formatDate(transaction.created_at)}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              {getTransactionIcon(transaction.type)}
                              <Chip 
                                label={transaction.type} 
                                color={getTransactionColor(transaction.type)}
                                size="small"
                              />
                            </Box>
                          </TableCell>
                          <TableCell>
                            <Typography 
                              variant="body2" 
                              color={getTransactionColor(transaction.type)}
                              fontWeight="medium"
                            >
                              {formatCurrency(transaction.amount)}
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
                            <Typography variant="body2" color="text.secondary">
                              {transaction.transaction_id}
                            </Typography>
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
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Add Funds Dialog */}
      <Dialog open={addFundsOpen} onClose={() => setAddFundsOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Add Funds to Wallet</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                label="Amount"
                type="number"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                fullWidth
                required
                inputProps={{ step: "0.01", min: "0" }}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                label="Reason"
                value={formData.reason}
                onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                fullWidth
                multiline
                rows={3}
                placeholder="Enter reason for adding funds..."
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAddFundsOpen(false)}>Cancel</Button>
          <Button variant="contained" color="success" onClick={handleAddFunds}>
            Add Funds
          </Button>
        </DialogActions>
      </Dialog>

      {/* Deduct Funds Dialog */}
      <Dialog open={deductFundsOpen} onClose={() => setDeductFundsOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Deduct Funds from Wallet</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                label="Amount"
                type="number"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                fullWidth
                required
                inputProps={{ step: "0.01", min: "0" }}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                label="Reason"
                value={formData.reason}
                onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                fullWidth
                multiline
                rows={3}
                placeholder="Enter reason for deducting funds..."
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeductFundsOpen(false)}>Cancel</Button>
          <Button variant="contained" color="error" onClick={handleDeductFunds}>
            Deduct Funds
          </Button>
        </DialogActions>
      </Dialog>

      {/* Export Menu */}
      <Menu
        anchorEl={exportMenuAnchor}
        open={Boolean(exportMenuAnchor)}
        onClose={() => setExportMenuAnchor(null)}
      >
        <MenuItem onClick={() => { setExportMenuAnchor(null); exportToCSV(); }}>
          <ListItemIcon>
            <TableChart fontSize="small" />
          </ListItemIcon>
          <ListItemText>Export to CSV</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => { setExportMenuAnchor(null); exportToPDF(); }}>
          <ListItemIcon>
            <PictureAsPdf fontSize="small" />
          </ListItemIcon>
          <ListItemText>Export to PDF</ListItemText>
        </MenuItem>
      </Menu>

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
    </Box>
  );
};

export default UserWalletDetailPage;
