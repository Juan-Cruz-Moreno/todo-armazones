"use client";

import React, { useEffect, useRef, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ShoppingCart,
  Package,
  Users,
  RefreshCw,
  AlertCircle,
  ArrowLeft,
  DollarSign,
  TrendingUp,
  User,
  Calendar,
  Clock,
} from "lucide-react";
import { 
  AnalyticsTabNavigation, 
  MetricCard, 
  UserAnalyticsLineChart,
  UserMetricSelector,
  UserAnalyticsFilters
} from "@/components/analytics";
import { useUsersAnalytics } from "@/hooks/useUsersAnalytics";
import { AnalyticsPeriod, AnalyticsGranularity, AnalyticsTimeZone } from "@/enums/analytics.enum";

const UserDetailAnalyticsPage = () => {
  const params = useParams();
  const router = useRouter();
  const userId = params.id as string;
  const hasInitializedRef = useRef(false);

  const {
    // Analytics detalladas de usuario
    userInfo,
    currentUserMetrics,
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

    // Helpers
    formatCurrency,
    formatNumber,
    formatDate,
  } = useUsersAnalytics();

  // Estados locales para filtros
  const [filters, setFilters] = React.useState({
    period: AnalyticsPeriod.ThisMonth,
    granularity: AnalyticsGranularity.Day,
    compareWithPrevious: true,
    customRange: undefined as { startDate: string; endDate: string } | undefined,
  });

  const tabs = [
    {
      id: "orders",
      label: "Órdenes",
      icon: <ShoppingCart className="h-4 w-4" />,
      href: "/analytics/orders",
    },
    {
      id: "users",
      label: "Usuarios",
      icon: <Users className="h-4 w-4" />,
      href: "/analytics/users",
    },
    {
      id: "stock",
      label: "Stock",
      icon: <Package className="h-4 w-4" />,
      href: "/analytics/stock",
    },
  ];

  // Función para cargar datos
  const loadData = useCallback(async () => {
    await loadUserDetailedAnalytics(
      userId,
      filters.period,
      filters.granularity,
      AnalyticsTimeZone.Argentina,
      filters.customRange,
      filters.compareWithPrevious
    );
  }, [
    userId,
    filters.period,
    filters.granularity,
    filters.customRange,
    filters.compareWithPrevious,
    loadUserDetailedAnalytics,
  ]);

  // Cargar datos iniciales
  useEffect(() => {
    if (!hasInitializedRef.current && userId) {
      hasInitializedRef.current = true;
      loadData();
    }
  }, [userId, loadData]);

  // Handlers para filtros
  const handlePeriodChange = useCallback(async (period: AnalyticsPeriod) => {
    const newFilters = {
      ...filters,
      period,
      // Ajustar granularidad según el período
      granularity: period === AnalyticsPeriod.Today ? AnalyticsGranularity.Hour 
                 : period === AnalyticsPeriod.ThisWeek ? AnalyticsGranularity.Day
                 : period === AnalyticsPeriod.ThisMonth ? AnalyticsGranularity.Day
                 : period === AnalyticsPeriod.ThisYear ? AnalyticsGranularity.Month
                 : filters.granularity,
    };
    
    if (period !== AnalyticsPeriod.Custom) {
      newFilters.customRange = undefined;
    }
    
    setFilters(newFilters);
    
    await loadUserDetailedAnalytics(
      userId,
      newFilters.period,
      newFilters.granularity,
      AnalyticsTimeZone.Argentina,
      newFilters.customRange,
      newFilters.compareWithPrevious
    );
  }, [filters, userId, loadUserDetailedAnalytics]);

  const handleGranularityChange = useCallback(async (granularity: AnalyticsGranularity) => {
    const newFilters = { ...filters, granularity };
    setFilters(newFilters);
    
    await loadUserDetailedAnalytics(
      userId,
      newFilters.period,
      newFilters.granularity,
      AnalyticsTimeZone.Argentina,
      newFilters.customRange,
      newFilters.compareWithPrevious
    );
  }, [filters, userId, loadUserDetailedAnalytics]);

  const handleDateRangeChange = useCallback(async (startDate: string, endDate: string) => {
    const customRange = { startDate, endDate };
    const newFilters = { ...filters, period: AnalyticsPeriod.Custom, customRange };
    setFilters(newFilters);
    
    await loadUserDetailedAnalytics(
      userId,
      newFilters.period,
      newFilters.granularity,
      AnalyticsTimeZone.Argentina,
      newFilters.customRange,
      newFilters.compareWithPrevious
    );
  }, [filters, userId, loadUserDetailedAnalytics]);

  const handleComparisonToggle = useCallback(async () => {
    const newFilters = { ...filters, compareWithPrevious: !filters.compareWithPrevious };
    setFilters(newFilters);
    
    await loadUserDetailedAnalytics(
      userId,
      newFilters.period,
      newFilters.granularity,
      AnalyticsTimeZone.Argentina,
      newFilters.customRange,
      newFilters.compareWithPrevious
    );
  }, [filters, userId, loadUserDetailedAnalytics]);

  const handleRefresh = async () => {
    await loadData();
  };

  if (userDetailedAnalyticsError) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-red-900 mb-2">Error al cargar datos</h3>
            <p className="text-red-700 mb-4">{userDetailedAnalyticsError}</p>
            <div className="space-x-4">
              <button
                onClick={clearUserDetailedError}
                className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 transition-colors"
              >
                Cerrar
              </button>
              <button
                onClick={() => router.push('/analytics/users')}
                className="bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700 transition-colors"
              >
                Volver a la lista
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => router.push('/analytics/users')}
                className="inline-flex items-center space-x-1 text-gray-600 hover:text-gray-900 transition-colors"
              >
                <ArrowLeft className="h-4 w-4" />
                <span>Volver a la lista</span>
              </button>
              
              <div>
                <h1 className="text-3xl font-bold text-gray-900">
                  Analytics de Usuario
                </h1>
                <p className="text-gray-600 mt-2">
                  Análisis detallado del comportamiento y performance del usuario
                </p>
              </div>
            </div>
            
            <button
              onClick={handleRefresh}
              disabled={isLoadingUserDetails}
              className="inline-flex items-center space-x-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <RefreshCw className={`h-4 w-4 ${isLoadingUserDetails ? 'animate-spin' : ''}`} />
              <span>Actualizar</span>
            </button>
          </div>
        </div>

        {/* Tabs Navigation */}
        <div className="mb-8">
          <AnalyticsTabNavigation tabs={tabs} />
        </div>

        <div className="space-y-6">
          {/* Información del usuario */}
          {userInfo && (
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="flex items-center space-x-6">
                <div className="flex-shrink-0">
                  <div className="h-16 w-16 rounded-full bg-purple-100 flex items-center justify-center">
                    <User className="h-8 w-8 text-purple-600" />
                  </div>
                </div>
                
                <div className="flex-1">
                  <div className="flex items-center space-x-4 mb-2">
                    <h2 className="text-xl font-semibold text-gray-900">
                      {userInfo.displayName}
                    </h2>
                  </div>
                  
                  <p className="text-gray-600 mb-2">{userInfo.email}</p>
                  
                  {(userInfo.firstName || userInfo.lastName) && (
                    <p className="text-sm text-gray-500 mb-2">
                      {userInfo.firstName} {userInfo.lastName}
                    </p>
                  )}
                  
                  <div className="flex items-center space-x-6 text-sm text-gray-500">
                    <div className="flex items-center space-x-1">
                      <Calendar className="h-4 w-4" />
                      <span>Registro: {formatDate(userInfo.createdAt)}</span>
                    </div>
                    {userInfo.lastLogin && (
                      <div className="flex items-center space-x-1">
                        <Clock className="h-4 w-4" />
                        <span>Último login: {formatDate(userInfo.lastLogin)}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Filtros */}
          <UserAnalyticsFilters
            period={filters.period}
            granularity={filters.granularity}
            compareWithPrevious={filters.compareWithPrevious}
            customRange={filters.customRange}
            onPeriodChange={handlePeriodChange}
            onGranularityChange={handleGranularityChange}
            onDateRangeChange={handleDateRangeChange}
            onComparisonToggle={handleComparisonToggle}
            isLoading={isLoadingUserDetails}
          />

          {/* Métricas principales */}
          {currentUserMetrics && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <MetricCard
                title="Revenue Total"
                value={formatCurrency(currentUserMetrics.totalRevenue)}
                change={hasUserComparison ? userComparison?.totalRevenueChange : undefined}
                changeLabel={hasUserComparison ? "vs período anterior" : undefined}
                icon={<DollarSign className="h-5 w-5" />}
                color="green"
                isLoading={isLoadingUserDetails}
              />
              
              <MetricCard
                title="Total de Órdenes"
                value={formatNumber(currentUserMetrics.totalOrders)}
                change={hasUserComparison ? userComparison?.totalOrdersChange : undefined}
                changeLabel={hasUserComparison ? "vs período anterior" : undefined}
                icon={<ShoppingCart className="h-5 w-5" />}
                color="blue"
                isLoading={isLoadingUserDetails}
              />
              
              <MetricCard
                title="Valor Promedio por Orden"
                value={formatCurrency(currentUserMetrics.averageOrderValue)}
                change={hasUserComparison ? userComparison?.averageOrderValueChange : undefined}
                changeLabel={hasUserComparison ? "vs período anterior" : undefined}
                icon={<TrendingUp className="h-5 w-5" />}
                color="purple"
                isLoading={isLoadingUserDetails}
              />
            </div>
          )}

          {/* Selector de métrica para el gráfico */}
          {hasUserBreakdown && (
            <UserMetricSelector
              selectedMetric={selectedUserMetric}
              onMetricChange={changeSelectedUserMetric}
              disabled={isLoadingUserDetails}
            />
          )}

          {/* Gráfico de líneas */}
          {hasUserBreakdown && userBreakdown && (
            <UserAnalyticsLineChart
              data={userBreakdown}
              selectedMetric={selectedUserMetric}
              isLoading={isLoadingUserDetails}
              height={400}
            />
          )}

          {/* Mensaje si no hay breakdown */}
          {!hasUserBreakdown && !isLoadingUserDetails && (
            <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
              <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No hay datos de breakdown disponibles
              </h3>
              <p className="text-gray-500">
                Selecciona un período con granularidad para ver el gráfico temporal.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default UserDetailAnalyticsPage;