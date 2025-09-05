import React, { useState } from 'react';
import { Calendar, Clock, BarChart3, TrendingUp } from 'lucide-react';
import { AnalyticsPeriod, AnalyticsGranularity } from '@/enums/analytics.enum';

interface UserAnalyticsFiltersProps {
  period: AnalyticsPeriod;
  granularity?: AnalyticsGranularity;
  compareWithPrevious: boolean;
  customRange?: { startDate: string; endDate: string };
  onPeriodChange: (period: AnalyticsPeriod) => void;
  onGranularityChange: (granularity: AnalyticsGranularity) => void;
  onDateRangeChange: (startDate: string, endDate: string) => void;
  onComparisonToggle: () => void;
  isLoading?: boolean;
}

const UserAnalyticsFilters: React.FC<UserAnalyticsFiltersProps> = ({
  period,
  granularity,
  compareWithPrevious,
  customRange,
  onPeriodChange,
  onGranularityChange,
  onDateRangeChange,
  onComparisonToggle,
  isLoading = false,
}) => {
  const [customStartDate, setCustomStartDate] = useState(
    customRange?.startDate || ''
  );
  const [customEndDate, setCustomEndDate] = useState(
    customRange?.endDate || ''
  );

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

  const isCustomPeriod = period === AnalyticsPeriod.Custom;

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
              onClick={() => onPeriodChange(option.value)}
              disabled={isLoading}
              className={`
                px-3 py-2 rounded-md text-sm font-medium transition-colors
                ${
                  period === option.value
                    ? 'bg-purple-600 text-white'
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
              <label className="block text-xs font-medium text-gray-500 mb-1">
                Fecha inicial
              </label>
              <input
                type="date"
                value={customStartDate}
                onChange={(e) => setCustomStartDate(e.target.value)}
                disabled={isLoading}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-purple-500 disabled:opacity-50"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">
                Fecha final
              </label>
              <input
                type="date"
                value={customEndDate}
                onChange={(e) => setCustomEndDate(e.target.value)}
                disabled={isLoading}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-purple-500 disabled:opacity-50"
              />
            </div>
            <div className="flex items-end">
              <button
                onClick={handleCustomDateChange}
                disabled={isLoading || !customStartDate || !customEndDate}
                className="w-full px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Aplicar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Granularidad */}
      {granularity && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Granularidad
          </label>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {granularityOptions.map((option) => {
              const IconComponent = option.icon;
              const isSelected = granularity === option.value;
              
              return (
                <button
                  key={option.value}
                  onClick={() => onGranularityChange(option.value)}
                  disabled={isLoading}
                  className={`
                    flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors
                    ${
                      isSelected
                        ? 'bg-purple-600 text-white'
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
                compareWithPrevious
                  ? 'bg-purple-600'
                  : 'bg-gray-200'
              }
              ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}
            `}
          >
            <span
              className={`
                inline-block h-4 w-4 transform rounded-full bg-white transition-transform
                ${
                  compareWithPrevious
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

export default UserAnalyticsFilters;
