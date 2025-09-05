import { IProduct } from '@interfaces/product';
import { Schema, model, Document, Types } from 'mongoose';

// Interfaz que extiende Document para incluir las propiedades de IProduct
export interface IProductDocument extends IProduct, Document {
  _id: Types.ObjectId; // ID único del producto
  createdAt: Date; // Fecha de creación del producto
}

// Definición del esquema de Mongoose correspondiente a IProduct
const productSchema = new Schema<IProductDocument>(
  {
    slug: { type: String, required: true, unique: true },
    thumbnail: { type: String, required: true },
    primaryImage: { type: String, required: true },
    category: [{ type: Schema.Types.ObjectId, ref: 'Category', required: true }],
    subcategory: {
      type: Schema.Types.ObjectId,
      ref: 'Subcategory',
      required: true,
    },
    productModel: { type: String, required: true },
    sku: { type: String, required: true, unique: true },
    size: { type: String, required: false },
  },
  { timestamps: true },
);

// Índices para mejorar la búsqueda
productSchema.index({ productModel: 'text', sku: 'text' }); // Índice de texto para búsqueda por modelo de producto y SKU

productSchema.index({ category: 1 }); // Índice para categoría

productSchema.index({ category: 1, subcategory: 1 }); // Índice compuesto para categoría y subcategoría

// Creación del modelo de Mongoose
const Product = model<IProductDocument>('Product', productSchema);

export default Product;
