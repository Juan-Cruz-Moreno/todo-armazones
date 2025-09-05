import { z } from 'zod';
import { AnalyticsGranularity, AnalyticsPeriod, AnalyticsTimeZone } from '@enums/analytics.enum';

export const AnalyticsSchema = z
  .object({
    period: z.nativeEnum(AnalyticsPeriod),
    granularity: z.nativeEnum(AnalyticsGranularity).optional(),
    timezone: z.nativeEnum(AnalyticsTimeZone).default(AnalyticsTimeZone.Argentina),
    startDate: z.string().optional(),
    endDate: z.string().optional(),
    compareWithPrevious: z
      .string()
      .optional()
      .transform((val) => val === 'true'),
  })
  .refine(
    (data) => {
      if (data.period === AnalyticsPeriod.Custom) {
        if (!data.startDate || !data.endDate) {
          return false;
        }
        // Validar que las fechas sean válidas
        const startDate = new Date(data.startDate);
        const endDate = new Date(data.endDate);
        if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
          return false;
        }
        // Validar que startDate sea anterior o igual a endDate
        if (startDate > endDate) {
          return false;
        }
      }
      return true;
    },
    {
      message:
        'Para período custom: startDate y endDate son requeridos, deben ser fechas válidas y startDate debe ser anterior o igual a endDate',
    },
  )
  .transform((data) => ({
    period: data.period,
    granularity: data.granularity,
    timezone: data.timezone,
    compareWithPrevious: data.compareWithPrevious,
    customRange:
      data.period === AnalyticsPeriod.Custom && data.startDate && data.endDate
        ? {
            startDate: data.startDate,
            endDate: data.endDate,
          }
        : undefined,
  }));

// Schema opcional para rutas que no requieren período (como all-time)
export const AnalyticsSchemaOptionalPeriod = z
  .object({
    period: z.nativeEnum(AnalyticsPeriod).optional(),
    granularity: z.nativeEnum(AnalyticsGranularity).optional(),
    timezone: z.nativeEnum(AnalyticsTimeZone).default(AnalyticsTimeZone.Argentina),
    startDate: z.string().optional(),
    endDate: z.string().optional(),
    compareWithPrevious: z
      .string()
      .optional()
      .transform((val) => val === 'true'),
  })
  .refine(
    (data) => {
      if (data.period === AnalyticsPeriod.Custom) {
        if (!data.startDate || !data.endDate) {
          return false;
        }
        // Validar que las fechas sean válidas
        const startDate = new Date(data.startDate);
        const endDate = new Date(data.endDate);
        if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
          return false;
        }
        // Validar que startDate sea anterior o igual a endDate
        if (startDate > endDate) {
          return false;
        }
      }
      return true;
    },
    {
      message:
        'Para período custom: startDate y endDate son requeridos, deben ser fechas válidas y startDate debe ser anterior o igual a endDate',
    },
  )
  .transform((data) => ({
    period: data.period || AnalyticsPeriod.AllTime, // Default a AllTime si no se especifica
    granularity: data.granularity,
    timezone: data.timezone,
    compareWithPrevious: data.compareWithPrevious,
    customRange:
      data.period === AnalyticsPeriod.Custom && data.startDate && data.endDate
        ? {
            startDate: data.startDate,
            endDate: data.endDate,
          }
        : undefined,
  }));

export type AnalyticsParams = z.infer<typeof AnalyticsSchema>;
export type AnalyticsParamsOptional = z.infer<typeof AnalyticsSchemaOptionalPeriod>;
