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
  thumbnail?: string; // Agregado para consistencia con client
  images: string[];
  averageCostUSD: number;
  priceUSD: number;
  priceARS: number;
}

export interface Product {
  id: string;
  slug: string;
  thumbnail: string;
  primaryImage: string[];
  category: ProductCategory[];
  subcategory: ProductSubcategory;
  productModel: string;
  sku: string;
  size?: string; // Mantenido como opcional para compatibilidad legacy
  description?: string;
  variants: ProductVariant[];
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

export interface ProductsResponse {
  products: Product[];
  pagination: PaginationMetadata;
}

// Interfaz para obtener solo metadatos de paginación (usado por el nuevo endpoint)
export interface ProductsPaginationInfo {
  totalCount: number;
  totalPages: number;
  currentPage: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
  limit: number;
}

export interface ProductFilters {
  page?: number;
  categorySlug?: string;
  subcategorySlug?: string;
  cursor?: string;
  limit?: number;
  inStock?: boolean;
  outOfStock?: boolean;
}

export interface CreateProductPayload {
  product: {
    category: string[]; // IDs de categorías
    subcategory: string; // ID de subcategoría
    productModel: string;
    sku: string;
    size: string; // Ahora requerido para creación
    description?: string;
    primaryImageOrder?: number[]; // Índices para ordenar las primaryImage
  };
  variants: Array<{
    color: ProductVariantColor;
    stock: number;
    initialCostUSD: number;
    priceUSD: number;
  }>;
  files?: {
    primaryImage?: File[];
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
    description?: string;
    primaryImageOrder?: number[]; // Índices para ordenar las primaryImage
  };
  variants: Array<{
    id?: string; // ID de la variante (opcional para nuevas)
    data: {
      color?: { name: string; hex: string };
      priceUSD?: number;
      averageCostUSD?: number; // Permitir modificación manual del costo promedio ponderado
      stock?: number; // Opcional para nuevas variantes
      initialCostUSD?: number; // Opcional para nuevas variantes
    };
  }>;
  files?: {
    primaryImage?: File[];
    variantImages?: Record<string, File[]>;
  };
}

// Bulk Price Update Interfaces
export enum PriceUpdateType {
  FIXED_AMOUNT = "FIXED_AMOUNT",
  PERCENTAGE = "PERCENTAGE",
  SET_PRICE = "SET_PRICE",
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

// Low Stock Interfaces
export interface ProductVariantWithProduct extends ProductVariant {
  product: {
    id: string;
    slug: string;
    productModel: string;
    sku: string;
    thumbnail: string;
  };
}

export interface LowStockPaginationMetadata {
  totalCount: number;
  totalPages: number;
  currentPage: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
  limit: number;
  itemsInCurrentPage: number;
}

export interface LowStockProductVariantsResponse {
  variants: ProductVariantWithProduct[];
  pagination: LowStockPaginationMetadata;
}

export interface LowStockFilters {
  stockThreshold: number;
  page?: number;
  limit?: number;
  minStock?: number;
  maxStock?: number;
}
