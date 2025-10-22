import { z } from 'zod';
import { DeliveryType } from '@enums/order.enum';

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

// Schema para la dirección opcional en createUserByAdmin
const addressSchema = z
  .object({
    firstName: z.string().min(1, 'El nombre es requerido').optional(),
    lastName: z.string().min(1, 'El apellido es requerido').optional(),
    companyName: z.string().optional(),
    email: z.string().email('Debe ser un correo válido').optional(),
    phoneNumber: z.string().min(1, 'El teléfono es requerido').optional(),
    dni: z.string().min(1, 'El DNI es requerido').optional(),
    cuit: z.string().optional(),
    streetAddress: z.string().optional(),
    city: z.string().min(1, 'La ciudad es requerida').optional(),
    state: z.string().min(1, 'La provincia es requerida').optional(),
    postalCode: z.string().min(1, 'El código postal es requerido').optional(),
    shippingCompany: z.string().optional(),
    declaredShippingAmount: z.string().optional(),
    deliveryWindow: z.string().optional(),
    deliveryType: z.nativeEnum(DeliveryType).optional(),
    pickupPointAddress: z.string().optional(),
  })
  .optional();

export const createUserByAdminSchema = z.object({
  email: z.string().email('Debe ser un correo válido').max(100, 'El correo no puede exceder los 100 caracteres'),
  password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres'),
  displayName: z.string().optional(),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  dni: z.string().optional(),
  cuit: z.string().optional(),
  phone: z.string().optional(),
  address: addressSchema,
});
