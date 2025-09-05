import { AnalyticsGranularity, AnalyticsPeriod, AnalyticsTimeZone } from '@enums/analytics.enum';

// Interfaces base para el sistema de analytics
export interface IAnalyticsDateRange {
  startDate: Date;
  endDate: Date;
}

export interface IAnalyticsQuery {
  period: AnalyticsPeriod;
  granularity?: AnalyticsGranularity;
  timezone: AnalyticsTimeZone;
  customRange?: {
    startDate: string; // ISO string
    endDate: string; // ISO string
  };
  compareWithPrevious?: boolean;
}

// Interface genérica para métricas de analytics
export interface IAnalyticsMetrics {
  [key: string]: number;
}

// Interface para un punto de datos en el breakdown temporal
export interface IAnalyticsBreakdownPoint<T extends IAnalyticsMetrics = IAnalyticsMetrics> {
  timestamp: Date;
  label: string;
  metrics: T;
}

// Interface para resultados de analytics con comparación
export interface IAnalyticsResult<T extends IAnalyticsMetrics = IAnalyticsMetrics> {
  period: {
    type: AnalyticsPeriod;
    range: IAnalyticsDateRange;
    granularity?: AnalyticsGranularity;
  };
  current: {
    total: T;
    breakdown?: IAnalyticsBreakdownPoint<T>[];
  };
  previous?: {
    total: T;
    comparison: { [K in keyof T]: number }; // Porcentajes de cambio
  };
}

// Métricas específicas para órdenes
export interface IOrderAnalyticsMetrics extends IAnalyticsMetrics {
  gross: number; // Total de ventas brutas (totalAmount)
  net: number; // Total margen de contribución (totalContributionMarginUSD)
  count: number; // Número de órdenes
  items: number; // Número total de items vendidos
  averageGrossDaily: number; // Promedio diario de ventas brutas
  averageNetDaily: number; // Promedio diario de margen de contribución
}

// Interface para datos agregados de órdenes desde MongoDB
export interface IOrderAggregationResult {
  _id: Record<string, unknown> | null;
  totalAmount: number;
  totalCogsUSD: number; // Usar campo pre-calculado
  totalContributionMarginUSD: number; // Usar campo pre-calculado
  orderCount: number;
  totalItems: number; // Total de items usando $size
  date?: Date; // Para agregaciones con breakdown temporal
}

// Interface específica para resultados de breakdown temporal
export interface IOrderBreakdownAggregationResult {
  _id: string; // Fecha agrupada como string (ej: "2025-08-07", "2025-W32", "2025-08")
  totalAmount: number;
  totalCogsUSD: number; // Usar campo pre-calculado
  totalContributionMarginUSD: number; // Usar campo pre-calculado
  orderCount: number;
  totalItems: number; // Total de items usando $size
}

export interface IUserAnalyticsMetrics extends IAnalyticsMetrics {
  totalOrders: number;
  totalRevenue: number;
  averageOrderValue: number;
}

// Interface para datos agregados de usuarios desde MongoDB
export interface IUserAggregationResult {
  _id: Record<string, unknown> | null;
  totalOrders: number;
  totalRevenue: number;
  date?: Date; // Para agregaciones con breakdown temporal
}

// Interface específica para resultados de breakdown temporal de usuarios
export interface IUserBreakdownAggregationResult {
  _id: string; // Fecha agrupada como string (ej: "2025-08-07", "2025-W32", "2025-08")
  totalOrders: number;
  totalRevenue: number;
}
