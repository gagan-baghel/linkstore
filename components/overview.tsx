"use client"

import { Bar, BarChart, CartesianGrid, Cell, LabelList, XAxis, YAxis } from "recharts"

import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"

interface OverviewProps {
  data: {
    name: string
    value: number
  }[]
}

const barColors = ["#0ea5e9", "#14b8a6", "#f97316", "#8b5cf6"]

export function Overview({ data }: OverviewProps) {
  const chartData = data.map((item) => ({ ...item, shortName: item.name.replace(" (30d)", "") }))
  if (chartData.length === 0) {
    return <p className="text-sm text-[#8a94a8]">No funnel data yet.</p>
  }

  return (
    <ChartContainer
      config={{ value: { label: "Events", color: "#0ea5e9" } }}
      className="h-60 w-full [--axis:#8a94a8] [--grid:#e8edf7] sm:h-72"
    >
      <BarChart data={chartData} margin={{ left: 8, right: 8, top: 8, bottom: 8 }}>
        <CartesianGrid vertical={false} stroke="var(--grid)" strokeDasharray="4 4" />
        <XAxis dataKey="shortName" tickLine={false} axisLine={false} tickMargin={10} />
        <YAxis tickLine={false} axisLine={false} allowDecimals={false} width={40} />
        <ChartTooltip cursor={false} content={<ChartTooltipContent formatter={(value) => [Number(value).toLocaleString(), "Events"]} />} />
        <Bar dataKey="value" radius={[8, 8, 2, 2]}>
          {chartData.map((entry, index) => (
            <Cell key={entry.name} fill={barColors[index % barColors.length]} />
          ))}
          <LabelList dataKey="value" position="top" className="fill-slate-700 text-xs font-medium" />
        </Bar>
      </BarChart>
    </ChartContainer>
  )
}
