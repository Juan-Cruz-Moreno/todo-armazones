import { Types } from 'mongoose';

export interface AddItemToCartRequestDto {
  productVariantId: Types.ObjectId;
  quantity?: number;
}

export interface IncrementItemQuantityRequestDto {
  productVariantId: Types.ObjectId;
}

export interface DecrementItemQuantityRequestDto {
  productVariantId: Types.ObjectId;
}

export interface RemoveItemFromCartRequestDto {
  productVariantId: Types.ObjectId;
}
