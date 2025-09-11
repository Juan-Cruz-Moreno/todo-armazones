import mongoose, { Types } from 'mongoose';
import {
  AddressResponse,
  CreateOrderDto,
  CreateOrderAdminDto,
  CreateOrderItemAdminDto,
  OrderResponseDto,
  UpdateOrderDto,
  UpdateOrderItemDto,
  ProductVariantResponse,
  ProductBaseResponse,
  OrderUserResponseDto,
  OrderItemUserResponse,
  BulkUpdateOrderStatusResponseDto,
  StockConflictItem,
  OrderStatusUpdateResultDto,
  RefundDto,
  RefundResponse,
  ApplyRefundResultDto,
  CancelRefundResultDto,
} from '@dto/order.dto';
import Address, { IAddressDocument } from '@models/Address';
import Cart from '@models/Cart';
import ProductVariant, { IProductVariantPopulated } from '@models/ProductVariant';
import { IProductDocument } from '@models/Product';
import { OrderStatus, PaymentMethod } from '@enums/order.enum';
import { IOrder, IRefund } from '@interfaces/order';
import Order, { IOrderDocument, IOrderItemDocument } from '@models/Order';
import { withTransaction } from '@helpers/withTransaction';
import { AppError } from '@utils/AppError';
import logger from '@config/logger';
import { CartService } from './cart.service';
import CounterModel from '@models/Counter';
import { IAddress } from '@interfaces/address';
import { ICartItem } from '@interfaces/cart';
import { InventoryService } from './inventory.service';
import { IUserDocument } from '@models/User';
import { StockMovementReason } from '@interfaces/stockMovement';
import { UserResponse } from '@dto/order.dto';
import User from '@models/User';
import { generateOrderPDF } from '@utils/pdfGenerator';
import { orderQueue } from '@config/bullmq';
import { CartSyncError, CartSyncChange } from '../controllers/order.controller';
import { IUser } from '@interfaces/user';
import Dollar from '@models/Dollar';

// Tipo para las consultas de filtrado de órdenes
interface OrderQuery {
  user?: Types.ObjectId;
  orderStatus?: OrderStatus;
  _id?: { $lt: Types.ObjectId };
}

// Constante para el populate de órdenes
const ORDER_POPULATE = [
  { path: 'shippingAddress' },
  { path: 'user', select: '-password' },
  {
    path: 'items.productVariant',
    populate: { path: 'product' },
  },
];

export class OrderService {
  private inventoryService = new InventoryService();
  private cartService: CartService = new CartService();

  // Helper: Valida y obtiene el carrito
  private async getValidatedCart(userId: Types.ObjectId, session: mongoose.ClientSession) {
    const cart = await Cart.findOne({ userId }).session(session);
    if (!cart || !Array.isArray(cart.items) || cart.items.length === 0) {
      throw new AppError('El carrito está vacío o es inválido.', 400, 'fail');
    }
    return cart;
  }

  // Helper: Crea la dirección de envío
  private async createShippingAddress(address: IAddress, userId: Types.ObjectId, session: mongoose.ClientSession) {
    const newAddress = await Address.create([{ ...address, userId }], {
      session,
    });
    return newAddress[0]._id;
  }

  // Helper: Procesa los items del carrito, actualiza stock y calcula totales
  private async processCartItems(
    cartItems: ICartItem[],
    session: mongoose.ClientSession,
    userId?: Types.ObjectId,
    orderNumber?: number,
  ) {
    let subTotal = 0;
    let totalContributionMarginUSD = 0;
    let totalCogsUSD = 0;
    const items: IOrder['items'] = [];

    for (const item of cartItems) {
      const productVariant = await ProductVariant.findById(item.productVariant).session(session);
      if (!productVariant) {
        throw new AppError(`El producto con variante ${item.productVariant} no existe.`, 404, 'fail');
      }
      if (productVariant.stock < item.quantity) {
        throw new AppError(`Stock insuficiente para la variante de producto ${item.productVariant}.`, 400, 'fail');
      }

      // Usar el sistema de inventario para reducir stock y crear movimiento
      await this.inventoryService.createStockExitWithSession(
        item.productVariant,
        item.quantity,
        session,
        StockMovementReason.SALE,
        orderNumber ? `Orden-${orderNumber}` : undefined, // Referencia a la orden
        `Venta - Orden ${orderNumber || 'en proceso'}`,
        userId, // Usuario que realiza la compra
      );

      // Refrescar la variante para obtener el costo promedio actualizado
      const updatedVariant = await ProductVariant.findById(item.productVariant).session(session);
      const averageCost = updatedVariant?.averageCostUSD || 0;

      const itemSubTotal = productVariant.priceUSD * item.quantity;
      const contributionMarginUSD = (productVariant.priceUSD - averageCost) * item.quantity;
      const cogsUSD = averageCost * item.quantity; // Cost of Goods Sold

      items.push({
        productVariant: item.productVariant,
        quantity: item.quantity,
        subTotal: itemSubTotal,
        costUSDAtPurchase: averageCost, // Usar el costo promedio ponderado
        priceUSDAtPurchase: productVariant.priceUSD,
        contributionMarginUSD,
        cogsUSD,
      });
      subTotal += itemSubTotal;
      totalContributionMarginUSD += contributionMarginUSD;
      totalCogsUSD += cogsUSD;
    }
    return { items, subTotal, totalContributionMarginUSD, totalCogsUSD };
  }

  // Helper: Procesa items directos de ProductVariant para órdenes de admin
  private async processOrderItems(
    orderItems: CreateOrderItemAdminDto[],
    session: mongoose.ClientSession,
    adminUserId?: Types.ObjectId,
    orderNumber?: number,
  ) {
    let subTotal = 0;
    let totalContributionMarginUSD = 0;
    let totalCogsUSD = 0;
    const items: IOrder['items'] = [];

    for (const orderItem of orderItems) {
      // Validar cantidad
      if (orderItem.quantity <= 0) {
        throw new AppError(
          `La cantidad debe ser mayor a 0 para el producto variante ${orderItem.productVariantId}.`,
          400,
          'fail',
        );
      }

      // Obtener ProductVariant
      const productVariant = await ProductVariant.findById(orderItem.productVariantId).session(session);
      if (!productVariant) {
        throw new AppError(`El producto con variante ${orderItem.productVariantId} no existe.`, 404, 'fail');
      }

      // Verificar stock disponible
      if (productVariant.stock < orderItem.quantity) {
        throw new AppError(
          `Stock insuficiente para la variante de producto ${orderItem.productVariantId}. Disponible: ${productVariant.stock}, solicitado: ${orderItem.quantity}.`,
          400,
          'fail',
        );
      }

      // Usar el sistema de inventario para reducir stock y crear movimiento
      await this.inventoryService.createStockExitWithSession(
        orderItem.productVariantId,
        orderItem.quantity,
        session,
        StockMovementReason.SALE,
        orderNumber ? `Orden-${orderNumber}` : undefined,
        `Venta - Orden ${orderNumber || 'en proceso'} (Creada por admin)`,
        adminUserId, // Admin que crea la orden
      );

      // Refrescar la variante para obtener el costo promedio actualizado
      const updatedVariant = await ProductVariant.findById(orderItem.productVariantId).session(session);
      const averageCost = updatedVariant?.averageCostUSD || 0;

      const itemSubTotal = productVariant.priceUSD * orderItem.quantity;
      const contributionMarginUSD = (productVariant.priceUSD - averageCost) * orderItem.quantity;
      const cogsUSD = averageCost * orderItem.quantity; // Cost of Goods Sold

      items.push({
        productVariant: orderItem.productVariantId,
        quantity: orderItem.quantity,
        subTotal: itemSubTotal,
        costUSDAtPurchase: averageCost,
        priceUSDAtPurchase: productVariant.priceUSD,
        contributionMarginUSD,
        cogsUSD,
      });

      subTotal += itemSubTotal;
      totalContributionMarginUSD += contributionMarginUSD;
      totalCogsUSD += cogsUSD;
    }

    return { items, subTotal, totalContributionMarginUSD, totalCogsUSD };
  }

  // Helper: Calcula gastos y total
  private calculateTotals(subTotal: number, paymentMethod: PaymentMethod) {
    let bankTransferExpense: number | undefined = undefined;
    let totalAmount = subTotal;
    if (paymentMethod === PaymentMethod.BankTransfer) {
      bankTransferExpense = Math.round(subTotal * 0.04 * 100) / 100;
      totalAmount = subTotal + bankTransferExpense;
    }
    return { bankTransferExpense, totalAmount };
  }

  // Helper: Obtiene el próximo número de orden
  private async getNextOrderNumber(session: mongoose.ClientSession) {
    const counter = await CounterModel.findOneAndUpdate(
      { name: 'order' },
      { $inc: { seq: 1 } },
      { new: true, upsert: true, session },
    );
    return counter.seq;
  }

  // Helper: Construye el objeto de orden
  private buildOrderObject(
    orderNumber: number,
    userId: Types.ObjectId,
    shippingAddressId: Types.ObjectId,
    orderData: CreateOrderDto | CreateOrderAdminDto,
    items: IOrder['items'],
    subTotal: number,
    bankTransferExpense: number | undefined,
    totalAmount: number,
    totalContributionMarginUSD: number,
    totalCogsUSD: number,
  ): IOrder {
    // Determinar el estado inicial basado en el método de pago
    const initialStatus: OrderStatus = OrderStatus.Processing;

    return {
      orderNumber,
      user: userId,
      shippingMethod: orderData.shippingMethod,
      shippingAddress: shippingAddressId,
      paymentMethod: orderData.paymentMethod,
      items,
      subTotal,
      ...(bankTransferExpense && { bankTransferExpense }),
      totalAmount,
      totalContributionMarginUSD,
      totalCogsUSD,
      orderStatus: initialStatus,
      allowViewInvoice: 'allowViewInvoice' in orderData ? (orderData.allowViewInvoice ?? false) : false,
    };
  }

  // Helper: Guarda la orden
  private async saveOrder(newOrder: IOrder, session: mongoose.ClientSession) {
    const savedOrder = new Order(newOrder);
    await savedOrder.save({ session });
    return savedOrder;
  }

  // Helper: Obtiene la respuesta populada
  private async getPopulatedOrderResponse(orderId: Types.ObjectId, session?: mongoose.ClientSession) {
    const query = Order.findById(orderId);
    if (session) query.session(session);
    const populatedOrder = await query.populate(ORDER_POPULATE);
    if (!populatedOrder) {
      throw new AppError('No se pudo encontrar la orden recién creada para la respuesta.', 500, 'error');
    }
    return this.mapOrderToResponseDto(populatedOrder!);
  }

  private mapUserToUserResponse(user: Types.ObjectId | IUserDocument): UserResponse {
    if (!user || typeof user !== 'object' || !('email' in user)) {
      throw new Error('El usuario no está populado correctamente');
    }
    const u = user as IUserDocument;
    return {
      id: u._id.toString(),
      email: u.email,
      displayName: u.displayName,
      firstName: u.firstName || '',
      lastName: u.lastName || '',
      dni: u.dni || '',
      ...(u.cuit && { cuit: u.cuit }),
      phone: u.phone || '',
      role: u.role,
      status: u.status,
    };
  }

  private mapAddressToResponseDto(address: IAddressDocument | Types.ObjectId): AddressResponse {
    if (!address || typeof address !== 'object' || !('firstName' in address)) {
      throw new Error('La dirección no está populada correctamente');
    }
    const a = address as IAddressDocument;
    return {
      firstName: a.firstName,
      lastName: a.lastName,
      companyName: a.companyName,
      email: a.email,
      phoneNumber: a.phoneNumber,
      dni: a.dni,
      ...(a.cuit && { cuit: a.cuit }),
      streetAddress: a.streetAddress,
      city: a.city,
      state: a.state,
      postalCode: a.postalCode,
      shippingCompany: a.shippingCompany,
      declaredShippingAmount: a.declaredShippingAmount,
      deliveryWindow: a.deliveryWindow,
      deliveryType: a.deliveryType,
      pickupPointAddress: a.pickupPointAddress,
    };
  }

  // Helper: Mapea el producto base populado a ProductBaseResponse
  private mapProductBaseToResponse(product: IProductDocument): ProductBaseResponse {
    if (!product || typeof product !== 'object' || !('_id' in product)) {
      throw new Error('El producto base no está populado correctamente');
    }
    return {
      id: product._id.toString(),
      slug: product.slug,
      thumbnail: product.thumbnail,
      productModel: product.productModel,
      sku: product.sku,
      size: product.size,
    };
  }

  // Helper: Mapea el productVariant populado a ProductVariantResponse
  private mapProductVariantToResponse(
    productVariant: Types.ObjectId | IProductVariantPopulated,
  ): ProductVariantResponse {
    if (!productVariant || typeof productVariant !== 'object' || !('color' in productVariant)) {
      throw new Error('El productVariant no está populado correctamente');
    }
    const pv = productVariant as IProductVariantPopulated;
    return {
      id: pv._id.toString(),
      color: pv.color,
      images: pv.images,
      priceUSD: pv.priceUSD,
      product: this.mapProductBaseToResponse(pv.product),
    };
  }

  // Helper: Mapea el refund a RefundResponse
  private mapRefundToResponse(refund: IRefund | null | undefined): RefundResponse | null {
    if (!refund) return null;

    return {
      type: refund.type,
      amount: refund.amount,
      appliedAmount: refund.appliedAmount,
      ...(refund.reason && { reason: refund.reason }),
      processedAt: refund.processedAt instanceof Date ? refund.processedAt.toISOString() : String(refund.processedAt),
      ...(refund.processedBy && { processedBy: refund.processedBy.toString() }),
    };
  }

  // Helper: Mapea la orden populada a OrderResponseDto
  private mapOrderToResponseDto(order: IOrderDocument): OrderResponseDto {
    return {
      id: order._id.toString(),
      orderNumber: order.orderNumber,
      user: this.mapUserToUserResponse(order.user),
      items: order.items.map((item: IOrderItemDocument) => ({
        productVariant: this.mapProductVariantToResponse(item.productVariant),
        quantity: item.quantity,
        subTotal: item.subTotal,
        costUSDAtPurchase: item.costUSDAtPurchase,
        priceUSDAtPurchase: item.priceUSDAtPurchase,
        contributionMarginUSD: item.contributionMarginUSD,
        cogsUSD: item.cogsUSD,
      })),
      shippingAddress: this.mapAddressToResponseDto(order.shippingAddress),
      shippingMethod: order.shippingMethod,
      paymentMethod: order.paymentMethod,
      subTotal: order.subTotal,
      ...(order.bankTransferExpense && {
        bankTransferExpense: order.bankTransferExpense,
      }),
      totalAmount: order.totalAmount,
      totalAmountARS: order.totalAmountARS ?? 0,
      totalContributionMarginUSD: order.totalContributionMarginUSD,
      totalCogsUSD: order.totalCogsUSD,
      orderStatus: order.orderStatus,
      allowViewInvoice: order.allowViewInvoice,
      refund: this.mapRefundToResponse(order.refund),
      createdAt: order.createdAt instanceof Date ? order.createdAt.toISOString() : String(order.createdAt),
      updatedAt: order.updatedAt instanceof Date ? order.updatedAt.toISOString() : String(order.updatedAt),
    };
  }

  // Helper: Mapea la orden populada a OrderUserResponseDto para usuario (sin contributionMarginUSD, totalContributionMarginUSD, cogsUSD ni totalCogsUSD)
  private mapOrderToUserResponseDto(order: IOrderDocument): OrderUserResponseDto {
    return {
      id: order._id.toString(),
      orderNumber: order.orderNumber,
      user: this.mapUserToUserResponse(order.user),
      items: order.items.map(
        (item: IOrderItemDocument): OrderItemUserResponse => ({
          productVariant: this.mapProductVariantToResponse(item.productVariant),
          quantity: item.quantity,
          subTotal: item.subTotal,
          priceUSDAtPurchase: item.priceUSDAtPurchase,
        }),
      ),
      shippingAddress: this.mapAddressToResponseDto(order.shippingAddress),
      shippingMethod: order.shippingMethod,
      paymentMethod: order.paymentMethod,
      subTotal: order.subTotal,
      ...(order.bankTransferExpense && {
        bankTransferExpense: order.bankTransferExpense,
      }),
      totalAmount: order.totalAmount,
      totalAmountARS: order.totalAmountARS ?? 0,
      orderStatus: order.orderStatus,
      allowViewInvoice: order.allowViewInvoice,
      refund: this.mapRefundToResponse(order.refund),
      createdAt: order.createdAt instanceof Date ? order.createdAt.toISOString() : String(order.createdAt),
      updatedAt: order.updatedAt instanceof Date ? order.updatedAt.toISOString() : String(order.updatedAt),
    };
  }

  public async createOrder(userId: Types.ObjectId, orderData: CreateOrderDto) {
    return withTransaction(async (session) => {
      // Sincronizar el carrito con el stock antes de procesar la orden
      const { cart: syncedCart, changes } = await this.cartService.syncCartWithStock(userId);
      if (changes.length > 0) {
        // Transformar los cambios al formato esperado por CartSyncError
        const transformedChanges: CartSyncChange[] = changes.map((change) => ({
          productVariant: change.productVariant
            ? {
                id: change.productVariant._id.toString(),
                color: change.productVariant.color,
                images: change.productVariant.images,
                priceUSD: change.productVariant.priceUSD,
                product: {
                  id: change.productVariant.product._id.toString(),
                  slug: change.productVariant.product.slug,
                  thumbnail: change.productVariant.product.thumbnail,
                  productModel: change.productVariant.product.productModel,
                  sku: change.productVariant.product.sku,
                  size: change.productVariant.product.size,
                },
              }
            : null,
          oldQuantity: change.oldQuantity,
          newQuantity: change.newQuantity,
          removed: change.removed,
          stock: change.stock,
        }));

        // Si hubo cambios, lanzar CartSyncError profesional
        throw new CartSyncError(
          'El carrito fue actualizado por falta de stock en uno o más productos. Revisa los cambios antes de continuar.',
          transformedChanges,
          syncedCart as Record<string, unknown>,
        );
      }

      // Validar el carrito
      const cart = await this.getValidatedCart(userId, session);

      // Crear dirección de envío
      const shippingAddressId = await this.createShippingAddress(orderData.shippingAddress, userId, session);

      // Verificar y actualizar el usuario si falta dni, cuit o phone
      const user = await User.findById(userId).session(session);
      if (!user) {
        throw new AppError('Usuario no encontrado', 404, 'fail');
      }

      const { dni, cuit, phoneNumber } = orderData.shippingAddress;
      const updateData: Partial<IUser> = {};

      if (!user.firstName && orderData.shippingAddress.firstName) {
        updateData.firstName = orderData.shippingAddress.firstName;
      }

      if (!user.lastName && orderData.shippingAddress.lastName) {
        updateData.lastName = orderData.shippingAddress.lastName;
      }

      if (!user.dni && dni) {
        updateData.dni = dni;
      }

      if (!user.cuit && cuit) {
        updateData.cuit = cuit;
      }

      if (!user.phone && phoneNumber) {
        updateData.phone = phoneNumber;
      }

      if (Object.keys(updateData).length > 0) {
        await User.findByIdAndUpdate(userId, { $set: updateData }, { session });
      }

      // Obtener el número de orden
      const orderNumber = await this.getNextOrderNumber(session);

      // Procesar los items del carrito
      const { items, subTotal, totalContributionMarginUSD, totalCogsUSD } = await this.processCartItems(
        cart.items,
        session,
        userId,
        orderNumber,
      );

      // Calcular totales
      const { bankTransferExpense, totalAmount } = this.calculateTotals(subTotal, orderData.paymentMethod);

      // Obtener el valor actual del dólar
      const dollar = await Dollar.findOne().session(session);
      if (!dollar) {
        throw new AppError('No se encontró el valor del dólar en la base de datos.', 500, 'error');
      }

      // Calcular el totalAmountARS
      const totalAmountARS = totalAmount * dollar.value;

      // Construir el objeto de orden
      const newOrder = this.buildOrderObject(
        orderNumber,
        userId,
        shippingAddressId,
        orderData,
        items,
        subTotal,
        bankTransferExpense,
        totalAmount,
        totalContributionMarginUSD,
        totalCogsUSD,
      );

      // Asignar el totalAmountARS al objeto de orden
      newOrder.totalAmountARS = totalAmountARS;

      // Guardar la orden
      const savedOrder = await this.saveOrder(newOrder, session);

      // Limpiar el carrito
      await this.cartService.clearCart(userId, session);

      logger.info('Nuevo pedido creado', {
        orderId: savedOrder._id,
        user: userId,
      });

      // Obtener la respuesta populada
      const orderResponse = await this.getPopulatedOrderResponse(savedOrder._id, session);

      // Transformar manualmente color a colorName/colorHex para el mail
      const orderResponseForEmail = {
        ...orderResponse,
        items: orderResponse.items.map((item) => ({
          ...item,
          productVariant: {
            ...item.productVariant,
            colorName: item.productVariant.color?.name,
            colorHex: item.productVariant.color?.hex,
          },
        })),
      };

      // Encolar el job en BullMQ
      await orderQueue.add('sendOrderConfirmation', {
        order: orderResponseForEmail,
      });

      return orderResponse;
    });
  }

  /**
   * Crear una orden como administrador sin usar carrito
   * Permite especificar directamente los ProductVariants y cantidades
   */
  public async createOrderAsAdmin(orderData: CreateOrderAdminDto, adminUserId?: Types.ObjectId) {
    return withTransaction(async (session) => {
      // Validar que el usuario existe
      const targetUser = await User.findById(orderData.userId).session(session);
      if (!targetUser) {
        throw new AppError(`El usuario con ID ${orderData.userId} no existe.`, 404, 'fail');
      }

      // Verificar y actualizar el usuario si falta dni, cuit o phone
      const { dni, cuit, phoneNumber } = orderData.shippingAddress;
      const updateData: Partial<IUser> = {};

      if (!targetUser.firstName && orderData.shippingAddress.firstName) {
        updateData.firstName = orderData.shippingAddress.firstName;
      }

      if (!targetUser.lastName && orderData.shippingAddress.lastName) {
        updateData.lastName = orderData.shippingAddress.lastName;
      }

      if (!targetUser.dni && dni) {
        updateData.dni = dni;
      }

      if (!targetUser.cuit && cuit) {
        updateData.cuit = cuit;
      }

      if (!targetUser.phone && phoneNumber) {
        updateData.phone = phoneNumber;
      }

      if (Object.keys(updateData).length > 0) {
        await User.findByIdAndUpdate(orderData.userId, { $set: updateData }, { session });
      }

      // Validar que hay items en la orden
      if (!orderData.items || orderData.items.length === 0) {
        throw new AppError('La orden debe tener al menos un item.', 400, 'fail');
      }

      // Crear dirección de envío
      const shippingAddressId = await this.createShippingAddress(orderData.shippingAddress, orderData.userId, session);

      // Obtener número de orden
      const orderNumber = await this.getNextOrderNumber(session);

      // Procesar items de la orden (similar a processCartItems pero con ProductVariants directos)
      const { items, subTotal, totalContributionMarginUSD, totalCogsUSD } = await this.processOrderItems(
        orderData.items,
        session,
        adminUserId,
        orderNumber,
      );

      // Calcular totales
      const { bankTransferExpense, totalAmount } = this.calculateTotals(subTotal, orderData.paymentMethod);

      // Obtener el valor actual del dólar
      const dollar = await Dollar.findOne().session(session);
      if (!dollar) {
        throw new AppError('No se encontró el valor del dólar en la base de datos.', 500, 'error');
      }

      // Calcular el totalAmountARS
      const totalAmountARS = totalAmount * dollar.value;

      // Construir objeto de orden
      const newOrder = this.buildOrderObject(
        orderNumber,
        orderData.userId,
        shippingAddressId,
        orderData,
        items,
        subTotal,
        bankTransferExpense,
        totalAmount,
        totalContributionMarginUSD,
        totalCogsUSD,
      );

      // Asignar el totalAmountARS al objeto de orden
      newOrder.totalAmountARS = totalAmountARS;

      // Guardar orden
      const savedOrder = await this.saveOrder(newOrder, session);

      // Si se especifica una fecha personalizada, actualizarla
      if (orderData.createdAt) {
        await Order.findByIdAndUpdate(
          savedOrder._id,
          { $set: { createdAt: orderData.createdAt } },
          {
            session,
            runValidators: false,
            strict: false,
            timestamps: false,
          },
        );
      }

      logger.info('Orden creada por administrador', {
        orderId: savedOrder._id,
        orderNumber: savedOrder.orderNumber,
        targetUserId: orderData.userId.toString(),
        adminUserId: adminUserId?.toString(),
        itemsCount: orderData.items.length,
      });

      // Obtener respuesta populada
      const orderResponse = await this.getPopulatedOrderResponse(savedOrder._id, session);

      // Preparar para email (si se quiere enviar notificación)
      const orderResponseForEmail = {
        ...orderResponse,
        items: orderResponse.items.map((item) => ({
          ...item,
          productVariant: {
            ...item.productVariant,
            colorName: item.productVariant.color?.name,
            colorHex: item.productVariant.color?.hex,
          },
        })),
      };

      // Encolar el job en BullMQ para notificar al usuario
      await orderQueue.add('sendOrderConfirmation', {
        order: orderResponseForEmail,
      });

      return orderResponse;
    });
  }

  public async getOrderById(orderId: Types.ObjectId): Promise<OrderResponseDto> {
    const query = Order.findById(orderId).populate(ORDER_POPULATE);

    const order = await query.exec();
    if (!order) {
      throw new AppError('El pedido no existe.', 404, 'fail');
    }
    return this.mapOrderToResponseDto(order);
  }

  public async cancelOrder(orderId: Types.ObjectId, userId?: Types.ObjectId) {
    return withTransaction(async (session) => {
      const order = await Order.findById(orderId).session(session);
      if (!order) {
        throw new AppError('El pedido no existe.', 404, 'fail');
      }

      if (order.orderStatus === OrderStatus.Completed) {
        throw new AppError('No se puede cancelar un pedido que ya ha sido completado.', 400, 'fail');
      }

      if (order.orderStatus === OrderStatus.Cancelled) {
        throw new AppError('El pedido ya ha sido cancelado.', 400, 'fail');
      }

      if (order.orderStatus === OrderStatus.Refunded) {
        throw new AppError('No se puede cancelar un pedido que ya ha sido reembolsado.', 400, 'fail');
      }

      // Restaurar stock de cada item registrando el movimiento de inventario
      for (const item of order.items) {
        // Crear entrada de stock usando el InventoryService para registrar el movimiento
        await this.inventoryService.createStockEntryWithSession(
          item.productVariant,
          item.quantity,
          session,
          item.costUSDAtPurchase, // Usar el costo que se registró al momento de la compra
          StockMovementReason.RETURN,
          `Orden-${order.orderNumber}`, // Referencia a la orden cancelada
          `Cancelación de orden ${order.orderNumber} - Devolución de stock`,
          userId, // Pasar el userId para trazabilidad
        );

        // Resetear la contribución marginal del item
        item.contributionMarginUSD = 0;
        item.cogsUSD = 0; // Resetear COGS también
      }

      order.totalContributionMarginUSD = 0;
      order.totalCogsUSD = 0; // Resetear total COGS
      order.totalAmount = 0;
      order.orderStatus = OrderStatus.Cancelled;
      await order.save({ session });

      logger.info('Pedido cancelado y stock restaurado con movimientos de inventario', {
        orderId: order._id,
        orderNumber: order.orderNumber,
        cancelledBy: userId?.toString(),
      });

      // Usar helper para respuesta populada
      return this.getPopulatedOrderResponse(order._id, session);
    });
  }

  public async getOrdersByUserId(
    userId: Types.ObjectId,
    cursor: string | null = null,
    limit: number = 10,
    status?: OrderStatus,
  ): Promise<{ orders: OrderUserResponseDto[]; nextCursor: string | null }> {
    const query: OrderQuery = { user: userId };
    if (status) {
      query.orderStatus = status;
    }
    if (cursor) {
      query._id = { $lt: new Types.ObjectId(cursor) };
    }
    const orders = await Order.find(query).populate(ORDER_POPULATE).sort({ createdAt: -1 }).limit(limit);
    if (!orders || orders.length === 0) {
      return { orders: [], nextCursor: null };
    }
    const mappedOrders = orders.map((order) => this.mapOrderToUserResponseDto(order));
    const nextCursor = orders.length === limit ? orders[orders.length - 1]._id.toString() : null;
    return { orders: mappedOrders, nextCursor };
  }

  // Get all orders for admin with cursor pagination and filter by status
  public async getAllOrders(
    cursor: string | null = null,
    limit: number = 1,
    status?: OrderStatus,
  ): Promise<{ orders: OrderResponseDto[]; nextCursor: string | null }> {
    const query: OrderQuery = {};

    if (status) {
      query.orderStatus = status;
    }

    if (cursor) {
      query._id = { $lt: new Types.ObjectId(cursor) };
    }

    // Usar helper para obtener todas las órdenes populadas y mapearlas
    const orders = await Order.find(query).populate(ORDER_POPULATE).sort({ createdAt: -1 }).limit(limit);

    const mappedOrders = orders.map((order) => this.mapOrderToResponseDto(order));
    const nextCursor = orders.length === limit ? orders[orders.length - 1]._id.toString() : null;

    return { orders: mappedOrders, nextCursor };
  }

  /**
   * Método privado para actualizar el estado de una orden
   * Puede ser usado dentro de transacciones y por otros métodos
   * Maneja lógica especial de stock para PENDING_PAYMENT y ON_HOLD
   */
  private async updateOrderStatus(
    order: IOrderDocument,
    newStatus: OrderStatus,
    userId?: Types.ObjectId,
    session?: mongoose.ClientSession,
  ): Promise<OrderResponseDto> {
    const validTransitions: Record<OrderStatus, OrderStatus[]> = {
      [OrderStatus.Processing]: [
        OrderStatus.PendingPayment,
        OrderStatus.OnHold,
        OrderStatus.Completed,
        OrderStatus.Cancelled,
      ],
      [OrderStatus.PendingPayment]: [OrderStatus.OnHold, OrderStatus.Completed, OrderStatus.Cancelled],
      [OrderStatus.OnHold]: [OrderStatus.PendingPayment, OrderStatus.Completed, OrderStatus.Cancelled],
      [OrderStatus.Completed]: [OrderStatus.Refunded],
      [OrderStatus.Cancelled]: [],
      [OrderStatus.Refunded]: [],
    };

    if (order.orderStatus === newStatus) {
      throw new AppError('El estado del pedido ya es el mismo.', 400, 'fail');
    }

    const allowed = validTransitions[order.orderStatus];
    if (!allowed.includes(newStatus)) {
      throw new AppError(`No se puede cambiar el estado de ${order.orderStatus} a ${newStatus}.`, 400, 'fail');
    }

    // Si el nuevo estado es Cancelled, usar cancelOrder
    if (newStatus === OrderStatus.Cancelled) {
      // Usar helper cancelOrder (ya retorna la respuesta populada)
      return await this.cancelOrder(order._id, userId);
    }

    // Lógica especial para PENDING_PAYMENT: liberar stock
    if (newStatus === OrderStatus.PendingPayment) {
      await this.releaseOrderStock(order, session, userId);
    }

    // Lógica especial para ON_HOLD: verificar y reservar stock
    if (newStatus === OrderStatus.OnHold && order.orderStatus === OrderStatus.PendingPayment) {
      await this.reserveOrderStock(order, session, userId);
    }

    // Actualizar el estado
    order.orderStatus = newStatus;

    if (session) {
      await order.save({ session });
    } else {
      await order.save();
    }

    logger.info('Estado del pedido actualizado', {
      orderId: order._id,
      previousStatus: order.orderStatus,
      newStatus: newStatus,
      updatedBy: userId?.toString(),
    });

    // Usar helper para respuesta populada
    return this.getPopulatedOrderResponse(order._id, session);
  }

  /**
   * Libera el stock de todos los items de una orden (para PENDING_PAYMENT)
   * Devuelve los productos al inventario
   */
  private async releaseOrderStock(
    order: IOrderDocument,
    session?: mongoose.ClientSession,
    userId?: Types.ObjectId,
  ): Promise<void> {
    for (const item of order.items) {
      try {
        await this.inventoryService.createStockEntryWithSession(
          item.productVariant,
          item.quantity,
          session!,
          item.costUSDAtPurchase,
          StockMovementReason.RETURN,
          `Orden-${order.orderNumber}`,
          `Liberación de stock - cambio a PENDING_PAYMENT`,
          userId,
        );

        logger.info('Stock liberado para item de orden', {
          orderId: order._id,
          orderNumber: order.orderNumber,
          productVariantId: item.productVariant,
          quantity: item.quantity,
          reason: 'PENDING_PAYMENT_RELEASE',
        });
      } catch (error) {
        logger.error('Error al liberar stock para item de orden', {
          orderId: order._id,
          orderNumber: order.orderNumber,
          productVariantId: item.productVariant,
          quantity: item.quantity,
          error: error instanceof Error ? error.message : String(error),
        });
        throw new AppError(`Error al liberar stock para producto ${item.productVariant}`, 500, 'error', false, {
          cause: error instanceof Error ? error.message : String(error),
        });
      }
    }
  }

  /**
   * Reserva el stock para todos los items de una orden (para ON_HOLD desde PENDING_PAYMENT)
   * Verifica disponibilidad antes de reservar
   */
  private async reserveOrderStock(
    order: IOrderDocument,
    session?: mongoose.ClientSession,
    userId?: Types.ObjectId,
  ): Promise<void> {
    // Primero verificar la disponibilidad de stock para todos los items
    const stockConflicts = await this.checkStockAvailability(order.items, session);

    if (stockConflicts.length > 0) {
      const conflictDetails = stockConflicts
        .map(
          (conflict) =>
            `${conflict.productInfo.productModel} (${conflict.productInfo.color.name}): necesita ${conflict.requiredQuantity}, disponible ${conflict.availableStock}`,
        )
        .join('; ');

      throw new AppError(
        `Stock insuficiente para reactivar la orden. Conflictos: ${conflictDetails}`,
        400,
        'fail',
        true,
        { stockConflicts },
      );
    }

    // Si no hay conflictos, proceder a reservar el stock
    for (const item of order.items) {
      try {
        await this.inventoryService.createStockExitWithSession(
          item.productVariant,
          item.quantity,
          session!,
          StockMovementReason.SALE,
          `Orden-${order.orderNumber}`,
          `Reserva de stock - reactivación desde PENDING_PAYMENT`,
          userId,
        );

        logger.info('Stock reservado para item de orden', {
          orderId: order._id,
          orderNumber: order.orderNumber,
          productVariantId: item.productVariant,
          quantity: item.quantity,
          reason: 'ON_HOLD_RESERVE',
        });
      } catch (error) {
        logger.error('Error al reservar stock para item de orden', {
          orderId: order._id,
          orderNumber: order.orderNumber,
          productVariantId: item.productVariant,
          quantity: item.quantity,
          error: error instanceof Error ? error.message : String(error),
        });
        throw new AppError(`Error al reservar stock para producto ${item.productVariant}`, 500, 'error', false, {
          cause: error instanceof Error ? error.message : String(error),
        });
      }
    }
  }

  /**
   * Verifica la disponibilidad de stock para una lista de items
   * Retorna un array de conflictos si los hay
   */
  private async checkStockAvailability(
    items: Types.DocumentArray<IOrderItemDocument>,
    session?: mongoose.ClientSession,
  ): Promise<StockConflictItem[]> {
    const conflicts: StockConflictItem[] = [];

    for (const item of items) {
      const productVariant = await ProductVariant.findById(item.productVariant)
        .populate('product')
        .session(session || null);

      if (!productVariant) {
        conflicts.push({
          productVariantId: item.productVariant.toString(),
          requiredQuantity: item.quantity,
          availableStock: 0,
          productInfo: {
            productModel: 'Producto no encontrado',
            sku: 'N/A',
            color: { name: 'N/A', hex: '#000000' },
          },
        });
        continue;
      }

      if (productVariant.stock < item.quantity) {
        // Type guard para verificar si product está populado
        const isProductPopulated =
          productVariant.product &&
          typeof productVariant.product === 'object' &&
          'productModel' in productVariant.product;

        const productModel = isProductPopulated
          ? (productVariant.product as unknown as IProductDocument).productModel
          : 'N/A';
        const sku = isProductPopulated ? (productVariant.product as unknown as IProductDocument).sku : 'N/A';

        conflicts.push({
          productVariantId: item.productVariant.toString(),
          requiredQuantity: item.quantity,
          availableStock: productVariant.stock,
          productInfo: {
            productModel,
            sku,
            color: productVariant.color,
          },
        });
      }
    }

    return conflicts;
  }

  /**
   * Método público para verificar disponibilidad de stock antes de cambiar estado
   * Útil para validar antes de hacer el cambio real
   */
  public async checkOrderStockAvailability(
    orderId: Types.ObjectId,
  ): Promise<{ hasConflicts: boolean; conflicts: StockConflictItem[] }> {
    const order = await Order.findById(orderId);
    if (!order) {
      throw new AppError('Orden no encontrada', 404, 'fail');
    }

    const conflicts = await this.checkStockAvailability(order.items);

    return {
      hasConflicts: conflicts.length > 0,
      conflicts,
    };
  }

  /**
   * Método público mejorado para actualizar estado con manejo de conflictos
   * Retorna información detallada sobre el resultado
   */
  public async updateOrderStatusWithConflictHandling(
    orderId: Types.ObjectId,
    newStatus: OrderStatus,
    userId?: Types.ObjectId,
  ): Promise<OrderStatusUpdateResultDto> {
    try {
      const result = await withTransaction(async (session) => {
        const order = await Order.findById(orderId).session(session);
        if (!order) {
          throw new AppError('Orden no encontrada', 404, 'fail');
        }

        // Si es cambio de PENDING_PAYMENT a ON_HOLD, verificar stock primero
        if (newStatus === OrderStatus.OnHold && order.orderStatus === OrderStatus.PendingPayment) {
          const conflicts = await this.checkStockAvailability(order.items, session);

          if (conflicts.length > 0) {
            return {
              success: false,
              stockConflicts: conflicts,
              message: `No se puede reactivar la orden debido a conflictos de stock. ${conflicts.length} producto(s) no tienen stock suficiente.`,
            };
          }
        }

        const updatedOrder = await this.updateOrderStatus(order, newStatus, userId, session);

        return {
          success: true,
          order: updatedOrder,
          message: `Estado de la orden actualizado exitosamente a ${newStatus}`,
        };
      });

      return result;
    } catch (error) {
      logger.error('Error al actualizar estado de orden con manejo de conflictos', {
        orderId: orderId.toString(),
        newStatus,
        error: error instanceof Error ? error.message : String(error),
      });

      if (error instanceof AppError) {
        const result: OrderStatusUpdateResultDto = {
          success: false,
          message: error.message,
        };

        const stockConflicts = error.details?.stockConflicts as StockConflictItem[] | undefined;
        if (stockConflicts) {
          result.stockConflicts = stockConflicts;
        }

        return result;
      }

      return {
        success: false,
        message: 'Error interno del servidor al actualizar el estado de la orden',
      };
    }
  }

  /**
   * Método de conveniencia que actualiza el estado verificando conflictos automáticamente
   * Para uso cuando se quiere el comportamiento simple de éxito/error
   */
  public async updateOrderStatusSafe(
    orderId: Types.ObjectId,
    newStatus: OrderStatus,
    userId?: Types.ObjectId,
  ): Promise<OrderResponseDto> {
    const result = await this.updateOrderStatusWithConflictHandling(orderId, newStatus, userId);

    if (!result.success) {
      if (result.stockConflicts && result.stockConflicts.length > 0) {
        const conflictDetails = result.stockConflicts
          .map(
            (conflict) =>
              `${conflict.productInfo.productModel} (${conflict.productInfo.color.name}): necesita ${conflict.requiredQuantity}, disponible ${conflict.availableStock}`,
          )
          .join('; ');
        throw new AppError(`${result.message} Detalles: ${conflictDetails}`, 400, 'fail');
      } else {
        throw new AppError(result.message, 400, 'fail');
      }
    }

    if (!result.order) {
      throw new AppError('Error inesperado: orden no retornada después de actualización exitosa', 500, 'error');
    }

    return result.order;
  }

  /**
   * Actualiza completamente una orden: items, cantidades, fechas
   * Maneja movimientos de stock y recalcula totales automáticamente
   */
  public async updateOrder(
    orderId: Types.ObjectId,
    updateData: UpdateOrderDto,
    userId?: Types.ObjectId,
  ): Promise<OrderResponseDto> {
    return withTransaction(async (session) => {
      // Obtener la orden actual
      const order = await Order.findById(orderId).session(session);
      if (!order) {
        throw new AppError('Orden no encontrada', 404, 'fail', true, {
          code: 'ORDER_NOT_FOUND',
          context: { orderId },
        });
      }

      // Actualizar métodos de envío y pago si se proporcionan
      if (updateData.shippingMethod !== undefined) {
        order.shippingMethod = updateData.shippingMethod;
      }

      if (updateData.paymentMethod !== undefined) {
        order.paymentMethod = updateData.paymentMethod;
      }

      // Actualizar allowViewInvoice si se proporciona
      if (updateData.allowViewInvoice !== undefined) {
        order.allowViewInvoice = updateData.allowViewInvoice;
      }

      // Actualizar dirección de envío si se proporciona
      if (updateData.shippingAddress) {
        // Verificar y actualizar el usuario si falta dni, cuit o phone
        const user = await User.findById(order.user).session(session);
        if (!user) {
          throw new AppError('Usuario no encontrado', 404, 'fail');
        }

        const { dni, cuit, phoneNumber } = updateData.shippingAddress;
        const userUpdateData: Partial<IUser> = {};

        if (!user.firstName && updateData.shippingAddress.firstName) {
          userUpdateData.firstName = updateData.shippingAddress.firstName;
        }

        if (!user.lastName && updateData.shippingAddress.lastName) {
          userUpdateData.lastName = updateData.shippingAddress.lastName;
        }

        if (!user.dni && dni) {
          userUpdateData.dni = dni;
        }

        if (!user.cuit && cuit) {
          userUpdateData.cuit = cuit;
        }

        if (!user.phone && phoneNumber) {
          userUpdateData.phone = phoneNumber;
        }

        if (Object.keys(userUpdateData).length > 0) {
          await User.findByIdAndUpdate(order.user, { $set: userUpdateData }, { session });

          logger.info('Datos de usuario actualizados automáticamente desde dirección de envío', {
            orderId: order._id,
            orderNumber: order.orderNumber,
            userId: order.user.toString(),
            updatedFields: userUpdateData,
            updatedBy: userId?.toString(),
          });
        }

        // Crear nueva dirección con los datos actualizados
        const updatedAddress = {
          ...updateData.shippingAddress,
          userId: order.user, // Mantener el userId original
        };

        const newShippingAddress = await this.createShippingAddress(updatedAddress, order.user, session);
        order.shippingAddress = newShippingAddress;

        // Lógica mejorada para actualización de CUIT en la dirección
        // Manejar casos: CUIT nuevo, CUIT diferente, CUIT eliminado
        const addressCuit = updateData.shippingAddress.cuit;
        const userCuit = user.cuit;

        if (addressCuit !== undefined) {
          // Si se proporciona un CUIT en la dirección (puede ser string o undefined)
          const createdAddress = await Address.findById(newShippingAddress).session(session);
          if (createdAddress) {
            let shouldUpdateAddress = false;
            let logMessage = '';

            if (addressCuit === '' || addressCuit === null) {
              // CUIT vacío - remover el campo del documento Address
              createdAddress.set('cuit', undefined);
              shouldUpdateAddress = true;
              logMessage = 'CUIT removido de la dirección de envío';
            } else if (!userCuit) {
              // Usuario sin CUIT - el CUIT va solo en la dirección
              createdAddress.cuit = addressCuit;
              shouldUpdateAddress = true;
              logMessage = 'CUIT establecido en la dirección de envío (usuario sin CUIT)';
            } else if (addressCuit !== userCuit) {
              // CUIT diferente al del usuario - actualizar solo la dirección
              createdAddress.cuit = addressCuit;
              shouldUpdateAddress = true;
              logMessage = 'CUIT actualizado en la dirección de envío (diferente al del usuario)';
            } else {
              // CUIT igual al del usuario - mantener consistencia
              createdAddress.cuit = addressCuit;
              shouldUpdateAddress = true;
              logMessage = 'CUIT sincronizado en la dirección de envío (igual al del usuario)';
            }

            if (shouldUpdateAddress) {
              await createdAddress.save({ session });

              logger.info(logMessage, {
                orderId: order._id,
                orderNumber: order.orderNumber,
                addressId: newShippingAddress.toString(),
                userCuit: userCuit || 'no-set',
                addressCuit: addressCuit || 'removed',
                updatedBy: userId?.toString(),
              });
            }
          }
        }
      }

      // Actualizar campos de entrega si se proporcionan
      // Nota: deliveryWindow y declaredShippingAmount se guardan en la dirección de envío
      // Si se necesita actualizar estos campos sin cambiar toda la dirección,
      // podríamos actualizar la dirección existente
      if (
        (updateData.deliveryWindow !== undefined || updateData.declaredShippingAmount !== undefined) &&
        !updateData.shippingAddress
      ) {
        // Obtener la dirección actual y actualizarla
        const currentAddress = await Address.findById(order.shippingAddress).session(session);
        if (currentAddress) {
          if (updateData.deliveryWindow !== undefined) {
            currentAddress.deliveryWindow = updateData.deliveryWindow;
          }
          if (updateData.declaredShippingAmount !== undefined) {
            currentAddress.declaredShippingAmount = updateData.declaredShippingAmount;
          }

          await currentAddress.save({ session });

          logger.info('Dirección de envío actualizada', {
            orderId: order._id,
            orderNumber: order.orderNumber,
            updatedFields: {
              ...(updateData.deliveryWindow !== undefined && { deliveryWindow: updateData.deliveryWindow }),
              ...(updateData.declaredShippingAmount !== undefined && {
                declaredShippingAmount: updateData.declaredShippingAmount,
              }),
            },
            updatedBy: userId?.toString(),
          });
        }
      }

      // Procesar actualizaciones de items si se proporcionan
      if (updateData.items && updateData.items.length > 0) {
        await this.processOrderItemUpdates(order, updateData.items, session, userId);
      }

      // Recalcular todos los totales (especialmente importante si cambió el método de pago)
      await this.recalculateOrderTotals(order);

      // Actualizar estado de la orden si se proporciona
      // El método privado updateOrderStatus maneja todas las validaciones y delegaciones
      if (updateData.orderStatus && updateData.orderStatus !== order.orderStatus) {
        return await this.updateOrderStatus(order, updateData.orderStatus, userId, session);
      }

      // Manejar la actualización de createdAt y guardar la orden
      if (updateData.createdAt) {
        // Guardar primero otros cambios si los hay
        await order.save({ session });

        // Usar findByIdAndUpdate para actualizar createdAt (timestamps: true lo protege normalmente)
        await Order.findByIdAndUpdate(
          order._id,
          { $set: { createdAt: updateData.createdAt } },
          {
            session,
            runValidators: false,
            strict: false,
            timestamps: false,
          },
        );
      } else {
        // Solo guardar normalmente si no hay cambio de createdAt
        await order.save({ session });
      }

      logger.info('Orden actualizada exitosamente', {
        orderId: order._id,
        orderNumber: order.orderNumber,
        updatedBy: userId?.toString(),
        changes: updateData,
      });

      // Retornar la orden populada
      return this.getPopulatedOrderResponse(order._id, session);
    });
  }

  /**
   * Procesa las actualizaciones de items de la orden
   * Valida las acciones y ejecuta los cambios correspondientes
   */
  private async processOrderItemUpdates(
    order: IOrderDocument,
    itemUpdates: UpdateOrderItemDto[],
    session: mongoose.ClientSession,
    userId?: Types.ObjectId,
  ): Promise<void> {
    for (const update of itemUpdates) {
      const existingItemIndex = order.items.findIndex((item) => item.productVariant.equals(update.productVariantId));

      switch (update.action) {
        case 'add':
          if (existingItemIndex !== -1) {
            throw new AppError('El producto ya existe en la orden. Use "increase" para agregar cantidad', 400, 'fail');
          }
          await this.addNewItemToOrder(order, update, session, userId);
          break;

        case 'increase':
          if (existingItemIndex === -1) {
            throw new AppError('El producto no existe en la orden. Use "add" para agregarlo', 400, 'fail');
          }
          await this.increaseItemQuantity(order, existingItemIndex, update, session, userId);
          break;

        case 'decrease':
          if (existingItemIndex === -1) {
            throw new AppError('El producto no existe en la orden', 400, 'fail');
          }
          await this.decreaseItemQuantity(order, existingItemIndex, update, session, userId);
          break;

        case 'set':
          if (existingItemIndex === -1) {
            throw new AppError('El producto no existe en la orden', 400, 'fail');
          }
          await this.setItemQuantity(order, existingItemIndex, update, session, userId);
          break;

        case 'remove':
          if (existingItemIndex === -1) {
            throw new AppError('El producto no existe en la orden', 400, 'fail');
          }
          await this.removeItemFromOrder(order, existingItemIndex, session, userId);
          break;

        case 'update_prices':
          if (existingItemIndex === -1) {
            throw new AppError('El producto no existe en la orden', 400, 'fail');
          }
          await this.updateItemPrices(order, existingItemIndex, update, session, userId);
          break;

        case 'update_all':
          if (existingItemIndex === -1) {
            throw new AppError('El producto no existe en la orden', 400, 'fail');
          }
          await this.updateItemCompletely(order, existingItemIndex, update, session, userId);
          break;

        default:
          throw new AppError(`Acción no válida: ${update.action}`, 400, 'fail');
      }
    }
  }

  /**
   * Agrega un nuevo item a la orden
   * Valida stock disponible y registra movimiento de inventario
   */
  private async addNewItemToOrder(
    order: IOrderDocument,
    update: UpdateOrderItemDto,
    session: mongoose.ClientSession,
    userId?: Types.ObjectId,
  ): Promise<void> {
    if (!update.quantity || update.quantity <= 0) {
      throw new AppError('La cantidad debe ser mayor a 0', 400, 'fail');
    }

    // Verificar que el ProductVariant existe y obtener datos actuales
    const productVariant = await ProductVariant.findById(update.productVariantId).populate('product').session(session);

    if (!productVariant) {
      throw new AppError('Variante de producto no encontrada', 404, 'fail');
    }

    // Verificar stock disponible y registrar salida solo si NO está en PENDING_PAYMENT
    if (order.orderStatus !== OrderStatus.PendingPayment) {
      // Verificar stock disponible
      if (productVariant.stock < update.quantity) {
        throw new AppError(
          `Stock insuficiente. Disponible: ${productVariant.stock}, solicitado: ${update.quantity}`,
          400,
          'fail',
        );
      }

      // Registrar salida de stock
      await this.inventoryService.createStockExitWithSession(
        update.productVariantId,
        update.quantity,
        session,
        StockMovementReason.SALE,
        `Orden-${order.orderNumber}`,
        `Adición de item a orden ${order.orderNumber}`,
        userId,
      );

      logger.info('Stock reservado por adición de item', {
        orderId: order._id,
        orderNumber: order.orderNumber,
        orderStatus: order.orderStatus,
        productVariantId: update.productVariantId,
        quantity: update.quantity,
        userId: userId?.toString(),
      });
    } else {
      logger.info('Item agregado sin reserva de stock (orden en PENDING_PAYMENT)', {
        orderId: order._id,
        orderNumber: order.orderNumber,
        orderStatus: order.orderStatus,
        productVariantId: update.productVariantId,
        quantity: update.quantity,
        userId: userId?.toString(),
        reason: 'Stock ya liberado por estado PENDING_PAYMENT',
      });
    }

    // Obtener precios actuales del ProductVariant
    const priceUSDAtPurchase = productVariant.priceUSD;
    const costUSDAtPurchase = productVariant.averageCostUSD;
    const subTotal = priceUSDAtPurchase * update.quantity;
    const contributionMarginUSD = (priceUSDAtPurchase - costUSDAtPurchase) * update.quantity;
    const cogsUSD = costUSDAtPurchase * update.quantity; // Cost of Goods Sold

    // Agregar el nuevo item
    order.items.push({
      productVariant: update.productVariantId,
      quantity: update.quantity,
      subTotal,
      costUSDAtPurchase,
      priceUSDAtPurchase,
      contributionMarginUSD,
      cogsUSD,
    } as IOrderItemDocument);
  }

  /**
   * Aumenta la cantidad de un item existente
   * Valida stock disponible y registra movimiento de inventario
   */
  private async increaseItemQuantity(
    order: IOrderDocument,
    itemIndex: number,
    update: UpdateOrderItemDto,
    session: mongoose.ClientSession,
    userId?: Types.ObjectId,
  ): Promise<void> {
    if (!update.quantity || update.quantity <= 0) {
      throw new AppError('La cantidad a aumentar debe ser mayor a 0', 400, 'fail');
    }

    const item = order.items[itemIndex];

    // Verificar stock disponible y registrar salida solo si NO está en PENDING_PAYMENT
    if (order.orderStatus !== OrderStatus.PendingPayment) {
      // Verificar stock disponible
      const productVariant = await ProductVariant.findById(item.productVariant).session(session);
      if (!productVariant) {
        throw new AppError('Variante de producto no encontrada', 404, 'fail');
      }

      if (productVariant.stock < update.quantity) {
        throw new AppError(
          `Stock insuficiente. Disponible: ${productVariant.stock}, solicitado: ${update.quantity}`,
          400,
          'fail',
        );
      }

      // Registrar salida de stock
      await this.inventoryService.createStockExitWithSession(
        item.productVariant,
        update.quantity,
        session,
        StockMovementReason.SALE,
        `Orden-${order.orderNumber}`,
        `Aumento de cantidad en orden ${order.orderNumber}`,
        userId,
      );

      logger.info('Stock reservado por aumento de cantidad', {
        orderId: order._id,
        orderNumber: order.orderNumber,
        orderStatus: order.orderStatus,
        productVariantId: item.productVariant,
        quantityAdded: update.quantity,
        userId: userId?.toString(),
      });
    } else {
      logger.info('Cantidad aumentada sin reserva de stock (orden en PENDING_PAYMENT)', {
        orderId: order._id,
        orderNumber: order.orderNumber,
        orderStatus: order.orderStatus,
        productVariantId: item.productVariant,
        quantityAdded: update.quantity,
        userId: userId?.toString(),
        reason: 'Stock ya liberado por estado PENDING_PAYMENT',
      });
    }

    // Actualizar item
    item.quantity += update.quantity;
    item.subTotal = item.priceUSDAtPurchase * item.quantity;
    item.contributionMarginUSD = (item.priceUSDAtPurchase - item.costUSDAtPurchase) * item.quantity;
    item.cogsUSD = item.costUSDAtPurchase * item.quantity;
  }

  /**
   * Disminuye la cantidad de un item existente
   * Registra devolución de stock al inventario
   */
  private async decreaseItemQuantity(
    order: IOrderDocument,
    itemIndex: number,
    update: UpdateOrderItemDto,
    session: mongoose.ClientSession,
    userId?: Types.ObjectId,
  ): Promise<void> {
    if (!update.quantity || update.quantity <= 0) {
      throw new AppError('La cantidad a disminuir debe ser mayor a 0', 400, 'fail');
    }

    const item = order.items[itemIndex];

    if (item.quantity <= update.quantity) {
      throw new AppError(
        'La cantidad a disminuir es mayor o igual a la cantidad actual. Use "remove" para eliminar el item',
        400,
        'fail',
      );
    }

    // Solo devolver stock si la orden NO está en PENDING_PAYMENT
    // Si está en PENDING_PAYMENT, el stock ya fue liberado automáticamente al cambiar el estado
    if (order.orderStatus !== OrderStatus.PendingPayment) {
      // Registrar entrada de stock (devolución)
      await this.inventoryService.createStockEntryWithSession(
        item.productVariant,
        update.quantity,
        session,
        item.costUSDAtPurchase,
        StockMovementReason.RETURN,
        `Orden-${order.orderNumber}`,
        `Disminución de cantidad en orden ${order.orderNumber}`,
        userId,
      );

      logger.info('Stock devuelto por disminución de cantidad', {
        orderId: order._id,
        orderNumber: order.orderNumber,
        orderStatus: order.orderStatus,
        productVariantId: item.productVariant,
        quantityReturned: update.quantity,
        userId: userId?.toString(),
      });
    } else {
      logger.info('Cantidad disminuida sin devolución de stock (orden en PENDING_PAYMENT)', {
        orderId: order._id,
        orderNumber: order.orderNumber,
        orderStatus: order.orderStatus,
        productVariantId: item.productVariant,
        quantityReduced: update.quantity,
        userId: userId?.toString(),
        reason: 'Stock ya liberado por estado PENDING_PAYMENT',
      });
    }

    // Actualizar item
    item.quantity -= update.quantity;
    item.subTotal = item.priceUSDAtPurchase * item.quantity;
    item.contributionMarginUSD = (item.priceUSDAtPurchase - item.costUSDAtPurchase) * item.quantity;
    item.cogsUSD = item.costUSDAtPurchase * item.quantity;
  }

  /**
   * Establece una cantidad específica para un item
   * Ajusta el stock según la diferencia entre cantidad actual y nueva
   */
  private async setItemQuantity(
    order: IOrderDocument,
    itemIndex: number,
    update: UpdateOrderItemDto,
    session: mongoose.ClientSession,
    userId?: Types.ObjectId,
  ): Promise<void> {
    if (!update.quantity || update.quantity <= 0) {
      throw new AppError('La cantidad debe ser mayor a 0', 400, 'fail');
    }

    const item = order.items[itemIndex];
    const currentQuantity = item.quantity;
    const difference = update.quantity - currentQuantity;

    if (difference === 0) {
      return; // Sin cambios
    }

    if (difference > 0) {
      // Aumentar cantidad - verificar stock disponible si NO está en PENDING_PAYMENT
      if (order.orderStatus !== OrderStatus.PendingPayment) {
        const productVariant = await ProductVariant.findById(item.productVariant).session(session);
        if (!productVariant) {
          throw new AppError('Variante de producto no encontrada', 404, 'fail');
        }

        if (productVariant.stock < difference) {
          throw new AppError(
            `Stock insuficiente. Disponible: ${productVariant.stock}, necesario: ${difference}`,
            400,
            'fail',
          );
        }

        // Registrar salida de stock
        await this.inventoryService.createStockExitWithSession(
          item.productVariant,
          difference,
          session,
          StockMovementReason.SALE,
          `Orden-${order.orderNumber}`,
          `Ajuste de cantidad en orden ${order.orderNumber}`,
          userId,
        );

        logger.info('Stock reservado por aumento de cantidad', {
          orderId: order._id,
          orderNumber: order.orderNumber,
          orderStatus: order.orderStatus,
          productVariantId: item.productVariant,
          quantityAdded: difference,
          userId: userId?.toString(),
        });
      } else {
        logger.info('Cantidad aumentada sin reserva de stock (orden en PENDING_PAYMENT)', {
          orderId: order._id,
          orderNumber: order.orderNumber,
          orderStatus: order.orderStatus,
          productVariantId: item.productVariant,
          quantityAdded: difference,
          userId: userId?.toString(),
          reason: 'Stock ya liberado por estado PENDING_PAYMENT',
        });
      }
    } else {
      // Disminuir cantidad - solo devolver stock si NO está en PENDING_PAYMENT
      const quantityToReturn = Math.abs(difference);

      if (order.orderStatus !== OrderStatus.PendingPayment) {
        // Registrar entrada de stock (devolución)
        await this.inventoryService.createStockEntryWithSession(
          item.productVariant,
          quantityToReturn,
          session,
          item.costUSDAtPurchase,
          StockMovementReason.RETURN,
          `Orden-${order.orderNumber}`,
          `Ajuste de cantidad en orden ${order.orderNumber}`,
          userId,
        );

        logger.info('Stock devuelto por disminución de cantidad', {
          orderId: order._id,
          orderNumber: order.orderNumber,
          orderStatus: order.orderStatus,
          productVariantId: item.productVariant,
          quantityReturned: quantityToReturn,
          userId: userId?.toString(),
        });
      } else {
        logger.info('Cantidad disminuida sin devolución de stock (orden en PENDING_PAYMENT)', {
          orderId: order._id,
          orderNumber: order.orderNumber,
          orderStatus: order.orderStatus,
          productVariantId: item.productVariant,
          quantityReduced: quantityToReturn,
          userId: userId?.toString(),
          reason: 'Stock ya liberado por estado PENDING_PAYMENT',
        });
      }
    }

    // Actualizar item
    item.quantity = update.quantity;
    item.subTotal = item.priceUSDAtPurchase * item.quantity;
    item.contributionMarginUSD = (item.priceUSDAtPurchase - item.costUSDAtPurchase) * item.quantity;
    item.cogsUSD = item.costUSDAtPurchase * item.quantity;
  }

  /**
   * Elimina completamente un item de la orden
   * Devuelve todo el stock al inventario solo si la orden no está en PENDING_PAYMENT
   * (si está en PENDING_PAYMENT, el stock ya fue liberado automáticamente)
   */
  private async removeItemFromOrder(
    order: IOrderDocument,
    itemIndex: number,
    session: mongoose.ClientSession,
    userId?: Types.ObjectId,
  ): Promise<void> {
    const item = order.items[itemIndex];

    // Solo devolver stock si la orden NO está en PENDING_PAYMENT
    // Si está en PENDING_PAYMENT, el stock ya fue liberado automáticamente al cambiar el estado
    if (order.orderStatus !== OrderStatus.PendingPayment) {
      // Registrar entrada de stock (devolución completa)
      await this.inventoryService.createStockEntryWithSession(
        item.productVariant,
        item.quantity,
        session,
        item.costUSDAtPurchase,
        StockMovementReason.RETURN,
        `Orden-${order.orderNumber}`,
        `Eliminación de item de orden ${order.orderNumber}`,
        userId,
      );

      logger.info('Stock devuelto por eliminación de item', {
        orderId: order._id,
        orderNumber: order.orderNumber,
        orderStatus: order.orderStatus,
        productVariantId: item.productVariant,
        quantity: item.quantity,
        userId: userId?.toString(),
      });
    } else {
      logger.info('Item eliminado sin devolución de stock (orden en PENDING_PAYMENT)', {
        orderId: order._id,
        orderNumber: order.orderNumber,
        orderStatus: order.orderStatus,
        productVariantId: item.productVariant,
        quantity: item.quantity,
        userId: userId?.toString(),
        reason: 'Stock ya liberado por estado PENDING_PAYMENT',
      });
    }

    // Eliminar el item del array
    order.items.splice(itemIndex, 1);
  }

  /**
   * Actualiza únicamente los precios de un item existente
   * Recalcula automáticamente subTotal y contributionMarginUSD basándose en la cantidad actual
   */
  private async updateItemPrices(
    order: IOrderDocument,
    itemIndex: number,
    update: UpdateOrderItemDto,
    session: mongoose.ClientSession, // Mantenido para consistencia de firma, aunque no se usa directamente
    userId?: Types.ObjectId,
  ): Promise<void> {
    const item = order.items[itemIndex];
    let hasChanges = false;

    // Actualizar costUSDAtPurchase si se proporciona
    if (update.costUSDAtPurchase !== undefined) {
      item.costUSDAtPurchase = update.costUSDAtPurchase;
      hasChanges = true;
    }

    // Actualizar priceUSDAtPurchase si se proporciona
    if (update.priceUSDAtPurchase !== undefined) {
      item.priceUSDAtPurchase = update.priceUSDAtPurchase;
      hasChanges = true;
    }

    if (hasChanges) {
      // Recalcular automáticamente subTotal, contributionMarginUSD y cogsUSD basándose en la cantidad actual
      item.subTotal = item.priceUSDAtPurchase * item.quantity;
      item.contributionMarginUSD = (item.priceUSDAtPurchase - item.costUSDAtPurchase) * item.quantity;
      item.cogsUSD = item.costUSDAtPurchase * item.quantity;

      logger.info('Precios de item actualizados', {
        orderId: order._id.toString(),
        orderNumber: order.orderNumber,
        productVariantId: item.productVariant.toString(),
        oldCost: item.costUSDAtPurchase,
        newCost: update.costUSDAtPurchase,
        oldPrice: item.priceUSDAtPurchase,
        newPrice: update.priceUSDAtPurchase,
        newSubTotal: item.subTotal,
        newContributionMarginUSD: item.contributionMarginUSD,
        newCogsUSD: item.cogsUSD,
        userId: userId?.toString(),
      });
    }

    // Nota: session se mantiene en la firma para consistencia con otros métodos
    // aunque no se requiere para operaciones de actualización de precios en memoria
    void session; // Evita warning de parámetro no usado
  }

  /**
   * Actualiza completamente un item existente
   * Permite override manual de todos los campos financieros
   */
  private async updateItemCompletely(
    order: IOrderDocument,
    itemIndex: number,
    update: UpdateOrderItemDto,
    session: mongoose.ClientSession,
    userId?: Types.ObjectId,
  ): Promise<void> {
    const item = order.items[itemIndex];
    const oldQuantity = item.quantity;
    let hasChanges = false;

    // Actualizar cantidad si se proporciona
    if (update.quantity !== undefined && update.quantity !== oldQuantity) {
      const quantityDifference = update.quantity - oldQuantity;

      // Solo manejar stock si NO está en PENDING_PAYMENT
      if (order.orderStatus !== OrderStatus.PendingPayment) {
        if (quantityDifference > 0) {
          // Aumentar cantidad - verificar stock disponible
          const productVariant = await ProductVariant.findById(item.productVariant).session(session);
          if (!productVariant) {
            throw new AppError('ProductVariant no encontrado', 404, 'fail');
          }

          if (productVariant.stock < quantityDifference) {
            throw new AppError(
              `Stock insuficiente. Disponible: ${productVariant.stock}, requerido: ${quantityDifference}`,
              400,
              'fail',
            );
          }

          // Registrar salida de stock
          await this.inventoryService.createStockExitWithSession(
            item.productVariant,
            quantityDifference,
            session,
            StockMovementReason.SALE,
            `Orden-${order.orderNumber}`,
            `Aumento de cantidad en orden ${order.orderNumber}`,
            userId,
          );

          logger.info('Stock reservado por aumento de cantidad (update_all)', {
            orderId: order._id,
            orderNumber: order.orderNumber,
            orderStatus: order.orderStatus,
            productVariantId: item.productVariant,
            quantityAdded: quantityDifference,
            userId: userId?.toString(),
          });
        } else if (quantityDifference < 0) {
          // Disminuir cantidad - devolver stock
          const returnQuantity = Math.abs(quantityDifference);
          await this.inventoryService.createStockEntryWithSession(
            item.productVariant,
            returnQuantity,
            session,
            item.costUSDAtPurchase,
            StockMovementReason.RETURN,
            `Orden-${order.orderNumber}`,
            `Reducción de cantidad en orden ${order.orderNumber}`,
            userId,
          );

          logger.info('Stock devuelto por reducción de cantidad (update_all)', {
            orderId: order._id,
            orderNumber: order.orderNumber,
            orderStatus: order.orderStatus,
            productVariantId: item.productVariant,
            quantityReturned: returnQuantity,
            userId: userId?.toString(),
          });
        }
      } else {
        logger.info('Cantidad actualizada sin movimiento de stock (orden en PENDING_PAYMENT)', {
          orderId: order._id,
          orderNumber: order.orderNumber,
          orderStatus: order.orderStatus,
          productVariantId: item.productVariant,
          oldQuantity,
          newQuantity: update.quantity,
          difference: quantityDifference,
          userId: userId?.toString(),
          reason: 'Stock ya liberado por estado PENDING_PAYMENT',
        });
      }

      item.quantity = update.quantity;
      hasChanges = true;
    }

    // Actualizar precios si se proporcionan
    if (update.costUSDAtPurchase !== undefined) {
      item.costUSDAtPurchase = update.costUSDAtPurchase;
      hasChanges = true;
    }

    if (update.priceUSDAtPurchase !== undefined) {
      item.priceUSDAtPurchase = update.priceUSDAtPurchase;
      hasChanges = true;
    }

    // Actualizar subTotal, contributionMarginUSD y cogsUSD
    if (update.subTotal !== undefined) {
      // Override manual del subtotal
      item.subTotal = update.subTotal;
      hasChanges = true;
    } else if (hasChanges) {
      // Recalcular automáticamente si cambiaron precios o cantidad
      item.subTotal = item.priceUSDAtPurchase * item.quantity;
    }

    if (update.contributionMarginUSD !== undefined) {
      // Override manual de la ganancia
      item.contributionMarginUSD = update.contributionMarginUSD;
      hasChanges = true;
    } else if (hasChanges) {
      // Recalcular automáticamente si cambiaron precios o cantidad
      item.contributionMarginUSD = (item.priceUSDAtPurchase - item.costUSDAtPurchase) * item.quantity;
    }

    // Manejar cogsUSD
    if (hasChanges) {
      // Recalcular automáticamente cogsUSD si cambiaron precios o cantidad
      item.cogsUSD = item.costUSDAtPurchase * item.quantity;
    }

    if (hasChanges) {
      logger.info('Item actualizado completamente', {
        orderId: order._id.toString(),
        orderNumber: order.orderNumber,
        productVariantId: item.productVariant.toString(),
        oldQuantity,
        newQuantity: item.quantity,
        costUSDAtPurchase: item.costUSDAtPurchase,
        priceUSDAtPurchase: item.priceUSDAtPurchase,
        subTotal: item.subTotal,
        contributionMarginUSD: item.contributionMarginUSD,
        cogsUSD: item.cogsUSD,
        userId: userId?.toString(),
      });
    }
  }

  /**
   * Recalcula todos los totales de la orden
   * Calcula subtotal, ganancias, COGS y total final
   */
  private async recalculateOrderTotals(order: IOrderDocument): Promise<void> {
    // Calcular subtotal
    order.subTotal = order.items.reduce((total, item) => total + item.subTotal, 0);

    // Calcular ganancia total
    order.totalContributionMarginUSD = order.items.reduce((total, item) => total + item.contributionMarginUSD, 0);

    // Calcular total COGS
    order.totalCogsUSD = order.items.reduce((total, item) => total + item.cogsUSD, 0);

    // Recalcular totales con gastos bancarios
    const { bankTransferExpense, totalAmount } = this.calculateTotals(order.subTotal, order.paymentMethod);

    // Asignar bankTransferExpense solo si existe, sino lo deja como undefined
    if (bankTransferExpense !== undefined) {
      order.bankTransferExpense = bankTransferExpense;
    }
    order.totalAmount = totalAmount;
  }

  /**
   * Actualiza el estado de múltiples órdenes en una sola operación
   * Valida las transiciones de estado para cada orden individualmente
   */
  public async bulkUpdateOrderStatus(
    orderIds: Types.ObjectId[],
    newStatus: OrderStatus,
    userId?: Types.ObjectId,
  ): Promise<BulkUpdateOrderStatusResponseDto> {
    const successfulUpdates: string[] = [];
    const failedUpdates: { orderId: string; error: string }[] = [];

    // Procesar cada orden individualmente para manejar errores específicos
    for (const orderId of orderIds) {
      try {
        // Usar una transacción individual para cada orden
        await withTransaction(async (session) => {
          const order = await Order.findById(orderId).session(session);

          if (!order) {
            throw new AppError('Orden no encontrada', 404, 'fail');
          }

          // Usar el método privado updateOrderStatus que ya tiene toda la lógica de validación
          const updatedOrder = await this.updateOrderStatus(order, newStatus, userId, session);

          successfulUpdates.push(orderId.toString());

          // Retornar algo para que withTransaction no falle
          return updatedOrder;
        });

        logger.info('Estado de orden actualizado en bulk', {
          orderId: orderId.toString(),
          newStatus,
          updatedBy: userId?.toString(),
        });
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
        failedUpdates.push({
          orderId: orderId.toString(),
          error: errorMessage,
        });

        logger.warn('Fallo al actualizar estado de orden en bulk', {
          orderId: orderId.toString(),
          newStatus,
          error: errorMessage,
          updatedBy: userId?.toString(),
        });
      }
    }

    logger.info('Actualización masiva de estados completada', {
      totalRequested: orderIds.length,
      totalSuccessful: successfulUpdates.length,
      totalFailed: failedUpdates.length,
      newStatus,
      updatedBy: userId?.toString(),
    });

    return {
      successfulUpdates,
      failedUpdates,
      totalRequested: orderIds.length,
      totalSuccessful: successfulUpdates.length,
      totalFailed: failedUpdates.length,
    };
  }

  public async generateOrderPDF(orderId: Types.ObjectId): Promise<{ buffer: Buffer; orderNumber: number }> {
    // Obtener la orden populada
    const order = await this.getPopulatedOrderResponse(orderId);
    if (!order) throw new Error('Orden no encontrada');
    // Generar el PDF
    const buffer = await generateOrderPDF(order);
    return { buffer, orderNumber: order.orderNumber };
  }

  /**
   * Calcula el monto de reembolso basado en el tipo y cantidad especificada
   * @param subTotal - Subtotal original de la orden
   * @param refundData - Datos del reembolso (tipo y cantidad)
   * @returns Monto aplicado del reembolso en USD
   */
  private calculateRefundAmount(subTotal: number, refundData: RefundDto): number {
    if (refundData.type === 'fixed') {
      // Para montos fijos, validar que no exceda el subtotal
      return Math.min(refundData.amount, subTotal);
    } else {
      // Para porcentajes, calcular basado en el subtotal
      const percentage = Math.min(Math.max(refundData.amount, 0), 100); // Entre 0 y 100
      return Math.round(((subTotal * percentage) / 100) * 100) / 100; // Redondear a 2 decimales
    }
  }

  /**
   * Aplica un reembolso a una orden completada
   * Recalcula automáticamente el subtotal, gastos bancarios y total
   * @param orderId - ID de la orden
   * @param refundData - Datos del reembolso
   * @param processedBy - Usuario que procesa el reembolso
   * @returns Resultado detallado del reembolso aplicado
   */
  public async applyRefund(
    orderId: Types.ObjectId,
    refundData: RefundDto,
    processedBy?: Types.ObjectId,
  ): Promise<ApplyRefundResultDto> {
    try {
      const result = await withTransaction(async (session) => {
        // Obtener la orden
        const order = await Order.findById(orderId).session(session);
        if (!order) {
          throw new AppError('Orden no encontrada', 404, 'fail');
        }

        // Validar que no tenga un reembolso ya aplicado
        if (order.refund) {
          throw new AppError('Esta orden ya tiene un reembolso aplicado', 400, 'fail');
        }

        // Guardar valores originales para el resultado
        const originalSubTotal = order.subTotal;
        const originalBankTransferExpense = order.bankTransferExpense;
        const originalTotalAmount = order.totalAmount;

        // Calcular el monto del reembolso
        const refundAmount = this.calculateRefundAmount(order.subTotal, refundData);

        // Validar que el reembolso sea válido
        if (refundAmount <= 0) {
          throw new AppError('El monto del reembolso debe ser mayor a 0', 400, 'fail');
        }

        if (refundAmount > order.subTotal) {
          throw new AppError('El monto del reembolso no puede ser mayor al subtotal de la orden', 400, 'fail');
        }

        // Lógica correcta de reembolso:
        // 1. El reembolso se descuenta primero del margen de contribución
        // 2. Si el reembolso excede el margen, el exceso se descuenta de COGS (pero COGS normalmente no se toca)
        // 3. El nuevo subtotal = totalCogsUSD + nuevo margen de contribución

        const originalContributionMargin = order.totalContributionMarginUSD;
        const originalCogs = order.totalCogsUSD;

        // Descontar el reembolso directamente del margen de contribución
        const newContributionMargin = Math.max(originalContributionMargin - refundAmount, 0);

        // Calcular el nuevo subtotal basado en COGS + nuevo margen
        // (COGS permanece sin cambios ya que representa costos reales ya incurridos)
        const newSubTotal = originalCogs + newContributionMargin;

        // Recalcular gastos bancarios basado en el nuevo subtotal
        const { bankTransferExpense: newBankTransferExpense, totalAmount: newTotalAmount } = this.calculateTotals(
          newSubTotal,
          order.paymentMethod,
        );

        // Actualizar la orden con los nuevos valores
        order.subTotal = newSubTotal;
        if (newBankTransferExpense !== undefined) {
          order.bankTransferExpense = newBankTransferExpense;
        } else {
          // Usar set para remover el campo cuando es undefined
          order.set('bankTransferExpense', undefined);
        }
        order.totalAmount = newTotalAmount;
        order.totalContributionMarginUSD = newContributionMargin;
        // totalCogsUSD permanece sin cambios

        // Recalcular totalAmountARS con el valor actual del dólar
        const dollar = await Dollar.findOne().session(session);
        if (dollar) {
          order.totalAmountARS = newTotalAmount * dollar.value;
        }

        // Agregar información del reembolso
        order.refund = {
          type: refundData.type,
          amount: refundData.amount,
          appliedAmount: refundAmount,
          ...(refundData.reason && { reason: refundData.reason }),
          processedAt: new Date(),
          ...(processedBy && { processedBy }),
        };

        // Guardar la orden
        await order.save({ session });

        logger.info('Reembolso aplicado exitosamente', {
          orderId: order._id.toString(),
          orderNumber: order.orderNumber,
          orderStatus: order.orderStatus, // Estado actual (no modificado)
          refundType: refundData.type,
          refundAmount: refundData.amount,
          appliedAmount: refundAmount,
          originalSubTotal,
          newSubTotal,
          originalTotalAmount,
          newTotalAmount,
          newTotalAmountARS: order.totalAmountARS,
          originalContributionMargin,
          newContributionMargin: order.totalContributionMarginUSD,
          cogsUnchanged: order.totalCogsUSD, // COGS permanece igual
          processedBy: processedBy?.toString(),
        });

        // Obtener la orden populada para la respuesta
        const populatedOrder = await this.getPopulatedOrderResponse(order._id, session);

        return {
          success: true,
          order: populatedOrder,
          message: `Reembolso de $${refundAmount.toFixed(2)} USD aplicado exitosamente`,
          refundDetails: {
            originalSubTotal,
            refundAmount,
            newSubTotal,
            ...(originalBankTransferExpense !== undefined && {
              originalBankTransferExpense,
            }),
            ...(newBankTransferExpense !== undefined && {
              newBankTransferExpense,
            }),
            originalTotalAmount,
            newTotalAmount,
            originalContributionMarginUSD: originalContributionMargin,
            newContributionMarginUSD: order.totalContributionMarginUSD,
            cogsUSD: order.totalCogsUSD, // COGS permanece sin cambios
          },
        };
      });

      return result;
    } catch (error) {
      logger.error('Error al aplicar reembolso', {
        orderId: orderId.toString(),
        refundData,
        error: error instanceof Error ? error.message : String(error),
        processedBy: processedBy?.toString(),
      });

      if (error instanceof AppError) {
        return {
          success: false,
          message: error.message,
        };
      }

      return {
        success: false,
        message: 'Error interno del servidor al aplicar el reembolso',
      };
    }
  }

  /**
   * Cancela/elimina un reembolso de una orden
   * Restaura los valores originales recalculando automáticamente el subtotal, gastos bancarios y total
   * @param orderId - ID de la orden
   * @param cancelledBy - Usuario que cancela el reembolso
   * @returns Resultado detallado de la cancelación del reembolso
   */
  public async cancelRefund(orderId: Types.ObjectId, cancelledBy?: Types.ObjectId): Promise<CancelRefundResultDto> {
    try {
      const result = await withTransaction(async (session) => {
        // Obtener la orden
        const order = await Order.findById(orderId).session(session);
        if (!order) {
          throw new AppError('Orden no encontrada', 404, 'fail');
        }

        // Validar que tiene un reembolso aplicado
        if (!order.refund) {
          throw new AppError('Esta orden no tiene un reembolso aplicado para cancelar', 400, 'fail');
        }

        // Guardar valores actuales (con reembolso aplicado) para el resultado
        const currentSubTotal = order.subTotal;
        const currentBankTransferExpense = order.bankTransferExpense;
        const currentTotalAmount = order.totalAmount;

        // Lógica correcta de cancelación de reembolso:
        // Restaurar el margen de contribución sumando el monto del reembolso cancelado
        const cancelledRefundAmount = order.refund.appliedAmount;
        const currentContributionMarginUSD = order.totalContributionMarginUSD;
        const currentCogs = order.totalCogsUSD;

        // Restaurar el margen de contribución sumando el reembolso cancelado
        const restoredContributionMargin = currentContributionMarginUSD + cancelledRefundAmount;

        // Recalcular el subtotal basado en COGS + margen restaurado
        const restoredSubTotal = currentCogs + restoredContributionMargin;

        // Recalcular gastos bancarios basado en el subtotal restaurado
        const { bankTransferExpense: restoredBankTransferExpense, totalAmount: restoredTotalAmount } =
          this.calculateTotals(restoredSubTotal, order.paymentMethod);

        // Actualizar la orden con los valores restaurados
        order.subTotal = restoredSubTotal;
        if (restoredBankTransferExpense !== undefined) {
          order.bankTransferExpense = restoredBankTransferExpense;
        } else {
          // Usar set para remover el campo cuando es undefined
          order.set('bankTransferExpense', undefined);
        }
        order.totalAmount = restoredTotalAmount;
        order.totalContributionMarginUSD = restoredContributionMargin;
        // totalCogsUSD permanece sin cambios

        // Recalcular totalAmountARS con el valor actual del dólar
        const dollar = await Dollar.findOne().session(session);
        if (dollar) {
          order.totalAmountARS = restoredTotalAmount * dollar.value;
        }

        // Eliminar la información del reembolso
        order.set('refund', undefined);

        // Guardar la orden
        await order.save({ session });

        logger.info('Reembolso cancelado exitosamente', {
          orderId: order._id.toString(),
          orderNumber: order.orderNumber,
          orderStatus: order.orderStatus,
          cancelledRefundAmount,
          originalSubTotal: currentSubTotal, // SubTotal antes de la cancelación (con reembolso aplicado)
          restoredSubTotal,
          originalTotalAmount: currentTotalAmount, // Total antes de la cancelación (con reembolso aplicado)
          restoredTotalAmount,
          restoredTotalAmountARS: order.totalAmountARS,
          originalContributionMargin: currentContributionMarginUSD,
          restoredContributionMargin,
          cogsUnchanged: order.totalCogsUSD,
          cancelledBy: cancelledBy?.toString(),
        });

        // Obtener la orden populada para la respuesta
        const populatedOrder = await this.getPopulatedOrderResponse(order._id, session);

        return {
          success: true,
          order: populatedOrder,
          message: `Reembolso de $${cancelledRefundAmount.toFixed(2)} USD cancelado exitosamente`,
          refundCancellationDetails: {
            cancelledRefundAmount,
            originalSubTotal: currentSubTotal, // SubTotal antes de cancelar (con reembolso aplicado)
            restoredSubTotal,
            ...(currentBankTransferExpense !== undefined && {
              originalBankTransferExpense: currentBankTransferExpense,
            }),
            ...(restoredBankTransferExpense !== undefined && {
              restoredBankTransferExpense,
            }),
            originalTotalAmount: currentTotalAmount, // Total antes de cancelar (con reembolso aplicado)
            restoredTotalAmount,
            originalContributionMarginUSD: currentContributionMarginUSD,
            restoredContributionMarginUSD: restoredContributionMargin,
            cogsUSD: order.totalCogsUSD, // COGS permanece sin cambios
          },
        };
      });

      return result;
    } catch (error) {
      logger.error('Error al cancelar reembolso', {
        orderId: orderId.toString(),
        error: error instanceof Error ? error.message : String(error),
        cancelledBy: cancelledBy?.toString(),
      });

      if (error instanceof AppError) {
        return {
          success: false,
          message: error.message,
        };
      }

      return {
        success: false,
        message: 'Error interno del servidor al cancelar el reembolso',
      };
    }
  }

  /**
   * Obtiene los detalles de reembolso de una orden
   * @param orderId - ID de la orden
   * @returns Información del reembolso si existe
   */
  public async getRefundDetails(orderId: Types.ObjectId): Promise<RefundResponse | null> {
    const order = await Order.findById(orderId);
    if (!order) {
      throw new AppError('Orden no encontrada', 404, 'fail');
    }

    return this.mapRefundToResponse(order.refund);
  }

  /**
   * Valida si una orden puede recibir un reembolso
   * @param orderId - ID de la orden
   * @returns Información sobre la elegibilidad para reembolso
   */
  public async canApplyRefund(orderId: Types.ObjectId): Promise<{
    canRefund: boolean;
    reason?: string;
    maxRefundAmount?: number;
  }> {
    const order = await Order.findById(orderId);
    if (!order) {
      throw new AppError('Orden no encontrada', 404, 'fail');
    }

    // Verificar si ya tiene reembolso
    if (order.refund) {
      return {
        canRefund: false,
        reason: 'Esta orden ya tiene un reembolso aplicado',
      };
    }

    // Verificar que tenga un subtotal positivo
    if (order.subTotal <= 0) {
      return {
        canRefund: false,
        reason: 'La orden no tiene un monto válido para reembolsar',
      };
    }

    return {
      canRefund: true,
      maxRefundAmount: order.subTotal,
    };
  }

  /**
   * Valida si una orden puede cancelar su reembolso
   * @param orderId - ID de la orden
   * @returns Información sobre la elegibilidad para cancelar el reembolso
   */
  public async canCancelRefund(orderId: Types.ObjectId): Promise<{
    canCancelRefund: boolean;
    reason?: string;
    refundAmount?: number;
  }> {
    const order = await Order.findById(orderId);
    if (!order) {
      throw new AppError('Orden no encontrada', 404, 'fail');
    }

    // Verificar si tiene un reembolso aplicado
    if (!order.refund) {
      return {
        canCancelRefund: false,
        reason: 'Esta orden no tiene un reembolso aplicado para cancelar',
      };
    }

    return {
      canCancelRefund: true,
      refundAmount: order.refund.appliedAmount,
    };
  }

  // Método para actualizar el campo totalAmountARS en todas las órdenes no completadas
  public async updateOrdersWithDollarValue(): Promise<void> {
    await withTransaction(async (session) => {
      const dollar = await Dollar.findOne().session(session);
      if (!dollar) {
        throw new AppError('No se encontró el valor del dólar en la base de datos.', 500, 'error');
      }

      const ordersToUpdate = await Order.find({
        orderStatus: { $ne: OrderStatus.Completed },
      }).session(session);

      for (const order of ordersToUpdate) {
        order.totalAmountARS = order.totalAmount * dollar.value;
        await order.save({ session });
      }

      logger.info('Órdenes actualizadas con el valor del dólar actual.');
      return null; // Retorna un valor explícito para evitar errores
    });
  }
}
