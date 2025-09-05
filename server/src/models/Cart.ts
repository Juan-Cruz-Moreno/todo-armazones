import { ICart, ICartItem } from '@interfaces/cart';
import { Schema, model, Document, Types } from 'mongoose';

// Interfaz extendida para Mongoose
export interface ICartDocument extends Omit<ICart, 'items'>, Document {
  items: Types.DocumentArray<ICartItemDocument>;
  createdAt: Date;
  updatedAt: Date;
}

export interface ICartItemDocument extends Omit<ICartItem, 'productVariant'>, Document {
  productVariant: Types.ObjectId;
}

// Usa ICartItem aquí para evitar conflicto con DocumentArray
const cartItemSchema = new Schema<ICartItem>(
  {
    productVariant: {
      type: Schema.Types.ObjectId,
      ref: 'ProductVariant',
      required: true,
    },
    quantity: { type: Number, required: true, min: 1 },
    subTotal: { type: Number, required: true },
  },
  {
    _id: false,
    timestamps: false,
  },
);

const cartSchema = new Schema<ICartDocument>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    items: [cartItemSchema],
    subTotal: { type: Number, required: true, default: 0 },
  },
  {
    timestamps: true,
  },
);

cartSchema.index({ userId: 1 }, { unique: true });

const Cart = model<ICartDocument>('Cart', cartSchema);

export default Cart;
