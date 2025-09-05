import { Request, Response, NextFunction } from 'express';
import { DollarService } from '@services/dollar.service';
import logger from '@config/logger';
import { ApiResponse } from '../types/response';
import { updateDollarAddedValueDTO } from '@dto/dollar.dto';

export class DollarController {
  private dollarService: DollarService = new DollarService();

  /**
   * Obtiene el valor actual del dólar (sin actualizarlo).
   */
  public getDollar = async (_req: Request, res: Response<ApiResponse>, next: NextFunction) => {
    try {
      const data = await this.dollarService.getDollar();
      const response: ApiResponse<typeof data> = {
        status: 'success',
        data,
      };
      return res.json(response);
    } catch (err) {
      logger.error('Error en getDollar', { error: err });
      return next(err);
    }
  };

  /**
   * Fuerza la actualización del valor del dólar desde las APIs externas.
   */
  public updateDollarValue = async (_req: Request, res: Response<ApiResponse>, next: NextFunction) => {
    try {
      const data = await this.dollarService.updateDollarValue();
      const response: ApiResponse<typeof data> = {
        status: 'success',
        message: 'Valor del dólar actualizado correctamente',
        data,
      };
      return res.json(response);
    } catch (err) {
      logger.error('Error en updateDollarValue', { error: err });
      return next(err);
    }
  };

  /**
   * Actualiza la configuración de addedValue e isPercentage.
   */
  public updateDollarConfig = async (
    req: Request<unknown, unknown, updateDollarAddedValueDTO>,
    res: Response<ApiResponse>,
    next: NextFunction,
  ) => {
    try {
      const dto: updateDollarAddedValueDTO = req.body;
      const data = await this.dollarService.updateDollarConfig(dto);

      const response: ApiResponse<typeof data> = {
        status: 'success',
        message: 'Configuración del dólar actualizada correctamente',
        data,
      };
      return res.json(response);
    } catch (err) {
      logger.error('Error en updateDollarConfig', { error: err });
      return next(err);
    }
  };
}
