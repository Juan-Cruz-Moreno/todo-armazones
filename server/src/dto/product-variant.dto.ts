import { Types } from 'mongoose';

export interface ProductVariantColorDto {
  name: string;
  hex: string;
}

export interface CreateProductVariantRequestDto {
  product: Types.ObjectId; // referencia al producto base (ID de MongoDB)
  color: ProductVariantColorDto;
  stock: number;
  initialCostUSD: number; // Costo inicial para el stock inicial
  priceUSD: number; // Precio de venta en USD
  thumbnail: string;
  images: string[];
}

export interface CreateProductVariantResponseDto {
  id: string; // ID de MongoDB del producto variante creado
  product: string; // referencia al producto base (ID de MongoDB)
  color: ProductVariantColorDto;
  stock: number;
  averageCostUSD: number;
  priceUSD: number;
  priceARS: number; // Precio en ARS
  thumbnail: string;
  images: string[];
}

export interface UpdateProductVariantRequestDto {
  color?: ProductVariantColorDto;
  priceUSD?: number;
  thumbnail?: string;
  images?: string[];
  averageCostUSD?: number; // Permitir modificación manual del costo promedio ponderado
  stock?: number; // Opcional: solo para nuevas variantes creadas en update
  initialCostUSD?: number; // Opcional: costo inicial si se incluye stock para nuevas variantes
  // Note: stock se actualiza únicamente mediante InventoryService para variantes existentes
}

export interface ProductVariantSummaryDto {
  id: string;
  color: { name: string; hex: string };
  stock: number;
  averageCostUSD: number;
  priceUSD: number;
  priceARS: number; // Precio en ARS
  thumbnail: string;
  images: string[];
}
