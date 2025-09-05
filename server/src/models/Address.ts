import { IAddress } from '@interfaces/address';
import { Schema, model, Document, Types } from 'mongoose';
import { DeliveryType } from '@enums/order.enum';

// Interfaz que extiende Document para incluir las propiedades de IAddress
export interface IAddressDocument extends IAddress, Document {
  _id: Types.ObjectId; // Asegúrate de que el ID sea de tipo ObjectId
}

// Definición del esquema de Mongoose correspondiente a IAddress
const addressSchema = new Schema<IAddressDocument>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    companyName: { type: String, required: false },
    email: { type: String, required: true },
    phoneNumber: { type: String, required: true },
    dni: { type: String, required: true },
    cuit: { type: String, required: false },
    streetAddress: { type: String, required: false }, // Ahora opcional
    city: { type: String, required: true },
    state: { type: String, required: true },
    postalCode: { type: String, required: true },
    shippingCompany: { type: String, required: false },
    declaredShippingAmount: { type: String, required: false },
    deliveryWindow: { type: String, required: false },
    deliveryType: {
      type: String,
      enum: Object.values(DeliveryType),
      required: false,
      default: DeliveryType.HomeDelivery,
    },
    pickupPointAddress: { type: String, required: false },
  },
  {
    timestamps: true, // Agrega campos createdAt y updatedAt automáticamente
  },
);

// Validación personalizada para asegurar que streetAddress sea requerido cuando deliveryType es HOME_DELIVERY
addressSchema.pre('validate', function (next) {
  if (this.deliveryType === DeliveryType.HomeDelivery && !this.streetAddress) {
    this.invalidate('streetAddress', 'streetAddress es requerido cuando el tipo de entrega es a domicilio');
  }

  if (this.deliveryType === DeliveryType.PickupPoint && !this.pickupPointAddress) {
    this.invalidate(
      'pickupPointAddress',
      'pickupPointAddress es requerido cuando el tipo de entrega es punto de retiro',
    );
  }

  next();
});

// Creación del modelo de Mongoose
const Address = model<IAddressDocument>('Address', addressSchema);

export default Address;
