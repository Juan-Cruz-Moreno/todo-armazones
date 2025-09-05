import { Request, Response, NextFunction } from 'express'; // Externo

import { SubcategoryService } from '@services/subcategory.service';
import { CreateSubcategoryRequestDto, CreateSubcategoryResponseDTO } from '@dto/subcategory.dto'; // DTOs
import logger from '@config/logger'; // Configuración
import { AppError } from '@utils/AppError'; // Utilidades

export class SubcategoryController {
  private subcategoryService: SubcategoryService = new SubcategoryService();

  public createSubcategory = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const createSubcategoryRequest: CreateSubcategoryRequestDto = req.body;

      const subcategory: CreateSubcategoryResponseDTO =
        await this.subcategoryService.createSubcategory(createSubcategoryRequest);

      res.status(201).json({
        message: 'Subcategoría creada con éxito',
        data: subcategory,
      });
    } catch (error: unknown) {
      logger.error('Error en el controlador de crear subcategoría', {
        error,
        body: req.body,
      });

      // Dejar que el middleware de errores lo maneje
      next(
        error instanceof AppError
          ? error
          : new AppError('Error al crear la subcategoría', 500, 'error', false, {
              cause: error instanceof Error ? error.message : String(error),
            }),
      );
    }
  };
}
