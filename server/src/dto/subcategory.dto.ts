import { Types } from 'mongoose';

// DTO para la creación de una subcategoría
export interface CreateSubcategoryRequestDto {
  readonly slug: string;
  readonly name: string;
  readonly title: string;
  readonly description: string;
  readonly image: string;
  readonly category: Types.ObjectId[];
}

// DTO para la respuesta de la creación de una subcategoría
export interface CreateSubcategoryResponseDTO {
  readonly id: string;
  readonly slug: string;
  readonly name: string;
  readonly title: string;
  readonly description: string;
  readonly image: string;
  readonly category: Types.ObjectId[];
  readonly createdAt: Date;
  readonly updatedAt: Date;
}
