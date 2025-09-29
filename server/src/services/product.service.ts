import Product, { IProductDocument } from '@models/Product';
import ProductVariant, { IProductVariantDocument } from '@models/ProductVariant';
import Category, { ICategoryDocument } from '@models/Category';
import Subcategory, { ISubcategoryDocument } from '@models/Subcategory';
import {
  CreateProductRequestDto,
  CreateProductResponseDto,
  GetProductsResponseDto,
  PaginationMetadata,
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
import { StockMovementReason } from '@interfaces/stockMovement';
import { InventoryService } from '@services/inventory.service';
import { DollarService } from '@services/dollar.service';
import { IProductVariant } from '@interfaces/productVariant';

// Interfaces internas para organizar los filtros y opciones
interface ProductFilters {
  categorySlug?: string;
  subcategorySlug?: string;
  inStock?: boolean;
}

interface QueryBuildResult {
  baseQuery: FilterQuery<IProductDocument>;
  stockFilteredIds?: Types.ObjectId[];
  categoryId?: Types.ObjectId;
  subcategoryId?: Types.ObjectId;
}

export class ProductService {
  private inventoryService = new InventoryService();
  private dollarService = new DollarService();

  /**
   * Valida los datos de entrada del producto
   */
  private validateProduct(productDto: CreateProductRequestDto): void {
    if (!productDto.productModel?.trim()) {
      throw new AppError('El modelo del producto es requerido', 400, 'error', false);
    }
    if (!productDto.sku?.trim()) {
      throw new AppError('El SKU del producto es requerido', 400, 'error', false);
    }
    if (!productDto.size?.trim()) {
      throw new AppError('El tamaño del producto es requerido', 400, 'error', false);
    }
    if (!Array.isArray(productDto.category) || productDto.category.length === 0) {
      throw new AppError('Al menos una categoría es requerida', 400, 'error', false);
    }
    if (productDto.category.length > 10) {
      throw new AppError('No se permiten más de 10 categorías por producto', 400, 'error', false);
    }
    if (!productDto.subcategory) {
      throw new AppError('La subcategoría es requerida', 400, 'error', false);
    }
  }

  /**
   * Valida los datos de entrada de las variantes
   */
  private validateVariants(variantsDto: CreateProductVariantRequestDto[]): void {
    if (!Array.isArray(variantsDto) || variantsDto.length === 0) {
      throw new AppError('Al menos una variante es requerida', 400, 'error', false);
    }
    if (variantsDto.length > 50) {
      throw new AppError('No se permiten más de 50 variantes por producto', 400, 'error', false);
    }

    const colorHexes = new Set<string>();
    for (const variant of variantsDto) {
      if (!variant.color?.name?.trim() || !variant.color?.hex?.trim()) {
        throw new AppError('El color de la variante es requerido', 400, 'error', false);
      }
      if (colorHexes.has(variant.color.hex)) {
        throw new AppError('No se permiten variantes con el mismo color', 400, 'error', false);
      }
      colorHexes.add(variant.color.hex);
      if (variant.stock < 0) {
        throw new AppError('El stock no puede ser negativo', 400, 'error', false);
      }
      if (variant.initialCostUSD < 0) {
        throw new AppError('El costo inicial no puede ser negativo', 400, 'error', false);
      }
      if (variant.priceUSD < 0) {
        throw new AppError('El precio no puede ser negativo', 400, 'error', false);
      }
      if (!variant.thumbnail?.trim()) {
        throw new AppError('La miniatura de la variante es requerida', 400, 'error', false);
      }
      if (!Array.isArray(variant.images)) {
        throw new AppError('Las imágenes deben ser un array', 400, 'error', false);
      }
      if (variant.images.length > 10) {
        throw new AppError('No se permiten más de 10 imágenes por variante', 400, 'error', false);
      }
    }
  }

  /**
   * Valida los datos de entrada del producto para actualización (campos opcionales)
   */
  private validateUpdateProduct(productDto: UpdateProductRequestDto): void {
    if (productDto.productModel !== undefined && !productDto.productModel?.trim()) {
      throw new AppError('El modelo del producto no puede estar vacío', 400, 'error', false);
    }
    if (productDto.sku !== undefined && !productDto.sku?.trim()) {
      throw new AppError('El SKU del producto no puede estar vacío', 400, 'error', false);
    }
    if (productDto.size !== undefined && !productDto.size?.trim()) {
      throw new AppError('El tamaño del producto no puede estar vacío', 400, 'error', false);
    }
    if (productDto.category !== undefined) {
      if (!Array.isArray(productDto.category) || productDto.category.length === 0) {
        throw new AppError('Al menos una categoría es requerida', 400, 'error', false);
      }
      if (productDto.category.length > 10) {
        throw new AppError('No se permiten más de 10 categorías por producto', 400, 'error', false);
      }
    }
    if (productDto.subcategory !== undefined && !productDto.subcategory) {
      throw new AppError('La subcategoría no puede estar vacía', 400, 'error', false);
    }
  }

  /**
   * Valida los datos de entrada de las variantes para actualización
   */
  private validateUpdateVariants(variantsDto: { id?: string; data: UpdateProductVariantRequestDto }[]): void {
    if (!Array.isArray(variantsDto) || variantsDto.length === 0) {
      throw new AppError('Al menos una variante es requerida para actualizar', 400, 'error', false);
    }
    if (variantsDto.length > 50) {
      throw new AppError('No se permiten más de 50 variantes por producto', 400, 'error', false);
    }

    const colorHexes = new Set<string>();
    for (const variantUpdate of variantsDto) {
      const variant = variantUpdate.data;
      if (variant.color) {
        if (!variant.color.name?.trim() || !variant.color.hex?.trim()) {
          throw new AppError('El color de la variante no puede estar vacío', 400, 'error', false);
        }
        if (colorHexes.has(variant.color.hex)) {
          throw new AppError('No se permiten variantes con el mismo color', 400, 'error', false);
        }
        colorHexes.add(variant.color.hex);
      }
      if (variant.priceUSD !== undefined && variant.priceUSD < 0) {
        throw new AppError('El precio no puede ser negativo', 400, 'error', false);
      }
      if (variant.averageCostUSD !== undefined && variant.averageCostUSD < 0) {
        throw new AppError('El costo promedio no puede ser negativo', 400, 'error', false);
      }
      if (variant.thumbnail !== undefined && !variant.thumbnail?.trim()) {
        throw new AppError('La miniatura de la variante no puede estar vacía', 400, 'error', false);
      }
      if (variant.images !== undefined) {
        if (!Array.isArray(variant.images)) {
          throw new AppError('Las imágenes deben ser un array', 400, 'error', false);
        }
        if (variant.images.length > 10) {
          throw new AppError('No se permiten más de 10 imágenes por variante', 400, 'error', false);
        }
      }
      // Validaciones para stock e initialCostUSD en nuevas variantes (sin id)
      if (!variantUpdate.id) {
        if (variant.stock !== undefined) {
          if (variant.stock < 0) {
            throw new AppError('El stock inicial no puede ser negativo', 400, 'error', false);
          }
          if (variant.stock > 0 && (variant.initialCostUSD === undefined || variant.initialCostUSD < 0)) {
            throw new AppError(
              'Si se incluye stock inicial > 0, se requiere initialCostUSD válido',
              400,
              'error',
              false,
            );
          }
        }
        if (variant.initialCostUSD !== undefined && variant.initialCostUSD < 0) {
          throw new AppError('El costo inicial no puede ser negativo', 400, 'error', false);
        }
      }
      // Nota: stock se maneja vía InventoryService; averageCostUSD se valida aquí para modificaciones manuales
    }
  }

  /**
   * Calcula el precio en ARS basado en el precio en USD usando la cotización actual del dólar
   */
  private async calculatePriceARS(priceUSD: number): Promise<number> {
    const dollar = await this.dollarService.getDollar();
    return Math.round(priceUSD * dollar.value * 100) / 100; // Redondear a 2 decimales
  }

  public async createProductWithVariants(
    productDto: CreateProductRequestDto,
    variantsDto: CreateProductVariantRequestDto[],
    createdBy?: Types.ObjectId,
  ): Promise<{
    product: CreateProductResponseDto;
    variants: CreateProductVariantResponseDto[];
  }> {
    // Validaciones de entrada
    this.validateProduct(productDto);
    this.validateVariants(variantsDto);

    // Generar slug único (unicidad manejada por índices de MongoDB)
    const slug = await generateProductSlug(productDto.productModel, productDto.sku);

    try {
      // Usar withTransaction para manejar la transacción
      const result = await withTransaction(async (session) => {
        // Ya no necesitamos generar el slug aquí, usamos el generado pre-transacción

        // Validar existencia de categorías
        const categories = await Category.find({
          _id: { $in: productDto.category },
        }).session(session);
        if (categories.length !== productDto.category.length) {
          throw new AppError('Una o más categorías no existen', 400, 'error', false);
        }

        // Validar existencia de subcategoría
        const subcategory = await Subcategory.findById(productDto.subcategory).session(session);
        if (!subcategory) {
          throw new AppError('La subcategoría no existe', 400, 'error', false);
        }

        // Validar que la subcategoría pertenezca a al menos una de las categorías seleccionadas
        const subcategoryCategories = subcategory.category.map((cat) => cat.toString());
        const hasMatchingCategory = productDto.category.some((catId) =>
          subcategoryCategories.includes(catId.toString()),
        );
        if (!hasMatchingCategory) {
          throw new AppError(
            'La subcategoría no pertenece a ninguna de las categorías seleccionadas',
            400,
            'error',
            false,
          );
        }

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
        logger.info(`Creando ${variantsDto.length} variantes para producto`, {
          productModel: productDto.productModel,
        });
        const variantDocs = await ProductVariant.insertMany(
          await Promise.all(
            variantsDto.map(async (variant) => ({
              product: product._id,
              color: variant.color,
              stock: 0, // Inicializamos en 0, luego se agrega con movimiento de inventario
              averageCostUSD: variant.initialCostUSD, // Costo inicial
              priceUSD: variant.priceUSD, // Precio de venta
              priceARS: await this.calculatePriceARS(variant.priceUSD), // Precio en ARS calculado
              thumbnail: variant.thumbnail,
              images: variant.images,
            })),
          ),
          { session },
        );

        // Para cada variante, crear el movimiento de stock inicial si tiene stock > 0
        const variantResponses: CreateProductVariantResponseDto[] = [];

        for (let i = 0; i < variantDocs.length; i++) {
          const variant = variantDocs[i];
          const variantDto = variantsDto[i];

          try {
            if (variantDto.stock > 0) {
              logger.info(`Creando stock inicial para variante ${variant._id}`, {
                productId: product._id,
                variantId: variant._id,
                stock: variantDto.stock,
                initialCost: variantDto.initialCostUSD,
              });

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
                priceARS: await this.calculatePriceARS(variant.priceUSD),
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
                priceARS: await this.calculatePriceARS(variant.priceUSD),
                thumbnail: variant.thumbnail,
                images: variant.images,
              });
            }
          } catch (variantError) {
            logger.error(`Error procesando variante ${i}`, {
              variantId: variant._id,
              error: variantError,
              variantDto,
            });
            throw new AppError(
              `Error al procesar variante ${i + 1}: ${
                variantError instanceof Error ? variantError.message : 'Error desconocido'
              }`,
              500,
              'error',
              false,
            );
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
          size: populatedProduct!.size,
          description: populatedProduct!.description ?? '',
        };

        return { product: productResponse, variants: variantResponses };
      });

      return result;
    } catch (error: unknown) {
      logger.error('Error while creating product with variants', {
        error,
        productDto,
        variantsDto: variantsDto.length,
        createdBy,
        stack: error instanceof Error ? error.stack : undefined,
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

  private async mapVariants(variants: IProductVariantDocument[]): Promise<ProductVariantSummaryDto[]> {
    return Promise.all(
      variants.map(async (variant) => ({
        id: variant._id.toString(),
        color: variant.color,
        stock: variant.stock,
        averageCostUSD: variant.averageCostUSD,
        priceUSD: variant.priceUSD,
        priceARS: await this.calculatePriceARS(variant.priceUSD),
        thumbnail: variant.thumbnail,
        images: variant.images,
      })),
    );
  }

  /**
   * Método centralizado para construir queries de productos con filtros
   * Elimina la duplicación de lógica entre diferentes métodos de paginación
   */
  private async buildProductQuery(filters: ProductFilters): Promise<QueryBuildResult> {
    const baseQuery: FilterQuery<IProductDocument> = {};
    let stockFilteredIds: Types.ObjectId[] | undefined;
    let categoryId: Types.ObjectId | undefined;
    let subcategoryId: Types.ObjectId | undefined;

    // Filtro por categoría
    if (filters.categorySlug) {
      const category = await Category.findOne({ slug: filters.categorySlug }).select('_id').lean();
      if (!category) {
        throw new AppError('Categoría no encontrada', 404, 'fail', false);
      }
      categoryId = category._id;
      baseQuery.category = { $in: [category._id] };

      // Filtro por subcategoría (solo si existe categoría)
      if (filters.subcategorySlug) {
        const subcategory = await Subcategory.findOne({
          slug: filters.subcategorySlug,
          category: { $in: [category._id] },
        })
          .select('_id')
          .lean();

        if (!subcategory) {
          throw new AppError('Subcategoría no encontrada en la categoría indicada', 404, 'fail', false);
        }
        subcategoryId = subcategory._id;
        baseQuery.subcategory = { $in: [subcategory._id] };
      }
    }

    // Filtro por stock - optimizado para evitar doble filtrado
    if (filters.inStock === true) {
      stockFilteredIds = await this.getProductsWithStock();
      if (stockFilteredIds.length === 0) {
        // Retornar query que no coincidirá con nada
        baseQuery._id = { $in: [] };
      } else {
        baseQuery._id = { $in: stockFilteredIds };
      }
    }

    return {
      baseQuery,
      ...(stockFilteredIds && { stockFilteredIds }),
      ...(categoryId && { categoryId }),
      ...(subcategoryId && { subcategoryId }),
    };
  }

  /**
   * Método optimizado para obtener IDs de productos que tienen stock
   * Centraliza la lógica y evita duplicación en múltiples métodos
   */
  private async getProductsWithStock(): Promise<Types.ObjectId[]> {
    const productsWithStock = await ProductVariant.aggregate([
      { $match: { stock: { $gt: 0 } } },
      { $group: { _id: '$product' } },
      { $project: { _id: 1 } },
    ]);
    return productsWithStock.map((item) => item._id);
  }

  /**
   * Método centralizado para construir respuestas de productos con variantes
   * Elimina duplicación de lógica de ensamblado entre métodos
   */
  private async buildProductResponse(
    products: (IProductDocument & {
      category: ICategoryDocument[] | Types.ObjectId[];
      subcategory: ISubcategoryDocument | Types.ObjectId;
    })[],
    includeVariants: boolean = true,
  ): Promise<ProductListItemDto[]> {
    if (products.length === 0) return [];

    const productIds = products.map((p) => p._id);
    const variantsMap = new Map<string, ProductVariantSummaryDto[]>();

    if (includeVariants) {
      const variantsByProduct = await ProductVariant.find({
        product: { $in: productIds },
      })
        .select('color stock averageCostUSD priceUSD thumbnail images product')
        .lean();

      // Agrupa las variantes por producto
      for (const productId of productIds) {
        const variants = variantsByProduct.filter((variant) => variant.product.toString() === productId.toString());
        variantsMap.set(productId.toString(), await this.mapVariants(variants as IProductVariantDocument[]));
      }
    }

    return products.map((product) => {
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
        size: product.size ?? '', // Asignar "" por defecto para compatibilidad con productos legacy sin size
        description: product.description ?? '',
        variants: variantsMap.get(product._id.toString()) ?? [],
      };
    });
  }

  /**
   * Método optimizado para conteo de productos
   * Usa la nueva estructura centralizada y elimina lógica duplicada
   */
  private async getProductsCount(filters: ProductFilters): Promise<number> {
    const { baseQuery, stockFilteredIds } = await this.buildProductQuery(filters);

    // Si tenemos filtro de stock y no hay productos con stock, retornar 0
    if (filters.inStock === true && stockFilteredIds && stockFilteredIds.length === 0) {
      return 0;
    }

    // Para queries simples o cuando ya tenemos los IDs filtrados, usar countDocuments
    return Product.countDocuments(baseQuery);
  }

  /**
   * Obtiene productos para una página específica por número
   * Método optimizado que usa la nueva arquitectura centralizada
   */
  public async getProductsByPage(
    page: number = 1,
    limit: number = 10,
    categorySlug?: string,
    subcategorySlug?: string,
    inStock?: boolean,
  ): Promise<GetProductsResponseDto> {
    try {
      if (page < 1) {
        throw new AppError('El número de página debe ser mayor a 0', 400, 'fail', false);
      }

      const filters: ProductFilters = {};
      if (categorySlug) filters.categorySlug = categorySlug;
      if (subcategorySlug) filters.subcategorySlug = subcategorySlug;
      if (inStock !== undefined) filters.inStock = inStock;

      // Usar método centralizado para construir query
      const { baseQuery } = await this.buildProductQuery(filters);

      // Si no hay productos con stock (cuando se filtra por stock), retornar vacío
      if (baseQuery._id && Array.isArray(baseQuery._id.$in) && baseQuery._id.$in.length === 0) {
        return {
          products: [],
          pagination: {
            totalCount: 0,
            totalPages: 0,
            currentPage: page,
            hasNextPage: false,
            hasPreviousPage: false,
            nextCursor: null,
            previousCursor: null,
            limit,
            itemsInCurrentPage: 0,
          },
        };
      }

      // Calcular skip para la página específica
      const skip = (page - 1) * limit;

      // Obtener total count usando método optimizado
      const totalCount = await this.getProductsCount(filters);
      const totalPages = Math.ceil(totalCount / limit);

      // Validar que la página solicitada existe
      if (page > totalPages && totalCount > 0) {
        throw new AppError(`La página ${page} no existe. Máximo: ${totalPages}`, 404, 'fail', false);
      }

      // Obtener productos con skip y limit
      const products = await Product.find(baseQuery)
        .sort({ _id: 1 })
        .skip(skip)
        .limit(limit + 1) // +1 para determinar si hay siguiente página
        .select('slug thumbnail primaryImage category subcategory productModel sku size description')
        .populate({ path: 'category', select: '_id name slug' })
        .populate({ path: 'subcategory', select: '_id name slug' })
        .lean();

      const hasNextPage = products.length > limit;
      const actualProducts = hasNextPage ? products.slice(0, limit) : products;
      const itemsInCurrentPage = actualProducts.length;

      // Usar método centralizado para construir respuesta
      const result = await this.buildProductResponse(actualProducts, true);

      // Calcular cursors para compatibilidad con navegación cursor-based
      const nextCursor =
        hasNextPage && actualProducts.length > 0 ? actualProducts[actualProducts.length - 1]._id.toString() : null;

      // Para previous cursor, calcular el ID del primer elemento de la página anterior
      let previousCursor: string | null = null;
      if (page > 1) {
        const previousSkip = Math.max(0, (page - 2) * limit);
        const previousPageProduct = await Product.findOne(baseQuery)
          .sort({ _id: 1 })
          .skip(previousSkip)
          .select('_id')
          .lean();
        previousCursor = previousPageProduct?._id.toString() || null;
      }

      const pagination: PaginationMetadata = {
        totalCount,
        totalPages,
        currentPage: page,
        hasNextPage,
        hasPreviousPage: page > 1,
        nextCursor,
        previousCursor,
        limit,
        itemsInCurrentPage,
      };

      return {
        products: result,
        pagination,
      };
    } catch (error) {
      logger.error('Error al obtener productos por página', {
        error,
        page,
        limit,
        categorySlug,
        subcategorySlug,
        inStock,
      });
      throw error instanceof AppError
        ? error
        : new AppError('Error al obtener productos por página.', 500, 'error', false, {
            cause: error instanceof Error ? error.message : String(error),
          });
    }
  }

  /**
   * Obtiene solo los metadatos de paginación sin cargar los productos
   * Método optimizado que usa la nueva arquitectura centralizada
   */
  public async getProductsPaginationInfo(
    limit: number = 10,
    categorySlug?: string,
    subcategorySlug?: string,
    inStock?: boolean,
  ): Promise<Omit<PaginationMetadata, 'nextCursor' | 'previousCursor' | 'itemsInCurrentPage'>> {
    try {
      const filters: ProductFilters = {};
      if (categorySlug) filters.categorySlug = categorySlug;
      if (subcategorySlug) filters.subcategorySlug = subcategorySlug;
      if (inStock !== undefined) filters.inStock = inStock;

      // Usar método optimizado para obtener conteo
      const totalCount = await this.getProductsCount(filters);
      const totalPages = Math.ceil(totalCount / limit);

      return {
        totalCount,
        totalPages,
        currentPage: 1,
        hasNextPage: totalPages > 1,
        hasPreviousPage: false,
        limit,
      };
    } catch (error) {
      logger.error('Error al obtener información de paginación', {
        error,
        limit,
        categorySlug,
        subcategorySlug,
        inStock,
      });
      throw error instanceof AppError
        ? error
        : new AppError('Error al obtener información de paginación.', 500, 'error', false, {
            cause: error instanceof Error ? error.message : String(error),
          });
    }
  }

  /**
   * Método de paginación por cursor - Simplificado
   * @deprecated Considera usar getProductsByPage para mejor performance
   */
  public async getProducts(
    limit: number = 10,
    cursor?: string,
    categorySlug?: string,
    subcategorySlug?: string,
    inStock?: boolean,
  ): Promise<GetProductsResponseDto> {
    try {
      const filters: ProductFilters = {};
      if (categorySlug) filters.categorySlug = categorySlug;
      if (subcategorySlug) filters.subcategorySlug = subcategorySlug;
      if (inStock !== undefined) filters.inStock = inStock;

      // Construir query base usando método centralizado
      const { baseQuery } = await this.buildProductQuery(filters);

      // Aplicar cursor si existe
      const query = { ...baseQuery };
      if (cursor) {
        query._id = query._id ? { ...query._id, $gt: new Types.ObjectId(cursor) } : { $gt: new Types.ObjectId(cursor) };
      }

      // Si no hay productos con stock (cuando se filtra), retornar vacío
      if (baseQuery._id && Array.isArray(baseQuery._id.$in) && baseQuery._id.$in.length === 0) {
        return {
          products: [],
          pagination: {
            totalCount: 0,
            totalPages: 0,
            currentPage: 1,
            hasNextPage: false,
            hasPreviousPage: false,
            nextCursor: null,
            previousCursor: null,
            limit,
            itemsInCurrentPage: 0,
          },
        };
      }

      // Obtener total count
      const totalCount = await this.getProductsCount(filters);

      // Obtener productos con cursor aplicado
      const products = await Product.find(query)
        .sort({ _id: 1 })
        .limit(limit + 1) // +1 para determinar si hay siguiente página
        .select('slug thumbnail primaryImage category subcategory productModel sku size description')
        .populate({ path: 'category', select: '_id name slug' })
        .populate({ path: 'subcategory', select: '_id name slug' })
        .lean();

      // Determinar si hay página siguiente
      const hasNextPage = products.length > limit;
      const actualProducts = hasNextPage ? products.slice(0, limit) : products;
      const itemsInCurrentPage = actualProducts.length;

      // Usar método centralizado para construir respuesta
      const result = await this.buildProductResponse(actualProducts, true);

      // Calcular metadatos de paginación
      const totalPages = Math.ceil(totalCount / limit);

      // Estimar página actual basada en cursor (simplificado)
      let currentPage = 1;
      if (cursor) {
        const countBeforeCursor = await Product.countDocuments({
          ...baseQuery,
          _id: { ...baseQuery._id, $lte: new Types.ObjectId(cursor) },
        });
        currentPage = Math.floor(countBeforeCursor / limit) + 1;
      }

      const nextCursor =
        hasNextPage && actualProducts.length > 0 ? actualProducts[actualProducts.length - 1]._id.toString() : null;

      const hasPreviousPage = cursor !== undefined;
      let previousCursor: string | null = null;
      if (hasPreviousPage && currentPage > 1) {
        const skipCount = Math.max(0, (currentPage - 2) * limit);
        const previousPageProduct = await Product.findOne(baseQuery)
          .sort({ _id: 1 })
          .skip(skipCount)
          .select('_id')
          .lean();
        previousCursor = previousPageProduct?._id.toString() || null;
      }

      const pagination: PaginationMetadata = {
        totalCount,
        totalPages,
        currentPage,
        hasNextPage,
        hasPreviousPage,
        nextCursor,
        previousCursor,
        limit,
        itemsInCurrentPage,
      };

      return {
        products: result,
        pagination,
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
        .select('slug thumbnail primaryImage category subcategory productModel sku size description')
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
        size: product.size ?? '', // Asignar "" por defecto para compatibilidad con productos legacy sin size
        description: product.description ?? '',
        variants: await this.mapVariants(variants as IProductVariantDocument[]),
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
    variantsDto: { id?: string; data: UpdateProductVariantRequestDto }[],
  ): Promise<ProductListItemDto> {
    // Validaciones de entrada (adaptadas para update)
    this.validateUpdateProduct(productDto);
    this.validateUpdateVariants(variantsDto);

    // Generar nuevo slug si se actualizan productModel o sku
    let newSlug: string | undefined;
    if (productDto.productModel || productDto.sku) {
      const existingProduct = await Product.findById(productId).select('productModel sku');
      if (!existingProduct) {
        throw new AppError('Producto no encontrado', 404, 'fail', false);
      }
      const model = productDto.productModel || existingProduct.productModel;
      const sku = productDto.sku || existingProduct.sku;
      newSlug = await generateProductSlug(model, sku);
    }

    try {
      const result = await withTransaction(async (session) => {
        // Validar existencia de categorías si se proporcionan
        if (productDto.category && productDto.category.length > 0) {
          const categories = await Category.find({
            _id: { $in: productDto.category },
          }).session(session);
          if (categories.length !== productDto.category.length) {
            throw new AppError('Una o más categorías no existen', 400, 'error', false);
          }
        }

        // Validar existencia de subcategoría si se proporciona
        let subcategory: ISubcategoryDocument | null = null;
        if (productDto.subcategory) {
          subcategory = await Subcategory.findById(productDto.subcategory).session(session);
          if (!subcategory) {
            throw new AppError('La subcategoría no existe', 400, 'error', false);
          }
        }

        // Validar relación subcategoría-categorías si ambas se actualizan
        if (subcategory && productDto.category && productDto.category.length > 0) {
          const subcategoryCategories = subcategory.category.map((cat: Types.ObjectId) => cat.toString());
          const hasMatchingCategory = productDto.category.some((catId) =>
            subcategoryCategories.includes(catId.toString()),
          );
          if (!hasMatchingCategory) {
            throw new AppError(
              'La subcategoría no pertenece a ninguna de las categorías seleccionadas',
              400,
              'error',
              false,
            );
          }
        }

        // Actualizar producto
        const updateData = newSlug ? { ...productDto, slug: newSlug } : productDto;
        const product = await Product.findByIdAndUpdate(productId, { $set: updateData }, { new: true, session })
          .populate({ path: 'category', select: '_id name slug' })
          .populate({ path: 'subcategory', select: '_id name slug' });
        if (!product) {
          throw new AppError('Producto no encontrado', 404, 'fail', false);
        }

        // Actualizar o crear variantes con logging y manejo de errores por variante
        const updatedVariants: IProductVariantDocument[] = [];
        const createdVariantIds: string[] = [];
        for (let i = 0; i < variantsDto.length; i++) {
          const variantUpdate = variantsDto[i];
          try {
            if (variantUpdate.id) {
              // Actualizar variante existente
              logger.info(`Actualizando variante ${variantUpdate.id}`, {
                productId,
                variantId: variantUpdate.id,
                data: variantUpdate.data,
              });

              const updateData: Partial<Omit<IProductVariant, 'product'>> & { priceARS?: number } = {
                ...variantUpdate.data,
              };
              if (variantUpdate.data.priceUSD !== undefined) {
                updateData.priceARS = await this.calculatePriceARS(variantUpdate.data.priceUSD);
              }
              const variant = await ProductVariant.findOneAndUpdate(
                { _id: variantUpdate.id, product: product._id },
                { $set: updateData },
                { new: true, session },
              );
              if (!variant) {
                throw new AppError(`Variante no encontrada: ${variantUpdate.id}`, 404, 'fail', false);
              }
              updatedVariants.push(variant);
            } else {
              // Crear nueva variante
              logger.info(`Creando nueva variante para producto ${productId}`, {
                data: variantUpdate.data,
              });

              const newVariantData = {
                product: product._id,
                color: variantUpdate.data.color,
                stock: 0, // Inicializar en 0, luego agregar stock si es necesario
                averageCostUSD: variantUpdate.data.averageCostUSD || variantUpdate.data.initialCostUSD || 0,
                priceUSD: variantUpdate.data.priceUSD,
                priceARS: await this.calculatePriceARS(variantUpdate.data.priceUSD || 0), // Precio en ARS calculado
                thumbnail: variantUpdate.data.thumbnail,
                images: variantUpdate.data.images || [],
              };
              const newVariant = await ProductVariant.create([newVariantData], {
                session,
              });
              const createdVariant = newVariant[0];
              createdVariantIds.push(createdVariant._id.toString());

              // Si se incluye stock inicial > 0, crear entrada de stock
              if (variantUpdate.data.stock && variantUpdate.data.stock > 0) {
                logger.info(`Creando stock inicial para nueva variante ${createdVariant._id}`, {
                  productId,
                  variantId: createdVariant._id,
                  stock: variantUpdate.data.stock,
                  initialCost: variantUpdate.data.initialCostUSD,
                });

                await this.inventoryService.createStockEntryWithSession(
                  createdVariant._id,
                  variantUpdate.data.stock,
                  session,
                  variantUpdate.data.initialCostUSD,
                  StockMovementReason.INITIAL_STOCK,
                  undefined, // reference
                  'Stock inicial de nueva variante',
                  undefined, // createdBy (opcional)
                );

                // Obtener la variante actualizada con stock
                const updatedVariant = await ProductVariant.findById(createdVariant._id).session(session);
                if (updatedVariant) {
                  updatedVariants.push(updatedVariant);
                } else {
                  updatedVariants.push(createdVariant);
                }
              } else {
                updatedVariants.push(createdVariant);
              }
            }
          } catch (variantError) {
            logger.error(`Error procesando variante ${i + 1}`, {
              variantId: variantUpdate.id || 'nueva',
              error: variantError,
              data: variantUpdate.data,
            });
            throw new AppError(
              `Error al procesar variante ${i + 1}: ${
                variantError instanceof Error ? variantError.message : 'Error desconocido'
              }`,
              500,
              'error',
              false,
            );
          }
        }

        // Eliminar variantes que no están en el payload enviado (eliminadas en frontend)
        const sentVariantIds = variantsDto
          .map((v) => v.id)
          .filter((id) => id)
          .concat(createdVariantIds);
        const allProductVariants = await ProductVariant.find({ product: product._id }, '_id', { session });
        const variantsToDelete = allProductVariants.filter((v) => !sentVariantIds.includes(v._id.toString()));

        if (variantsToDelete.length > 0) {
          logger.info(`Eliminando ${variantsToDelete.length} variantes no enviadas`, {
            productId,
            variantsToDelete: variantsToDelete.map((v) => v._id.toString()),
          });

          await ProductVariant.deleteMany({ _id: { $in: variantsToDelete.map((v) => v._id) } }, { session });
        }

        // Armar respuesta igual que ProductListItemDto
        const categoryInfo = this.mapCategories(product.category);
        const subcategoryInfo = this.mapSubcategory(product.subcategory);

        // Obtener todas las variantes restantes del producto (después de posibles eliminaciones)
        const remainingVariants = await ProductVariant.find({ product: product._id }, null, { session });

        return {
          id: product._id.toString(),
          slug: product.slug,
          thumbnail: product.thumbnail,
          primaryImage: product.primaryImage,
          category: categoryInfo,
          subcategory: subcategoryInfo,
          productModel: product.productModel,
          sku: product.sku,
          size: product.size ?? '', // Asignar "" por defecto para compatibilidad con productos legacy sin size
          description: product.description ?? '',
          variants: await this.mapVariants(remainingVariants),
        } as ProductListItemDto;
      });

      return result;
    } catch (error) {
      logger.error('Error al actualizar producto y variantes', {
        error,
        productId,
        productDto,
        variantsDto,
        stack: error instanceof Error ? error.stack : undefined,
      });
      throw error instanceof AppError
        ? error
        : new AppError('Error al actualizar el producto y sus variantes.', 500, 'error', false, {
            cause: error instanceof Error ? error.message : String(error),
          });
    }
  }

  public async searchProducts(q: string, inStock?: boolean): Promise<SearchProductsResponseDto> {
    try {
      const query: FilterQuery<IProductDocument> = {
        $or: [{ productModel: { $regex: q, $options: 'i' } }, { sku: { $regex: q, $options: 'i' } }],
      };

      // Si se solicita filtrar por stock, obtener productos que tienen variantes con stock
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
          return { products: [] };
        }

        // Agregar filtro de productos con stock al query principal
        query._id = { $in: filteredProductIds };
      }

      const products = await Product.find(query)
        .select('slug thumbnail primaryImage category subcategory productModel sku size description')
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
        variantsMap.set(productId.toString(), await this.mapVariants(variants as IProductVariantDocument[]));
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
          size: product.size ?? '', // Asignar "" por defecto para compatibilidad con productos legacy sin size
          description: product.description ?? '',
          variants: variantsMap.get(product._id.toString()) ?? [],
        };
      });

      // Si se solicita filtrar por stock, hacer un filtro adicional en el resultado
      // para asegurar que solo se incluyan productos con al menos una variante con stock
      if (inStock === true) {
        result = result.filter((product) => product.variants.some((variant) => variant.stock > 0));
      }

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
          .select('_id productModel sku category subcategory description')
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
            update: { $set: { priceUSD: number; priceARS: number } };
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
                update: {
                  $set: {
                    priceUSD: newPrice,
                    priceARS: await this.calculatePriceARS(newPrice),
                  },
                },
              },
            });
          } else {
            skippedVariants.push(variantUpdate);
          }
        }

        // 5. Ejecutar actualización masiva
        let totalUpdated = 0;
        if (bulkOperations.length > 0) {
          const bulkResult = await ProductVariant.bulkWrite(bulkOperations, {
            session,
          });
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

  /**
   * Actualiza el campo priceARS de todas las variantes de productos basado en la cotización actual del dólar
   */
  public async updateAllProductVariantsPriceARS(): Promise<void> {
    const dollar = await this.dollarService.getDollar();
    const dollarValue = dollar.value;

    // Usar aggregation pipeline para actualizar en bulk
    await ProductVariant.updateMany({}, [
      {
        $set: {
          priceARS: {
            $round: [{ $multiply: ['$priceUSD', dollarValue] }, 2],
          },
        },
      },
    ]);

    logger.info('Precios en ARS de todas las variantes de productos actualizados con el valor del dólar actual.', {
      dollarValue,
    });
  }
}
