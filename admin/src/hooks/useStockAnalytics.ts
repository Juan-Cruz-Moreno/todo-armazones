import { useCallback, useEffect, useRef, useMemo } from 'react';
import { useAppDispatch, useAppSelector } from '@/redux/hooks';
import {
  fetchStockValuation,
  fetchProductStockAnalytics,
  fetchLowStockAlerts,
  fetchCategoryStockAnalytics,
  fetchSubcategoryStockAnalytics,
  fetchCategorySubcategoryStockAnalytics,
  clearStockValuation,
  clearProductStockAnalytics,
  clearLowStockAlerts,
  clearCategoryStockAnalytics,
  clearSubcategoryStockAnalytics,
  clearCategorySubcategoryStockAnalytics,
  clearAllStockAnalytics,
} from '@/redux/slices/analyticsSlice';

export const useStockAnalytics = () => {
  const dispatch = useAppDispatch();
  const hasInitializedRef = useRef(false);

  const { stockAnalytics } = useAppSelector((state) => state.analytics);

  // Estados de carga (mover arriba para usar en callbacks)
  const isLoadingProductAnalytics = stockAnalytics.loading.productAnalytics;

  // ============================================================================
  // STOCK VALUATION FUNCTIONS
  // ============================================================================

  // Función para cargar valuación total de stock
  const loadStockValuation = useCallback(async () => {
    await dispatch(fetchStockValuation());
  }, [dispatch]);

  // Función para limpiar datos de valuación
  const clearValuationData = useCallback(() => {
    dispatch(clearStockValuation());
  }, [dispatch]);

  // ============================================================================
  // PRODUCT ANALYTICS FUNCTIONS
  // ============================================================================

  // Función para cargar analytics por producto
  const loadProductAnalytics = useCallback(
    async (limit: number = 50, offset: number = 0) => {
      try {
        const result = await dispatch(fetchProductStockAnalytics({ limit, offset })).unwrap();
        return result;
      } catch (error) {
        console.error('Error loading product analytics:', error);
        throw error;
      }
    },
    [dispatch]
  );

  // Función para cargar más productos (paginación infinita)
  const loadMoreProductAnalytics = useCallback(
    async (limit: number = 50) => {
      // Evitar múltiples llamadas simultáneas
      if (isLoadingProductAnalytics) {
        return;
      }
      
      const currentOffset = stockAnalytics.pagination.productAnalytics.currentOffset;
      return await loadProductAnalytics(limit, currentOffset);
    },
    [stockAnalytics.pagination.productAnalytics.currentOffset, loadProductAnalytics, isLoadingProductAnalytics]
  );

  // Función para refrescar analytics de productos (reemplaza todos los datos)
  const refreshProductAnalytics = useCallback(
    async (limit: number = 50) => {
      try {
        // Limpiar datos existentes antes de cargar nuevos
        dispatch(clearProductStockAnalytics());
        return await loadProductAnalytics(limit, 0);
      } catch (error) {
        console.error('Error refreshing product analytics:', error);
        throw error;
      }
    },
    [dispatch, loadProductAnalytics]
  );

  // Función para limpiar datos de productos
  const clearProductData = useCallback(() => {
    dispatch(clearProductStockAnalytics());
  }, [dispatch]);

  // ============================================================================
  // LOW STOCK ALERTS FUNCTIONS
  // ============================================================================

  // Función para cargar alertas de stock bajo
  const loadLowStockAlerts = useCallback(
    async (threshold: number = 10, limit: number = 20) => {
      await dispatch(fetchLowStockAlerts({ threshold, limit }));
    },
    [dispatch]
  );

  // Función para refrescar alertas de stock bajo
  const refreshLowStockAlerts = useCallback(
    async (threshold: number = 10, limit: number = 20) => {
      await dispatch(fetchLowStockAlerts({ threshold, limit }));
    },
    [dispatch]
  );

  // Función para limpiar datos de alertas
  const clearAlertsData = useCallback(() => {
    dispatch(clearLowStockAlerts());
  }, [dispatch]);

  // ============================================================================
  // CATEGORY ANALYTICS FUNCTIONS
  // ============================================================================

  // Función para cargar analytics por categoría
  const loadCategoryAnalytics = useCallback(async () => {
    await dispatch(fetchCategoryStockAnalytics());
  }, [dispatch]);

  // Función para refrescar analytics de categorías
  const refreshCategoryAnalytics = useCallback(async () => {
    await dispatch(fetchCategoryStockAnalytics());
  }, [dispatch]);

  // Función para limpiar datos de categorías
  const clearCategoryData = useCallback(() => {
    dispatch(clearCategoryStockAnalytics());
  }, [dispatch]);

  // ============================================================================
  // SUBCATEGORY ANALYTICS FUNCTIONS
  // ============================================================================

  // Función para cargar analytics por subcategoría
  const loadSubcategoryAnalytics = useCallback(async () => {
    await dispatch(fetchSubcategoryStockAnalytics());
  }, [dispatch]);

  // Función para refrescar analytics de subcategorías
  const refreshSubcategoryAnalytics = useCallback(async () => {
    await dispatch(fetchSubcategoryStockAnalytics());
  }, [dispatch]);

  // Función para limpiar datos de subcategorías
  const clearSubcategoryData = useCallback(() => {
    dispatch(clearSubcategoryStockAnalytics());
  }, [dispatch]);

  // ============================================================================
  // CATEGORY-SUBCATEGORY ANALYTICS FUNCTIONS
  // ============================================================================

  // Función para cargar analytics jerárquicas (categorías con subcategorías)
  const loadCategorySubcategoryAnalytics = useCallback(async () => {
    await dispatch(fetchCategorySubcategoryStockAnalytics());
  }, [dispatch]);

  // Función para refrescar analytics jerárquicas
  const refreshCategorySubcategoryAnalytics = useCallback(async () => {
    await dispatch(fetchCategorySubcategoryStockAnalytics());
  }, [dispatch]);

  // Función para limpiar datos jerárquicos
  const clearCategorySubcategoryData = useCallback(() => {
    dispatch(clearCategorySubcategoryStockAnalytics());
  }, [dispatch]);

  // ============================================================================
  // BULK OPERATIONS
  // ============================================================================

  // Función para cargar todos los datos de stock
  const loadAllStockData = useCallback(
    async (options?: {
      productLimit?: number;
      productOffset?: number;
      alertThreshold?: number;
      alertLimit?: number;
    }) => {
      const {
        productLimit = 50,
        productOffset = 0,
        alertThreshold = 10,
        alertLimit = 20,
      } = options || {};

      await Promise.all([
        dispatch(fetchStockValuation()),
        dispatch(fetchProductStockAnalytics({ limit: productLimit, offset: productOffset })),
        dispatch(fetchLowStockAlerts({ threshold: alertThreshold, limit: alertLimit })),
        dispatch(fetchCategoryStockAnalytics()),
        dispatch(fetchSubcategoryStockAnalytics()),
        dispatch(fetchCategorySubcategoryStockAnalytics()),
      ]);
    },
    [dispatch]
  );

  // Función para refrescar todos los datos
  const refreshAllStockData = useCallback(
    async (options?: {
      productLimit?: number;
      alertThreshold?: number;
      alertLimit?: number;
    }) => {
      const {
        productLimit = 50,
        alertThreshold = 10,
        alertLimit = 20,
      } = options || {};

      await Promise.all([
        dispatch(fetchStockValuation()),
        dispatch(fetchProductStockAnalytics({ limit: productLimit, offset: 0 })),
        dispatch(fetchLowStockAlerts({ threshold: alertThreshold, limit: alertLimit })),
        dispatch(fetchCategoryStockAnalytics()),
        dispatch(fetchSubcategoryStockAnalytics()),
        dispatch(fetchCategorySubcategoryStockAnalytics()),
      ]);
    },
    [dispatch]
  );

  // Función para limpiar todos los datos de stock
  const clearAllStockData = useCallback(() => {
    dispatch(clearAllStockAnalytics());
  }, [dispatch]);

  // ============================================================================
  // COMPUTED VALUES
  // ============================================================================

  // Datos de valuación
  const stockValuation = stockAnalytics.valuation;
  const productAnalytics = useMemo(() => stockAnalytics.productAnalytics || [], [stockAnalytics.productAnalytics]);
  const lowStockAlerts = stockAnalytics.lowStockAlerts || [];
  const categoryAnalytics = stockAnalytics.categoryAnalytics || [];
  const subcategoryAnalytics = stockAnalytics.subcategoryAnalytics || [];
  const categorySubcategoryAnalytics = stockAnalytics.categorySubcategoryAnalytics || [];

  // Estados de carga
  const isLoadingValuation = stockAnalytics.loading.valuation;
  const isLoadingLowStockAlerts = stockAnalytics.loading.lowStockAlerts;
  const isLoadingCategoryAnalytics = stockAnalytics.loading.categoryAnalytics;
  const isLoadingSubcategoryAnalytics = stockAnalytics.loading.subcategoryAnalytics;
  const isLoadingCategorySubcategoryAnalytics = stockAnalytics.loading.categorySubcategoryAnalytics;

  // Estados de error
  const valuationError = stockAnalytics.error.valuation;
  const productAnalyticsError = stockAnalytics.error.productAnalytics;
  const lowStockAlertsError = stockAnalytics.error.lowStockAlerts;
  const categoryAnalyticsError = stockAnalytics.error.categoryAnalytics;
  const subcategoryAnalyticsError = stockAnalytics.error.subcategoryAnalytics;
  const categorySubcategoryAnalyticsError = stockAnalytics.error.categorySubcategoryAnalytics;

  // Estado general de carga
  const isLoadingAny = isLoadingValuation || isLoadingProductAnalytics || isLoadingLowStockAlerts || isLoadingCategoryAnalytics || isLoadingSubcategoryAnalytics || isLoadingCategorySubcategoryAnalytics;

  // Verificar si hay algún error
  const hasAnyError = Boolean(valuationError || productAnalyticsError || lowStockAlertsError || categoryAnalyticsError || subcategoryAnalyticsError || categorySubcategoryAnalyticsError);

  // ============================================================================
  // HELPER FUNCTIONS
  // ============================================================================

  // Formatear moneda USD
  const formatCurrency = useCallback((value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  }, []);

  // Formatear porcentaje
  const formatPercentage = useCallback((value: number) => {
    const sign = value >= 0 ? '+' : '';
    return `${sign}${value.toFixed(1)}%`;
  }, []);

  // Formatear número
  const formatNumber = useCallback((value: number) => {
    return new Intl.NumberFormat('en-US').format(value);
  }, []);

  // Obtener color del badge de stock
  const getStockBadgeColor = useCallback((stock: number) => {
    if (stock === 0) return 'bg-red-100 text-red-800';
    if (stock <= 5) return 'bg-red-100 text-red-800';
    if (stock <= 10) return 'bg-yellow-100 text-yellow-800';
    return 'bg-green-100 text-green-800';
  }, []);

  // Obtener estado del stock
  const getStockStatus = useCallback((stock: number) => {
    if (stock === 0) return { status: 'Sin stock', severity: 'critical' };
    if (stock <= 5) return { status: 'Stock crítico', severity: 'critical' };
    if (stock <= 10) return { status: 'Stock bajo', severity: 'warning' };
    return { status: 'Stock normal', severity: 'normal' };
  }, []);

  // Formatear fecha
  const formatDate = useCallback((dateString: string) => {
    return new Intl.DateTimeFormat('es-AR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(dateString));
  }, []);

  // Calcular totales agregados
  const calculateTotals = useCallback(() => {
    if (!productAnalytics.length) {
      return {
        totalProducts: 0,
        totalVariants: 0,
        totalStock: 0,
        totalValuationAtCost: 0,
        totalValuationAtRetail: 0,
      };
    }

    return productAnalytics.reduce(
      (acc, product) => ({
        totalProducts: acc.totalProducts + 1,
        totalVariants: acc.totalVariants + product.variants.length,
        totalStock: acc.totalStock + product.totalStock,
        totalValuationAtCost: acc.totalValuationAtCost + product.totalValuationAtCost,
        totalValuationAtRetail: acc.totalValuationAtRetail + product.totalValuationAtRetail,
      }),
      {
        totalProducts: 0,
        totalVariants: 0,
        totalStock: 0,
        totalValuationAtCost: 0,
        totalValuationAtRetail: 0,
      }
    );
  }, [productAnalytics]);

  // ============================================================================
  // EFFECTS
  // ============================================================================

  // Cargar datos iniciales solo una vez
  useEffect(() => {
    if (!hasInitializedRef.current && !isLoadingAny && !stockValuation) {
      hasInitializedRef.current = true;
      loadAllStockData();
    }
  }, [loadAllStockData, stockValuation, isLoadingAny]);

  return {
    // Datos
    stockValuation,
    productAnalytics,
    lowStockAlerts,
    categoryAnalytics,
    subcategoryAnalytics,
    categorySubcategoryAnalytics,

    // Estados de carga
    isLoadingValuation,
    isLoadingProductAnalytics,
    isLoadingLowStockAlerts,
    isLoadingCategoryAnalytics,
    isLoadingSubcategoryAnalytics,
    isLoadingCategorySubcategoryAnalytics,
    isLoadingAny,

    // Estados de error
    valuationError,
    productAnalyticsError,
    lowStockAlertsError,
    categoryAnalyticsError,
    subcategoryAnalyticsError,
    categorySubcategoryAnalyticsError,
    hasAnyError,

    // Propiedades de paginación
    hasMoreProducts: stockAnalytics.pagination.productAnalytics.hasMore,
    productPageSize: stockAnalytics.pagination.productAnalytics.pageSize,
    currentProductOffset: stockAnalytics.pagination.productAnalytics.currentOffset,

    // Funciones individuales
    loadStockValuation,
    loadProductAnalytics,
    loadMoreProductAnalytics,
    loadLowStockAlerts,
    loadCategoryAnalytics,
    loadSubcategoryAnalytics,
    loadCategorySubcategoryAnalytics,

    // Funciones de refresh
    refreshProductAnalytics,
    refreshLowStockAlerts,
    refreshCategoryAnalytics,
    refreshSubcategoryAnalytics,
    refreshCategorySubcategoryAnalytics,

    // Funciones de limpieza
    clearValuationData,
    clearProductData,
    clearAlertsData,
    clearCategoryData,
    clearSubcategoryData,
    clearCategorySubcategoryData,

    // Funciones bulk
    loadAllStockData,
    refreshAllStockData,
    clearAllStockData,

    // Helpers
    formatCurrency,
    formatPercentage,
    formatNumber,
    getStockBadgeColor,
    getStockStatus,
    formatDate,
    calculateTotals,
  };
};
