import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import api from '../../utils/api';

// Fetch wallet by user (or vendor-resolved) ID
export const fetchWalletByUserId = createAsyncThunk(
  'wallets/fetchByUserId',
  async (userId, thunkAPI) => {
    try {
      const res = await api.get(`/api/wallet/${userId}`);
      return res.data.wallet;
    } catch (e) {
      return thunkAPI.rejectWithValue(
        e.response?.data?.error || e.response?.data?.message || 'Failed to load wallet'
      );
    }
  }
);

// Fetch wallet transactions (paginated)
export const fetchWalletTransactions = createAsyncThunk(
  'wallets/fetchTransactions',
  async ({ userId, page = 1, limit = 20 }, thunkAPI) => {
    try {
      const res = await api.get(`/api/wallet/${userId}/transactions?page=${page}&limit=${limit}`);
      return res.data; // { transactions, pagination }
    } catch (e) {
      return thunkAPI.rejectWithValue(
        e.response?.data?.error || e.response?.data?.message || 'Failed to load transactions'
      );
    }
  }
);

// Add funds
export const addFunds = createAsyncThunk(
  'wallets/addFunds',
  async ({ userId, amount, reason }, thunkAPI) => {
    try {
      const res = await api.post(`/api/wallet/${userId}/add`, { amount, reason });
      return res.data; // { message, wallet, transaction }
    } catch (e) {
      return thunkAPI.rejectWithValue(
        e.response?.data?.error || e.response?.data?.message || 'Failed to add funds'
      );
    }
  }
);

// Deduct funds
export const deductFunds = createAsyncThunk(
  'wallets/deductFunds',
  async ({ userId, amount, reason }, thunkAPI) => {
    try {
      const res = await api.post(`/api/wallet/${userId}/deduct`, { amount, reason });
      return res.data; // { message, wallet, transaction }
    } catch (e) {
      return thunkAPI.rejectWithValue(
        e.response?.data?.error || e.response?.data?.message || 'Failed to deduct funds'
      );
    }
  }
);

// Wallet balance
export const fetchWalletBalance = createAsyncThunk(
  'wallets/fetchBalance',
  async (userId, thunkAPI) => {
    try {
      const res = await api.get(`/api/wallet/${userId}/balance`);
      return res.data; // { balance, wallet_id }
    } catch (e) {
      return thunkAPI.rejectWithValue(
        e.response?.data?.error || e.response?.data?.message || 'Failed to load balance'
      );
    }
  }
);

// Single transaction by transaction_id
export const fetchTransactionById = createAsyncThunk(
  'wallets/fetchTransactionById',
  async (transactionId, thunkAPI) => {
    try {
      const res = await api.get(`/api/wallet/transaction/${transactionId}`);
      return res.data.transaction;
    } catch (e) {
      return thunkAPI.rejectWithValue(
        e.response?.data?.error || e.response?.data?.message || 'Failed to load transaction'
      );
    }
  }
);

// Export CSV for a given user (wallet owner)
export const exportTransactionsCSV = createAsyncThunk(
  'wallets/exportCSV',
  async (userId, thunkAPI) => {
    try {
      const res = await api.get(`/api/wallet/${userId}/export/csv`, { responseType: 'blob' });
      return { data: res.data, userId };
    } catch (e) {
      return thunkAPI.rejectWithValue(
        e.response?.data?.error || e.response?.data?.message || 'Failed to export transactions'
      );
    }
  }
);

// All wallets (admin listing)
export const fetchAllWallets = createAsyncThunk(
  'wallets/fetchAll',
  async ({ page = 1, limit = 50 } = {}, thunkAPI) => {
    try {
      const res = await api.get(`/api/wallet?page=${page}&limit=${limit}`);
      return res.data; // { wallets, pagination }
    } catch (e) {
      return thunkAPI.rejectWithValue(
        e.response?.data?.error || e.response?.data?.message || 'Failed to load wallets'
      );
    }
  }
);

const walletsSlice = createSlice({
  name: 'wallets',
  initialState: {
    currentWallet: null,
    allWallets: [],
    transactions: [],
    currentTransaction: null,
    balance: null,
    loading: false,
    allWalletsLoading: false,
    transactionsLoading: false,
    transactionLoading: false,
    error: null,
    pagination: { page: 1, limit: 20, total: 0, pages: 0 },
  },
  reducers: {
    clearCurrentWallet: (state) => {
      state.currentWallet = null;
      state.transactions = [];
      state.balance = null;
    },
    clearCurrentTransaction: (state) => {
      state.currentTransaction = null;
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch wallet by user ID
      .addCase(fetchWalletByUserId.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchWalletByUserId.fulfilled, (state, action) => {
        state.loading = false;
        state.currentWallet = action.payload;
      })
      .addCase(fetchWalletByUserId.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Transactions
      .addCase(fetchWalletTransactions.pending, (state) => {
        state.transactionsLoading = true;
        state.error = null;
      })
      .addCase(fetchWalletTransactions.fulfilled, (state, action) => {
        state.transactionsLoading = false;
        state.transactions = action.payload.transactions || [];
        state.pagination = action.payload.pagination || state.pagination;
      })
      .addCase(fetchWalletTransactions.rejected, (state, action) => {
        state.transactionsLoading = false;
        state.error = action.payload;
      })
      // Add funds
      .addCase(addFunds.fulfilled, (state, action) => {
        if (state.currentWallet) {
          state.currentWallet = action.payload.wallet;
        }
        state.balance = action.payload.wallet?.balance ?? state.balance;
      })
      // Deduct funds
      .addCase(deductFunds.fulfilled, (state, action) => {
        if (state.currentWallet) {
          state.currentWallet = action.payload.wallet;
        }
        state.balance = action.payload.wallet?.balance ?? state.balance;
      })
      // Balance
      .addCase(fetchWalletBalance.fulfilled, (state, action) => {
        state.balance = action.payload.balance;
      })
      // Single transaction
      .addCase(fetchTransactionById.pending, (state) => {
        state.transactionLoading = true;
        state.error = null;
      })
      .addCase(fetchTransactionById.fulfilled, (state, action) => {
        state.transactionLoading = false;
        state.currentTransaction = action.payload;
      })
      .addCase(fetchTransactionById.rejected, (state, action) => {
        state.transactionLoading = false;
        state.error = action.payload;
      })
      // Export CSV (no state change on success; handled in UI)
      .addCase(exportTransactionsCSV.rejected, (state, action) => {
        state.error = action.payload;
      })
      // All wallets
      .addCase(fetchAllWallets.pending, (state) => {
        state.allWalletsLoading = true;
        state.error = null;
      })
      .addCase(fetchAllWallets.fulfilled, (state, action) => {
        state.allWalletsLoading = false;
        state.allWallets = action.payload.wallets || [];
        state.pagination = action.payload.pagination || state.pagination;
      })
      .addCase(fetchAllWallets.rejected, (state, action) => {
        state.allWalletsLoading = false;
        state.error = action.payload;
      });
  },
});

export const { clearCurrentWallet, clearCurrentTransaction, clearError } = walletsSlice.actions;
export default walletsSlice.reducer;
