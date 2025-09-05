import { z } from 'zod';

/**
 * Esquema de validación para updateDollarConfig utilizando Zod.
 */
export const updateDollarConfigBodySchema = z.object({
  addedValue: z.number().min(0, { message: 'El valor agregado debe ser mayor o igual a 0.' }),
  isPercentage: z.boolean(),
});

export type UpdateDollarConfigBodySchema = z.infer<typeof updateDollarConfigBodySchema>;
