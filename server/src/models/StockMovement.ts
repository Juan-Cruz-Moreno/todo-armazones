import { Schema, model, Document, Types } from 'mongoose';
import { IStockMovement, StockMovementType, StockMovementReason } from '@interfaces/stockMovement';

export interface IStockMovementDocument extends IStockMovement, Document {
  _id: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const stockMovementSchema = new Schema<IStockMovementDocument>(
  {
    productVariant: {
      type: Schema.Types.ObjectId,
      ref: 'ProductVariant',
      required: true,
    },
    type: {
      type: String,
      enum: Object.values(StockMovementType),
      required: true,
    },
    reason: {
      type: String,
      enum: Object.values(StockMovementReason),
      required: true,
    },
    quantity: {
      type: Number,
      required: true,
      // No restricción de min para permitir valores negativos en salidas
    },
    unitCost: {
      type: Number,
      required: true,
      min: 0,
    },
    totalCost: {
      type: Number,
      required: true,
      // No restricción de min para permitir valores negativos en salidas
    },
    previousStock: {
      type: Number,
      required: true,
      min: 0,
    },
    newStock: {
      type: Number,
      required: true,
      min: 0,
    },
    previousAvgCost: {
      type: Number,
      required: true,
      min: 0,
    },
    newAvgCost: {
      type: Number,
      required: true,
      min: 0,
    },
    reference: {
      type: String,
      required: false,
    },
    notes: {
      type: String,
      required: false,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: false,
    },
  },
  { timestamps: true },
);

// Índices para optimizar consultas
stockMovementSchema.index({ productVariant: 1, createdAt: -1 }); // Para consultar historial por variante
stockMovementSchema.index({ type: 1, createdAt: -1 }); // Para filtrar por tipo de movimiento
stockMovementSchema.index({ createdAt: -1 }); // Para ordenar cronológicamente

const StockMovement = model<IStockMovementDocument>('StockMovement', stockMovementSchema);

export default StockMovement;
