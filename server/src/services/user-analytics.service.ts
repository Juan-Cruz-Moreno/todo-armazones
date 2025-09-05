import { BaseAnalyticsService } from './base-analytics.service';
import {
  IAnalyticsDateRange,
  IAnalyticsBreakdownPoint,
  IUserAnalyticsMetrics,
  IUserAggregationResult,
  IUserBreakdownAggregationResult,
} from '@interfaces/analytics';
import {
  UserAnalyticsResponseDto,
  UserAnalyticsMetricsDto,
  UserAnalyticsBreakdownPointDto,
  UserAnalyticsComparisonDto,
  UserAnalyticsPreviousDto,
  UserAnalyticsCurrentDto,
  AnalyticsPeriodDto,
  UserInfoDto,
  IndividualUserAnalyticsDto,
  UsersAnalyticsListResponseDto,
  UserDetailedAnalyticsResponseDto,
  PaginationInfoDto,
} from '@dto/analytics.dto';
import { AnalyticsGranularity, AnalyticsPeriod, AnalyticsTimeZone } from '@enums/analytics.enum';
import Order from '@models/Order';
import User from '@models/User';
import { OrderStatus } from '@enums/order.enum';
import { PipelineStage, Types } from 'mongoose';
import { format, parseISO } from 'date-fns';
import { toZonedTime } from 'date-fns-tz';

// Interface para el usuario lean (sin métodos de mongoose)
interface IUserLean {
  _id: Types.ObjectId;
  email: string;
  displayName: string;
  firstName?: string;
  lastName?: string;
  role: string;
  status: string;
  createdAt: Date;
  lastLogin?: Date;
}

// Interface para el query de paginación de usuarios
interface IUserPaginationQuery {
  createdAt?: {
    $gt?: Date;
    $lt?: Date;
  };
}

/**
 * Servicio específico para analytics de usuarios
 * Extiende BaseAnalyticsService para reutilizar funcionalidad común
 */
export class UserAnalyticsService extends BaseAnalyticsService<IUserAnalyticsMetrics> {
  constructor(timezone: AnalyticsTimeZone = AnalyticsTimeZone.Argentina) {
    super(timezone);
  }

  private userId?: string | undefined; // ID de usuario específico para filtrar

  /**
   * Setter para configurar un usuario específico
   */
  public setUserId(userId: string): void {
    this.userId = userId;
  }

  /**
   * Getter para limpiar el filtro de usuario
   */
  public clearUserId(): void {
    this.userId = undefined;
  }

  /**
   * Implementación específica para calcular métricas totales de usuarios
   * Usa campos pre-calculados del modelo Order para optimización de rendimiento
   */
  protected async calculateTotalMetrics(dateRange: IAnalyticsDateRange): Promise<IUserAnalyticsMetrics> {
    const matchStage: Record<string, unknown> = {
      createdAt: {
        $gte: dateRange.startDate,
        $lte: dateRange.endDate,
      },
      orderStatus: { $nin: [OrderStatus.Cancelled, OrderStatus.Refunded] },
    };

    // Si hay un userId específico, agregarlo al filtro
    if (this.userId) {
      matchStage.user = new Types.ObjectId(this.userId);
    }

    const pipeline: PipelineStage[] = [
      {
        $match: matchStage,
      },
    ];

    // Si es para un usuario específico, simplificar la agregación
    if (this.userId) {
      pipeline.push({
        $group: {
          _id: null,
          totalOrders: { $sum: 1 },
          totalRevenue: { $sum: '$totalAmount' }, // Campo pre-calculado
        },
      });
    } else {
      // Agregación para todos los usuarios usando campos pre-calculados
      pipeline.push(
        {
          $group: {
            _id: '$user', // Agrupa por usuario
            totalOrders: { $sum: 1 },
            totalRevenue: { $sum: '$totalAmount' }, // Campo pre-calculado
          },
        },
        {
          $group: {
            _id: null,
            uniqueUsers: { $sum: 1 }, // Cuenta usuarios únicos
            totalOrders: { $sum: '$totalOrders' },
            totalRevenue: { $sum: '$totalRevenue' }, // Ya está pre-calculado por usuario
          },
        },
      );
    }

    const results = await Order.aggregate<IUserAggregationResult>(pipeline);
    const data = results[0];

    if (!data) {
      return this.createEmptyMetrics();
    }

    const totalOrders = data.totalOrders || 0;
    const totalRevenue = this.roundToTwoDecimals(data.totalRevenue || 0);
    const averageOrderValue = totalOrders > 0 ? this.roundToTwoDecimals(totalRevenue / totalOrders) : 0;

    return {
      totalOrders,
      totalRevenue,
      averageOrderValue,
    };
  }

  /**
   * Crea métricas vacías para cuando no hay datos
   */
  private createEmptyMetrics(): IUserAnalyticsMetrics {
    return {
      totalOrders: 0,
      totalRevenue: 0,
      averageOrderValue: 0,
    };
  }

  /**
   * Método optimizado para calcular breakdown temporal con una sola consulta de agregación
   * Usa campos pre-calculados del modelo Order para máxima eficiencia
   */
  protected async calculateBreakdown(
    dateRange: IAnalyticsDateRange,
    granularity: AnalyticsGranularity,
    timezone: AnalyticsTimeZone,
  ): Promise<IAnalyticsBreakdownPoint<IUserAnalyticsMetrics>[]> {
    // Determinar el formato de fecha según la granularidad
    const dateFormat = this.getDateFormatForGranularity(granularity);

    const matchStage: Record<string, unknown> = {
      createdAt: {
        $gte: dateRange.startDate,
        $lte: dateRange.endDate,
      },
      orderStatus: { $nin: [OrderStatus.Cancelled, OrderStatus.Refunded] },
    };

    // Si hay un userId específico, agregarlo al filtro
    if (this.userId) {
      matchStage.user = new Types.ObjectId(this.userId);
    }

    const pipeline: PipelineStage[] = [
      {
        $match: matchStage,
      },
      {
        $addFields: {
          // Convertir a timezone de Argentina para agrupación
          localDate: {
            $dateToString: {
              date: '$createdAt',
              format: dateFormat,
              timezone: timezone,
            },
          },
        },
      },
      {
        $group: {
          _id: '$localDate',
          totalOrders: { $sum: 1 },
          totalRevenue: { $sum: '$totalAmount' }, // Campo pre-calculado del modelo Order
          // Solo agregar uniqueUsers si no estamos filtrando por usuario específico
          ...(this.userId ? {} : { uniqueUsers: { $addToSet: '$user' } }), // Usuarios únicos en este período
        },
      },
    ];

    // Solo agregar el campo uniqueUserCount si no estamos filtrando por usuario específico
    if (!this.userId) {
      pipeline.push({
        $addFields: {
          uniqueUserCount: { $size: '$uniqueUsers' },
        },
      });
    }

    pipeline.push({
      $sort: { _id: 1 },
    });

    const results = await Order.aggregate<IUserBreakdownAggregationResult & { uniqueUserCount?: number }>(pipeline);

    return results.map((result) => {
      const timestamp = this.parseTimestampFromGroupId(result._id, granularity);
      const label = this.generateLabelFromTimestamp(timestamp, granularity);

      const totalOrders = result.totalOrders || 0;
      const totalRevenue = this.roundToTwoDecimals(result.totalRevenue || 0);
      const averageOrderValue = totalOrders > 0 ? this.roundToTwoDecimals(totalRevenue / totalOrders) : 0;

      const metrics: IUserAnalyticsMetrics = {
        totalOrders,
        totalRevenue,
        averageOrderValue,
      };

      return {
        timestamp,
        label,
        metrics,
      };
    });
  }

  /**
   * Obtiene el formato de fecha para MongoDB según la granularidad
   */
  private getDateFormatForGranularity(granularity: AnalyticsGranularity): string {
    switch (granularity) {
      case AnalyticsGranularity.Hour:
        return '%Y-%m-%d-%H'; // "2025-08-07-14"
      case AnalyticsGranularity.Day:
        return '%Y-%m-%d'; // "2025-08-07"
      case AnalyticsGranularity.Week:
        return '%Y-W%U'; // "2025-W32"
      case AnalyticsGranularity.Month:
        return '%Y-%m'; // "2025-08"
      default:
        return '%Y-%m-%d';
    }
  }

  /**
   * Convierte el _id agrupado de vuelta a timestamp en timezone de Argentina
   */
  private parseTimestampFromGroupId(groupId: string, granularity: AnalyticsGranularity): Date {
    switch (granularity) {
      case AnalyticsGranularity.Hour: {
        // "2025-08-07-14" -> "2025-08-07T14:00:00"
        const [date, hour] = groupId.split('-').slice(0, 4).join('-').split('-');
        const dateStr = `${date}-${groupId.split('-')[1]}-${groupId.split('-')[2]}T${hour}:00:00`;
        return toZonedTime(parseISO(dateStr), this.timezone);
      }
      case AnalyticsGranularity.Day: {
        // "2025-08-07" -> "2025-08-07T00:00:00"
        const dateStr = `${groupId}T00:00:00`;
        return toZonedTime(parseISO(dateStr), this.timezone);
      }
      case AnalyticsGranularity.Week: {
        // "2025-W32" -> primer día de esa semana
        const [year, week] = groupId.split('-W');
        const weekNum = parseInt(week);
        const firstDayOfYear = new Date(parseInt(year), 0, 1);
        const firstMonday = new Date(firstDayOfYear);
        firstMonday.setDate(firstDayOfYear.getDate() + ((1 - firstDayOfYear.getDay() + 7) % 7));
        firstMonday.setDate(firstMonday.getDate() + (weekNum - 1) * 7);
        return toZonedTime(firstMonday, this.timezone);
      }
      case AnalyticsGranularity.Month: {
        // "2025-08" -> "2025-08-01T00:00:00"
        const dateStr = `${groupId}-01T00:00:00`;
        return toZonedTime(parseISO(dateStr), this.timezone);
      }
      default:
        return toZonedTime(parseISO(`${groupId}T00:00:00`), this.timezone);
    }
  }

  /**
   * Genera label legible para el timestamp en timezone de Argentina
   */
  private generateLabelFromTimestamp(timestamp: Date, granularity: AnalyticsGranularity): string {
    const zonedTimestamp = toZonedTime(timestamp, this.timezone);

    switch (granularity) {
      case AnalyticsGranularity.Hour:
        return format(zonedTimestamp, 'dd/MM HH:mm');
      case AnalyticsGranularity.Day:
        return format(zonedTimestamp, 'dd/MM/yyyy');
      case AnalyticsGranularity.Week:
        return format(zonedTimestamp, "'Semana del' dd/MM");
      case AnalyticsGranularity.Month:
        return format(zonedTimestamp, 'MMM yyyy');
      default:
        return format(zonedTimestamp, 'dd/MM/yyyy');
    }
  }

  /**
   * Mapea IUserAnalyticsMetrics a UserAnalyticsMetricsDto
   */
  private mapMetricsToDto(metrics: IUserAnalyticsMetrics): UserAnalyticsMetricsDto {
    return {
      totalOrders: metrics.totalOrders,
      totalRevenue: metrics.totalRevenue,
      averageOrderValue: metrics.averageOrderValue,
    };
  }

  /**
   * Mapea comparación a UserAnalyticsComparisonDto
   */
  private mapComparisonToDto(comparison: { [K in keyof IUserAnalyticsMetrics]: number }): UserAnalyticsComparisonDto {
    return {
      totalOrdersChange: comparison.totalOrders,
      totalRevenueChange: comparison.totalRevenue,
      averageOrderValueChange: comparison.averageOrderValue,
    };
  }

  /**
   * Mapea breakdown point a DTO
   */
  private mapBreakdownPointToDto(
    point: IAnalyticsBreakdownPoint<IUserAnalyticsMetrics>,
  ): UserAnalyticsBreakdownPointDto {
    return {
      timestamp: point.timestamp.toISOString(),
      label: point.label,
      metrics: this.mapMetricsToDto(point.metrics),
    };
  }

  /**
   * Mapea período a DTO
   */
  private mapPeriodToDto(period: {
    type: AnalyticsPeriod;
    range: IAnalyticsDateRange;
    granularity?: AnalyticsGranularity;
  }): AnalyticsPeriodDto {
    return {
      type: period.type,
      range: {
        startDate: period.range.startDate.toISOString(),
        endDate: period.range.endDate.toISOString(),
      },
      ...(period.granularity && { granularity: period.granularity }),
    };
  }

  /**
   * Mapea current data a DTO
   */
  private mapCurrentToDto(current: {
    total: IUserAnalyticsMetrics;
    breakdown?: IAnalyticsBreakdownPoint<IUserAnalyticsMetrics>[];
  }): UserAnalyticsCurrentDto {
    return {
      total: this.mapMetricsToDto(current.total),
      ...(current.breakdown && {
        breakdown: current.breakdown.map((point) => this.mapBreakdownPointToDto(point)),
      }),
    };
  }

  /**
   * Mapea previous data a DTO
   */
  private mapPreviousToDto(previous: {
    total: IUserAnalyticsMetrics;
    comparison: { [K in keyof IUserAnalyticsMetrics]: number };
  }): UserAnalyticsPreviousDto {
    return {
      total: this.mapMetricsToDto(previous.total),
      comparison: this.mapComparisonToDto(previous.comparison),
    };
  }

  /**
   * Mapea resultado completo a ResponseDto
   */
  public mapToResponseDto(result: {
    period: {
      type: AnalyticsPeriod;
      range: IAnalyticsDateRange;
      granularity?: AnalyticsGranularity;
    };
    current: {
      total: IUserAnalyticsMetrics;
      breakdown?: IAnalyticsBreakdownPoint<IUserAnalyticsMetrics>[];
    };
    previous?: {
      total: IUserAnalyticsMetrics;
      comparison: { [K in keyof IUserAnalyticsMetrics]: number };
    };
  }): UserAnalyticsResponseDto {
    return {
      period: this.mapPeriodToDto(result.period),
      current: this.mapCurrentToDto(result.current),
      ...(result.previous && { previous: this.mapPreviousToDto(result.previous) }),
    };
  }

  /**
   * Método público para obtener analytics de usuarios
   * (wrapper que utiliza el método base getAnalytics)
   */
  public async getUserAnalytics(
    period: string,
    granularity?: string,
    timezone: AnalyticsTimeZone = AnalyticsTimeZone.Argentina,
    customRange?: { startDate: string; endDate: string },
    compareWithPrevious: boolean = false,
  ): Promise<UserAnalyticsResponseDto> {
    // Validar y convertir enums
    if (!Object.values(AnalyticsPeriod).includes(period as AnalyticsPeriod)) {
      throw new Error(`Período inválido: ${period}`);
    }

    if (granularity && !Object.values(AnalyticsGranularity).includes(granularity as AnalyticsGranularity)) {
      throw new Error(`Granularidad inválida: ${granularity}`);
    }

    // Crear query de analytics
    const query = {
      period: period as AnalyticsPeriod,
      timezone,
      compareWithPrevious,
      ...(granularity && { granularity: granularity as AnalyticsGranularity }),
      ...(customRange && { customRange }),
    };

    // Obtener analytics usando el método base
    const result = await this.getAnalytics(query);

    // Mapear a DTO y retornar
    return this.mapToResponseDto(result);
  }

  /**
   * Método público para obtener analytics de un usuario específico por ID
   */
  public async getUserAnalyticsByUserId(
    userId: string,
    period: string,
    granularity?: string,
    timezone: AnalyticsTimeZone = AnalyticsTimeZone.Argentina,
    customRange?: { startDate: string; endDate: string },
    compareWithPrevious: boolean = false,
  ): Promise<UserAnalyticsResponseDto> {
    // Validar que el userId sea un ObjectId válido
    if (!Types.ObjectId.isValid(userId)) {
      throw new Error(`ID de usuario inválido: ${userId}`);
    }

    // Configurar el filtro por usuario
    this.setUserId(userId);

    try {
      // Reutilizar el método existente
      const result = await this.getUserAnalytics(period, granularity, timezone, customRange, compareWithPrevious);

      return result;
    } finally {
      // Limpiar el filtro al finalizar (para no afectar futuras consultas)
      this.clearUserId();
    }
  }

  /**
   * Método público para obtener analytics de todos los tiempos (sin período específico)
   */
  public async getAllTimeAnalytics(
    granularity?: string,
    timezone: AnalyticsTimeZone = AnalyticsTimeZone.Argentina,
    compareWithPrevious: boolean = false,
  ): Promise<UserAnalyticsResponseDto> {
    return this.getUserAnalytics(AnalyticsPeriod.AllTime, granularity, timezone, undefined, compareWithPrevious);
  }

  /**
   * Método público para obtener analytics de todos los tiempos de un usuario específico
   */
  public async getAllTimeAnalyticsByUserId(
    userId: string,
    granularity?: string,
    timezone: AnalyticsTimeZone = AnalyticsTimeZone.Argentina,
    compareWithPrevious: boolean = false,
  ): Promise<UserAnalyticsResponseDto> {
    // Validar que el userId sea un ObjectId válido
    if (!Types.ObjectId.isValid(userId)) {
      throw new Error(`ID de usuario inválido: ${userId}`);
    }

    // Configurar el filtro por usuario
    this.setUserId(userId);

    try {
      // Usar el método de todos los tiempos
      const result = await this.getAllTimeAnalytics(granularity, timezone, compareWithPrevious);

      return result;
    } finally {
      // Limpiar el filtro al finalizar
      this.clearUserId();
    }
  }

  // ============================================================================
  // MÉTODOS SIMPLIFICADOS PARA ANALYTICS INDIVIDUALES
  // ============================================================================

  /**
   * Obtiene lista paginada de usuarios con sus analytics de todo el tiempo
   */
  public async getUsersAnalyticsList(
    limit: number = 20,
    cursor?: string,
    direction: 'forward' | 'backward' = 'forward',
  ): Promise<UsersAnalyticsListResponseDto> {
    // Construir query para paginación con cursor
    const userQuery: IUserPaginationQuery = {};
    if (cursor) {
      const cursorDate = new Date(cursor);
      userQuery.createdAt = direction === 'forward' ? { $gt: cursorDate } : { $lt: cursorDate };
    }

    // Obtener usuarios con paginación
    const sortOrder = direction === 'forward' ? 1 : -1;
    const users = await User.find(userQuery)
      .sort({ createdAt: sortOrder })
      .limit(limit + 1) // +1 para saber si hay más páginas
      .lean();

    const hasMorePages = users.length > limit;
    if (hasMorePages) {
      users.pop(); // Remover el elemento extra
    }

    // Obtener analytics para cada usuario (todo el tiempo)
    const userIds = users.map((user) => user._id);
    const usersAnalytics = await this.getUsersAnalyticsBatch(userIds);

    // Combinar datos de usuario con analytics
    const usersWithAnalytics: IndividualUserAnalyticsDto[] = users.map((user) => {
      const analytics = usersAnalytics.get(user._id.toString()) || this.createEmptyMetrics();
      return {
        user: this.mapUserToDto(user),
        analytics: this.mapMetricsToDto(analytics),
      };
    });

    // Preparar información de paginación
    const pagination: PaginationInfoDto = {
      hasNextPage: direction === 'forward' ? hasMorePages : false,
      hasPreviousPage: direction === 'backward' ? hasMorePages : cursor !== undefined,
      ...(users.length > 0 && {
        startCursor: users[0].createdAt.toISOString(),
        endCursor: users[users.length - 1].createdAt.toISOString(),
      }),
    };

    return {
      period: this.mapPeriodToDto({
        type: AnalyticsPeriod.AllTime,
        range: this.getAllTimeRange(),
      }),
      users: usersWithAnalytics,
      pagination,
      meta: {
        generatedAt: new Date().toISOString(),
        timezone: AnalyticsTimeZone.Argentina,
        dataSource: 'users-list',
      },
    };
  }

  /**
   * Obtiene analytics detalladas de un usuario específico con breakdown
   */
  public async getUserDetailedAnalytics(
    userId: string,
    period: string,
    granularity?: string,
    timezone: AnalyticsTimeZone = AnalyticsTimeZone.Argentina,
    customRange?: { startDate: string; endDate: string },
    compareWithPrevious: boolean = false,
  ): Promise<UserDetailedAnalyticsResponseDto> {
    // Validar ObjectId
    if (!Types.ObjectId.isValid(userId)) {
      throw new Error(`ID de usuario inválido: ${userId}`);
    }

    // Validar y convertir enums
    if (!Object.values(AnalyticsPeriod).includes(period as AnalyticsPeriod)) {
      throw new Error(`Período inválido: ${period}`);
    }
    if (granularity && !Object.values(AnalyticsGranularity).includes(granularity as AnalyticsGranularity)) {
      throw new Error(`Granularidad inválida: ${granularity}`);
    }

    // Obtener información del usuario
    const user = await User.findById(userId).lean();
    if (!user) {
      throw new Error('Usuario no encontrado');
    }

    // Usar el servicio base para obtener analytics detalladas
    this.setUserId(userId);

    try {
      const analyticsQuery = {
        period: period as AnalyticsPeriod,
        ...(granularity && { granularity: granularity as AnalyticsGranularity }),
        timezone: timezone,
        ...(customRange && { customRange: customRange }),
        compareWithPrevious: compareWithPrevious,
      };

      const result = await this.getAnalytics(analyticsQuery);
      const mappedResult = this.mapToResponseDto(result);

      // Construir respuesta detallada
      const detailedResponse: UserDetailedAnalyticsResponseDto = {
        period: mappedResult.period,
        user: this.mapUserToDto(user),
        current: mappedResult.current,
        ...(mappedResult.previous && { previous: mappedResult.previous }),
        meta: {
          generatedAt: new Date().toISOString(),
          timezone: timezone,
          dataSource: 'user-detailed',
          userId: userId,
        },
      };

      return detailedResponse;
    } finally {
      this.clearUserId();
    }
  }

  // ============================================================================
  // MÉTODOS HELPER SIMPLIFICADOS
  // ============================================================================

  /**
   * Obtiene analytics de múltiples usuarios para todo el tiempo
   */
  private async getUsersAnalyticsBatch(userIds: Types.ObjectId[]): Promise<Map<string, IUserAnalyticsMetrics>> {
    const result = new Map();

    // Pipeline para métricas de todo el tiempo
    const pipeline: PipelineStage[] = [
      {
        $match: {
          user: { $in: userIds },
          orderStatus: { $nin: [OrderStatus.Cancelled, OrderStatus.Refunded] },
        },
      },
      {
        $group: {
          _id: '$user',
          totalOrders: { $sum: 1 },
          totalRevenue: { $sum: '$totalAmount' },
        },
      },
    ];

    const results = await Order.aggregate(pipeline);

    // Procesar resultados
    for (const userResult of results) {
      const userId = userResult._id.toString();
      const metrics: IUserAnalyticsMetrics = {
        totalOrders: userResult.totalOrders,
        totalRevenue: userResult.totalRevenue,
        averageOrderValue:
          userResult.totalOrders > 0 ? this.roundToTwoDecimals(userResult.totalRevenue / userResult.totalOrders) : 0,
      };

      result.set(userId, metrics);
    }

    return result;
  }

  /**
   * Obtiene el rango de fechas para "todo el tiempo"
   */
  private getAllTimeRange(): IAnalyticsDateRange {
    const start = new Date(2020, 0, 1); // 1 enero 2020
    const end = new Date(); // Ahora
    return {
      startDate: start,
      endDate: end,
    };
  }

  private mapUserToDto(user: IUserLean): UserInfoDto {
    return {
      id: user._id.toString(),
      email: user.email,
      displayName: user.displayName,
      ...(user.firstName && { firstName: user.firstName }),
      ...(user.lastName && { lastName: user.lastName }),
      role: user.role,
      status: user.status,
      createdAt: user.createdAt.toISOString(),
      ...(user.lastLogin && { lastLogin: user.lastLogin.toISOString() }),
    };
  }
}
