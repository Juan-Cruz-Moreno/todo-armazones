import { z } from 'zod';
import { Types } from 'mongoose';
import { PriceUpdateType } from '@dto/bulk-price-update.dto';

export const bulkPriceUpdateSchema = z
  .object({
    categoryIds: z
      .array(
        z.string().refine((val) => Types.ObjectId.isValid(val), {
          message: 'ID de categoría inválido',
        }),
      )
      .min(1, 'Debe proporcionar al menos una categoría'),

    subcategoryIds: z
      .array(
        z.string().refine((val) => Types.ObjectId.isValid(val), {
          message: 'ID de subcategoría inválido',
        }),
      )
      .optional(),

    updateType: z.nativeEnum(PriceUpdateType, {
      message: 'Tipo de actualización inválido',
    }),

    value: z.number().refine(
      (val) => {
        // Validaciones específicas según el tipo se manejan en el servicio
        return typeof val === 'number' && !isNaN(val) && isFinite(val);
      },
      {
        message: 'El valor debe ser un número válido',
      },
    ),

    minPrice: z.number().min(0, 'El precio mínimo debe ser mayor o igual a 0').optional(),

    maxPrice: z.number().min(0, 'El precio máximo debe ser mayor o igual a 0').optional(),
  })
  .refine(
    (data) => {
      if (data.minPrice !== undefined && data.maxPrice !== undefined) {
        return data.minPrice <= data.maxPrice;
      }
      return true;
    },
    {
      message: 'El precio mínimo no puede ser mayor al precio máximo',
      path: ['maxPrice'],
    },
  );

export type BulkPriceUpdateSchemaType = z.infer<typeof bulkPriceUpdateSchema>;
