import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import api, { categoriesApi } from '../../utils/api';

export const fetchCategories = createAsyncThunk('categories/fetchAll', async (_, thunkAPI) => {
  try {
    const res = await categoriesApi.list();
    return res.data || [];
  } catch (e) {
    return thunkAPI.rejectWithValue(e.response?.data?.message || 'Failed to load categories');
  }
});

export const createCategory = createAsyncThunk('categories/create', async ({ name, description, files }, thunkAPI) => {
  try {
    const res = await categoriesApi.create({ name, description, files });
    return res.data?.category;
  } catch (e) {
    console.log("why category could not be created",e)
    return thunkAPI.rejectWithValue(e.response?.data?.error || 'Failed to create category');
  }
});

export const fetchCategoryDetail = createAsyncThunk('categories/fetchOne', async (id, thunkAPI) => {
  try {
    const res = await categoriesApi.detail(id);
    return res.data;
  } catch (e) {
    return thunkAPI.rejectWithValue(e.response?.data?.error || 'Failed to load category');
  }
});

export const updateCategoryWithImages = createAsyncThunk('categories/updateWithImages', async ({ id, name, description, keepImages, files }, thunkAPI) => {
  try {
    await categoriesApi.updateWithImages({ id, name, description, keepImages, files });
    const res = await categoriesApi.detail(id);
    return res.data;
  } catch (e) {
    return thunkAPI.rejectWithValue(e.response?.data?.error || 'Failed to update category');
  }
});

export const deleteCategoryThunk = createAsyncThunk('categories/delete', async ({ id }, thunkAPI) => {
  try {
    await categoriesApi.remove(id);
    return id;
  } catch (e) {
    return thunkAPI.rejectWithValue(e.response?.data?.error || 'Failed to delete category');
  }
});

export const fetchCategorySubcategories = createAsyncThunk('categories/fetchSubcategories', async (id, thunkAPI) => {
  try {
    const res = await categoriesApi.subcategories(id);
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

      .addCase(createCategory.pending, (s) => { s.loading = true; s.error = null; })
      .addCase(createCategory.fulfilled, (s, a) => { s.loading = false; if (a.payload) s.list.unshift(a.payload); })
      .addCase(createCategory.rejected, (s, a) => { s.loading = false; s.error = a.payload; })

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


