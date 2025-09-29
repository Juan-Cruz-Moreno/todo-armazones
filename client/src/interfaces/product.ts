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
  thumbnail: string;
  images: string[];
  priceUSD: number;
  priceARS: number;
  averageCostUSD: number;
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
  size?: string;
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
