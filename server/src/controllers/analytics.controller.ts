import { Request, Response } from 'express';
import { ZodError } from 'zod';
import { OrderAnalyticsService } from '@services/order-analytics.service';
import { UserAnalyticsService } from '@services/user-analytics.service';
import { StockAnalyticsService } from '@services/stock-analytics.service';
import { AnalyticsSchema } from '../schemas/analytics.schema';
import { AnalyticsTimeZone } from '@enums/analytics.enum';
import { AppError } from '@utils/AppError';
import { ApiResponse } from '../types/response';

export class AnalyticsController {
  /**
   * Obtiene analytics de órdenes
   */
  public async getOrderAnalytics(req: Request, res: Response): Promise<void> {
    try {
      const validated = AnalyticsSchema.parse(req.query);

      const analyticsService = new OrderAnalyticsService();
      const result = await analyticsService.getOrderAnalytics(
        validated.period,
        validated.granularity,
        validated.timezone,
        validated.customRange,
        validated.compareWithPrevious,
      );

      // Agregar metadata útil para el cliente
      const analyticsData = {
        ...result,
        meta: {
          generatedAt: new Date().toISOString(),
          timezone: validated.timezone,
          dataSource: 'orders',
        },
      };

      const response: ApiResponse<typeof analyticsData> = {
        status: 'success',
        data: analyticsData,
      };

      res.json(response);
    } catch (error) {
      if (error instanceof ZodError) {
        const errorMessages = error.errors.map((err) => `${err.path.join('.')}: ${err.message}`).join(', ');
        throw new AppError(`Parámetros de analytics inválidos: ${errorMessages}`, 400, 'fail');
      }

      if (error instanceof Error && error.message.includes('inválido')) {
        throw new AppError(error.message, 400, 'fail');
      }

      throw error;
    }
  }

  /**
   * Obtiene lista paginada de usuarios con sus analytics de todo el tiempo
   */
  public async getUsersAnalyticsList(req: Request, res: Response): Promise<void> {
    try {
      const { limit = 20, cursor, direction = 'forward' } = req.query;

      const analyticsService = new UserAnalyticsService();
      const result = await analyticsService.getUsersAnalyticsList(
        Number(limit) || 20,
        cursor as string,
        direction as 'forward' | 'backward',
      );

      const response: ApiResponse<typeof result> = {
        status: 'success',
        data: result,
      };

      res.json(response);
    } catch (error) {
      if (error instanceof Error && error.message.includes('inválido')) {
        throw new AppError(error.message, 400, 'fail');
      }

      throw error;
    }
  }

  /**
   * Obtiene analytics detalladas de un usuario específico
   */
  public async getUserDetailedAnalytics(req: Request, res: Response): Promise<void> {
    try {
      const { userId } = req.params;
      const {
        period = 'last30Days',
        granularity,
        timezone = AnalyticsTimeZone.Argentina,
        compareWithPrevious = false,
      } = req.query;

      // Validar customRange si existe
      let customRange;
      if (req.query.startDate && req.query.endDate) {
        customRange = {
          startDate: req.query.startDate as string,
          endDate: req.query.endDate as string,
        };
      }

      const analyticsService = new UserAnalyticsService();
      const result = await analyticsService.getUserDetailedAnalytics(
        userId,
        period as string,
        granularity as string,
        timezone as AnalyticsTimeZone,
        customRange,
        compareWithPrevious === 'true',
      );

      const response: ApiResponse<typeof result> = {
        status: 'success',
        data: result,
      };

      res.json(response);
    } catch (error) {
      if (error instanceof Error && (error.message.includes('inválido') || error.message.includes('no encontrado'))) {
        throw new AppError(error.message, 400, 'fail');
      }

      throw error;
    }
  }

  /**
   * Obtiene métricas totales de valuación de stock
   */
  public async getStockValuation(_req: Request, res: Response): Promise<void> {
    try {
      const stockAnalyticsService = new StockAnalyticsService();
      const result = await stockAnalyticsService.getTotalStockValuation();

      const analyticsData = {
        ...result,
        meta: {
          generatedAt: new Date().toISOString(),
          dataSource: 'stock',
        },
      };

      const response: ApiResponse<typeof analyticsData> = {
        status: 'success',
        data: analyticsData,
      };

      res.json(response);
    } catch (error) {
      if (error instanceof Error && error.message.includes('inválido')) {
        throw new AppError(error.message, 400, 'fail');
      }

      throw error;
    }
  }

  /**
   * Obtiene analytics de stock agrupado por producto
   */
  public async getStockAnalyticsByProduct(req: Request, res: Response): Promise<void> {
    try {
      const { limit = 50, offset = 0 } = req.query;

      const stockAnalyticsService = new StockAnalyticsService();
      const result = await stockAnalyticsService.getStockAnalyticsByProduct(Number(limit) || 50, Number(offset) || 0);

      const response: ApiResponse<typeof result> = {
        status: 'success',
        data: result,
      };

      res.json(response);
    } catch (error) {
      if (error instanceof Error && error.message.includes('inválido')) {
        throw new AppError(error.message, 400, 'fail');
      }

      throw error;
    }
  }

  /**
   * Obtiene alertas de stock bajo
   */
  public async getLowStockAlerts(req: Request, res: Response): Promise<void> {
    try {
      const { threshold = 10, limit = 20 } = req.query;

      const stockAnalyticsService = new StockAnalyticsService();
      const result = await stockAnalyticsService.getLowStockAlerts(Number(threshold) || 10, Number(limit) || 20);

      const response: ApiResponse<typeof result> = {
        status: 'success',
        data: result,
      };

      res.json(response);
    } catch (error) {
      if (error instanceof Error && error.message.includes('inválido')) {
        throw new AppError(error.message, 400, 'fail');
      }

      throw error;
    }
  }

  /**
   * Obtiene analytics de stock agrupado por categoría
   */
  public async getStockAnalyticsByCategory(_req: Request, res: Response): Promise<void> {
    try {
      const stockAnalyticsService = new StockAnalyticsService();
      const result = await stockAnalyticsService.getStockAnalyticsByCategory();

      const response: ApiResponse<typeof result> = {
        status: 'success',
        data: result,
      };

      res.json(response);
    } catch (error) {
      if (error instanceof Error && error.message.includes('inválido')) {
        throw new AppError(error.message, 400, 'fail');
      }

      throw error;
    }
  }

  /**
   * Obtiene analytics de stock agrupado por subcategoría
   */
  public async getStockAnalyticsBySubcategory(_req: Request, res: Response): Promise<void> {
    try {
      const stockAnalyticsService = new StockAnalyticsService();
      const result = await stockAnalyticsService.getStockAnalyticsBySubcategory();

      const response: ApiResponse<typeof result> = {
        status: 'success',
        data: result,
      };

      res.json(response);
    } catch (error) {
      if (error instanceof Error && error.message.includes('inválido')) {
        throw new AppError(error.message, 400, 'fail');
      }

      throw error;
    }
  }

  /**
   * Obtiene analytics de stock con vista jerárquica: categorías con sus subcategorías
   */
  public async getStockAnalyticsByCategoryWithSubcategories(_req: Request, res: Response): Promise<void> {
    try {
      const stockAnalyticsService = new StockAnalyticsService();
      const result = await stockAnalyticsService.getStockAnalyticsByCategoryWithSubcategories();

      const response: ApiResponse<typeof result> = {
        status: 'success',
        data: result,
      };

      res.json(response);
    } catch (error) {
      if (error instanceof Error && error.message.includes('inválido')) {
        throw new AppError(error.message, 400, 'fail');
      }

      throw error;
    }
  }
}
