import { AnalyticsGranularity, AnalyticsPeriod, AnalyticsTimeZone } from "@/enums/analytics.enum";

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
  meta: {
    generatedAt: string;
    timezone: string;
    dataSource: string;
  };
}

// ============================================================================
// USER ANALYTICS INTERFACES
// ============================================================================

// DTO para respuesta de métricas de usuarios
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
  meta: {
    generatedAt: string;
    timezone: string;
    dataSource: string;
  };
}

// ============================================================================
// INDIVIDUAL USER ANALYTICS INTERFACES
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

// ============================================================================
// STOCK ANALYTICS INTERFACES
// ============================================================================

// Interface para métricas de stock
export interface StockAnalyticsMetricsDto {
  totalItems: number;
  totalValuationAtCost: number;
  totalValuationAtRetail: number;
  averageCostPerItem: number;
  averageRetailPerItem: number;
  profitMarginTotal: number;
  profitMarginPercentage: number;
}

// Interface para color de variante
export interface ProductVariantColorDto {
  name: string;
  hex: string;
}

// Interface para variante de producto
export interface ProductVariantDto {
  variantId: string;
  color: ProductVariantColorDto;
  stock: number;
  averageCostUSD: number;
  priceUSD: number;
  valuationAtCost: number;
  valuationAtRetail: number;
}

// Interface para analytics por producto
export interface ProductStockAnalyticsDto {
  productId: string;
  productModel: string;
  sku: string;
  slug: string;
  variants: ProductVariantDto[];
  totalStock: number;
  totalValuationAtCost: number;
  totalValuationAtRetail: number;
}

// Interface para alertas de stock bajo
export interface LowStockAlertDto {
  productId: string;
  productModel: string;
  sku: string;
  slug: string;
  variantId: string;
  color: ProductVariantColorDto;
  stock: number;
  averageCostUSD: number;
  priceUSD: number;
}

// Interface para analytics por categoría
// NOTA: Los productos con una sola categoría se agrupan bajo esa categoría específica.
// Los productos con múltiples categorías se agrupan bajo categoryId: "unisex", categoryName: "Unisex"
export interface CategoryStockAnalyticsDto {
  categoryId: string; // ID de la categoría o "unisex" para productos con múltiples categorías
  categoryName: string; // Nombre de la categoría o "Unisex"
  totalStock: number;
  totalValuationAtCost: number;
  totalValuationAtRetail: number;
  productCount: number;
  variantCount: number;
}

// Interface para analytics por subcategoría
export interface SubcategoryStockAnalyticsDto {
  subcategoryId: string;
  subcategoryName: string;
  totalStock: number;
  totalValuationAtCost: number;
  totalValuationAtRetail: number;
  productCount: number;
  variantCount: number;
}

// Interface para analytics mixtas de categoría y subcategoría
// NOTA: Los productos con una sola categoría se agrupan bajo esa categoría específica.
// Los productos con múltiples categorías se agrupan bajo categoryId: "unisex", categoryName: "Unisex"
export interface CategorySubcategoryStockAnalyticsDto {
  categoryId: string; // ID de la categoría o "unisex" para productos con múltiples categorías
  categoryName: string; // Nombre de la categoría o "Unisex"
  subcategories: Array<{
    subcategoryId: string;
    subcategoryName: string;
    totalStock: number;
    totalValuationAtCost: number;
    totalValuationAtRetail: number;
    productCount: number;
    variantCount: number;
  }>;
  categoryTotals: {
    totalStock: number;
    totalValuationAtCost: number;
    totalValuationAtRetail: number;
    productCount: number;
    variantCount: number;
  };
}

// DTOs para respuestas de la API
export interface StockValuationResponseDto {
  status: string;
  data: StockAnalyticsMetricsDto & {
    meta: {
      generatedAt: string;
      dataSource: string;
    };
  };
}

export interface ProductStockAnalyticsResponseDto {
  status: string;
  data: ProductStockAnalyticsDto[];
}

export interface LowStockAlertsResponseDto {
  status: string;
  data: LowStockAlertDto[];
}

export interface CategoryStockAnalyticsResponseDto {
  status: string;
  data: CategoryStockAnalyticsDto[];
}

export interface SubcategoryStockAnalyticsResponseDto {
  status: string;
  data: SubcategoryStockAnalyticsDto[];
}

export interface CategorySubcategoryStockAnalyticsResponseDto {
  status: string;
  data: CategorySubcategoryStockAnalyticsDto[];
}

// ============================================================================
// STATE INTERFACES
// ============================================================================

// Tipos para el estado del slice
export interface AnalyticsState {
  orderAnalytics: {
    data: OrderAnalyticsResponseDto | null;
    loading: boolean;
    error: string | null;
  };
  userAnalytics: {
    data: UserAnalyticsResponseDto | null;
    loading: boolean;
    error: string | null;
  };
  usersAnalyticsList: {
    data: UsersAnalyticsListResponseDto | null;
    loading: boolean;
    error: string | null;
  };
  userDetailedAnalytics: {
    data: UserDetailedAnalyticsResponseDto | null;
    loading: boolean;
    error: string | null;
  };
  stockAnalytics: {
    valuation: StockAnalyticsMetricsDto | null;
    productAnalytics: ProductStockAnalyticsDto[] | null;
    lowStockAlerts: LowStockAlertDto[] | null;
    categoryAnalytics: CategoryStockAnalyticsDto[] | null;
    subcategoryAnalytics: SubcategoryStockAnalyticsDto[] | null;
    categorySubcategoryAnalytics: CategorySubcategoryStockAnalyticsDto[] | null;
    loading: {
      valuation: boolean;
      productAnalytics: boolean;
      lowStockAlerts: boolean;
      categoryAnalytics: boolean;
      subcategoryAnalytics: boolean;
      categorySubcategoryAnalytics: boolean;
    };
    error: {
      valuation: string | null;
      productAnalytics: string | null;
      lowStockAlerts: string | null;
      categoryAnalytics: string | null;
      subcategoryAnalytics: string | null;
      categorySubcategoryAnalytics: string | null;
    };
  };
}

// Tipo para filtros de la UI
export interface AnalyticsFilters {
  period: AnalyticsPeriod;
  granularity?: AnalyticsGranularity;
  compareWithPrevious: boolean;
  customRange?: {
    startDate: string;
    endDate: string;
  };
}