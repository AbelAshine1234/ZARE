import React, { useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchAllWallets } from '../../store/slices/walletsSlice';
import {
  Box, Paper, Typography, Chip, IconButton, Tooltip, Button, Dialog, DialogTitle, DialogContent, DialogActions,
  Grid, TextField, Select, MenuItem, FormControl, InputLabel, Snackbar, Alert, Card, CardContent,
  Menu, ListItemIcon, ListItemText, Tabs, Tab, Badge
} from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import { Visibility, Refresh, AccountBalance, TrendingUp, TrendingDown, Person, MoreVert, FileDownload, PictureAsPdf, TableChart } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

const WalletsPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { allWallets, allWalletsLoading, error } = useSelector(state => state.wallets);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [balanceFilter, setBalanceFilter] = useState('all');
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [exportMenuAnchor, setExportMenuAnchor] = useState(null);
  const [activeTab, setActiveTab] = useState('vendors'); // 'vendors' | 'users'

  useEffect(() => { 
    dispatch(fetchAllWallets({ page: 1, limit: 100 })); 
  }, [dispatch]);

  useEffect(() => {
    if (error) {
      setSnackbar({ open: true, message: error, severity: 'error' });
    }
  }, [error]);

  const vendorRows = useMemo(() => (allWallets || [])
    .filter(w => !!(w.vendor || w.user?.vendor))
    .map(wallet => {
      const vendorId = wallet.user?.vendor?.id || wallet.vendor?.id || null;
      const userId = wallet.user_id;
      return ({
        id: vendorId ?? userId,
        vendorId,
        routeId: vendorId ?? userId,
        walletId: wallet.id,
        name: wallet.vendor?.name || wallet.user?.vendor?.name || 'Unknown Vendor',
        type: wallet.vendor?.type || wallet.user?.vendor?.type || 'vendor',
        status: wallet.vendor?.status ?? wallet.user?.vendor?.status,
        isApproved: wallet.vendor?.is_approved ?? wallet.user?.vendor?.is_approved,
        owner: wallet.user?.name,
        walletBalance: wallet.balance || 0,
        walletStatus: wallet.status || 'inactive',
        hasWallet: true,
        createdAt: wallet.created_at,
        userId
      });
    })
  , [allWallets]);

  const userRows = useMemo(() => (allWallets || [])
    .filter(w => !w.vendor && !w.user?.vendor)
    .map(wallet => {
      const userId = wallet.user_id;
      return ({
        id: userId,
        vendorId: null,
        routeId: userId,
        walletId: wallet.id,
        name: wallet.user?.name || 'User',
        type: wallet.user?.type || 'user',
        status: wallet.user?.status,
        isApproved: wallet.user?.is_approved,
        owner: wallet.user?.email || wallet.user?.phone || wallet.user?.name,
        walletBalance: wallet.balance || 0,
        walletStatus: wallet.status || 'inactive',
        hasWallet: true,
        createdAt: wallet.created_at,
        userId
      });
    })
  , [allWallets]);

  const baseRows = activeTab === 'vendors' ? vendorRows : userRows;
  const filtered = baseRows.filter(r => {
    const q = search.trim().toLowerCase();
    const matchSearch = !q || 
      r.name?.toLowerCase().includes(q) || 
      r.owner?.toLowerCase().includes(q);
    
    const matchStatus = statusFilter === 'all' || r.walletStatus === statusFilter;
    
    let matchBalance = true;
    if (balanceFilter === 'positive') matchBalance = r.walletBalance > 0;
    else if (balanceFilter === 'zero') matchBalance = r.walletBalance === 0;
    else if (balanceFilter === 'negative') matchBalance = r.walletBalance < 0;
    
    return matchSearch && matchStatus && matchBalance;
  });

  const columns = [
    { field: 'id', headerName: 'ID', width: 80 },
    { field: 'name', headerName: activeTab === 'vendors' ? 'Vendor Name' : 'User Name', width: 200, renderCell: (p) => (
      <Box>
        <Typography variant="body2" fontWeight="medium">{p.value}</Typography>
        <Typography variant="caption" color="text.secondary">{p.row.owner}</Typography>
      </Box>
    ) },
    { field: 'type', headerName: 'Account Type', width: 140, renderCell: (p) => (
      <Chip label={(p.value || '').toString()} color={p.value === 'business' ? 'primary' : 'secondary'} size="small" />
    ) },
    { field: 'userId', headerName: 'User ID', width: 110, renderCell: (p) => (
      <Typography variant="body2">{p.value}</Typography>
    ) },
    { field: 'walletBalance', headerName: 'Balance', width: 150, renderCell: (p) => (
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        {p.value > 0 ? <TrendingUp color="success" fontSize="small" /> : 
         p.value < 0 ? <TrendingDown color="error" fontSize="small" /> : null}
        <Typography 
          variant="body2" 
          fontWeight="bold"
          color={p.value > 0 ? 'success.main' : p.value < 0 ? 'error.main' : 'text.secondary'}
        >
          ${p.value?.toFixed(2) || '0.00'}
        </Typography>
      </Box>
    ) },
    { field: 'walletStatus', headerName: 'Wallet Status', width: 130, renderCell: (p) => (
      <Chip 
        label={p.value} 
        color={p.value === 'active' ? 'success' : 'default'} 
        size="small" 
      />
    ) },
    { field: 'hasWallet', headerName: 'Has Wallet', width: 120, renderCell: (p) => (
      <Chip 
        label={p.value ? 'Yes' : 'No'} 
        color={p.value ? 'success' : 'warning'} 
        size="small" 
      />
    ) },
    { 
      field: 'actions', 
      headerName: 'Actions', 
      width: 150, 
      sortable: false,
      filterable: false,
      disableColumnMenu: true,
      renderCell: (params) => {
        return (
          <Box sx={{ display: 'flex', gap: 0.5, alignItems: 'center', height: '100%' }}>
            <Tooltip title="View Wallet Details">
              <IconButton 
                size="small" 
                color="primary" 
                onClick={(e) => {
                  e.stopPropagation();
                  const targetId = params.row.routeId;
                  console.log('Eye icon clicked, navigating to wallet:', targetId);
                  navigate(`/wallets/${targetId}`);
                }}
                sx={{ 
                  '&:hover': { backgroundColor: 'primary.light' },
                  pointerEvents: 'auto'
                }}
              >
                <Visibility fontSize="small" />
              </IconButton>
            </Tooltip>
          </Box>
        );
      }
    },
  ];

  // Calculate summary statistics
  const totalAccounts = baseRows.length;
  const accountsWithWallets = baseRows.filter(r => r.hasWallet).length;
  const totalBalance = baseRows.reduce((sum, r) => sum + (r.walletBalance || 0), 0);
  const averageBalance = accountsWithWallets > 0 ? totalBalance / accountsWithWallets : 0;

  // Export functions
  const exportToCSV = () => {
    if (!filtered || filtered.length === 0) {
      setSnackbar({ open: true, message: 'No data to export', severity: 'warning' });
      return;
    }

    const headers = [activeTab === 'vendors' ? 'Vendor ID' : 'User ID', 'Name', 'Type', 'Status', 'Approved', 'Balance', 'Wallet Status', 'Created'];
    const csvContent = [
      headers.join(','),
      ...filtered.map(acc => [
        acc.id,
        acc.name,
        acc.type,
        acc.status ? 'Active' : 'Inactive',
        acc.isApproved ? 'Approved' : 'Pending',
        acc.walletBalance || '0.00',
        acc.walletStatus || 'N/A',
        acc.createdAt ? new Date(acc.createdAt).toLocaleDateString() : 'N/A'
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `wallets-export-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    setSnackbar({ open: true, message: 'Wallets exported to CSV successfully', severity: 'success' });
  };

  const exportToPDF = () => {
    if (!filtered || filtered.length === 0) {
      setSnackbar({ open: true, message: 'No data to export', severity: 'warning' });
      return;
    }

    const printWindow = window.open('', '_blank');
    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Wallets Report</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            h1 { color: #1976d2; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background-color: #f5f5f5; }
            .header { margin-bottom: 20px; }
            .summary { background-color: #f9f9f9; padding: 15px; border-radius: 5px; margin-bottom: 20px; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Wallets Report - ${activeTab === 'vendors' ? 'Vendors' : 'Users'}</h1>
            <p><strong>Generated:</strong> ${new Date().toLocaleString()}</p>
            <p><strong>Total ${activeTab === 'vendors' ? 'Vendors' : 'Users'}:</strong> ${filtered.length}</p>
          </div>
          
          <div class="summary">
            <h3>Summary</h3>
            <p><strong>Total ${activeTab === 'vendors' ? 'Vendors' : 'Users'}:</strong> ${filtered.length}</p>
            <p><strong>Active Accounts:</strong> ${filtered.filter(v => v.status).length}</p>
            <p><strong>Approved Accounts:</strong> ${filtered.filter(v => v.isApproved).length}</p>
            <p><strong>Accounts with Wallets:</strong> ${filtered.filter(v => v.hasWallet).length}</p>
            <p><strong>Total Balance:</strong> $${filtered.reduce((sum, v) => sum + (parseFloat(v.walletBalance) || 0), 0).toFixed(2)}</p>
          </div>

          <table>
            <thead>
              <tr>
                <th>${activeTab === 'vendors' ? 'Vendor ID' : 'User ID'}</th>
                <th>Name</th>
                <th>Type</th>
                <th>Status</th>
                <th>Approved</th>
                <th>Balance</th>
                <th>Wallet Status</th>
                <th>Created</th>
              </tr>
            </thead>
            <tbody>
              ${filtered.map(acc => `
                <tr>
                  <td>${acc.id}</td>
                  <td>${acc.name}</td>
                  <td>${acc.type}</td>
                  <td>${acc.status ? 'Active' : 'Inactive'}</td>
                  <td>${acc.isApproved ? 'Approved' : 'Pending'}</td>
                  <td>$${acc.walletBalance || '0.00'}</td>
                  <td>${acc.walletStatus || 'N/A'}</td>
                  <td>${acc.createdAt ? new Date(acc.createdAt).toLocaleDateString() : 'N/A'}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </body>
      </html>
    `;
    
    printWindow.document.write(htmlContent);
    printWindow.document.close();
    printWindow.print();
    
    setSnackbar({ open: true, message: 'PDF generated successfully', severity: 'success' });
  };

  return (
    <Box sx={{ height: 'calc(100vh - 112px)' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
        <Typography variant="h4" fontWeight="bold">Wallets</Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button variant="outlined" startIcon={<Refresh />} onClick={() => dispatch(fetchAllWallets({ page: 1, limit: 100 }))}>
            Refresh
          </Button>
          <Tooltip title="Export Data">
            <span>
              <IconButton
                onClick={(e) => setExportMenuAnchor(e.currentTarget)}
                disabled={!filtered || filtered.length === 0}
              >
                <MoreVert />
              </IconButton>
            </span>
          </Tooltip>
        </Box>
      </Box>

      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
        <Tabs
          value={activeTab}
          onChange={(e, v) => setActiveTab(v)}
          textColor="primary"
          indicatorColor="primary"
        >
          <Tab
            value="vendors"
            label={<Badge color="primary" badgeContent={vendorRows.length} showZero>Vendors</Badge>}
            icon={<AccountBalance fontSize="small" />}
            iconPosition="start"
          />
          <Tab
            value="users"
            label={<Badge color="secondary" badgeContent={userRows.length} showZero>Users</Badge>}
            icon={<Person fontSize="small" />}
            iconPosition="start"
          />
        </Tabs>
      </Box>

      {/* Summary Cards */}
      <Grid container spacing={2} sx={{ mb: 2 }}>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography variant="h6" color="primary" gutterBottom>
                Total {activeTab === 'vendors' ? 'Vendors' : 'Users'}
              </Typography>
              <Typography variant="h4" fontWeight="bold">
                {totalAccounts}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography variant="h6" color="success.main" gutterBottom>
                With Wallets
              </Typography>
              <Typography variant="h4" fontWeight="bold">
                {accountsWithWallets}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography variant="h6" color="info.main" gutterBottom>
                Total Balance
              </Typography>
              <Typography variant="h4" fontWeight="bold">
                ${totalBalance.toFixed(2)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography variant="h6" color="warning.main" gutterBottom>
                Average Balance
              </Typography>
              <Typography variant="h4" fontWeight="bold">
                ${averageBalance.toFixed(2)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Paper sx={{ p: 2, mb: 2 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={4}>
            <TextField 
              fullWidth 
              placeholder="Search vendors..." 
              value={search} 
              onChange={(e) => setSearch(e.target.value)} 
            />
          </Grid>
          <Grid item xs={12} md={3}>
            <FormControl fullWidth>
              <InputLabel>Wallet Status</InputLabel>
              <Select value={statusFilter} label="Wallet Status" onChange={(e) => setStatusFilter(e.target.value)}>
                <MenuItem value="all">All</MenuItem>
                <MenuItem value="active">Active</MenuItem>
                <MenuItem value="suspended">Suspended</MenuItem>
                <MenuItem value="closed">Closed</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={3}>
            <FormControl fullWidth>
              <InputLabel>Balance</InputLabel>
              <Select value={balanceFilter} label="Balance" onChange={(e) => setBalanceFilter(e.target.value)}>
                <MenuItem value="all">All</MenuItem>
                <MenuItem value="positive">Positive</MenuItem>
                <MenuItem value="zero">Zero</MenuItem>
                <MenuItem value="negative">Negative</MenuItem>
              </Select>
            </FormControl>
          </Grid>
        </Grid>
      </Paper>

      <Paper sx={{ height: 'calc(100% - 200px)' }}>
        <DataGrid
          rows={filtered}
          columns={columns}
          loading={allWalletsLoading}
          disableSelectionOnClick
          hideFooter
          disableRowSelectionOnClick
          sx={{
            height: '100%',
            '& .MuiDataGrid-cell:focus': { outline: 'none' },
            '& .MuiDataGrid-cell': { 
              display: 'flex',
              alignItems: 'center'
            },
            '& .MuiDataGrid-row': {
              '&:hover': {
                backgroundColor: 'rgba(0, 0, 0, 0.04)'
              }
            }
          }}
        />
      </Paper>

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

      <Snackbar open={snackbar.open} autoHideDuration={4000} onClose={() => setSnackbar({ ...snackbar, open: false })}>
        <Alert severity={snackbar.severity} onClose={() => setSnackbar({ ...snackbar, open: false })}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default WalletsPage;