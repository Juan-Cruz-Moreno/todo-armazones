import React from 'react';
import { DollarSign, ShoppingCart, TrendingUp } from 'lucide-react';
import { UserAnalyticsMetricsDto } from '@/interfaces/analytics';

interface UserMetricSelectorProps {
  selectedMetric: keyof UserAnalyticsMetricsDto;
  onMetricChange: (metric: keyof UserAnalyticsMetricsDto) => void;
  disabled?: boolean;
}

const UserMetricSelector: React.FC<UserMetricSelectorProps> = ({
  selectedMetric,
  onMetricChange,
  disabled = false,
}) => {
  const metricOptions = [
    {
      key: 'totalRevenue' as keyof UserAnalyticsMetricsDto,
      label: 'Revenue Total',
      icon: DollarSign,
      color: 'blue',
      description: 'Ingresos generados por el usuario',
    },
    {
      key: 'totalOrders' as keyof UserAnalyticsMetricsDto,
      label: 'Total de Órdenes',
      icon: ShoppingCart,
      color: 'purple',
      description: 'Número total de órdenes del usuario',
    },
    {
      key: 'averageOrderValue' as keyof UserAnalyticsMetricsDto,
      label: 'Valor Promedio',
      icon: TrendingUp,
      color: 'green',
      description: 'Valor promedio por orden del usuario',
    },
  ];

  const getColorClasses = (color: string, isSelected: boolean) => {
    const colors = {
      blue: {
        selected: 'bg-blue-600 text-white border-blue-600',
        unselected: 'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100',
        icon: isSelected ? 'text-white' : 'text-blue-600',
      },
      green: {
        selected: 'bg-green-600 text-white border-green-600',
        unselected: 'bg-green-50 text-green-700 border-green-200 hover:bg-green-100',
        icon: isSelected ? 'text-white' : 'text-green-600',
      },
      purple: {
        selected: 'bg-purple-600 text-white border-purple-600',
        unselected: 'bg-purple-50 text-purple-700 border-purple-200 hover:bg-purple-100',
        icon: isSelected ? 'text-white' : 'text-purple-600',
      },
    };
    
    return colors[color as keyof typeof colors] || colors.blue;
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        Métrica del Gráfico
      </h3>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {metricOptions.map((option) => {
          const IconComponent = option.icon;
          const isSelected = selectedMetric === option.key;
          const colorClasses = getColorClasses(option.color, isSelected);
          
          return (
            <button
              key={option.key}
              onClick={() => onMetricChange(option.key)}
              disabled={disabled}
              className={`
                p-4 rounded-lg border-2 transition-all duration-200 text-left
                ${isSelected ? colorClasses.selected : colorClasses.unselected}
                ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500
              `}
            >
              <div className="flex items-center space-x-3 mb-2">
                <IconComponent className={`h-5 w-5 ${colorClasses.icon}`} />
                <span className="font-medium text-sm">{option.label}</span>
              </div>
              <p className={`text-xs ${isSelected ? 'text-gray-100' : 'text-gray-500'}`}>
                {option.description}
              </p>
            </button>
          );
        })}
      </div>
      
      <div className="mt-4 text-sm text-gray-600">
        <p>Selecciona la métrica que deseas visualizar en el gráfico lineal.</p>
      </div>
    </div>
  );
};

export default UserMetricSelector;
