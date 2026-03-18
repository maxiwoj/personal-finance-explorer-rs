'use client'

import ReactECharts from 'echarts-for-react'
import type { EChartsOption } from 'echarts'
import { useRef } from 'react'

interface LineChartPoint {
  value: number
  detail?: string
}

interface LineChartSeries {
  name: string
  data: Array<number | LineChartPoint | null>
  color?: string
  areaFill?: boolean
  lineStyle?: 'solid' | 'dashed' | 'dotted'
  opacity?: number
}

interface LineChartProps {
  labels: string[]
  series: LineChartSeries[]
  height?: number
  yAxisLabel?: string
  onDateClick?: (date: string) => void
  onBrushSelect?: (startDate: string, endDate: string) => void
}

export function LineChart({
  labels,
  series,
  height = 300,
  yAxisLabel = 'PLN',
  onDateClick,
  onBrushSelect,
}: LineChartProps) {
  const chartRef = useRef<ReactECharts>(null)

  const option: EChartsOption = {
    tooltip: {
      trigger: 'axis',
      formatter: (params: unknown) => {
        const items = (params as Array<{ axisValueLabel?: string; name?: string; marker: string; seriesName: string; value: number | string; data?: LineChartPoint | number }>) || []
        if (items.length === 0) return ''

        const header = String(items[0]?.axisValueLabel || items[0]?.name || '')
        const lines = items
          .filter(item => item.value !== undefined && item.value !== null)
          .map(item => {
            const value = typeof item.value === 'number' ? item.value : parseFloat(String(item.value))
            const formattedValue = Number.isNaN(value)
              ? 'N/A'
              : `${value.toLocaleString('pl-PL', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${yAxisLabel}`
            const detail = typeof item.data === 'object' && item.data !== null && 'detail' in item.data && item.data.detail
              ? `<br/><span style="opacity:0.75">${item.data.detail}</span>`
              : ''

            return `${item.marker}${item.seriesName}: ${formattedValue}${detail}`
          })

        return [header, ...lines].join('<br/>')
      },
    },
    legend: {
      top: 0,
      type: 'scroll',
      data: series.map(item => item.name),
    },
    toolbox: onBrushSelect
      ? {
          feature: {
            brush: {
              type: ['lineX', 'clear'],
              title: {
                lineX: 'Select date range',
                clear: 'Clear selection',
              },
            },
          },
          right: 10,
          top: 0,
        }
      : undefined,
    brush: onBrushSelect
      ? {
          toolbox: ['lineX', 'clear'],
          xAxisIndex: 0,
          throttleType: 'debounce',
          throttleDelay: 300,
          brushStyle: {
            borderWidth: 1,
            color: 'rgba(59, 130, 246, 0.1)',
            borderColor: 'rgba(59, 130, 246, 0.5)',
          },
        }
      : undefined,
    grid: {
      left: '3%',
      right: onBrushSelect ? '8%' : '4%',
      bottom: labels.length > 10 ? '16%' : '8%',
      top: onBrushSelect ? '56px' : '40px',
      containLabel: true,
    },
    xAxis: {
      type: 'category',
      boundaryGap: false,
      data: labels,
      axisLabel: {
        fontSize: 10,
        rotate: labels.length > 10 ? 45 : 0,
      },
    },
    yAxis: {
      type: 'value',
      axisLabel: {
        formatter: (value: number) => (value >= 1000 ? `${(value / 1000).toFixed(0)}k` : String(value)),
        fontSize: 10,
      },
    },
    series: series.map(item => ({
      name: item.name,
      type: 'line',
      smooth: true,
      symbol: labels.length > 120 ? 'none' : 'circle',
      showSymbol: labels.length <= 120,
      emphasis: {
        focus: 'series',
      },
      data: item.data,
      lineStyle: {
        color: item.color,
        width: 2,
        type: item.lineStyle,
        opacity: item.opacity,
      },
      itemStyle: {
        color: item.color,
        opacity: item.opacity,
      },
      areaStyle: item.areaFill
        ? {
            opacity: item.opacity ?? 0.2,
            color: item.color,
          }
        : undefined,
    })),
  }

  const handleBrushSelected = (params: any) => {
    if (!onBrushSelect) return

    const area = params.batch?.[0]?.areas?.[0] || params.areas?.[0]

    if (!area || !area.coordRange || area.coordRange.length < 2) {
      return
    }

    const [startIdx, endIdx] = area.coordRange

    if (startIdx !== undefined && endIdx !== undefined) {
      const minIdx = Math.max(0, Math.min(Math.round(Math.min(startIdx, endIdx)), labels.length - 1))
      const maxIdx = Math.max(0, Math.min(Math.round(Math.max(startIdx, endIdx)), labels.length - 1))

      if (labels[minIdx] && labels[maxIdx]) {
        onBrushSelect(labels[minIdx], labels[maxIdx])
      }
    }
  }

  const onChartReady = (instance: any) => {
    instance.on('brushSelected', handleBrushSelected)
    instance.on('brushselected', handleBrushSelected)

    if (onBrushSelect) {
      instance.dispatchAction({
        type: 'takeGlobalCursor',
        key: 'brush',
        brushOption: {
          brushType: 'lineX',
          brushMode: 'single',
        },
      })
    }
  }

  return (
    <ReactECharts
      ref={chartRef}
      option={option}
      notMerge
      style={{ height, width: '100%' }}
      onChartReady={onChartReady}
      onEvents={{
        click: (params: any) => onDateClick?.(params.name),
      }}
      opts={{ renderer: 'svg' }}
    />
  )
}
