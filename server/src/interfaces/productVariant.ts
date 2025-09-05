import { Types } from 'mongoose';

export interface IProductVariantColor {
  name: string;
  hex: string;
}

export interface IProductVariant {
  product: Types.ObjectId; // referencia al producto base
  color: IProductVariantColor;
  stock: number;
  averageCostUSD: number; // Costo promedio ponderado en USD
  priceUSD: number; // Precio de venta en USD
  thumbnail: string;
  images: string[];
}
