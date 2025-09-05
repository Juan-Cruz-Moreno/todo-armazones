import { PipelineStage } from 'mongoose';
import ProductVariant from '@models/ProductVariant';

// Interface para métricas de stock
export interface IStockAnalyticsMetrics {
  totalItems: number; // Total de items en stock
  totalValuationAtCost: number; // Valuación total al costo (averageCostUSD * stock)
  totalValuationAtRetail: number; // Valuación total al precio retail (priceUSD * stock)
  averageCostPerItem: number; // Costo promedio por item
  averageRetailPerItem: number; // Precio retail promedio por item
  profitMarginTotal: number; // Margen de ganancia total (retail - cost)
  profitMarginPercentage: number; // Porcentaje de margen de ganancia
}

// Interface para resultado de agregación de stock
export interface IStockAggregationResult {
  _id: null;
  totalItems: number;
  totalValuationAtCost: number;
  totalValuationAtRetail: number;
  averageCostPerItem: number;
  averageRetailPerItem: number;
}

// Interface para analytics por producto
export interface IProductStockAnalytics {
  productId: string;
  productModel: string;
  sku: string;
  slug: string;
  variants: Array<{
    variantId: string;
    color: {
      name: string;
      hex: string;
    };
    stock: number;
    averageCostUSD: number;
    priceUSD: number;
    valuationAtCost: number;
    valuationAtRetail: number;
  }>;
  totalStock: number;
  totalValuationAtCost: number;
  totalValuationAtRetail: number;
}

// Interface para analytics por subcategoría
export interface ISubcategoryStockAnalytics {
  subcategoryId: string;
  subcategoryName: string;
  totalStock: number;
  totalValuationAtCost: number;
  totalValuationAtRetail: number;
  productCount: number;
  variantCount: number;
}

// Interface para analytics mixtas de categoría y subcategoría
export interface ICategorySubcategoryStockAnalytics {
  categoryId: string;
  categoryName: string;
  subcategories: Array<{
    subcategoryId: string;
    subcategoryName: string;
    totalStock: number;
    totalValuationAtCost: number;
    totalValuationAtRetail: number;
    productCount: number;
    variantCount: number;
  }>;
  categoryTotals: {
    totalStock: number;
    totalValuationAtCost: number;
    totalValuationAtRetail: number;
    productCount: number;
    variantCount: number;
  };
}

/**
 * Servicio para analytics de stock y valuación de inventario
 */
export class StockAnalyticsService {
  /**
   * Obtiene las métricas totales de valuación de stock
   */
  public async getTotalStockValuation(): Promise<IStockAnalyticsMetrics> {
    const pipeline: PipelineStage[] = [
      {
        $match: {
          stock: { $gt: 0 }, // Solo variantes con stock positivo
        },
      },
      {
        $group: {
          _id: null,
          totalItems: { $sum: '$stock' },
          totalValuationAtCost: {
            $sum: { $multiply: ['$stock', '$averageCostUSD'] },
          },
          totalValuationAtRetail: {
            $sum: { $multiply: ['$stock', '$priceUSD'] },
          },
          totalCostSum: { $sum: { $multiply: ['$stock', '$averageCostUSD'] } },
          totalRetailSum: { $sum: { $multiply: ['$stock', '$priceUSD'] } },
          totalStockForAverage: { $sum: '$stock' },
        },
      },
      {
        $project: {
          totalItems: 1,
          totalValuationAtCost: 1,
          totalValuationAtRetail: 1,
          averageCostPerItem: {
            $cond: {
              if: { $gt: ['$totalStockForAverage', 0] },
              then: { $divide: ['$totalCostSum', '$totalStockForAverage'] },
              else: 0,
            },
          },
          averageRetailPerItem: {
            $cond: {
              if: { $gt: ['$totalStockForAverage', 0] },
              then: { $divide: ['$totalRetailSum', '$totalStockForAverage'] },
              else: 0,
            },
          },
        },
      },
    ];

    const results = await ProductVariant.aggregate<IStockAggregationResult>(pipeline);
    const data = results[0];

    if (!data) {
      return this.createEmptyMetrics();
    }

    const totalValuationAtCost = this.roundToTwoDecimals(data.totalValuationAtCost || 0);
    const totalValuationAtRetail = this.roundToTwoDecimals(data.totalValuationAtRetail || 0);
    const profitMarginTotal = this.roundToTwoDecimals(totalValuationAtRetail - totalValuationAtCost);
    const profitMarginPercentage =
      totalValuationAtCost > 0 ? this.roundToTwoDecimals((profitMarginTotal / totalValuationAtCost) * 100) : 0;

    return {
      totalItems: data.totalItems || 0,
      totalValuationAtCost,
      totalValuationAtRetail,
      averageCostPerItem: this.roundToTwoDecimals(data.averageCostPerItem || 0),
      averageRetailPerItem: this.roundToTwoDecimals(data.averageRetailPerItem || 0),
      profitMarginTotal,
      profitMarginPercentage,
    };
  }

  /**
   * Obtiene analytics de stock agrupado por producto
   */
  public async getStockAnalyticsByProduct(limit: number = 50, offset: number = 0): Promise<IProductStockAnalytics[]> {
    const pipeline: PipelineStage[] = [
      {
        $match: {
          stock: { $gt: 0 }, // Solo variantes con stock
        },
      },
      {
        $lookup: {
          from: 'products',
          localField: 'product',
          foreignField: '_id',
          as: 'productInfo',
        },
      },
      {
        $unwind: '$productInfo',
      },
      {
        $group: {
          _id: '$product',
          productModel: { $first: '$productInfo.productModel' },
          sku: { $first: '$productInfo.sku' },
          slug: { $first: '$productInfo.slug' },
          variants: {
            $push: {
              variantId: '$_id',
              color: '$color',
              stock: '$stock',
              averageCostUSD: '$averageCostUSD',
              priceUSD: '$priceUSD',
              valuationAtCost: { $multiply: ['$stock', '$averageCostUSD'] },
              valuationAtRetail: { $multiply: ['$stock', '$priceUSD'] },
            },
          },
          totalStock: { $sum: '$stock' },
          totalValuationAtCost: {
            $sum: { $multiply: ['$stock', '$averageCostUSD'] },
          },
          totalValuationAtRetail: {
            $sum: { $multiply: ['$stock', '$priceUSD'] },
          },
        },
      },
      {
        $sort: { totalValuationAtRetail: -1 }, // Ordenar por mayor valuación retail
      },
      {
        $skip: offset,
      },
      {
        $limit: limit,
      },
      {
        $project: {
          productId: { $toString: '$_id' },
          productModel: 1,
          sku: 1,
          slug: 1,
          variants: {
            $map: {
              input: '$variants',
              as: 'variant',
              in: {
                variantId: { $toString: '$$variant.variantId' },
                color: '$$variant.color',
                stock: '$$variant.stock',
                averageCostUSD: { $round: ['$$variant.averageCostUSD', 2] },
                priceUSD: { $round: ['$$variant.priceUSD', 2] },
                valuationAtCost: { $round: ['$$variant.valuationAtCost', 2] },
                valuationAtRetail: { $round: ['$$variant.valuationAtRetail', 2] },
              },
            },
          },
          totalStock: 1,
          totalValuationAtCost: { $round: ['$totalValuationAtCost', 2] },
          totalValuationAtRetail: { $round: ['$totalValuationAtRetail', 2] },
        },
      },
    ];

    return await ProductVariant.aggregate<IProductStockAnalytics>(pipeline);
  }

  /**
   * Obtiene los productos con menor stock (alertas de inventario bajo)
   */
  public async getLowStockAlerts(
    threshold: number = 10,
    limit: number = 20,
  ): Promise<
    Array<{
      productId: string;
      productModel: string;
      sku: string;
      slug: string;
      variantId: string;
      color: { name: string; hex: string };
      stock: number;
      averageCostUSD: number;
      priceUSD: number;
    }>
  > {
    const pipeline: PipelineStage[] = [
      {
        $match: {
          stock: { $lte: threshold, $gt: 0 },
        },
      },
      {
        $lookup: {
          from: 'products',
          localField: 'product',
          foreignField: '_id',
          as: 'productInfo',
        },
      },
      {
        $unwind: '$productInfo',
      },
      {
        $sort: { stock: 1 }, // Ordenar por menor stock primero
      },
      {
        $limit: limit,
      },
      {
        $project: {
          productId: { $toString: '$product' },
          productModel: '$productInfo.productModel',
          sku: '$productInfo.sku',
          slug: '$productInfo.slug',
          variantId: { $toString: '$_id' },
          color: '$color',
          stock: 1,
          averageCostUSD: { $round: ['$averageCostUSD', 2] },
          priceUSD: { $round: ['$priceUSD', 2] },
        },
      },
    ];

    return await ProductVariant.aggregate(pipeline);
  }

  /**
   * Obtiene métricas de stock por categoría
   */
  public async getStockAnalyticsByCategory(): Promise<
    Array<{
      categoryId: string;
      categoryName: string;
      totalStock: number;
      totalValuationAtCost: number;
      totalValuationAtRetail: number;
      productCount: number;
      variantCount: number;
    }>
  > {
    const pipeline: PipelineStage[] = [
      {
        $match: {
          stock: { $gt: 0 },
        },
      },
      {
        $lookup: {
          from: 'products',
          localField: 'product',
          foreignField: '_id',
          as: 'productInfo',
        },
      },
      {
        $unwind: '$productInfo',
      },
      {
        $unwind: '$productInfo.category',
      },
      {
        $lookup: {
          from: 'categories',
          localField: 'productInfo.category',
          foreignField: '_id',
          as: 'categoryInfo',
        },
      },
      {
        $unwind: '$categoryInfo',
      },
      {
        $group: {
          _id: '$productInfo.category',
          categoryName: { $first: '$categoryInfo.name' },
          totalStock: { $sum: '$stock' },
          totalValuationAtCost: {
            $sum: { $multiply: ['$stock', '$averageCostUSD'] },
          },
          totalValuationAtRetail: {
            $sum: { $multiply: ['$stock', '$priceUSD'] },
          },
          products: { $addToSet: '$product' },
          variantCount: { $sum: 1 },
        },
      },
      {
        $project: {
          categoryId: { $toString: '$_id' },
          categoryName: 1,
          totalStock: 1,
          totalValuationAtCost: { $round: ['$totalValuationAtCost', 2] },
          totalValuationAtRetail: { $round: ['$totalValuationAtRetail', 2] },
          productCount: { $size: '$products' },
          variantCount: 1,
        },
      },
      {
        $sort: { totalValuationAtRetail: -1 },
      },
    ];

    return await ProductVariant.aggregate(pipeline);
  }

  /**
   * Obtiene métricas de stock por subcategoría
   */
  public async getStockAnalyticsBySubcategory(): Promise<ISubcategoryStockAnalytics[]> {
    const pipeline: PipelineStage[] = [
      {
        $match: {
          stock: { $gt: 0 },
        },
      },
      {
        $lookup: {
          from: 'products',
          localField: 'product',
          foreignField: '_id',
          as: 'productInfo',
        },
      },
      {
        $unwind: '$productInfo',
      },
      {
        $lookup: {
          from: 'subcategories',
          localField: 'productInfo.subcategory',
          foreignField: '_id',
          as: 'subcategoryInfo',
        },
      },
      {
        $unwind: '$subcategoryInfo',
      },
      {
        $group: {
          _id: '$productInfo.subcategory',
          subcategoryName: { $first: '$subcategoryInfo.name' },
          totalStock: { $sum: '$stock' },
          totalValuationAtCost: {
            $sum: { $multiply: ['$stock', '$averageCostUSD'] },
          },
          totalValuationAtRetail: {
            $sum: { $multiply: ['$stock', '$priceUSD'] },
          },
          products: { $addToSet: '$product' },
          variantCount: { $sum: 1 },
        },
      },
      {
        $project: {
          subcategoryId: { $toString: '$_id' },
          subcategoryName: 1,
          totalStock: 1,
          totalValuationAtCost: { $round: ['$totalValuationAtCost', 2] },
          totalValuationAtRetail: { $round: ['$totalValuationAtRetail', 2] },
          productCount: { $size: '$products' },
          variantCount: 1,
        },
      },
      {
        $sort: { totalValuationAtRetail: -1 },
      },
    ];

    return await ProductVariant.aggregate<ISubcategoryStockAnalytics>(pipeline);
  }

  /**
   * Obtiene métricas de stock con vista jerárquica: categorías con sus subcategorías
   */
  public async getStockAnalyticsByCategoryWithSubcategories(): Promise<ICategorySubcategoryStockAnalytics[]> {
    const pipeline: PipelineStage[] = [
      {
        $match: {
          stock: { $gt: 0 },
        },
      },
      {
        $lookup: {
          from: 'products',
          localField: 'product',
          foreignField: '_id',
          as: 'productInfo',
        },
      },
      {
        $unwind: '$productInfo',
      },
      {
        $unwind: '$productInfo.category',
      },
      {
        $lookup: {
          from: 'categories',
          localField: 'productInfo.category',
          foreignField: '_id',
          as: 'categoryInfo',
        },
      },
      {
        $unwind: '$categoryInfo',
      },
      {
        $lookup: {
          from: 'subcategories',
          localField: 'productInfo.subcategory',
          foreignField: '_id',
          as: 'subcategoryInfo',
        },
      },
      {
        $unwind: '$subcategoryInfo',
      },
      // Agrupar por categoría y subcategoría
      {
        $group: {
          _id: {
            categoryId: '$productInfo.category',
            subcategoryId: '$productInfo.subcategory',
          },
          categoryName: { $first: '$categoryInfo.name' },
          subcategoryName: { $first: '$subcategoryInfo.name' },
          totalStock: { $sum: '$stock' },
          totalValuationAtCost: {
            $sum: { $multiply: ['$stock', '$averageCostUSD'] },
          },
          totalValuationAtRetail: {
            $sum: { $multiply: ['$stock', '$priceUSD'] },
          },
          products: { $addToSet: '$product' },
          variantCount: { $sum: 1 },
        },
      },
      // Agrupar por categoría para obtener la estructura jerárquica
      {
        $group: {
          _id: '$_id.categoryId',
          categoryName: { $first: '$categoryName' },
          subcategories: {
            $push: {
              subcategoryId: { $toString: '$_id.subcategoryId' },
              subcategoryName: '$subcategoryName',
              totalStock: '$totalStock',
              totalValuationAtCost: { $round: ['$totalValuationAtCost', 2] },
              totalValuationAtRetail: { $round: ['$totalValuationAtRetail', 2] },
              productCount: { $size: '$products' },
              variantCount: '$variantCount',
            },
          },
          // Calcular totales por categoría
          categoryTotalStock: { $sum: '$totalStock' },
          categoryTotalValuationAtCost: { $sum: '$totalValuationAtCost' },
          categoryTotalValuationAtRetail: { $sum: '$totalValuationAtRetail' },
          categoryProducts: { $push: '$products' },
          categoryVariantCount: { $sum: '$variantCount' },
        },
      },
      {
        $project: {
          categoryId: { $toString: '$_id' },
          categoryName: 1,
          subcategories: {
            $sortArray: {
              input: '$subcategories',
              sortBy: { totalValuationAtRetail: -1 },
            },
          },
          categoryTotals: {
            totalStock: '$categoryTotalStock',
            totalValuationAtCost: { $round: ['$categoryTotalValuationAtCost', 2] },
            totalValuationAtRetail: { $round: ['$categoryTotalValuationAtRetail', 2] },
            productCount: {
              $size: {
                $reduce: {
                  input: '$categoryProducts',
                  initialValue: [],
                  in: { $setUnion: ['$$value', '$$this'] },
                },
              },
            },
            variantCount: '$categoryVariantCount',
          },
        },
      },
      {
        $sort: { 'categoryTotals.totalValuationAtRetail': -1 },
      },
    ];

    return await ProductVariant.aggregate<ICategorySubcategoryStockAnalytics>(pipeline);
  }

  /**
   * Crea métricas vacías cuando no hay datos
   */
  private createEmptyMetrics(): IStockAnalyticsMetrics {
    return {
      totalItems: 0,
      totalValuationAtCost: 0,
      totalValuationAtRetail: 0,
      averageCostPerItem: 0,
      averageRetailPerItem: 0,
      profitMarginTotal: 0,
      profitMarginPercentage: 0,
    };
  }

  /**
   * Redondea números a 2 decimales
   */
  private roundToTwoDecimals(value: number): number {
    return Math.round(value * 100) / 100;
  }
}
