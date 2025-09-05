export enum ExpenseType {
  MANUAL = 'MANUAL',
  STOCK_DAMAGE = 'STOCK_DAMAGE',
  STOCK_THEFT = 'STOCK_THEFT'
}

export enum Currency {
  ARS = 'ARS',
  USD = 'USD'
}

export interface IExpense {
  id: string;
  type: ExpenseType;
  description: string;
  amountARS: number;
  amountUSD: number;
  currency: Currency;
  exchangeRate?: number;
  reference?: string;
  stockMovement?: {
    id: string;
    type: string;
    reason: string;
  };
  createdBy?: {
    id: string;
    displayName: string;
    email: string;
  };
  createdAt: string;
}

export interface CreateExpenseRequest {
  description: string;
  amount: number;
  currency: Currency;
  reference?: string;
}

export interface UpdateExpenseRequest {
  description?: string;
  amount?: number;
  currency?: Currency;
  reference?: string;
}

export interface ExpenseListResponse {
  expenses: IExpense[];
  totalExpenses: number;
  totalAmountARS: number;
  totalAmountUSD: number;
}

export interface MonthlyExpenseFilters {
  year: number;
  month: number;
  type?: ExpenseType;
  currency?: Currency;
  limit?: number;
  offset?: number;
}

export interface ExpenseState {
  expenses: IExpense[];
  totalExpenses: number;
  totalAmountARS: number;
  totalAmountUSD: number;
  loading: boolean;
  error: string | null;
  currentFilters: MonthlyExpenseFilters;
}
