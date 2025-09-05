import { Request, Response } from 'express';
import { ExpenseService } from '@services/expense.service';
import { CreateExpenseRequestDto, MonthlyExpenseFilters, UpdateExpenseRequestDto } from '@dto/expense.dto';
import { Currency, ExpenseType } from '@interfaces/expense';
import { ApiResponse, ApiErrorResponse } from '../types/response';
import { AppError } from '@utils/AppError';
import { getSessionUserId } from '@utils/sessionUtils';
import logger from '@config/logger';
import { Types } from 'mongoose';

export class ExpenseController {
  private expenseService = new ExpenseService();

  public createManualExpense = async (req: Request, res: Response<ApiResponse | ApiErrorResponse>): Promise<void> => {
    try {
      const dto: CreateExpenseRequestDto = {
        description: req.body.description,
        amount: req.body.amount,
        currency: req.body.currency as Currency,
        reference: req.body.reference,
      };

      // Obtener el ID del usuario desde la sesión
      const userId = getSessionUserId(req.session);
      const createdBy = userId ? new Types.ObjectId(userId) : undefined;

      const result = await this.expenseService.createManualExpense(dto, createdBy);

      res.status(201).json({
        status: 'success',
        message: 'Gasto creado correctamente.',
        data: result,
      });
    } catch (error: unknown) {
      logger.error('Error creating manual expense:', { error, body: req.body });

      if (error instanceof AppError) {
        res.status(error.statusCode).json({
          status: error.status,
          message: error.message,
        });
      } else {
        res.status(500).json({
          status: 'error',
          message: 'Error interno del servidor al crear gasto.',
        });
      }
    }
  };

  public getMonthlyExpenses = async (req: Request, res: Response<ApiResponse | ApiErrorResponse>): Promise<void> => {
    try {
      const { year, month } = req.params;
      const { type, currency, limit = '50', offset = '0' } = req.query;

      const filters: MonthlyExpenseFilters = {
        year: parseInt(year),
        month: parseInt(month),
      };

      if (type && typeof type === 'string') {
        filters.type = type as ExpenseType;
      }

      if (currency && typeof currency === 'string') {
        filters.currency = currency as Currency;
      }

      const limitNum = parseInt(limit as string);
      const offsetNum = parseInt(offset as string);

      const result = await this.expenseService.getMonthlyExpenses(filters, limitNum, offsetNum);

      res.status(200).json({
        status: 'success',
        data: result,
      });
    } catch (error: unknown) {
      logger.error('Error getting monthly expenses:', {
        error,
        params: req.params,
        query: req.query,
      });

      if (error instanceof AppError) {
        res.status(error.statusCode).json({
          status: error.status,
          message: error.message,
        });
      } else {
        res.status(500).json({
          status: 'error',
          message: 'Error interno del servidor al obtener gastos.',
        });
      }
    }
  };

  public updateExpense = async (req: Request, res: Response<ApiResponse | ApiErrorResponse>): Promise<void> => {
    try {
      const { id } = req.params;
      const dto: UpdateExpenseRequestDto = {
        description: req.body.description,
        amount: req.body.amount,
        currency: req.body.currency as Currency,
        reference: req.body.reference,
      };

      const result = await this.expenseService.updateExpense(new Types.ObjectId(id), dto);

      res.status(200).json({
        status: 'success',
        message: 'Gasto actualizado correctamente.',
        data: result,
      });
    } catch (error: unknown) {
      logger.error('Error updating expense:', { error, params: req.params, body: req.body });

      if (error instanceof AppError) {
        res.status(error.statusCode).json({
          status: error.status,
          message: error.message,
        });
      } else {
        res.status(500).json({
          status: 'error',
          message: 'Error interno del servidor al actualizar gasto.',
        });
      }
    }
  };
}
