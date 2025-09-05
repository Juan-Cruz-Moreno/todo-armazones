// Color de una variante
interface Color {
  name: string;
  hex: string;
}

// Producto (usado en GET /cart)
interface Product {
  _id: string;
  slug: string;
  thumbnail: string;
  primaryImage: string;
  category: string[];
  subcategory: string;
  productModel: string;
  sku: string;
  size: string;
  costUSD: number;
  priceUSD: number;
  createdAt: string;
  updatedAt: string;
}

// Variante de producto (usado en GET /cart)
interface ProductVariant {
  _id: string;
  product: Product;
  color: Color;
  stock: number;
  thumbnail: string;
  images: string[];
  __v: number;
  createdAt: string;
  updatedAt: string;
}

// Ítem dentro del carrito (productVariant siempre es el objeto completo en respuestas del backend)
interface CartItem {
  productVariant: ProductVariant;
  quantity: number;
  subTotal: number;
}

// Carrito completo
export interface Cart {
  _id: string;
  userId: string;
  items: CartItem[];
  subTotal: number;
  createdAt: string;
  updatedAt: string;
  __v: number;
}

export interface AddItemToCartPayload {
  productVariantId: string;
  quantity: number;
}

export interface UpdateCartItemPayload {
  productVariantId: string;
}
