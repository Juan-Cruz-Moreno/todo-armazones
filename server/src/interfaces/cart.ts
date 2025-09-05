import { Types } from 'mongoose';

export interface ICartItem {
  productVariant: Types.ObjectId;
  quantity: number;
  subTotal: number;
}

export interface ICart {
  userId: Types.ObjectId;
  items: ICartItem[];
  subTotal: number;
}
