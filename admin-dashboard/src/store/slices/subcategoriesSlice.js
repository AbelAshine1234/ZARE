import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import api from '../../utils/api';

export const fetchSubcategories = createAsyncThunk('subcategories/fetchAll', async (_, thunkAPI) => {
  try {
    const res = await api.get('/api/subcategory');
    return res.data || [];
  } catch (e) {
    return thunkAPI.rejectWithValue(e.response?.data?.error || 'Failed to load subcategories');
  }
});

export const fetchSubcategoryDetail = createAsyncThunk('subcategories/fetchOne', async (id, thunkAPI) => {
  try {
    const res = await api.get(`/api/subcategory/${id}`);
    return res.data;
  } catch (e) {
    return thunkAPI.rejectWithValue(e.response?.data?.error || 'Failed to load subcategory');
  }
});

export const createSubcategory = createAsyncThunk('subcategories/create', async ({ name, category_id, files }, thunkAPI) => {
  try {
    const form = new FormData();
    form.append('name', name);
    form.append('category_id', String(category_id));
    files?.forEach(f => form.append('subcategory_pictures', f));
    const res = await api.post('/api/subcategory', form, { headers: { 'Content-Type': 'multipart/form-data' } });
    return res.data?.subcategory;
  } catch (e) {
    return thunkAPI.rejectWithValue(e.response?.data?.error || 'Failed to create subcategory');
  }
});

export const updateSubcategoryWithImages = createAsyncThunk('subcategories/updateWithImages', async ({ id, name, category_id, keepImages, files }, thunkAPI) => {
  try {
    const form = new FormData();
    form.append('name', name);
    form.append('category_id', String(category_id));
    form.append('keepImages', JSON.stringify(keepImages || []));
    files?.forEach(f => form.append('subcategory_pictures', f));
    await api.put(`/api/subcategory/${id}`, form, { headers: { 'Content-Type': 'multipart/form-data' } });
    const res = await api.get(`/api/subcategory/${id}`);
    return res.data;
  } catch (e) {
    return thunkAPI.rejectWithValue(e.response?.data?.error || 'Failed to update subcategory');
  }
});

export const deleteSubcategory = createAsyncThunk('subcategories/delete', async ({ id }, thunkAPI) => {
  try {
    await api.delete(`/api/subcategory/${id}`);
    return id;
  } catch (e) {
    return thunkAPI.rejectWithValue(e.response?.data?.error || 'Failed to delete subcategory');
  }
});

export const fetchDeletedSubcategories = createAsyncThunk('subcategories/fetchDeleted', async (_, thunkAPI) => {
  try {
    const res = await api.get('/api/subcategory/admin/deleted/list');
    return res.data?.subcategories || [];
  } catch (e) {
    return thunkAPI.rejectWithValue(e.response?.data?.error || 'Failed to load deleted subcategories');
  }
});

export const restoreSubcategory = createAsyncThunk('subcategories/restore', async ({ id }, thunkAPI) => {
  try {
    const res = await api.post(`/api/subcategory/admin/deleted/${id}/restore`);
    return res.data?.subcategory;
  } catch (e) {
    return thunkAPI.rejectWithValue(e.response?.data?.error || 'Failed to restore subcategory');
  }
});

export const purgeSubcategory = createAsyncThunk('subcategories/purge', async ({ id }, thunkAPI) => {
  try {
    const res = await api.delete(`/api/subcategory/admin/deleted/${id}`);
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

      .addCase(createSubcategory.fulfilled, (s, a) => { if (a.payload) s.list.unshift(a.payload); })
      .addCase(updateSubcategoryWithImages.fulfilled, (s, a) => { s.current = a.payload; const i = s.list.findIndex(x => x.id === a.payload?.id); if (i !== -1) s.list[i] = a.payload; })
      .addCase(deleteSubcategory.fulfilled, (s, a) => { s.list = s.list.filter(x => x.id !== a.payload); if (s.current?.id === a.payload) s.current = null; })

      .addCase(fetchDeletedSubcategories.pending, (s) => { s.loading = true; s.error = null; })
      .addCase(fetchDeletedSubcategories.fulfilled, (s, a) => { s.loading = false; s.deleted = a.payload; })
      .addCase(fetchDeletedSubcategories.rejected, (s, a) => { s.loading = false; s.error = a.payload; })
      .addCase(restoreSubcategory.fulfilled, (s, a) => { const id = a.payload?.id; if (id) s.deleted = s.deleted.filter(x => x.id !== id); })
      .addCase(purgeSubcategory.fulfilled, (s, a) => { const id = a.payload; s.deleted = s.deleted.filter(x => x.id !== id); });
  }
});

export default subcategoriesSlice.reducer;


