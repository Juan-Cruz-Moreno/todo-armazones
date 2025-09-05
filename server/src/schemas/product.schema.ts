import { Types } from 'mongoose';
import { z } from 'zod';

// Schema para el color de la variante
const colorSchema = z.object({
  name: z.string().min(1, 'El nombre del color es requerido'),
  hex: z.string().regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, 'Hex inválido'),
});

// Schema para una variante
const variantSchema = z.object({
  // product: omitido en creación, lo asigna el backend
  color: colorSchema,
  stock: z.number().int().min(0, 'Stock debe ser >= 0'),
  initialCostUSD: z.number().min(0, 'El costo inicial debe ser >= 0'),
  images: z.array(z.string().min(1)).optional(), // Se asignan en el backend, pero puede venir vacío
});

// Schema para el producto
export const createProductWithVariantsSchema = z.object({
  product: z.object({
    // slug: omitido, lo genera el backend
    thumbnail: z.string().optional(), // Se asigna en el backend
    primaryImage: z.string().optional(), // Se asigna en el backend
    category: z.array(
      z.string().refine((val) => Types.ObjectId.isValid(val), {
        message: 'ID de categoría inválido',
      }),
    ),
    subcategory: z.string().refine((val) => Types.ObjectId.isValid(val), {
      message: 'ID de subcategoría inválido',
    }),
    productModel: z.string().min(1, 'El modelo es requerido'),
    sku: z.string().min(1, 'El SKU es requerido'),
    size: z.string().min(1, 'El tamaño es requerido').optional(),
    priceUSD: z.number().min(0, 'El precio debe ser >= 0'),
  }),
  variants: z.array(variantSchema).min(1, 'Debe haber al menos una variante'),
});
