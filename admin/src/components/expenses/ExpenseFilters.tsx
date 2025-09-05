import { Currency, ExpenseType } from '../../interfaces/expense';
import React from 'react';

interface ExpenseFiltersProps {
  currentYear: number;
  currentMonth: number;
  selectedType?: ExpenseType;
  selectedCurrency?: Currency;
  onYearChange: (year: number) => void;
  onMonthChange: (month: number) => void;
  onTypeChange: (type?: ExpenseType) => void;
  onCurrencyChange: (currency?: Currency) => void;
  onReset: () => void;
}

const ExpenseFilters: React.FC<ExpenseFiltersProps> = ({
  currentYear,
  currentMonth,
  selectedType,
  selectedCurrency,
  onYearChange,
  onMonthChange,
  onTypeChange,
  onCurrencyChange,
  onReset
}) => {
  const currentDate = new Date();
  const years = Array.from(
    { length: 5 }, 
    (_, i) => currentDate.getFullYear() - i
  );

  const months = [
    { value: 1, label: 'Enero' },
    { value: 2, label: 'Febrero' },
    { value: 3, label: 'Marzo' },
    { value: 4, label: 'Abril' },
    { value: 5, label: 'Mayo' },
    { value: 6, label: 'Junio' },
    { value: 7, label: 'Julio' },
    { value: 8, label: 'Agosto' },
    { value: 9, label: 'Septiembre' },
    { value: 10, label: 'Octubre' },
    { value: 11, label: 'Noviembre' },
    { value: 12, label: 'Diciembre' }
  ];

  const expenseTypes = [
    { value: ExpenseType.MANUAL, label: 'Manual' },
    { value: ExpenseType.STOCK_DAMAGE, label: 'Daño Stock' },
    { value: ExpenseType.STOCK_THEFT, label: 'Robo Stock' }
  ];

  const currencies = [
    { value: Currency.USD, label: 'USD' },
    { value: Currency.ARS, label: 'ARS' }
  ];

  return (
    <div className="bg-white rounded-lg shadow-md p-6 mb-6">
      <div className="flex flex-wrap items-center gap-4">
        {/* Year Selection */}
        <div className="flex flex-col">
          <label className="text-sm font-medium text-gray-800 mb-1">Año</label>
          <select
            value={currentYear}
            onChange={(e) => onYearChange(parseInt(e.target.value))}
            className="px-3 py-2 border border-blue-200 bg-blue-50 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white text-gray-900"
          >
            {years.map(year => (
              <option key={year} value={year}>{year}</option>
            ))}
          </select>
        </div>

        {/* Month Selection */}
        <div className="flex flex-col">
          <label className="text-sm font-medium text-gray-800 mb-1">Mes</label>
          <select
            value={currentMonth}
            onChange={(e) => onMonthChange(parseInt(e.target.value))}
            className="px-3 py-2 border border-blue-200 bg-blue-50 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white text-gray-900"
          >
            {months.map(month => (
              <option key={month.value} value={month.value}>
                {month.label}
              </option>
            ))}
          </select>
        </div>

        {/* Type Filter */}
        <div className="flex flex-col">
          <label className="text-sm font-medium text-gray-800 mb-1">Tipo</label>
          <select
            value={selectedType || ''}
            onChange={(e) => onTypeChange(e.target.value as ExpenseType || undefined)}
            className="px-3 py-2 border border-blue-200 bg-blue-50 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white text-gray-900"
          >
            <option value="">Todos</option>
            {expenseTypes.map(type => (
              <option key={type.value} value={type.value}>
                {type.label}
              </option>
            ))}
          </select>
        </div>

        {/* Currency Filter */}
        <div className="flex flex-col">
          <label className="text-sm font-medium text-gray-800 mb-1">Moneda</label>
          <select
            value={selectedCurrency || ''}
            onChange={(e) => onCurrencyChange(e.target.value as Currency || undefined)}
            className="px-3 py-2 border border-blue-200 bg-blue-50 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white text-gray-900"
          >
            <option value="">Todas</option>
            {currencies.map(currency => (
              <option key={currency.value} value={currency.value}>
                {currency.label}
              </option>
            ))}
          </select>
        </div>

        {/* Reset Button */}
        <div className="flex flex-col justify-end">
          <button
            onClick={onReset}
            className="px-4 py-2 text-blue-700 bg-blue-50 border border-blue-200 rounded-md hover:bg-blue-100 transition-colors"
          >
            Resetear
          </button>
        </div>
      </div>
    </div>
  );
};

export default ExpenseFilters;
