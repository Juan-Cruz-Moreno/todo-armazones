import { ICategory } from '@interfaces/category';
import { Schema, model, Document, Types } from 'mongoose';

// Interfaz que extiende Document para incluir las propiedades de ICategory
export interface ICategoryDocument extends ICategory, Document {
  _id: Types.ObjectId; // Mongoose ObjectId
  createdAt: Date; // Fecha de creación
  updatedAt: Date; // Fecha de actualización
}

// Definición del esquema de Mongoose correspondiente a ICategory
const categorySchema = new Schema<ICategoryDocument>(
  {
    slug: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    title: { type: String, required: true },
    description: { type: String, required: true },
    image: { type: String, required: true },
  },
  {
    timestamps: true, // Agrega campos createdAt y updatedAt automáticamente
  },
);

// Creación del modelo de Mongoose
const Category = model<ICategoryDocument>('Category', categorySchema);

export default Category;
