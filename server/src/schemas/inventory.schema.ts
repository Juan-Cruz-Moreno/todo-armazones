import { z } from 'zod';
import { Types } from 'mongoose';
import { StockMovementReason } from '@interfaces/stockMovement';

// Schema para crear entrada de stock
export const createStockEntrySchema = z
  .object({
    productVariantId: z.string().refine((val) => Types.ObjectId.isValid(val), {
      message: 'ID de variante de producto inválido',
    }),
    quantity: z.number().int().min(1, 'La cantidad debe ser mayor a 0'),
    unitCost: z.number().min(0, 'El costo unitario debe ser >= 0').optional(),
    reason: z.nativeEnum(StockMovementReason, {
      errorMap: () => ({ message: 'Razón de movimiento inválida' }),
    }),
    reference: z.string().optional(),
    notes: z.string().optional(),
  })
  .refine(
    (data) => {
      // Validar que unitCost sea requerido para PURCHASE e INITIAL_STOCK
      const requiresUnitCost =
        data.reason === StockMovementReason.PURCHASE || data.reason === StockMovementReason.INITIAL_STOCK;

      if (requiresUnitCost && (data.unitCost === undefined || data.unitCost === null)) {
        return false;
      }

      return true;
    },
    {
      message: 'El costo unitario es requerido para compras y stock inicial',
      path: ['unitCost'],
    },
  );

// Schema para crear salida de stock
export const createStockExitSchema = z.object({
  productVariantId: z.string().refine((val) => Types.ObjectId.isValid(val), {
    message: 'ID de variante de producto inválido',
  }),
  quantity: z.number().int().min(1, 'La cantidad debe ser mayor a 0'),
  reason: z.nativeEnum(StockMovementReason, {
    errorMap: () => ({ message: 'Razón de movimiento inválida' }),
  }),
  reference: z.string().optional(),
  notes: z.string().optional(),
});

// Schema para consultar historial de movimientos
export const getStockMovementHistorySchema = z.object({
  params: z.object({
    productVariantId: z.string().refine((val) => Types.ObjectId.isValid(val), {
      message: 'ID de variante de producto inválido',
    }),
  }),
  query: z.object({
    limit: z
      .string()
      .regex(/^\d+$/)
      .optional()
      .transform((val) => (val ? parseInt(val) : 50)),
    offset: z
      .string()
      .regex(/^\d+$/)
      .optional()
      .transform((val) => (val ? parseInt(val) : 0)),
  }),
});

// Schema para obtener resumen de stock de producto
export const getProductStockSummarySchema = z.object({
  params: z.object({
    productId: z.string().refine((val) => Types.ObjectId.isValid(val), {
      message: 'ID de producto inválido',
    }),
  }),
});
