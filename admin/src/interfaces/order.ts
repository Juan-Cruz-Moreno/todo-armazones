import {
  DeliveryType,
  OrderStatus,
  PaymentMethod,
  ShippingMethod,
} from "@/enums/order.enum";
import { UserStatus } from "@/enums/user.enum";

export interface Order {
  id: string;
  orderNumber: number;
  user: {
    id: string;
    email: string;
    displayName: string;
    firstName?: string;
    lastName?: string;
    dni?: string;
    cuit?: string;
    role: "USER" | "ADMIN";
    status: UserStatus;
  };
  items: OrderItem[];
  shippingAddress: ShippingAddress;
  shippingMethod: ShippingMethod;
  paymentMethod: PaymentMethod;
  subTotal: number;
  bankTransferExpense?: number;
  totalAmount: number;
  totalAmountARS: number;
  totalCogsUSD: number;
  totalContributionMarginUSD: number;
  orderStatus: OrderStatus;
  allowViewInvoice: boolean;
  refund?: RefundDetails | null;
  createdAt: string;
  updatedAt: string;
}

export interface OrderItem {
  productVariant: {
    id: string;
    color: {
      name: string;
      hex: string;
    };
    images: string[];
    product: {
      id: string;
      slug: string;
      thumbnail: string;
      productModel: string;
      sku: string;
      size?: string;
      costUSD: number;
      priceUSD: number;
      primaryImage: string;
    };
  };
  quantity: number;
  subTotal: number;
  costUSDAtPurchase: number;
  priceUSDAtPurchase: number;
  cogsUSD: number;
  contributionMarginUSD: number;
}

export interface ShippingAddress {
  firstName: string;
  lastName: string;
  companyName?: string;
  email: string;
  phoneNumber: string;
  dni: string;
  cuit?: string;
  streetAddress: string;
  city: string;
  state: string;
  postalCode: string;
  shippingCompany?: string;
  declaredShippingAmount?: string;
  deliveryWindow?: string;
  deliveryType?: DeliveryType; // Nuevo campo
  pickupPointAddress?: string; // Nuevo campo
}

// Payload para actualizar items de la orden
export interface UpdateOrderItemPayload {
  productVariantId: string;
  action: "increase" | "decrease" | "remove" | "add" | "set" | "update_prices" | "update_all";
  quantity?: number;
  // Nuevos campos para actualización de precios y valores financieros
  costUSDAtPurchase?: number; // Para 'update_prices', 'update_all'
  priceUSDAtPurchase?: number; // Para 'update_prices', 'update_all'
  subTotal?: number; // Para 'update_all' (override manual del subtotal)
  contributionMarginUSD?: number; // Para 'update_all' (override manual de la contribución marginal)
}

export interface UpdateOrderPayload {
  orderId: string;
  orderStatus?: OrderStatus;
  items?: UpdateOrderItemPayload[];
  createdAt?: string;
  shippingMethod?: ShippingMethod;
  paymentMethod?: PaymentMethod;
  shippingAddress?: ShippingAddress;
  deliveryWindow?: string;
  declaredShippingAmount?: string;
  allowViewInvoice?: boolean;
}

export interface OrdersResponse {
  orders: Order[];
  nextCursor: string | null;
}

// Payload para actualización masiva de estados
export interface BulkUpdateOrderStatusPayload {
  orderIds: string[];
  newStatus: OrderStatus;
}

// Respuesta de la actualización masiva
export interface BulkUpdateOrderStatusResponse {
  successfulUpdates: string[];
  failedUpdates: {
    orderId: string;
    error: string;
  }[];
  totalRequested: number;
  totalSuccessful: number;
  totalFailed: number;
}

// Conflictos de stock
export interface StockConflictItem {
  productVariantId: string;
  requiredQuantity: number;
  availableStock: number;
  productInfo: {
    productModel: string;
    sku: string;
    color: { name: string; hex: string };
  };
}

// Respuesta de verificación de stock
export interface StockAvailabilityResponse {
  hasConflicts: boolean;
  conflicts: StockConflictItem[];
}

// Respuesta de actualización de estado con manejo de conflictos
export interface OrderStatusUpdateResult {
  success: boolean;
  order?: Order;
  stockConflicts?: StockConflictItem[];
  message: string;
}

// Payload específico para actualización rápida de precios
export interface UpdateItemPricesPayload {
  orderId: string;
  items: {
    productVariantId: string;
    costUSDAtPurchase?: number;
    priceUSDAtPurchase?: number;
  }[];
}

// Payload para actualización completa de un item
export interface UpdateItemCompletePayload {
  orderId: string;
  productVariantId: string;
  quantity?: number;
  costUSDAtPurchase?: number;
  priceUSDAtPurchase?: number;
  subTotal?: number;
  contributionMarginUSD?: number;
}

// Interfaces para reembolsos
export interface RefundDetails {
  type: 'fixed' | 'percentage';
  amount: number;
  appliedAmount: number;
  reason?: string;
  processedAt: string;
  processedBy?: string;
}

export interface ApplyRefundPayload {
  orderId: string;
  type: 'fixed' | 'percentage';
  amount: number;
  reason?: string;
}

export interface RefundEligibilityResponse {
  canRefund: boolean;
  reason?: string;
  maxRefundAmount?: number;
}

export interface ApplyRefundResponse {
  success: boolean;
  order?: Order;
  message: string;
  refundDetails?: {
    originalSubTotal: number;
    refundAmount: number;
    newSubTotal: number;
    originalBankTransferExpense?: number;
    newBankTransferExpense?: number;
    originalTotalAmount: number;
    newTotalAmount: number;
  };
}

export interface CancelRefundResponse {
  success: boolean;
  order?: Order;
  message: string;
  refundCancellationDetails?: {
    cancelledRefundAmount: number;
    originalSubTotal: number;
    restoredSubTotal: number;
    originalBankTransferExpense?: number;
    restoredBankTransferExpense?: number;
    originalTotalAmount: number;
    restoredTotalAmount: number;
    originalContributionMarginUSD: number;
    restoredContributionMarginUSD: number;
    cogsUSD: number;
  };
}

export interface RefundCancelEligibilityResponse {
  canCancelRefund: boolean;
  reason?: string;
  refundAmount?: number;
}
