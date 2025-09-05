import React, { useState, useEffect, useRef } from 'react';
import { CreateExpenseRequest, Currency } from '../../interfaces/expense';
import { useExpenses } from '../../hooks/useExpenses';

interface CreateExpenseFormProps {
  onExpenseCreated: () => void;
}

const CreateExpenseForm: React.FC<CreateExpenseFormProps> = ({
  onExpenseCreated
}) => {
  const { createExpense, loading } = useExpenses();
  const formRef = useRef<HTMLDivElement>(null);
  
  const [formData, setFormData] = useState<CreateExpenseRequest>({
    description: '',
    amount: 0,
    currency: Currency.USD,
    reference: ''
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  // Scroll to form when component mounts
  useEffect(() => {
    if (formRef.current) {
      formRef.current.scrollIntoView({ 
        behavior: 'smooth', 
        block: 'start' 
      });
    }
  }, []);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev: CreateExpenseRequest) => ({
      ...prev,
      [name]: name === 'amount' ? parseFloat(value) || 0 : value
    }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.description.trim()) {
      newErrors.description = 'La descripción es obligatoria';
    }

    if (formData.amount <= 0) {
      newErrors.amount = 'El monto debe ser mayor a 0';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    try {
      const result = await createExpense({
        ...formData,
        reference: formData.reference || undefined
      });
      
      if (result) {
        // Reset form
        setFormData({
          description: '',
          amount: 0,
          currency: Currency.USD,
          reference: ''
        });
        setErrors({});
        onExpenseCreated();
      }
    } catch (error) {
      console.error('Error creating expense:', error);
    }
  };

  const handleCancel = () => {
    setFormData({
      description: '',
      amount: 0,
      currency: Currency.USD,
      reference: ''
    });
    setErrors({});
    onExpenseCreated();
  };

  return (
    <div ref={formRef} className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-800">Crear Gasto Manual</h3>
        <button
          onClick={handleCancel}
          className="text-gray-500 hover:text-gray-700"
          disabled={loading}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="description" className="block text-sm font-medium text-gray-800 mb-1">
            Descripción *
          </label>
          <textarea
            id="description"
            name="description"
            value={formData.description}
            onChange={handleInputChange}
            rows={3}
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 ${
              errors.description ? 'border-red-300' : 'border-gray-300'
            }`}
            placeholder="Describe el gasto..."
            disabled={loading}
          />
          {errors.description && (
            <p className="text-red-600 text-xs mt-1">{errors.description}</p>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="amount" className="block text-sm font-medium text-gray-800 mb-1">
              Monto *
            </label>
            <input
              type="number"
              id="amount"
              name="amount"
              value={formData.amount || ''}
              onChange={handleInputChange}
              step="0.01"
              min="0"
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 ${
                errors.amount ? 'border-red-300' : 'border-gray-300'
              }`}
              placeholder="0.00"
              disabled={loading}
            />
            {errors.amount && (
              <p className="text-red-600 text-xs mt-1">{errors.amount}</p>
            )}
          </div>

          <div>
            <label htmlFor="currency" className="block text-sm font-medium text-gray-800 mb-1">
              Moneda *
            </label>
            <select
              id="currency"
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
        </div>

        <div>
          <label htmlFor="reference" className="block text-sm font-medium text-gray-800 mb-1">
            Referencia (opcional)
          </label>
          <input
            type="text"
            id="reference"
            name="reference"
            value={formData.reference}
            onChange={handleInputChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
            placeholder="FACT-001, REF-123, etc."
            disabled={loading}
          />
        </div>

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
            className="px-4 py-2 bg-green-50 border border-green-200 text-green-700 rounded-md hover:bg-green-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
            disabled={loading}
          >
            {loading && (
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-green-700" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            )}
            {loading ? 'Creando...' : 'Crear Gasto'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default CreateExpenseForm;
