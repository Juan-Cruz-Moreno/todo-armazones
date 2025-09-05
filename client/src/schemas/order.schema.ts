import { z } from "zod";
import { ShippingMethod, DeliveryType } from "@/enums/order.enum";

export const addressSchema = z
  .object({
    firstName: z.string().min(1, "Nombre requerido"),
    lastName: z.string().min(1, "Apellido requerido"),
    email: z.email("Email inválido"),
    phoneNumber: z.string().min(1, "Teléfono requerido"),
    dni: z.string().min(1, "DNI requerido"),
    cuit: z.string().optional(),
    streetAddress: z.string().optional(), // Ahora opcional
    city: z.string().min(1, "Ciudad requerida"),
    state: z.string().min(1, "Provincia requerida"),
    postalCode: z.string().min(1, "Código postal requerido"),
    companyName: z.string().optional(),
    shippingCompany: z.string().optional(),
    declaredShippingAmount: z.string().optional(),
    deliveryWindow: z.string().optional(),
    deliveryType: z.enum(DeliveryType).optional(), // Nuevo campo
    pickupPointAddress: z.string().optional(), // Nuevo campo
    // Agregamos shippingMethod solo para validación contextual
    shippingMethod: z.enum(ShippingMethod),
  })
  .superRefine((data, ctx) => {
    // Validación para shippingCompany cuando es ParcelCompany
    if (data.shippingMethod === ShippingMethod.ParcelCompany && !data.shippingCompany) {
      ctx.addIssue({
        path: ["shippingCompany"],
        code: z.ZodIssueCode.custom,
        message: "Transporte / Empresa de encomienda es requerido",
      });
    }

    // Validación condicional para tipos de entrega
    const deliveryType = data.deliveryType || DeliveryType.HomeDelivery; // Por defecto HOME_DELIVERY

    if (deliveryType === DeliveryType.HomeDelivery && !data.streetAddress) {
      ctx.addIssue({
        path: ["streetAddress"],
        code: z.ZodIssueCode.custom,
        message: "La dirección es obligatoria para entrega a domicilio",
      });
    }

    if (deliveryType === DeliveryType.PickupPoint && !data.pickupPointAddress) {
      ctx.addIssue({
        path: ["pickupPointAddress"],
        code: z.ZodIssueCode.custom,
        message: "La dirección del punto de retiro es obligatoria",
      });
    }

    // Validación para deliveryWindow cuando es Motorcycle
    if (data.shippingMethod === ShippingMethod.Motorcycle && !data.deliveryWindow) {
      ctx.addIssue({
        path: ["deliveryWindow"],
        code: z.ZodIssueCode.custom,
        message: "El horario de entrega es obligatorio para envíos en moto",
      });
    }
  });

export type AddressFormData = z.infer<typeof addressSchema>;
