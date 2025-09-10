// src/services/catalog.service.ts

import path from 'path';
import fs from 'fs';
import { FilterQuery, Types } from 'mongoose';

import Category from '@models/Category';
import Subcategory from '@models/Subcategory';
import Product from '@models/Product';
import ProductVariant from '@models/ProductVariant';

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
import env from '@config/env';
import transporter from '@config/nodemailer.config';
import { IProductDocument } from '@models/Product';
import { IProductVariantDocument } from '@models/ProductVariant';
import { ICategoryDocument } from '@models/Category';
import { ISubcategoryDocument } from '@models/Subcategory';

export class CatalogService {
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

  /**
   * Convierte ruta/imagen relativa a URL absoluta usando el prefijo fijo.
   * Devuelve placeholder si no hay imagen.
   */
  private getAbsoluteImageUrl(imageUrl?: string): string {
    if (!imageUrl) {
      return 'https://via.placeholder.com/300x200/f3f4f6/6b7280?text=Sin+Imagen';
    }
    if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) return imageUrl;
    // Para rutas relativas, quitar '/' inicial si existe y agregar prefijo
    const cleanUrl = imageUrl.startsWith('/') ? imageUrl.slice(1) : imageUrl;
    return `https://api.todoarmazonesarg.com/${cleanUrl}`;
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
      primaryImage: this.getAbsoluteImageUrl(product.primaryImage),
      productModel: product.productModel,
      sku: product.sku,
      ...(product.size ? { size: product.size } : {}),
      variants: mappedVariants,
    };
  }

  /**
   * Genera un catálogo (PDF) y lo envia por email. Mantiene el comportamiento
   * de tu método original (guardado en uploads, adjunto por email).
   */
  public async generateCatalog(
    catalogData: GenerateCatalogRequestDto,
    logoFile?: Express.Multer.File,
  ): Promise<GenerateCatalogResponseDto> {
    try {
      // Requerimos al menos una categoría o subcategoría
      if (!catalogData.categories?.length && !catalogData.subcategories?.length) {
        throw new AppError('Debe especificar al menos una categoría o subcategoría', 400);
      }

      if (!catalogData.email) {
        throw new AppError('El email es requerido', 400);
      }

      // Procesar logo
      let logoUrl = 'https://i.imgur.com/nzdfwS7.png';
      if (logoFile) {
        logoUrl = this.getAbsoluteImageUrl(`/uploads/${logoFile.filename}`);
      }

      // Obtener datos del catálogo (optimizado)
      const catalogInfo = await this.getCatalogData(catalogData);

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
      };

      const pdfBuffer = await generateCatalogPDF(fullCatalogData);

      // Guardar en uploads
      const uploadsPath = path.join(process.cwd(), 'uploads');
      if (!fs.existsSync(uploadsPath)) fs.mkdirSync(uploadsPath, { recursive: true });

      const fileName = `catalog-${Date.now()}.pdf`;
      const filePath = path.join(uploadsPath, fileName);
      fs.writeFileSync(filePath, pdfBuffer);

      // Enviar email con adjunto
      await transporter.sendMail({
        from: `Todo Armazones Argentina <${env.EMAIL_USER}>`,
        to: catalogData.email,
        subject: 'Tu catálogo de productos está listo',
        // @ts-expect-error plantilla handlebars en transporter
        template: 'catalog-email',
        context: {
          logoUrl,
          generatedAt: fullCatalogData.generatedAt,
          categoriesCount: catalogInfo.categories.length,
          totalProducts: catalogInfo.totalProducts,
          totalVariants: catalogInfo.totalVariants,
        },
        attachments: [
          {
            filename: fileName,
            content: pdfBuffer,
            contentType: 'application/pdf',
          },
        ],
      });

      logger.info('Catálogo generado y enviado exitosamente', {
        fileName,
        email: catalogData.email,
        categoriesCount: catalogInfo.categories.length,
        totalProducts: catalogInfo.totalProducts,
        totalVariants: catalogInfo.totalVariants,
        priceAdjustmentsApplied: catalogData.priceAdjustments?.length || 0,
      });

      return {
        message: 'Catálogo generado y enviado por email exitosamente',
        pdfUrl: `/uploads/${fileName}`,
        fileName,
      };
    } catch (error) {
      logger.error('Error al generar catálogo', { error, catalogData });
      throw error;
    }
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

    // Si no hay productsList (posible si productFilter vacío y no hay categories/subcategories),
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
