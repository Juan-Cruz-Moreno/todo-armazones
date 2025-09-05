import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axiosInstance from "../../utils/axiosInstance";
import type {
  CreateProductPayload,
  CreateProductResponse,
  Product,
  ProductsResponse,
  UpdateProductPayload,
  BulkPriceUpdatePayload,
  BulkPriceUpdateResponse,
} from "../../interfaces/product";
import type { ApiResponse } from "../../types/api";
import { getErrorMessage } from "../../types/api";

interface ProductsState {
  products: Product[];
  nextCursor: string | null;
  loading: boolean;
  error: string | null;
  searchResults: Product[];
  searchLoading: boolean;
  searchError: string | null;
  bulkUpdateLoading: boolean;
  bulkUpdateError: string | null;
}

const initialState: ProductsState = {
  products: [],
  nextCursor: null,
  loading: false,
  error: null,
  searchResults: [],
  searchLoading: false,
  searchError: null,
  bulkUpdateLoading: false,
  bulkUpdateError: null,
};

// Fetch products with optional filters and pagination
export const fetchProducts = createAsyncThunk<
  ProductsResponse,
  | {
      categorySlug?: string;
      subcategorySlug?: string;
      cursor?: string;
      limit?: number;
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

    const url = `/products${query.toString() ? "?" + query.toString() : ""}`;
    const { data } = await axiosInstance.get<ApiResponse<ProductsResponse>>(
      url
    );
    return data.data!;
  } catch (err: unknown) {
    return rejectWithValue(getErrorMessage(err));
  }
});

// Search products
export const searchProducts = createAsyncThunk<Product[], string>(
  "products/searchProducts",
  async (q, { rejectWithValue }) => {
    try {
      const { data } = await axiosInstance.get<ApiResponse<ProductsResponse>>(
        `/products/search?q=${encodeURIComponent(q)}`
      );
      return data.data!.products;
    } catch (err: unknown) {
      return rejectWithValue(getErrorMessage(err));
    }
  }
);

// Helper para armar FormData para crear producto
function buildCreateProductFormData(payload: CreateProductPayload): FormData {
  const formData = new FormData();
  formData.append("product", JSON.stringify(payload.product));
  formData.append("variants", JSON.stringify(payload.variants));
  if (payload.files?.primaryImage) {
    formData.append("primaryImage", payload.files.primaryImage);
  }
  if (payload.files?.variantImages) {
    Object.entries(payload.files.variantImages).forEach(([colorKey, files]) => {
      files.forEach((file) => {
        // El backend espera: images_<colorKey>
        formData.append(`images_${colorKey.replace(/^images_/, "")}`, file);
      });
    });
  }
  return formData;
}

// Helper para armar FormData para actualizar producto
function buildUpdateProductFormData(payload: UpdateProductPayload): FormData {
  const formData = new FormData();
  formData.append("product", JSON.stringify(payload.product));
  formData.append("variants", JSON.stringify(payload.variants));
  if (payload.files?.primaryImage) {
    formData.append("primaryImage", payload.files.primaryImage);
  }
  if (payload.files?.variantImages) {
    Object.entries(payload.files.variantImages).forEach(([colorKey, files]) => {
      files.forEach((file) => {
        formData.append(`images_${colorKey.replace(/^images_/, "")}`, file);
      });
    });
  }
  return formData;
}

// Crear producto
// Cambia el tipo del thunk:
export const createProduct = createAsyncThunk<
  CreateProductResponse,
  CreateProductPayload
>("products/createProduct", async (payload, { rejectWithValue }) => {
  try {
    const formData = buildCreateProductFormData(payload);
    const { data } = await axiosInstance.post<
      ApiResponse<CreateProductResponse>
    >("/products", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return data.data!;
  } catch (err: unknown) {
    return rejectWithValue(getErrorMessage(err));
  }
});

// Actualizar producto
export const updateProduct = createAsyncThunk<Product, UpdateProductPayload>(
  "products/updateProduct",
  async (payload, { rejectWithValue }) => {
    try {
      const formData = buildUpdateProductFormData(payload);
      const { data } = await axiosInstance.patch<ApiResponse<Product>>(
        `/products/${payload.productId}`,
        formData,
        {
          headers: { "Content-Type": "multipart/form-data" },
        }
      );
      return data.data!;
    } catch (err: unknown) {
      return rejectWithValue(getErrorMessage(err));
    }
  }
);

// Actualización masiva de precios
export const bulkUpdatePrices = createAsyncThunk<
  BulkPriceUpdateResponse,
  BulkPriceUpdatePayload
>("products/bulkUpdatePrices", async (payload, { rejectWithValue }) => {
  try {
    const { data } = await axiosInstance.patch<
      ApiResponse<BulkPriceUpdateResponse>
    >("/products/bulk-update-prices", payload, {
      headers: { "Content-Type": "application/json" },
    });
    return data.data!;
  } catch (err: unknown) {
    return rejectWithValue(getErrorMessage(err));
  }
});

const productSlice = createSlice({
  name: "products",
  initialState,
  reducers: {
    clearSearchResults(state) {
      state.searchResults = [];
      state.searchError = null;
    },
    clearBulkUpdateError(state) {
      state.bulkUpdateError = null;
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
      })
      // createProduct
      .addCase(createProduct.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createProduct.fulfilled, (state, action) => {
        state.loading = false;
        // action.payload SIEMPRE tiene { product, variants }
        const { product, variants } = action.payload;
        state.products.unshift({ ...product, variants });
      })
      .addCase(createProduct.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })

      // updateProduct
      .addCase(updateProduct.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateProduct.fulfilled, (state, action) => {
        state.loading = false;
        const idx = state.products.findIndex((p) => p.id === action.payload.id);
        if (idx !== -1) {
          state.products[idx] = action.payload;
        }
      })
      .addCase(updateProduct.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })

      // bulkUpdatePrices
      .addCase(bulkUpdatePrices.pending, (state) => {
        state.bulkUpdateLoading = true;
        state.bulkUpdateError = null;
      })
      .addCase(bulkUpdatePrices.fulfilled, (state) => {
        state.bulkUpdateLoading = false;
        // Opcionalmente, podrías actualizar los productos en el estado
        // pero es mejor refrescar la lista después de la actualización masiva
      })
      .addCase(bulkUpdatePrices.rejected, (state, action) => {
        state.bulkUpdateLoading = false;
        state.bulkUpdateError = action.payload as string;
      });
  },
});

export const { clearSearchResults, clearBulkUpdateError } = productSlice.actions;
export default productSlice.reducer;
