import z from 'zod';
import { Types } from 'mongoose';

// Validador para ObjectId de Mongoose (como string de 24 caracteres hex)
const objectIdSchema = z.string().refine((val) => Types.ObjectId.isValid(val), {
  message: 'Invalid ObjectId',
});

// Schema para agregar un ítem al carrito
export const addItemToCartSchema = z.object({
  productVariantId: objectIdSchema,
  quantity: z.number().int().min(1).optional().default(1),
});

// Schema para incrementar cantidad
export const incrementItemQuantitySchema = z.object({
  productVariantId: objectIdSchema,
});

// Schema para decrementar cantidad
export const decrementItemQuantitySchema = z.object({
  productVariantId: objectIdSchema,
});

// Schema para eliminar ítem
export const removeItemFromCartSchema = z.object({
  productVariantId: objectIdSchema,
});
