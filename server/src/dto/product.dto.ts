import { Types } from 'mongoose';
import { ProductVariantSummaryDto } from './product-variant.dto';

export interface CreateProductRequestDto {
  thumbnail: string;
  primaryImage: string[];
  primaryImageOrder?: number[]; // Índices para ordenar las primaryImage (opcional)
  category: Types.ObjectId[];
  subcategory: Types.ObjectId;
  productModel: string;
  sku: string;
  size: string;
  description?: string;
}

export interface CreateProductResponseDto {
  id: string;
  slug: string;
  thumbnail: string;
  primaryImage: string[];
  category: ProductCategoryDto[];
  subcategory: ProductSubcategoryDto;
  productModel: string;
  sku: string;
  size: string;
  description?: string;
}

export interface UpdateProductRequestDto {
  thumbnail?: string;
  primaryImage?: string[];
  primaryImageOrder?: number[]; // Índices para ordenar las primaryImage (opcional)
  category?: Types.ObjectId[];
  subcategory?: Types.ObjectId;
  productModel?: string;
  sku?: string;
  size?: string;
  description?: string;
}

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
  primaryImage: string[];
  category: ProductCategoryDto[];
  subcategory: ProductSubcategoryDto;
  productModel: string;
  sku: string;
  size?: string;
  description?: string;
  variants: ProductVariantSummaryDto[];
}

export interface SearchProductsResponseDto {
  products: ProductListItemDto[];
}

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

export interface GetProductsResponseDto {
  products: ProductListItemDto[];
  pagination: PaginationMetadata;
}
