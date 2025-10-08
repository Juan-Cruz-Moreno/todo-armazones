import { z } from 'zod';
import { UserRole, UserStatus } from '@enums/user.enum';

export const updateUserSchema = z.object({
  email: z.email().optional(),
  displayName: z.string().min(1).max(50).optional(),
  firstName: z.string().min(1).max(50).optional(),
  lastName: z.string().min(1).max(50).optional(),
  dni: z.string().min(1).max(50).optional(),
  cuit: z.string().min(1).max(50).optional(),
  phone: z.string().min(1).max(50).optional(),
});

export const updateUserAsAdminSchema = z.object({
  email: z.email().optional(),
  displayName: z.string().min(1).max(50).optional(),
  firstName: z.string().min(1).max(50).optional(),
  lastName: z.string().min(1).max(50).optional(),
  dni: z.string().min(1).max(50).optional(),
  cuit: z.string().min(1).max(50).optional(),
  phone: z.string().min(1).max(50).optional(),
  password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres').optional(),
  role: z.nativeEnum(UserRole).optional(),
  status: z.nativeEnum(UserStatus).optional(),
});

export const findUserByEmailSchema = z.object({
  email: z.email(),
});
