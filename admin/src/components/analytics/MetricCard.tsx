import React from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface MetricCardProps {
  title: string;
  value: string;
  change?: number;
  changeLabel?: string;
  icon?: React.ReactNode;
  isLoading?: boolean;
  color?: 'blue' | 'green' | 'purple' | 'orange' | 'red' | 'emerald';
}

const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  change,
  changeLabel,
  icon,
  isLoading = false,
  color = 'blue',
}) => {
  const getColorClasses = (colorName: string) => {
    const colors = {
      blue: {
        bg: 'bg-blue-50',
        icon: 'bg-blue-100 text-blue-600',
        text: 'text-blue-600',
      },
      green: {
        bg: 'bg-green-50',
        icon: 'bg-green-100 text-green-600',
        text: 'text-green-600',
      },
      purple: {
        bg: 'bg-purple-50',
        icon: 'bg-purple-100 text-purple-600',
        text: 'text-purple-600',
      },
      orange: {
        bg: 'bg-orange-50',
        icon: 'bg-orange-100 text-orange-600',
        text: 'text-orange-600',
      },
      red: {
        bg: 'bg-red-50',
        icon: 'bg-red-100 text-red-600',
        text: 'text-red-600',
      },
      emerald: {
        bg: 'bg-emerald-50',
        icon: 'bg-emerald-100 text-emerald-600',
        text: 'text-emerald-600',
      },
    };
    return colors[colorName as keyof typeof colors] || colors.blue;
  };

  const getChangeIcon = (changeValue?: number) => {
    if (changeValue === undefined || changeValue === 0) {
      return <Minus className="h-4 w-4 text-gray-400" />;
    }
    return changeValue > 0 ? (
      <TrendingUp className="h-4 w-4 text-green-600" />
    ) : (
      <TrendingDown className="h-4 w-4 text-red-600" />
    );
  };

  const getChangeColor = (changeValue?: number) => {
    if (changeValue === undefined || changeValue === 0) {
      return 'text-gray-600';
    }
    return changeValue > 0 ? 'text-green-600' : 'text-red-600';
  };

  const formatChange = (changeValue?: number) => {
    if (changeValue === undefined) return '';
    const sign = changeValue >= 0 ? '+' : '';
    return `${sign}${changeValue.toFixed(1)}%`;
  };

  const colorClasses = getColorClasses(color);

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="animate-pulse">
          <div className="flex items-center justify-between mb-4">
            <div className="h-4 bg-gray-300 rounded w-1/2"></div>
            <div className={`w-10 h-10 ${colorClasses.bg} rounded-lg`}></div>
          </div>
          <div className="h-8 bg-gray-300 rounded w-3/4 mb-2"></div>
          <div className="h-4 bg-gray-300 rounded w-1/3"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4 sm:p-6 hover:shadow-md transition-shadow min-w-0">
      <div className="flex items-start justify-between mb-3 sm:mb-4">
        <h3 className="text-xs sm:text-sm font-medium text-gray-600 leading-tight flex-1 mr-2 overflow-hidden">
          <span className="block overflow-hidden text-ellipsis whitespace-nowrap">
            {title}
          </span>
        </h3>
        {icon && (
          <div className={`w-8 h-8 sm:w-10 sm:h-10 ${colorClasses.icon} rounded-lg flex items-center justify-center flex-shrink-0`}>
            {icon}
          </div>
        )}
      </div>
      
      <div className="mb-2 min-w-0">
        <p className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900 truncate" title={value}>
          {value}
        </p>
      </div>
      
      {(change !== undefined || changeLabel) && (
        <div className="flex items-center space-x-1 min-w-0">
          {change !== undefined && (
            <>
              {getChangeIcon(change)}
              <span className={`text-xs sm:text-sm font-medium ${getChangeColor(change)} flex-shrink-0`}>
                {formatChange(change)}
              </span>
            </>
          )}
          {changeLabel && (
            <span className="text-xs sm:text-sm text-gray-500 truncate flex-1">
              {changeLabel}
            </span>
          )}
        </div>
      )}
    </div>
  );
};

export default MetricCard;
