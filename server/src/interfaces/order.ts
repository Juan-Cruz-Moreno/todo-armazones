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
  totalCogsUSD: number; // Total Cost of Goods Sold = suma de cogsUSD de todos los items
  orderStatus: OrderStatus;
  allowViewInvoice: boolean;
  refund?: IRefund;
}
