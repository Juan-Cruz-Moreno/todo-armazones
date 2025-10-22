import { z } from "zod";
import { ShippingMethod, DeliveryType, PaymentMethod } from "@/enums/order.enum";

export const addressSchema = z
  .object({
    firstName: z.string().min(1, "Nombre requerido").max(50, "El nombre no puede exceder los 50 caracteres"),
    lastName: z.string().min(1, "Apellido requerido").max(50, "El apellido no puede exceder los 50 caracteres"),
    email: z.email("Email inválido").max(100, "El correo electrónico no puede exceder los 100 caracteres"),
    phoneNumber: z.string().min(1, "Teléfono requerido").max(20, "El número de teléfono no puede exceder los 20 caracteres"),
    dni: z.string().min(1, "DNI requerido").max(20, "El DNI no puede exceder los 20 caracteres"),
    cuit: z.string().optional(),
    streetAddress: z.string().max(100, "La dirección no puede exceder los 100 caracteres").optional(),
    city: z.string().min(1, "Ciudad requerida").max(50, "La ciudad no puede exceder los 50 caracteres"),
    state: z.string().min(1, "Provincia requerida").max(50, "El estado no puede exceder los 50 caracteres"),
    postalCode: z.string().min(1, "Código postal requerido").max(20, "El código postal no puede exceder los 20 caracteres"),
    companyName: z.string().max(50, "El nombre de la empresa no puede exceder los 50 caracteres").optional(),
    shippingCompany: z.string().max(50, "La empresa de envío no puede exceder los 50 caracteres").optional(),
    declaredShippingAmount: z.string().max(20, "El monto declarado de envío no puede exceder los 20 caracteres").optional(),
    deliveryWindow: z.string().max(50, "La ventana de entrega no puede exceder los 50 caracteres").optional(),
    deliveryType: z.enum(DeliveryType).optional(),
    pickupPointAddress: z.string().max(200, "La dirección del punto de retiro no puede exceder los 200 caracteres").optional(),
    // Agregamos shippingMethod solo para validación contextual
    shippingMethod: z.enum(ShippingMethod),
    comments: z.string().max(500, "Los comentarios no pueden exceder los 500 caracteres").optional(),
  })
  .superRefine((data, ctx) => {
    // Validación para shippingCompany cuando es ParcelCompany
    if (
      data.shippingMethod === ShippingMethod.ParcelCompany &&
      !data.shippingCompany
    ) {
      ctx.addIssue({
        path: ["shippingCompany"],
        code: "custom",
        message: "Transporte / Empresa de encomienda es requerido",
      });
    }

    // Validación condicional para tipos de entrega
    const deliveryType = data.deliveryType || DeliveryType.HomeDelivery; // Por defecto HOME_DELIVERY

    if (deliveryType === DeliveryType.HomeDelivery && !data.streetAddress) {
      ctx.addIssue({
        path: ["streetAddress"],
        code: "custom",
        message: "La dirección es obligatoria para entrega a domicilio",
      });
    }

    if (deliveryType === DeliveryType.PickupPoint && !data.pickupPointAddress) {
      ctx.addIssue({
        path: ["pickupPointAddress"],
        code: "custom",
        message: "La dirección del punto de retiro es obligatoria",
      });
    }

    // Validación para deliveryWindow cuando es Motorcycle
    if (
      data.shippingMethod === ShippingMethod.Motorcycle &&
      !data.deliveryWindow
    ) {
      ctx.addIssue({
        path: ["deliveryWindow"],
        code: "custom",
        message: "El horario de entrega es obligatorio para envíos en moto",
      });
    }
  });

export type AddressFormData = z.infer<typeof addressSchema>;

// Esquema para crear órdenes
export const createOrderSchema = z.object({
  shippingMethod: z.enum(ShippingMethod),
  shippingAddress: addressSchema,
  paymentMethod: z.enum(Object.values(PaymentMethod) as [string, ...string[]], {
    message: "Método de pago inválido",
  }),
  comments: z.string().max(500, "Los comentarios no pueden exceder los 500 caracteres").optional(),
});

export type CreateOrderFormData = z.infer<typeof createOrderSchema>;
