import { useCallback, useEffect, useRef } from 'react';
import { useAppDispatch, useAppSelector } from '@/redux/hooks';
import {
  fetchOrderAnalytics,
  setFilters,
  setPeriod,
  setGranularity,
  setCustomRange,
  toggleComparison,
  setSelectedMetric,
  clearError,
  clearData,
} from '@/redux/slices/analyticsSlice';
import {
  AnalyticsPeriod,
  AnalyticsGranularity,
  AnalyticsTimeZone,
} from '@/enums/analytics.enum';
import {
  AnalyticsFilters,
  OrderAnalyticsQueryDto,
  OrderAnalyticsMetricsDto,
} from '@/interfaces/analytics';

export const useOrderAnalytics = () => {
  const dispatch = useAppDispatch();
  const hasInitializedRef = useRef(false);
  
  const {
    orderAnalytics,
    loading,
    filters,
    error,
    lastUpdated,
    selectedMetric,
    chartTimeRange,
  } = useAppSelector((state) => state.analytics);

  // Función para actualizar filtros y recargar datos
  const updateFilters = useCallback(
    async (newFilters: Partial<AnalyticsFilters>) => {
      dispatch(setFilters(newFilters));
      // No hacer fetch automático, dejar que el usuario lo haga manualmente
    },
    [dispatch]
  );

  // Función para cambiar período
  const changePeriod = useCallback(
    async (period: AnalyticsPeriod) => {
      dispatch(setPeriod(period));
      
      // Para Custom, no hacer fetch automático - esperar a que se establezcan las fechas
      if (period === AnalyticsPeriod.Custom) {
        return;
      }
      
      // Hacer fetch inmediatamente con el nuevo período para otros casos
      const query: OrderAnalyticsQueryDto = {
        period,
        granularity: period === AnalyticsPeriod.Today ? AnalyticsGranularity.Hour 
                   : period === AnalyticsPeriod.ThisWeek ? AnalyticsGranularity.Day
                   : period === AnalyticsPeriod.ThisMonth ? AnalyticsGranularity.Day
                   : period === AnalyticsPeriod.ThisYear ? AnalyticsGranularity.Month
                   : AnalyticsGranularity.Day,
        timezone: AnalyticsTimeZone.Argentina,
        compareWithPrevious: filters.compareWithPrevious,
      };
      await dispatch(fetchOrderAnalytics(query));
    },
    [dispatch, filters.compareWithPrevious]
  );

  // Función para cambiar granularidad
  const changeGranularity = useCallback(
    async (granularity: AnalyticsGranularity) => {
      dispatch(setGranularity(granularity));
      const query: OrderAnalyticsQueryDto = {
        period: filters.period,
        granularity,
        timezone: AnalyticsTimeZone.Argentina,
        compareWithPrevious: filters.compareWithPrevious,
      };
      if (filters.customRange) {
        query.customRange = filters.customRange;
      }
      await dispatch(fetchOrderAnalytics(query));
    },
    [dispatch, filters.period, filters.compareWithPrevious, filters.customRange]
  );

  // Función para establecer rango personalizado
  const setDateRange = useCallback(
    async (startDate: string, endDate: string) => {
      const customRange = { startDate, endDate };
      dispatch(setCustomRange(customRange));
      const query: OrderAnalyticsQueryDto = {
        period: AnalyticsPeriod.Custom,
        granularity: filters.granularity,
        timezone: AnalyticsTimeZone.Argentina,
        compareWithPrevious: filters.compareWithPrevious,
        customRange,
      };
      await dispatch(fetchOrderAnalytics(query));
    },
    [dispatch, filters.granularity, filters.compareWithPrevious]
  );

  // Función para toggle comparación
  const toggleComparisonMode = useCallback(
    async () => {
      const newCompareValue = !filters.compareWithPrevious;
      dispatch(toggleComparison());
      const query: OrderAnalyticsQueryDto = {
        period: filters.period,
        granularity: filters.granularity,
        timezone: AnalyticsTimeZone.Argentina,
        compareWithPrevious: newCompareValue,
      };
      if (filters.customRange) {
        query.customRange = filters.customRange;
      }
      await dispatch(fetchOrderAnalytics(query));
    },
    [dispatch, filters.period, filters.granularity, filters.compareWithPrevious, filters.customRange]
  );

  // Función para cambiar métrica seleccionada
  const changeSelectedMetric = useCallback(
    (metric: keyof OrderAnalyticsMetricsDto) => {
      dispatch(setSelectedMetric(metric));
    },
    [dispatch]
  );

  // Función para limpiar errores
  const clearAnalyticsError = useCallback(() => {
    dispatch(clearError());
  }, [dispatch]);

  // Función para limpiar datos
  const clearAnalyticsData = useCallback(() => {
    dispatch(clearData());
  }, [dispatch]);

  // Función para refrescar datos usando los filtros actuales
  const refreshAnalytics = useCallback(async () => {
    const query: OrderAnalyticsQueryDto = {
      period: filters.period,
      granularity: filters.granularity,
      timezone: AnalyticsTimeZone.Argentina,
      compareWithPrevious: filters.compareWithPrevious,
    };
    if (filters.customRange) {
      query.customRange = filters.customRange;
    }
    await dispatch(fetchOrderAnalytics(query));
  }, [dispatch, filters]);

  // Datos computados
  const currentMetrics = orderAnalytics?.current.total;
  const previousMetrics = orderAnalytics?.previous?.total;
  const comparison = orderAnalytics?.previous?.comparison;
  const breakdown = orderAnalytics?.current.breakdown;
  const hasBreakdown = Boolean(breakdown && breakdown.length > 0);
  const hasComparison = Boolean(orderAnalytics?.previous);

  // Helpers para formateo
  const formatCurrency = useCallback((value: number) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
    }).format(value);
  }, []);

  const formatPercentage = useCallback((value: number) => {
    const sign = value >= 0 ? '+' : '';
    return `${sign}${value.toFixed(1)}%`;
  }, []);

  const formatNumber = useCallback((value: number) => {
    return new Intl.NumberFormat('es-AR').format(value);
  }, []);

  // Función para obtener el color del cambio porcentual
  const getChangeColor = useCallback((change: number) => {
    if (change > 0) return 'text-green-600';
    if (change < 0) return 'text-red-600';
    return 'text-gray-600';
  }, []);

  // Cargar datos iniciales solo una vez
  useEffect(() => {
    if (!hasInitializedRef.current && !orderAnalytics && !loading.isLoading) {
      hasInitializedRef.current = true;
      // Hacer fetch inicial con los filtros por defecto
      dispatch(fetchOrderAnalytics({
        period: AnalyticsPeriod.ThisMonth,
        granularity: AnalyticsGranularity.Day,
        timezone: AnalyticsTimeZone.Argentina,
        compareWithPrevious: true,
      }));
    }
  }, [dispatch, orderAnalytics, loading.isLoading]);

  return {
    // Datos
    orderAnalytics,
    currentMetrics,
    previousMetrics,
    comparison,
    breakdown,
    
    // Estados
    loading,
    error,
    lastUpdated,
    selectedMetric,
    chartTimeRange,
    filters,
    
    // Flags
    hasBreakdown,
    hasComparison,
    
    // Acciones
    updateFilters,
    changePeriod,
    changeGranularity,
    setDateRange,
    toggleComparisonMode,
    changeSelectedMetric,
    clearAnalyticsError,
    clearAnalyticsData,
    refreshAnalytics,
    
    // Helpers
    formatCurrency,
    formatPercentage,
    formatNumber,
    getChangeColor,
  };
};
