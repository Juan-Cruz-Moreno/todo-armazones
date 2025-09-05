import Product, { IProductDocument } from '@models/Product';
import ProductVariant, { IProductVariantDocument } from '@models/ProductVariant';
import {
  CreateProductRequestDto,
  CreateProductResponseDto,
  ProductCategoryDto,
  ProductListItemDto,
  ProductSubcategoryDto,
  SearchProductsResponseDto,
  UpdateProductRequestDto,
} from '@dto/product.dto';
import {
  CreateProductVariantRequestDto,
  CreateProductVariantResponseDto,
  ProductVariantSummaryDto,
  UpdateProductVariantRequestDto,
} from '@dto/product-variant.dto';
import {
  BulkPriceUpdateRequestDto,
  BulkPriceUpdateResponseDto,
  PriceUpdateType,
  ProductVariantPriceUpdateDto,
} from '@dto/bulk-price-update.dto';
import { withTransaction } from '@helpers/withTransaction';
import { AppError } from '@utils/AppError';
import logger from '@config/logger';
import { FilterQuery, Types } from 'mongoose';
import { generateProductSlug } from '@helpers/product-slug.helper';
import Category, { ICategoryDocument } from '@models/Category';
import Subcategory, { ISubcategoryDocument } from '@models/Subcategory';
import { StockMovementReason } from '@interfaces/stockMovement';
import { InventoryService } from './inventory.service';

export class ProductService {
  private inventoryService = new InventoryService();

  public async createProductWithVariants(
    productDto: CreateProductRequestDto,
    variantsDto: CreateProductVariantRequestDto[],
    createdBy?: Types.ObjectId,
  ): Promise<{
    product: CreateProductResponseDto;
    variants: CreateProductVariantResponseDto[];
  }> {
    try {
      // Usar withTransaction para manejar la transacción
      const result = await withTransaction(async (session) => {
        // Generar el slug del producto
        const slug = await generateProductSlug(productDto.productModel, productDto.sku);

        // Crear el producto base incluyendo el slug
        const product = await new Product({ ...productDto, slug }).save({
          session,
        });

        // Popula category y subcategory después de guardar
        const populatedProduct = await Product.findById(product._id)
          .populate({ path: 'category', select: '_id name slug' })
          .populate({ path: 'subcategory', select: '_id name slug' })
          .session(session);

        // Crear las variantes con stock inicial y costo promedio
        const variantDocs = await ProductVariant.insertMany(
          variantsDto.map((variant) => ({
            product: product._id,
            color: variant.color,
            stock: 0, // Inicializamos en 0, luego se agrega con movimiento de inventario
            averageCostUSD: variant.initialCostUSD, // Costo inicial
            priceUSD: variant.priceUSD, // Precio de venta
            thumbnail: variant.thumbnail,
            images: variant.images,
          })),
          { session },
        );

        // Para cada variante, crear el movimiento de stock inicial si tiene stock > 0
        const variantResponses: CreateProductVariantResponseDto[] = [];

        for (let i = 0; i < variantDocs.length; i++) {
          const variant = variantDocs[i];
          const variantDto = variantsDto[i];

          if (variantDto.stock > 0) {
            // Usar InventoryService para crear el stock inicial
            await this.inventoryService.createStockEntryWithSession(
              variant._id,
              variantDto.stock,
              session,
              variantDto.initialCostUSD,
              StockMovementReason.INITIAL_STOCK,
              undefined, // reference
              'Stock inicial del producto',
              createdBy,
            );

            // Obtener la variante actualizada para la respuesta
            const updatedVariant = await ProductVariant.findById(variant._id).session(session);

            variantResponses.push({
              id: variant._id.toString(),
              product: variant.product.toString(),
              color: variant.color,
              stock: updatedVariant?.stock || variantDto.stock,
              averageCostUSD: updatedVariant?.averageCostUSD || variantDto.initialCostUSD,
              priceUSD: variant.priceUSD,
              thumbnail: variant.thumbnail,
              images: variant.images,
            });
          } else {
            // Si no hay stock inicial, solo agregar la variante como está
            variantResponses.push({
              id: variant._id.toString(),
              product: variant.product.toString(),
              color: variant.color,
              stock: 0,
              averageCostUSD: variant.averageCostUSD,
              priceUSD: variant.priceUSD,
              thumbnail: variant.thumbnail,
              images: variant.images,
            });
          }
        }

        // Mapear a DTOs de respuesta
        const productResponse: CreateProductResponseDto = {
          id: populatedProduct!._id.toString(),
          slug: populatedProduct!.slug,
          thumbnail: populatedProduct!.thumbnail,
          primaryImage: populatedProduct!.primaryImage,
          category: this.mapCategories(populatedProduct!.category),
          subcategory: this.mapSubcategory(populatedProduct!.subcategory),
          productModel: populatedProduct!.productModel,
          sku: populatedProduct!.sku,
          ...(populatedProduct!.size !== undefined && {
            size: populatedProduct!.size,
          }),
        };

        return { product: productResponse, variants: variantResponses };
      });

      return result;
    } catch (error: unknown) {
      logger.error('Error while creating product with variants', {
        error,
        productDto,
        variantsDto,
      });

      // Lanzar un AppError con detalles del error
      throw error instanceof AppError
        ? error
        : new AppError('Error al crear el producto y sus variantes.', 500, 'error', false, {
            cause: error instanceof Error ? error.message : String(error),
          });
    }
  }

  private mapCategories(categories: (ICategoryDocument | Types.ObjectId)[]): ProductCategoryDto[] {
    if (!Array.isArray(categories)) return [];
    return categories
      .map((cat) => {
        if (typeof cat === 'object' && cat !== null && '_id' in cat && 'name' in cat && 'slug' in cat) {
          // Documento poblado
          return {
            id: cat._id.toString(),
            name: String((cat as ICategoryDocument).name),
            slug: String((cat as ICategoryDocument).slug),
          };
        } else if (cat instanceof Types.ObjectId) {
          // Solo ID
          return {
            id: cat.toString(),
            name: '',
            slug: '',
          };
        }
        return null;
      })
      .filter((cat): cat is ProductCategoryDto => !!cat);
  }

  private mapSubcategory(subcategory: ISubcategoryDocument | Types.ObjectId | null | undefined): ProductSubcategoryDto {
    if (
      typeof subcategory === 'object' &&
      subcategory !== null &&
      '_id' in subcategory &&
      'name' in subcategory &&
      'slug' in subcategory
    ) {
      // Documento poblado
      return {
        id: subcategory._id.toString(),
        name: String((subcategory as ISubcategoryDocument).name),
        slug: String((subcategory as ISubcategoryDocument).slug),
      };
    } else if (subcategory instanceof Types.ObjectId) {
      // Solo ID
      return {
        id: subcategory.toString(),
        name: '',
        slug: '',
      };
    }
    return { id: '', name: '', slug: '' };
  }

  private mapVariants(variants: IProductVariantDocument[]): ProductVariantSummaryDto[] {
    return variants.map((variant) => ({
      id: variant._id.toString(),
      color: variant.color,
      stock: variant.stock,
      averageCostUSD: variant.averageCostUSD,
      priceUSD: variant.priceUSD,
      thumbnail: variant.thumbnail,
      images: variant.images,
    }));
  }

  public async getProducts(
    limit: number = 10,
    cursor?: string,
    categorySlug?: string,
    subcategorySlug?: string,
    inStock?: boolean,
  ): Promise<{
    products: ProductListItemDto[];
    nextCursor: string | null;
  }> {
    try {
      const query: FilterQuery<IProductDocument> = {};
      if (cursor) {
        query._id = { $gt: new Types.ObjectId(cursor) };
      }

      if (categorySlug) {
        const category = await Category.findOne({ slug: categorySlug }).select('_id').lean();
        if (!category) {
          throw new AppError('Categoría no encontrada', 404, 'fail', false);
        }
        query.category = { $in: [category._id] };

        if (subcategorySlug) {
          const subcategory = await Subcategory.findOne({
            slug: subcategorySlug,
            category: { $in: [category._id] },
          })
            .select('_id')
            .lean();

          if (!subcategory) {
            throw new AppError('Subcategoría no encontrada en la categoría indicada', 404, 'fail', false);
          }

          query.subcategory = { $in: [subcategory._id] };
        }
      }

      // Si se solicita filtrar por stock, primero obtener productos que tienen variantes con stock
      let filteredProductIds: Types.ObjectId[] | undefined;
      if (inStock === true) {
        const productsWithStock = await ProductVariant.aggregate([
          { $match: { stock: { $gt: 0 } } },
          { $group: { _id: '$product' } },
          { $project: { _id: 1 } },
        ]);
        filteredProductIds = productsWithStock.map((item) => item._id);

        // Si no hay productos con stock, retornar resultado vacío
        if (filteredProductIds.length === 0) {
          return {
            products: [],
            nextCursor: null,
          };
        }

        // Agregar filtro de productos con stock al query principal
        query._id = query._id ? { ...query._id, $in: filteredProductIds } : { $in: filteredProductIds };
      }

      const products = await Product.find(query)
        .sort({ _id: 1 })
        .limit(limit)
        .select('slug thumbnail primaryImage category subcategory productModel sku size')
        .populate({ path: 'category', select: '_id name slug' })
        .populate({ path: 'subcategory', select: '_id name slug' })
        .lean();

      const productIds = products.map((p) => p._id);

      const variantsByProduct = await ProductVariant.find({
        product: { $in: productIds },
      })
        .select('color stock averageCostUSD priceUSD thumbnail images product')
        .lean();

      // Agrupa las variantes por producto usando mapVariants
      const variantsMap = new Map<string, ProductVariantSummaryDto[]>();
      for (const productId of productIds) {
        const variants = variantsByProduct.filter((variant) => variant.product.toString() === productId.toString());
        variantsMap.set(productId.toString(), this.mapVariants(variants as IProductVariantDocument[]));
      }

      let result: ProductListItemDto[] = products.map((product) => {
        const categoryInfo = this.mapCategories(product.category);
        const subcategoryInfo = this.mapSubcategory(product.subcategory);

        return {
          id: product._id.toString(),
          slug: product.slug,
          thumbnail: product.thumbnail,
          primaryImage: product.primaryImage,
          category: categoryInfo,
          subcategory: subcategoryInfo,
          productModel: product.productModel,
          sku: product.sku,
          ...(product.size !== undefined && { size: product.size }),
          variants: variantsMap.get(product._id.toString()) ?? [],
        };
      });

      // Si se solicita filtrar por stock, hacer un filtro adicional en el resultado
      // para asegurar que solo se incluyan productos con al menos una variante con stock
      if (inStock === true) {
        result = result.filter((product) => product.variants.some((variant) => variant.stock > 0));
      }

      const nextCursor = products.length === limit ? products[products.length - 1]._id.toString() : null;

      return {
        products: result,
        nextCursor,
      };
    } catch (error) {
      logger.error('Error al obtener productos', { error, limit, cursor });
      throw error instanceof AppError
        ? error
        : new AppError('Error al obtener productos.', 500, 'error', false, {
            cause: error instanceof Error ? error.message : String(error),
          });
    }
  }

  // Get Product Variants by Product Slug.
  public async getProductVariantsByProductSlug(slug: string): Promise<{
    product: ProductListItemDto;
  }> {
    try {
      const product = await Product.findOne({ slug })
        .select('slug thumbnail primaryImage category subcategory productModel sku size')
        .populate({ path: 'category', select: '_id name slug' })
        .populate({ path: 'subcategory', select: '_id name slug' })
        .lean();

      if (!product) {
        throw new AppError('Producto no encontrado', 404, 'fail', false);
      }

      const variants = await ProductVariant.find({ product: product._id })
        .select('color stock averageCostUSD priceUSD thumbnail images')
        .lean();

      const categoryInfo = this.mapCategories(product.category);
      const subcategoryInfo = this.mapSubcategory(product.subcategory);

      const productResponse: ProductListItemDto = {
        id: product._id.toString(),
        slug: product.slug,
        thumbnail: product.thumbnail,
        primaryImage: product.primaryImage,
        category: categoryInfo,
        subcategory: subcategoryInfo,
        productModel: product.productModel,
        sku: product.sku,
        size: product.size ?? '',
        variants: this.mapVariants(variants as IProductVariantDocument[]),
      };

      return { product: productResponse };
    } catch (error) {
      logger.error('Error al obtener variantes del producto', { error, slug });
      throw error instanceof AppError
        ? error
        : new AppError('Error al obtener variantes del producto.', 500, 'error', false, {
            cause: error instanceof Error ? error.message : String(error),
          });
    }
  }

  public async updateProductWithVariants(
    productId: string,
    productDto: UpdateProductRequestDto,
    variantsDto: { id: string; data: UpdateProductVariantRequestDto }[],
  ): Promise<ProductListItemDto> {
    try {
      const result = await withTransaction(async (session) => {
        // Actualizar producto
        const product = await Product.findByIdAndUpdate(productId, { $set: productDto }, { new: true, session })
          .populate({ path: 'category', select: '_id name slug' })
          .populate({ path: 'subcategory', select: '_id name slug' });
        if (!product) {
          throw new AppError('Producto no encontrado', 404, 'fail', false);
        }

        // Actualizar variantes
        const updatedVariants: IProductVariantDocument[] = [];
        for (const variantUpdate of variantsDto) {
          const variant = await ProductVariant.findOneAndUpdate(
            { _id: variantUpdate.id, product: product._id },
            { $set: variantUpdate.data },
            { new: true, session },
          );
          if (!variant) {
            throw new AppError(`Variante no encontrada: ${variantUpdate.id}`, 404, 'fail', false);
          }
          updatedVariants.push(variant);
        }

        // Armar respuesta igual que ProductListItemDto
        const categoryInfo = this.mapCategories(product.category);
        const subcategoryInfo = this.mapSubcategory(product.subcategory);

        return {
          id: product._id.toString(),
          slug: product.slug,
          thumbnail: product.thumbnail,
          primaryImage: product.primaryImage,
          category: categoryInfo,
          subcategory: subcategoryInfo,
          productModel: product.productModel,
          sku: product.sku,
          size: product.size ?? '',
          variants: this.mapVariants(updatedVariants),
        } as ProductListItemDto;
      });

      return result;
    } catch (error) {
      logger.error('Error al actualizar producto y variantes', {
        error,
        productId,
        productDto,
        variantsDto,
      });
      throw error instanceof AppError
        ? error
        : new AppError('Error al actualizar el producto y sus variantes.', 500, 'error', false, {
            cause: error instanceof Error ? error.message : String(error),
          });
    }
  }

  public async searchProducts(q: string): Promise<SearchProductsResponseDto> {
    try {
      const products = await Product.find({
        $or: [{ productModel: { $regex: q, $options: 'i' } }, { sku: { $regex: q, $options: 'i' } }],
      })
        .select('slug thumbnail primaryImage category subcategory productModel sku size')
        .populate({ path: 'category', select: '_id name slug' })
        .populate({ path: 'subcategory', select: '_id name slug' })
        .lean();

      const productIds = products.map((p) => p._id);

      const variantsByProduct = await ProductVariant.find({
        product: { $in: productIds },
      })
        .select('color stock averageCostUSD priceUSD thumbnail images product')
        .lean();

      // Agrupa las variantes por producto usando mapVariants
      const variantsMap = new Map<string, ProductVariantSummaryDto[]>();
      for (const productId of productIds) {
        const variants = variantsByProduct.filter((variant) => variant.product.toString() === productId.toString());
        variantsMap.set(productId.toString(), this.mapVariants(variants as IProductVariantDocument[]));
      }

      const result: ProductListItemDto[] = products.map((product) => {
        const categoryInfo = this.mapCategories(product.category);
        const subcategoryInfo = this.mapSubcategory(product.subcategory);

        return {
          id: product._id.toString(),
          slug: product.slug,
          thumbnail: product.thumbnail,
          primaryImage: product.primaryImage,
          category: categoryInfo,
          subcategory: subcategoryInfo,
          productModel: product.productModel,
          sku: product.sku,
          ...(product.size !== undefined && { size: product.size }),
          variants: variantsMap.get(product._id.toString()) ?? [],
        };
      });

      return { products: result };
    } catch (error) {
      logger.error('Error searching products', { error, q });
      throw new AppError('Error al buscar productos.', 500, 'error', false);
    }
  }

  /**
   * Actualización masiva de precios por categorías o subcategorías
   */
  public async bulkUpdatePrices(dto: BulkPriceUpdateRequestDto): Promise<BulkPriceUpdateResponseDto> {
    try {
      // Validar que se proporcione al menos una categoría
      if (!dto.categoryIds || dto.categoryIds.length === 0) {
        throw new AppError('Debe proporcionar al menos una categoría para la actualización masiva', 400, 'fail', false);
      }

      // Validar el tipo de actualización y valor
      this.validatePriceUpdateInput(dto);

      return await withTransaction(async (session) => {
        // 1. Construir query para encontrar productos afectados
        const productQuery: FilterQuery<IProductDocument> = {
          category: { $in: dto.categoryIds },
        };

        // Si se especifican subcategorías, agregar al filtro
        if (dto.subcategoryIds && dto.subcategoryIds.length > 0) {
          productQuery.subcategory = { $in: dto.subcategoryIds };
        }

        // 2. Encontrar todos los productos que coinciden con los criterios
        const products = await Product.find(productQuery)
          .select('_id productModel sku category subcategory')
          .session(session)
          .lean();

        if (products.length === 0) {
          throw new AppError('No se encontraron productos con los criterios especificados', 404, 'fail', false);
        }

        const productIds = products.map((p) => p._id);

        // 3. Encontrar todas las variantes de estos productos
        const variants = await ProductVariant.find({
          product: { $in: productIds },
        })
          .select('_id product color priceUSD')
          .session(session)
          .lean();

        if (variants.length === 0) {
          throw new AppError('No se encontraron variantes de productos para actualizar', 404, 'fail', false);
        }

        // 4. Calcular nuevos precios y validar límites
        const updatedVariants: ProductVariantPriceUpdateDto[] = [];
        const skippedVariants: ProductVariantPriceUpdateDto[] = [];
        const bulkOperations: Array<{
          updateOne: {
            filter: { _id: Types.ObjectId };
            update: { $set: { priceUSD: number } };
          };
        }> = [];

        for (const variant of variants) {
          const product = products.find((p) => p._id.toString() === variant.product.toString());
          if (!product) continue;

          const oldPrice = variant.priceUSD;
          const newPrice = this.calculateNewPrice(oldPrice, dto.updateType, dto.value);
          const priceChange = newPrice - oldPrice;
          const priceChangePercentage = oldPrice > 0 ? (priceChange / oldPrice) * 100 : 0;

          const variantUpdate: ProductVariantPriceUpdateDto = {
            id: variant._id.toString(),
            productId: product._id.toString(),
            productModel: product.productModel,
            sku: product.sku,
            color: variant.color,
            oldPrice,
            newPrice,
            priceChange,
            priceChangePercentage,
          };

          // Validar límites de precio
          const isWithinLimits = this.isWithinPriceLimits(newPrice, dto.minPrice, dto.maxPrice);

          if (isWithinLimits) {
            updatedVariants.push(variantUpdate);
            bulkOperations.push({
              updateOne: {
                filter: { _id: variant._id },
                update: { $set: { priceUSD: newPrice } },
              },
            });
          } else {
            skippedVariants.push(variantUpdate);
          }
        }

        // 5. Ejecutar actualización masiva
        let totalUpdated = 0;
        if (bulkOperations.length > 0) {
          const bulkResult = await ProductVariant.bulkWrite(bulkOperations, { session });
          totalUpdated = bulkResult.modifiedCount;
        }

        // 6. Calcular estadísticas de resumen
        const summary = this.calculateUpdateSummary(updatedVariants);

        // 7. Log de la operación
        logger.info('Bulk price update completed', {
          categoryIds: dto.categoryIds,
          subcategoryIds: dto.subcategoryIds,
          updateType: dto.updateType,
          value: dto.value,
          totalFound: variants.length,
          totalUpdated,
          totalSkipped: skippedVariants.length,
        });

        return {
          totalVariantsFound: variants.length,
          totalVariantsUpdated: totalUpdated,
          totalVariantsSkipped: skippedVariants.length,
          updatedVariants,
          skippedVariants,
          summary,
        };
      });
    } catch (error: unknown) {
      logger.error('Error in bulk price update', { error, dto });
      throw error instanceof AppError
        ? error
        : new AppError('Error al realizar la actualización masiva de precios.', 500, 'error', false, {
            cause: error instanceof Error ? error.message : String(error),
          });
    }
  }

  /**
   * Valida los parámetros de entrada para la actualización de precios
   */
  private validatePriceUpdateInput(dto: BulkPriceUpdateRequestDto): void {
    if (dto.updateType === PriceUpdateType.PERCENTAGE) {
      if (dto.value <= -100) {
        throw new AppError('El porcentaje de descuento no puede ser mayor al 100%', 400, 'fail', false);
      }
    }

    if (dto.updateType === PriceUpdateType.SET_PRICE) {
      if (dto.value < 0) {
        throw new AppError('El precio fijo no puede ser negativo', 400, 'fail', false);
      }
    }

    if (dto.minPrice !== undefined && dto.minPrice < 0) {
      throw new AppError('El precio mínimo no puede ser negativo', 400, 'fail', false);
    }

    if (dto.maxPrice !== undefined && dto.maxPrice < 0) {
      throw new AppError('El precio máximo no puede ser negativo', 400, 'fail', false);
    }

    if (dto.minPrice !== undefined && dto.maxPrice !== undefined && dto.minPrice > dto.maxPrice) {
      throw new AppError('El precio mínimo no puede ser mayor al precio máximo', 400, 'fail', false);
    }
  }

  /**
   * Calcula el nuevo precio según el tipo de actualización
   */
  private calculateNewPrice(currentPrice: number, updateType: PriceUpdateType, value: number): number {
    switch (updateType) {
      case PriceUpdateType.FIXED_AMOUNT:
        return Math.max(0, currentPrice + value); // No permitir precios negativos

      case PriceUpdateType.PERCENTAGE: {
        const multiplier = 1 + value / 100;
        return Math.max(0, currentPrice * multiplier);
      }

      case PriceUpdateType.SET_PRICE:
        return value;

      default:
        throw new AppError('Tipo de actualización de precio no válido', 400, 'fail', false);
    }
  }

  /**
   * Verifica si el nuevo precio está dentro de los límites especificados
   */
  private isWithinPriceLimits(newPrice: number, minPrice?: number, maxPrice?: number): boolean {
    if (minPrice !== undefined && newPrice < minPrice) {
      return false;
    }

    if (maxPrice !== undefined && newPrice > maxPrice) {
      return false;
    }

    return true;
  }

  /**
   * Calcula estadísticas de resumen de la actualización
   */
  private calculateUpdateSummary(updatedVariants: ProductVariantPriceUpdateDto[]): {
    averagePriceIncrease: number;
    totalValueIncrease: number;
  } {
    if (updatedVariants.length === 0) {
      return {
        averagePriceIncrease: 0,
        totalValueIncrease: 0,
      };
    }

    const totalValueIncrease = updatedVariants.reduce((sum, variant) => sum + variant.priceChange, 0);
    const averagePriceIncrease = totalValueIncrease / updatedVariants.length;

    return {
      averagePriceIncrease: Math.round(averagePriceIncrease * 100) / 100, // Redondear a 2 decimales
      totalValueIncrease: Math.round(totalValueIncrease * 100) / 100,
    };
  }
}
