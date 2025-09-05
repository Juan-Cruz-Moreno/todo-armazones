interface ProductCategory {
  id: string;
  name: string;
  slug: string;
}

interface ProductSubcategory {
  id: string;
  name: string;
  slug: string;
}

interface ProductVariantColor {
  name: string;
  hex: string;
}

export interface ProductVariant {
  id: string;
  color: ProductVariantColor;
  stock: number;
  images: string[];
  averageCostUSD: number;
  priceUSD: number;
}

export interface Product {
  id: string;
  slug: string;
  thumbnail: string;
  primaryImage: string;
  category: ProductCategory[];
  subcategory: ProductSubcategory;
  productModel: string;
  sku: string;
  size?: string;
  variants: ProductVariant[];
}

export interface ProductsResponse {
  products: Product[];
  nextCursor: string | null;
}

export interface CreateProductPayload {
  product: {
    category: string[]; // IDs de categorías
    subcategory: string; // ID de subcategoría
    productModel: string;
    sku: string;
    size?: string;
  };
  variants: Array<{
    color: ProductVariantColor;
    stock: number;
    initialCostUSD: number;
    priceUSD: number;
  }>;
  files?: {
    primaryImage?: File;
    variantImages?: Record<string, File[]>;
  };
}

export type CreateProductResponse = {
  product: Product;
  variants: ProductVariant[];
};

export interface UpdateProductPayload {
  productId: string;
  product: {
    category?: string[];
    subcategory?: string;
    productModel?: string;
    sku?: string;
    size?: string;
  };
  variants: Array<{
    id: string; // ID de la variante
    data: {
      color?: { name: string; hex: string };
      priceUSD?: number;
    };
  }>;
  files?: {
    primaryImage?: File;
    variantImages?: Record<string, File[]>;
  };
}

// Bulk Price Update Interfaces
export enum PriceUpdateType {
  FIXED_AMOUNT = 'FIXED_AMOUNT',
  PERCENTAGE = 'PERCENTAGE',
  SET_PRICE = 'SET_PRICE',
}

export interface BulkPriceUpdatePayload {
  categoryIds: string[];
  subcategoryIds?: string[];
  updateType: PriceUpdateType;
  value: number;
  minPrice?: number;
  maxPrice?: number;
}

export interface ProductVariantPriceUpdate {
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

export interface BulkPriceUpdateResponse {
  totalVariantsFound: number;
  totalVariantsUpdated: number;
  totalVariantsSkipped: number;
  updatedVariants: ProductVariantPriceUpdate[];
  skippedVariants: ProductVariantPriceUpdate[];
  summary: {
    averagePriceIncrease: number;
    totalValueIncrease: number;
  };
}
