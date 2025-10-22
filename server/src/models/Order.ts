import { IOrder, IOrderItem } from '@interfaces/order';
import { Schema, model, Document, Types } from 'mongoose';
import { OrderStatus, PaymentMethod, ShippingMethod } from '@enums/order.enum';

// Interfaz extendida para Mongoose
export interface IOrderDocument extends Omit<IOrder, 'items' | 'shippingAddress'>, Document {
  _id: Types.ObjectId;
  items: Types.DocumentArray<IOrderItemDocument>;
  shippingAddress: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

export interface IOrderItemDocument extends Omit<IOrderItem, 'productVariant'>, Document {
  productVariant: Types.ObjectId;
}

// Usa IOrderItem aquí para evitar conflicto con DocumentArray
const orderItemSchema = new Schema<IOrderItem>(
  {
    productVariant: {
      type: Schema.Types.ObjectId,
      ref: 'ProductVariant',
      required: true,
    },
    quantity: { type: Number, required: true, min: 1 },
    subTotal: { type: Number, required: true },
    costUSDAtPurchase: { type: Number, required: true },
    priceUSDAtPurchase: { type: Number, required: true },
    contributionMarginUSD: { type: Number, required: true },
    cogsUSD: { type: Number, required: true }, // Cost of Goods Sold
  },
  {
    _id: false,
    timestamps: false,
  },
);

// Esquema para reembolsos
const refundSchema = new Schema(
  {
    type: {
      type: String,
      enum: ['fixed', 'percentage'],
      required: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    appliedAmount: {
      type: Number,
      required: true,
      min: 0,
    },
    reason: {
      type: String,
      required: false,
      maxlength: 500,
    },
    processedAt: {
      type: Date,
      required: true,
      default: Date.now,
    },
    processedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: false,
    },
    originalSubTotal: {
      type: Number,
      required: true,
      min: 0,
    },
  },
  {
    _id: false,
    timestamps: false,
  },
);

const orderSchema = new Schema<IOrderDocument>(
  {
    orderNumber: {
      type: Number,
      required: true,
      unique: true,
      index: true,
    },
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    items: [orderItemSchema],
    shippingAddress: {
      type: Schema.Types.ObjectId,
      ref: 'Address',
      required: true,
    },
    shippingMethod: {
      type: String,
      enum: Object.values(ShippingMethod),
      required: true,
    },
    paymentMethod: {
      type: String,
      enum: Object.values(PaymentMethod),
      required: true,
    },
    subTotal: { type: Number, required: true, default: 0 },
    bankTransferExpense: { type: Number, required: false },
    totalAmount: { type: Number, required: true, default: 0 },
    totalAmountARS: { type: Number, required: false },
    totalContributionMarginUSD: { type: Number, required: true, default: 0 },
    contributionMarginPercentage: { type: Number, required: true, default: 0 }, // Porcentaje de margen de contribución
    totalCogsUSD: { type: Number, required: true, default: 0 }, // Total Cost of Goods Sold
    orderStatus: {
      type: String,
      enum: Object.values(OrderStatus),
      default: OrderStatus.Processing,
    },
    allowViewInvoice: {
      type: Boolean,
      required: true,
      default: false,
    },
    refund: {
      type: refundSchema,
      required: false,
    },
    exchangeRate: { type: Number, required: true, default: 1 }, // Tasa de cambio USD a ARS
    itemsCount: { type: Number, required: true, default: 0 }, // Total de unidades físicas
    isVisible: { type: Boolean, required: true, default: true }, // Indica si la orden es visible en listados
    comments: { type: String, required: false }, // Comentarios opcionales sobre la orden
  },
  {
    timestamps: true,
  },
);

// Índices para optimizar consultas de analytics
orderSchema.index({ createdAt: 1, orderStatus: 1 }); // Para filtrar por fecha y estado
orderSchema.index({ createdAt: -1, _id: -1 }); // Para ordenamiento determinístico por fecha descendente y _id
// Índice para optimizar consultas basadas únicamente en orderStatus
orderSchema.index({ orderStatus: 1 });

const Order = model<IOrderDocument>('Order', orderSchema);

export default Order;
