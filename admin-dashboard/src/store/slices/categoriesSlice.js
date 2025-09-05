import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import api from '../../utils/api';

export const fetchCategories = createAsyncThunk('categories/fetchAll', async (_, thunkAPI) => {
  try {
    const res = await api.get('/api/category');
    return res.data || [];
  } catch (e) {
    return thunkAPI.rejectWithValue(e.response?.data?.message || 'Failed to load categories');
  }
});

export const fetchCategoryDetail = createAsyncThunk('categories/fetchOne', async (id, thunkAPI) => {
  try {
    const res = await api.get(`/api/category/${id}`);
    return res.data;
  } catch (e) {
    return thunkAPI.rejectWithValue(e.response?.data?.error || 'Failed to load category');
  }
});

export const updateCategoryWithImages = createAsyncThunk('categories/updateWithImages', async ({ id, name, description, keepImages, files }, thunkAPI) => {
  try {
    const form = new FormData();
    form.append('name', name);
    form.append('description', description);
    form.append('keepImages', JSON.stringify(keepImages));
    files?.forEach(f => form.append('category_pictures', f));
    await api.put(`/api/category/${id}`, form, { headers: { 'Content-Type': 'multipart/form-data' } });
    const res = await api.get(`/api/category/${id}`);
    return res.data;
  } catch (e) {
    return thunkAPI.rejectWithValue(e.response?.data?.error || 'Failed to update category');
  }
});

export const deleteCategoryThunk = createAsyncThunk('categories/delete', async ({ id }, thunkAPI) => {
  try {
    await api.delete(`/api/category/${id}`);
    return id;
  } catch (e) {
    return thunkAPI.rejectWithValue(e.response?.data?.error || 'Failed to delete category');
  }
});

export const fetchCategorySubcategories = createAsyncThunk('categories/fetchSubcategories', async (id, thunkAPI) => {
  try {
    const res = await api.get(`/api/category/${id}/subcategories`);
    return { id, subcategories: res.data || [] };
  } catch (e) {
    return thunkAPI.rejectWithValue(e.response?.data?.error || 'Failed to load subcategories');
  }
});

const categoriesSlice = createSlice({
  name: 'categories',
  initialState: { list: [], current: null, currentSubcategories: [], loading: false, error: null },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchCategories.pending, (s) => { s.loading = true; s.error = null; })
      .addCase(fetchCategories.fulfilled, (s, a) => { s.loading = false; s.list = a.payload; })
      .addCase(fetchCategories.rejected, (s, a) => { s.loading = false; s.error = a.payload; })

      .addCase(fetchCategoryDetail.pending, (s) => { s.loading = true; s.error = null; })
      .addCase(fetchCategoryDetail.fulfilled, (s, a) => { s.loading = false; s.current = a.payload; })
      .addCase(fetchCategoryDetail.rejected, (s, a) => { s.loading = false; s.error = a.payload; })

      .addCase(updateCategoryWithImages.pending, (s) => { s.loading = true; s.error = null; })
      .addCase(updateCategoryWithImages.fulfilled, (s, a) => { s.loading = false; s.current = a.payload; })
      .addCase(updateCategoryWithImages.rejected, (s, a) => { s.loading = false; s.error = a.payload; });
      
      builder
      .addCase(deleteCategoryThunk.fulfilled, (s, a) => {
        s.list = s.list.filter(c => c.id !== a.payload);
        if (s.current?.id === a.payload) s.current = null;
      })
      .addCase(fetchCategorySubcategories.fulfilled, (s, a) => {
        if (s.current && s.current.id === a.payload.id) {
          s.currentSubcategories = a.payload.subcategories;
        }
      });
  }
});

export default categoriesSlice.reducer;


