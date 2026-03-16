'use client'

import ReactECharts from 'echarts-for-react'
import type { EChartsOption } from 'echarts'
import { useRef } from 'react'

interface LineChartProps {
  data: { label: string; value: number }[]
  height?: number
  color?: string
  areaFill?: boolean
  yAxisLabel?: string
  onDateClick?: (date: string) => void
  onBrushSelect?: (startDate: string, endDate: string) => void
}

export function LineChart({ 
  data, 
  height = 300, 
  color = '#3b82f6',
  areaFill = true,
  yAxisLabel = 'PLN',
  onDateClick,
  onBrushSelect
}: LineChartProps) {
  const chartRef = useRef<ReactECharts>(null)

  const option: EChartsOption = {
    tooltip: {
      trigger: 'axis',
      formatter: (params: unknown) => {
        const item = (params as { name: string; value: number }[])[0]
        return `${item.name}: ${item.value.toLocaleString('pl-PL')} ${yAxisLabel}`
      },
    },
    toolbox: onBrushSelect ? {
      feature: {
        brush: {
          type: ['lineX', 'clear'],
          title: {
            lineX: 'Select date range',
            clear: 'Clear selection'
          }
        }
      },
      right: 10,
      top: 0
    } : undefined,
    brush: onBrushSelect ? {
      toolbox: ['lineX', 'clear'],
      xAxisIndex: 0,
      brushStyle: {
        borderWidth: 1,
        color: 'rgba(59, 130, 246, 0.1)',
        borderColor: 'rgba(59, 130, 246, 0.5)'
      }
    } : undefined,
    grid: {
      left: '3%',
      right: onBrushSelect ? '8%' : '4%',
      bottom: '3%',
      top: onBrushSelect ? '40px' : '10px',
      containLabel: true,
    },
    xAxis: {
      type: 'category',
      boundaryGap: false,
      data: data.map(d => d.label),
      axisLabel: {
        fontSize: 10,
        rotate: data.length > 10 ? 45 : 0,
      },
    },
    yAxis: {
      type: 'value',
      axisLabel: {
        formatter: (value: number) => value >= 1000 ? `${(value / 1000).toFixed(0)}k` : String(value),
        fontSize: 10,
      },
    },
    series: [
      {
        type: 'line',
        smooth: true,
        data: data.map(d => d.value),
        lineStyle: {
          color,
          width: 2,
        },
        itemStyle: {
          color,
        },
        areaStyle: areaFill ? {
          color: {
            type: 'linear',
            x: 0,
            y: 0,
            x2: 0,
            y2: 1,
            colorStops: [
              { offset: 0, color: `${color}40` },
              { offset: 1, color: `${color}10` },
            ],
          },
        } : undefined,
      },
    ],
  }

  const handleClick = (params: { name?: string }) => {
    if (onDateClick && params.name) {
      onDateClick(params.name)
    }
  }

  const handleBrushSelected = (params: { batch?: { areas?: { coordRange?: number[] }[] }[] }) => {
    if (!onBrushSelect || !params.batch?.[0]?.areas?.[0]?.coordRange) return
    
    const [startIdx, endIdx] = params.batch[0].areas[0].coordRange
    if (startIdx !== undefined && endIdx !== undefined && data[startIdx] && data[endIdx]) {
      onBrushSelect(data[startIdx].label, data[endIdx].label)
    }
  }

  return (
    <ReactECharts
      ref={chartRef}
      option={option}
      style={{ height, width: '100%' }}
      onEvents={{ 
        click: handleClick,
        brushSelected: handleBrushSelected
      }}
      opts={{ renderer: 'svg' }}
    />
  )
}
