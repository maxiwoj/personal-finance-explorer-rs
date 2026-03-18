'use client'

import ReactECharts from 'echarts-for-react'
import type { EChartsOption } from 'echarts'

interface PieChartProps {
  data: { name: string; value: number; color?: string }[]
  onSliceClick?: (name: string) => void
  height?: number
  showLegend?: boolean
}

export function PieChart({ data, onSliceClick, height = 300, showLegend = true }: PieChartProps) {
  const option: EChartsOption = {
    tooltip: {
      trigger: 'item',
      formatter: '{b}: {c} PLN ({d}%)',
    },
    media: showLegend
      ? [
          {
            query: { maxWidth: 640 },
            option: {
              legend: {
                orient: 'horizontal',
                left: 'center',
                bottom: 0,
                top: undefined,
                type: 'scroll',
                textStyle: {
                  fontSize: 11,
                },
              },
              series: [
                {
                  center: ['50%', '38%'],
                  radius: ['34%', '62%'],
                },
              ],
              grid: {
                bottom: 84,
              },
            },
          },
          {
            option: {
              legend: {
                orient: 'vertical',
                right: 10,
                top: 'center',
                type: 'scroll',
                textStyle: {
                  fontSize: 11,
                },
              },
              series: [
                {
                  center: ['35%', '50%'],
                  radius: ['40%', '70%'],
                },
              ],
            },
          },
        ]
      : undefined,
    legend: showLegend ? {
      orient: 'vertical',
      right: 10,
      top: 'center',
      type: 'scroll',
      textStyle: {
        fontSize: 11,
      },
    } : undefined,
    series: [
      {
        type: 'pie',
        radius: ['40%', '70%'],
        center: showLegend ? ['35%', '50%'] : ['50%', '50%'],
        avoidLabelOverlap: true,
        itemStyle: {
          borderRadius: 4,
          borderColor: '#fff',
          borderWidth: 2,
        },
        label: {
          show: false,
        },
        emphasis: {
          label: {
            show: true,
            fontSize: 14,
            fontWeight: 'bold',
          },
        },
        labelLine: {
          show: false,
        },
        data: data.map(item => ({
          name: item.name,
          value: Math.round(item.value * 100) / 100,
          itemStyle: item.color ? { color: item.color } : undefined,
        })),
      },
    ],
  }

  const handleClick = (params: { name?: string }) => {
    if (onSliceClick && params.name) {
      onSliceClick(params.name)
    }
  }

  return (
    <ReactECharts
      option={option}
      style={{ height, width: '100%' }}
      onEvents={{ click: handleClick }}
      opts={{ renderer: 'svg' }}
    />
  )
}
