import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Chip,
  IconButton,
  Tooltip,
  Alert,
  CircularProgress,
  Grid,
  Card,
  CardMedia,
  CardContent,
  FormControl,
  InputLabel,
  Select,
  MenuItem
} from '@mui/material';
import {
  Search,
  Visibility,
  Category,
  Store,
  FilterList,
  Image
} from '@mui/icons-material';
import { DataGrid } from '@mui/x-data-grid';
import { useDispatch, useSelector } from 'react-redux';
import { fetchProducts, fetchMyProducts, fetchAdminProducts } from '../../store/slices/productsSlice';

const ProductsPage = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { items: products, loading } = useSelector(state => state.products);
  const [categories, setCategories] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterVendor, setFilterVendor] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');

  useEffect(() => {
    dispatch(fetchAdminProducts({ page: 1, limit: 50 }));
  }, [dispatch]);

  useEffect(() => {
    // Move category and vendor fetching to dedicated thunks later if needed
    // For now, leave as is if there are no slices; but user requested no API calls here.
    // So set empty arrays to avoid runtime fetch in component.
    setCategories([]);
    setVendors([]);
  }, []);

  const vendorsByType = useMemo(() => {
    const list = Array.isArray(vendors) ? vendors : [];
    const individual = list.filter(v => v.type === 'individual');
    const business = list.filter(v => v.type === 'business');
    return { individual, business };
  }, [vendors]);

  // Normalize backend product shape to flat rows for the grid
  const productRows = useMemo(() => {
    const list = Array.isArray(products) ? products : [];
    return list.map(p => ({
      id: p.id,
      name: p.name,
      description: p.description,
      price: p.price ?? p.unit_price ?? 0,
      category: p.category?.name || p.category_name || '',
      vendor: p.vendor?.name || p.vendor_name || '',
      status: p.status || (p.stock > 0 ? 'active' : 'inactive'),
      stock: p.stock ?? 0,
      rating: typeof p.rating === 'number' ? p.rating : (p.rating?.average || p.rating?.score || 0),
      image_url: (Array.isArray(p.images) && p.images[0]?.image_url) ? p.images[0].image_url : p.image_url || '',
      created_at: p.created_at || p.createdAt || new Date().toISOString(),
    }));
  }, [products]);




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
      width: 120,
      renderCell: (params) => (
        <Box>
          <Tooltip title="View Details">
            <IconButton 
              size="small" 
              color="primary"
              onClick={() => navigate(`/products/${params.row.id}`)}
            >
              <Visibility />
            </IconButton>
          </Tooltip>
        </Box>
      ),
    },
  ];

  const filteredProducts = productRows.filter(product => {
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
      {/* Vendors Overview */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Typography variant="h6" sx={{ mb: 1 }}>Vendors Overview</Typography>
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
          <Paper sx={{ p: 2, flex: 1, minWidth: 260 }}>
            <Typography variant="subtitle1" fontWeight="bold">Individual Vendors ({vendorsByType.individual.length})</Typography>
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mt: 1 }}>
              {vendorsByType.individual.slice(0, 12).map(v => (
                <Chip key={v.id} label={v.name} size="small" color="success" />
              ))}
              {vendorsByType.individual.length === 0 && (
                <Typography variant="body2" color="text.secondary">No individual vendors</Typography>
              )}
            </Box>
          </Paper>
          <Paper sx={{ p: 2, flex: 1, minWidth: 260 }}>
            <Typography variant="subtitle1" fontWeight="bold">Business Vendors ({vendorsByType.business.length})</Typography>
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mt: 1 }}>
              {vendorsByType.business.slice(0, 12).map(v => (
                <Chip key={v.id} label={v.name} size="small" color="primary" />
              ))}
              {vendorsByType.business.length === 0 && (
                <Typography variant="body2" color="text.secondary">No business vendors</Typography>
              )}
            </Box>
          </Paper>
        </Box>
      </Paper>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" fontWeight="bold">
          Product Management
        </Typography>
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
                {(Array.isArray(categories) ? categories : []).map((category) => (
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
                {(Array.isArray(vendors) ? vendors : []).map((vendor) => (
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
          rows={Array.isArray(filteredProducts) ? filteredProducts : []}
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


    </Box>
  );
};

export default ProductsPage;

