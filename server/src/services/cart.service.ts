import mongoose, { Types } from 'mongoose';

import {
  AddItemToCartRequestDto,
  DecrementItemQuantityRequestDto,
  IncrementItemQuantityRequestDto,
  RemoveItemFromCartRequestDto,
} from '@dto/cart.dto';
import { withTransaction } from '@helpers/withTransaction';
import ProductVariant, { IProductVariantPopulated } from '@models/ProductVariant';
import { AppError } from '@utils/AppError';
import Cart, { ICartDocument } from '@models/Cart';
import logger from '@config/logger';
import { calculateCartSubTotal, calculateMultipleItemSubTotals } from '@helpers/cart.helper';

// Constante para el populate de items.productVariant
const CART_ITEM_POPULATE = {
  path: 'items.productVariant',
  select: 'product color stock averageCostUSD priceUSD thumbnail images',
  populate: [
    {
      path: 'product',
      select: 'productModel slug thumbnail primaryImage category subcategory sku size createdAt updatedAt',
    },
  ],
};

export class CartService {
  /**
   * Private method to validate that a cart exists for the user
   */
  private async validateCartExists(userId: Types.ObjectId, session: mongoose.ClientSession) {
    const cart = await Cart.findOne({ userId }).session(session);
    if (!cart) {
      throw new AppError('Cart not found', 404, 'fail', true, {
        code: 'CART_NOT_FOUND',
        context: { userId },
      });
    }
    return cart;
  }

  /**
   * Private method to validate that a ProductVariant exists
   */
  private async validateProductVariantExists(productVariantId: Types.ObjectId, session: mongoose.ClientSession) {
    const productVariant = await ProductVariant.findById(productVariantId).session(session);
    if (!productVariant) {
      throw new AppError('Product variant not found', 404, 'fail', true, {
        code: 'PRODUCT_VARIANT_NOT_FOUND',
        context: { productVariantId },
      });
    }
    return productVariant;
  }

  /**
   * Private method to find an item in the cart
   */
  private findCartItem(cart: ICartDocument, productVariantId: Types.ObjectId) {
    return cart.items.find((item) => item.productVariant.equals(productVariantId));
  }

  /**
   * Private method to find the index of an item in the cart
   */
  private findCartItemIndex(cart: ICartDocument, productVariantId: Types.ObjectId) {
    return cart.items.findIndex((item) => item.productVariant.equals(productVariantId));
  }

  /**
   * Private method to validate that an item exists in the cart
   */
  private validateCartItemExists(cart: ICartDocument, productVariantId: Types.ObjectId) {
    const item = this.findCartItem(cart, productVariantId);
    if (!item) {
      throw new AppError('Item not found in cart', 404, 'fail', true, {
        code: 'ITEM_NOT_FOUND',
        context: { productVariantId },
      });
    }
    return item;
  }

  /**
   * Private method to validate stock availability
   */
  private validateStockAvailability(
    currentQuantity: number,
    additionalQuantity: number,
    stock: number,
    productVariantId: Types.ObjectId,
  ) {
    if (currentQuantity + additionalQuantity > stock) {
      throw new AppError('No puedes agregar más de este producto al carrito', 400, 'fail', true, {
        code: 'INSUFFICIENT_STOCK',
        context: { productVariantId },
      });
    }
  }

  /**
   * Private method to recalculate all cart subtotals
   */
  private async recalculateCartSubtotals(cart: ICartDocument) {
    // Recalculate all subtotals in one optimized operation
    cart.subTotal = await calculateCartSubTotal(cart.items);

    // Update individual item subtotals based on current prices
    if (cart.items.length > 0) {
      const itemsForCalculation = cart.items.map((item) => ({
        productVariantId: item.productVariant,
        quantity: item.quantity,
      }));

      const { itemSubTotals } = await calculateMultipleItemSubTotals(itemsForCalculation);

      // Update each item's subtotal
      cart.items.forEach((item, index: number) => {
        item.subTotal = itemSubTotals[index];
      });
    }
  }

  /**
   * Private method to save cart and return populated version
   */
  private async saveAndReturnCart(cart: ICartDocument, session: mongoose.ClientSession) {
    await cart.save({ session });
    return (await Cart.findById(cart._id).populate(CART_ITEM_POPULATE).lean().session(session))!;
  }

  // Method to get the user's cart
  public async getCart(userId: Types.ObjectId) {
    return await withTransaction(async (session) => {
      // Use findOneAndUpdate with upsert to avoid race conditions
      const cart = await Cart.findOneAndUpdate(
        { userId },
        {
          $setOnInsert: {
            userId,
            items: [],
            subTotal: 0,
          },
        },
        {
          new: true,
          upsert: true,
          session,
        },
      )
        .populate(CART_ITEM_POPULATE)
        .lean();

      return cart!;
    });
  }

  // Method to add an item to the user's cart
  public async addItemToCart(userId: Types.ObjectId, dto: AddItemToCartRequestDto) {
    return await withTransaction(async (session) => {
      // Validate that the ProductVariant exists
      const productVariant = await this.validateProductVariantExists(dto.productVariantId, session);

      // Set the default value of quantity to 1 if not provided
      const quantity = dto.quantity ?? 1;

      // Find the user's cart or create a new one if it doesn't exist
      const cart = await Cart.findOneAndUpdate(
        { userId: userId },
        {
          $setOnInsert: {
            userId: userId,
            items: [], // Initialize the cart with an empty items array
            subTotal: 0, // Initialize the subtotal to 0
          },
        },
        { new: true, upsert: true, session }, // Create a new cart if it doesn't exist
      );

      // Check if the item already exists in the cart
      const existingItem = this.findCartItem(cart, dto.productVariantId);

      if (existingItem) {
        // If the item exists, validate stock availability
        this.validateStockAvailability(existingItem.quantity, quantity, productVariant.stock, dto.productVariantId);

        // Update the quantity (subtotal will be calculated later)
        existingItem.quantity += quantity;

        logger.info('Updated quantity for existing item in cart', {
          userId,
          productVariantId: dto.productVariantId,
          quantity: existingItem.quantity,
        });
      } else {
        // If the item does not exist, validate stock availability
        this.validateStockAvailability(0, quantity, productVariant.stock, dto.productVariantId);

        // Add the new item to the cart (subtotal will be calculated later)
        const newItem = {
          productVariant: dto.productVariantId,
          quantity: quantity,
          subTotal: 0, // Temporary value, will be calculated below
        };

        cart.items.push(newItem);

        logger.info('Added new item to cart', {
          userId,
          productVariantId: dto.productVariantId,
          quantity: quantity,
        });
      }

      // Recalculate all subtotals
      await this.recalculateCartSubtotals(cart);

      logger.info('Cart updated successfully', {
        userId,
        cartId: cart._id,
        itemCount: cart.items.length,
        total: cart.subTotal,
      });

      return await this.saveAndReturnCart(cart, session);
    });
  }

  public async incrementItemInCart(userId: Types.ObjectId, dto: IncrementItemQuantityRequestDto) {
    return await withTransaction(async (session) => {
      // Validate cart exists
      const cart = await this.validateCartExists(userId, session);

      // Validate item exists in cart
      const item = this.validateCartItemExists(cart, dto.productVariantId);

      // Validate ProductVariant exists
      const productVariant = await this.validateProductVariantExists(dto.productVariantId, session);

      // Validate stock availability for increment
      this.validateStockAvailability(item.quantity, 1, productVariant.stock, dto.productVariantId);

      item.quantity += 1;

      // Recalculate all subtotals
      await this.recalculateCartSubtotals(cart);

      return await this.saveAndReturnCart(cart, session);
    });
  }

  // Method to decrement the quantity of an item in the user's cart
  public async decrementItemInCart(userId: Types.ObjectId, dto: DecrementItemQuantityRequestDto) {
    return await withTransaction(async (session) => {
      // Validate cart exists
      const cart = await this.validateCartExists(userId, session);

      // Find item index in cart
      const itemIndex = this.findCartItemIndex(cart, dto.productVariantId);
      if (itemIndex === -1) {
        throw new AppError('Item not found in cart', 404, 'fail', true, {
          code: 'ITEM_NOT_FOUND',
          context: { productVariantId: dto.productVariantId },
        });
      }

      const item = cart.items[itemIndex];

      if (item.quantity <= 1) {
        // Remove the item from the cart if quantity is 1 or less
        cart.items.splice(itemIndex, 1);
        logger.info('Removed item from cart due to quantity decrement', {
          userId,
          productVariantId: dto.productVariantId,
        });
      } else {
        // Decrement the quantity
        item.quantity -= 1;
        logger.info('Decremented item quantity in cart', {
          userId,
          productVariantId: dto.productVariantId,
          newQuantity: item.quantity,
        });
      }

      // Recalculate all subtotals
      await this.recalculateCartSubtotals(cart);

      return await this.saveAndReturnCart(cart, session);
    });
  }

  // Method to remove an item from the user's cart
  public async removeItemFromCart(userId: Types.ObjectId, dto: RemoveItemFromCartRequestDto) {
    return await withTransaction(async (session) => {
      // Validate cart exists
      const cart = await this.validateCartExists(userId, session);

      // Find item index in cart
      const itemIndex = this.findCartItemIndex(cart, dto.productVariantId);
      if (itemIndex === -1) {
        throw new AppError('Item not found in cart', 404, 'fail', true, {
          code: 'ITEM_NOT_FOUND',
          context: { productVariantId: dto.productVariantId },
        });
      }

      cart.items.splice(itemIndex, 1);

      // Recalculate all subtotals
      await this.recalculateCartSubtotals(cart);

      logger.info('Removed item from cart', {
        userId,
        productVariantId: dto.productVariantId,
      });

      return await this.saveAndReturnCart(cart, session);
    });
  }

  // Method to clear (delete) the user's cart
  public async clearCart(userId: Types.ObjectId, session?: mongoose.ClientSession) {
    const cart = await Cart.findOneAndDelete({ userId }).session(session || null);
    if (!cart) {
      throw new AppError('Cart not found', 404, 'fail', true, {
        code: 'CART_NOT_FOUND',
        context: { userId },
      });
    }

    logger.info('Cleared cart', {
      userId,
      cartId: cart._id,
    });

    return cart;
  }

  /**
   * Sincroniza el carrito con el stock actual de los productVariant.
   * - Si no hay stock, elimina el item.
   * - Si hay menos stock que la cantidad en el carrito, ajusta al máximo posible.
   * Devuelve el carrito actualizado y un resumen de los cambios.
   */
  public async syncCartWithStock(userId: Types.ObjectId) {
    return await withTransaction(async (session) => {
      const cart = await this.validateCartExists(userId, session);
      if (!cart.items.length) {
        // Si el carrito está vacío, devolverlo populado
        const populatedCart = await Cart.findById(cart._id).populate(CART_ITEM_POPULATE).lean().session(session);
        return { cart: populatedCart, changes: [] };
      }

      // Obtener todos los productVariantIds únicos
      const productVariantIds = cart.items.map((item) => item.productVariant);
      // Obtener los ProductVariant actuales
      const productVariants = await ProductVariant.find({ _id: { $in: productVariantIds } })
        .select('stock priceUSD color product')
        .populate<Pick<IProductVariantPopulated, 'product'>>({
          path: 'product',
          select: 'productModel slug thumbnail primaryImage category subcategory sku size createdAt updatedAt',
        })
        .lean()
        .session(session);

      const stockMap = new Map<string, { stock: number; productVariant: IProductVariantPopulated }>();
      productVariants.forEach((pv) => {
        stockMap.set(pv._id.toString(), { stock: pv.stock, productVariant: pv });
      });

      const changes: Array<{
        productVariant: IProductVariantPopulated | null; // populado
        oldQuantity: number;
        newQuantity: number;
        removed: boolean;
        stock: number;
      }> = [];

      // Iterar y ajustar/eliminar según stock
      for (let i = cart.items.length - 1; i >= 0; i--) {
        const item = cart.items[i];
        const stockEntry = stockMap.get(item.productVariant.toString());
        const stock = stockEntry?.stock ?? 0;
        const productVariantPopulated = stockEntry?.productVariant ?? null;
        if (stock <= 0) {
          changes.push({
            productVariant: productVariantPopulated,
            oldQuantity: item.quantity,
            newQuantity: 0,
            removed: true,
            stock,
          });
          cart.items.splice(i, 1);
        } else if (item.quantity > stock) {
          changes.push({
            productVariant: productVariantPopulated,
            oldQuantity: item.quantity,
            newQuantity: stock,
            removed: false,
            stock,
          });
          item.quantity = stock;
        }
      }

      // Recalcular subtotales
      await this.recalculateCartSubtotals(cart);
      await cart.save({ session });
      const populatedCart = await Cart.findById(cart._id).populate(CART_ITEM_POPULATE).lean().session(session);
      return { cart: populatedCart, changes };
    });
  }
}
