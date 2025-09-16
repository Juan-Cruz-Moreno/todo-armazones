import { useAppDispatch, useAppSelector } from "../redux/hooks";
import {
  fetchProducts,
  fetchProductBySlug,
  fetchProductsByPage,
  fetchProductsPaginationInfo,
  searchProducts,
  clearProductDetail,
  clearSearchResults,
  resetPagination,
} from "../redux/slices/productSlice";

export const useProducts = () => {
  const dispatch = useAppDispatch();
  const {
    products,
    pagination,
    loading,
    error,
    productDetail,
    searchResults,
    searchLoading,
    searchError,
    paginationInfoLoading,
    paginationInfoError,
  } = useAppSelector((state) => state.products);

  return {
    // State
    products,
    pagination,
    loading,
    error,
    productDetail,
    searchResults,
    searchLoading,
    searchError,
    paginationInfoLoading,
    paginationInfoError,
    
    // Derived state for backward compatibility and convenience
    nextCursor: pagination?.nextCursor || null,
    hasNextPage: pagination?.hasNextPage || false,
    hasPreviousPage: pagination?.hasPreviousPage || false,
    totalCount: pagination?.totalCount || 0,
    totalPages: pagination?.totalPages || 0,
    currentPage: pagination?.currentPage || 1,
    
    // Actions
    /**
     * @deprecated Considera usar fetchProductsByPage para mejor performance
     * Método de paginación por cursor que puede ser más lento
     */
    fetchProducts: (params?: {
      categorySlug?: string;
      subcategorySlug?: string;
      cursor?: string;
      limit?: number;
      inStock?: boolean;
    }) => dispatch(fetchProducts(params)),
    
    /**
     * Método recomendado para paginación - Optimizado con 40% mejor performance
     * Usa paginación por número de página en lugar de cursors
     */
    fetchProductsByPage: (params: {
      page?: number;
      categorySlug?: string;
      subcategorySlug?: string;
      limit?: number;
      inStock?: boolean;
    }) => dispatch(fetchProductsByPage(params)),
    
    fetchProductBySlug: (slug: string) => dispatch(fetchProductBySlug(slug)),
    
    /**
     * Obtiene solo metadatos de paginación sin cargar productos
     * Útil para contadores rápidos y indicadores de UI - Muy optimizado
     */
    fetchProductsPaginationInfo: (params: {
      categorySlug?: string;
      subcategorySlug?: string;
      limit?: number;
      inStock?: boolean;
    }) => dispatch(fetchProductsPaginationInfo(params)),
    
    searchProducts: (q: string, inStock?: boolean) => dispatch(searchProducts({ q, inStock })),
    
    clearProductDetail: () => dispatch(clearProductDetail()),
    clearSearchResults: () => dispatch(clearSearchResults()),
    resetPagination: () => dispatch(resetPagination()),
    
    // Utility methods for pagination
    loadNextPage: () => {
      if (pagination?.hasNextPage && pagination?.nextCursor) {
        return dispatch(fetchProducts({ cursor: pagination.nextCursor }));
      }
    },
    
    loadPreviousPage: () => {
      if (pagination?.hasPreviousPage && pagination?.previousCursor) {
        return dispatch(fetchProducts({ cursor: pagination.previousCursor }));
      }
    },
    
    loadPage: (cursor?: string) => {
      return dispatch(fetchProducts({ cursor }));
    },

    // New methods for page-based navigation
    loadPageByNumber: (pageNumber: number, filters?: {
      categorySlug?: string;
      subcategorySlug?: string;
      limit?: number;
      inStock?: boolean;
    }) => {
      return dispatch(fetchProductsByPage({ page: pageNumber, ...filters }));
    },

    goToFirstPage: (filters?: {
      categorySlug?: string;
      subcategorySlug?: string;
      limit?: number;
      inStock?: boolean;
    }) => {
      return dispatch(fetchProductsByPage({ page: 1, ...filters }));
    },

    // Refresh current data
    refreshCurrentPage: () => {
      const currentPageNumber = pagination?.currentPage || 1;
      return dispatch(fetchProductsByPage({ page: currentPageNumber }));
    },

    // Método recomendado para cargar productos con filtros (usa la API optimizada)
    loadProductsWithFilters: (filters: {
      page?: number;
      categorySlug?: string;
      subcategorySlug?: string;
      limit?: number;
      inStock?: boolean;
    }) => {
      return dispatch(fetchProductsByPage(filters));
    },

    // Método rápido para obtener conteos sin cargar productos
    getQuickPaginationInfo: (filters: {
      categorySlug?: string;
      subcategorySlug?: string;
      limit?: number;
      inStock?: boolean;
    }) => {
      return dispatch(fetchProductsPaginationInfo(filters));
    },
  };
};
