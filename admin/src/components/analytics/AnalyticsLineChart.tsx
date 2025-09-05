import React, { useMemo } from 'react';
import ReactECharts from 'echarts-for-react';
import { OrderAnalyticsBreakdownPointDto, OrderAnalyticsMetricsDto } from '@/interfaces/analytics';

interface AnalyticsLineChartProps {
  data: OrderAnalyticsBreakdownPointDto[];
  selectedMetric: keyof OrderAnalyticsMetricsDto;
  isLoading?: boolean;
  height?: number;
}

const AnalyticsLineChart: React.FC<AnalyticsLineChartProps> = ({
  data,
  selectedMetric,
  isLoading = false,
  height = 400,
}) => {
  const metricLabels = useMemo(() => ({
    gross: 'Ventas Brutas',
    net: 'Ventas Netas',
    count: 'Número de Órdenes',
    items: 'Items Vendidos',
    averageGrossDaily: 'Promedio Diario Bruto',
    averageNetDaily: 'Promedio Diario Neto',
  }), []);

  const metricUnits = useMemo(() => ({
    gross: '$',
    net: '$',
    count: '',
    items: '',
    averageGrossDaily: '$',
    averageNetDaily: '$',
  }), []);

  const chartOption = useMemo(() => {
    // Validación temprana para evitar errores
    if (!data || !Array.isArray(data) || data.length === 0) {
      return null;
    }

    const xAxisData = data.map(point => point.label);
    const seriesData = data.map(point => point.metrics[selectedMetric]);

    return {
      title: {
        text: metricLabels[selectedMetric],
        left: '0%',
        textStyle: {
          fontSize: 16,
          fontWeight: '600',
          color: '#374151',
        },
      },
      tooltip: {
        trigger: 'axis',
        backgroundColor: '#ffffff',
        borderColor: '#e5e7eb',
        borderWidth: 1,
        textStyle: {
          color: '#374151',
        },
        formatter: (params: { axisValue: string; color: string; value: number }[]) => {
          const param = params[0];
          const value = param.value;
          const unit = metricUnits[selectedMetric];
          
          let formattedValue: string = value.toString();
          if (unit === '$') {
            formattedValue = new Intl.NumberFormat('es-AR', {
              style: 'currency',
              currency: 'USD',
              minimumFractionDigits: 2,
            }).format(value);
          } else if (selectedMetric === 'count' || selectedMetric === 'items') {
            formattedValue = new Intl.NumberFormat('es-AR').format(value);
          }
          
          return `
            <div style="padding: 8px;">
              <div style="font-weight: 600; margin-bottom: 4px;">${param.axisValue}</div>
              <div style="color: #1f2937;">
                <span style="color: ${param.color};">●</span>
                ${metricLabels[selectedMetric]}: <strong>${formattedValue}</strong>
              </div>
            </div>
          `;
        },
      },
      grid: {
        left: '3%',
        right: '4%',
        bottom: '3%',
        top: '15%',
        containLabel: true,
      },
      xAxis: {
        type: 'category',
        data: xAxisData,
        axisLine: {
          lineStyle: {
            color: '#e5e7eb',
          },
        },
        axisLabel: {
          color: '#6b7280',
          fontSize: 12,
        },
        axisTick: {
          alignWithLabel: true,
          lineStyle: {
            color: '#e5e7eb',
          },
        },
      },
      yAxis: {
        type: 'value',
        axisLine: {
          show: false,
        },
        axisTick: {
          show: false,
        },
        axisLabel: {
          color: '#6b7280',
          fontSize: 12,
          formatter: (value: number) => {
            const unit = metricUnits[selectedMetric];
            if (unit === '$') {
              if (value >= 1000000) {
                return `$${(value / 1000000).toFixed(1)}M`;
              } else if (value >= 1000) {
                return `$${(value / 1000).toFixed(0)}k`;
              } else {
                return `$${value.toFixed(0)}`;
              }
            } else if (selectedMetric === 'count' || selectedMetric === 'items') {
              if (value >= 1000000) {
                return `${(value / 1000000).toFixed(1)}M`;
              } else if (value >= 1000) {
                return `${(value / 1000).toFixed(0)}k`;
              } else {
                return value.toString();
              }
            }
            return value.toString();
          },
        },
        splitLine: {
          lineStyle: {
            color: '#f3f4f6',
            type: 'dashed',
          },
        },
      },
      series: [
        {
          name: metricLabels[selectedMetric],
          type: 'line',
          data: seriesData,
          smooth: true,
          lineStyle: {
            width: 3,
            color: '#3b82f6',
          },
          itemStyle: {
            color: '#3b82f6',
            borderWidth: 2,
            borderColor: '#ffffff',
          },
          areaStyle: {
            color: {
              type: 'linear',
              x: 0,
              y: 0,
              x2: 0,
              y2: 1,
              colorStops: [
                {
                  offset: 0,
                  color: 'rgba(59, 130, 246, 0.3)',
                },
                {
                  offset: 1,
                  color: 'rgba(59, 130, 246, 0.05)',
                },
              ],
            },
          },
          emphasis: {
            focus: 'series',
            itemStyle: {
              shadowBlur: 10,
              shadowColor: 'rgba(59, 130, 246, 0.3)',
            },
          },
        },
      ],
      animation: true,
      animationDuration: 1000,
      animationEasing: 'cubicOut',
    };
  }, [data, selectedMetric, metricLabels, metricUnits]);

  if (isLoading) {
    return (
      <div 
        className="bg-white rounded-lg border border-gray-200 p-6 flex items-center justify-center"
        style={{ height }}
      >
        <div className="animate-pulse text-center">
          <div className="h-4 bg-gray-300 rounded w-48 mx-auto mb-4"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (!data || data.length === 0 || !chartOption) {
    return (
      <div 
        className="bg-white rounded-lg border border-gray-200 p-6 flex items-center justify-center"
        style={{ height }}
      >
        <div className="text-center text-gray-500">
          <p className="text-lg font-medium mb-2">No hay datos disponibles</p>
          <p className="text-sm">Selecciona un período con datos para ver el gráfico</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <ReactECharts
        option={chartOption}
        style={{ height: `${height}px`, width: '100%' }}
        opts={{ renderer: 'canvas' }}
      />
    </div>
  );
};

export default AnalyticsLineChart;
