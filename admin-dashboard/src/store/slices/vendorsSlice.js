import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../utils/api';

export const fetchVendors = createAsyncThunk('vendors/fetchAll', async (_, thunkAPI) => {
  try {
    const res = await api.get('/api/vendors');
    // backend returns { vendors: [...] }
    return res.data.vendors || [];
  } catch (err) {
    return thunkAPI.rejectWithValue(err.response?.data?.message || 'Failed to load vendors');
  }
});

export const approveVendor = createAsyncThunk('vendors/approve', async ({ vendor_id, isApproved }, thunkAPI) => {
  try {
    const res = await api.patch('/api/vendors/approve', { vendor_id, isApproved });
    return { vendor_id, isApproved: res.data.vendor?.isApproved ?? isApproved };
  } catch (err) {
    return thunkAPI.rejectWithValue(err.response?.data?.error || 'Failed to update approval');
  }
});

export const fetchVendorDetail = createAsyncThunk('vendors/fetchOne', async (id, thunkAPI) => {
  try {
    const res = await api.get(`/api/vendors/${id}`);
    return res.data.vendor;
  } catch (err) {
    return thunkAPI.rejectWithValue(err.response?.data?.error || 'Failed to load vendor');
  }
});

export const toggleVendorStatus = createAsyncThunk('vendors/status', async ({ status }, thunkAPI) => {
  try {
    const res = await api.patch('/api/vendors/status', { status });
    return res.data.vendor; // { id, status }
  } catch (err) {
    return thunkAPI.rejectWithValue(err.response?.data?.error || 'Failed to update status');
  }
});

export const deleteVendor = createAsyncThunk('vendors/delete', async ({ id }, thunkAPI) => {
  try {
    await api.delete(`/api/vendors/${id}`);
    return id;
  } catch (err) {
    // Fallback: non-admin can delete their own via body route
    try {
      await api.delete('/api/vendors', { data: { vendor_id: id } });
      return id;
    } catch (err2) {
      return thunkAPI.rejectWithValue(err2.response?.data?.error || err.response?.data?.error || 'Failed to delete vendor');
    }
  }
});

// Recycle bin: list soft-deleted vendors (admin)
export const fetchDeletedVendors = createAsyncThunk('vendors/fetchDeleted', async (_, thunkAPI) => {
  try {
    const res = await api.get('/api/vendors/admin/deleted/list');
    return res.data.vendors || [];
  } catch (err) {
    return thunkAPI.rejectWithValue(err.response?.data?.error || 'Failed to load deleted vendors');
  }
});

// Restore a soft-deleted vendor (admin)
export const restoreVendor = createAsyncThunk('vendors/restore', async ({ id }, thunkAPI) => {
  try {
    const res = await api.post(`/api/vendors/admin/deleted/${id}/restore`);
    return res.data.vendor; // { id, status }
  } catch (err) {
    return thunkAPI.rejectWithValue(err.response?.data?.error || 'Failed to restore vendor');
  }
});

// Permanently delete vendor (admin)
export const purgeVendor = createAsyncThunk('vendors/purge', async ({ id }, thunkAPI) => {
  try {
    const res = await api.delete(`/api/vendors/admin/deleted/${id}`);
    return res.data.vendor?.id ?? id;
  } catch (err) {
    return thunkAPI.rejectWithValue(err.response?.data?.error || 'Failed to permanently delete vendor');
  }
});

const vendorsSlice = createSlice({
  name: 'vendors',
  initialState: {
    items: [],
    current: null,
    deleted: [],
    loading: false,
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchVendors.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchVendors.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload;
      })
      .addCase(fetchVendors.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Error';
      })
      .addCase(fetchVendorDetail.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchVendorDetail.fulfilled, (state, action) => {
        state.loading = false;
        state.current = action.payload;
      })
      .addCase(fetchVendorDetail.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Error';
      })
      // Deleted vendors list
      .addCase(fetchDeletedVendors.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchDeletedVendors.fulfilled, (state, action) => {
        state.loading = false;
        state.deleted = action.payload;
      })
      .addCase(fetchDeletedVendors.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Error';
      })
      .addCase(restoreVendor.fulfilled, (state, action) => {
        const restoredId = action.payload?.id;
        if (restoredId) {
          state.deleted = state.deleted.filter(v => v.id !== restoredId);
        }
      })
      .addCase(purgeVendor.fulfilled, (state, action) => {
        const purgedId = action.payload;
        state.deleted = state.deleted.filter(v => v.id !== purgedId);
      })
      .addCase(approveVendor.fulfilled, (state, action) => {
        const { vendor_id, isApproved } = action.payload;
        const idx = state.items.findIndex(v => v.id === vendor_id);
        if (idx !== -1) state.items[idx].isApproved = isApproved;
        if (state.current && state.current.id === vendor_id) {
          state.current.isApproved = isApproved;
        }
      })
      .addCase(toggleVendorStatus.fulfilled, (state, action) => {
        const { id, status } = action.payload;
        const idx = state.items.findIndex(v => v.id === id);
        if (idx !== -1) state.items[idx].status = status;
        if (state.current && state.current.id === id) {
          state.current.status = status;
        }
      })
      .addCase(deleteVendor.fulfilled, (state, action) => {
        state.items = state.items.filter(v => v.id !== action.payload);
        if (state.current && state.current.id === action.payload) {
          state.current = null;
        }
      });
  }
});

export default vendorsSlice.reducer;

