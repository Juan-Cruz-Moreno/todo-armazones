import { IMaintenance } from '@interfaces/maintenance';
import { Schema, model, Document, Types } from 'mongoose';

// Interfaz que extiende Document para incluir las propiedades de IMaintenance
export interface IMaintenanceDocument extends IMaintenance, Document {
  _id: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

// Definición del esquema de Mongoose correspondiente a IMaintenance
const maintenanceSchema = new Schema<IMaintenanceDocument>(
  {
    active: { type: Boolean, required: true, default: false },
    image: { type: Number, required: true, default: 1, min: 1 },
    title: { type: String, required: false },
    subtitle: { type: String, required: false },
  },
  {
    timestamps: true, // Agrega campos createdAt y updatedAt automáticamente
  },
);

// Creación del modelo de Mongoose
const Maintenance = model<IMaintenanceDocument>('Maintenance', maintenanceSchema);

export default Maintenance;
