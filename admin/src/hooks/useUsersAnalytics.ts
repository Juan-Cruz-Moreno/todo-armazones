import { useCallback, useRef, useEffect } from "react";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import {
  fetchUsersAnalyticsList,
  fetchUserDetailedAnalytics,
  setSelectedUserMetric,
  clearUsersAnalyticsListError,
  clearUserDetailedAnalyticsError,
  clearUsersAnalyticsListData,
  clearUserDetailedAnalyticsData,
} from "@/redux/slices/analyticsSlice";
import { UserAnalyticsMetricsDto } from "@/interfaces/analytics";
import { AnalyticsPeriod, AnalyticsGranularity, AnalyticsTimeZone } from "@/enums/analytics.enum";

export const useUsersAnalytics = () => {
  const dispatch = useAppDispatch();
  const hasInitializedListRef = useRef(false);
  
  const {
    usersAnalyticsList,
    userDetailedAnalytics,
    loading,
    usersAnalyticsListError,
    userDetailedAnalyticsError,
    selectedUserMetric,
  } = useAppSelector((state) => state.analytics);

  // ============================================================================
  // USERS ANALYTICS LIST FUNCTIONS
  // ============================================================================

  // Función para cargar lista de usuarios con analytics
  const loadUsersAnalyticsList = useCallback(
    async (limit: number = 20, cursor?: string, direction: 'forward' | 'backward' = 'forward') => {
      await dispatch(fetchUsersAnalyticsList({ limit, cursor, direction }));
    },
    [dispatch]
  );

  // Función para refrescar la lista
  const refreshUsersAnalyticsList = useCallback(
    async (limit: number = 20) => {
      await dispatch(fetchUsersAnalyticsList({ limit }));
    },
    [dispatch]
  );

  // Función para limpiar errores de la lista
  const clearUsersListError = useCallback(() => {
    dispatch(clearUsersAnalyticsListError());
  }, [dispatch]);

  // Función para limpiar datos de la lista
  const clearUsersListData = useCallback(() => {
    dispatch(clearUsersAnalyticsListData());
  }, [dispatch]);

  // ============================================================================
  // USER DETAILED ANALYTICS FUNCTIONS
  // ============================================================================

  // Función para cargar analytics detalladas de un usuario
  const loadUserDetailedAnalytics = useCallback(
    async (
      userId: string,
      period: AnalyticsPeriod = AnalyticsPeriod.ThisMonth,
      granularity?: AnalyticsGranularity,
      timezone: AnalyticsTimeZone = AnalyticsTimeZone.Argentina,
      customRange?: { startDate: string; endDate: string },
      compareWithPrevious: boolean = false
    ) => {
      const params = {
        userId,
        period,
        granularity,
        timezone,
        customRange,
        compareWithPrevious,
      };

      await dispatch(fetchUserDetailedAnalytics(params));
    },
    [dispatch]
  );

  // Función para cambiar la métrica seleccionada del gráfico
  const changeSelectedUserMetric = useCallback(
    (metric: keyof UserAnalyticsMetricsDto) => {
      dispatch(setSelectedUserMetric(metric));
    },
    [dispatch]
  );

  // Función para limpiar errores de analytics detalladas
  const clearUserDetailedError = useCallback(() => {
    dispatch(clearUserDetailedAnalyticsError());
  }, [dispatch]);

  // Función para limpiar datos de analytics detalladas
  const clearUserDetailedData = useCallback(() => {
    dispatch(clearUserDetailedAnalyticsData());
  }, [dispatch]);

  // ============================================================================
  // COMPUTED VALUES
  // ============================================================================

  // Datos de la lista de usuarios
  const usersList = usersAnalyticsList?.users || [];
  const usersListPagination = usersAnalyticsList?.pagination;
  const usersListMeta = usersAnalyticsList?.meta;

  // Datos de analytics detalladas
  const userInfo = userDetailedAnalytics?.user;
  const currentUserMetrics = userDetailedAnalytics?.current.total;
  const previousUserMetrics = userDetailedAnalytics?.previous?.total;
  const userComparison = userDetailedAnalytics?.previous?.comparison;
  const userBreakdown = userDetailedAnalytics?.current.breakdown;
  const hasUserBreakdown = Boolean(userBreakdown && userBreakdown.length > 0);
  const hasUserComparison = Boolean(userDetailedAnalytics?.previous);

  // Estados de carga
  const isLoadingUsersList = loading.isLoadingUsersAnalyticsList;
  const isLoadingUserDetails = loading.isLoadingUserDetailedAnalytics;

  // ============================================================================
  // HELPER FUNCTIONS
  // ============================================================================

  // Formatear moneda
  const formatCurrency = useCallback((value: number) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  }, []);

  // Formatear porcentaje
  const formatPercentage = useCallback((value: number) => {
    const sign = value >= 0 ? '+' : '';
    return `${sign}${value.toFixed(1)}%`;
  }, []);

  // Formatear número
  const formatNumber = useCallback((value: number) => {
    return new Intl.NumberFormat('es-AR').format(value);
  }, []);

  // Obtener color del cambio porcentual
  const getChangeColor = useCallback((change: number) => {
    if (change > 0) return 'text-green-600';
    if (change < 0) return 'text-red-600';
    return 'text-gray-600';
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

  // Formatear fecha corta
  const formatDateShort = useCallback((dateString: string) => {
    return new Intl.DateTimeFormat('es-AR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    }).format(new Date(dateString));
  }, []);

  // ============================================================================
  // EFFECTS
  // ============================================================================

  // Cargar datos iniciales de la lista solo una vez
  useEffect(() => {
    if (!hasInitializedListRef.current && !usersAnalyticsList && !isLoadingUsersList) {
      hasInitializedListRef.current = true;
      loadUsersAnalyticsList();
    }
  }, [loadUsersAnalyticsList, usersAnalyticsList, isLoadingUsersList]);

  return {
    // Lista de usuarios
    usersList,
    usersListPagination,
    usersListMeta,
    isLoadingUsersList,
    usersAnalyticsListError,
    loadUsersAnalyticsList,
    refreshUsersAnalyticsList,
    clearUsersListError,
    clearUsersListData,

    // Analytics detalladas de usuario
    userInfo,
    currentUserMetrics,
    previousUserMetrics,
    userComparison,
    userBreakdown,
    hasUserBreakdown,
    hasUserComparison,
    isLoadingUserDetails,
    userDetailedAnalyticsError,
    selectedUserMetric,
    loadUserDetailedAnalytics,
    changeSelectedUserMetric,
    clearUserDetailedError,
    clearUserDetailedData,

    // Helpers
    formatCurrency,
    formatPercentage,
    formatNumber,
    getChangeColor,
    formatDate,
    formatDateShort,
  };
};
