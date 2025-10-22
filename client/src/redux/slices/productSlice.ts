import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axiosInstance from "../../utils/axiosInstance";
import { Product, ProductsResponse, PaginationMetadata, ProductsPaginationInfo } from "../../interfaces/product";
import { getErrorMessage, ApiResponse } from "@/types/api";

interface ProductsState {
  products: Product[];
  pagination: PaginationMetadata | null;
  loading: boolean;
  error: string | null;
  productDetail: Product | null;
  searchResults: Product[];
  searchPagination: PaginationMetadata | null; // Nueva metadata para búsqueda
  searchLoading: boolean;
  searchError: string | null;
  paginationInfoLoading: boolean;
  paginationInfoError: string | null;
}

const initialState: ProductsState = {
  products: [],
  pagination: null,
  loading: false,
  error: null,
  productDetail: null,
  searchResults: [],
  searchPagination: null, // Inicializar metadata de búsqueda
  searchLoading: false,
  searchError: null,
  paginationInfoLoading: false,
  paginationInfoError: null,
};

// Fetch products with optional filters and pagination
// ⚠️ DEPRECADO: Considera usar fetchProductsByPage para mejor performance
export const fetchProducts = createAsyncThunk<
  ProductsResponse,
  | {
      categorySlug?: string;
      subcategorySlug?: string;
      cursor?: string;
      limit?: number;
      inStock?: boolean;
    }
  | undefined
>("products/fetchProducts", async (params, { rejectWithValue }) => {
  try {
    const query = new URLSearchParams();
    if (params?.categorySlug) query.append("categorySlug", params.categorySlug);
    if (params?.subcategorySlug)
      query.append("subcategorySlug", params.subcategorySlug);
    if (params?.cursor) query.append("cursor", params.cursor);
    if (params?.limit) query.append("limit", params.limit.toString());
    if (params?.inStock !== undefined)
      query.append("inStock", params.inStock.toString());

    const url = `/products${query.toString() ? "?" + query.toString() : ""}`;
    const { data } = await axiosInstance.get<ApiResponse<ProductsResponse>>(
      url
    );
    return data.data!;
  } catch (error: unknown) {
    return rejectWithValue(getErrorMessage(error));
  }
});

// Fetch products by page number (new page-based pagination)
// ✨ RECOMENDADO: Usa esta función para mejor performance (40% más rápido)
export const fetchProductsByPage = createAsyncThunk<
  ProductsResponse,
  {
    page?: number;
    categorySlug?: string;
    subcategorySlug?: string;
    limit?: number;
    inStock?: boolean;
  }
>("products/fetchProductsByPage", async (params, { rejectWithValue }) => {
  try {
    const query = new URLSearchParams();
    if (params.page) query.append("page", params.page.toString());
    if (params.categorySlug) query.append("categorySlug", params.categorySlug);
    if (params.subcategorySlug)
      query.append("subcategorySlug", params.subcategorySlug);
    if (params.limit) query.append("limit", params.limit.toString());
    if (params.inStock !== undefined)
      query.append("inStock", params.inStock.toString());

    const url = `/products/by-page${query.toString() ? "?" + query.toString() : ""}`;
    const { data } = await axiosInstance.get<ApiResponse<ProductsResponse>>(
      url
    );
    return data.data!;
  } catch (error: unknown) {
    return rejectWithValue(getErrorMessage(error));
  }
});

// Fetch pagination info only (for counters and UI indicators)
export const fetchProductsPaginationInfo = createAsyncThunk<
  ProductsPaginationInfo,
  {
    categorySlug?: string;
    subcategorySlug?: string;
    limit?: number;
    inStock?: boolean;
  }
>("products/fetchProductsPaginationInfo", async (params, { rejectWithValue }) => {
  try {
    const query = new URLSearchParams();
    if (params.categorySlug) query.append("categorySlug", params.categorySlug);
    if (params.subcategorySlug)
      query.append("subcategorySlug", params.subcategorySlug);
    if (params.limit) query.append("limit", params.limit.toString());
    if (params.inStock !== undefined)
      query.append("inStock", params.inStock.toString());

    const url = `/products/pagination-info${query.toString() ? "?" + query.toString() : ""}`;
    const { data } = await axiosInstance.get<ApiResponse<ProductsPaginationInfo>>(
      url
    );
    return data.data!;
  } catch (error: unknown) {
    return rejectWithValue(getErrorMessage(error));
  }
});

// Fetch product by slug
export const fetchProductBySlug = createAsyncThunk<Product, string>(
  "products/fetchProductBySlug",
  async (slug, { rejectWithValue }) => {
    try {
      const { data } = await axiosInstance.get<
        ApiResponse<{ product: Product }>
      >(`/products/${slug}`);
      return data.data!.product;
    } catch (error: unknown) {
      return rejectWithValue(getErrorMessage(error));
    }
  }
);

// Search products with pagination
export const searchProducts = createAsyncThunk<
  ProductsResponse,
  { q: string; page?: number; limit?: number; inStock?: boolean }
>(
  "products/searchProducts",
  async ({ q, page, limit, inStock }, { rejectWithValue }) => {
    try {
      const query = new URLSearchParams();
      query.append("q", q);
      if (page !== undefined) {
        query.append("page", page.toString());
      }
      if (limit !== undefined) {
        query.append("limit", limit.toString());
      }
      if (inStock !== undefined) {
        query.append("inStock", inStock.toString());
      }
      const { data } = await axiosInstance.get<ApiResponse<ProductsResponse>>(
        `/products/search?${query.toString()}`
      );
      return data.data!;
    } catch (error: unknown) {
      return rejectWithValue(getErrorMessage(error));
    }
  }
);

const productSlice = createSlice({
  name: "products",
  initialState,
  reducers: {
    clearProductDetail(state) {
      state.productDetail = null;
    },
    clearSearchResults(state) {
      state.searchResults = [];
      state.searchPagination = null;
      state.searchError = null;
    },
    resetPagination(state) {
      state.products = [];
      state.pagination = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // fetchProducts
      .addCase(fetchProducts.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchProducts.fulfilled, (state, action) => {
        state.loading = false;
        // Si hay cursor en los parámetros, agregamos productos; si no, reemplazamos
        if (action.meta.arg?.cursor) {
          state.products = [...state.products, ...action.payload.products];
        } else {
          state.products = action.payload.products;
        }
        state.pagination = action.payload.pagination;
      })
      .addCase(fetchProducts.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // fetchProductsByPage
      .addCase(fetchProductsByPage.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchProductsByPage.fulfilled, (state, action) => {
        state.loading = false;
        // Para paginación por página, siempre reemplazamos los productos
        state.products = action.payload.products;
        state.pagination = action.payload.pagination;
      })
      .addCase(fetchProductsByPage.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // fetchProductsPaginationInfo
      .addCase(fetchProductsPaginationInfo.pending, (state) => {
        state.paginationInfoLoading = true;
        state.paginationInfoError = null;
      })
      .addCase(fetchProductsPaginationInfo.fulfilled, (state, action) => {
        state.paginationInfoLoading = false;
        // Actualizar solo los metadatos relevantes si no hay paginación completa
        if (!state.pagination) {
          state.pagination = {
            ...action.payload,
            nextCursor: null,
            previousCursor: null,
            itemsInCurrentPage: 0,
          };
        } else {
          // Actualizar campos relevantes manteniendo cursors existentes
          state.pagination.totalCount = action.payload.totalCount;
          state.pagination.totalPages = action.payload.totalPages;
          state.pagination.hasNextPage = action.payload.hasNextPage;
          state.pagination.hasPreviousPage = action.payload.hasPreviousPage;
        }
      })
      .addCase(fetchProductsPaginationInfo.rejected, (state, action) => {
        state.paginationInfoLoading = false;
        state.paginationInfoError = action.payload as string;
      })
      // fetchProductBySlug
      .addCase(fetchProductBySlug.pending, (state) => {
        state.productDetail = null;
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchProductBySlug.fulfilled, (state, action) => {
        state.loading = false;
        state.productDetail = action.payload;
      })
      .addCase(fetchProductBySlug.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // searchProducts
      .addCase(searchProducts.pending, (state) => {
        state.searchLoading = true;
        state.searchError = null;
      })
      .addCase(searchProducts.fulfilled, (state, action) => {
        state.searchLoading = false;
        state.searchResults = action.payload.products;
        state.searchPagination = action.payload.pagination;
      })
      .addCase(searchProducts.rejected, (state, action) => {
        state.searchLoading = false;
        state.searchError = action.payload as string;
      });
  },
});

export const { clearProductDetail, clearSearchResults, resetPagination } = productSlice.actions;
export default productSlice.reducer;
