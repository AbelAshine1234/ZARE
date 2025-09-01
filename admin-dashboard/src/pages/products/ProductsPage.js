import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  Chip,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  Snackbar,
  CircularProgress,
  Grid,
  Card,
  CardMedia,
  CardContent,
  Switch,
  FormControlLabel
} from '@mui/material';
import {
  Add,
  Search,
  Edit,
  Delete,
  Visibility,
  Category,
  Store,
  FilterList,
  Image
} from '@mui/icons-material';
import { DataGrid } from '@mui/x-data-grid';
import axios from 'axios';

const ProductsPage = () => {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterVendor, setFilterVendor] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      // Fetch products, categories, and vendors
      const [productsRes, categoriesRes, vendorsRes] = await Promise.all([
        axios.get('/api/products'),
        axios.get('/api/category'),
        axios.get('/api/vendors')
      ]);
      
      setProducts(productsRes.data);
      setCategories(categoriesRes.data);
      setVendors(vendorsRes.data);
    } catch (error) {
      console.error('Error fetching data:', error);
      // Mock data for demonstration
      setProducts([
        {
          id: 1,
          name: 'iPhone 15 Pro',
          description: 'Latest iPhone with advanced features',
          price: 999.99,
          category: 'Electronics',
          vendor: 'Tech Store',
          status: 'active',
          stock: 50,
          rating: 4.8,
          image_url: 'https://via.placeholder.com/150x150?text=iPhone',
          created_at: '2024-01-15T10:30:00Z'
        },
        {
          id: 2,
          name: 'Nike Air Max',
          description: 'Comfortable running shoes',
          price: 129.99,
          category: 'Sports',
          vendor: 'Sports World',
          status: 'active',
          stock: 25,
          rating: 4.5,
          image_url: 'https://via.placeholder.com/150x150?text=Nike',
          created_at: '2024-01-10T14:20:00Z'
        },
        {
          id: 3,
          name: 'Coffee Maker',
          description: 'Automatic coffee machine',
          price: 89.99,
          category: 'Home & Kitchen',
          vendor: 'Home Goods',
          status: 'inactive',
          stock: 0,
          rating: 4.2,
          image_url: 'https://via.placeholder.com/150x150?text=Coffee',
          created_at: '2024-01-20T09:15:00Z'
        }
      ]);
      
      setCategories([
        { id: 1, name: 'Electronics' },
        { id: 2, name: 'Sports' },
        { id: 3, name: 'Home & Kitchen' },
        { id: 4, name: 'Fashion' },
        { id: 5, name: 'Books' }
      ]);
      
      setVendors([
        { id: 1, name: 'Tech Store' },
        { id: 2, name: 'Sports World' },
        { id: 3, name: 'Home Goods' },
        { id: 4, name: 'Fashion Hub' }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleEditProduct = (product) => {
    setSelectedProduct(product);
    setDialogOpen(true);
  };

  const handleDeleteProduct = (product) => {
    setSelectedProduct(product);
    setDeleteDialogOpen(true);
  };

  const handleSaveProduct = async () => {
    try {
      if (selectedProduct.id) {
        await axios.put(`/api/products/${selectedProduct.id}`, selectedProduct);
        setSnackbar({ open: true, message: 'Product updated successfully', severity: 'success' });
      } else {
        await axios.post('/api/products', selectedProduct);
        setSnackbar({ open: true, message: 'Product created successfully', severity: 'success' });
      }
      setDialogOpen(false);
      setSelectedProduct(null);
      fetchData();
    } catch (error) {
      setSnackbar({ open: true, message: 'Error saving product', severity: 'error' });
    }
  };

  const handleDeleteConfirm = async () => {
    try {
      await axios.delete(`/api/products/${selectedProduct.id}`);
      setSnackbar({ open: true, message: 'Product deleted successfully', severity: 'success' });
      setDeleteDialogOpen(false);
      setSelectedProduct(null);
      fetchData();
    } catch (error) {
      setSnackbar({ open: true, message: 'Error deleting product', severity: 'error' });
    }
  };

  const handleStatusChange = async (productId, newStatus) => {
    try {
      await axios.patch(`/api/products/${productId}/status`, { status: newStatus });
      setSnackbar({ open: true, message: 'Product status updated successfully', severity: 'success' });
      fetchData();
    } catch (error) {
      setSnackbar({ open: true, message: 'Error updating product status', severity: 'error' });
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

  const columns = [
    {
      field: 'id',
      headerName: 'ID',
      width: 70,
    },
    {
      field: 'image',
      headerName: 'Image',
      width: 100,
      renderCell: (params) => (
        <CardMedia
          component="img"
          image={params.row.image_url}
          alt={params.row.name}
          sx={{ width: 50, height: 50, objectFit: 'cover', borderRadius: 1 }}
        />
      ),
    },
    {
      field: 'name',
      headerName: 'Product',
      width: 200,
      renderCell: (params) => (
        <Box>
          <Typography variant="body2" fontWeight="medium">
            {params.value}
          </Typography>
          <Typography variant="caption" color="textSecondary">
            {params.row.description?.substring(0, 50)}...
          </Typography>
        </Box>
      ),
    },
    {
      field: 'price',
      headerName: 'Price',
      width: 100,
      renderCell: (params) => (
        <Typography variant="body2" fontWeight="bold">
          ${params.value}
        </Typography>
      ),
    },
    {
      field: 'category',
      headerName: 'Category',
      width: 120,
      renderCell: (params) => (
        <Chip
          label={params.value}
          color="primary"
          size="small"
          icon={<Category />}
        />
      ),
    },
    {
      field: 'vendor',
      headerName: 'Vendor',
      width: 120,
      renderCell: (params) => (
        <Chip
          label={params.value}
          color="secondary"
          size="small"
          icon={<Store />}
        />
      ),
    },
    {
      field: 'stock',
      headerName: 'Stock',
      width: 80,
      renderCell: (params) => (
        <Typography
          variant="body2"
          color={params.value > 0 ? 'success.main' : 'error.main'}
          fontWeight="medium"
        >
          {params.value}
        </Typography>
      ),
    },
    {
      field: 'rating',
      headerName: 'Rating',
      width: 100,
      renderCell: (params) => (
        <Chip
          label={params.value}
          color="warning"
          size="small"
        />
      ),
    },
    {
      field: 'status',
      headerName: 'Status',
      width: 100,
      renderCell: (params) => (
        <Chip
          label={params.value}
          color={getStatusColor(params.value)}
          size="small"
        />
      ),
    },
    {
      field: 'created_at',
      headerName: 'Created',
      width: 130,
      renderCell: (params) => (
        <Typography variant="body2">
          {new Date(params.value).toLocaleDateString()}
        </Typography>
      ),
    },
    {
      field: 'actions',
      headerName: 'Actions',
      width: 200,
      renderCell: (params) => (
        <Box>
          <Tooltip title="View Details">
            <IconButton size="small" color="primary">
              <Visibility />
            </IconButton>
          </Tooltip>
          <Tooltip title="Edit Product">
            <IconButton 
              size="small" 
              color="warning"
              onClick={() => handleEditProduct(params.row)}
            >
              <Edit />
            </IconButton>
          </Tooltip>
          <Tooltip title="Delete Product">
            <IconButton 
              size="small" 
              color="error"
              onClick={() => handleDeleteProduct(params.row)}
            >
              <Delete />
            </IconButton>
          </Tooltip>
          <FormControlLabel
            control={
              <Switch
                checked={params.row.status === 'active'}
                onChange={(e) => handleStatusChange(params.row.id, e.target.checked ? 'active' : 'inactive')}
                size="small"
              />
            }
            label=""
          />
        </Box>
      ),
    },
  ];

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         product.description?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCategory = filterCategory === 'all' || product.category === filterCategory;
    const matchesVendor = filterVendor === 'all' || product.vendor === filterVendor;
    const matchesStatus = filterStatus === 'all' || product.status === filterStatus;
    
    return matchesSearch && matchesCategory && matchesVendor && matchesStatus;
  });

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '400px' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" fontWeight="bold">
          Product Management
        </Typography>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => {
            setSelectedProduct({
              name: '',
              description: '',
              price: '',
              category: '',
              vendor: '',
              stock: 0,
              status: 'active',
              image_url: ''
            });
            setDialogOpen(true);
          }}
        >
          Add New Product
        </Button>
      </Box>

      {/* Filters */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={3}>
            <TextField
              placeholder="Search products..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: <Search sx={{ mr: 1, color: 'text.secondary' }} />,
              }}
              fullWidth
            />
          </Grid>
          
          <Grid item xs={12} md={2}>
            <FormControl fullWidth>
              <InputLabel>Category</InputLabel>
              <Select
                value={filterCategory}
                label="Category"
                onChange={(e) => setFilterCategory(e.target.value)}
              >
                <MenuItem value="all">All Categories</MenuItem>
                {categories.map((category) => (
                  <MenuItem key={category.id} value={category.name}>
                    {category.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          
          <Grid item xs={12} md={2}>
            <FormControl fullWidth>
              <InputLabel>Vendor</InputLabel>
              <Select
                value={filterVendor}
                label="Vendor"
                onChange={(e) => setFilterVendor(e.target.value)}
              >
                <MenuItem value="all">All Vendors</MenuItem>
                {vendors.map((vendor) => (
                  <MenuItem key={vendor.id} value={vendor.name}>
                    {vendor.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          
          <Grid item xs={12} md={2}>
            <FormControl fullWidth>
              <InputLabel>Status</InputLabel>
              <Select
                value={filterStatus}
                label="Status"
                onChange={(e) => setFilterStatus(e.target.value)}
              >
                <MenuItem value="all">All Status</MenuItem>
                <MenuItem value="active">Active</MenuItem>
                <MenuItem value="inactive">Inactive</MenuItem>
                <MenuItem value="pending">Pending</MenuItem>
              </Select>
            </FormControl>
          </Grid>
        </Grid>
      </Paper>

      {/* Products Data Grid */}
      <Paper sx={{ height: 600 }}>
        <DataGrid
          rows={filteredProducts}
          columns={columns}
          pageSize={10}
          rowsPerPageOptions={[10, 25, 50]}
          checkboxSelection
          disableSelectionOnClick
          sx={{
            '& .MuiDataGrid-cell:focus': {
              outline: 'none',
            },
          }}
        />
      </Paper>

      {/* Edit/Create Product Dialog */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          {selectedProduct?.id ? 'Edit Product' : 'Create New Product'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ pt: 1 }}>
            <Grid item xs={12} md={6}>
              <TextField
                label="Product Name"
                value={selectedProduct?.name || ''}
                onChange={(e) => setSelectedProduct({ ...selectedProduct, name: e.target.value })}
                fullWidth
                margin="normal"
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                label="Price"
                type="number"
                value={selectedProduct?.price || ''}
                onChange={(e) => setSelectedProduct({ ...selectedProduct, price: parseFloat(e.target.value) })}
                fullWidth
                margin="normal"
                InputProps={{
                  startAdornment: '$',
                }}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                label="Description"
                multiline
                rows={3}
                value={selectedProduct?.description || ''}
                onChange={(e) => setSelectedProduct({ ...selectedProduct, description: e.target.value })}
                fullWidth
                margin="normal"
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth margin="normal">
                <InputLabel>Category</InputLabel>
                <Select
                  value={selectedProduct?.category || ''}
                  label="Category"
                  onChange={(e) => setSelectedProduct({ ...selectedProduct, category: e.target.value })}
                >
                  {categories.map((category) => (
                    <MenuItem key={category.id} value={category.name}>
                      {category.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth margin="normal">
                <InputLabel>Vendor</InputLabel>
                <Select
                  value={selectedProduct?.vendor || ''}
                  label="Vendor"
                  onChange={(e) => setSelectedProduct({ ...selectedProduct, vendor: e.target.value })}
                >
                  {vendors.map((vendor) => (
                    <MenuItem key={vendor.id} value={vendor.name}>
                      {vendor.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                label="Stock Quantity"
                type="number"
                value={selectedProduct?.stock || 0}
                onChange={(e) => setSelectedProduct({ ...selectedProduct, stock: parseInt(e.target.value) })}
                fullWidth
                margin="normal"
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                label="Image URL"
                value={selectedProduct?.image_url || ''}
                onChange={(e) => setSelectedProduct({ ...selectedProduct, image_url: e.target.value })}
                fullWidth
                margin="normal"
                InputProps={{
                  startAdornment: <Image sx={{ mr: 1, color: 'text.secondary' }} />,
                }}
              />
            </Grid>
            <Grid item xs={12}>
              <FormControl fullWidth margin="normal">
                <InputLabel>Status</InputLabel>
                <Select
                  value={selectedProduct?.status || 'active'}
                  label="Status"
                  onChange={(e) => setSelectedProduct({ ...selectedProduct, status: e.target.value })}
                >
                  <MenuItem value="active">Active</MenuItem>
                  <MenuItem value="inactive">Inactive</MenuItem>
                  <MenuItem value="pending">Pending</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleSaveProduct} variant="contained">Save</Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete product "{selectedProduct?.name}"? This action cannot be undone.
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

export default ProductsPage; 