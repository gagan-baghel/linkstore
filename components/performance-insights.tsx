import Image from "next/image"
import Link from "next/link"
import { AlertTriangle, Lightbulb, TrendingUp, Trophy } from "lucide-react"

import type { Insight, ProductPerformance } from "@/lib/insights"
import { cn } from "@/lib/utils"

const TONE = {
  good: { icon: TrendingUp, className: "bg-emerald-50 text-emerald-700" },
  warn: { icon: AlertTriangle, className: "bg-amber-50 text-amber-700" },
  tip: { icon: Lightbulb, className: "bg-indigo-50 text-indigo-700" },
} as const

export function InsightsList({ insights }: { insights: Insight[] }) {
  if (insights.length === 0) {
    return <p className="text-sm text-[#8a94a8]">Keep sharing your store. Insights appear once you have a few more visits.</p>
  }
  return (
    <ul className="space-y-2.5">
      {insights.map((insight) => {
        const { icon: Icon, className } = TONE[insight.tone]
        const body = (
          <>
            <span className={cn("mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-lg", className)}>
              <Icon className="h-4 w-4" aria-hidden />
            </span>
            <span className="min-w-0">
              <span className="block text-sm font-semibold text-[#1c1917]">{insight.title}</span>
              <span className="block text-xs leading-5 text-[#5f6b7e]">{insight.detail}</span>
            </span>
          </>
        )
        return (
          <li key={insight.id}>
            {insight.href ? (
              <Link href={insight.href} className="flex gap-3 rounded-xl p-1.5 transition hover:bg-slate-50">
                {body}
              </Link>
            ) : (
              <div className="flex gap-3 p-1.5">{body}</div>
            )}
          </li>
        )
      })}
    </ul>
  )
}

export function TopPerformersList({
  products,
  totalClicks,
  showWeek = true,
}: {
  products: ProductPerformance[]
  totalClicks: number
  showWeek?: boolean
}) {
  if (products.length === 0) {
    return <p className="text-sm text-[#8a94a8]">No product clicks in the last 30 days yet.</p>
  }
  return (
    <ol className="space-y-2">
      {products.map((product, index) => {
        const share = totalClicks > 0 ? Math.round((product.outbound30d / totalClicks) * 100) : 0
        return (
          <li key={product.id} className="flex items-center gap-3">
            <span
              className={cn(
                "grid h-6 w-6 shrink-0 place-items-center rounded-full text-[11px] font-bold",
                index === 0 ? "bg-amber-100 text-amber-700" : "bg-slate-100 text-slate-500",
              )}
            >
              {index === 0 ? <Trophy className="h-3.5 w-3.5" aria-label="Top product" /> : index + 1}
            </span>
            <span className="relative h-10 w-10 shrink-0 overflow-hidden rounded-lg bg-slate-100">
              {product.image ? <Image src={product.image} alt="" fill unoptimized sizes="40px" className="object-cover" /> : null}
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-medium text-[#1c1917]">
                {product.productNumber ? <span className="text-[#8a94a8]">#{product.productNumber} </span> : null}
                {product.name}
              </span>
              <span className="mt-1 block h-1.5 rounded-full bg-[#e7eefb]">
                <span className="block h-full rounded-full bg-indigo-400" style={{ width: `${Math.max(share, 3)}%` }} />
              </span>
            </span>
            <span className="shrink-0 text-right">
              <span className="block text-sm font-semibold text-[#1c1917]">{product.outbound30d}</span>
              <span className="block text-[10px] text-[#8a94a8]">
                {showWeek ? `${product.outbound7d} this week` : `${share}% of clicks`}
              </span>
            </span>
          </li>
        )
      })}
    </ol>
  )
}
