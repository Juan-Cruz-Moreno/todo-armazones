import { z } from 'zod';

/**
 * Esquema de validación para updateMaintenance utilizando Zod.
 */
export const updateMaintenanceBodySchema = z.object({
  active: z.boolean().optional(),
  image: z.number().int().min(1, { message: 'La imagen debe ser un número entero mayor o igual a 1.' }).optional(),
  title: z.string().max(100, { message: 'El título no puede exceder 100 caracteres.' }).optional(),
  subtitle: z.string().max(200, { message: 'El subtítulo no puede exceder 200 caracteres.' }).optional(),
});

export type UpdateMaintenanceBodySchema = z.infer<typeof updateMaintenanceBodySchema>;
