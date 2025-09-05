import { CreateExpenseRequest, ExpenseListResponse, ExpenseState, IExpense, MonthlyExpenseFilters, UpdateExpenseRequest } from '../../interfaces/expense';
import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import axiosInstance from '../../utils/axiosInstance';
import { ApiResponse, getErrorMessage } from '../../types/api';


// Estado inicial
const initialState: ExpenseState = {
  expenses: [],
  totalExpenses: 0,
  totalAmountARS: 0,
  totalAmountUSD: 0,
  loading: false,
  error: null,
  currentFilters: {
    year: new Date().getFullYear(),
    month: new Date().getMonth() + 1,
    limit: 50,
    offset: 0
  }
};

// Async Thunks
export const fetchMonthlyExpenses = createAsyncThunk<
  ExpenseListResponse,
  MonthlyExpenseFilters,
  { rejectValue: string }
>(
  'expenses/fetchMonthly',
  async (filters, { rejectWithValue }) => {
    try {
      const { year, month, type, currency, limit = 50, offset = 0 } = filters;
      
      // Construir parámetros de query
      const params = new URLSearchParams({
        limit: limit.toString(),
        offset: offset.toString()
      });
      
      if (type) params.append('type', type);
      if (currency) params.append('currency', currency);

      const response = await axiosInstance.get<ApiResponse<ExpenseListResponse>>(
        `/expenses/${year}/${month}?${params.toString()}`
      );

      return response.data.data!;
    } catch (error) {
      return rejectWithValue(getErrorMessage(error));
    }
  }
);

export const createManualExpense = createAsyncThunk<
  IExpense,
  CreateExpenseRequest,
  { rejectValue: string }
>(
  'expenses/createManual',
  async (expenseData, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.post<ApiResponse<IExpense>>(
        '/expenses',
        expenseData
      );

      return response.data.data!;
    } catch (error) {
      return rejectWithValue(getErrorMessage(error));
    }
  }
);

export const updateExpense = createAsyncThunk<
  IExpense,
  { id: string; expenseData: UpdateExpenseRequest },
  { rejectValue: string }
>(
  'expenses/update',
  async ({ id, expenseData }, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.patch<ApiResponse<IExpense>>(
        `/expenses/${id}`,
        expenseData
      );

      return response.data.data!;
    } catch (error) {
      return rejectWithValue(getErrorMessage(error));
    }
  }
);

// Slice
const expenseSlice = createSlice({
  name: 'expenses',
  initialState,
  reducers: {
    setFilters: (state, action: PayloadAction<Partial<MonthlyExpenseFilters>>) => {
      state.currentFilters = { ...state.currentFilters, ...action.payload };
    },
    clearError: (state) => {
      state.error = null;
    },
    resetExpenses: (state) => {
      state.expenses = [];
      state.totalExpenses = 0;
      state.totalAmountARS = 0;
      state.totalAmountUSD = 0;
    }
  },
  extraReducers: (builder) => {
    builder
      // Fetch monthly expenses
      .addCase(fetchMonthlyExpenses.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchMonthlyExpenses.fulfilled, (state, action) => {
        state.loading = false;
        state.expenses = action.payload.expenses;
        state.totalExpenses = action.payload.totalExpenses;
        state.totalAmountARS = action.payload.totalAmountARS;
        state.totalAmountUSD = action.payload.totalAmountUSD;
      })
      .addCase(fetchMonthlyExpenses.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Error al cargar gastos';
      })
      // Create manual expense
      .addCase(createManualExpense.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createManualExpense.fulfilled, (state, action) => {
        state.loading = false;
        // Agregar el nuevo gasto al inicio de la lista si corresponde al período actual
        const newExpense = action.payload;
        const expenseDate = new Date(newExpense.createdAt);
        const currentYear = state.currentFilters.year;
        const currentMonth = state.currentFilters.month;
        
        if (
          expenseDate.getFullYear() === currentYear &&
          expenseDate.getMonth() + 1 === currentMonth
        ) {
          state.expenses.unshift(newExpense);
          state.totalExpenses += 1;
          state.totalAmountARS += newExpense.amountARS;
          state.totalAmountUSD += newExpense.amountUSD;
        }
      })
      .addCase(createManualExpense.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Error al crear gasto';
      })
      // Update expense
      .addCase(updateExpense.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateExpense.fulfilled, (state, action) => {
        state.loading = false;
        const updatedExpense = action.payload;
        // Actualizar el gasto en la lista si existe
        const index = state.expenses.findIndex(expense => expense.id === updatedExpense.id);
        if (index !== -1) {
          // Recalcular totales restando el antiguo y sumando el nuevo
          const oldExpense = state.expenses[index];
          state.totalAmountARS = state.totalAmountARS - oldExpense.amountARS + updatedExpense.amountARS;
          state.totalAmountUSD = state.totalAmountUSD - oldExpense.amountUSD + updatedExpense.amountUSD;
          state.expenses[index] = updatedExpense;
        }
      })
      .addCase(updateExpense.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Error al actualizar gasto';
      });
  }
});

export const { setFilters, clearError, resetExpenses } = expenseSlice.actions;
export default expenseSlice.reducer;
