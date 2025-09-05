import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { walletApi } from '../../utils/api';

// Fetch wallet by user (or vendor-resolved) ID
export const fetchWalletByUserId = createAsyncThunk(
  'wallets/fetchByUserId',
  async ({ id, isVendor = false }, thunkAPI) => {
    try {
      const res = await walletApi.getByUserId(id, isVendor);
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
  async ({ id, page = 1, limit = 20, isVendor = false }, thunkAPI) => {
    try {
      const res = await walletApi.getTransactions(id, page, limit, isVendor);
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
  async ({ id, amount, reason, isVendor = false }, thunkAPI) => {
    try {
      const res = await walletApi.addFunds(id, { amount, reason }, isVendor);
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
  async ({ id, amount, reason, isVendor = false }, thunkAPI) => {
    try {
      const res = await walletApi.deductFunds(id, { amount, reason }, isVendor);
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
  async ({ id, isVendor = false }, thunkAPI) => {
    try {
      const res = await walletApi.getBalance(id, isVendor);
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
      const res = await walletApi.getTransaction(transactionId);
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
  async ({ id, isVendor = false }, thunkAPI) => {
    try {
      const res = await walletApi.exportCsv(id, isVendor);
      return { data: res.data, id };
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
      const res = await walletApi.listAll(page, limit);
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
        const updatedWallet = action.payload.wallet;
        const newTransaction = action.payload.transaction;
        if (state.currentWallet) {
          state.currentWallet = updatedWallet;
        }
        state.balance = updatedWallet?.balance ?? state.balance;
        if (newTransaction) {
          state.transactions = [newTransaction, ...(state.transactions || [])];
        }
      })
      // Deduct funds
      .addCase(deductFunds.fulfilled, (state, action) => {
        const updatedWallet = action.payload.wallet;
        const newTransaction = action.payload.transaction;
        if (state.currentWallet) {
          state.currentWallet = updatedWallet;
        }
        state.balance = updatedWallet?.balance ?? state.balance;
        if (newTransaction) {
          state.transactions = [newTransaction, ...(state.transactions || [])];
        }
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
