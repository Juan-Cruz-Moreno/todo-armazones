import { CreateCategoryRequestDto, CreateCategoryResponseDTO } from '@dto/category.dto'; // DTOs
import Category, { ICategoryDocument } from '@models/Category'; // Modelos
import logger from '@config/logger'; // Configuración
import { AppError } from '@utils/AppError'; // Utilidades

export class CategoryService {
  public async createCategory(createCategoryRequestDto: CreateCategoryRequestDto): Promise<CreateCategoryResponseDTO> {
    try {
      const category: ICategoryDocument = new Category(createCategoryRequestDto);
      const savedCategory = await category.save();

      return {
        id: savedCategory._id.toString(),
        slug: savedCategory.slug,
        name: savedCategory.name,
        title: savedCategory.title,
        description: savedCategory.description,
        image: savedCategory.image,
        createdAt: savedCategory.createdAt,
        updatedAt: savedCategory.updatedAt,
      };
    } catch (error: unknown) {
      logger.error('Failed to create category', {
        error,
        payload: createCategoryRequestDto,
      });

      throw new AppError('No se pudo crear la categoría.', 500, 'error', true, {
        cause: error instanceof Error ? error.message : String(error),
        context: { payload: createCategoryRequestDto },
      });
    }
  }
}
