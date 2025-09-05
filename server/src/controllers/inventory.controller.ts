import { Request, Response } from 'express';
import { InventoryService } from '@services/inventory.service';
import { CreateStockEntryRequestDto } from '@dto/stock-movement.dto';
import { StockMovementReason } from '@interfaces/stockMovement';
import { ApiResponse, ApiErrorResponse } from '../types/response';
import { AppError } from '@utils/AppError';
import { getSessionUserId } from '@utils/sessionUtils';
import logger from '@config/logger';
import { Types } from 'mongoose';

export class InventoryController {
  private inventoryService = new InventoryService();

  public createStockEntry = async (req: Request, res: Response<ApiResponse | ApiErrorResponse>): Promise<void> => {
    try {
      const dto: CreateStockEntryRequestDto = {
        productVariantId: new Types.ObjectId(req.body.productVariantId),
        quantity: req.body.quantity,
        unitCost: req.body.unitCost,
        reason: req.body.reason as StockMovementReason,
        reference: req.body.reference,
        notes: req.body.notes,
      };

      // Obtener el ID del usuario desde la sesión
      const userId = getSessionUserId(req.session);
      const createdBy = userId ? new Types.ObjectId(userId) : undefined;

      const result = await this.inventoryService.createStockEntry(dto, createdBy);

      res.status(201).json({
        status: 'success',
        message: 'Entrada de stock creada correctamente.',
        data: result,
      });
    } catch (error: unknown) {
      logger.error('Error creating stock entry:', { error, body: req.body });

      if (error instanceof AppError) {
        res.status(error.statusCode).json({
          status: error.status,
          message: error.message,
        });
      } else {
        res.status(500).json({
          status: 'error',
          message: 'Error interno del servidor al crear entrada de stock.',
        });
      }
    }
  };

  public createStockExit = async (req: Request, res: Response<ApiResponse | ApiErrorResponse>): Promise<void> => {
    try {
      const productVariantId = new Types.ObjectId(req.body.productVariantId);
      const quantity = req.body.quantity;
      const reason = req.body.reason as StockMovementReason;
      const reference = req.body.reference;
      const notes = req.body.notes;

      // Obtener el ID del usuario desde la sesión
      const userId = getSessionUserId(req.session);
      const createdBy = userId ? new Types.ObjectId(userId) : undefined;

      const result = await this.inventoryService.createStockExit(
        productVariantId,
        quantity,
        reason,
        reference,
        notes,
        createdBy,
      );

      res.status(201).json({
        status: 'success',
        message: 'Salida de stock creada correctamente.',
        data: result,
      });
    } catch (error: unknown) {
      logger.error('Error creating stock exit:', { error, body: req.body });

      if (error instanceof AppError) {
        res.status(error.statusCode).json({
          status: error.status,
          message: error.message,
        });
      } else {
        res.status(500).json({
          status: 'error',
          message: 'Error interno del servidor al crear salida de stock.',
        });
      }
    }
  };

  public getStockMovementHistory = async (
    req: Request,
    res: Response<ApiResponse | ApiErrorResponse>,
  ): Promise<void> => {
    try {
      const { productVariantId } = req.params;
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 50;
      const offset = req.query.offset ? parseInt(req.query.offset as string) : 0;

      const result = await this.inventoryService.getStockMovementHistory(
        new Types.ObjectId(productVariantId),
        limit,
        offset,
      );

      res.status(200).json({
        status: 'success',
        data: result,
      });
    } catch (error: unknown) {
      logger.error('Error getting stock movement history:', { error, productVariantId: req.params.productVariantId });

      if (error instanceof AppError) {
        res.status(error.statusCode).json({
          status: error.status,
          message: error.message,
        });
      } else {
        res.status(500).json({
          status: 'error',
          message: 'Error interno del servidor al obtener historial de movimientos.',
        });
      }
    }
  };

  public getProductStockSummary = async (
    req: Request,
    res: Response<ApiResponse | ApiErrorResponse>,
  ): Promise<void> => {
    try {
      const { productId } = req.params;

      const result = await this.inventoryService.getProductStockSummary(new Types.ObjectId(productId));

      res.status(200).json({
        status: 'success',
        data: result,
      });
    } catch (error: unknown) {
      logger.error('Error getting product stock summary:', { error, productId: req.params.productId });

      if (error instanceof AppError) {
        res.status(error.statusCode).json({
          status: error.status,
          message: error.message,
        });
      } else {
        res.status(500).json({
          status: 'error',
          message: 'Error interno del servidor al obtener resumen de stock.',
        });
      }
    }
  };
}
