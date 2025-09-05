import { Currency, ExpenseType, IExpense, UpdateExpenseRequest } from '../../interfaces/expense';
import { SquarePen } from 'lucide-react';
import React, { useState } from 'react';
import { useExpenses } from '../../hooks/useExpenses';

interface ExpenseCardProps {
  expense: IExpense;
}

const ExpenseCard: React.FC<ExpenseCardProps> = ({ expense }) => {
  const { updateExpenseData } = useExpenses();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<UpdateExpenseRequest>({
    description: expense.description,
    amount: expense.currency === Currency.USD ? expense.amountUSD : expense.amountARS,
    currency: expense.currency,
    reference: expense.reference || ''
  });
  const [loading, setLoading] = useState(false);

  const getTypeColor = (type: ExpenseType) => {
    switch (type) {
      case ExpenseType.MANUAL:
        return 'bg-blue-50 text-blue-700 border border-blue-200';
      case ExpenseType.STOCK_DAMAGE:
        return 'bg-orange-50 text-orange-700 border border-orange-200';
      case ExpenseType.STOCK_THEFT:
        return 'bg-red-50 text-red-700 border border-red-200';
      default:
        return 'bg-gray-50 text-gray-700 border border-gray-200';
    }
  };

  const getTypeLabel = (type: ExpenseType) => {
    switch (type) {
      case ExpenseType.MANUAL:
        return 'Manual';
      case ExpenseType.STOCK_DAMAGE:
        return 'Daño Stock';
      case ExpenseType.STOCK_THEFT:
        return 'Robo Stock';
      default:
        return type;
    }
  };

  const formatCurrency = (amount: number, currency: Currency) => {
    if (currency === Currency.ARS) {
      return new Intl.NumberFormat('es-AR', {
        style: 'currency',
        currency: 'ARS'
      }).format(amount);
    } else {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD'
      }).format(amount);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-AR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleEdit = () => {
    if (expense.type !== ExpenseType.MANUAL) {
      alert('Solo se pueden editar gastos manuales');
      return;
    }
    setIsEditing(true);
  };

  const handleCancel = () => {
    setFormData({
      description: expense.description,
      amount: expense.currency === Currency.USD ? expense.amountUSD : expense.amountARS,
      currency: expense.currency,
      reference: expense.reference || ''
    });
    setIsEditing(false);
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'amount' ? parseFloat(value) || 0 : value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const result = await updateExpenseData(expense.id, formData);
      if (result) {
        setIsEditing(false);
      }
    } catch (error) {
      console.error('Error updating expense:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200 hover:shadow-lg transition-shadow">
      <div className="flex justify-between items-start mb-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <span className={`px-3 py-1 rounded-lg text-xs font-medium ${getTypeColor(expense.type)}`}>
              {getTypeLabel(expense.type)}
            </span>
            {expense.reference && (
              <span className="px-2 py-1 bg-gray-50 text-gray-600 border border-gray-200 rounded text-xs">
                {expense.reference}
              </span>
            )}
          </div>
          {!isEditing ? (
            <h3 className="text-lg font-semibold text-gray-800 mb-2">
              {expense.description}
            </h3>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-800 mb-1">
                  Descripción
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                  disabled={loading}
                />
              </div>
            </form>
          )}
        </div>
        {!isEditing && expense.type === ExpenseType.MANUAL && (
          <button
            onClick={handleEdit}
            className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
            title="Editar gasto"
          >
            <SquarePen size={18} />
          </button>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4 mb-4">
        {!isEditing ? (
          <>
            <div>
              <p className="text-sm text-gray-500">Monto Original</p>
              <p className="text-lg font-semibold text-gray-800">
                {formatCurrency(
                  expense.currency === Currency.USD ? expense.amountUSD : expense.amountARS,
                  expense.currency
                )}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500">
                {expense.currency === Currency.USD ? 'Equivalente ARS' : 'Equivalente USD'}
              </p>
              <p className="text-lg font-medium text-gray-700">
                {expense.currency === Currency.USD 
                  ? formatCurrency(expense.amountARS, Currency.ARS)
                  : formatCurrency(expense.amountUSD, Currency.USD)
                }
              </p>
            </div>
          </>
        ) : (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-800 mb-1">
                Monto
              </label>
              <input
                type="number"
                name="amount"
                value={formData.amount || ''}
                onChange={handleInputChange}
                step="0.01"
                min="0"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                disabled={loading}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-800 mb-1">
                Moneda
              </label>
              <select
                name="currency"
                value={formData.currency}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                disabled={loading}
              >
                <option value={Currency.USD}>USD ($)</option>
                <option value={Currency.ARS}>ARS ($)</option>
              </select>
            </div>
          </>
        )}
      </div>

      {expense.exchangeRate && !isEditing && (
        <div className="mb-4">
          <p className="text-sm text-gray-500">Tasa de Cambio</p>
          <p className="text-sm font-medium text-gray-700">
            1 USD = ${expense.exchangeRate.toLocaleString('es-AR')} ARS
          </p>
        </div>
      )}

      {isEditing && (
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-800 mb-1">
            Referencia (opcional)
          </label>
          <input
            type="text"
            name="reference"
            value={formData.reference}
            onChange={handleInputChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
            placeholder="FACT-001, REF-123, etc."
            disabled={loading}
          />
        </div>
      )}

      {expense.stockMovement && !isEditing && (
        <div className="mb-4 p-3 bg-gray-50 border border-gray-200 rounded-lg">
          <p className="text-sm text-gray-500 mb-1">Movimiento de Stock Relacionado</p>
          <p className="text-sm font-medium text-gray-700">
            {expense.stockMovement.type} - {expense.stockMovement.reason}
          </p>
        </div>
      )}

      {isEditing && (
        <div className="flex justify-end space-x-3 pt-4">
          <button
            type="button"
            onClick={handleCancel}
            className="px-4 py-2 text-gray-700 bg-gray-50 border border-gray-200 rounded-md hover:bg-gray-100 transition-colors"
            disabled={loading}
          >
            Cancelar
          </button>
          <button
            type="submit"
            onClick={handleSubmit}
            className="px-4 py-2 bg-blue-50 border border-blue-200 text-blue-700 rounded-md hover:bg-blue-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
            disabled={loading}
          >
            {loading && (
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-blue-700" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            )}
            {loading ? 'Guardando...' : 'Guardar'}
          </button>
        </div>
      )}

      <div className="flex justify-between items-center text-sm text-gray-500">
        <div>
          {expense.createdBy && (
            <p>Creado por: {expense.createdBy.email}</p>
          )}
        </div>
        <div>
          <p>{formatDate(expense.createdAt)}</p>
        </div>
      </div>
    </div>
  );
};

export default ExpenseCard;
