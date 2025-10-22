import { useCallback } from "react";
import {
  CreateProductPayload,
  UpdateProductPayload,
  BulkPriceUpdatePayload,
  ProductFilters,
  LowStockFilters,
} from "@/interfaces/product";
import { useAppDispatch, useAppSelector } from "../redux/hooks";
import {
  fetchProducts,
  fetchProductsByPage,
  fetchProductsPaginationInfo,
  searchProducts,
  clearSearchResults,
  createProduct,
  updateProduct,
  deleteProduct,
  deleteProductVariant,
  bulkUpdatePrices,
  clearBulkUpdateError,
  resetPagination,
  fetchProductBySlug,
  clearProductDetail,
  fetchLowStockProductVariants,
  clearLowStockVariants,
  clearDeleteError,
} from "../redux/slices/productSlice";

export const useProducts = () => {
  const dispatch = useAppDispatch();
  const {
    products,
    pagination,
    loading,
    error,
    searchResults,
    searchPagination,
    searchLoading,
    searchError,
    bulkUpdateLoading,
    bulkUpdateError,
    paginationInfoLoading,
    paginationInfoError,
    lastCreatedProduct,
    productDetail,
    lowStockVariants,
    lowStockPagination,
    lowStockLoading,
    lowStockError,
    deleteLoading,
    deleteError,
  } = useAppSelector((state) => state.products);

  return {
    products,
    pagination,
    loading,
    error,
    searchResults,
    searchPagination, // Nueva metadata de paginación para búsqueda
    searchLoading,
    searchError,
    bulkUpdateLoading,
    bulkUpdateError,
    paginationInfoLoading,
    paginationInfoError,
    lastCreatedProduct,
    productDetail,
    lowStockVariants,
    lowStockPagination,
    lowStockLoading,
    lowStockError,
    deleteLoading,
    deleteError,
    
    // Derived state for convenience
    hasNextPage: pagination?.hasNextPage || false,
    hasPreviousPage: pagination?.hasPreviousPage || false,
    totalCount: pagination?.totalCount || 0,
    totalPages: pagination?.totalPages || 0,
    currentPage: pagination?.currentPage || 1,
    
    // Derived state for search pagination
    searchTotalCount: searchPagination?.totalCount || 0,
    searchTotalPages: searchPagination?.totalPages || 0,
    searchCurrentPage: searchPagination?.currentPage || 1,
    searchHasNextPage: searchPagination?.hasNextPage || false,
    searchHasPreviousPage: searchPagination?.hasPreviousPage || false,
    
    // Low stock derived state
    lowStockTotalCount: lowStockPagination?.totalCount || 0,
    lowStockTotalPages: lowStockPagination?.totalPages || 0,
    lowStockCurrentPage: lowStockPagination?.currentPage || 1,
    lowStockHasNextPage: lowStockPagination?.hasNextPage || false,
    lowStockHasPreviousPage: lowStockPagination?.hasPreviousPage || false,
    
    // Actions
    /**
     * @deprecated Considera usar fetchProductsByPage para mejor performance
     * Método de paginación por cursor que puede ser más lento
     */
    fetchProducts: (params?: Omit<ProductFilters, 'page'>) => dispatch(fetchProducts(params)),
    
    /**
     * Método recomendado para paginación - Optimizado con 40% mejor performance
     * Usa paginación por número de página en lugar de cursors
     */
    fetchProductsByPage: (params: ProductFilters) => dispatch(fetchProductsByPage(params)),
    
    /**
     * Obtiene solo metadatos de paginación sin cargar productos
     * Útil para contadores rápidos y indicadores de UI - Muy optimizado
     */
    fetchProductsPaginationInfo: (params: Omit<ProductFilters, 'page' | 'cursor'>) => 
      dispatch(fetchProductsPaginationInfo(params)),
    
    /**
     * Busca productos por texto con paginación
     * @param q - Texto de búsqueda
     * @param page - Número de página (default: 1)
     * @param limit - Resultados por página (default: 10)
     * @param inStock - Filtrar solo productos con stock
     * @param outOfStock - Filtrar solo productos sin stock
     */
    searchProducts: useCallback((params: { 
      q: string; 
      page?: number; 
      limit?: number 
    } & Pick<ProductFilters, 'inStock' | 'outOfStock'>) => 
      dispatch(searchProducts(params)), [dispatch]),
    clearSearchResults: useCallback(() => dispatch(clearSearchResults()), [dispatch]),
    createProduct: (payload: CreateProductPayload) =>
      dispatch(createProduct(payload)),
    updateProduct: (payload: UpdateProductPayload) =>
      dispatch(updateProduct(payload)),
    bulkUpdatePrices: (payload: BulkPriceUpdatePayload) =>
      dispatch(bulkUpdatePrices(payload)),
    clearBulkUpdateError: () => dispatch(clearBulkUpdateError()),
    resetPagination: () => dispatch(resetPagination()),
    fetchProductBySlug: (slug: string) => dispatch(fetchProductBySlug(slug)),
    clearProductDetail: () => dispatch(clearProductDetail()),
    
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
    loadPageByNumber: (pageNumber: number, filters?: Omit<ProductFilters, 'page' | 'cursor'>) => {
      return dispatch(fetchProductsByPage({ page: pageNumber, ...filters }));
    },

    goToFirstPage: (filters?: Omit<ProductFilters, 'page' | 'cursor'>) => {
      return dispatch(fetchProductsByPage({ page: 1, ...filters }));
    },

    // Refresh current data
    refreshCurrentPage: () => {
      const currentPageNumber = pagination?.currentPage || 1;
      return dispatch(fetchProductsByPage({ page: currentPageNumber }));
    },

    // Método recomendado para cargar productos con filtros (usa la API optimizada)
    loadProductsWithFilters: (filters: ProductFilters) => {
      return dispatch(fetchProductsByPage(filters));
    },

    // Método rápido para obtener conteos sin cargar productos
    getQuickPaginationInfo: (filters: Omit<ProductFilters, 'page' | 'cursor'>) => {
      return dispatch(fetchProductsPaginationInfo(filters));
    },

    // Low Stock methods
    /**
     * Obtiene variantes de productos con stock bajo o igual al threshold
     * Soporta filtros opcionales de rango (minStock, maxStock)
     * @param filters - stockThreshold (requerido), page, limit, minStock y maxStock (opcionales)
     */
    fetchLowStockProductVariants: (filters: LowStockFilters) => 
      dispatch(fetchLowStockProductVariants(filters)),
    
    /**
     * Limpia los resultados de variantes con stock bajo
     */
    clearLowStockVariants: () => dispatch(clearLowStockVariants()),
    
    /**
     * Carga una página específica de variantes con stock bajo
     * @param stockThreshold - Umbral máximo de stock
     * @param pageNumber - Número de página
     * @param limit - Límite de resultados por página
     * @param minStock - Stock mínimo opcional
     */
    loadLowStockPage: (
      stockThreshold: number, 
      pageNumber: number, 
      limit?: number,
      minStock?: number,
    ) => {
      return dispatch(fetchLowStockProductVariants({ 
        stockThreshold, 
        page: pageNumber, 
        limit,
        minStock,
      }));
    },
    
    /**
     * Refresca la página actual de variantes con stock bajo
     */
    refreshLowStockPage: (stockThreshold: number, minStock?: number) => {
      const currentPageNumber = lowStockPagination?.currentPage || 1;
      const currentLimit = lowStockPagination?.limit || 10;
      return dispatch(fetchLowStockProductVariants({ 
        stockThreshold, 
        page: currentPageNumber,
        limit: currentLimit,
        minStock,
      }));
    },

    // Delete methods
    /**
     * Elimina un producto (soft delete)
     * Marca el producto y sus variantes como eliminados
     * @param productId - ID del producto a eliminar
     */
    deleteProduct: (productId: string) => dispatch(deleteProduct(productId)),
    
    /**
     * Elimina una variante de producto (soft delete)
     * Marca la variante como eliminada sin afectar otras variantes
     * @param variantId - ID de la variante a eliminar
     * @param productId - ID del producto al que pertenece la variante
     */
    deleteProductVariant: (variantId: string, productId: string) => 
      dispatch(deleteProductVariant({ variantId, productId })),
    
    /**
     * Limpia el error de eliminación
     */
    clearDeleteError: () => dispatch(clearDeleteError()),

    // Search pagination methods
    /**
     * Busca en una página específica manteniendo el query anterior
     */
    searchProductsByPage: (q: string, pageNumber: number, filters?: {
      limit?: number;
      inStock?: boolean;
      outOfStock?: boolean;
    }) => {
      return dispatch(searchProducts({ q, page: pageNumber, ...filters }));
    },

    /**
     * Navega a la siguiente página de resultados de búsqueda
     */
    loadNextSearchPage: (q: string, filters?: { limit?: number; inStock?: boolean; outOfStock?: boolean }) => {
      if (searchPagination?.hasNextPage) {
        const nextPage = (searchPagination.currentPage || 1) + 1;
        return dispatch(searchProducts({ q, page: nextPage, ...filters }));
      }
    },

    /**
     * Navega a la página anterior de resultados de búsqueda
     */
    loadPreviousSearchPage: (q: string, filters?: { limit?: number; inStock?: boolean; outOfStock?: boolean }) => {
      if (searchPagination?.hasPreviousPage) {
        const prevPage = Math.max(1, (searchPagination.currentPage || 1) - 1);
        return dispatch(searchProducts({ q, page: prevPage, ...filters }));
      }
    },

    /**
     * Reinicia la búsqueda a la primera página
     */
    resetSearchToFirstPage: (q: string, filters?: { limit?: number; inStock?: boolean; outOfStock?: boolean }) => {
      return dispatch(searchProducts({ q, page: 1, ...filters }));
    },
  };
};
