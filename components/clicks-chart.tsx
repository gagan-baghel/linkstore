"use client"

import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts"

import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"

interface ClicksChartProps {
  data: {
    id: string
    name: string
    clicks: number
  }[]
}

export function ClicksChart({ data }: ClicksChartProps) {
  const chartData = [...data]
    .sort((a, b) => b.clicks - a.clicks)
    .slice(0, 8)
    .map((item) => ({
      name: item.name.length > 22 ? `${item.name.slice(0, 22)}...` : item.name,
      clicks: item.clicks,
    }))

  if (chartData.length === 0) {
    return <p className="text-sm text-[#8a94a8]">No product click data yet.</p>
  }

  return (
    <ChartContainer
      config={{ clicks: { label: "Outbound Clicks", color: "#14b8a6" } }}
      className="h-64 w-full [--grid:#e8edf7] sm:h-80"
    >
      <BarChart data={chartData} margin={{ left: 8, right: 8, top: 8, bottom: 8 }}>
        <CartesianGrid vertical={false} strokeDasharray="4 4" stroke="var(--grid)" />
        <XAxis dataKey="name" tickLine={false} axisLine={false} tickMargin={10} interval={0} angle={-15} textAnchor="end" height={52} />
        <YAxis tickLine={false} axisLine={false} allowDecimals={false} width={36} />
        <ChartTooltip
          cursor={false}
          content={<ChartTooltipContent formatter={(value) => [Number(value).toLocaleString(), "Outbound Clicks"]} />}
        />
        <Bar dataKey="clicks" fill="var(--color-clicks)" radius={[8, 8, 0, 0]} />
      </BarChart>
    </ChartContainer>
  )
}
