import { z } from 'zod';

export const forgotPasswordSchema = z.object({
  email: z.string().email('Debe ser un correo válido').max(100, 'El correo no puede exceder los 100 caracteres'),
});

export const resetPasswordBodySchema = z.object({
  token: z
    .string()
    .min(1, 'El token es requerido')
    .max(500, 'El token no puede exceder los 500 caracteres')
    .refine((val) => /^[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+$/.test(val), {
      message: 'El token debe tener formato JWT válido',
    }),
  password: z.string(),
});
