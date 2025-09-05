import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import api from '../../utils/api';

export const fetchProducts = createAsyncThunk(
  'products/fetchAll',
  async ({ page = 1, limit = 10, category_id, vendor_id, search } = {}, thunkAPI) => {
    try {
      const params = new URLSearchParams();
      params.set('page', String(page));
      params.set('limit', String(limit));
      if (category_id) params.set('category_id', String(category_id));
      if (vendor_id) params.set('vendor_id', String(vendor_id));
      if (search) params.set('search', search);
      const res = await api.get(`/api/products?${params.toString()}`);
      return {
        items: Array.isArray(res.data?.products) ? res.data.products : [],
        pagination: res.data?.pagination || { page, limit, total: 0, pages: 0 },
      };
    } catch (e) {
      return thunkAPI.rejectWithValue(e.response?.data?.message || 'Failed to load products');
    }
  }
);

export const createProduct = createAsyncThunk(
  'products/create',
  async (payload, thunkAPI) => {
    try {
      const res = await api.post('/api/products', payload);
      // After creating, refresh listing
      thunkAPI.dispatch(fetchProducts({}));
      return res.data?.product;
    } catch (e) {
      return thunkAPI.rejectWithValue(e.response?.data?.error || 'Failed to create product');
    }
  }
);

export const updateProduct = createAsyncThunk(
  'products/update',
  async ({ id, data }, thunkAPI) => {
    try {
      const res = await api.put(`/api/products/${id}`, data);
      // After updating, refresh listing
      thunkAPI.dispatch(fetchProducts({}));
      return res.data?.product;
    } catch (e) {
      return thunkAPI.rejectWithValue(e.response?.data?.error || 'Failed to update product');
    }
  }
);

export const deleteProduct = createAsyncThunk(
  'products/delete',
  async (id, thunkAPI) => {
    try {
      await api.delete(`/api/products/${id}`);
      // After deleting, refresh listing
      thunkAPI.dispatch(fetchProducts({}));
      return id;
    } catch (e) {
      return thunkAPI.rejectWithValue(e.response?.data?.error || 'Failed to delete product');
    }
  }
);

const productsSlice = createSlice({
  name: 'products',
  initialState: {
    items: [],
    pagination: { page: 1, limit: 10, total: 0, pages: 0 },
    loading: false,
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchProducts.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchProducts.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload.items;
        state.pagination = action.payload.pagination;
      })
      .addCase(fetchProducts.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Error';
        state.items = [];
      })
      .addCase(createProduct.rejected, (state, action) => {
        state.error = action.payload || 'Error';
      })
      .addCase(updateProduct.rejected, (state, action) => {
        state.error = action.payload || 'Error';
      })
      .addCase(deleteProduct.rejected, (state, action) => {
        state.error = action.payload || 'Error';
      });
  },
});

export default productsSlice.reducer;


