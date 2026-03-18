"use client"

import { Cell, Pie, PieChart } from "recharts"

import { ChartContainer, ChartLegend, ChartLegendContent, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { useIsMobile } from "@/hooks/use-mobile"

interface ReferrerChartProps {
  data: {
    name: string
    value: number
  }[]
}

export function ReferrerChart({ data }: ReferrerChartProps) {
  const COLORS = ["#0ea5e9", "#14b8a6", "#f59e0b", "#ef4444", "#8b5cf6", "#f97316"]
  const isMobile = useIsMobile()
  const total = data.reduce((sum, item) => sum + Number(item.value || 0), 0)
  if (data.length === 0) {
    return <p className="text-sm text-[#8a94a8]">No chart data yet.</p>
  }

  return (
    <ChartContainer
      config={Object.fromEntries(data.map((item, index) => [item.name, { label: item.name, color: COLORS[index % COLORS.length] }]))}
      className="h-[260px] w-full sm:h-[300px]"
    >
      <PieChart>
        <Pie
          data={data}
          cx={isMobile ? "50%" : "38%"}
          cy="50%"
          labelLine={false}
          innerRadius={isMobile ? 44 : 58}
          outerRadius={isMobile ? 72 : 90}
          strokeWidth={2}
          stroke="#fff"
          dataKey="value"
          label={isMobile ? false : ({ percent }) => `${Math.round((percent || 0) * 100)}%`}
        >
          {data.map((_, index) => (
            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
          ))}
        </Pie>
        <ChartTooltip
          cursor={false}
          content={
            <ChartTooltipContent
              formatter={(value, _name, item) => [Number(value).toLocaleString(), item?.name || "Clicks"]}
            />
          }
        />
        <ChartLegend
          align={isMobile ? "center" : "right"}
          verticalAlign={isMobile ? "bottom" : "middle"}
          layout={isMobile ? "horizontal" : "vertical"}
          content={
            <ChartLegendContent
              className={isMobile ? "justify-center text-xs" : "items-start justify-start text-xs [&>div]:w-full"}
              nameKey="name"
            />
          }
        />
        <text
          x={isMobile ? "50%" : "38%"}
          y="50%"
          textAnchor="middle"
          dominantBaseline="middle"
          className="fill-slate-700 text-xs font-medium"
        >
          {total.toLocaleString()} total
        </text>
      </PieChart>
    </ChartContainer>
  )
}
