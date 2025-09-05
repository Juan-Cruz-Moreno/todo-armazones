import { AnalyticsGranularity, AnalyticsPeriod, AnalyticsTimeZone } from '@enums/analytics.enum';

// DTO para consultas de analytics de órdenes
export interface OrderAnalyticsQueryDto {
  period: AnalyticsPeriod;
  granularity?: AnalyticsGranularity;
  timezone?: AnalyticsTimeZone;
  customRange?: {
    startDate: string; // ISO string
    endDate: string; // ISO string
  };
  compareWithPrevious?: boolean;
}

// DTO para respuesta de métricas de órdenes
export interface OrderAnalyticsMetricsDto {
  gross: number;
  net: number; // Ahora representa el margen de contribución total
  count: number;
  items: number;
  averageGrossDaily: number;
  averageNetDaily: number; // Ahora representa el promedio diario de margen de contribución
}

// DTO para un punto del breakdown temporal
export interface OrderAnalyticsBreakdownPointDto {
  timestamp: string; // ISO string
  label: string;
  metrics: OrderAnalyticsMetricsDto;
}

// DTO para información del período
export interface AnalyticsPeriodDto {
  type: AnalyticsPeriod;
  range: {
    startDate: string; // ISO string
    endDate: string; // ISO string
  };
  granularity?: AnalyticsGranularity;
}

// DTO para comparación con período anterior
export interface OrderAnalyticsComparisonDto {
  grossChange: number; // Porcentaje de cambio
  netChange: number; // Ahora representa cambio en margen de contribución
  countChange: number;
  itemsChange: number;
  averageGrossDailyChange: number;
  averageNetDailyChange: number; // Ahora representa cambio en promedio diario de margen de contribución
}

// DTO para datos del período anterior
export interface OrderAnalyticsPreviousDto {
  total: OrderAnalyticsMetricsDto;
  comparison: OrderAnalyticsComparisonDto;
}

// DTO para datos del período actual
export interface OrderAnalyticsCurrentDto {
  total: OrderAnalyticsMetricsDto;
  breakdown?: OrderAnalyticsBreakdownPointDto[];
}

// DTO principal para respuesta de analytics de órdenes
export interface OrderAnalyticsResponseDto {
  period: AnalyticsPeriodDto;
  current: OrderAnalyticsCurrentDto;
  previous?: OrderAnalyticsPreviousDto;
}

// DTOs para analytics de usuarios
export interface UserAnalyticsMetricsDto {
  totalOrders: number;
  totalRevenue: number;
  averageOrderValue: number;
}

// DTO para un punto del breakdown temporal de usuarios
export interface UserAnalyticsBreakdownPointDto {
  timestamp: string; // ISO string
  label: string;
  metrics: UserAnalyticsMetricsDto;
}

// DTO para comparación con período anterior (usuarios)
export interface UserAnalyticsComparisonDto {
  totalOrdersChange: number; // Porcentaje de cambio
  totalRevenueChange: number;
  averageOrderValueChange: number;
}

// DTO para datos del período anterior (usuarios)
export interface UserAnalyticsPreviousDto {
  total: UserAnalyticsMetricsDto;
  comparison: UserAnalyticsComparisonDto;
}

// DTO para datos del período actual (usuarios)
export interface UserAnalyticsCurrentDto {
  total: UserAnalyticsMetricsDto;
  breakdown?: UserAnalyticsBreakdownPointDto[];
}

// DTO principal para respuesta de analytics de usuarios
export interface UserAnalyticsResponseDto {
  period: AnalyticsPeriodDto;
  current: UserAnalyticsCurrentDto;
  previous?: UserAnalyticsPreviousDto;
}

// ============================================================================
// INDIVIDUAL USER ANALYTICS DTOs
// ============================================================================

// DTO para información básica del usuario
export interface UserInfoDto {
  id: string;
  email: string;
  displayName: string;
  firstName?: string;
  lastName?: string;
  role: string;
  status: string;
  createdAt: string;
  lastLogin?: string;
}

// DTO para analytics de un usuario individual
export interface IndividualUserAnalyticsDto {
  user: UserInfoDto;
  analytics: UserAnalyticsMetricsDto;
}

// DTO para paginación con cursor
export interface PaginationInfoDto {
  hasNextPage: boolean;
  hasPreviousPage: boolean;
  startCursor?: string;
  endCursor?: string;
  totalCount?: number;
}

// DTO principal para respuesta de lista de usuarios con analytics
export interface UsersAnalyticsListResponseDto {
  period: AnalyticsPeriodDto;
  users: IndividualUserAnalyticsDto[];
  pagination: PaginationInfoDto;
  meta: {
    generatedAt: string;
    timezone: string;
    dataSource: string;
  };
}

// DTO para respuesta de usuario específico con analytics detalladas
export interface UserDetailedAnalyticsResponseDto {
  period: AnalyticsPeriodDto;
  user: UserInfoDto;
  current: UserAnalyticsCurrentDto;
  previous?: UserAnalyticsPreviousDto;
  meta: {
    generatedAt: string;
    timezone: string;
    dataSource: string;
    userId: string;
  };
}
