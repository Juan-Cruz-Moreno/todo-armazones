import { AnalyticsPeriod, AnalyticsTimeZone } from '@enums/analytics.enum';
import { IAnalyticsDateRange } from '@interfaces/analytics';
import {
  startOfDay,
  endOfDay,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  startOfYear,
  endOfYear,
} from 'date-fns';
import { toZonedTime, fromZonedTime } from 'date-fns-tz';
import { addDays, addWeeks, addMonths, addYears } from 'date-fns';

export class AnalyticsDateHelper {
  /**
   * Convierte una fecha de zona horaria específica a UTC para consultas de BD
   */
  static toUTC(date: Date, timezone: AnalyticsTimeZone): Date {
    return fromZonedTime(date, timezone);
  }

  /**
   * Convierte una fecha UTC a zona horaria específica
   */
  static fromUTC(date: Date, timezone: AnalyticsTimeZone): Date {
    return toZonedTime(date, timezone);
  }

  /**
   * Obtiene el rango de fechas para un período específico en la zona horaria dada
   */
  static getDateRange(
    period: AnalyticsPeriod,
    timezone: AnalyticsTimeZone,
    customRange?: { startDate: string; endDate: string },
  ): IAnalyticsDateRange {
    const now = toZonedTime(new Date(), timezone);

    switch (period) {
      case AnalyticsPeriod.Today: {
        const start = startOfDay(now);
        const end = endOfDay(now);
        return {
          startDate: fromZonedTime(start, timezone),
          endDate: fromZonedTime(end, timezone),
        };
      }

      case AnalyticsPeriod.ThisWeek: {
        const start = startOfWeek(now, { weekStartsOn: 1 }); // Lunes
        const end = endOfWeek(now, { weekStartsOn: 1 }); // Domingo
        return {
          startDate: fromZonedTime(start, timezone),
          endDate: fromZonedTime(end, timezone),
        };
      }

      case AnalyticsPeriod.ThisMonth: {
        const start = startOfMonth(now);
        const end = endOfMonth(now);
        return {
          startDate: fromZonedTime(start, timezone),
          endDate: fromZonedTime(end, timezone),
        };
      }

      case AnalyticsPeriod.ThisYear: {
        const start = startOfYear(now);
        const end = endOfYear(now);
        return {
          startDate: fromZonedTime(start, timezone),
          endDate: fromZonedTime(end, timezone),
        };
      }

      case AnalyticsPeriod.AllTime: {
        // Para "todos los tiempos", usar un rango muy amplio
        // Desde el año 2020 hasta el final del año actual
        const start = new Date(2020, 0, 1); // 1 enero 2020
        const end = endOfYear(now);
        return {
          startDate: fromZonedTime(start, timezone),
          endDate: fromZonedTime(end, timezone),
        };
      }

      case AnalyticsPeriod.Custom: {
        if (!customRange) {
          throw new Error('Custom range is required for Custom period');
        }
        if (!customRange.startDate || !customRange.endDate) {
          throw new Error('startDate and endDate are required for Custom period');
        }

        // Validar que las fechas sean válidas
        const startDate = new Date(customRange.startDate);
        const endDate = new Date(customRange.endDate);

        if (isNaN(startDate.getTime())) {
          throw new Error(`Invalid startDate: ${customRange.startDate}`);
        }
        if (isNaN(endDate.getTime())) {
          throw new Error(`Invalid endDate: ${customRange.endDate}`);
        }
        if (startDate > endDate) {
          throw new Error('startDate must be before or equal to endDate');
        }

        const startZoned = startOfDay(toZonedTime(startDate, timezone));
        const endZoned = endOfDay(toZonedTime(endDate, timezone));
        return {
          startDate: fromZonedTime(startZoned, timezone),
          endDate: fromZonedTime(endZoned, timezone),
        };
      }

      default:
        throw new Error(`Unsupported period: ${period}`);
    }
  }

  /**
   * Obtiene el rango de fechas del período anterior para comparación
   */
  static getPreviousDateRange(
    period: AnalyticsPeriod,
    currentRange: IAnalyticsDateRange,
    timezone: AnalyticsTimeZone,
  ): IAnalyticsDateRange {
    const currentStart = toZonedTime(currentRange.startDate, timezone);
    const currentEnd = toZonedTime(currentRange.endDate, timezone);

    switch (period) {
      case AnalyticsPeriod.Today: {
        const prevStart = addDays(currentStart, -1);
        const prevEnd = addDays(currentEnd, -1);
        return {
          startDate: fromZonedTime(prevStart, timezone),
          endDate: fromZonedTime(prevEnd, timezone),
        };
      }

      case AnalyticsPeriod.ThisWeek: {
        const prevStart = addWeeks(currentStart, -1);
        const prevEnd = addWeeks(currentEnd, -1);
        return {
          startDate: fromZonedTime(prevStart, timezone),
          endDate: fromZonedTime(prevEnd, timezone),
        };
      }

      case AnalyticsPeriod.ThisMonth: {
        const prevStart = addMonths(currentStart, -1);
        const prevEnd = addMonths(currentEnd, -1);
        return {
          startDate: fromZonedTime(prevStart, timezone),
          endDate: fromZonedTime(prevEnd, timezone),
        };
      }

      case AnalyticsPeriod.ThisYear: {
        const prevStart = addYears(currentStart, -1);
        const prevEnd = addYears(currentEnd, -1);
        return {
          startDate: fromZonedTime(prevStart, timezone),
          endDate: fromZonedTime(prevEnd, timezone),
        };
      }

      case AnalyticsPeriod.AllTime: {
        // Para "todos los tiempos", el período anterior sería la mitad anterior del tiempo total
        const totalDuration = currentEnd.getTime() - currentStart.getTime();
        const halfDuration = totalDuration / 2;
        const prevEnd = new Date(currentStart.getTime() + halfDuration);
        const prevStart = currentStart;
        return {
          startDate: fromZonedTime(prevStart, timezone),
          endDate: fromZonedTime(prevEnd, timezone),
        };
      }

      case AnalyticsPeriod.Custom: {
        const diff = currentEnd.getTime() - currentStart.getTime();
        const prevEnd = new Date(currentStart.getTime() - 1);
        const prevStart = new Date(prevEnd.getTime() - diff);
        return {
          startDate: fromZonedTime(prevStart, timezone),
          endDate: fromZonedTime(prevEnd, timezone),
        };
      }

      default:
        throw new Error(`Unsupported period: ${period}`);
    }
  }

  /**
   * Calcula el número de días en un rango de fechas
   */
  static calculateDaysInRange(startDate: Date, endDate: Date): number {
    const diffTime = endDate.getTime() - startDate.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  /**
   * Calcula el cambio porcentual entre dos valores
   */
  static calculatePercentageChange(current: number, previous: number): number {
    if (previous === 0) {
      return current > 0 ? 100 : 0;
    }
    return ((current - previous) / previous) * 100;
  }
}
