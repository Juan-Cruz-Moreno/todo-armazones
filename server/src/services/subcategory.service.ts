import { CreateSubcategoryRequestDto, CreateSubcategoryResponseDTO } from '@dto/subcategory.dto';
import Subcategory, { ISubcategoryDocument } from '@models/Subcategory'; // Modelos
import logger from '@config/logger'; // Configuración
import { AppError } from '@utils/AppError'; // Utilidades

export class SubcategoryService {
  public async createSubcategory(
    createSubcategoryRequestDto: CreateSubcategoryRequestDto,
  ): Promise<CreateSubcategoryResponseDTO> {
    try {
      const subcategory: ISubcategoryDocument = new Subcategory(createSubcategoryRequestDto);
      const savedSubcategory = await subcategory.save();

      return {
        id: savedSubcategory._id.toString(),
        slug: savedSubcategory.slug,
        name: savedSubcategory.name,
        title: savedSubcategory.title,
        description: savedSubcategory.description,
        image: savedSubcategory.image,
        category: savedSubcategory.category,
        createdAt: savedSubcategory.createdAt,
        updatedAt: savedSubcategory.updatedAt,
      };
    } catch (error: unknown) {
      logger.error('Failed to create subcategory', {
        error,
        payload: createSubcategoryRequestDto,
      });

      throw new AppError('No se pudo crear la subcategoría.', 500, 'error', true, {
        cause: error instanceof Error ? error.message : String(error),
        context: { payload: createSubcategoryRequestDto },
      });
    }
  }
}
