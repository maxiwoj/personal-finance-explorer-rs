"use client";

import ReactECharts from "echarts-for-react";
import type { EChartsOption } from "echarts";
import { useMemo } from "react";
import { useTheme } from "next-themes";
import { getMutedChartColor, withAlpha } from "@/lib/colors";

interface PieChartProps {
  data: { name: string; value: number; color?: string }[];
  onSliceClick?: (name: string) => void;
  height?: number;
  showLegend?: boolean;
}

export function PieChart({
  data,
  onSliceClick,
  height = 300,
  showLegend = true,
}: PieChartProps) {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";

  const chartTheme = useMemo(
    () => ({
      legendText: isDark
        ? "rgba(203, 213, 225, 0.72)"
        : "rgba(71, 85, 105, 0.85)",
      tooltipBackground: isDark
        ? "rgba(15, 23, 42, 0.96)"
        : "rgba(255, 255, 255, 0.96)",
      tooltipBorder: isDark
        ? "rgba(148, 163, 184, 0.18)"
        : "rgba(148, 163, 184, 0.24)",
      tooltipText: isDark ? "#e2e8f0" : "#0f172a",
      segmentBorder: isDark ? "#0f172a" : "#ffffff",
      emphasisText: isDark ? "#f8fafc" : "#0f172a",
    }),
    [isDark],
  );

  const option: EChartsOption = useMemo(
    () => ({
      animationDuration: 250,
      tooltip: {
        trigger: "item",
        backgroundColor: chartTheme.tooltipBackground,
        borderColor: chartTheme.tooltipBorder,
        borderWidth: 1,
        textStyle: {
          color: chartTheme.tooltipText,
        },
        formatter: "{b}: {c} PLN ({d}%)",
      },
      media: showLegend
        ? [
            {
              query: { maxWidth: 640 },
              option: {
                legend: {
                  orient: "horizontal",
                  left: "center",
                  bottom: 0,
                  top: undefined,
                  type: "scroll",
                  textStyle: {
                    color: chartTheme.legendText,
                    fontSize: 11,
                  },
                },
                series: [
                  {
                    center: ["50%", "38%"],
                    radius: ["34%", "62%"],
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
                  orient: "vertical",
                  right: 10,
                  top: "center",
                  type: "scroll",
                  textStyle: {
                    color: chartTheme.legendText,
                    fontSize: 11,
                  },
                },
                series: [
                  {
                    center: ["35%", "50%"],
                    radius: ["40%", "70%"],
                  },
                ],
              },
            },
          ]
        : undefined,
      legend: showLegend
        ? {
            orient: "vertical",
            right: 10,
            top: "center",
            type: "scroll",
            textStyle: {
              color: chartTheme.legendText,
              fontSize: 11,
            },
          }
        : undefined,
      series: [
        {
          type: "pie",
          radius: ["40%", "70%"],
          center: showLegend ? ["35%", "50%"] : ["50%", "50%"],
          avoidLabelOverlap: true,
          itemStyle: {
            borderRadius: 4,
            borderColor: chartTheme.segmentBorder,
            borderWidth: isDark ? 1 : 2,
          },
          label: {
            show: false,
          },
          emphasis: {
            scale: true,
            scaleSize: isDark ? 4 : 6,
            label: {
              show: true,
              color: chartTheme.emphasisText,
              fontSize: 14,
              fontWeight: "bold",
            },
            itemStyle: {
              shadowBlur: 10,
              shadowColor: isDark
                ? "rgba(15, 23, 42, 0.25)"
                : "rgba(15, 23, 42, 0.12)",
            },
          },
          labelLine: {
            show: false,
          },
          data: data.map((item) => {
            const baseColor = getMutedChartColor(
              item.color ?? "#3b82f6",
              isDark,
            );
            return {
              name: item.name,
              value: Math.round(item.value * 100) / 100,
              itemStyle: {
                color: withAlpha(baseColor, isDark ? 0.84 : 1),
              },
            };
          }),
        },
      ],
    }),
    [chartTheme, data, isDark, showLegend],
  );

  const handleClick = (params: { name?: string }) => {
    if (onSliceClick && params.name) {
      onSliceClick(params.name);
    }
  };

  return (
    <ReactECharts
      option={option}
      style={{ height, width: "100%" }}
      onEvents={{ click: handleClick }}
      opts={{ renderer: "svg" }}
    />
  );
}
