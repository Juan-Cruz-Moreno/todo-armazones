// src/services/catalog.service.ts

import { FilterQuery, Types } from 'mongoose';

import Category from '@models/Category';
import Subcategory from '@models/Subcategory';
import Product from '@models/Product';
import ProductVariant from '@models/ProductVariant';
import Dollar from '@models/Dollar';

import {
  GenerateCatalogRequestDto,
  GenerateCatalogResponseDto,
  CatalogDataDto,
  CatalogCategoryDto,
  CatalogSubcategoryDto,
  CatalogProductDto,
  CatalogProductVariantDto,
  PriceAdjustmentDto,
} from '@dto/catalog.dto';

import { AppError } from '@utils/AppError';
import logger from '@config/logger';
import { generateCatalogPDF } from '@utils/catalogPdfGenerator';
import { IProductDocument } from '@models/Product';
import { IProductVariantDocument } from '@models/ProductVariant';
import { ICategoryDocument } from '@models/Category';
import { ISubcategoryDocument } from '@models/Subcategory';
import path from 'path';
import fs from 'fs';
import { getCatalogIo } from '../socket/socketManager';
import env from '@config/env';

export class CatalogService {
  private emitProgress(
    roomId: string,
    step: string,
    progress: number,
    data?: unknown,
    ack?: (response: unknown) => void,
  ) {
    logger.info('Emitting progress', { roomId, step, progress, data, timestamp: Date.now() });
    const catalogIo = getCatalogIo();
    if (catalogIo && roomId) {
      try {
        catalogIo.to(roomId).emit('catalog-progress', { step, progress, data }, ack);
        logger.info('Progress emitted successfully', { roomId, step, progress });
      } catch (error) {
        const appError = new AppError('Failed to emit progress', 500, 'error', false, {
          roomId,
          step,
          error: (error as Error).message,
        });
        logger.error('Error emitting progress', { error: appError.message, stack: appError.stack, roomId, step });
      }
    } else {
      logger.warn('Catalog IO not available or no roomId', { roomId, catalogIoAvailable: !!catalogIo });
    }
  }
  /**
   * Calcula el precio ajustado según los ajustes de precio configurados.
   * Prioridad: subcategoría específica > categoría específica > subcategoría sola > categoría sola
   */
  private calculateAdjustedPrice(
    originalPrice: number,
    categoryId: string,
    subcategoryId: string,
    priceAdjustments: PriceAdjustmentDto[] = [],
  ): number {
    if (!priceAdjustments || priceAdjustments.length === 0) return originalPrice;

    // 1. Buscar ajuste específico para esta categoría Y subcategoría
    const specificAdj = priceAdjustments.find(
      (a) =>
        a.categoryId &&
        a.subcategoryId &&
        a.categoryId.toString() === categoryId &&
        a.subcategoryId.toString() === subcategoryId,
    );
    if (specificAdj) {
      return originalPrice * (1 + specificAdj.percentageIncrease / 100);
    }

    // 2. Buscar ajuste solo por subcategoría (cualquier categoría)
    const subAdj = priceAdjustments.find(
      (a) => a.subcategoryId && !a.categoryId && a.subcategoryId.toString() === subcategoryId,
    );
    if (subAdj) {
      return originalPrice * (1 + subAdj.percentageIncrease / 100);
    }

    // 3. Buscar ajuste solo por categoría (cualquier subcategoría)
    const catAdj = priceAdjustments.find(
      (a) => a.categoryId && !a.subcategoryId && a.categoryId.toString() === categoryId,
    );
    if (catAdj) {
      return originalPrice * (1 + catAdj.percentageIncrease / 100);
    }

    return originalPrice;
  }

  private getAbsoluteImageUrl(imageUrl?: string): string {
    if (!imageUrl) {
      return 'https://via.placeholder.com/300x200/f3f4f6/6b7280?text=Sin+Imagen';
    }
    if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) return imageUrl;
    // Para rutas relativas, quitar '/' inicial si existe y agregar prefijo
    const cleanUrl = imageUrl.startsWith('/') ? imageUrl.slice(1) : imageUrl;
    return `${env.SERVER_URL}/${cleanUrl}`;
  }

  /**
   * Mapea una variante a CatalogProductVariantDto (aplica precio ajustado).
   */
  private mapVariant(
    variant: IProductVariantDocument, // Cambiado de any a IProductVariantDocument
    categoryId: string,
    subcategoryId: string,
    priceAdjustments: PriceAdjustmentDto[] = [],
  ): CatalogProductVariantDto {
    const adjustedPrice = this.calculateAdjustedPrice(variant.priceUSD, categoryId, subcategoryId, priceAdjustments);

    return {
      id: variant._id.toString(),
      color: variant.color,
      stock: variant.stock ?? 0,
      thumbnail: this.getAbsoluteImageUrl(variant.thumbnail),
      images: variant.images.map((i) => this.getAbsoluteImageUrl(i)),
      priceUSD: adjustedPrice,
      priceARS: variant.priceARS
        ? this.calculateAdjustedPrice(variant.priceARS, categoryId, subcategoryId, priceAdjustments)
        : undefined,
    };
  }

  /**
   * Mapea producto y sus variantes a CatalogProductDto.
   */
  private mapProduct(
    product: IProductDocument, // Cambiado de any a IProductDocument
    variantsForProduct: IProductVariantDocument[],
    categoryId: string,
    subcategoryId: string,
    priceAdjustments: PriceAdjustmentDto[] = [],
  ): CatalogProductDto {
    const mappedVariants = variantsForProduct.map((v) =>
      this.mapVariant(v, categoryId, subcategoryId, priceAdjustments),
    );

    return {
      id: product._id.toString(),
      slug: product.slug,
      thumbnail: this.getAbsoluteImageUrl(product.thumbnail),
      primaryImage: this.getAbsoluteImageUrl(product.primaryImage?.[0]),
      productModel: product.productModel,
      sku: product.sku,
      ...(product.size ? { size: product.size } : {}),
      variants: mappedVariants,
    };
  }

  /**
   * Genera un catálogo (PDF) y lo guarda en el servidor.
   */
  public async generateCatalog(
    catalogData: GenerateCatalogRequestDto,
    logoFile?: Express.Multer.File,
    roomId?: string,
  ): Promise<GenerateCatalogResponseDto> {
    try {
      this.emitProgress(roomId || '', 'starting', 0, { message: 'Iniciando generación de catálogo' });

      // Requerimos al menos una categoría o subcategoría
      if (!catalogData.categories?.length && !catalogData.subcategories?.length) {
        throw new AppError('Debe especificar al menos una categoría o subcategoría', 400);
      }

      this.emitProgress(roomId || '', 'validating', 10, { message: 'Validando datos de entrada' });

      // Procesar logo
      let logoUrl = 'https://i.imgur.com/nzdfwS7.png';
      if (logoFile) {
        logoUrl = this.getAbsoluteImageUrl(`/uploads/${logoFile.filename}`);
      }

      this.emitProgress(roomId || '', 'processing-logo', 20, { message: 'Procesando logo' });

      // Obtener datos del catálogo (optimizado)
      this.emitProgress(roomId || '', 'fetching-data', 30, { message: 'Consultando datos del catálogo' });
      const catalogInfo = await this.getCatalogData(catalogData);

      this.emitProgress(roomId || '', 'data-fetched', 50, { message: 'Datos obtenidos, preparando PDF' });

      // Obtener baseValue del dólar
      const dollar = await Dollar.findOne();
      const dollarBaseValue = dollar?.baseValue || 0;

      const fullCatalogData: CatalogDataDto = {
        title: 'Catálogo de Productos',
        description: 'Catálogo completo de productos disponibles',
        clientName: 'Cliente',
        logoUrl,
        generatedAt: new Date().toLocaleDateString('es-AR', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
          timeZone: 'America/Argentina/Buenos_Aires',
        }),
        ...catalogInfo,
        dollarBaseValue,
        showPrices: catalogData.showPrices ?? true,
      };

      this.emitProgress(roomId || '', 'starting-pdf', 70, { message: 'Iniciando generación de PDF' });

      // Crear callback para progreso granular del PDF
      const pdfProgressCallback = (step: string, progress: number, message: string) => {
        this.emitProgress(roomId || '', step, progress, { message });
      };

      const pdfBuffer = await generateCatalogPDF(fullCatalogData, pdfProgressCallback);

      const fileName = `catalog-${Date.now()}.pdf`;

      this.emitProgress(roomId || '', 'saving-pdf', 98, { message: 'Guardando PDF en servidor' });

      const filePath = path.join(process.cwd(), 'uploads', fileName);
      fs.writeFileSync(filePath, pdfBuffer);

      this.emitProgress(roomId || '', 'finalizing', 99, { message: 'Finalizando proceso' });

      logger.info('Catálogo generado exitosamente', {
        fileName,
        categoriesCount: catalogInfo.categories.length,
        totalProducts: catalogInfo.totalProducts,
        totalVariants: catalogInfo.totalVariants,
        priceAdjustmentsApplied: catalogData.priceAdjustments?.length || 0,
      });

      this.emitProgress(roomId || '', 'completed', 100, { fileName, message: 'Catálogo generado exitosamente' });

      return {
        message: 'Catálogo generado exitosamente',
        pdfBuffer,
        fileName,
      };
    } catch (error) {
      this.emitProgress(roomId || '', 'error', 0, { message: 'Error en generación', error: (error as Error).message });
      logger.error('Error al generar catálogo', { error, catalogData });
      throw error;
    }
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
   * Obtiene datos del catálogo de manera optimizada:
   * - 1 query para categories
   * - 1 query para subcategories
   * - 1 query para products
   * - 1 query para productVariants
   *
   * Luego arma la jerarquía en memoria.
   */
  private async getCatalogData(catalogData: GenerateCatalogRequestDto): Promise<{
    categories: CatalogCategoryDto[];
    totalProducts: number;
    totalVariants: number;
  }> {
    // Preparar filtros con tipos específicos
    const categoryFilter: FilterQuery<ICategoryDocument> = {};
    const subcategoryFilter: FilterQuery<ISubcategoryDocument> = {};
    const productFilter: FilterQuery<IProductDocument> = {};

    // Si se especifican categorías
    const categoryIds = (catalogData.categories ?? []).map((c) => (typeof c === 'string' ? new Types.ObjectId(c) : c));
    if (categoryIds.length > 0) {
      categoryFilter._id = { $in: categoryIds };
    }

    // Si se especifican subcategorías
    const subcategoryIds = (catalogData.subcategories ?? []).map((s) =>
      typeof s === 'string' ? new Types.ObjectId(s) : s,
    );
    if (subcategoryIds.length > 0) {
      subcategoryFilter._id = { $in: subcategoryIds };
    }

    // Asegurarse que las subcategorías pertenezcan a las categorías seleccionadas si ambas vienen
    if (categoryIds.length > 0) {
      subcategoryFilter.category = { $in: categoryIds };
    }

    // Para productos: prioridad a subcategorías si vienen, si no a categorías
    if (subcategoryIds.length > 0) {
      productFilter.subcategory = { $in: subcategoryIds };
    } else if (categoryIds.length > 0) {
      productFilter.category = { $in: categoryIds };
    }

    // Filtro por stock - optimizado para evitar doble filtrado
    let stockFilteredIds: Types.ObjectId[] | undefined;
    if (catalogData.inStock === true) {
      stockFilteredIds = await this.getProductsWithStock();
      if (stockFilteredIds.length === 0) {
        // Si no hay productos con stock, retornar vacío
        return {
          categories: [],
          totalProducts: 0,
          totalVariants: 0,
        };
      }
      // Intersectar con filtros existentes
      if (productFilter._id && '$in' in productFilter._id) {
        const currentIn = (productFilter._id as { $in: Types.ObjectId[] }).$in;
        productFilter._id = {
          $in: currentIn.filter((id: Types.ObjectId) => stockFilteredIds!.includes(id)),
        };
      } else {
        productFilter._id = { $in: stockFilteredIds };
      }
    }

    // --> Queries optimizadas (4 queries)
    const [categories, subcategories, products] = await Promise.all([
      Category.find(categoryFilter).lean(),
      Subcategory.find(subcategoryFilter).lean(),
      Product.find(productFilter).lean(),
    ]);

    // Si no hay productos por query anterior, intentamos obtener products restringidos por relationships:
    // (ya hicimos productFilter; si user pasó subcategories o categories, productFilter los cubre)
    // Obtener products (si no fue resuelto arriba)
    let productsList = products as IProductDocument[];

    // Si productFilter fue vacío (posible), y el usuario especificó subcategories o categories,
    // nos aseguramos de buscar productos correspondientes:
    if ((!productsList || productsList.length === 0) && (subcategoryIds.length > 0 || categoryIds.length > 0)) {
      const fallbackProductFilter: FilterQuery<IProductDocument> = {};
      if (subcategoryIds.length > 0) fallbackProductFilter.subcategory = { $in: subcategoryIds };
      else if (categoryIds.length > 0) fallbackProductFilter.category = { $in: categoryIds };
      productsList = (await Product.find(fallbackProductFilter).lean()) as IProductDocument[];
    }

    // Si no hay productsList (posible si productFilter vacío y no hay categorías/subcategorías),
    // entonces no hay nada que devolver.
    if (!productsList || productsList.length === 0) {
      return {
        categories: [],
        totalProducts: 0,
        totalVariants: 0,
      };
    }

    // Ahora obtenemos variantes para todos los productos encontrados
    const productIds = productsList.map((p) => p._id);
    const variantsList = (await ProductVariant.find({
      product: { $in: productIds },
    }).lean()) as IProductVariantDocument[];

    // Construir mapas para ensamblar la jerarquía en memoria (evitamos loops costosos)
    const subcategoriesById = new Map<string, ISubcategoryDocument>();
    for (const sc of subcategories as ISubcategoryDocument[]) {
      subcategoriesById.set(sc._id.toString(), sc);
    }

    const productsBySubcategory = new Map<string, IProductDocument[]>();
    for (const p of productsList) {
      const subId = p.subcategory?.toString();
      if (!subId) continue;
      if (!productsBySubcategory.has(subId)) productsBySubcategory.set(subId, []);
      productsBySubcategory.get(subId)!.push(p);
    }

    const variantsByProduct = new Map<string, IProductVariantDocument[]>();
    for (const v of variantsList) {
      const prodId = v.product?.toString();
      if (!prodId) continue;
      if (!variantsByProduct.has(prodId)) variantsByProduct.set(prodId, []);
      variantsByProduct.get(prodId)!.push(v);
    }

    // Ahora armar DTOs: por cada categoría, sus subcategories y productos/variants
    const catalogCategories: CatalogCategoryDto[] = [];
    let totalProducts = 0;
    let totalVariants = 0;

    // Convertir categories (puede que subcategories list esté vacía si no hay coincidencias)
    for (const category of categories as ICategoryDocument[]) {
      const categoryDto: CatalogCategoryDto = {
        id: category._id.toString(),
        slug: category.slug,
        name: category.name,
        title: category.title,
        description: category.description,
        image: this.getAbsoluteImageUrl(category.image),
        subcategories: [],
      };

      // Encontrar subcategorías que pertenezcan a esta categoría y que cumplan con filtros
      // (subcategoriesById provee las subcategorías filtradas inicialmente por subcategoryFilter)
      const subcatsForCategory: ISubcategoryDocument[] = [];
      // Si no hubo subcategories en la consulta (porque user no pidió subcategories),
      // debemos buscar las subcategorías relacionadas a la categoría entre las subcategorías de products (fallback).
      for (const scEntry of subcategoriesById.values()) {
        // subcategory.schema tiene campo category que es array
        const scCategoryField = scEntry.category;
        const scBelongsToCategory = Array.isArray(scCategoryField)
          ? scCategoryField.map((c: Types.ObjectId) => c.toString()).includes(category._id.toString())
          : (scCategoryField as Types.ObjectId)?.toString() === category._id.toString();

        if (scBelongsToCategory) subcatsForCategory.push(scEntry);
      }

      // Si no se filtraron subcategories en la consulta (user no las pasó) -> intentar inferir
      // por los productos encontrados (productos tienen subcategory field)
      if (subcatsForCategory.length === 0) {
        // reunir subcategory ids presentes en productsList que referencian esta category
        const subIdsFromProducts = new Set<string>();
        for (const p of productsList) {
          // verificar que el producto pertenezca también a esta categoría (product.category es array)
          const prodCategories = Array.isArray(p.category) ? p.category.map((c: Types.ObjectId) => c.toString()) : [];
          if (prodCategories.includes(category._id.toString())) {
            if (p.subcategory) subIdsFromProducts.add(p.subcategory.toString());
          }
        }
        // agregar subcategorías correspondientes a esos ids (si existen en DB)
        for (const id of subIdsFromProducts) {
          const sc = subcategoriesById.get(id);
          if (sc) subcatsForCategory.push(sc);
          else {
            // Si no está en subcategoriesById (porque user no pasó subcategories y no se consultaron),
            // intentar buscar en DB a la subcategoría por id
            const scFromDb = (await Subcategory.findById(id).lean()) as ISubcategoryDocument | null;
            if (scFromDb) {
              subcatsForCategory.push(scFromDb);
              subcategoriesById.set(scFromDb._id.toString(), scFromDb);
            }
          }
        }
      }

      // Para cada subcategoría de esta categoría armar productos
      for (const subcategory of subcatsForCategory) {
        // Si el usuario pidió subcategories específicas y esta subcategory no está en ese set => saltar
        if (
          subcategoryIds.length > 0 &&
          !subcategoryIds.map((s) => s.toString()).includes(subcategory._id.toString())
        ) {
          continue;
        }

        const subcategoryDto: CatalogSubcategoryDto = {
          id: subcategory._id.toString(),
          slug: subcategory.slug,
          name: subcategory.name,
          title: subcategory.title,
          description: subcategory.description,
          image: this.getAbsoluteImageUrl(subcategory.image),
          products: [],
        };

        // Obtener productos para esta subcategory (según productsBySubcategory)
        const productsForSub = productsBySubcategory.get(subcategory._id.toString()) ?? [];

        for (const product of productsForSub) {
          // Verificar que el producto pertenezca a la categoría actual (product.category es array)
          const prodCategories = Array.isArray(product.category)
            ? product.category.map((c: Types.ObjectId) => c.toString())
            : product.category
              ? [(product.category as Types.ObjectId).toString()]
              : [];

          if (!prodCategories.includes(category._id.toString())) {
            // Si no pertenece a esta categoría, lo saltamos
            continue;
          }

          const productVariants = variantsByProduct.get(product._id.toString()) ?? [];

          // Construir DTO solo si tiene variantes (si no, lo ignoro)
          if (productVariants.length === 0) continue;

          const productDto = this.mapProduct(
            product,
            productVariants,
            category._id.toString(),
            subcategory._id.toString(),
            catalogData.priceAdjustments ?? [],
          );

          subcategoryDto.products.push(productDto);
          totalProducts++;
          totalVariants += productDto.variants.length;
        }

        if (subcategoryDto.products.length > 0) {
          categoryDto.subcategories.push(subcategoryDto);
        }
      }

      if (categoryDto.subcategories.length > 0) {
        catalogCategories.push(categoryDto);
      }
    }

    return {
      categories: catalogCategories,
      totalProducts,
      totalVariants,
    };
  }
}

export default CatalogService;
