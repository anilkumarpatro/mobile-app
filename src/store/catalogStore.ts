import { create } from 'zustand';
import {
  fetchCategories,
  fetchCustomerProductsPage,
  fetchCustomerProductsByCategoryPage,
  fetchProductsSearchPage,
} from '../services/products.service';
import type { Category, Product } from '../types';

type CatalogState = {
  categories: Category[];
  products: Product[];
  isLoading: boolean;
  error: string | null;
  loadHome: () => Promise<void>;
  loadCategoryProducts: (categoryId: string, page?: number) => Promise<{ products: Product[]; hasMore: boolean }>;
  searchProducts: (query: string, page?: number) => Promise<{ products: Product[]; hasMore: boolean }>;
};

export const useCatalogStore = create<CatalogState>((set, get) => ({
  categories: [],
  products: [],
  isLoading: false,
  error: null,

  loadHome: async () => {
    set({ isLoading: true, error: null });
    try {
      const categories = await fetchCategories();
      const page = await fetchCustomerProductsPage(categories, { page: 0, size: 40 });
      set({ categories, products: page.products, isLoading: false });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to load catalog',
        isLoading: false,
      });
    }
  },

  loadCategoryProducts: async (categoryId, page = 0) => {
    const categories = get().categories.length ? get().categories : await fetchCategories();
    if (!get().categories.length) set({ categories });
    const result = await fetchCustomerProductsByCategoryPage(categoryId, categories, { page, size: 20 });
    return { products: result.products, hasMore: result.page + 1 < result.totalPages };
  },

  searchProducts: async (query, page = 0) => {
    const categories = get().categories.length ? get().categories : await fetchCategories();
    if (!get().categories.length) set({ categories });
    const result = await fetchProductsSearchPage(query, categories, { page, size: 20 });
    return { products: result.products, hasMore: result.page + 1 < result.totalPages };
  },
}));
