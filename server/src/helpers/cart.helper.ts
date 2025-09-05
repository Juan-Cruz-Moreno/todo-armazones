import { Types } from 'mongoose';
import ProductVariant, { IProductVariantDocument } from '@models/ProductVariant';
import { AppError } from '@utils/AppError';
import { ICartItemDocument } from '@models/Cart';

/**
 * Obtiene la información de precios para múltiples product variants en una sola consulta
 */
async function getProductVariantPrices(productVariantIds: Types.ObjectId[]): Promise<Map<string, number>> {
  const productVariants = (await ProductVariant.find({
    _id: { $in: productVariantIds },
  })
    .select('priceUSD')
    .lean()) as IProductVariantDocument[];

  const priceMap = new Map<string, number>();

  for (const variant of productVariants) {
    priceMap.set(variant._id.toString(), variant.priceUSD);
  }

  return priceMap;
}

/**
 * Calcula el subtotal de un ítem del carrito en base al precio actual del ProductVariant.
 * Optimizado para usar con calculateCartSubTotal cuando se calculan múltiples items.
 */
export async function calculateItemSubTotal(productVariantId: Types.ObjectId, quantity: number): Promise<number> {
  const priceMap = await getProductVariantPrices([productVariantId]);
  const price = priceMap.get(productVariantId.toString());

  if (price === undefined) {
    throw new AppError('Product variant not found', 404, 'fail', true, {
      code: 'PRODUCT_VARIANT_NOT_FOUND',
      context: { productVariantId },
    });
  }

  return price * quantity;
}

export async function calculateCartSubTotal(items: ICartItemDocument[]): Promise<number> {
  if (items.length === 0) {
    return 0;
  }

  // Obtener todos los productVariantId únicos
  const productVariantIds = [...new Set(items.map((item) => item.productVariant))];

  // Obtener todos los precios en una sola consulta optimizada
  const priceMap = await getProductVariantPrices(productVariantIds);

  // Calcular los subtotales
  let totalSubTotal = 0;
  for (const item of items) {
    const variantId = item.productVariant.toString();
    const price = priceMap.get(variantId);

    if (price === undefined) {
      throw new AppError('Product variant not found', 404, 'fail', true, {
        code: 'PRODUCT_VARIANT_NOT_FOUND',
        context: { productVariantId: item.productVariant },
      });
    }

    totalSubTotal += price * item.quantity;
  }

  return totalSubTotal;
}

/**
 * Versión optimizada para calcular múltiples subtotales de items en una sola consulta.
 * Útil cuando necesitas calcular subtotales individuales y el total del carrito.
 */
export async function calculateMultipleItemSubTotals(
  items: { productVariantId: Types.ObjectId; quantity: number }[],
): Promise<{ itemSubTotals: number[]; cartSubTotal: number }> {
  if (items.length === 0) {
    return { itemSubTotals: [], cartSubTotal: 0 };
  }

  const productVariantIds = [...new Set(items.map((item) => item.productVariantId))];
  const priceMap = await getProductVariantPrices(productVariantIds);

  const itemSubTotals: number[] = [];
  let cartSubTotal = 0;

  for (const item of items) {
    const variantId = item.productVariantId.toString();
    const price = priceMap.get(variantId);

    if (price === undefined) {
      throw new AppError('Product variant not found', 404, 'fail', true, {
        code: 'PRODUCT_VARIANT_NOT_FOUND',
        context: { productVariantId: item.productVariantId },
      });
    }

    const subTotal = price * item.quantity;
    itemSubTotals.push(subTotal);
    cartSubTotal += subTotal;
  }

  return { itemSubTotals, cartSubTotal };
}
