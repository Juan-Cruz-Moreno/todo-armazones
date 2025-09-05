import React, { useState } from 'react';
import { Calendar, Clock, BarChart3, TrendingUp } from 'lucide-react';
import { AnalyticsPeriod, AnalyticsGranularity } from '@/enums/analytics.enum';
import { AnalyticsFilters } from '@/interfaces/analytics';

interface AnalyticsFiltersProps {
  filters: AnalyticsFilters;
  onPeriodChange: (period: AnalyticsPeriod) => void;
  onGranularityChange: (granularity: AnalyticsGranularity) => void;
  onDateRangeChange: (startDate: string, endDate: string) => void;
  onComparisonToggle: () => void;
  isLoading?: boolean;
}

const AnalyticsFiltersComponent: React.FC<AnalyticsFiltersProps> = ({
  filters,
  onPeriodChange,
  onGranularityChange,
  onDateRangeChange,
  onComparisonToggle,
  isLoading = false,
}) => {
  // Función para obtener fechas por defecto para período custom (últimos 30 días)
  const getDefaultCustomDates = () => {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 30); // 30 días atrás
    
    return {
      startDate: startDate.toISOString().split('T')[0],
      endDate: endDate.toISOString().split('T')[0],
    };
  };

  const defaultDates = getDefaultCustomDates();
  
  const [customStartDate, setCustomStartDate] = useState(
    filters.customRange?.startDate || defaultDates.startDate
  );
  const [customEndDate, setCustomEndDate] = useState(
    filters.customRange?.endDate || defaultDates.endDate
  );

  const handlePeriodChange = (period: AnalyticsPeriod) => {
    onPeriodChange(period);
    
    // Si se selecciona Custom y no hay fechas en los filtros, aplicar fechas por defecto
    if (period === AnalyticsPeriod.Custom && !filters.customRange) {
      const defaultDates = getDefaultCustomDates();
      setCustomStartDate(defaultDates.startDate);
      setCustomEndDate(defaultDates.endDate);
      // Auto-aplicar las fechas por defecto
      onDateRangeChange(defaultDates.startDate, defaultDates.endDate);
    }
  };

  const periodOptions = [
    { value: AnalyticsPeriod.Today, label: 'Hoy' },
    { value: AnalyticsPeriod.ThisWeek, label: 'Esta Semana' },
    { value: AnalyticsPeriod.ThisMonth, label: 'Este Mes' },
    { value: AnalyticsPeriod.ThisYear, label: 'Este Año' },
    { value: AnalyticsPeriod.Custom, label: 'Personalizado' },
  ];

  const granularityOptions = [
    { value: AnalyticsGranularity.Hour, label: 'Por Hora', icon: Clock },
    { value: AnalyticsGranularity.Day, label: 'Por Día', icon: Calendar },
    { value: AnalyticsGranularity.Week, label: 'Por Semana', icon: BarChart3 },
    { value: AnalyticsGranularity.Month, label: 'Por Mes', icon: TrendingUp },
  ];

  const handleCustomDateChange = () => {
    if (customStartDate && customEndDate) {
      onDateRangeChange(customStartDate, customEndDate);
    }
  };

  const isCustomPeriod = filters.period === AnalyticsPeriod.Custom;

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6 space-y-6">
      {/* Período */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-3">
          Período
        </label>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
          {periodOptions.map((option) => (
            <button
              key={option.value}
              onClick={() => handlePeriodChange(option.value)}
              disabled={isLoading}
              className={`
                px-3 py-2 text-sm font-medium rounded-md transition-colors
                ${
                  filters.period === option.value
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }
                ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}
              `}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      {/* Rango personalizado */}
      {isCustomPeriod && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Rango Personalizado
          </label>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs text-gray-500 mb-1">
                Fecha Inicio
              </label>
              <input
                type="date"
                value={customStartDate}
                onChange={(e) => setCustomStartDate(e.target.value)}
                disabled={isLoading}
                className="w-full px-3 py-2 text-gray-700 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50 disabled:text-gray-500"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">
                Fecha Fin
              </label>
              <input
                type="date"
                value={customEndDate}
                onChange={(e) => setCustomEndDate(e.target.value)}
                disabled={isLoading}
                className="w-full px-3 py-2 text-gray-700 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50 disabled:text-gray-500"
              />
            </div>
            <div className="flex items-end">
              <button
                onClick={handleCustomDateChange}
                disabled={isLoading || !customStartDate || !customEndDate}
                className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Aplicar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Granularidad */}
      {filters.granularity && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Granularidad
          </label>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {granularityOptions.map((option) => {
              const IconComponent = option.icon;
              return (
                <button
                  key={option.value}
                  onClick={() => onGranularityChange(option.value)}
                  disabled={isLoading}
                  className={`
                    px-3 py-2 text-sm font-medium rounded-md transition-colors flex items-center justify-center space-x-2
                    ${
                      filters.granularity === option.value
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }
                    ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}
                  `}
                >
                  <IconComponent className="h-4 w-4" />
                  <span>{option.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Comparación */}
      <div>
        <div className="flex items-center justify-between">
          <label className="block text-sm font-medium text-gray-700">
            Comparar con período anterior
          </label>
          <button
            onClick={onComparisonToggle}
            disabled={isLoading}
            className={`
              relative inline-flex h-6 w-11 items-center rounded-full transition-colors
              ${
                filters.compareWithPrevious
                  ? 'bg-blue-600'
                  : 'bg-gray-200'
              }
              ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}
            `}
          >
            <span
              className={`
                inline-block h-4 w-4 transform rounded-full bg-white transition-transform
                ${
                  filters.compareWithPrevious
                    ? 'translate-x-6'
                    : 'translate-x-1'
                }
              `}
            />
          </button>
        </div>
        <p className="text-xs text-gray-500 mt-1">
          Muestra el cambio porcentual respecto al período anterior
        </p>
      </div>
    </div>
  );
};

export default AnalyticsFiltersComponent;
