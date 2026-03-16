'use client'

import ReactECharts from 'echarts-for-react'
import type { EChartsOption } from 'echarts'

interface LineChartProps {
  data: { label: string; value: number }[]
  height?: number
  color?: string
  areaFill?: boolean
  yAxisLabel?: string
}

export function LineChart({ 
  data, 
  height = 300, 
  color = '#3b82f6',
  areaFill = true,
  yAxisLabel = 'PLN'
}: LineChartProps) {
  const option: EChartsOption = {
    tooltip: {
      trigger: 'axis',
      formatter: (params: unknown) => {
        const item = (params as { name: string; value: number }[])[0]
        return `${item.name}: ${item.value.toLocaleString('pl-PL')} ${yAxisLabel}`
      },
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
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
        formatter: (value: number) => `${(value / 1000).toFixed(0)}k`,
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

  return (
    <ReactECharts
      option={option}
      style={{ height, width: '100%' }}
      opts={{ renderer: 'svg' }}
    />
  )
}
