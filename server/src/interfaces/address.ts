import { Types } from 'mongoose';
import { DeliveryType } from '@enums/order.enum';

export interface IAddress {
  userId: Types.ObjectId;
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
  deliveryType?: DeliveryType; // Nuevo campo para tipo de entrega
  pickupPointAddress?: string; // Dirección del punto de retiro cuando es PICKUP_POINT
  isDefault?: boolean; // Campo opcional para marcar la dirección como favorita o por defecto
}
