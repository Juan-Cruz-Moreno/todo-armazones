import { useSelector, useDispatch } from 'react-redux';
import { useCallback } from 'react';
import { RootState, AppDispatch } from '../redux/store';
import {
  fetchMonthlyExpenses,
  createManualExpense,
  updateExpense,
  setFilters,
  clearError,
  resetExpenses
} from '../redux/slices/expenseSlice';
import { 
  CreateExpenseRequest, 
  MonthlyExpenseFilters,
  IExpense,
  UpdateExpenseRequest
} from '../interfaces/expense';

export const useExpenses = () => {
  const dispatch = useDispatch<AppDispatch>();
  const {
    expenses,
    totalExpenses,
    totalAmountARS,
    totalAmountUSD,
    loading,
    error,
    currentFilters
  } = useSelector((state: RootState) => state.expenses);

  // Obtener gastos mensuales
  const getMonthlyExpenses = useCallback(
    (filters?: Partial<MonthlyExpenseFilters>) => {
      const finalFilters = filters 
        ? { ...currentFilters, ...filters }
        : currentFilters;
      
      dispatch(fetchMonthlyExpenses(finalFilters));
    },
    [dispatch, currentFilters]
  );

  // Crear gasto manual
  const createExpense = useCallback(
    async (expenseData: CreateExpenseRequest): Promise<IExpense | null> => {
      try {
        const result = await dispatch(createManualExpense(expenseData));
        if (createManualExpense.fulfilled.match(result)) {
          return result.payload;
        }
        return null;
      } catch (error) {
        console.error('Error creating expense:', error);
        return null;
      }
    },
    [dispatch]
  );

  // Actualizar gasto
  const updateExpenseData = useCallback(
    async (id: string, expenseData: UpdateExpenseRequest): Promise<IExpense | null> => {
      try {
        const result = await dispatch(updateExpense({ id, expenseData }));
        if (updateExpense.fulfilled.match(result)) {
          return result.payload;
        }
        return null;
      } catch (error) {
        console.error('Error updating expense:', error);
        return null;
      }
    },
    [dispatch]
  );

  // Actualizar filtros
  const updateFilters = useCallback(
    (filters: Partial<MonthlyExpenseFilters>) => {
      dispatch(setFilters(filters));
    },
    [dispatch]
  );

  // Limpiar error
  const clearErrorMessage = useCallback(() => {
    dispatch(clearError());
  }, [dispatch]);

  // Reset expenses
  const clearExpenses = useCallback(() => {
    dispatch(resetExpenses());
  }, [dispatch]);

  // Cambiar mes
  const changeMonth = useCallback(
    (year: number, month: number) => {
      const newFilters = { ...currentFilters, year, month, offset: 0 };
      dispatch(setFilters(newFilters));
      dispatch(fetchMonthlyExpenses(newFilters));
    },
    [dispatch, currentFilters]
  );

  // Aplicar filtros y recargar
  const applyFilters = useCallback(
    (filters: Partial<MonthlyExpenseFilters>) => {
      const newFilters = { ...currentFilters, ...filters, offset: 0 };
      dispatch(setFilters(newFilters));
      dispatch(fetchMonthlyExpenses(newFilters));
    },
    [dispatch, currentFilters]
  );

  // Cargar más (paginación)
  const loadMore = useCallback(() => {
    if (!loading && expenses.length < totalExpenses) {
      const newFilters = {
        ...currentFilters,
        offset: expenses.length
      };
      dispatch(fetchMonthlyExpenses(newFilters));
    }
  }, [dispatch, currentFilters, loading, expenses.length, totalExpenses]);

  return {
    // Data
    expenses,
    totalExpenses,
    totalAmountARS,
    totalAmountUSD,
    currentFilters,
    
    // Status
    loading,
    error,
    hasMore: expenses.length < totalExpenses,
    
    // Actions
    getMonthlyExpenses,
    createExpense,
    updateExpenseData,
    updateFilters,
    clearErrorMessage,
    clearExpenses,
    changeMonth,
    applyFilters,
    loadMore
  };
};
