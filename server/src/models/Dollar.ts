import { IDollar } from '@interfaces/dollar';
import { Schema, model, Document } from 'mongoose';

export interface IDollarDocument extends IDollar, Document {}

const dollarSchema = new Schema<IDollarDocument>(
  {
    baseValue: { type: Number, required: true, default: 0 },
    value: { type: Number, required: true, default: 0 },
    addedValue: { type: Number, min: 0, required: true },
    isPercentage: { type: Boolean, required: true },
    source: { type: String, enum: ['bluelytics', 'dolarapi'], required: true },
    apiUpdatedAt: { type: Date, required: true },
  },
  {
    timestamps: true,
  },
);

dollarSchema.index({}, { unique: true }); // Solo se permite un registro

const Dollar = model<IDollarDocument>('Dollar', dollarSchema);

export default Dollar;
