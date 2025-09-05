'use client';

import React, { useEffect, useState } from 'react';
import { useExpenses } from '../../hooks/useExpenses';
import { ExpenseType, Currency, IExpense } from '../../interfaces/expense';
import ExpenseCard from '../../components/expenses/ExpenseCard';
import CreateExpenseForm from '../../components/expenses/CreateExpenseForm';
import ExpenseFilters from '../../components/expenses/ExpenseFilters';
import ExpenseSummary from '../../components/expenses/ExpenseSummary';

const ExpensesPage: React.FC = () => {
  const {
    expenses,
    totalExpenses,
    totalAmountARS,
    totalAmountUSD,
    currentFilters,
    loading,
    error,
    hasMore,
    getMonthlyExpenses,
    clearErrorMessage,
    changeMonth,
    applyFilters,
    loadMore
  } = useExpenses();

  const [showCreateForm, setShowCreateForm] = useState(false);

  // Load initial data
  useEffect(() => {
    getMonthlyExpenses();
  }, [getMonthlyExpenses]);

  // Handle filter changes
  const handleFilterChange = (filterType: string, value: string | number | ExpenseType | Currency | undefined) => {
    const newFilters: Partial<{ type: ExpenseType; currency: Currency }> = {};
    
    if (filterType === 'year' || filterType === 'month') {
      const year = filterType === 'year' ? value as number : currentFilters.year;
      const month = filterType === 'month' ? value as number : currentFilters.month;
      changeMonth(year, month);
    } else {
      if (filterType === 'type') {
        newFilters.type = value as ExpenseType;
      } else if (filterType === 'currency') {
        newFilters.currency = value as Currency;
      }
      applyFilters(newFilters);
    }
  };

  // Reset filters
  const handleResetFilters = () => {
    const currentDate = new Date();
    changeMonth(currentDate.getFullYear(), currentDate.getMonth() + 1);
    applyFilters({
      type: undefined,
      currency: undefined
    });
  };

  // Get current month name
  const getCurrentMonthName = () => {
    const monthNames = [
      'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
      'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
    ];
    return monthNames[currentFilters.month - 1];
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-semibold text-gray-800">Gestión de Gastos</h1>
            <p className="text-gray-600 mt-1">
              Gastos de {getCurrentMonthName()} {currentFilters.year}
            </p>
          </div>
          <button
            onClick={() => setShowCreateForm(true)}
            className="flex items-center justify-center px-4 py-3 bg-blue-50 border border-blue-200 rounded-lg text-blue-700 hover:bg-blue-100 transition-colors"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Gasto
          </button>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="flex">
              <svg className="w-5 h-5 text-red-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="text-sm text-red-700">{error}</span>
            </div>
            <button
              onClick={clearErrorMessage}
              className="text-red-400 hover:text-red-600"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* Filters */}
      <ExpenseFilters
        currentYear={currentFilters.year}
        currentMonth={currentFilters.month}
        selectedType={currentFilters.type}
        selectedCurrency={currentFilters.currency}
        onYearChange={(year: number) => handleFilterChange('year', year)}
        onMonthChange={(month: number) => handleFilterChange('month', month)}
        onTypeChange={(type?: ExpenseType) => handleFilterChange('type', type)}
        onCurrencyChange={(currency?: Currency) => handleFilterChange('currency', currency)}
        onReset={handleResetFilters}
      />

      {/* Summary */}
      <ExpenseSummary
        totalExpenses={totalExpenses}
        totalAmountARS={totalAmountARS}
        totalAmountUSD={totalAmountUSD}
        loading={loading && expenses.length === 0}
      />

      {/* Expenses List */}
      <div className="space-y-4">
        {loading && expenses.length === 0 ? (
          // Loading skeleton
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white rounded-lg shadow-md p-6 animate-pulse">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <div className="h-4 bg-gray-200 rounded w-1/4 mb-2"></div>
                    <div className="h-6 bg-gray-200 rounded w-3/4 mb-2"></div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <div className="h-4 bg-gray-200 rounded w-1/2 mb-1"></div>
                    <div className="h-6 bg-gray-200 rounded w-3/4"></div>
                  </div>
                  <div>
                    <div className="h-4 bg-gray-200 rounded w-1/2 mb-1"></div>
                    <div className="h-6 bg-gray-200 rounded w-3/4"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : expenses.length === 0 ? (
          // Empty state
          <div className="bg-gray-50 rounded-lg p-8 text-center">
            <svg
              className="mx-auto h-12 w-12 text-gray-400 mb-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No hay gastos</h3>
            <p className="text-gray-600 mb-6">
              No se encontraron gastos para el período seleccionado.
            </p>
            <button
              onClick={() => setShowCreateForm(true)}
              className="inline-flex items-center px-4 py-2 bg-blue-50 border border-blue-200 rounded-lg text-blue-700 hover:bg-blue-100 transition-colors"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Crear primer gasto
            </button>
          </div>
        ) : (
          // Expenses grid
          <>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {expenses.map((expense: IExpense) => (
                <ExpenseCard key={expense.id} expense={expense} />
              ))}
            </div>

            {/* Load More Button */}
            {hasMore && (
              <div className="text-center mt-6">
                <button
                  onClick={loadMore}
                  disabled={loading}
                  className="bg-gray-50 hover:bg-gray-100 text-gray-700 px-6 py-3 rounded-lg border border-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center mx-auto"
                >
                  {loading && (
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-gray-700" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                  )}
                  {loading ? 'Cargando...' : 'Cargar más'}
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Create Expense Form */}
      {showCreateForm && (
        <CreateExpenseForm onExpenseCreated={() => setShowCreateForm(false)} />
      )}
    </div>
  );
};

export default ExpensesPage;