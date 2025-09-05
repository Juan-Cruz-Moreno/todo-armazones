"use client";

import React from "react";
import {
  ShoppingCart,
  DollarSign,
  Package,
  TrendingUp,
  RefreshCw,
  AlertCircle,
  Users,
} from "lucide-react";
import { useOrderAnalytics } from "@/hooks/useOrderAnalytics";
import {
  MetricCard,
  AnalyticsLineChart,
  AnalyticsFilters,
  MetricSelector,
  AnalyticsTabNavigation,
} from "@/components/analytics";

const OrdersAnalyticsPage = () => {
  const {
    // Datos
    currentMetrics,
    comparison,
    breakdown,

    // Estados
    loading,
    error,
    lastUpdated,
    selectedMetric,
    filters,

    // Flags
    hasBreakdown,
    hasComparison,

    // Acciones
    changePeriod,
    changeGranularity,
    setDateRange,
    toggleComparisonMode,
    changeSelectedMetric,
    clearAnalyticsError,
    refreshAnalytics,

    // Helpers
    formatCurrency,
    formatNumber,
  } = useOrderAnalytics();

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
      description: "Analytics de inventario y valuación de stock",
    },
  ];

  const handleRefresh = async () => {
    await refreshAnalytics();
  };

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 py-6 sm:py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 sm:p-6 text-center">
            <AlertCircle className="h-10 w-10 sm:h-12 sm:w-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-red-800 mb-2">
              Error al cargar analytics
            </h3>
            <p className="text-red-600 mb-4 text-sm sm:text-base">{error}</p>
            <div className="flex flex-col sm:flex-row justify-center space-y-2 sm:space-y-0 sm:space-x-3">
              <button
                onClick={clearAnalyticsError}
                className="px-4 py-2 text-red-600 border border-red-300 rounded-md hover:bg-red-50 transition-colors"
              >
                Cerrar
              </button>
              <button
                onClick={handleRefresh}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
              >
                Reintentar
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-6 sm:py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 flex items-center space-x-2">
                <ShoppingCart className="h-6 w-6 sm:h-8 sm:w-8 text-blue-600" />
                <span>Analytics de Órdenes</span>
              </h1>
              <p className="text-gray-600 mt-1 sm:mt-2">
                Analiza el performance de ventas y órdenes en tiempo real
              </p>
            </div>

            {/* Botón de refresh */}
            <button
              onClick={handleRefresh}
              disabled={loading.isLoading}
              className={`
                flex items-center space-x-2 px-4 py-2 rounded-lg border transition-colors
                ${
                  loading.isLoading
                    ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                    : "bg-white text-gray-700 hover:bg-gray-50 border-gray-300"
                }
              `}
            >
              <RefreshCw
                className={`h-4 w-4 ${loading.isLoading ? "animate-spin" : ""}`}
              />
              <span>Actualizar</span>
            </button>
          </div>
        </div>

        {/* Tabs Navigation */}
        <div className="mb-6 sm:mb-8">
          <AnalyticsTabNavigation tabs={tabs} />
        </div>

        <div className="space-y-6">
          {/* Filtros */}
          <AnalyticsFilters
            filters={filters}
            onPeriodChange={changePeriod}
            onGranularityChange={changeGranularity}
            onDateRangeChange={setDateRange}
            onComparisonToggle={toggleComparisonMode}
            isLoading={loading.isLoading}
          />

          {/* Cards de métricas */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 2xl:grid-cols-6 gap-4 sm:gap-6">
            <MetricCard
              title="Ventas Brutas"
              value={
                currentMetrics ? formatCurrency(currentMetrics.gross) : "-"
              }
              change={hasComparison ? comparison?.grossChange : undefined}
              changeLabel={hasComparison ? "vs período anterior" : undefined}
              icon={<DollarSign className="h-5 w-5" />}
              isLoading={loading.isLoading}
              color="blue"
            />

            <MetricCard
              title="Margen de Contribución"
              value={currentMetrics ? formatCurrency(currentMetrics.net) : "-"}
              change={hasComparison ? comparison?.netChange : undefined}
              changeLabel={hasComparison ? "vs período anterior" : undefined}
              icon={<TrendingUp className="h-5 w-5" />}
              isLoading={loading.isLoading}
              color="green"
            />

            <MetricCard
              title="Número de Órdenes"
              value={currentMetrics ? formatNumber(currentMetrics.count) : "-"}
              change={hasComparison ? comparison?.countChange : undefined}
              changeLabel={hasComparison ? "vs período anterior" : undefined}
              icon={<ShoppingCart className="h-5 w-5" />}
              isLoading={loading.isLoading}
              color="purple"
            />

            <MetricCard
              title="Items Vendidos"
              value={currentMetrics ? formatNumber(currentMetrics.items) : "-"}
              change={hasComparison ? comparison?.itemsChange : undefined}
              changeLabel={hasComparison ? "vs período anterior" : undefined}
              icon={<Package className="h-5 w-5" />}
              isLoading={loading.isLoading}
              color="orange"
            />

            <MetricCard
              title="Prom. Diario Bruto"
              value={
                currentMetrics
                  ? formatCurrency(currentMetrics.averageGrossDaily)
                  : "-"
              }
              change={
                hasComparison ? comparison?.averageGrossDailyChange : undefined
              }
              changeLabel={hasComparison ? "vs período anterior" : undefined}
              icon={<DollarSign className="h-5 w-5" />}
              isLoading={loading.isLoading}
              color="blue"
            />

            <MetricCard
              title="Prom. Diario Margen"
              value={
                currentMetrics
                  ? formatCurrency(currentMetrics.averageNetDaily)
                  : "-"
              }
              change={
                hasComparison ? comparison?.averageNetDailyChange : undefined
              }
              changeLabel={hasComparison ? "vs período anterior" : undefined}
              icon={<TrendingUp className="h-5 w-5" />}
              isLoading={loading.isLoading}
              color="green"
            />
          </div>

          {/* Selector de métrica para gráfico */}
          {hasBreakdown && breakdown && Array.isArray(breakdown) && breakdown.length > 0 && (
            <MetricSelector
              selectedMetric={selectedMetric}
              onMetricChange={changeSelectedMetric}
              disabled={loading.isLoading}
            />
          )}

          {/* Gráfico */}
          {hasBreakdown && breakdown && Array.isArray(breakdown) && breakdown.length > 0 && (
            <AnalyticsLineChart
              data={breakdown}
              selectedMetric={selectedMetric}
              isLoading={loading.isLoading}
              height={400}
            />
          )}

          {/* Información adicional */}
          {lastUpdated && (
            <div className="text-center text-sm text-gray-500">
              Última actualización:{" "}
              {new Date(lastUpdated).toLocaleString("es-AR")}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default OrdersAnalyticsPage;
