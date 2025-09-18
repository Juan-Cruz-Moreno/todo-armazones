import z from "zod";
import { normalizeColorName } from "@/utils/normalizeColorName";

// Schema para color (igual que backend)
export const colorSchema = z.object({
  name: z.string().min(1, "El nombre del color es requerido"),
  hex: z
    .string()
    .min(1, "El código hex es requerido")
    .regex(
      /^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/,
      "El código hex debe ser válido (ej: #FFF o #FFFFFF)"
    ),
});

// Schema para variante en creación (frontend)
export const createVariantSchema = z.object({
  color: colorSchema,
  stock: z.number().min(0, "El stock no puede ser negativo").optional(),
  initialCostUSD: z
    .number()
    .min(0, "El costo inicial debe ser mayor o igual a 0")
    .optional(),
  priceUSD: z.number().min(0, "El precio debe ser mayor o igual a 0").optional(),
});

// Schema para archivos de variante
export const variantImagesSchema = z.record(
  z.string(), // Color name key
  z
    .array(z.instanceof(File))
    .min(1, "Cada variante debe tener al menos una imagen")
);

// Schema para producto en creación (frontend)
export const createProductSchema = z.object({
  category: z
    .array(z.string().min(1, "Cada categoría debe ser un ID válido"))
    .min(1, "Debe seleccionar al menos una categoría"),
  subcategory: z.string().min(1, "La subcategoría es requerida"),
  productModel: z.string().min(1, "El modelo del producto es requerido"),
  sku: z.string().min(1, "El SKU es requerido"),
  size: z.string().min(1, "El tamaño es requerido"),
  description: z.string().optional(),
});

// Schema para archivos del producto
export const productFilesSchema = z.object({
  primaryImage: z
    .instanceof(File, { message: "Debe seleccionar una imagen principal" })
    .refine(
      (file) => file.size <= 15 * 1024 * 1024,
      "La imagen debe ser menor a 15MB"
    )
    .refine(
      (file) =>
        ["image/jpeg", "image/jpg", "image/png", "image/webp"].includes(
          file.type
        ),
      "La imagen debe ser JPG, PNG o WebP"
    ),
  variantImages: variantImagesSchema,
});

// Schema principal para creación de producto (frontend)
export const createProductWithVariantsFrontendSchema = z.object({
  product: createProductSchema,
  variants: z.array(createVariantSchema).min(1, "Debe agregar al menos una variante"),
  files: productFilesSchema,
}).refine((data) => {
  // Validar que cada variante tenga al menos una imagen en variantImages
  const variantImages = data.files.variantImages;
  return data.variants.every((variant) => {
    const normalizedKey = `images_${normalizeColorName(variant.color.name)}`;
    return variantImages[normalizedKey] && variantImages[normalizedKey].length > 0;
  });
}, {
  message: "Cada variante debe tener al menos una imagen seleccionada",
  path: ["files", "variantImages"], // Apunta al campo de imágenes
});

// Schema para variante en actualización (frontend)
export const updateVariantSchema = z.object({
  color: colorSchema.optional(), // Opcional para updates parciales
  priceUSD: z.number().min(0, "El precio debe ser mayor o igual a 0").optional(),
  averageCostUSD: z.number().min(0, "El costo promedio debe ser mayor o igual a 0").optional(), // Permitir modificación manual
  // Nota: stock se actualiza únicamente mediante InventoryService
});

// Schema para producto en actualización (frontend)
export const updateProductSchema = z.object({
  category: z
    .array(z.string().min(1, "Cada categoría debe ser un ID válido"))
    .optional(), // Opcional para updates parciales
  subcategory: z.string().min(1, "La subcategoría es requerida").optional(),
  productModel: z
    .string()
    .min(1, "El modelo del producto es requerido")
    .optional(),
  sku: z.string().min(1, "El SKU es requerido").optional(),
  size: z.string().min(1, "El tamaño es requerido").optional(),
  description: z.string().optional(),
});

// Schema para archivos en actualización (opcionales)
export const updateProductFilesSchema = z.object({
  primaryImage: z
    .instanceof(File)
    .refine(
      (file) => file.size <= 15 * 1024 * 1024,
      "La imagen debe ser menor a 15MB"
    )
    .refine(
      (file) =>
        ["image/jpeg", "image/jpg", "image/png", "image/webp"].includes(
          file.type
        ),
      "La imagen debe ser JPG, PNG o WebP"
    )
    .optional(),
  variantImages: z.record(
    z.string(),
    z.array(z.instanceof(File))
  ).optional(),
}).optional(); // Todo el objeto files es opcional

// Schema principal para actualización de producto con variantes (frontend)
export const updateProductWithVariantsFrontendSchema = z.object({
  productId: z.string().min(1, "El ID del producto es requerido"),
  product: updateProductSchema,
  variants: z
    .array(
      z.object({
        id: z.string().min(1, "El ID de variante es requerido"), // Requerido para identificar qué variante actualizar
        data: updateVariantSchema,
      })
    )
    .optional(), // Opcional si solo se actualiza el producto
  files: updateProductFilesSchema,
})
.refine(
  (data) => data.product || (data.variants && data.variants.length > 0),
  "Debe actualizarse al menos el producto o una variante"
);

// Tipos inferidos para usar en formularios
export type CreateProductFormData = z.infer<
  typeof createProductWithVariantsFrontendSchema
>;
export type CreateProductData = z.infer<typeof createProductSchema>;
export type CreateVariantData = z.infer<typeof createVariantSchema>;
export type CreateProductFilesData = z.infer<typeof productFilesSchema>;

export type UpdateProductFormData = z.infer<
  typeof updateProductWithVariantsFrontendSchema
>;
export type UpdateProductData = z.infer<typeof updateProductSchema>;
export type UpdateVariantData = z.infer<typeof updateVariantSchema>;
export type UpdateProductFilesData = z.infer<typeof updateProductFilesSchema>;
