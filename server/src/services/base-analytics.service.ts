import {
  IAnalyticsDateRange,
  IAnalyticsQuery,
  IAnalyticsResult,
  IAnalyticsMetrics,
  IAnalyticsBreakdownPoint,
} from '@interfaces/analytics';
import { AnalyticsGranularity, AnalyticsTimeZone } from '@enums/analytics.enum';
import { AnalyticsDateHelper } from '@helpers/analytics.helper';

/**
 * Servicio base abstracto para analytics
 * Proporciona funcionalidad común reutilizable para diferentes tipos de analytics
 */
export abstract class BaseAnalyticsService<T extends IAnalyticsMetrics> {
  protected readonly timezone: AnalyticsTimeZone;

  constructor(timezone: AnalyticsTimeZone = AnalyticsTimeZone.Argentina) {
    this.timezone = timezone;
  }

  /**
   * Método principal para obtener analytics
   */
  public async getAnalytics(query: IAnalyticsQuery): Promise<IAnalyticsResult<T>> {
    // Obtener rango de fechas principal
    const currentRange = AnalyticsDateHelper.getDateRange(query.period, query.timezone, query.customRange);

    // Obtener métricas del período actual
    const currentTotal = await this.calculateTotalMetrics(currentRange);

    // Preparar respuesta base
    const result: IAnalyticsResult<T> = {
      period: {
        type: query.period,
        range: currentRange,
        ...(query.granularity && { granularity: query.granularity }),
      },
      current: {
        total: currentTotal,
      },
    };

    // Agregar breakdown si se especifica granularidad
    if (query.granularity) {
      result.current.breakdown = await this.calculateBreakdown(currentRange, query.granularity, query.timezone);
    }

    // Agregar comparación con período anterior si se solicita
    if (query.compareWithPrevious) {
      const previousRange = AnalyticsDateHelper.getPreviousDateRange(query.period, currentRange, query.timezone);

      const previousTotal = await this.calculateTotalMetrics(previousRange);
      const comparison = this.calculateComparison(currentTotal, previousTotal);

      result.previous = {
        total: previousTotal,
        comparison,
      };
    }

    return result;
  }

  /**
   * Método abstracto para calcular breakdown temporal
   * Cada servicio debe implementar su propia versión optimizada usando agregación de MongoDB
   */
  protected abstract calculateBreakdown(
    dateRange: IAnalyticsDateRange,
    granularity: AnalyticsGranularity,
    timezone: AnalyticsTimeZone,
  ): Promise<IAnalyticsBreakdownPoint<T>[]>;

  /**
   * Calcula el cambio porcentual entre métricas actuales y anteriores
   */
  protected calculateComparison(current: T, previous: T): { [K in keyof T]: number } {
    const comparison = {} as { [K in keyof T]: number };

    for (const key in current) {
      if (Object.prototype.hasOwnProperty.call(current, key)) {
        const currentValue = current[key];
        const previousValue = previous[key];
        comparison[key] = AnalyticsDateHelper.calculatePercentageChange(currentValue, previousValue);
      }
    }

    return comparison;
  }

  /**
   * Método abstracto que debe implementar cada servicio específico
   * para calcular las métricas totales de un período
   */
  protected abstract calculateTotalMetrics(dateRange: IAnalyticsDateRange): Promise<T>;

  /**
   * Método helper para calcular promedios diarios
   */
  protected calculateDailyAverages(total: number, dateRange: IAnalyticsDateRange): number {
    const days = AnalyticsDateHelper.calculateDaysInRange(dateRange.startDate, dateRange.endDate);
    return days > 0 ? total / days : 0;
  }

  /**
   * Método helper para redondear números a 2 decimales
   */
  protected roundToTwoDecimals(value: number): number {
    return Math.round(value * 100) / 100;
  }
}
