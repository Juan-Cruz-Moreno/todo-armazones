import { Types } from 'mongoose';

export enum ExpenseType {
  MANUAL = 'MANUAL', // Gasto manual registrado
  STOCK_DAMAGE = 'STOCK_DAMAGE', // Gasto por daño de stock
  STOCK_THEFT = 'STOCK_THEFT', // Gasto por robo de stock
}

export enum Currency {
  ARS = 'ARS', // Pesos argentinos
  USD = 'USD', // Dólares estadounidenses
}

export interface IExpense {
  type: ExpenseType;
  description: string;
  amountARS: number; // Monto en pesos argentinos
  amountUSD: number; // Monto en dólares estadounidenses
  currency: Currency; // Moneda original del gasto
  exchangeRate?: number; // Tasa de cambio utilizada (si aplica)
  reference?: string; // Referencia externa
  stockMovement?: Types.ObjectId; // Referencia al movimiento de stock (si aplica)
  createdBy?: Types.ObjectId; // Usuario que registró el gasto
}
