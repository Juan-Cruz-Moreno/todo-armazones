import { Types } from 'mongoose';
import { ProductVariantSummaryDto } from './product-variant.dto';

export interface CreateProductRequestDto {
  thumbnail: string;
  primaryImage: string;
  category: Types.ObjectId[];
  subcategory: Types.ObjectId;
  productModel: string;
  sku: string;
  size?: string;
}

export interface CreateProductResponseDto {
  id: string;
  slug: string;
  thumbnail: string;
  primaryImage: string;
  category: ProductCategoryDto[];
  subcategory: ProductSubcategoryDto;
  productModel: string;
  sku: string;
  size?: string;
}

export interface UpdateProductRequestDto {
  thumbnail?: string;
  primaryImage?: string;
  category?: Types.ObjectId[];
  subcategory?: Types.ObjectId;
  productModel?: string;
  sku?: string;
  size?: string;
}

// export interface UpdateProductResponseDto {
//   id: string;
//   slug: string;
//   thumbnail: string;
//   primaryImage: string;
//   category: ProductCategoryDto[];
//   subcategory: ProductSubcategoryDto;
//   productModel: string;
//   sku: string;
//   size?: string;
//   costUSD: number;
//   priceUSD: number;
// }

export interface ProductCategoryDto {
  id: string;
  name: string;
  slug: string;
}

export interface ProductSubcategoryDto {
  id: string;
  name: string;
  slug: string;
}

export interface ProductListItemDto {
  id: string;
  slug: string;
  thumbnail: string;
  primaryImage: string;
  category: ProductCategoryDto[];
  subcategory: ProductSubcategoryDto;
  productModel: string;
  sku: string;
  size?: string;
  variants: ProductVariantSummaryDto[];
}

export interface SearchProductsResponseDto {
  products: ProductListItemDto[];
}
