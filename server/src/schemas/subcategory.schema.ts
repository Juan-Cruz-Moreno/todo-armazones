import { Types } from 'mongoose';
import { z } from 'zod';
export const createSubcategorySchema = z.object({
  slug: z.string().min(1, 'El slug es obligatorio').max(50, 'El slug no puede exceder los 50 caracteres'),
  name: z.string().min(1, 'El nombre es obligatorio').max(50, 'El nombre no puede exceder los 50 caracteres'),
  title: z.string().min(1, 'El título es obligatorio').max(50, 'El título no puede exceder los 50 caracteres'),
  description: z
    .string()
    .min(1, 'La descripción es obligatoria')
    .max(500, 'La descripción no puede exceder los 500 caracteres'),
  image: z.string().url('La imagen debe ser una URL válida'),

  // Array de IDs de categorías
  category: z
    .array(
      z.string().refine((val) => Types.ObjectId.isValid(val), {
        message: 'El categoryId debe ser un ObjectId válido',
      }),
    )
    .nonempty('Al menos una categoría es obligatoria'),
});
