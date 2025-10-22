import { OrderStatus, PaymentMethod, ShippingMethod } from '@enums/order.enum';
import { Types } from 'mongoose';

export interface IOrderItem {
  productVariant: Types.ObjectId;
  quantity: number;
  subTotal: number;
  costUSDAtPurchase: number;
  priceUSDAtPurchase: number;
  contributionMarginUSD: number;
  cogsUSD: number; // Cost of Goods Sold = costUSDAtPurchase * quantity
}

export interface IRefund {
  type: 'fixed' | 'percentage';
  amount: number; // Monto fijo en USD o porcentaje (0-100)
  appliedAmount: number; // Monto real aplicado en USD
  reason?: string;
  processedAt: Date;
  processedBy?: Types.ObjectId;
  originalSubTotal: number; // Subtotal original antes del reembolso (para mostrar tachado en frontend)
}

export interface IOrder {
  orderNumber: number;
  user: Types.ObjectId;
  items: IOrderItem[];
  shippingAddress: Types.ObjectId;
  shippingMethod: ShippingMethod;
  paymentMethod: PaymentMethod;
  subTotal: number;
  bankTransferExpense?: number;
  totalAmount: number;
  totalAmountARS?: number;
  totalContributionMarginUSD: number;
  contributionMarginPercentage: number; // Porcentaje de margen de contribución = (totalContributionMarginUSD / subTotal) * 100
  totalCogsUSD: number; // Total Cost of Goods Sold = suma de cogsUSD de todos los items
  orderStatus: OrderStatus;
  allowViewInvoice: boolean;
  refund?: IRefund;
  exchangeRate: number; // Tasa de cambio USD a ARS
  itemsCount: number; // Total de unidades físicas = suma de quantity de todos los items
  isVisible: boolean; // Indica si la orden es visible en listados
  comments?: string; // Comentarios opcionales sobre la orden
}

export interface IRefund {
  type: 'fixed' | 'percentage';
  amount: number; // Monto fijo en USD o porcentaje (0-100)
  appliedAmount: number; // Monto real aplicado en USD
  reason?: string;
  processedAt: Date;
  processedBy?: Types.ObjectId;
  originalSubTotal: number; // Subtotal original antes del reembolso
}
