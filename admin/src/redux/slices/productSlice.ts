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
  PaginationMetadata,
  ProductsPaginationInfo,
  ProductFilters,
  LowStockProductVariantsResponse,
  LowStockFilters,
  ProductVariantWithProduct,
  LowStockPaginationMetadata,
} from "../../interfaces/product";
import type { ApiResponse } from "../../types/api";
import { getErrorMessage } from "../../types/api";

interface ProductsState {
  products: Product[];
  pagination: PaginationMetadata | null;
  loading: boolean;
  error: string | null;
  searchResults: Product[];
  searchLoading: boolean;
  searchError: string | null;
  bulkUpdateLoading: boolean;
  bulkUpdateError: string | null;
  paginationInfoLoading: boolean;
  paginationInfoError: string | null;
  lastCreatedProduct: Product | null;
  productDetail: Product | null;
  lowStockVariants: ProductVariantWithProduct[];
  lowStockPagination: LowStockPaginationMetadata | null;
  lowStockLoading: boolean;
  lowStockError: string | null;
  deleteLoading: boolean;
  deleteError: string | null;
}

const initialState: ProductsState = {
  products: [],
  pagination: null,
  loading: false,
  error: null,
  searchResults: [],
  searchLoading: false,
  searchError: null,
  bulkUpdateLoading: false,
  bulkUpdateError: null,
  paginationInfoLoading: false,
  paginationInfoError: null,
  lastCreatedProduct: null,
  productDetail: null,
  lowStockVariants: [],
  lowStockPagination: null,
  lowStockLoading: false,
  lowStockError: null,
  deleteLoading: false,
  deleteError: null,
};

// Fetch products with optional filters and pagination
// ⚠️ DEPRECATED: Considera usar fetchProductsByPage para mejor performance
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

// Fetch products by page number (new page-based pagination)
// ✨ RECOMENDADO: Usa esta función para mejor performance (40% más rápido)
export const fetchProductsByPage = createAsyncThunk<
  ProductsResponse,
  ProductFilters
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
    if (params.outOfStock !== undefined)
      query.append("outOfStock", params.outOfStock.toString());

    const url = `/products/by-page${query.toString() ? "?" + query.toString() : ""}`;
    const { data } = await axiosInstance.get<ApiResponse<ProductsResponse>>(
      url
    );
    return data.data!;
  } catch (err: unknown) {
    return rejectWithValue(getErrorMessage(err));
  }
});

// Fetch pagination info only (for counters and UI indicators)
export const fetchProductsPaginationInfo = createAsyncThunk<
  ProductsPaginationInfo,
  Omit<ProductFilters, 'page' | 'cursor'>
>("products/fetchProductsPaginationInfo", async (params, { rejectWithValue }) => {
  try {
    const query = new URLSearchParams();
    if (params.categorySlug) query.append("categorySlug", params.categorySlug);
    if (params.subcategorySlug)
      query.append("subcategorySlug", params.subcategorySlug);
    if (params.limit) query.append("limit", params.limit.toString());
    if (params.inStock !== undefined)
      query.append("inStock", params.inStock.toString());
    if (params.outOfStock !== undefined)
      query.append("outOfStock", params.outOfStock.toString());

    const url = `/products/pagination-info${query.toString() ? "?" + query.toString() : ""}`;
    const { data } = await axiosInstance.get<ApiResponse<ProductsPaginationInfo>>(
      url
    );
    return data.data!;
  } catch (err: unknown) {
    return rejectWithValue(getErrorMessage(err));
  }
});

// Search products
export const searchProducts = createAsyncThunk<
  Product[], 
  { q: string } & Pick<ProductFilters, 'inStock' | 'outOfStock'>
>(
  "products/searchProducts",
  async ({ q, inStock, outOfStock }, { rejectWithValue }) => {
    try {
      const query = new URLSearchParams();
      query.append("q", encodeURIComponent(q));
      if (inStock !== undefined) query.append("inStock", inStock.toString());
      if (outOfStock !== undefined) query.append("outOfStock", outOfStock.toString());

      const url = `/products/search${query.toString() ? "?" + query.toString() : ""}`;
      const { data } = await axiosInstance.get<ApiResponse<ProductsResponse>>(
        url
      );
      return data.data!.products;
    } catch (err: unknown) {
      return rejectWithValue(getErrorMessage(err));
    }
  }
);

// Fetch product by slug
export const fetchProductBySlug = createAsyncThunk<Product, string>(
  "products/fetchProductBySlug",
  async (slug, { rejectWithValue }) => {
    try {
      const { data } = await axiosInstance.get<
        ApiResponse<{ product: Product }>
      >(`/products/${slug}`);
      return data.data!.product;
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
    payload.files.primaryImage.forEach(file => formData.append("primaryImage", file));
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
    payload.files.primaryImage.forEach(file => formData.append("primaryImage", file));
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

// Obtener variantes con stock bajo
export const fetchLowStockProductVariants = createAsyncThunk<
  LowStockProductVariantsResponse,
  LowStockFilters
>("products/fetchLowStockProductVariants", async (params, { rejectWithValue }) => {
  try {
    const query = new URLSearchParams();
    query.append("stockThreshold", params.stockThreshold.toString());
    if (params.page) query.append("page", params.page.toString());
    if (params.limit) query.append("limit", params.limit.toString());
    if (params.minStock !== undefined) query.append("minStock", params.minStock.toString());
    if (params.maxStock !== undefined) query.append("maxStock", params.maxStock.toString());

    const url = `/products/low-stock?${query.toString()}`;
    const { data } = await axiosInstance.get<
      ApiResponse<LowStockProductVariantsResponse>
    >(url);
    return data.data!;
  } catch (err: unknown) {
    return rejectWithValue(getErrorMessage(err));
  }
});

// Eliminar producto (soft delete)
export const deleteProduct = createAsyncThunk<
  { productId: string },
  string
>("products/deleteProduct", async (productId, { rejectWithValue }) => {
  try {
    await axiosInstance.delete<ApiResponse<void>>(
      `/products/${productId}`
    );
    return { productId };
  } catch (err: unknown) {
    return rejectWithValue(getErrorMessage(err));
  }
});

// Eliminar variante de producto (soft delete)
export const deleteProductVariant = createAsyncThunk<
  { variantId: string; productId: string },
  { variantId: string; productId: string }
>("products/deleteProductVariant", async ({ variantId, productId }, { rejectWithValue }) => {
  try {
    await axiosInstance.delete<ApiResponse<void>>(
      `/products/variants/${variantId}`
    );
    return { variantId, productId };
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
    resetPagination(state) {
      state.products = [];
      state.pagination = null;
    },
    clearProductDetail(state) {
      state.productDetail = null;
    },
    clearLowStockVariants(state) {
      state.lowStockVariants = [];
      state.lowStockPagination = null;
      state.lowStockError = null;
    },
    clearDeleteError(state) {
      state.deleteError = null;
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
        state.lastCreatedProduct = product; // Guardar el producto creado
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
      })

      // fetchLowStockProductVariants
      .addCase(fetchLowStockProductVariants.pending, (state) => {
        state.lowStockLoading = true;
        state.lowStockError = null;
      })
      .addCase(fetchLowStockProductVariants.fulfilled, (state, action) => {
        state.lowStockLoading = false;
        state.lowStockVariants = action.payload.variants;
        state.lowStockPagination = action.payload.pagination;
      })
      .addCase(fetchLowStockProductVariants.rejected, (state, action) => {
        state.lowStockLoading = false;
        state.lowStockError = action.payload as string;
      })

      // deleteProduct
      .addCase(deleteProduct.pending, (state) => {
        state.deleteLoading = true;
        state.deleteError = null;
      })
      .addCase(deleteProduct.fulfilled, (state, action) => {
        state.deleteLoading = false;
        // Remover el producto eliminado de la lista
        state.products = state.products.filter(
          (p) => p.id !== action.payload.productId
        );
        // Actualizar el conteo total si existe paginación
        if (state.pagination) {
          state.pagination.totalCount = Math.max(0, state.pagination.totalCount - 1);
          state.pagination.itemsInCurrentPage = state.products.length;
        }
        // Limpiar detalle del producto si coincide con el eliminado
        if (state.productDetail?.id === action.payload.productId) {
          state.productDetail = null;
        }
      })
      .addCase(deleteProduct.rejected, (state, action) => {
        state.deleteLoading = false;
        state.deleteError = action.payload as string;
      })

      // deleteProductVariant
      .addCase(deleteProductVariant.pending, (state) => {
        state.deleteLoading = true;
        state.deleteError = null;
      })
      .addCase(deleteProductVariant.fulfilled, (state, action) => {
        state.deleteLoading = false;
        const { variantId, productId } = action.payload;
        
        // Actualizar productos en la lista
        const productIndex = state.products.findIndex((p) => p.id === productId);
        if (productIndex !== -1) {
          state.products[productIndex].variants = state.products[productIndex].variants.filter(
            (v) => v.id !== variantId
          );
        }
        
        // Actualizar detalle del producto si existe
        if (state.productDetail?.id === productId) {
          state.productDetail.variants = state.productDetail.variants.filter(
            (v) => v.id !== variantId
          );
        }
      })
      .addCase(deleteProductVariant.rejected, (state, action) => {
        state.deleteLoading = false;
        state.deleteError = action.payload as string;
      });
  },
});

export const { 
  clearSearchResults, 
  clearBulkUpdateError, 
  resetPagination, 
  clearProductDetail,
  clearLowStockVariants,
  clearDeleteError,
} = productSlice.actions;
export default productSlice.reducer;
