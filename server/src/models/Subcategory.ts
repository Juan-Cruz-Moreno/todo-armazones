import { ISubcategory } from '@interfaces/subcategory';
import { Schema, model, Document, Types } from 'mongoose';

export interface ISubcategoryDocument extends ISubcategory, Document {
  _id: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const subcategorySchema = new Schema<ISubcategoryDocument>(
  {
    slug: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    title: { type: String, required: true },
    description: { type: String, required: true },
    image: { type: String, required: true },
    category: [{ type: Schema.Types.ObjectId, ref: 'Category', required: true }],
  },
  { timestamps: true },
);

const Subcategory = model<ISubcategoryDocument>('Subcategory', subcategorySchema);

export default Subcategory;
