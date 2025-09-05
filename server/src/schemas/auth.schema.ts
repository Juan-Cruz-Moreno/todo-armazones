import { z } from 'zod';

export const registerSchema = z
  .object({
    email: z.string().email('Debe ser un correo válido').max(100, 'El correo no puede exceder los 100 caracteres'),
    password: z.string(),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Las contraseñas no coinciden',
    path: ['confirmPassword'],
  });

export const loginSchema = z.object({
  email: z.string().email('Debe ser un correo válido').max(100, 'El correo no puede exceder los 100 caracteres'),
  password: z.string(),
});
