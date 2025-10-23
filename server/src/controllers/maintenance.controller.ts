import { Request, Response, NextFunction } from 'express';
import { MaintenanceService } from '@services/maintenance.service';
import logger from '@config/logger';
import { ApiResponse } from '../types/response';
import { updateMaintenanceDTO } from '@dto/maintenance.dto';

export class MaintenanceController {
  private maintenanceService: MaintenanceService = new MaintenanceService();

  /**
   * Obtiene el estado actual del mantenimiento.
   */
  public getMaintenance = async (_req: Request, res: Response<ApiResponse>, next: NextFunction) => {
    try {
      const data = await this.maintenanceService.getMaintenance();
      const response: ApiResponse<typeof data> = {
        status: 'success',
        data,
      };
      return res.json(response);
    } catch (err) {
      logger.error('Error en getMaintenance', { error: err });
      return next(err);
    }
  };

  /**
   * Actualiza el estado del mantenimiento.
   */
  public updateMaintenance = async (
    req: Request<unknown, unknown, updateMaintenanceDTO>,
    res: Response<ApiResponse>,
    next: NextFunction,
  ) => {
    try {
      const dto: updateMaintenanceDTO = req.body;
      const data = await this.maintenanceService.updateMaintenance(dto);

      const response: ApiResponse<typeof data> = {
        status: 'success',
        message: 'Estado de mantenimiento actualizado correctamente',
        data,
      };
      return res.json(response);
    } catch (err) {
      logger.error('Error en updateMaintenance', { error: err });
      return next(err);
    }
  };
}
