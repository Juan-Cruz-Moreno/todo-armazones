import { Types } from 'mongoose';

export interface PriceAdjustmentDto {
  categoryId?: Types.ObjectId; // ID de categoría específica
  subcategoryId?: Types.ObjectId; // ID de subcategoría específica
  percentageIncrease: number; // Porcentaje de incremento (ej: 35 para 35%)
}

export interface GenerateCatalogRequestDto {
  categories?: Types.ObjectId[]; // IDs de categorías específicas a incluir
  subcategories?: Types.ObjectId[]; // IDs de subcategorías específicas a incluir
  priceAdjustments?: PriceAdjustmentDto[]; // Ajustes de precio por categoría/subcategoría
  inStock?: boolean; // Incluir solo productos con al menos una variante en stock
  showPrices?: boolean; // Mostrar precios en el catálogo (por defecto true)
}

export interface GenerateCatalogResponseDto {
  message: string;
  pdfBuffer: Buffer; // Buffer del PDF generado
  fileName: string; // Nombre del archivo PDF
}

export interface CatalogCategoryDto {
  id: string;
  slug: string;
  name: string;
  title: string;
  description: string;
  image: string;
  subcategories: CatalogSubcategoryDto[];
}

export interface CatalogSubcategoryDto {
  id: string;
  slug: string;
  name: string;
  title: string;
  description: string;
  image: string;
  products: CatalogProductDto[];
}

export interface CatalogProductDto {
  id: string;
  slug: string;
  thumbnail: string;
  primaryImage: string;
  productModel: string;
  sku: string;
  size?: string;
  variants: CatalogProductVariantDto[];
}

export interface CatalogProductVariantDto {
  id: string;
  color: {
    name: string;
    hex: string;
  };
  stock: number;
  thumbnail: string;
  images: string[];
  priceUSD: number;
  priceARS: number | undefined; // Precio en ARS, tomado directamente de la base de datos
}

export interface CatalogDataDto {
  title: string;
  description: string;
  clientName: string;
  logoUrl: string;
  generatedAt: string;
  categories: CatalogCategoryDto[];
  totalProducts: number;
  totalVariants: number;
  dollarBaseValue: number;
  showPrices: boolean; // Mostrar precios en el catálogo
}
