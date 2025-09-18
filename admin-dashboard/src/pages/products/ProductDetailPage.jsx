import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Paper,
  Typography,
  Button,
  Grid,
  Card,
  CardMedia,
  CardContent,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  Snackbar,
  CircularProgress,
  Breadcrumbs,
  Link as MuiLink,
  Divider,
  Avatar,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar
} from '@mui/material';
import {
  Edit,
  Delete,
  ArrowBack,
  Store,
  Person,
  Category,
  Image,
  Analytics,
  CheckCircle,
  Cancel,
  Warning,
  ShoppingCart
} from '@mui/icons-material';
import { useDispatch } from 'react-redux';
import { deleteProduct as deleteProductThunk } from '../../store/slices/productsSlice';

const ProductDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  useEffect(() => {
    fetchProductDetails();
  }, [id]);

  const fetchProductDetails = async () => {
    try {
      setLoading(true);
      // Using the admin detail API as specified in the guide
      const response = await fetch(`/api/products/admin/${id}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch product details');
      }

      const data = await response.json();
      setProduct(data.product);
    } catch (err) {
      setError(err.message);
      setSnackbar({ open: true, message: 'Failed to load product details', severity: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleEditProduct = () => {
    navigate(`/products/${id}/edit`);
  };

  const handleDeleteProduct = () => {
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    try {
      await dispatch(deleteProductThunk(id));
      setSnackbar({ open: true, message: 'Product deleted successfully', severity: 'success' });
      setDeleteDialogOpen(false);
      setTimeout(() => {
        navigate('/products');
      }, 1500);
    } catch (error) {
      setSnackbar({ open: true, message: 'Error deleting product', severity: 'error' });
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active':
        return 'success';
      case 'inactive':
        return 'default';
      case 'pending':
        return 'warning';
      default:
        return 'default';
    }
  };

  const getApprovalColor = (approved) => {
    return approved ? 'success' : 'warning';
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '400px' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">{error}</Alert>
      </Box>
    );
  }

  if (!product) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="warning">Product not found</Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ maxWidth: 1200, mx: 'auto', p: 3 }}>
      {/* Header */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Breadcrumbs aria-label="breadcrumb">
            <MuiLink
              component="button"
              variant="body1"
              onClick={() => navigate('/products')}
              sx={{ textDecoration: 'none' }}
            >
              Products
            </MuiLink>
            <Typography color="text.primary">Product Details</Typography>
          </Breadcrumbs>

          <Box sx={{ display: 'flex', gap: 2 }}>
            <Button
              variant="contained"
              startIcon={<Edit />}
              onClick={handleEditProduct}
              color="primary"
            >
              Edit Product
            </Button>
            <Button
              variant="contained"
              startIcon={<Delete />}
              onClick={handleDeleteProduct}
              color="error"
            >
              Delete Product
            </Button>
          </Box>
        </Box>

        <Typography variant="h4" fontWeight="bold" sx={{ mb: 1 }}>
          {product.name}
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Product ID: {product.id}
        </Typography>
      </Paper>

      <Grid container spacing={3}>
        {/* Basic Information */}
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" fontWeight="bold" sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 1 }}>
              <Store />
              Basic Information
            </Typography>

            <Grid container spacing={3}>
              <Grid item xs={12} sm={6}>
                <Box sx={{ mb: 2 }}>
                  <Typography variant="subtitle2" color="text.secondary">Name</Typography>
                  <Typography variant="body1">{product.name}</Typography>
                </Box>
                <Box sx={{ mb: 2 }}>
                  <Typography variant="subtitle2" color="text.secondary">Stock</Typography>
                  <Typography variant="body1">{product.stock}</Typography>
                </Box>
                <Box sx={{ mb: 2 }}>
                  <Typography variant="subtitle2" color="text.secondary">Price</Typography>
                  <Typography variant="body1" fontWeight="bold">${product.price}</Typography>
                </Box>
              </Grid>

              <Grid item xs={12} sm={6}>
                <Box sx={{ mb: 2 }}>
                  <Typography variant="subtitle2" color="text.secondary">Category</Typography>
                  <Typography variant="body1">{product.category?.name || 'N/A'}</Typography>
                </Box>
                <Box sx={{ mb: 2 }}>
                  <Typography variant="subtitle2" color="text.secondary">Subcategory</Typography>
                  <Typography variant="body1">{product.subcategory?.name || 'N/A'}</Typography>
                </Box>
                <Box sx={{ mb: 2 }}>
                  <Typography variant="subtitle2" color="text.secondary">Status</Typography>
                  <Chip
                    label={product.status}
                    color={getStatusColor(product.status)}
                    size="small"
                  />
                </Box>
              </Grid>

              <Grid item xs={12}>
                <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>Description</Typography>
                <Paper sx={{ p: 2, bgcolor: 'grey.50' }}>
                  <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>
                    {product.description || 'No description available'}
                  </Typography>
                </Paper>
              </Grid>
            </Grid>
          </Paper>
        </Grid>

        {/* Analytics Summary */}
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" fontWeight="bold" sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 1 }}>
              <Analytics />
              Analytics
            </Typography>

            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Box sx={{ textAlign: 'center', p: 2, bgcolor: 'primary.light', borderRadius: 1 }}>
                <Typography variant="h4" color="white" fontWeight="bold">
                  {product.analytics?.total_orders || 0}
                </Typography>
                <Typography variant="body2" color="white">
                  Total Orders
                </Typography>
              </Box>

              <Box sx={{ textAlign: 'center', p: 2, bgcolor: 'secondary.light', borderRadius: 1 }}>
                <Typography variant="h4" color="white" fontWeight="bold">
                  {product.analytics?.average_rating?.toFixed(1) || '0.0'}
                </Typography>
                <Typography variant="body2" color="white">
                  Average Rating
                </Typography>
              </Box>

              <Box sx={{ textAlign: 'center', p: 2, bgcolor: 'success.light', borderRadius: 1 }}>
                <Typography variant="h4" color="white" fontWeight="bold">
                  {product.analytics?.total_views || 0}
                </Typography>
                <Typography variant="body2" color="white">
                  Total Views
                </Typography>
              </Box>
            </Box>
          </Paper>
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        {/* Vendor Information */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" fontWeight="bold" sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 1 }}>
              <Store />
              Vendor Information
            </Typography>

            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle2" color="text.secondary">Vendor Name</Typography>
              <Typography variant="body1">{product.vendor?.name || 'N/A'}</Typography>
            </Box>

            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle2" color="text.secondary">Vendor Type</Typography>
              <Typography variant="body1">{product.vendor?.type || 'N/A'}</Typography>
            </Box>

            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle2" color="text.secondary">Approval Status</Typography>
              <Chip
                label={product.vendor?.is_approved ? 'Approved' : 'Pending'}
                color={getApprovalColor(product.vendor?.is_approved)}
                size="small"
                icon={product.vendor?.is_approved ? <CheckCircle /> : <Warning />}
              />
            </Box>

            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle2" color="text.secondary">Active Status</Typography>
              <Chip
                label={product.vendor?.status ? 'Active' : 'Inactive'}
                color={product.vendor?.status ? 'success' : 'default'}
                size="small"
              />
            </Box>

            <Divider sx={{ my: 2 }} />

            <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 2 }}>Owner Information</Typography>

            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
              <Avatar>
                <Person />
              </Avatar>
              <Box>
                <Typography variant="body1" fontWeight="medium">
                  {product.vendor?.owner?.full_name || 'N/A'}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {product.vendor?.owner?.email || 'N/A'}
                </Typography>
              </Box>
            </Box>

            <Typography variant="body2" color="text.secondary">
              User Type: {product.vendor?.owner?.type || 'N/A'}
            </Typography>
          </Paper>
        </Grid>

        {/* Images */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" fontWeight="bold" sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 1 }}>
              <Image />
              Product Images ({product.media?.images?.length || 0})
            </Typography>

            {product.media?.images && product.media.images.length > 0 ? (
              <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: 2 }}>
                {product.media.images.map((image, index) => (
                  <Card key={image.id || index} sx={{ cursor: 'pointer' }}>
                    <CardMedia
                      component="img"
                      image={image.image_url}
                      alt={`Product image ${index + 1}`}
                      sx={{ height: 120, objectFit: 'cover' }}
                    />
                  </Card>
                ))}
              </Box>
            ) : (
              <Typography variant="body2" color="text.secondary">
                No images available
              </Typography>
            )}
          </Paper>
        </Grid>
      </Grid>

      {/* Specifications */}
      {product.specifications && product.specifications.length > 0 && (
        <Paper sx={{ p: 3, mt: 3 }}>
          <Typography variant="h6" fontWeight="bold" sx={{ mb: 3 }}>
            Specifications
          </Typography>

          <List>
            {product.specifications.map((spec, index) => (
              <ListItem key={index} divider={index < product.specifications.length - 1}>
                <ListItemText
                  primary={<Typography variant="subtitle2">{spec.key}</Typography>}
                  secondary={<Typography variant="body1">{spec.value}</Typography>}
                />
              </ListItem>
            ))}
          </List>
        </Paper>
      )}

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete product "{product.name}"? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleDeleteConfirm} color="error" variant="contained">
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert severity={snackbar.severity} onClose={() => setSnackbar({ ...snackbar, open: false })}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default ProductDetailPage;
