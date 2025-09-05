import { z } from 'zod';
import { Types } from 'mongoose';

// Schema específico para actualización rápida de precios
export const updateItemPricesBodySchema = z.object({
  items: z
    .array(
      z
        .object({
          productVariantId: z.string().refine((val) => Types.ObjectId.isValid(val), {
            message: 'El productVariantId debe ser un ObjectId válido',
          }),
          costUSDAtPurchase: z.number().min(0, 'El costo debe ser mayor o igual a 0').optional(),
          priceUSDAtPurchase: z.number().min(0, 'El precio debe ser mayor o igual a 0').optional(),
        })
        .refine((data) => data.costUSDAtPurchase !== undefined || data.priceUSDAtPurchase !== undefined, {
          message: 'Debe especificar al menos costUSDAtPurchase o priceUSDAtPurchase',
        }),
    )
    .min(1, 'Debe especificar al menos un item para actualizar')
    .max(50, 'No se pueden actualizar más de 50 items a la vez'),
});

export type UpdateItemPricesDto = z.infer<typeof updateItemPricesBodySchema>;
