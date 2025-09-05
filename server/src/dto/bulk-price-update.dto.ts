import { Types } from 'mongoose';

export enum PriceUpdateType {
  FIXED_AMOUNT = 'FIXED_AMOUNT', // Aumentar/disminuir una cantidad fija (ej: +2 USD, -5 USD)
  PERCENTAGE = 'PERCENTAGE', // Aumentar/disminuir por porcentaje (ej: +5%, -10%)
  SET_PRICE = 'SET_PRICE', // Establecer precio fijo (ej: 100 USD)
}

export interface BulkPriceUpdateRequestDto {
  categoryIds?: Types.ObjectId[]; // IDs de categorías a afectar
  subcategoryIds?: Types.ObjectId[]; // IDs de subcategorías a afectar (opcional)
  updateType: PriceUpdateType; // Tipo de actualización
  value: number; // Valor del cambio (puede ser positivo o negativo)
  minPrice?: number; // Precio mínimo permitido después de la actualización
  maxPrice?: number; // Precio máximo permitido después de la actualización
}

export interface ProductVariantPriceUpdateDto {
  id: string;
  productId: string;
  productModel: string;
  sku: string;
  color: { name: string; hex: string };
  oldPrice: number;
  newPrice: number;
  priceChange: number;
  priceChangePercentage: number;
}

export interface BulkPriceUpdateResponseDto {
  totalVariantsFound: number;
  totalVariantsUpdated: number;
  totalVariantsSkipped: number; // Variantes que no se actualizaron por límites de precio
  updatedVariants: ProductVariantPriceUpdateDto[];
  skippedVariants: ProductVariantPriceUpdateDto[]; // Variantes omitidas con razón
  summary: {
    averagePriceIncrease: number;
    totalValueIncrease: number; // Suma total del incremento de precio
  };
}
