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
        const items = params as any[]
        if (!items || items.length === 0) return ''
        const item = items[0]
        if (item.value === undefined || item.value === null) return `${item.name}: N/A`
        const value = typeof item.value === 'number' ? item.value : parseFloat(String(item.value))
        if (isNaN(value)) return `${item.name}: N/A`
        return `${item.name}: ${value.toLocaleString('pl-PL')} ${yAxisLabel}`
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
      throttleType: 'debounce',
      throttleDelay: 300,
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

  const handleBrushSelected = (params: any) => {
    console.log('LineChart: BRUSH EVENT!', params)
    
    if (!onBrushSelect) return
    
    const area = params.batch?.[0]?.areas?.[0] || params.areas?.[0]
    
    if (!area || !area.coordRange || area.coordRange.length < 2) {
      console.log('LineChart: No valid selection area')
      return
    }
    
    const [startIdx, endIdx] = area.coordRange
    console.log(`LineChart: Indices ${startIdx} to ${endIdx}`)
    
    if (startIdx !== undefined && endIdx !== undefined) {
      const minIdx = Math.max(0, Math.min(Math.round(Math.min(startIdx, endIdx)), data.length - 1))
      const maxIdx = Math.max(0, Math.min(Math.round(Math.max(startIdx, endIdx)), data.length - 1))
      
      if (data[minIdx] && data[maxIdx]) {
        console.log(`LineChart: Calling onBrushSelect with ${data[minIdx].label} to ${data[maxIdx].label}`)
        onBrushSelect(data[minIdx].label, data[maxIdx].label)
      }
    }
  }

  const onChartReady = (instance: any) => {
    console.log('LineChart: Chart ready, binding events and activating brush')
    instance.on('brushSelected', handleBrushSelected)
    instance.on('brushselected', handleBrushSelected)
    
    // Automatically activate the lineX brush tool
    instance.dispatchAction({
      type: 'takeGlobalCursor',
      key: 'brush',
      brushOption: {
        brushType: 'lineX',
        brushMode: 'single'
      }
    })
  }

  return (
    <ReactECharts
      ref={chartRef}
      option={option}
      style={{ height, width: '100%' }}
      onChartReady={onChartReady}
      onEvents={{ 
        'click': (params: any) => onDateClick?.(params.name)
      }}
      opts={{ renderer: 'svg' }}
    />
  )
}