// Esquemas de validación Zod para productos y variantes (creación y actualización)

import { z } from 'zod';

// Esquema para validar el objeto de color (nombre y código hex) usado en variantes de productos
const colorSchema = z.object({
  name: z.string().min(1, 'Nombre del color es requerido'),
  hex: z
    .string()
    // Valida formato hex de color (3 o 6 dígitos)
    .regex(/^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/, 'Hex debe ser un código de color válido (e.g., #FFF o #FFFFFF)'),
});

// Esquema para validar una variante de producto en creación (incluye color, stock inicial, costos y precios)
const createVariantSchema = z.object({
  color: colorSchema,
  stock: z.number().min(0, 'Stock no puede ser negativo'),
  initialCostUSD: z.number().min(0, 'Costo inicial debe ser mayor o igual a 0'),
  priceUSD: z.number().min(0, 'Precio debe ser mayor o igual a 0'),
  // Campos opcionales para imágenes: llegan como archivos vía Multer, no como parte del body JSON.
  // Se incluyen por consistencia y para validar si se envían como strings (e.g., URLs) en el futuro.
  thumbnail: z.string().optional(),
  images: z.array(z.string()).optional(),
});

// Esquema para validar el producto base en creación (campos obligatorios como categoría, SKU y modelo)
const createProductSchema = z.object({
  // Campos opcionales para imágenes: llegan como archivos vía Multer, no como parte del body JSON.
  // Se incluyen por consistencia y para validar si se envían como strings (e.g., URLs) en el futuro.
  thumbnail: z.string().optional(),
  primaryImage: z.string().optional(),
  category: z
    .array(z.string().min(1, 'Cada categoría debe ser un ID válido'))
    .min(1, 'Al menos una categoría es requerida'),
  subcategory: z.string().min(1, 'Subcategoría es requerida'),
  productModel: z.string().min(1, 'Modelo del producto es requerido'),
  sku: z.string().min(1, 'SKU es requerido'),
  size: z.string().min(1, 'Size es requerido'),
  description: z.string().optional(),
});

// Esquema principal para validar el cuerpo de la solicitud de creación de producto con variantes
export const createProductWithVariantsSchema = z.object({
  product: createProductSchema,
  variants: z.array(createVariantSchema).min(1, 'Al menos una variante es requerida'),
});

// Esquema para validar actualizaciones parciales de variantes (campos opcionales, ya que stock se maneja vía InventoryService)
const updateVariantSchema = z.object({
  color: colorSchema.optional(), // Opcional para updates parciales
  priceUSD: z.number().min(0, 'Precio debe ser mayor o igual a 0').optional(),
  averageCostUSD: z.number().min(0, 'Costo promedio debe ser mayor o igual a 0').optional(), // Permitir modificación manual
  // Nota: stock se actualiza únicamente mediante InventoryService
  thumbnail: z.string().optional(),
  images: z.array(z.string()).optional(),
});

// Esquema para validar actualizaciones parciales del producto (todos los campos son opcionales para permitir cambios selectivos)
const updateProductSchema = z.object({
  thumbnail: z.string().optional(),
  primaryImage: z.string().optional(),
  category: z.array(z.string().min(1, 'Cada categoría debe ser un ID válido')).optional(), // Opcional para updates parciales
  subcategory: z.string().min(1, 'Subcategoría es requerida').optional(),
  productModel: z.string().min(1, 'Modelo del producto es requerido').optional(),
  sku: z.string().min(1, 'SKU es requerido').optional(),
  size: z.string().min(1, 'Size es requerido').optional(),
  description: z.string().optional(),
});

// Esquema principal para validar el cuerpo de la solicitud de actualización de producto con variantes
export const updateProductWithVariantsSchema = z
  .object({
    product: updateProductSchema,
    variants: z
      .array(
        z.object({
          id: z.string().min(1, 'ID de variante es requerido'), // Requerido para identificar qué variante actualizar
          data: updateVariantSchema,
        }),
      )
      .optional(), // Opcional si solo se actualiza el producto
  })

  // Refinamiento: Asegura que se actualice al menos el producto o una variante para evitar requests vacíos
  .refine(
    (data) => data.product || (data.variants && data.variants.length > 0),
    'Debe actualizarse al menos el producto o una variante',
  );
