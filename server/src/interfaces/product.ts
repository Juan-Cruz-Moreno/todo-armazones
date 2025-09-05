import { Types } from 'mongoose';

export interface IProduct {
  slug: string;
  thumbnail: string;
  primaryImage: string;
  category: Types.ObjectId[];
  subcategory: Types.ObjectId;
  productModel: string;
  sku: string;
  size?: string;
}
