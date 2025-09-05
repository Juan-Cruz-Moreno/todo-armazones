import { Schema, model, Document, Types } from 'mongoose';
import { IExpense, ExpenseType, Currency } from '@interfaces/expense';

export interface IExpenseDocument extends IExpense, Document {
  _id: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const expenseSchema = new Schema<IExpenseDocument>(
  {
    type: {
      type: String,
      enum: Object.values(ExpenseType),
      required: true,
    },
    description: {
      type: String,
      required: true,
      trim: true,
    },
    amountARS: {
      type: Number,
      required: true,
      min: 0,
    },
    amountUSD: {
      type: Number,
      required: true,
      min: 0,
    },
    currency: {
      type: String,
      enum: Object.values(Currency),
      required: true,
    },
    exchangeRate: {
      type: Number,
      required: false,
      min: 0,
    },
    reference: {
      type: String,
      required: false,
      trim: true,
    },
    stockMovement: {
      type: Schema.Types.ObjectId,
      ref: 'StockMovement',
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
expenseSchema.index({ createdAt: -1 }); // Para ordenar cronológicamente
expenseSchema.index({ type: 1, createdAt: -1 }); // Para filtrar por tipo
expenseSchema.index({ currency: 1, createdAt: -1 }); // Para filtrar por moneda
expenseSchema.index({ stockMovement: 1 }); // Para búsquedas por movimiento de stock

const Expense = model<IExpenseDocument>('Expense', expenseSchema);

export default Expense;
