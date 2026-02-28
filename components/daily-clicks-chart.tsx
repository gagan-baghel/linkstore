"use client"

import { Area, AreaChart, CartesianGrid, Line, XAxis, YAxis } from "recharts"

import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"

interface DailyClicksChartProps {
  data: {
    date: string
    clicks: number
  }[]
}

export function DailyClicksChart({ data }: DailyClicksChartProps) {
  const chartData = data.map((item, index) => {
    const from = Math.max(0, index - 6)
    const slice = data.slice(from, index + 1)
    const avg = slice.length > 0 ? Math.round(slice.reduce((sum, next) => sum + next.clicks, 0) / slice.length) : 0
    return {
      ...item,
      avg,
    }
  })

  if (chartData.length === 0) {
    return <p className="text-sm text-[#8a94a8]">No daily click data yet.</p>
  }

  return (
    <ChartContainer
      config={{
        clicks: { label: "Outbound Clicks", color: "#0ea5e9" },
        avg: { label: "7-day Avg", color: "#f59e0b" },
      }}
      className="h-[260px] w-full [--grid:#e8edf7] sm:h-[320px]"
    >
      <AreaChart data={chartData} margin={{ left: 8, right: 8, top: 10, bottom: 4 }}>
        <defs>
          <linearGradient id="dailyClicksFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="var(--color-clicks)" stopOpacity={0.3} />
            <stop offset="95%" stopColor="var(--color-clicks)" stopOpacity={0.02} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="4 4" vertical={false} stroke="var(--grid)" />
        <XAxis dataKey="date" tickLine={false} axisLine={false} tickMargin={10} minTickGap={28} />
        <YAxis tickLine={false} axisLine={false} allowDecimals={false} width={36} />
        <ChartTooltip
          cursor={false}
          content={
            <ChartTooltipContent
              formatter={(value, name) => [Number(value).toLocaleString(), name === "avg" ? "7-day Avg" : "Outbound Clicks"]}
            />
          }
        />
        <Area type="monotone" dataKey="clicks" stroke="var(--color-clicks)" strokeWidth={2.5} fill="url(#dailyClicksFill)" />
        <Line
          type="monotone"
          dataKey="avg"
          stroke="var(--color-avg)"
          strokeWidth={2}
          strokeDasharray="5 5"
          dot={false}
        />
      </AreaChart>
    </ChartContainer>
  )
}
