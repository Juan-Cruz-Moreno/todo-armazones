import { z } from 'zod';

export const updateUserSchema = z.object({
  email: z.email().optional(),
  displayName: z.string().min(1).max(50).optional(),
  firstName: z.string().min(1).max(50).optional(),
  lastName: z.string().min(1).max(50).optional(),
  dni: z.string().min(1).max(50).optional(),
  cuit: z.string().min(1).max(50).optional(),
  phone: z.string().min(1).max(50).optional(),
});

export const findUserByEmailSchema = z.object({
  email: z.email(),
});
