import { Types } from 'mongoose';

export interface IProduct {
  slug: string;
  thumbnail: string;
  primaryImage: string[];
  category: Types.ObjectId[];
  subcategory: Types.ObjectId;
  productModel: string;
  sku: string;
  code: string;
  size: string;
  description?: string;
  deleted?: boolean;
}
