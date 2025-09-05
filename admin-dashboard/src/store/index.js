import { configureStore } from '@reduxjs/toolkit';
import { setupListeners } from '@reduxjs/toolkit/query';
import vendorsReducer from './slices/vendorsSlice';
import categoriesReducer from './slices/categoriesSlice';
import subcategoriesReducer from './slices/subcategoriesSlice';
import subscriptionsReducer from './slices/subscriptionsSlice';
import walletsReducer from './slices/walletsSlice';
import productsReducer from './slices/productsSlice';

const store = configureStore({
  reducer: {
    vendors: vendorsReducer,
    categories: categoriesReducer,
    subcategories: subcategoriesReducer,
    subscriptions: subscriptionsReducer,
    wallets: walletsReducer,
    products: productsReducer,
  },
  middleware: (getDefaultMiddleware) => getDefaultMiddleware(),
});

setupListeners(store.dispatch);

export default store;

