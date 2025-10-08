import { Request, Response } from 'express';
import { ProductService } from '@services/product.service';
import { CreateProductRequestDto, UpdateProductRequestDto } from '@dto/product.dto';
import { CreateProductVariantRequestDto, UpdateProductVariantRequestDto } from '@dto/product-variant.dto';
import { BulkPriceUpdateRequestDto } from '@dto/bulk-price-update.dto';
import logger from '@config/logger';
import { AppError } from '@utils/AppError';
import path from 'path';
import sharp from 'sharp';
import { normalizeColorName } from '@utils/normalizeColorName';
import { getSessionUserId } from '@utils/sessionUtils';
import { ApiResponse, ApiErrorResponse } from '../types/response';
import fs from 'fs/promises';
import { Types } from 'mongoose';

export class ProductController {
  private productService: ProductService = new ProductService();

  public createProductWithVariants = async (
    req: Request,
    res: Response<ApiResponse | ApiErrorResponse>,
  ): Promise<void> => {
    // Utilidad para limpiar archivos
    const cleanupFiles = async (paths: string[]) => {
      for (const filePath of paths) {
        try {
          await fs.unlink(filePath);
        } catch (err) {
          logger.warn('No se pudo eliminar archivo temporal', {
            filePath,
            err,
          });
        }
      }
    };

    const files = req.files as Express.Multer.File[];
    const generatedFiles: string[] = [];
    try {
      // Primary images (multiple allowed)
      const primaryImageFiles = files.filter((file) => file.fieldname === 'primaryImage');
      if (primaryImageFiles.length === 0)
        throw new AppError('At least one primary image is required', 400, 'fail', false);
      primaryImageFiles.forEach((file) => generatedFiles.push(file.path));

      // 3. Los datos ya están parseados por el middleware parseJsonFields
      const productData = req.body.product;

      // 2. Crear thumbnail con Sharp (de la primera imagen después de ordenar)
      let thumbnailFilename: string;
      if (productData.primaryImageOrder && productData.primaryImageOrder.length === primaryImageFiles.length) {
        // Usar el índice de primaryImageOrder[0] para elegir el archivo para thumbnail
        const firstIndex = productData.primaryImageOrder[0];
        if (firstIndex < 0 || firstIndex >= primaryImageFiles.length) {
          throw new AppError(`Índice inválido en primaryImageOrder para thumbnail: ${firstIndex}`, 400, 'fail', false);
        }
        const firstPrimaryImage = primaryImageFiles[firstIndex];
        thumbnailFilename = 'thumb-' + firstPrimaryImage.filename;
        const thumbnailPath = path.join(firstPrimaryImage.destination, thumbnailFilename);
        await sharp(firstPrimaryImage.path).resize(300, 300).toFile(thumbnailPath);
        generatedFiles.push(thumbnailPath);
      } else {
        // Comportamiento original: thumbnail de la primera imagen
        const firstPrimaryImage = primaryImageFiles[0];
        thumbnailFilename = 'thumb-' + firstPrimaryImage.filename;
        const thumbnailPath = path.join(firstPrimaryImage.destination, thumbnailFilename);
        await sharp(firstPrimaryImage.path).resize(300, 300).toFile(thumbnailPath);
        generatedFiles.push(thumbnailPath);
      }

      const variantsData = req.body.variants;

      // 4. Asociar imágenes a cada variante usando el nombre del color como identificador
      const variantsDto: CreateProductVariantRequestDto[] = await Promise.all(
        variantsData.map(async (variant: CreateProductVariantRequestDto) => {
          const colorKey = `images_${normalizeColorName(variant.color.name)}`;
          const imagesForVariant = files.filter((img) => img.fieldname === colorKey).map((img) => img);
          if (!imagesForVariant.length) {
            throw new AppError(
              `La variante de color '${variant.color.name}' debe tener al menos una imagen.`,
              400,
              'fail',
              false,
            );
          }
          // Solo generar thumbnail de la primera imagen de la variante
          const firstImg = imagesForVariant[0];
          generatedFiles.push(firstImg.path);
          const thumbName = 'thumb-' + firstImg.filename;
          const thumbPath = path.join(firstImg.destination, thumbName);
          await sharp(firstImg.path).resize(300, 300).toFile(thumbPath);
          generatedFiles.push(thumbPath);
          // Guardar rutas de imágenes y thumbnail principal
          return {
            ...variant,
            images: imagesForVariant.map((img) => 'uploads/' + img.filename),
            thumbnail: 'uploads/' + thumbName,
          };
        }),
      );

      // 5. Asignar rutas de imágenes procesadas al producto
      let primaryImagePaths = primaryImageFiles.map((file) => 'uploads/' + file.filename);

      // Reordenar primaryImage si se proporciona primaryImageOrder
      if (productData.primaryImageOrder && productData.primaryImageOrder.length === primaryImageFiles.length) {
        primaryImagePaths = productData.primaryImageOrder.map((index: number) => {
          if (index < 0 || index >= primaryImageFiles.length) {
            throw new AppError(`Índice inválido en primaryImageOrder: ${index}`, 400, 'fail', false);
          }
          return primaryImagePaths[index];
        });
      } else if (productData.primaryImageOrder && productData.primaryImageOrder.length !== primaryImageFiles.length) {
        throw new AppError(
          'primaryImageOrder debe tener la misma cantidad de elementos que primaryImage',
          400,
          'fail',
          false,
        );
      }

      const productDto: CreateProductRequestDto = {
        ...productData,
        primaryImage: primaryImagePaths,
        thumbnail: 'uploads/' + thumbnailFilename,
      };

      // Obtener el ID del usuario desde la sesión
      const userId = getSessionUserId(req.session);

      // Llamada al servicio para crear el producto y variantes
      const result = await this.productService.createProductWithVariants(productDto, variantsDto, userId);

      res.status(201).json({
        status: 'success',
        message: 'Producto y variantes creados correctamente.',
        data: result,
      });
    } catch (error: unknown) {
      // Limpiar archivos generados si ocurre un error
      await cleanupFiles(generatedFiles);
      logger.error('Error creating product with variants:', {
        error,
        productDto: req.body.product,
        variantsDto: req.body.variants,
      });
      if (error instanceof AppError) {
        res.status(error.statusCode).json({
          status: error.status,
          message: error.message,
          details: error.details,
        } as ApiErrorResponse);
      } else {
        const appError = new AppError('Internal Server Error', 500, 'error', false);
        res.status(appError.statusCode).json({
          status: appError.status,
          message: appError.message,
        } as ApiErrorResponse);
      }
    }
  };

  public getProductsByPage = async (req: Request, res: Response<ApiResponse | ApiErrorResponse>): Promise<void> => {
    try {
      // Validación de parámetros de consulta
      const pageParam = req.query.page as string;
      const limitParam = req.query.limit as string;
      const categorySlug = req.query.categorySlug as string | undefined;
      const subcategorySlug = req.query.subcategorySlug as string | undefined;
      const inStockParam = req.query.inStock as string | undefined;

      let page = 1;
      if (pageParam) {
        page = parseInt(pageParam, 10);
        if (isNaN(page) || page <= 0) {
          res.status(400).json({
            status: 'fail',
            message: "El parámetro 'page' debe ser un número positivo.",
          });
          return;
        }
      }

      let limit = 10;
      if (limitParam) {
        limit = parseInt(limitParam, 10);
        if (isNaN(limit) || limit <= 0) {
          res.status(400).json({
            status: 'fail',
            message: "El parámetro 'limit' debe ser un número positivo.",
          });
          return;
        }
      }

      // Convertir el parámetro inStock a boolean
      let inStock: boolean | undefined;
      if (inStockParam !== undefined) {
        inStock = inStockParam.toLowerCase() === 'true';
      }

      // Llamada al servicio para obtener productos por página
      const result = await this.productService.getProductsByPage(page, limit, categorySlug, subcategorySlug, inStock);

      res.status(200).json({
        status: 'success',
        data: result,
      });
    } catch (error: unknown) {
      logger.error('Error fetching products by page:', { error });

      if (error instanceof AppError) {
        res.status(error.statusCode).json({
          status: error.status,
          message: error.message,
          details: error.details,
        } as ApiErrorResponse);
      } else {
        const appError = new AppError('Internal Server Error', 500, 'error', false);
        res.status(appError.statusCode).json({
          status: appError.status,
          message: appError.message,
        } as ApiErrorResponse);
      }
    }
  };

  public getProductsPaginationInfo = async (
    req: Request,
    res: Response<ApiResponse | ApiErrorResponse>,
  ): Promise<void> => {
    try {
      // Validación de parámetros de consulta
      const limitParam = req.query.limit as string;
      const categorySlug = req.query.categorySlug as string | undefined;
      const subcategorySlug = req.query.subcategorySlug as string | undefined;
      const inStockParam = req.query.inStock as string | undefined;

      let limit = 10;
      if (limitParam) {
        limit = parseInt(limitParam, 10);
        if (isNaN(limit) || limit <= 0) {
          res.status(400).json({
            status: 'fail',
            message: "El parámetro 'limit' debe ser un número positivo.",
          });
          return;
        }
      }

      // Convertir el parámetro inStock a boolean
      let inStock: boolean | undefined;
      if (inStockParam !== undefined) {
        inStock = inStockParam.toLowerCase() === 'true';
      }

      // Llamada al servicio para obtener información de paginación
      const result = await this.productService.getProductsPaginationInfo(limit, categorySlug, subcategorySlug, inStock);

      res.status(200).json({
        status: 'success',
        data: result,
      });
    } catch (error: unknown) {
      logger.error('Error fetching products pagination info:', { error });

      if (error instanceof AppError) {
        res.status(error.statusCode).json({
          status: error.status,
          message: error.message,
          details: error.details,
        } as ApiErrorResponse);
      } else {
        const appError = new AppError('Internal Server Error', 500, 'error', false);
        res.status(appError.statusCode).json({
          status: appError.status,
          message: appError.message,
        } as ApiErrorResponse);
      }
    }
  };

  public getProducts = async (req: Request, res: Response<ApiResponse | ApiErrorResponse>): Promise<void> => {
    try {
      // Validación de parámetros de consulta
      const limitParam = req.query.limit as string;
      const cursor = req.query.cursor as string | undefined;
      const categorySlug = req.query.categorySlug as string | undefined;
      const subcategorySlug = req.query.subcategorySlug as string | undefined;
      const inStockParam = req.query.inStock as string | undefined;

      let limit = 10;
      if (limitParam) {
        limit = parseInt(limitParam, 10);
        if (isNaN(limit) || limit <= 0) {
          res.status(400).json({
            status: 'fail',
            message: "El parámetro 'limit' debe ser un número positivo.",
          });
          return;
        }
      }

      // Convertir el parámetro inStock a boolean
      let inStock: boolean | undefined;
      if (inStockParam !== undefined) {
        inStock = inStockParam.toLowerCase() === 'true';
      }

      // Llamada al servicio para obtener productos
      const result = await this.productService.getProducts(limit, cursor, categorySlug, subcategorySlug, inStock);

      res.status(200).json({
        status: 'success',
        data: result,
      });
    } catch (error: unknown) {
      logger.error('Error fetching products:', { error });

      if (error instanceof AppError) {
        res.status(error.statusCode).json({
          status: error.status,
          message: error.message,
          details: error.details,
        } as ApiErrorResponse);
      } else {
        const appError = new AppError('Internal Server Error', 500, 'error', false);
        res.status(appError.statusCode).json({
          status: appError.status,
          message: appError.message,
        } as ApiErrorResponse);
      }
    }
  };

  public getProductVariantsByProductSlug = async (
    req: Request,
    res: Response<ApiResponse | ApiErrorResponse>,
  ): Promise<void> => {
    const { slug } = req.params;

    try {
      const variants = await this.productService.getProductVariantsByProductSlug(slug);
      res.status(200).json({
        status: 'success',
        data: variants,
      });
    } catch (error) {
      logger.error('Error fetching product variants:', { error });
      if (error instanceof AppError) {
        res.status(error.statusCode).json({
          status: error.status,
          message: error.message,
          details: error.details,
        } as ApiErrorResponse);
      } else {
        res.status(500).json({
          status: 'error',
          message: 'Error fetching product variants',
        } as ApiErrorResponse);
      }
    }
  };

  public updateProductWithVariants = async (
    req: Request,
    res: Response<ApiResponse | ApiErrorResponse>,
  ): Promise<void> => {
    const { productId } = req.params;

    // Utilidad para limpiar archivos
    const cleanupFiles = async (paths: string[]) => {
      for (const filePath of paths) {
        try {
          await fs.unlink(filePath);
        } catch (err) {
          logger.warn('No se pudo eliminar archivo temporal', {
            filePath,
            err,
          });
        }
      }
    };

    const files = (req.files as Express.Multer.File[]) || [];
    const generatedFiles: string[] = [];
    try {
      // Procesar imágenes principales si se envían (múltiples)
      let productDto = req.body.product as UpdateProductRequestDto;

      let thumbnailFilename: string | undefined;

      const primaryImageFiles = files.filter((file) => file.fieldname === 'primaryImage');
      if (primaryImageFiles.length > 0) {
        primaryImageFiles.forEach((file) => generatedFiles.push(file.path));
        // Crear thumbnail solo para la primera imagen (después de ordenar si aplica)
        let firstPrimaryImage: Express.Multer.File;
        if (productDto.primaryImageOrder && productDto.primaryImageOrder.length === primaryImageFiles.length) {
          const firstIndex = productDto.primaryImageOrder[0];
          if (firstIndex < 0 || firstIndex >= primaryImageFiles.length) {
            throw new AppError(
              `Índice inválido en primaryImageOrder para thumbnail: ${firstIndex}`,
              400,
              'fail',
              false,
            );
          }
          firstPrimaryImage = primaryImageFiles[firstIndex];
        } else {
          firstPrimaryImage = primaryImageFiles[0];
        }
        thumbnailFilename = 'thumb-' + firstPrimaryImage.filename;
        const thumbnailPath = path.join(firstPrimaryImage.destination, thumbnailFilename);
        await sharp(firstPrimaryImage.path).resize(300, 300).toFile(thumbnailPath);
        generatedFiles.push(thumbnailPath);

        // Reordenar primaryImage
        let primaryImagePaths = primaryImageFiles.map((file) => 'uploads/' + file.filename);
        if (productDto.primaryImageOrder && productDto.primaryImageOrder.length === primaryImageFiles.length) {
          primaryImagePaths = productDto.primaryImageOrder.map((index: number) => {
            if (index < 0 || index >= primaryImageFiles.length) {
              throw new AppError(`Índice inválido en primaryImageOrder: ${index}`, 400, 'fail', false);
            }
            return primaryImagePaths[index];
          });
        } else if (productDto.primaryImageOrder && productDto.primaryImageOrder.length !== primaryImageFiles.length) {
          throw new AppError(
            'primaryImageOrder debe tener la misma cantidad de elementos que primaryImage',
            400,
            'fail',
            false,
          );
        }

        productDto = {
          ...productDto,
          primaryImage: primaryImagePaths,
          thumbnail: 'uploads/' + thumbnailFilename,
        };
      }

      // Procesar variantes y asociar imágenes si se envían
      const variantsRaw = req.body.variants as { id?: string; data: UpdateProductVariantRequestDto }[];

      const variantsDto = await Promise.all(
        variantsRaw.map(async (variant) => {
          if (variant.data && variant.data.color && variant.data.color.name) {
            const colorKey = `images_${normalizeColorName(variant.data.color.name)}`;
            const imagesForVariant = files.filter((img) => img.fieldname === colorKey).map((img) => img);
            // Validación: Nueva variante requiere al menos una imagen
            if (!variant.id && imagesForVariant.length === 0) {
              throw new AppError(
                `Nueva variante de color '${variant.data.color.name}' debe tener al menos una imagen.`,
                400,
                'fail',
                false,
              );
            }
            if (imagesForVariant.length > 0) {
              // Solo generar thumbnail de la primera imagen de la variante
              const firstImg = imagesForVariant[0];
              generatedFiles.push(firstImg.path);
              const thumbName = 'thumb-' + firstImg.filename;
              const thumbPath = path.join(firstImg.destination, thumbName);
              await sharp(firstImg.path).resize(300, 300).toFile(thumbPath);
              generatedFiles.push(thumbPath);
              return {
                ...variant,
                data: {
                  ...variant.data,
                  images: imagesForVariant.map((img) => 'uploads/' + img.filename),
                  thumbnail: 'uploads/' + thumbName,
                },
              };
            }
          }
          return variant;
        }),
      );

      const result = await this.productService.updateProductWithVariants(productId, productDto, variantsDto);

      res.status(200).json({
        status: 'success',
        message: 'Producto y variantes actualizados correctamente.',
        data: result,
      });
    } catch (error) {
      await cleanupFiles(generatedFiles);
      logger.error('Error updating product and variants:', {
        error,
        productId,
        productDto: req.body.product,
        variantsDto: req.body.variants,
      });

      if (error instanceof AppError) {
        res.status(error.statusCode).json({
          status: error.status,
          message: error.message,
          details: error.details,
        } as ApiErrorResponse);
      } else {
        const appError = new AppError('Internal Server Error', 500, 'error', false);
        res.status(appError.statusCode).json({
          status: appError.status,
          message: appError.message,
        } as ApiErrorResponse);
      }
    }
  };

  public searchProducts = async (req: Request, res: Response<ApiResponse | ApiErrorResponse>): Promise<void> => {
    try {
      const q = req.query.q as string;
      if (!q) {
        res.status(400).json({
          status: 'fail',
          message: "Falta el parámetro de búsqueda 'q'",
        } as ApiErrorResponse);
        return;
      }

      // Convertir el parámetro inStock a boolean
      const inStockParam = req.query.inStock as string | undefined;
      let inStock: boolean | undefined;
      if (inStockParam !== undefined) {
        inStock = inStockParam.toLowerCase() === 'true';
      }

      const result = await this.productService.searchProducts(q, inStock);
      res.status(200).json({
        status: 'success',
        data: result,
      });
    } catch (error) {
      logger.error('Error searching products:', { error });
      if (error instanceof AppError) {
        res.status(error.statusCode).json({
          status: error.status,
          message: error.message,
          details: error.details,
        } as ApiErrorResponse);
      } else {
        res.status(500).json({
          status: 'error',
          message: 'Error searching products',
        } as ApiErrorResponse);
      }
    }
  };

  public bulkUpdatePrices = async (req: Request, res: Response<ApiResponse | ApiErrorResponse>): Promise<void> => {
    try {
      // Convertir strings a ObjectId para categoryIds y subcategoryIds
      const categoryIds = req.body.categoryIds?.map((id: string) => new Types.ObjectId(id)) || [];
      const subcategoryIds = req.body.subcategoryIds?.map((id: string) => new Types.ObjectId(id)) || undefined;

      const bulkUpdateDto: BulkPriceUpdateRequestDto = {
        categoryIds,
        subcategoryIds,
        updateType: req.body.updateType,
        value: req.body.value,
        minPrice: req.body.minPrice,
        maxPrice: req.body.maxPrice,
      };

      const result = await this.productService.bulkUpdatePrices(bulkUpdateDto);

      res.status(200).json({
        status: 'success',
        message: `Actualización masiva completada. ${result.totalVariantsUpdated} variantes actualizadas de ${result.totalVariantsFound} encontradas.`,
        data: result,
      });
    } catch (error: unknown) {
      logger.error('Error in bulk price update:', { error, body: req.body });

      if (error instanceof AppError) {
        res.status(error.statusCode).json({
          status: error.status,
          message: error.message,
          details: error.details,
        } as ApiErrorResponse);
      } else {
        res.status(500).json({
          status: 'error',
          message: 'Error en la actualización masiva de precios',
        } as ApiErrorResponse);
      }
    }
  };
}
