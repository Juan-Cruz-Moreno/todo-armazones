import { Types } from 'mongoose';

export interface ISubcategory {
  slug: string;
  name: string;
  title: string;
  description: string;
  image: string;
  category: Types.ObjectId[]; // Referencia a la categoría padre
}
