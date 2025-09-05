import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import api from '../../utils/api';

export const fetchSubscriptions = createAsyncThunk('subscriptions/fetchAll', async (_, thunkAPI) => {
  try {
    const res = await api.get('/api/subscription');
    return res.data || [];
  } catch (e) {
    return thunkAPI.rejectWithValue(e.response?.data?.error || 'Failed to load subscriptions');
  }
});

export const fetchSubscriptionDetail = createAsyncThunk('subscriptions/fetchDetail', async (id, thunkAPI) => {
  try {
    const res = await api.get(`/api/subscription/${id}/details`);
    return res.data;
  } catch (e) {
    return thunkAPI.rejectWithValue(e.response?.data?.error || e.response?.data?.message || 'Failed to load subscription details');
  }
});

export const createSubscriptionThunk = createAsyncThunk('subscriptions/create', async ({ plan, amount, start_date, end_date, status }, thunkAPI) => {
  try {
    const res = await api.post('/api/subscription', { plan, amount, start_date, end_date, status });
    return res.data.subscription;
  } catch (e) {
    return thunkAPI.rejectWithValue(e.response?.data?.error || 'Failed to create subscription');
  }
});

export const updateSubscriptionThunk = createAsyncThunk('subscriptions/update', async ({ id, plan, amount, start_date, end_date, status }, thunkAPI) => {
  try {
    const res = await api.put(`/api/subscription/${id}`, { plan, amount, start_date, end_date, status });
    return res.data.subscription;
  } catch (e) {
    return thunkAPI.rejectWithValue(e.response?.data?.error || 'Failed to update subscription');
  }
});

export const deleteSubscriptionThunk = createAsyncThunk('subscriptions/delete', async (id, thunkAPI) => {
  try {
    await api.delete(`/api/subscription/${id}`);
    return id;
  } catch (e) {
    return thunkAPI.rejectWithValue(e.response?.data?.error || 'Failed to delete subscription');
  }
});

const subscriptionsSlice = createSlice({
  name: 'subscriptions',
  initialState: { 
    list: [], 
    current: null,
    loading: false, 
    detailLoading: false,
    error: null 
  },
  reducers: {
    clearCurrent: (state) => {
      state.current = null;
    },
    clearError: (state) => {
      state.error = null;
    }
  },
  extraReducers: (builder) => {
    builder
      // Fetch all subscriptions
      .addCase(fetchSubscriptions.pending, (state) => { 
        state.loading = true; 
        state.error = null; 
      })
      .addCase(fetchSubscriptions.fulfilled, (state, action) => { 
        state.loading = false; 
        state.list = action.payload; 
      })
      .addCase(fetchSubscriptions.rejected, (state, action) => { 
        state.loading = false; 
        state.error = action.payload; 
      })
      // Fetch subscription detail
      .addCase(fetchSubscriptionDetail.pending, (state) => { 
        state.detailLoading = true; 
        state.error = null; 
      })
      .addCase(fetchSubscriptionDetail.fulfilled, (state, action) => { 
        state.detailLoading = false; 
        state.current = action.payload; 
      })
      .addCase(fetchSubscriptionDetail.rejected, (state, action) => { 
        state.detailLoading = false; 
        state.error = action.payload; 
      })
      // Create subscription
      .addCase(createSubscriptionThunk.fulfilled, (state, action) => { 
        if (action.payload) state.list.unshift(action.payload); 
      })
      // Update subscription
      .addCase(updateSubscriptionThunk.fulfilled, (state, action) => { 
        const index = state.list.findIndex(x => x.id === action.payload?.id); 
        if (index !== -1) state.list[index] = action.payload;
        if (state.current?.id === action.payload?.id) {
          state.current = action.payload;
        }
      })
      // Delete subscription
      .addCase(deleteSubscriptionThunk.fulfilled, (state, action) => { 
        state.list = state.list.filter(x => x.id !== action.payload);
        if (state.current?.id === action.payload) {
          state.current = null;
        }
      });
  }
});

export const { clearCurrent, clearError } = subscriptionsSlice.actions;

// Export aliases for consistency with other slices
export const createSubscription = createSubscriptionThunk;
export const updateSubscription = updateSubscriptionThunk;
export const deleteSubscription = deleteSubscriptionThunk;

export default subscriptionsSlice.reducer;


