import { Schema, model, Document } from 'mongoose';
import { Counter } from '@interfaces/counter';

export interface ICounterDocument extends Counter, Document {}

const counterSchema = new Schema<ICounterDocument>(
  {
    name: { type: String, required: true, unique: true },
    seq: { type: Number, required: true, default: 0 },
  },
  {
    timestamps: true,
  },
);

export const CounterModel = model<ICounterDocument>('Counter', counterSchema);

export default CounterModel;
