import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { subcategoriesApi } from '../../utils/api';

export const fetchSubcategories = createAsyncThunk('subcategories/fetchAll', async (_, thunkAPI) => {
  try {
    const res = await subcategoriesApi.list();
    return res.data || [];
  } catch (e) {
    return thunkAPI.rejectWithValue(e.response?.data?.error || 'Failed to load subcategories');
  }
});

export const fetchSubcategoryDetail = createAsyncThunk('subcategories/fetchOne', async (id, thunkAPI) => {
  try {
    const res = await subcategoriesApi.detail(id);
    return res.data;
  } catch (e) {
    return thunkAPI.rejectWithValue(e.response?.data?.error || 'Failed to load subcategory');
  }
});

export const createSubcategory = createAsyncThunk('subcategories/create', async ({ name, category_id, files }, thunkAPI) => {
  try {
    const res = await subcategoriesApi.create({ name, category_id, files });
    return res.data?.subcategory;
  } catch (e) {
    return thunkAPI.rejectWithValue(e.response?.data?.error || 'Failed to create subcategory');
  }
});

export const updateSubcategoryWithImages = createAsyncThunk('subcategories/updateWithImages', async ({ id, name, category_id, keepImages, files }, thunkAPI) => {
  try {
    await subcategoriesApi.updateWithImages({ id, name, category_id, keepImages, files });
    const res = await subcategoriesApi.detail(id);
    return res.data;
  } catch (e) {
    return thunkAPI.rejectWithValue(e.response?.data?.error || 'Failed to update subcategory');
  }
});

export const deleteSubcategory = createAsyncThunk('subcategories/delete', async ({ id }, thunkAPI) => {
  try {
    await subcategoriesApi.remove(id);
    return id;
  } catch (e) {
    return thunkAPI.rejectWithValue(e.response?.data?.error || 'Failed to delete subcategory');
  }
});

export const fetchDeletedSubcategories = createAsyncThunk('subcategories/fetchDeleted', async (_, thunkAPI) => {
  try {
    const res = await subcategoriesApi.deleted();
    return res.data?.subcategories || [];
  } catch (e) {
    return thunkAPI.rejectWithValue(e.response?.data?.error || 'Failed to load deleted subcategories');
  }
});

export const restoreSubcategory = createAsyncThunk('subcategories/restore', async ({ id }, thunkAPI) => {
  try {
    const res = await subcategoriesApi.restore(id);
    return res.data?.subcategory;
  } catch (e) {
    return thunkAPI.rejectWithValue(e.response?.data?.error || 'Failed to restore subcategory');
  }
});

export const purgeSubcategory = createAsyncThunk('subcategories/purge', async ({ id }, thunkAPI) => {
  try {
    const res = await subcategoriesApi.purge(id);
    return res.data?.subcategory?.id ?? id;
  } catch (e) {
    return thunkAPI.rejectWithValue(e.response?.data?.error || 'Failed to permanently delete subcategory');
  }
});

const subcategoriesSlice = createSlice({
  name: 'subcategories',
  initialState: {
    list: [],
    current: null,
    deleted: [],
    loading: false,
    createLoading: false,
    updateLoading: false,
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchSubcategories.pending, (s) => { s.loading = true; s.error = null; })
      .addCase(fetchSubcategories.fulfilled, (s, a) => { s.loading = false; s.list = a.payload; })
      .addCase(fetchSubcategories.rejected, (s, a) => { s.loading = false; s.error = a.payload; })

      .addCase(fetchSubcategoryDetail.pending, (s) => { s.loading = true; s.error = null; })
      .addCase(fetchSubcategoryDetail.fulfilled, (s, a) => { s.loading = false; s.current = a.payload; })
      .addCase(fetchSubcategoryDetail.rejected, (s, a) => { s.loading = false; s.error = a.payload; })

      .addCase(createSubcategory.pending, (s) => { s.createLoading = true; s.error = null; })
      .addCase(createSubcategory.fulfilled, (s, a) => { s.createLoading = false; if (a.payload) s.list.unshift(a.payload); })
      .addCase(createSubcategory.rejected, (s, a) => { s.createLoading = false; s.error = a.payload; })

      .addCase(updateSubcategoryWithImages.pending, (s) => { s.updateLoading = true; s.error = null; })
      .addCase(updateSubcategoryWithImages.fulfilled, (s, a) => { s.updateLoading = false; s.current = a.payload; const i = s.list.findIndex(x => x.id === a.payload?.id); if (i !== -1) s.list[i] = a.payload; })
      .addCase(updateSubcategoryWithImages.rejected, (s, a) => { s.updateLoading = false; s.error = a.payload; })

      .addCase(deleteSubcategory.fulfilled, (s, a) => { s.list = s.list.filter(x => x.id !== a.payload); if (s.current?.id === a.payload) s.current = null; })

      .addCase(fetchDeletedSubcategories.pending, (s) => { s.loading = true; s.error = null; })
      .addCase(fetchDeletedSubcategories.fulfilled, (s, a) => { s.loading = false; s.deleted = a.payload; })
      .addCase(fetchDeletedSubcategories.rejected, (s, a) => { s.loading = false; s.error = a.payload; })
      .addCase(restoreSubcategory.fulfilled, (s, a) => { const id = a.payload?.id; if (id) s.deleted = s.deleted.filter(x => x.id !== id); })
      .addCase(purgeSubcategory.fulfilled, (s, a) => { const id = a.payload; s.deleted = s.deleted.filter(x => x.id !== id); });
  }
});

export default subcategoriesSlice.reducer;


