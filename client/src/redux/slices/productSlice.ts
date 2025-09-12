import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axiosInstance from "../../utils/axiosInstance";
import { Product, ProductsResponse } from "../../interfaces/product";
import { getErrorMessage, ApiResponse } from "@/types/api";

interface ProductsState {
  products: Product[];
  nextCursor: string | null;
  loading: boolean;
  error: string | null;
  productDetail: Product | null;
  searchResults: Product[];
  searchLoading: boolean;
  searchError: string | null;
}

const initialState: ProductsState = {
  products: [],
  nextCursor: null,
  loading: false,
  error: null,
  productDetail: null,
  searchResults: [],
  searchLoading: false,
  searchError: null,
};

// Fetch products with optional filters and pagination
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

// Search products
export const searchProducts = createAsyncThunk<Product[], string>(
  "products/searchProducts",
  async (q, { rejectWithValue }) => {
    try {
      const { data } = await axiosInstance.get<ApiResponse<ProductsResponse>>(
        `/products/search?q=${encodeURIComponent(q)}`
      );
      return data.data!.products;
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
      state.searchError = null;
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
        // Si hay cursor, agregamos; si no, reemplazamos
        if (action.meta.arg?.cursor) {
          state.products = [...state.products, ...action.payload.products];
        } else {
          state.products = action.payload.products;
        }
        state.nextCursor = action.payload.nextCursor;
      })
      .addCase(fetchProducts.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
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
        state.searchResults = action.payload;
      })
      .addCase(searchProducts.rejected, (state, action) => {
        state.searchLoading = false;
        state.searchError = action.payload as string;
      });
  },
});

export const { clearProductDetail, clearSearchResults } = productSlice.actions;
export default productSlice.reducer;
