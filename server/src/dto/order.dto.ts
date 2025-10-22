import { OrderStatus, PaymentMethod, ShippingMethod, DeliveryType } from '@enums/order.enum';
import { IAddress } from '@interfaces/address';
import { Types } from 'mongoose';

export interface PaginationMetadata {
  totalCount: number;
  totalPages: number;
  currentPage: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
  nextCursor: string | null;
  previousCursor: string | null;
  limit: number;
  itemsInCurrentPage: number;
}

export interface CreateOrderDto {
  shippingMethod: ShippingMethod;
  deliveryWindow?: string;
  declaredShippingAmount?: string;
  shippingAddress: IAddress; // Solo objeto, no ObjectId
  paymentMethod: PaymentMethod;
  comments?: string; // Comentarios opcionales sobre la orden
}

// DTO para que el admin cree órdenes directamente con ProductVariants
export interface CreateOrderItemAdminDto {
  productVariantId: Types.ObjectId;
  quantity: number;
}

export interface CreateOrderAdminDto {
  userId: Types.ObjectId;
  items: CreateOrderItemAdminDto[];
  shippingMethod: ShippingMethod;
  deliveryWindow?: string;
  declaredShippingAmount?: string;
  shippingAddress: IAddress;
  paymentMethod: PaymentMethod;
  createdAt?: Date; // Fecha personalizada para la orden
  allowViewInvoice?: boolean; // Permitir ver factura al crear
  comments?: string; // Comentarios opcionales sobre la orden
}

// DTOs para actualización completa de órdenes
export interface UpdateOrderItemDto {
  productVariantId: Types.ObjectId;
  action: 'increase' | 'decrease' | 'remove' | 'add' | 'set' | 'update_prices' | 'update_all';
  quantity?: number; // Para 'add', 'increase', 'decrease', 'set'
  // Nuevos campos para actualización de precios y valores financieros
  costUSDAtPurchase?: number; // Para 'update_prices', 'update_all'
  priceUSDAtPurchase?: number; // Para 'update_prices', 'update_all'
  subTotal?: number; // Para 'update_all' (override manual del subtotal)
  contributionMarginUSD?: number; // Para 'update_all' (override manual del margen de contribución)
}

export interface UpdateOrderDto {
  orderStatus?: OrderStatus;
  items?: UpdateOrderItemDto[];
  createdAt?: Date;
  shippingMethod?: ShippingMethod;
  paymentMethod?: PaymentMethod;
  shippingAddress?: IAddress;
  deliveryWindow?: string;
  declaredShippingAmount?: string;
  allowViewInvoice?: boolean;
  comments?: string; // Comentarios opcionales sobre la orden
}

// DTO para actualización masiva de estados de órdenes
export interface BulkUpdateOrderStatusDto {
  orderIds: Types.ObjectId[];
  newStatus: OrderStatus;
}

// DTO de respuesta para un item de la orden
export interface ProductBaseResponse {
  id: string;
  slug: string;
  thumbnail: string;
  productModel: string;
  sku: string;
  code: string;
  size?: string | undefined;
}
export interface ProductVariantResponse {
  id: string;
  color: { name: string; hex: string };
  images: string[];
  priceUSD: number;
  product: ProductBaseResponse;
}

export interface OrderItemResponse {
  productVariant: ProductVariantResponse;
  quantity: number;
  subTotal: number;
  costUSDAtPurchase: number;
  priceUSDAtPurchase: number;
  contributionMarginUSD: number;
  cogsUSD: number; // Cost of Goods Sold
}

// DTO seguro para exponer datos de usuario en respuestas de orden
export interface UserResponse {
  id: string;
  email: string;
  displayName: string;
  firstName?: string;
  lastName?: string;
  dni?: string;
  cuit?: string;
  phone?: string;
  role: string;
  status: string;
}

export interface AddressResponse {
  firstName: string;
  lastName: string;
  companyName?: string | undefined;
  email: string;
  phoneNumber: string;
  dni: string;
  cuit?: string;
  streetAddress?: string | undefined; // Ahora opcional
  city: string;
  state: string;
  postalCode: string;
  shippingCompany?: string | undefined;
  declaredShippingAmount?: string | undefined;
  deliveryWindow?: string | undefined;
  deliveryType?: DeliveryType | undefined; // Nuevo campo
  pickupPointAddress?: string | undefined; // Nuevo campo
}

// DTO de respuesta general para una orden
export interface OrderResponseDto {
  id: string;
  orderNumber: number;
  user: UserResponse; // Ahora es el DTO seguro
  items: OrderItemResponse[];
  shippingAddress: AddressResponse;
  shippingMethod: ShippingMethod;
  paymentMethod: PaymentMethod;
  subTotal: number;
  bankTransferExpense?: number;
  totalAmount: number;
  totalAmountARS: number;
  totalContributionMarginUSD: number;
  contributionMarginPercentage: number; // Porcentaje de margen de contribución
  totalCogsUSD: number; // Total Cost of Goods Sold
  orderStatus: OrderStatus;
  allowViewInvoice: boolean;
  refund?: RefundResponse | null;
  createdAt: string;
  updatedAt: string;
  exchangeRate: number; // Tasa de cambio USD a ARS
  itemsCount: number; // Total de unidades físicas
  isVisible: boolean; // Indica si la orden es visible en listados
  comments?: string; // Comentarios opcionales sobre la orden
}

// Versiones para usuario usando Omit
export type OrderItemUserResponse = Omit<OrderItemResponse, 'costUSDAtPurchase' | 'contributionMarginUSD' | 'cogsUSD'>;

export type OrderUserResponseDto = Omit<
  OrderResponseDto,
  'totalContributionMarginUSD' | 'contributionMarginPercentage' | 'totalCogsUSD' | 'items'
> & {
  items: OrderItemUserResponse[];
};

// DTO de respuesta para actualización masiva
export interface BulkUpdateOrderStatusResponseDto {
  successfulUpdates: string[]; // IDs de órdenes actualizadas exitosamente
  failedUpdates: {
    orderId: string;
    error: string;
  }[]; // IDs de órdenes que fallaron con sus errores
  totalRequested: number;
  totalSuccessful: number;
  totalFailed: number;
}

// DTOs para manejo de conflictos de stock en cambios de estado
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

export interface OrderStatusUpdateResultDto {
  success: boolean;
  order?: OrderResponseDto;
  stockConflicts?: StockConflictItem[];
  message: string;
}

// DTOs para manejo de reembolsos
export interface RefundDto {
  type: 'fixed' | 'percentage';
  amount: number; // Monto fijo en USD o porcentaje (0-100)
  reason?: string;
}

export interface RefundResponse {
  type: 'fixed' | 'percentage';
  amount: number;
  appliedAmount: number;
  reason?: string;
  processedAt: string;
  processedBy?: string;
  originalSubTotal: number; // Subtotal original antes del reembolso
}

export interface ApplyRefundResultDto {
  success: boolean;
  order?: OrderResponseDto;
  message: string;
  refundDetails?: {
    originalSubTotal: number;
    refundAmount: number;
    newSubTotal: number;
    originalBankTransferExpense?: number;
    newBankTransferExpense?: number;
    originalTotalAmount: number;
    newTotalAmount: number;
    originalContributionMarginUSD: number;
    newContributionMarginUSD: number;
    cogsUSD: number; // COGS permanece sin cambios durante reembolso
  };
}

export interface CancelRefundResultDto {
  success: boolean;
  order?: OrderResponseDto;
  message: string;
  refundCancellationDetails?: {
    cancelledRefundAmount: number;
    originalSubTotal: number; // Subtotal antes de cancelar el reembolso (con reembolso aplicado)
    restoredSubTotal: number; // Subtotal después de cancelar el reembolso (valor original)
    originalBankTransferExpense?: number;
    restoredBankTransferExpense?: number;
    originalTotalAmount: number;
    restoredTotalAmount: number;
    originalContributionMarginUSD: number;
    restoredContributionMarginUSD: number;
    cogsUSD: number; // COGS permanece sin cambios
  };
}

// DTOs para búsqueda de órdenes
export interface SearchOrdersDto {
  userId?: Types.ObjectId | string; // ID del usuario para filtrar órdenes
  orderStatus?: OrderStatus; // Estado de la orden para filtrar
  page?: number; // Número de página (default: 1)
  limit?: number; // Cantidad de resultados por página (default: 10)
}

export interface SearchOrdersResultDto {
  orders: OrderResponseDto[];
  pagination: PaginationMetadata;
  searchCriteria: SearchOrdersDto;
}
