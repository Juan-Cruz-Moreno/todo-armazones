import StockMovement from '@models/StockMovement';
import ProductVariant from '@models/ProductVariant';
import {
  CreateStockEntryRequestDto,
  CreateStockEntryResponseDto,
  StockMovementListItemDto,
  StockMovementHistoryResponseDto,
  ProductVariantStockSummaryDto,
} from '@dto/stock-movement.dto';
import { StockMovementType, StockMovementReason } from '@interfaces/stockMovement';
import { withTransaction } from '@helpers/withTransaction';
import { AppError } from '@utils/AppError';
import logger from '@config/logger';
import { Types } from 'mongoose';
import mongoose from 'mongoose';
import { ExpenseService } from './expense.service';

// Tipo para el movimiento de stock con poblaciones (usando lean())
type PopulatedStockMovement = {
  _id: Types.ObjectId;
  productVariant: {
    _id: Types.ObjectId;
    color: { name: string; hex: string };
    product: {
      _id: Types.ObjectId;
      productModel: string;
      sku: string;
    };
  };
  type: StockMovementType;
  reason: StockMovementReason;
  quantity: number;
  unitCost: number;
  totalCost: number;
  previousStock: number;
  newStock: number;
  previousAvgCost: number;
  newAvgCost: number;
  reference?: string;
  notes?: string;
  createdBy?: {
    _id: Types.ObjectId;
    displayName: string;
    email: string;
  };
  createdAt: Date;
  updatedAt: Date;
};

// Tipo para ProductVariant con campos específicos usando lean()
type ProductVariantLean = {
  _id: Types.ObjectId;
  color: { name: string; hex: string };
  stock: number;
  averageCostUSD: number;
};

// Tipo para StockMovement con campos específicos usando lean()
type StockMovementLean = {
  _id: Types.ObjectId;
  createdAt: Date;
  type: StockMovementType;
  quantity: number;
};

export class InventoryService {
  private expenseService = new ExpenseService();

  /**
   * Calcula el nuevo costo promedio ponderado
   */
  private calculateWeightedAverageCost(
    currentStock: number,
    currentAvgCost: number,
    newQuantity: number,
    newUnitCost: number,
  ): number {
    if (currentStock === 0) {
      return newUnitCost;
    }

    const totalCurrentValue = currentStock * currentAvgCost;
    const totalNewValue = newQuantity * newUnitCost;
    const totalStock = currentStock + newQuantity;

    return (totalCurrentValue + totalNewValue) / totalStock;
  }

  /**
   * Crea una entrada de stock con lógica de CPP selectiva
   */
  public async createStockEntry(
    dto: CreateStockEntryRequestDto,
    createdBy?: Types.ObjectId,
  ): Promise<CreateStockEntryResponseDto> {
    try {
      const result = await withTransaction(async (session) => {
        // Obtener la variante actual
        const productVariant = await ProductVariant.findById(dto.productVariantId).session(session);
        if (!productVariant) {
          throw new AppError(`Variante de producto no encontrada: ${dto.productVariantId}`, 404);
        }

        // Determinar si se debe calcular CPP y validar unitCost
        const shouldCalculateCPP =
          dto.reason === StockMovementReason.PURCHASE || dto.reason === StockMovementReason.INITIAL_STOCK;

        let unitCost: number;
        let newAvgCost: number;

        if (shouldCalculateCPP) {
          // Para PURCHASE e INITIAL_STOCK, se requiere unitCost y se calcula CPP
          if (dto.unitCost === undefined || dto.unitCost === null) {
            throw new AppError(`El costo unitario es requerido para movimientos de tipo ${dto.reason}`, 400);
          }
          unitCost = dto.unitCost;
          newAvgCost = this.calculateWeightedAverageCost(
            productVariant.stock,
            productVariant.averageCostUSD,
            dto.quantity,
            unitCost,
          );
        } else {
          // Para RETURN e INVENTORY_ADJUSTMENT, usar el costo promedio actual
          unitCost = productVariant.averageCostUSD;
          newAvgCost = productVariant.averageCostUSD; // No cambia el CPP
        }

        const previousStock = productVariant.stock;
        const newStock = previousStock + dto.quantity;
        const totalCost = dto.quantity * unitCost;

        // Crear el movimiento de stock
        const stockMovement = new StockMovement({
          productVariant: dto.productVariantId,
          type: StockMovementType.ENTRY,
          reason: dto.reason,
          quantity: dto.quantity,
          unitCost,
          totalCost,
          previousStock,
          newStock,
          previousAvgCost: productVariant.averageCostUSD,
          newAvgCost,
          reference: dto.reference,
          notes: dto.notes,
          createdBy,
        });

        await stockMovement.save({ session });

        // Actualizar la variante del producto
        await ProductVariant.findByIdAndUpdate(
          dto.productVariantId,
          {
            stock: newStock,
            averageCostUSD: newAvgCost,
          },
          { session },
        );

        return {
          id: stockMovement._id.toString(),
          productVariantId: stockMovement.productVariant.toString(),
          type: stockMovement.type,
          reason: stockMovement.reason,
          quantity: stockMovement.quantity,
          unitCost: stockMovement.unitCost,
          totalCost: stockMovement.totalCost,
          previousStock: stockMovement.previousStock,
          newStock: stockMovement.newStock,
          previousAvgCost: stockMovement.previousAvgCost,
          newAvgCost: stockMovement.newAvgCost,
          reference: stockMovement.reference,
          notes: stockMovement.notes,
          createdAt: stockMovement.createdAt,
        };
      });

      return result;
    } catch (error: unknown) {
      logger.error('Error creating stock entry', {
        error,
        dto,
      });

      throw error instanceof AppError
        ? error
        : new AppError('Error al crear entrada de stock.', 500, 'error', false, {
            cause: error instanceof Error ? error.message : String(error),
          });
    }
  }

  /**
   * Crear una salida de stock (venta) - no afecta el CPP, solo reduce stock
   * Versión que acepta una sesión de transacción externa
   */
  public async createStockExitWithSession(
    productVariantId: Types.ObjectId,
    quantity: number,
    session: mongoose.ClientSession,
    reason: StockMovementReason = StockMovementReason.SALE,
    reference?: string,
    notes?: string,
    createdBy?: Types.ObjectId,
  ): Promise<void> {
    // Obtener la variante actual
    const productVariant = await ProductVariant.findById(productVariantId).session(session);
    if (!productVariant) {
      throw new AppError(`Variante de producto no encontrada: ${productVariantId}`, 404);
    }

    if (productVariant.stock < quantity) {
      throw new AppError(
        `Stock insuficiente. Stock actual: ${productVariant.stock}, cantidad solicitada: ${quantity}`,
        400,
      );
    }

    const previousStock = productVariant.stock;
    const newStock = previousStock - quantity;
    const unitCost = productVariant.averageCostUSD; // Se usa el costo promedio actual
    const totalCost = quantity * unitCost;

    // Crear el movimiento de stock
    const stockMovement = new StockMovement({
      productVariant: productVariantId,
      type: StockMovementType.EXIT,
      reason,
      quantity: -quantity, // Negativo para salidas
      unitCost,
      totalCost: -totalCost, // Negativo para salidas
      previousStock,
      newStock,
      previousAvgCost: productVariant.averageCostUSD,
      newAvgCost: productVariant.averageCostUSD, // No cambia en salidas
      reference,
      notes,
      createdBy,
    });

    await stockMovement.save({ session });

    // Actualizar solo el stock (el costo promedio no cambia en salidas)
    await ProductVariant.findByIdAndUpdate(productVariantId, { stock: newStock }, { session });

    // Si es DAMAGE o THEFT, crear gasto automáticamente
    if (reason === StockMovementReason.DAMAGE || reason === StockMovementReason.THEFT) {
      const expenseAmount = Math.abs(totalCost); // Usar valor absoluto del costo total
      const expenseDescription =
        reason === StockMovementReason.DAMAGE
          ? `Pérdida por daño de stock - ${quantity} unidades`
          : `Pérdida por robo de stock - ${quantity} unidades`;

      try {
        await this.expenseService.createStockExpense(
          stockMovement._id,
          reason,
          expenseAmount,
          expenseDescription,
          createdBy,
        );
      } catch (expenseError) {
        // Log del error pero no fallar la transacción principal
        logger.error('Error creating automatic expense for stock movement', {
          stockMovementId: stockMovement._id,
          reason,
          expenseAmount,
          error: expenseError,
        });
      }
    }
  }

  /**
   * Crear una entrada de stock con sesión externa y lógica de CPP selectiva
   * Versión que acepta una sesión de transacción externa
   */
  public async createStockEntryWithSession(
    productVariantId: Types.ObjectId,
    quantity: number,
    session: mongoose.ClientSession,
    unitCost?: number,
    reason: StockMovementReason = StockMovementReason.RETURN,
    reference?: string,
    notes?: string,
    createdBy?: Types.ObjectId,
  ): Promise<void> {
    // Obtener la variante actual
    const productVariant = await ProductVariant.findById(productVariantId).session(session);
    if (!productVariant) {
      throw new AppError(`Variante de producto no encontrada: ${productVariantId}`, 404);
    }

    // Determinar si se debe calcular CPP y validar unitCost
    const shouldCalculateCPP = reason === StockMovementReason.PURCHASE || reason === StockMovementReason.INITIAL_STOCK;

    let finalUnitCost: number;
    let newAvgCost: number;

    if (shouldCalculateCPP) {
      // Para PURCHASE e INITIAL_STOCK, se requiere unitCost y se calcula CPP
      if (unitCost === undefined || unitCost === null) {
        throw new AppError(`El costo unitario es requerido para movimientos de tipo ${reason}`, 400);
      }
      finalUnitCost = unitCost;
      newAvgCost = this.calculateWeightedAverageCost(
        productVariant.stock,
        productVariant.averageCostUSD,
        quantity,
        finalUnitCost,
      );
    } else {
      // Para RETURN e INVENTORY_ADJUSTMENT, usar el costo promedio actual
      finalUnitCost = productVariant.averageCostUSD;
      newAvgCost = productVariant.averageCostUSD; // No cambia el CPP
    }

    const previousStock = productVariant.stock;
    const newStock = previousStock + quantity;
    const totalCost = quantity * finalUnitCost;

    // Crear el movimiento de stock
    const stockMovement = new StockMovement({
      productVariant: productVariantId,
      type: StockMovementType.ENTRY,
      reason,
      quantity,
      unitCost: finalUnitCost,
      totalCost,
      previousStock,
      newStock,
      previousAvgCost: productVariant.averageCostUSD,
      newAvgCost,
      reference,
      notes,
      createdBy,
    });

    await stockMovement.save({ session });

    // Actualizar la variante del producto
    await ProductVariant.findByIdAndUpdate(
      productVariantId,
      {
        stock: newStock,
        averageCostUSD: newAvgCost,
      },
      { session },
    );
  }
  public async createStockExit(
    productVariantId: Types.ObjectId,
    quantity: number,
    reason: StockMovementReason = StockMovementReason.SALE,
    reference?: string,
    notes?: string,
    createdBy?: Types.ObjectId,
  ): Promise<CreateStockEntryResponseDto> {
    try {
      const result = await withTransaction(async (session) => {
        // Obtener la variante actual
        const productVariant = await ProductVariant.findById(productVariantId).session(session);
        if (!productVariant) {
          throw new AppError(`Variante de producto no encontrada: ${productVariantId}`, 404);
        }

        if (productVariant.stock < quantity) {
          throw new AppError(
            `Stock insuficiente. Stock actual: ${productVariant.stock}, cantidad solicitada: ${quantity}`,
            400,
          );
        }

        const previousStock = productVariant.stock;
        const newStock = previousStock - quantity;
        const unitCost = productVariant.averageCostUSD; // Se usa el costo promedio actual
        const totalCost = quantity * unitCost;

        // Crear el movimiento de stock
        const stockMovement = new StockMovement({
          productVariant: productVariantId,
          type: StockMovementType.EXIT,
          reason,
          quantity: -quantity, // Negativo para salidas
          unitCost,
          totalCost: -totalCost, // Negativo para salidas
          previousStock,
          newStock,
          previousAvgCost: productVariant.averageCostUSD,
          newAvgCost: productVariant.averageCostUSD, // No cambia en salidas
          reference,
          notes,
          createdBy,
        });

        await stockMovement.save({ session });

        // Actualizar solo el stock (el costo promedio no cambia en salidas)
        await ProductVariant.findByIdAndUpdate(productVariantId, { stock: newStock }, { session });

        // Si es DAMAGE o THEFT, crear gasto automáticamente
        if (reason === StockMovementReason.DAMAGE || reason === StockMovementReason.THEFT) {
          const expenseAmount = Math.abs(totalCost); // Usar valor absoluto del costo total
          const expenseDescription =
            reason === StockMovementReason.DAMAGE
              ? `Pérdida por daño de stock - ${quantity} unidades`
              : `Pérdida por robo de stock - ${quantity} unidades`;

          try {
            await this.expenseService.createStockExpense(
              stockMovement._id,
              reason,
              expenseAmount,
              expenseDescription,
              createdBy,
            );
          } catch (expenseError) {
            // Log del error pero no fallar la transacción principal
            logger.error('Error creating automatic expense for stock movement', {
              stockMovementId: stockMovement._id,
              reason,
              expenseAmount,
              error: expenseError,
            });
          }
        }

        return {
          id: stockMovement._id.toString(),
          productVariantId: stockMovement.productVariant.toString(),
          type: stockMovement.type,
          reason: stockMovement.reason,
          quantity: stockMovement.quantity,
          unitCost: stockMovement.unitCost,
          totalCost: stockMovement.totalCost,
          previousStock: stockMovement.previousStock,
          newStock: stockMovement.newStock,
          previousAvgCost: stockMovement.previousAvgCost,
          newAvgCost: stockMovement.newAvgCost,
          reference: stockMovement.reference,
          notes: stockMovement.notes,
          createdAt: stockMovement.createdAt,
        };
      });

      return result;
    } catch (error: unknown) {
      logger.error('Error creating stock exit', {
        error,
        productVariantId,
        quantity,
      });

      throw error instanceof AppError
        ? error
        : new AppError('Error al crear salida de stock.', 500, 'error', false, {
            cause: error instanceof Error ? error.message : String(error),
          });
    }
  }

  /**
   * Obtener historial de movimientos de stock para una variante
   */
  public async getStockMovementHistory(
    productVariantId: Types.ObjectId,
    limit: number = 50,
    offset: number = 0,
  ): Promise<StockMovementHistoryResponseDto> {
    try {
      const movements = (await StockMovement.find({ productVariant: productVariantId })
        .populate({
          path: 'productVariant',
          select: 'color product',
          populate: {
            path: 'product',
            select: 'productModel sku',
          },
        })
        .populate({
          path: 'createdBy',
          select: 'displayName email',
        })
        .sort({ createdAt: -1 })
        .limit(limit)
        .skip(offset)
        .lean()) as unknown as PopulatedStockMovement[];

      const totalMovements = await StockMovement.countDocuments({ productVariant: productVariantId });

      const mappedMovements: StockMovementListItemDto[] = movements.map((movement: PopulatedStockMovement) => {
        const result: StockMovementListItemDto = {
          id: movement._id.toString(),
          productVariant: {
            id: movement.productVariant._id.toString(),
            color: movement.productVariant.color,
            product: {
              id: movement.productVariant.product._id.toString(),
              productModel: movement.productVariant.product.productModel,
              sku: movement.productVariant.product.sku,
            },
          },
          type: movement.type,
          reason: movement.reason,
          quantity: movement.quantity,
          unitCost: movement.unitCost,
          totalCost: movement.totalCost,
          previousStock: movement.previousStock,
          newStock: movement.newStock,
          previousAvgCost: movement.previousAvgCost,
          newAvgCost: movement.newAvgCost,
          createdAt: movement.createdAt,
        };

        if (movement.reference !== undefined) {
          result.reference = movement.reference;
        }

        if (movement.notes !== undefined) {
          result.notes = movement.notes;
        }

        if (movement.createdBy !== undefined) {
          result.createdBy = {
            id: movement.createdBy._id.toString(),
            displayName: movement.createdBy.displayName,
            email: movement.createdBy.email,
          };
        }

        return result;
      });

      return {
        movements: mappedMovements,
        totalMovements,
      };
    } catch (error: unknown) {
      logger.error('Error getting stock movement history', {
        error,
        productVariantId,
      });

      throw error instanceof AppError
        ? error
        : new AppError('Error al obtener historial de movimientos.', 500, 'error', false, {
            cause: error instanceof Error ? error.message : String(error),
          });
    }
  }

  /**
   * Obtener resumen de stock para todas las variantes de un producto
   */
  public async getProductStockSummary(productId: Types.ObjectId): Promise<ProductVariantStockSummaryDto[]> {
    try {
      const variants = (await ProductVariant.find({ product: productId })
        .select('color stock averageCostUSD')
        .lean()) as unknown as ProductVariantLean[];

      const summaries: ProductVariantStockSummaryDto[] = await Promise.all(
        variants.map(async (variant: ProductVariantLean) => {
          // Obtener el último movimiento
          const lastMovement = (await StockMovement.findOne({ productVariant: variant._id })
            .sort({ createdAt: -1 })
            .select('createdAt type quantity')
            .lean()) as unknown as StockMovementLean | null;

          return {
            id: variant._id.toString(),
            color: variant.color,
            currentStock: variant.stock,
            averageCostUSD: variant.averageCostUSD,
            totalValue: variant.stock * variant.averageCostUSD,
            lastMovement: lastMovement
              ? {
                  date: lastMovement.createdAt,
                  type: lastMovement.type,
                  quantity: Math.abs(lastMovement.quantity),
                }
              : undefined,
          };
        }),
      );

      return summaries;
    } catch (error: unknown) {
      logger.error('Error getting product stock summary', {
        error,
        productId,
      });

      throw error instanceof AppError
        ? error
        : new AppError('Error al obtener resumen de stock.', 500, 'error', false, {
            cause: error instanceof Error ? error.message : String(error),
          });
    }
  }
}
