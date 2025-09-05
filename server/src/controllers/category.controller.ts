import { Request, Response, NextFunction } from 'express'; // Externo

import { CreateCategoryRequestDto, CreateCategoryResponseDTO } from '@dto/category.dto'; // DTOs
import logger from '@config/logger'; // Configuración
import { AppError } from '@utils/AppError'; // Utilidades
import { CategoryService } from '@services/category.service';

export class CategoryController {
  private categoryService: CategoryService = new CategoryService();

  public createCategory = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const createCategoryRequest: CreateCategoryRequestDto = req.body;

      const category: CreateCategoryResponseDTO = await this.categoryService.createCategory(createCategoryRequest);

      res.status(201).json({
        message: 'Category created successfully',
        data: category,
      });
    } catch (error: unknown) {
      logger.error('Error in createCategory controller', {
        error,
        body: req.body,
      });

      // Dejar que el middleware de errores lo maneje
      next(
        error instanceof AppError
          ? error
          : new AppError('Error al crear la categoría', 500, 'error', false, {
              cause: error instanceof Error ? error.message : String(error),
            }),
      );
    }
  };
}
