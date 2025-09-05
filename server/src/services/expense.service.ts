import Expense, { IExpenseDocument } from '@models/Expense';
import {
  CreateExpenseRequestDto,
  UpdateExpenseRequestDto,
  ExpenseResponseDto,
  ExpenseListResponseDto,
  MonthlyExpenseFilters,
} from '@dto/expense.dto';
import { ExpenseType, Currency } from '@interfaces/expense';
import { StockMovementReason, StockMovementType } from '@interfaces/stockMovement';
import { AppError } from '@utils/AppError';
import logger from '@config/logger';
import { Types, FilterQuery } from 'mongoose';
import { DollarService } from './dollar.service';

// Interfaces para documentos populados
interface PopulatedStockMovement {
  _id?: Types.ObjectId;
  type: StockMovementType;
  reason: StockMovementReason;
}

interface PopulatedUser {
  _id?: Types.ObjectId;
  displayName: string;
  email: string;
}

interface PopulatedExpenseDocument extends Omit<IExpenseDocument, 'stockMovement' | 'createdBy'> {
  stockMovement?: PopulatedStockMovement | Types.ObjectId;
  createdBy?: PopulatedUser | Types.ObjectId;
}

export class ExpenseService {
  private dollarService: DollarService;

  constructor() {
    this.dollarService = new DollarService();
  }
  /**
   * Obtiene la tasa de cambio del dólar desde el servicio centralizado
   */
  private async getExchangeRate(): Promise<number> {
    try {
      const dollarData = await this.dollarService.getDollar();

      logger.info('Tasa de cambio obtenida del servicio Dollar', {
        value: dollarData.value,
        source: dollarData.source,
        apiUpdatedAt: dollarData.apiUpdatedAt,
      });

      return dollarData.value;
    } catch (error: unknown) {
      logger.error('Error obteniendo tasa de cambio del servicio Dollar', { error });

      if (error instanceof AppError) {
        throw error;
      }

      throw new AppError('Error al obtener la tasa de cambio del dólar', 500, 'error', false, {
        cause: error instanceof Error ? error.message : String(error),
        hint: 'Verifica que el servicio Dollar esté configurado correctamente',
      });
    }
  }

  /**
   * Convierte montos entre ARS y USD
   */
  private async convertCurrency(
    amount: number,
    fromCurrency: Currency,
    exchangeRate?: number,
  ): Promise<{ amountARS: number; amountUSD: number; exchangeRate: number }> {
    if (fromCurrency === Currency.USD) {
      // Si es USD, obtener tasa de cambio y convertir a ARS
      const rate = exchangeRate || (await this.getExchangeRate());
      return {
        amountARS: amount * rate,
        amountUSD: amount,
        exchangeRate: rate,
      };
    } else {
      // Si es ARS, obtener tasa de cambio y convertir a USD
      const rate = exchangeRate || (await this.getExchangeRate());
      return {
        amountARS: amount,
        amountUSD: amount / rate,
        exchangeRate: rate,
      };
    }
  }

  /**
   * Crea un gasto manual
   */
  public async createManualExpense(
    dto: CreateExpenseRequestDto,
    createdBy?: Types.ObjectId,
  ): Promise<ExpenseResponseDto> {
    try {
      const { amountARS, amountUSD, exchangeRate } = await this.convertCurrency(dto.amount, dto.currency);

      const expense = new Expense({
        type: ExpenseType.MANUAL,
        description: dto.description,
        amountARS,
        amountUSD,
        currency: dto.currency,
        exchangeRate: dto.currency === Currency.ARS ? exchangeRate : undefined,
        reference: dto.reference,
        createdBy,
      });

      await expense.save();

      return this.mapExpenseToResponseDto(expense);
    } catch (error: unknown) {
      logger.error('Error creating manual expense', { error, dto });

      throw error instanceof AppError
        ? error
        : new AppError('Error al crear gasto manual.', 500, 'error', false, {
            cause: error instanceof Error ? error.message : String(error),
          });
    }
  }

  /**
   * Crea un gasto automático por movimiento de stock (DAMAGE o THEFT)
   */
  public async createStockExpense(
    stockMovementId: Types.ObjectId,
    reason: StockMovementReason,
    amountUSD: number,
    description: string,
    createdBy?: Types.ObjectId,
  ): Promise<ExpenseResponseDto> {
    try {
      const { amountARS, exchangeRate } = await this.convertCurrency(amountUSD, Currency.USD);

      const expenseType = reason === StockMovementReason.DAMAGE ? ExpenseType.STOCK_DAMAGE : ExpenseType.STOCK_THEFT;

      const expense = new Expense({
        type: expenseType,
        description,
        amountARS,
        amountUSD,
        currency: Currency.USD, // Los costos de stock están en USD
        exchangeRate,
        stockMovement: stockMovementId,
        createdBy,
      });

      await expense.save();

      return this.mapExpenseToResponseDto(expense);
    } catch (error: unknown) {
      logger.error('Error creating stock expense', {
        error,
        stockMovementId,
        reason,
        amountUSD,
      });

      throw error instanceof AppError
        ? error
        : new AppError('Error al crear gasto por movimiento de stock.', 500, 'error', false, {
            cause: error instanceof Error ? error.message : String(error),
          });
    }
  }

  /**
   * Obtiene gastos por mes
   */
  public async getMonthlyExpenses(
    filters: MonthlyExpenseFilters,
    limit: number = 50,
    offset: number = 0,
  ): Promise<ExpenseListResponseDto> {
    try {
      // Crear rango de fechas para el mes especificado
      const startDate = new Date(filters.year, filters.month - 1, 1);
      const endDate = new Date(filters.year, filters.month, 0, 23, 59, 59, 999);

      // Construir query de filtros
      const query: FilterQuery<IExpenseDocument> = {
        createdAt: {
          $gte: startDate,
          $lte: endDate,
        },
      };

      if (filters.type) {
        query.type = filters.type;
      }

      if (filters.currency) {
        query.currency = filters.currency;
      }

      // Obtener gastos
      const expenses = await Expense.find(query)
        .populate({
          path: 'stockMovement',
          select: 'type reason',
        })
        .populate({
          path: 'createdBy',
          select: 'displayName email',
        })
        .sort({ createdAt: -1 })
        .limit(limit)
        .skip(offset)
        .lean();

      // Contar total de gastos
      const totalExpenses = await Expense.countDocuments(query);

      // Calcular totales
      const totals = await Expense.aggregate([
        { $match: query },
        {
          $group: {
            _id: null,
            totalAmountARS: { $sum: '$amountARS' },
            totalAmountUSD: { $sum: '$amountUSD' },
          },
        },
      ]);

      const totalAmountARS = totals[0]?.totalAmountARS || 0;
      const totalAmountUSD = totals[0]?.totalAmountUSD || 0;

      // Mapear resultados
      const mappedExpenses: ExpenseResponseDto[] = expenses.map((expense: PopulatedExpenseDocument) =>
        this.mapExpenseToResponseDto(expense),
      );

      return {
        expenses: mappedExpenses,
        totalExpenses,
        totalAmountARS,
        totalAmountUSD,
      };
    } catch (error: unknown) {
      logger.error('Error getting monthly expenses', { error, filters });

      throw error instanceof AppError
        ? error
        : new AppError('Error al obtener gastos mensuales.', 500, 'error', false, {
            cause: error instanceof Error ? error.message : String(error),
          });
    }
  }

  /**
   * Obtiene un gasto por ID
   */
  private async getExpenseById(id: Types.ObjectId): Promise<IExpenseDocument> {
    const expense = await Expense.findById(id);
    if (!expense) {
      throw new AppError('Gasto no encontrado.', 404, 'error', false);
    }
    return expense;
  }

  /**
   * Actualiza un gasto manual
   */
  public async updateExpense(id: Types.ObjectId, dto: UpdateExpenseRequestDto): Promise<ExpenseResponseDto> {
    try {
      const expense = await this.getExpenseById(id);

      // Verificar que sea un gasto manual
      if (expense.type !== ExpenseType.MANUAL) {
        throw new AppError('Solo se pueden actualizar gastos manuales.', 400, 'error', false);
      }

      // Preparar campos a actualizar
      const updateFields: Partial<IExpenseDocument> = {};

      if (dto.description !== undefined) {
        updateFields.description = dto.description;
      }

      if (dto.reference !== undefined) {
        updateFields.reference = dto.reference;
      }

      // Si se actualiza amount o currency, recalcular montos
      if (dto.amount !== undefined || dto.currency !== undefined) {
        const amount =
          dto.amount !== undefined
            ? dto.amount
            : expense.currency === Currency.ARS
              ? expense.amountARS
              : expense.amountUSD;
        const currency = dto.currency !== undefined ? dto.currency : expense.currency;

        const { amountARS, amountUSD, exchangeRate } = await this.convertCurrency(amount, currency);

        updateFields.amountARS = amountARS;
        updateFields.amountUSD = amountUSD;
        updateFields.currency = currency;
        if (currency === Currency.ARS) {
          updateFields.exchangeRate = exchangeRate;
        }
      }

      // Actualizar el gasto
      const updatedExpense = await Expense.findByIdAndUpdate(
        id,
        { ...updateFields, updatedAt: new Date() },
        { new: true, runValidators: true },
      );

      if (!updatedExpense) {
        throw new AppError('Error al actualizar el gasto.', 500, 'error', false);
      }

      // Mapear a DTO de respuesta
      return this.mapExpenseToResponseDto(updatedExpense);
    } catch (error: unknown) {
      logger.error('Error updating expense', { error, id, dto });

      throw error instanceof AppError
        ? error
        : new AppError('Error al actualizar gasto.', 500, 'error', false, {
            cause: error instanceof Error ? error.message : String(error),
          });
    }
  }

  /**
   * Mapea un documento de gasto a DTO de respuesta
   */
  private mapExpenseToResponseDto(expense: PopulatedExpenseDocument): ExpenseResponseDto {
    const result: ExpenseResponseDto = {
      id: expense._id.toString(),
      type: expense.type,
      description: expense.description,
      amountARS: expense.amountARS,
      amountUSD: expense.amountUSD,
      currency: expense.currency,
      createdAt: expense.createdAt,
    };

    // Asignar propiedades opcionales solo si existen
    if (expense.exchangeRate !== undefined) {
      result.exchangeRate = expense.exchangeRate;
    }

    if (expense.reference !== undefined) {
      result.reference = expense.reference;
    }

    if (expense.stockMovement) {
      // Verificar si stockMovement está populado (tiene propiedades type y reason)
      const isPopulated =
        expense.stockMovement && typeof expense.stockMovement === 'object' && 'type' in expense.stockMovement;

      if (isPopulated) {
        const stockMovement = expense.stockMovement as PopulatedStockMovement;
        result.stockMovement = {
          id: stockMovement._id?.toString() || '',
          type: stockMovement.type || '',
          reason: stockMovement.reason || '',
        };
      } else {
        // Si no está populado, solo tenemos el ObjectId
        result.stockMovement = {
          id: (expense.stockMovement as Types.ObjectId).toString(),
          type: '',
          reason: '',
        };
      }
    }

    if (expense.createdBy) {
      // Verificar si createdBy está populado (tiene propiedades displayName y email)
      const isPopulated =
        expense.createdBy && typeof expense.createdBy === 'object' && 'displayName' in expense.createdBy;

      if (isPopulated) {
        const createdBy = expense.createdBy as PopulatedUser;
        result.createdBy = {
          id: createdBy._id?.toString() || '',
          displayName: createdBy.displayName || '',
          email: createdBy.email || '',
        };
      } else {
        // Si no está populado, solo tenemos el ObjectId
        result.createdBy = {
          id: (expense.createdBy as Types.ObjectId).toString(),
          displayName: '',
          email: '',
        };
      }
    }

    return result;
  }
}
