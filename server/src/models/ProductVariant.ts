import { Schema, model, Document, Types } from 'mongoose';
import { IProductVariant } from '@interfaces/productVariant';
import { IProductDocument } from './Product';

export interface IProductVariantDocument extends IProductVariant, Document {
  _id: Types.ObjectId;
}

// Interfaz para ProductVariant cuando el product está populado
export interface IProductVariantPopulated extends Omit<IProductVariantDocument, 'product'> {
  product: IProductDocument;
}

const colorSchema = new Schema(
  {
    name: { type: String, required: true },
    hex: { type: String, required: true },
  },
  { _id: false },
);

const productVariantSchema = new Schema<IProductVariantDocument>(
  {
    product: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
    color: { type: colorSchema, required: true },
    stock: { type: Number, required: true },
    averageCostUSD: { type: Number, required: true, min: 0 },
    priceUSD: { type: Number, required: true, min: 0 },
    thumbnail: { type: String, required: true },
    images: [{ type: String }],
  },
  { timestamps: true },
);

const ProductVariant = model<IProductVariantDocument>('ProductVariant', productVariantSchema);

export default ProductVariant;
