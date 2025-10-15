import { DeliveryType } from "@/enums/order.enum";

export interface IAddress {
  _id: string;
  userId: string;
  firstName: string;
  lastName: string;
  companyName?: string;
  email: string;
  phoneNumber: string;
  dni: string;
  cuit?: string;
  streetAddress?: string;
  city: string;
  state: string;
  postalCode: string;
  shippingCompany?: string;
  declaredShippingAmount?: string;
  deliveryWindow?: string;
  deliveryType?: DeliveryType;
  pickupPointAddress?: string;
  createdAt: Date;
  updatedAt: Date;
}
