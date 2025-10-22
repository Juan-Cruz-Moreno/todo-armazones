import { DeliveryType } from "@/enums/order.enum";

export interface IAddress {
  id: string;
  userId: string;
  firstName: string;
  lastName: string;
  companyName?: string;
  email: string;
  phoneNumber: string;
  dni: string;
  cuit?: string;
  streetAddress?: string; // Opcional cuando es pickup point
  city: string;
  state: string;
  postalCode: string;
  shippingCompany?: string;
  declaredShippingAmount?: string;
  deliveryWindow?: string;
  deliveryType?: DeliveryType;
  pickupPointAddress?: string; // Dirección del punto de retiro cuando es PICKUP_POINT
  isDefault?: boolean; // Dirección favorita o por defecto
  createdAt: Date;
  updatedAt: Date;
}

export interface UpdateAddressPayload {
  firstName?: string;
  lastName?: string;
  companyName?: string;
  email?: string;
  phoneNumber?: string;
  dni?: string;
  cuit?: string;
  streetAddress?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  shippingCompany?: string;
  declaredShippingAmount?: string;
  deliveryWindow?: string;
  deliveryType?: DeliveryType;
  pickupPointAddress?: string;
}
