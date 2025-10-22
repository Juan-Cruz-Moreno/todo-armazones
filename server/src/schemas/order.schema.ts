import { z } from 'zod';
import { ShippingMethod, PaymentMethod, OrderStatus, DeliveryType } from '@enums/order.enum';
import { Types } from 'mongoose';

// Schema base para dirección con validación condicional
const baseAddressSchema = z.object({
  firstName: z.string().min(1, 'El nombre es obligatorio').max(50, 'El nombre no puede exceder los 50 caracteres'),
  lastName: z.string().min(1, 'El apellido es obligatorio').max(50, 'El apellido no puede exceder los 50 caracteres'),
  companyName: z.string().max(50, 'El nombre de la empresa no puede exceder los 50 caracteres').optional(),
  email: z
    .email('El correo electrónico no es válido')
    .max(100, 'El correo electrónico no puede exceder los 100 caracteres'),
  phoneNumber: z
    .string()
    .min(1, 'El número de teléfono es obligatorio')
    .max(20, 'El número de teléfono no puede exceder los 20 caracteres'),
  dni: z.string().min(1, 'DNI requerido').max(20, 'El DNI no puede exceder los 20 caracteres'),
  cuit: z.string().optional(),
  city: z.string().min(1, 'La ciudad es obligatoria').max(50, 'La ciudad no puede exceder los 50 caracteres'),
  state: z.string().min(1, 'El estado es obligatorio').max(50, 'El estado no puede exceder los 50 caracteres'),
  postalCode: z
    .string()
    .min(1, 'El código postal es obligatorio')
    .max(20, 'El código postal no puede exceder los 20 caracteres'),
  shippingCompany: z.string().max(50, 'La empresa de envío no puede exceder los 50 caracteres').optional(),
  declaredShippingAmount: z
    .string()
    .max(20, 'El monto declarado de envío no puede exceder los 20 caracteres')
    .optional(),
  deliveryWindow: z.string().max(50, 'La ventana de entrega no puede exceder los 50 caracteres').optional(),
  deliveryType: z.enum(DeliveryType).optional(),
  streetAddress: z.string().max(100, 'La dirección no puede exceder los 100 caracteres').optional(),
  pickupPointAddress: z
    .string()
    .max(200, 'La dirección del punto de retiro no puede exceder los 200 caracteres')
    .optional(),
});

// Schema con validación condicional para tipos de entrega
const addressSchema = baseAddressSchema
  .refine(
    (data) => {
      // Si deliveryType es HOME_DELIVERY o no está definido (por defecto es HOME_DELIVERY), streetAddress es obligatorio
      if (!data.deliveryType || data.deliveryType === DeliveryType.HomeDelivery) {
        return !!data.streetAddress;
      }
      return true;
    },
    {
      message: 'La dirección es obligatoria cuando el tipo de entrega es a domicilio',
      path: ['streetAddress'],
    },
  )
  .refine(
    (data) => {
      // Si deliveryType es PICKUP_POINT, pickupPointAddress es obligatorio
      if (data.deliveryType === DeliveryType.PickupPoint) {
        return !!data.pickupPointAddress;
      }
      return true;
    },
    {
      message: 'La dirección del punto de retiro es obligatoria cuando el tipo de entrega es punto de retiro',
      path: ['pickupPointAddress'],
    },
  );

export const createOrderBodySchema = z.object({
  shippingMethod: z.enum(ShippingMethod),
  shippingAddress: addressSchema,
  paymentMethod: z.enum(PaymentMethod),
  comments: z.string().max(500, 'Los comentarios no pueden exceder los 500 caracteres').optional(),
});

export const createOrderAdminBodySchema = z.object({
  userId: z.string().refine((val) => Types.ObjectId.isValid(val), {
    message: 'El userId debe ser un ObjectId válido',
  }),
  items: z
    .array(
      z.object({
        productVariantId: z.string().refine((val) => Types.ObjectId.isValid(val), {
          message: 'El productVariantId debe ser un ObjectId válido',
        }),
        quantity: z.number().min(1, 'La cantidad debe ser al menos 1'),
      }),
    )
    .min(1, 'Debe especificar al menos un item'),
  shippingMethod: z.enum(ShippingMethod),
  shippingAddress: addressSchema,
  paymentMethod: z.enum(PaymentMethod),
  createdAt: z
    .string()
    .refine(
      (dateString) => {
        const date = new Date(dateString);
        return !isNaN(date.getTime());
      },
      {
        message: 'La fecha debe ser un string de fecha válido (formato ISO)',
      },
    )
    .optional(),
  allowViewInvoice: z.boolean().optional(),
  comments: z.string().max(500, 'Los comentarios no pueden exceder los 500 caracteres').optional(),
});

export const getAllOrdersParamsSchema = z.object({
  cursor: z
    .string()
    .refine(
      (val) => {
        // Validar formato compuesto: "timestamp_id"
        const parts = val.split('_');
        if (parts.length !== 2) return false;

        const [timestampStr, idStr] = parts;

        // Validar timestamp (debe ser un número válido)
        const timestamp = parseInt(timestampStr, 10);
        if (isNaN(timestamp) || timestamp <= 0) return false;

        // Validar que el ID sea un ObjectId válido
        return Types.ObjectId.isValid(idStr);
      },
      {
        message:
          'El cursor debe tener el formato "timestamp_id" donde timestamp es un número válido e id es un ObjectId válido',
      },
    )
    .optional(),
  limit: z.number().min(1, 'El límite debe ser al menos 1').optional(),
  status: z.enum(OrderStatus).optional(),
});

export const getAllOrdersByPageParamsSchema = z.object({
  page: z.coerce.number().min(1, 'La página debe ser al menos 1').optional(),
  limit: z.coerce.number().min(1, 'El límite debe ser al menos 1').optional(),
  status: z.enum(OrderStatus).optional(),
});

export const updateOrderParamsSchema = z.object({
  orderId: z.string().refine((val) => Types.ObjectId.isValid(val), {
    message: 'El orderId debe ser un ObjectId válido',
  }),
});

export const updateOrderBodySchema = z.object({
  orderStatus: z.enum(Object.values(OrderStatus) as string[]).optional(),
  items: z
    .array(
      z
        .object({
          productVariantId: z.string().refine((val) => Types.ObjectId.isValid(val), {
            message: 'El productVariantId debe ser un ObjectId válido',
          }),
          action: z.enum(['increase', 'decrease', 'remove', 'add', 'set', 'update_prices', 'update_all'], {
            message: 'La acción debe ser: increase, decrease, remove, add, set, update_prices o update_all',
          }),
          quantity: z.number().min(1, 'La cantidad debe ser mayor a 0').optional(),
          // Nuevos campos para actualización de precios
          costUSDAtPurchase: z.number().min(0, 'El costo debe ser mayor o igual a 0').optional(),
          priceUSDAtPurchase: z.number().min(0, 'El precio debe ser mayor o igual a 0').optional(),
          subTotal: z.number().min(0, 'El subtotal debe ser mayor o igual a 0').optional(),
          contributionMarginUSD: z.number().optional(), // Puede ser negativo en casos especiales
        })
        .refine(
          (data) => {
            // Para 'add', 'increase', 'decrease', 'set' la cantidad es requerida
            if (['add', 'increase', 'decrease', 'set'].includes(data.action)) {
              return data.quantity !== undefined;
            }
            // Para 'update_prices' al menos uno de los precios es requerido
            if (data.action === 'update_prices') {
              return data.costUSDAtPurchase !== undefined || data.priceUSDAtPurchase !== undefined;
            }
            // Para 'update_all' al menos un campo debe estar presente
            if (data.action === 'update_all') {
              return (
                data.quantity !== undefined ||
                data.costUSDAtPurchase !== undefined ||
                data.priceUSDAtPurchase !== undefined ||
                data.subTotal !== undefined ||
                data.contributionMarginUSD !== undefined
              );
            }
            return true;
          },
          {
            message:
              'Validación de campos por acción: [add|increase|decrease|set] requieren quantity. [update_prices] requiere al menos costUSDAtPurchase o priceUSDAtPurchase. [update_all] requiere al menos un campo a actualizar.',
          },
        )
        .refine(
          (data) => {
            // Validación adicional: si se especifica contributionMarginUSD manual, también debe haber costos
            if (data.action === 'update_all' && data.contributionMarginUSD !== undefined) {
              // Si se da contributionMarginUSD manual, se recomienda tener al menos los precios para contexto
              // Pero no es obligatorio ya que puede ser un override total
              return true;
            }
            return true;
          },
          {
            message:
              'Cuando se especifica contributionMarginUSD manual, se recomienda proporcionar también los precios para mantener contexto.',
          },
        ),
    )
    .optional(),
  createdAt: z
    .string()
    .refine(
      (dateString) => {
        const date = new Date(dateString);
        return !isNaN(date.getTime());
      },
      {
        message: 'La fecha debe ser un string de fecha válido (formato ISO)',
      },
    )
    .optional(),
  shippingMethod: z.enum(ShippingMethod).optional(),
  paymentMethod: z.enum(PaymentMethod).optional(),
  shippingAddress: z
    .object({
      firstName: z.string().min(1, 'El nombre es obligatorio').max(50, 'El nombre no puede exceder los 50 caracteres'),
      lastName: z
        .string()
        .min(1, 'El apellido es obligatorio')
        .max(50, 'El apellido no puede exceder los 50 caracteres'),
      companyName: z.string().max(50, 'El nombre de la empresa no puede exceder los 50 caracteres').optional(),
      email: z
        .string()
        .email('El correo electrónico no es válido')
        .max(100, 'El correo electrónico no puede exceder los 100 caracteres'),
      phoneNumber: z
        .string()
        .min(1, 'El número de teléfono es obligatorio')
        .max(20, 'El número de teléfono no puede exceder los 20 caracteres'),
      dni: z.string().min(1, 'El DNI es obligatorio').max(20, 'El DNI no puede exceder los 20 caracteres'),
      streetAddress: z
        .string()
        .min(1, 'La dirección es obligatoria')
        .max(100, 'La dirección no puede exceder los 100 caracteres'),
      city: z.string().min(1, 'La ciudad es obligatoria').max(50, 'La ciudad no puede exceder los 50 caracteres'),
      state: z.string().min(1, 'El estado es obligatorio').max(50, 'El estado no puede exceder los 50 caracteres'),
      postalCode: z
        .string()
        .min(1, 'El código postal es obligatorio')
        .max(20, 'El código postal no puede exceder los 20 caracteres'),
      shippingCompany: z.string().max(50, 'La empresa de envío no puede exceder los 50 caracteres').optional(),
      declaredShippingAmount: z
        .string()
        .max(20, 'El monto declarado de envío no puede exceder los 20 caracteres')
        .optional(),
      deliveryWindow: z.string().max(50, 'La ventana de entrega no puede exceder los 50 caracteres').optional(),
      deliveryType: z
        .enum(Object.values(DeliveryType) as [string, ...string[]], {
          message: 'El tipo de entrega debe ser HOME_DELIVERY o PICKUP_POINT',
        })
        .optional(),
      pickupPointAddress: z
        .string()
        .max(100, 'La dirección del punto de retiro no puede exceder los 100 caracteres')
        .optional(),
    })
    .optional(),
  deliveryWindow: z.string().max(50, 'La ventana de entrega no puede exceder los 50 caracteres').optional(),
  declaredShippingAmount: z
    .string()
    .max(20, 'El monto declarado de envío no puede exceder los 20 caracteres')
    .optional(),
  allowViewInvoice: z.boolean().optional(),
  comments: z.string().max(500, 'Los comentarios no pueden exceder los 500 caracteres').optional(),
});

export const bulkUpdateOrderStatusBodySchema = z.object({
  orderIds: z
    .array(
      z.string().refine((val) => Types.ObjectId.isValid(val), {
        message: 'Cada orderId debe ser un ObjectId válido',
      }),
    )
    .min(1, 'Debe especificar al menos una orden')
    .max(100, 'No se pueden actualizar más de 100 órdenes a la vez'),
  newStatus: z.enum(Object.values(OrderStatus) as string[], {
    message: 'El estado debe ser uno de los valores válidos',
  }),
});

// Schema para verificar disponibilidad de stock
export const checkStockAvailabilityParamsSchema = z.object({
  orderId: z.string().refine((val) => Types.ObjectId.isValid(val), {
    message: 'El orderId debe ser un ObjectId válido',
  }),
});

// Schema para actualizar estado con manejo de conflictos
export const updateOrderStatusWithConflictsBodySchema = z.object({
  orderStatus: z.enum(Object.values(OrderStatus) as string[], {
    message: 'El estado debe ser uno de los valores válidos',
  }),
});

// Schemas para reembolsos
export const applyRefundParamsSchema = z.object({
  orderId: z.string().refine((val) => Types.ObjectId.isValid(val), {
    message: 'El orderId debe ser un ObjectId válido',
  }),
});

export const applyRefundBodySchema = z
  .object({
    type: z.enum(['fixed', 'percentage'], {
      message: 'El tipo de reembolso debe ser "fixed" o "percentage"',
    }),
    amount: z.number().min(0, 'El monto debe ser mayor o igual a 0'),
    reason: z.string().max(500, 'La razón no puede exceder los 500 caracteres').optional(),
  })
  .refine(
    (data) => {
      // Para reembolsos de porcentaje, validar que esté entre 0 y 100
      if (data.type === 'percentage') {
        return data.amount >= 0 && data.amount <= 100;
      }
      // Para montos fijos, validar que no sea excesivo
      if (data.type === 'fixed') {
        return data.amount <= 100000;
      }
      return true;
    },
    {
      message:
        'Para reembolsos de porcentaje, el valor debe estar entre 0 y 100. Para montos fijos, no puede exceder $100,000 USD',
    },
  );

export const cancelRefundParamsSchema = z.object({
  orderId: z.string().refine((val) => Types.ObjectId.isValid(val), {
    message: 'El orderId debe ser un ObjectId válido',
  }),
});

// Schema para búsqueda de órdenes
export const searchOrdersQuerySchema = z.object({
  userId: z
    .string()
    .refine((val) => Types.ObjectId.isValid(val), {
      message: 'El userId debe ser un ObjectId válido',
    })
    .optional(),
  orderStatus: z
    .enum(OrderStatus, {
      message: 'El estado de la orden debe ser uno de los valores válidos',
    })
    .optional(),
  page: z.coerce.number().min(1, 'La página debe ser al menos 1').optional(),
  limit: z.coerce.number().min(1, 'El límite debe ser al menos 1').max(100, 'El límite máximo es 100').optional(),
});

// Schema para conteo de órdenes por búsqueda
export const getOrdersCountBySearchQuerySchema = z.object({
  userId: z
    .string()
    .refine((val) => Types.ObjectId.isValid(val), {
      message: 'El userId debe ser un ObjectId válido',
    })
    .optional(),
});
