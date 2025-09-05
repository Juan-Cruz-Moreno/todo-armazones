import { z } from 'zod';
import { Types } from 'mongoose';

// Helper para validar ObjectId
const ObjectIdSchema = z.string().refine((val) => Types.ObjectId.isValid(val), {
  message: 'Invalid ObjectId format',
});

// Schema para ajustes de precio
const PriceAdjustmentSchema = z
  .object({
    categoryId: ObjectIdSchema.optional(),
    subcategoryId: ObjectIdSchema.optional(),
    percentageIncrease: z
      .number()
      .min(0, 'El porcentaje de incremento debe ser mayor o igual a 0')
      .max(1000, 'El porcentaje de incremento no puede ser mayor a 1000%'),
  })
  .refine(
    (data) => {
      // Debe tener al menos categoryId o subcategoryId
      return data.categoryId || data.subcategoryId;
    },
    {
      message: 'Debe especificar categoryId o subcategoryId para el ajuste de precio',
    },
  );

export const GenerateCatalogRequestSchema = {
  body: z
    .object({
      email: z.string().email('Debe proporcionar un email válido').min(1, 'El email es requerido'),
      categories: z
        .union([
          z.array(ObjectIdSchema),
          z.string().transform((str) => {
            try {
              const parsed = JSON.parse(str);
              return Array.isArray(parsed) ? parsed : [parsed];
            } catch {
              return [];
            }
          }),
        ])
        .optional()
        .default([]), // Aseguramos que sea un array vacío si no se proporciona
      subcategories: z
        .union([
          z.array(ObjectIdSchema),
          z.string().transform((str) => {
            try {
              const parsed = JSON.parse(str);
              return Array.isArray(parsed) ? parsed : [parsed];
            } catch {
              return [];
            }
          }),
        ])
        .optional()
        .default([]), // Aseguramos que sea un array vacío si no se proporciona
      priceAdjustments: z
        .union([
          z.array(PriceAdjustmentSchema),
          z.string().transform((str) => {
            try {
              const parsed = JSON.parse(str);
              return Array.isArray(parsed) ? parsed : [];
            } catch {
              return [];
            }
          }),
        ])
        .optional()
        .default([]), // Array vacío por defecto
    })
    .superRefine((data, ctx) => {
      // Validación personalizada: al menos una de las dos propiedades debe tener valores
      if (data.categories.length === 0 && data.subcategories.length === 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Debe especificar al menos una categoría o subcategoría',
          path: ['categories'], // Indica dónde ocurrió el error
        });
      }

      // Validación adicional: no se permite que una categoría y subcategoría sean ambas nulas
      if (data.priceAdjustments.some((adjustment) => !adjustment.categoryId && !adjustment.subcategoryId)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Cada ajuste de precio debe tener al menos una categoría o subcategoría',
          path: ['priceAdjustments'],
        });
      }
    }),
};
