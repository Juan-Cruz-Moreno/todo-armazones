// Tipos de utilidad para el sistema de analytics

// Tipo para mapear enums a sus valores de string
export type EnumValues<T> = T[keyof T];

// Tipo para hacer todas las propiedades opcionales excepto las especificadas
export type PartialExcept<T, K extends keyof T> = Partial<T> & Pick<T, K>;

// Tipo para métricas de comparación con cambio porcentual
export type MetricsComparison<T> = {
  [K in keyof T]: {
    current: T[K];
    previous: T[K];
    change: number; // Porcentaje de cambio
  };
};

// Tipo para resultado de agregación de MongoDB con tipado genérico
export type AggregationResult<T = Record<string, unknown>> = {
  _id: T;
  [key: string]: unknown;
};

// Tipos específicos para analytics
export type AnalyticsAggregationPipeline = Record<string, unknown>[];

export type AnalyticsFilterOptions = {
  startDate: Date;
  endDate: Date;
  excludeStatuses?: string[];
  includeStatuses?: string[];
};
