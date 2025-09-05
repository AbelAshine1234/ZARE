import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { fetchSubscriptionDetail, clearCurrent } from '../../store/slices/subscriptionsSlice';
import {
  Box, Paper, Typography, Button, Grid, Card, CardContent, Chip, 
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  IconButton, Tooltip, Snackbar, Alert, CircularProgress
} from '@mui/material';
import { ArrowBack, Refresh, Visibility } from '@mui/icons-material';

const SubscriptionDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { current: subscription, detailLoading, error } = useSelector(state => state.subscriptions);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  useEffect(() => {
    if (id) {
      dispatch(fetchSubscriptionDetail(id));
    }
    return () => {
      dispatch(clearCurrent());
    };
  }, [dispatch, id]);

  useEffect(() => {
    if (error) {
      setSnackbar({ open: true, message: error, severity: 'error' });
    }
  }, [error]);

  const handleRefresh = () => {
    if (id) {
      dispatch(fetchSubscriptionDetail(id));
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  if (detailLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height="50vh">
        <CircularProgress />
      </Box>
    );
  }

  if (!subscription) {
    return (
      <Box>
        <Typography variant="h6" color="error">Subscription not found</Typography>
        <Button onClick={() => navigate('/subscriptions')} startIcon={<ArrowBack />}>
          Back to Subscriptions
        </Button>
      </Box>
    );
  }

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <IconButton onClick={() => navigate('/subscriptions')}>
            <ArrowBack />
          </IconButton>
          <Typography variant="h4" fontWeight="bold">
            Subscription Details
          </Typography>
        </Box>
        <Button variant="outlined" startIcon={<Refresh />} onClick={handleRefresh}>
          Refresh
        </Button>
      </Box>

      {/* Subscription Information */}
      <Grid container spacing={3}>
        {/* Basic Info Card */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>Subscription Information</Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Box>
                  <Typography variant="subtitle2" color="text.secondary">Plan Name</Typography>
                  <Typography variant="h6">{subscription.plan}</Typography>
                </Box>
                <Box>
                  <Typography variant="subtitle2" color="text.secondary">Amount</Typography>
                  <Typography variant="h6" color="primary">
                    {formatCurrency(subscription.amount)}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="subtitle2" color="text.secondary">Status</Typography>
                  <Chip 
                    label={subscription.status} 
                    color={subscription.status === 'active' ? 'success' : 'default'}
                    size="small"
                  />
                </Box>
                <Box>
                  <Typography variant="subtitle2" color="text.secondary">Start Date</Typography>
                  <Typography>{formatDate(subscription.start_date)}</Typography>
                </Box>
                <Box>
                  <Typography variant="subtitle2" color="text.secondary">End Date</Typography>
                  <Typography>{formatDate(subscription.end_date)}</Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Statistics Card */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>Statistics</Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Box>
                  <Typography variant="subtitle2" color="text.secondary">Total Vendors</Typography>
                  <Typography variant="h4" color="primary">
                    {subscription.vendors?.length || 0}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="subtitle2" color="text.secondary">Active Vendors</Typography>
                  <Typography variant="h5" color="success.main">
                    {subscription.vendors?.filter(v => v.status).length || 0}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="subtitle2" color="text.secondary">Approved Vendors</Typography>
                  <Typography variant="h5" color="info.main">
                    {subscription.vendors?.filter(v => v.is_approved).length || 0}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="subtitle2" color="text.secondary">Total Revenue</Typography>
                  <Typography variant="h5" color="success.main">
                    {formatCurrency(subscription.amount * (subscription.vendors?.length || 0))}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Vendors List */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Vendors ({subscription.vendors?.length || 0})
              </Typography>
              {subscription.vendors && subscription.vendors.length > 0 ? (
                <TableContainer component={Paper} variant="outlined">
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>ID</TableCell>
                        <TableCell>Name</TableCell>
                        <TableCell>Type</TableCell>
                        <TableCell>Status</TableCell>
                        <TableCell>Approved</TableCell>
                        <TableCell>Owner</TableCell>
                        <TableCell>Actions</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {subscription.vendors.map((vendor) => (
                        <TableRow key={vendor.id}>
                          <TableCell>{vendor.id}</TableCell>
                          <TableCell>
                            <Typography variant="body2" fontWeight="medium">
                              {vendor.name}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Chip 
                              label={vendor.type} 
                              color={vendor.type === 'business' ? 'primary' : 'secondary'}
                              size="small"
                            />
                          </TableCell>
                          <TableCell>
                            <Chip 
                              label={vendor.status ? 'Active' : 'Inactive'} 
                              color={vendor.status ? 'success' : 'default'}
                              size="small"
                            />
                          </TableCell>
                          <TableCell>
                            <Chip 
                              label={vendor.is_approved ? 'Approved' : 'Pending'} 
                              color={vendor.is_approved ? 'success' : 'warning'}
                              size="small"
                            />
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2">
                              {vendor.user?.name || '-'}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Tooltip title="View Vendor Details">
                              <IconButton 
                                size="small" 
                                color="primary"
                                onClick={() => navigate(`/vendors/${vendor.id}`)}
                              >
                                <Visibility />
                              </IconButton>
                            </Tooltip>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              ) : (
                <Box sx={{ textAlign: 'center', py: 4 }}>
                  <Typography variant="body1" color="text.secondary">
                    No vendors subscribed to this plan yet.
                  </Typography>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Snackbar open={snackbar.open} autoHideDuration={4000} onClose={() => setSnackbar({ ...snackbar, open: false })}>
        <Alert severity={snackbar.severity} onClose={() => setSnackbar({ ...snackbar, open: false })}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default SubscriptionDetailPage;