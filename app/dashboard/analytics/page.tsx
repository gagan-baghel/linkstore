import type { Metadata } from "next"
import { format } from "date-fns"
import { MousePointerClick, Store, Users } from "lucide-react"
import { redirect } from "next/navigation"

import { getSafeServerSession } from "@/lib/auth"
import { DashboardShell } from "@/components/dashboard-shell"
import { ClicksChart } from "@/components/clicks-chart"
import { DailyClicksChart } from "@/components/daily-clicks-chart"
import { ReferrerChart } from "@/components/referrer-chart"
import { Overview } from "@/components/overview"
import { convexQuery } from "@/lib/convex"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { InsightsList, TopPerformersList } from "@/components/performance-insights"
import { buildInsights, getTopPerformers, type ProductPerformance } from "@/lib/insights"

export const metadata: Metadata = {
  title: "Analytics - Linkstore",
  description: "Track your affiliate link performance",
}

export default async function AnalyticsPage() {
  const session = await getSafeServerSession()

  if (!session) {
    redirect("/auth/login")
  }

  let analytics: any = null
  let hasDataError = false
  try {
    analytics = await convexQuery<{ userId: string }, any>("analytics:getAnalyticsData", {
      userId: session.user.id,
    })
  } catch (error) {
    console.error("Analytics page load error:", error)
    hasDataError = true
  }

  const totalClicks = analytics?.totalClicks || 0
  const recentClicks = analytics?.recentClicks || 0
  const last30DaysClicks = analytics?.last30DaysClicks || 0
  const storeViews30 = analytics?.storeViews30 || 0
  const productCardClicks30 = analytics?.productCardClicks30 || 0
  const productClicksData = analytics?.productClicksData || []
  const dailyClicksData =
    analytics?.dailyClicksData?.map((item: any) => ({
      date: format(new Date(item.date), "MMM dd"),
      clicks: item.clicks,
    })) || []
  const sourceChartData = analytics?.sourceChartData || []
  const deviceChartData = analytics?.deviceChartData || []
  const campaignChartData = analytics?.campaignChartData || []
  const browserChartData = analytics?.browserChartData || []
  const osChartData = analytics?.osChartData || []
  const countryChartData = analytics?.countryChartData || []
  const cityChartData = analytics?.cityChartData || []
  const collectionPerformanceData = analytics?.collectionPerformanceData || []
  const leadsByCollectionData = analytics?.leadsByCollectionData || []
  const funnelData = analytics?.funnelData || []
  const recentClicksData = analytics?.recentClicksData || []
  const leadsCount30 = analytics?.leadsCount30 || 0
  const performance: ProductPerformance[] = (analytics?.productPerformanceData || []).map((item: any) => ({
    ...item,
    id: String(item.id),
  }))
  const topPerformers = getTopPerformers(performance)
  const insights = buildInsights({
    products: performance,
    storeViews30,
    outboundClicks7: recentClicks,
    outboundClicks30: last30DaysClicks,
    sources: sourceChartData,
    devices: deviceChartData,
  })

  const totalDeviceTraffic = deviceChartData.reduce((sum: number, item: any) => sum + Number(item.value || 0), 0)
  // Open layout: stats read as a strip, sections are separated by hairlines, not boxed.
  const summaryCardClassName = "app-reveal min-w-0 px-0 lg:px-6 lg:first:pl-0"
  const sectionCardClassName = "app-reveal content-auto min-w-0 border-t border-[#e3e9f5] pt-5 md:col-span-2"

  return (
    <DashboardShell>
      {hasDataError && (
        <Alert variant="destructive" className="mb-4">
          <AlertDescription>Analytics data is temporarily unavailable. Please refresh in a few seconds.</AlertDescription>
        </Alert>
      )}
      <div className="grid min-w-0 grid-cols-2 gap-x-6 gap-y-6 lg:grid-cols-4 lg:divide-x lg:divide-[#e3e9f5]">
        <div className={summaryCardClassName}>
          <div className="mb-2 flex items-center justify-between md:mb-3">
            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#5f6b7e]">Product Clicks (30d)</p>
            <MousePointerClick className="h-4 w-4 text-[#8a94a8]" />
          </div>
          <div className="text-2xl font-semibold tracking-tight text-[#1c1917] tabular-nums md:text-3xl">{last30DaysClicks}</div>
          <p className="mt-1 text-[10px] leading-4 text-[#8a94a8] md:text-xs">
            {storeViews30 > 0
              ? `${((last30DaysClicks / storeViews30) * 100).toFixed(1)}% of store visits sent to a retailer`
              : "Shoppers sent to retailers"}
          </p>
        </div>
        <div className={summaryCardClassName}>
          <div className="mb-2 flex items-center justify-between md:mb-3">
            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#5f6b7e]">Store Views (30d)</p>
            <Store className="h-4 w-4 text-[#8a94a8]" />
          </div>
          <div className="text-2xl font-semibold tracking-tight text-[#1c1917] tabular-nums md:text-3xl">{storeViews30}</div>
          <p className="mt-1 text-[10px] leading-4 text-[#8a94a8] md:text-xs">Top of funnel audience reach</p>
        </div>
        <div className={summaryCardClassName}>
          <div className="mb-2 flex items-center justify-between md:mb-3">
            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#5f6b7e]">Card Clicks (30d)</p>
            <MousePointerClick className="h-4 w-4 text-[#8a94a8]" />
          </div>
          <div className="text-2xl font-semibold tracking-tight text-[#1c1917] tabular-nums md:text-3xl">{productCardClicks30}</div>
          <p className="mt-1 text-[10px] leading-4 text-[#8a94a8] md:text-xs">Product intent signals</p>
        </div>
        <div className={summaryCardClassName}>
          <div className="mb-2 flex items-center justify-between md:mb-3">
            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#5f6b7e]">Leads Captured (30d)</p>
            <Users className="h-4 w-4 text-[#8a94a8]" />
          </div>
          <div className="text-2xl font-semibold tracking-tight text-[#1c1917] tabular-nums md:text-3xl">{leadsCount30}</div>
          <p className="mt-1 text-[10px] leading-4 text-[#8a94a8] md:text-xs">Owned audience from your storefront</p>
        </div>
      </div>
      <div className="mt-10 grid min-w-0 gap-x-10 gap-y-10 md:grid-cols-2 lg:grid-cols-7">
        <div className={`${sectionCardClassName} lg:col-span-3`}>
          <h2 className="mb-1 text-sm font-semibold text-[#1c1917]">What to do next</h2>
          <p className="mb-3 text-xs text-[#8a94a8]">Based on your last 30 days</p>
          <InsightsList insights={insights} />
        </div>
        <div className={`${sectionCardClassName} lg:col-span-4`}>
          <h2 className="mb-1 text-sm font-semibold text-[#1c1917]">Best performers</h2>
          <p className="mb-3 text-xs text-[#8a94a8]">Products sending the most shoppers to retailers (30 days)</p>
          <TopPerformersList products={topPerformers} totalClicks={last30DaysClicks} />
        </div>
      </div>
      <div className="mt-10 grid min-w-0 gap-x-10 gap-y-10 md:grid-cols-2 lg:grid-cols-7">
        <div className={`${sectionCardClassName} lg:col-span-4`}>
          <h2 className="mb-4 text-sm font-semibold text-[#1c1917]">Overview</h2>
          <div className="min-w-0 pl-2">
            <Overview data={funnelData} />
          </div>
        </div>
        <div className={`${sectionCardClassName} lg:col-span-3`}>
          <h2 className="mb-1 text-sm font-semibold text-[#1c1917]">Recent Clicks</h2>
          <p className="mb-4 text-xs text-[#8a94a8]">
            {last30DaysClicks} clicks in the last 30 days, {recentClicks} in the last 7 days, {totalClicks} total
          </p>
          <div className="space-y-2">
            {recentClicksData.length === 0 ? (
              <div className="rounded-lg border border-[#e7eefb] px-3 py-2.5">
                <p className="text-sm font-medium text-[#1c1917]">No recent activity</p>
                <p className="text-xs text-[#8a94a8]">Add products to your store to get started</p>
              </div>
            ) : (
              recentClicksData.map((click: any) => (
                <div key={click._id.toString()} className="flex items-center gap-3 border-b border-[#edf3ff] py-2.5 last:border-0">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-50 text-xs font-semibold text-indigo-600">
                    {click.productId && typeof click.productId === "object" && click.productId.title
                      ? click.productId.title.charAt(0).toUpperCase()
                      : "?"}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-[#1c1917]">
                      {click.productId && typeof click.productId === "object" ? click.productId.title : "Unknown Product"}
                    </p>
                    <p className="font-mono text-xs text-[#8a94a8]">{format(new Date(click.createdAt), "MMM d, yyyy HH:mm")}</p>
                    <p className="text-[11px] text-[#8a94a8]">
                      {(click.source || "direct").toString()}
                      {click.collectionSlug ? ` • ${click.collectionSlug}` : ""}
                      {click.deviceName ? ` • ${click.deviceName}` : click.device ? ` • ${click.device}` : ""}
                      {click.browser ? ` • ${click.browser}` : ""}
                      {click.city || click.country ? ` • ${[click.city, click.country].filter(Boolean).join(", ")}` : ""}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
      <div className="mt-10 grid min-w-0 gap-x-10 gap-y-10">
        <div className={sectionCardClassName}>
          <h2 className="mb-1 text-sm font-semibold text-[#1c1917]">Daily Clicks</h2>
          <p className="mb-4 text-xs text-[#8a94a8]">Click trends over the last 30 days</p>
          <div className="min-w-0 pl-2">
            <DailyClicksChart data={dailyClicksData} />
          </div>
        </div>
      </div>
      <div className="mt-10 grid min-w-0 gap-x-10 gap-y-10 md:grid-cols-2 lg:grid-cols-7">
        <div className={`${sectionCardClassName} lg:col-span-4`}>
          <h2 className="mb-1 text-sm font-semibold text-[#1c1917]">Traffic Sources</h2>
          <p className="mb-4 text-xs text-[#8a94a8]">Campaign/source attribution for tracked events</p>
          <ReferrerChart data={sourceChartData} metricLabel="Events" />
        </div>
        <div className={`${sectionCardClassName} lg:col-span-3`}>
          <h2 className="mb-1 text-sm font-semibold text-[#1c1917]">Device Split</h2>
          <p className="mb-4 text-xs text-[#8a94a8]">Device breakdown from event tracking</p>
          {deviceChartData.length === 0 ? (
            <p className="text-sm text-[#8a94a8]">No device data yet.</p>
          ) : (
            <div>
              {deviceChartData.map((item: any) => {
                const pct = totalDeviceTraffic > 0 ? Math.round((Number(item.value || 0) / totalDeviceTraffic) * 100) : 0
                return (
                  <div key={item.name} className="mb-3">
                    <div className="mb-1 flex justify-between text-xs">
                      <span className="capitalize text-[#5f6b7e]">{item.name}</span>
                      <span className="font-medium text-[#1c1917]">{item.value}</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-[#e7eefb]">
                      <div className="h-full rounded-full bg-indigo-400" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
      <div className="mt-10 grid min-w-0 gap-x-10 gap-y-10 md:grid-cols-2 lg:grid-cols-7">
        <div className={`${sectionCardClassName} lg:col-span-3`}>
          <h2 className="mb-1 text-sm font-semibold text-[#1c1917]">Campaigns</h2>
          <p className="mb-4 text-xs text-[#8a94a8]">UTM campaign labels attached to tracked storefront traffic</p>
          <ReferrerChart data={campaignChartData} metricLabel="Events" />
        </div>
        <div className={`${sectionCardClassName} lg:col-span-4`}>
          <h2 className="mb-1 text-sm font-semibold text-[#1c1917]">Collection Performance</h2>
          <p className="mb-4 text-xs text-[#8a94a8]">Outbound clicks grouped by `collection` or post attribution</p>
          <div className="min-w-0 pl-2">
            <ClicksChart data={collectionPerformanceData} />
          </div>
        </div>
      </div>
      <div className="mt-10 grid min-w-0 gap-x-10 gap-y-10 md:grid-cols-2 lg:grid-cols-7">
        <div className={`${sectionCardClassName} lg:col-span-3`}>
          <h2 className="mb-1 text-sm font-semibold text-[#1c1917]">Browsers</h2>
          <p className="mb-4 text-xs text-[#8a94a8]">Approximate browser breakdown from tracked storefront activity</p>
          <ReferrerChart data={browserChartData} metricLabel="Visitors" />
        </div>
        <div className={`${sectionCardClassName} lg:col-span-4`}>
          <h2 className="mb-1 text-sm font-semibold text-[#1c1917]">Operating Systems</h2>
          <p className="mb-4 text-xs text-[#8a94a8]">OS split based on the visitor user agent</p>
          <ReferrerChart data={osChartData} metricLabel="Visitors" />
        </div>
      </div>
      <div className="mt-10 grid min-w-0 gap-x-10 gap-y-10 md:grid-cols-2 lg:grid-cols-7">
        <div className={`${sectionCardClassName} lg:col-span-3`}>
          <h2 className="mb-1 text-sm font-semibold text-[#1c1917]">Top Countries</h2>
          <p className="mb-4 text-xs text-[#8a94a8]">Approximate geo based on request headers from your hosting platform</p>
          <ReferrerChart data={countryChartData} metricLabel="Visitors" />
        </div>
        <div className={`${sectionCardClassName} lg:col-span-4`}>
          <h2 className="mb-1 text-sm font-semibold text-[#1c1917]">Top Cities</h2>
          <p className="mb-4 text-xs text-[#8a94a8]">Cities are approximate and depend on available edge location headers</p>
          <div className="min-w-0 pl-2">
            <ClicksChart data={cityChartData} metricLabel="Visitors" />
          </div>
        </div>
      </div>
      <div className="mt-10 grid min-w-0 gap-x-10 gap-y-10">
        <div className={sectionCardClassName}>
          <h2 className="mb-1 text-sm font-semibold text-[#1c1917]">Clicks by Product</h2>
          <p className="mb-4 text-xs text-[#8a94a8]">Click distribution across your products</p>
          <div className="min-w-0 pl-2">
            <ClicksChart data={productClicksData} />
          </div>
        </div>
      </div>
      <div className="mt-10 grid min-w-0 gap-x-10 gap-y-10">
        <div className={sectionCardClassName}>
          <h2 className="mb-1 text-sm font-semibold text-[#1c1917]">Leads by Collection</h2>
          <p className="mb-4 text-xs text-[#8a94a8]">Which attributed posts or drops are actually capturing contacts</p>
          <div className="min-w-0 pl-2">
            <ClicksChart data={leadsByCollectionData} metricLabel="Leads" />
          </div>
        </div>
      </div>
    </DashboardShell>
  )
}
