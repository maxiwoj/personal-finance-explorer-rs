'use client'

import ReactECharts from 'echarts-for-react'
import type { EChartsOption } from 'echarts'
import { useMemo, useRef, useEffect } from 'react'
import { useTheme } from 'next-themes'
import { getMutedChartColor, withAlpha } from '@/lib/colors'

interface StackedBarSeries {
  name: string
  data: number[]
  color?: string
}

interface StackedBarComparisonSeries {
  name: string
  data: (number | null)[]
}

interface StackedBarChartProps {
  labels: string[]
  series: StackedBarSeries[]
  comparisonSeries?: StackedBarComparisonSeries
  height?: number
  yAxisLabel?: string
  onBarClick?: (index: number) => void
}

export function StackedBarChart({
  labels,
  series,
  comparisonSeries,
  height = 300,
  yAxisLabel = 'PLN',
  onBarClick,
}: StackedBarChartProps) {
  const chartRef = useRef<ReactECharts>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const { resolvedTheme } = useTheme()
  const isDark = resolvedTheme === 'dark'

  const chartTheme = useMemo(
    () => ({
      axisText: isDark ? 'rgba(203, 213, 225, 0.72)' : 'rgba(71, 85, 105, 0.85)',
      axisLine: isDark ? 'rgba(148, 163, 184, 0.22)' : 'rgba(148, 163, 184, 0.35)',
      gridLine: isDark ? 'rgba(148, 163, 184, 0.12)' : 'rgba(148, 163, 184, 0.18)',
      tooltipBackground: isDark ? 'rgba(15, 23, 42, 0.96)' : 'rgba(255, 255, 255, 0.96)',
      tooltipBorder: isDark ? 'rgba(148, 163, 184, 0.18)' : 'rgba(148, 163, 184, 0.24)',
      tooltipText: isDark ? '#e2e8f0' : '#0f172a',
    }),
    [isDark]
  )

  const option: EChartsOption = useMemo(
    () => ({
      animationDuration: 250,
      tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'shadow' },
        backgroundColor: chartTheme.tooltipBackground,
        borderColor: chartTheme.tooltipBorder,
        borderWidth: 1,
        textStyle: {
          color: chartTheme.tooltipText,
        },
        formatter: (params: unknown) => {
          const items = (params as Array<{ axisValueLabel?: string; name?: string; marker: string; seriesName: string; value: number | string | null }>) || []
          if (items.length === 0) return ''

          const header = String(items[0]?.axisValueLabel || items[0]?.name || '')
          const lines = items
            .filter(item => item.value !== undefined && item.value !== null)
            .map(item => {
              const value = typeof item.value === 'number' ? item.value : parseFloat(String(item.value))
              const formattedValue = Number.isNaN(value)
                ? 'N/A'
                : `${value.toLocaleString('pl-PL', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${yAxisLabel}`

              return `${item.marker}${item.seriesName}: ${formattedValue}`
            })

          return [header, ...lines].join('<br/>')
        },
      },
      legend: {
        top: 0,
        type: 'scroll',
        data: [...series.map(item => item.name), ...(comparisonSeries ? [comparisonSeries.name] : [])],
        textStyle: {
          color: chartTheme.axisText,
        },
      },
      grid: {
        left: '3%',
        right: '4%',
        bottom: '8%',
        top: '48px',
        containLabel: true,
      },
      xAxis: {
        type: 'category',
        boundaryGap: true,
        data: labels,
        axisLine: {
          lineStyle: {
            color: chartTheme.axisLine,
          },
        },
        axisTick: {
          lineStyle: {
            color: chartTheme.axisLine,
          },
        },
        axisLabel: {
          color: chartTheme.axisText,
          fontSize: 10,
        },
      },
      yAxis: {
        type: 'value',
        axisLine: {
          show: true,
          lineStyle: {
            color: chartTheme.axisLine,
          },
        },
        splitLine: {
          lineStyle: {
            color: chartTheme.gridLine,
          },
        },
        axisLabel: {
          color: chartTheme.axisText,
          formatter: (value: number) => (value >= 1000 ? `${(value / 1000).toFixed(0)}k` : String(value)),
          fontSize: 10,
        },
      },
      series: [
        ...series.map(item => {
          const baseColor = getMutedChartColor(item.color ?? '#3b82f6', isDark)

          return {
            name: item.name,
            type: 'bar' as const,
            stack: 'total',
            barMaxWidth: 48,
            emphasis: {
              focus: 'series' as const,
            },
            data: item.data,
            itemStyle: {
              color: withAlpha(baseColor, isDark ? 0.84 : 1),
            },
          }
        }),
        ...(comparisonSeries
          ? [
              {
                name: comparisonSeries.name,
                type: 'line' as const,
                symbol: 'none',
                connectNulls: true,
                data: comparisonSeries.data,
                lineStyle: {
                  color: '#94a3b8',
                  width: 2,
                  type: 'dashed' as const,
                },
                itemStyle: {
                  color: '#94a3b8',
                },
              },
            ]
          : []),
      ],
    }),
    [chartTheme, comparisonSeries, isDark, labels, series, yAxisLabel]
  )

  useEffect(() => {
    const container = containerRef.current
    const parent = container?.parentElement
    if (!parent) return
    const observer = new ResizeObserver((entries) => {
      const width = entries[0]?.contentRect.width
      if (width) chartRef.current?.getEchartsInstance()?.resize({ width })
    })
    observer.observe(parent)
    return () => observer.disconnect()
  }, [])

  return (
    <div ref={containerRef} className="min-w-0">
      <ReactECharts
        ref={chartRef}
        option={option}
        notMerge
        style={{ height, width: '100%' }}
        onEvents={{
          click: (params: { dataIndex?: number }) => {
            if (params.dataIndex !== undefined) onBarClick?.(params.dataIndex)
          },
        }}
        opts={{ renderer: 'svg' }}
      />
    </div>
  )
}
