import React, { useMemo } from 'react';
import ReactECharts from 'echarts-for-react';
import { Loader2, BarChart3 } from 'lucide-react';
import { UserAnalyticsBreakdownPointDto, UserAnalyticsMetricsDto } from '@/interfaces/analytics';

interface UserAnalyticsLineChartProps {
  data: UserAnalyticsBreakdownPointDto[];
  selectedMetric: keyof UserAnalyticsMetricsDto;
  isLoading?: boolean;
  height?: number;
}

const UserAnalyticsLineChart: React.FC<UserAnalyticsLineChartProps> = ({
  data,
  selectedMetric,
  isLoading = false,
  height = 400,
}) => {
  const metricLabels = useMemo(() => ({
    totalRevenue: 'Revenue Total',
    totalOrders: 'Total de Órdenes',
    averageOrderValue: 'Valor Promedio por Orden',
  }), []);

  const metricUnits = useMemo(() => ({
    totalRevenue: '$',
    totalOrders: '',
    averageOrderValue: '$',
  }), []);

  const chartOption = useMemo(() => {
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
              currency: 'ARS',
              minimumFractionDigits: 0,
              maximumFractionDigits: 0,
            }).format(value);
          } else if (selectedMetric === 'totalOrders') {
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
              return new Intl.NumberFormat('es-AR', {
                style: 'currency',
                currency: 'ARS',
                minimumFractionDigits: 0,
                maximumFractionDigits: 0,
              }).format(value);
            } else if (selectedMetric === 'totalOrders') {
              return new Intl.NumberFormat('es-AR').format(value);
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
            color: '#8b5cf6',
          },
          itemStyle: {
            color: '#8b5cf6',
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
                  color: 'rgba(139, 92, 246, 0.3)',
                },
                {
                  offset: 1,
                  color: 'rgba(139, 92, 246, 0.05)',
                },
              ],
            },
          },
          emphasis: {
            focus: 'series',
            itemStyle: {
              shadowBlur: 10,
              shadowColor: 'rgba(139, 92, 246, 0.3)',
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
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-purple-600 mx-auto mb-4" />
          <p className="text-gray-500">Cargando gráfico...</p>
        </div>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div 
        className="bg-white rounded-lg border border-gray-200 p-6 flex items-center justify-center"
        style={{ height }}
      >
        <div className="text-center">
          <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500 text-lg font-medium mb-2">No hay datos disponibles</p>
          <p className="text-gray-400 text-sm">
            No se encontraron datos para el período seleccionado
          </p>
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

export default UserAnalyticsLineChart;
