import type { Metadata } from "next"
import { format } from "date-fns"
import { MousePointerClick, Package, Store, Users } from "lucide-react"
import { redirect } from "next/navigation"

import { getSafeServerSession } from "@/lib/auth"
import { DashboardShell } from "@/components/dashboard-shell"
import { ClicksChart } from "@/components/clicks-chart"
import { DailyClicksChart } from "@/components/daily-clicks-chart"
import { ReferrerChart } from "@/components/referrer-chart"
import { Overview } from "@/components/overview"
import { convexQuery } from "@/lib/convex"
import { Alert, AlertDescription } from "@/components/ui/alert"

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

  const totalProducts = analytics?.totalProducts || 0
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

  const totalDeviceTraffic = deviceChartData.reduce((sum: number, item: any) => sum + Number(item.value || 0), 0)
  const summaryCardClassName =
    "app-reveal app-surface content-auto min-w-0 rounded-[1.15rem] border border-[#d8e2f3] bg-white p-3 shadow-[0_10px_26px_rgba(87,107,149,0.08)] md:rounded-xl md:p-4"
  const sectionCardClassName =
    "app-reveal app-surface content-auto min-w-0 rounded-[1.2rem] border border-[#d8e2f3] bg-white p-3 shadow-[0_10px_26px_rgba(87,107,149,0.08)] md:col-span-2 md:rounded-xl md:p-5"

  return (
    <DashboardShell>
      {hasDataError && (
        <Alert variant="destructive" className="mb-4">
          <AlertDescription>Analytics data is temporarily unavailable. Please refresh in a few seconds.</AlertDescription>
        </Alert>
      )}
      <div className="grid min-w-0 grid-cols-2 gap-2.5 md:grid-cols-2 lg:grid-cols-4">
        <div className={summaryCardClassName}>
          <div className="mb-2 flex items-center justify-between md:mb-3">
            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#5f6b7e]">Total Products</p>
            <Package className="h-4 w-4 text-[#8a94a8]" />
          </div>
          <div className="text-[1.15rem] font-semibold tracking-tight text-[#1c1917] md:text-2xl">{totalProducts}</div>
          <p className="mt-1 text-[10px] leading-4 text-[#8a94a8] md:text-xs">
            {totalProducts === 0 ? "Add your first product" : `${totalProducts} products in your store`}
          </p>
        </div>
        <div className={summaryCardClassName}>
          <div className="mb-2 flex items-center justify-between md:mb-3">
            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#5f6b7e]">Store Views (30d)</p>
            <Store className="h-4 w-4 text-[#8a94a8]" />
          </div>
          <div className="text-[1.15rem] font-semibold tracking-tight text-[#1c1917] md:text-2xl">{storeViews30}</div>
          <p className="mt-1 text-[10px] leading-4 text-[#8a94a8] md:text-xs">Top of funnel audience reach</p>
        </div>
        <div className={summaryCardClassName}>
          <div className="mb-2 flex items-center justify-between md:mb-3">
            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#5f6b7e]">Card Clicks (30d)</p>
            <MousePointerClick className="h-4 w-4 text-[#8a94a8]" />
          </div>
          <div className="text-[1.15rem] font-semibold tracking-tight text-[#1c1917] md:text-2xl">{productCardClicks30}</div>
          <p className="mt-1 text-[10px] leading-4 text-[#8a94a8] md:text-xs">Product intent signals</p>
        </div>
        <div className={summaryCardClassName}>
          <div className="mb-2 flex items-center justify-between md:mb-3">
            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#5f6b7e]">Leads Captured (30d)</p>
            <Users className="h-4 w-4 text-[#8a94a8]" />
          </div>
          <div className="text-[1.15rem] font-semibold tracking-tight text-[#1c1917] md:text-2xl">{leadsCount30}</div>
          <p className="mt-1 text-[10px] leading-4 text-[#8a94a8] md:text-xs">Owned audience from your storefront</p>
        </div>
      </div>
      <div className="mt-4 grid min-w-0 gap-3 md:mt-6 md:grid-cols-2 lg:grid-cols-7">
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
      <div className="mt-4 grid min-w-0 gap-3 md:mt-6">
        <div className={sectionCardClassName}>
          <h2 className="mb-1 text-sm font-semibold text-[#1c1917]">Daily Clicks</h2>
          <p className="mb-4 text-xs text-[#8a94a8]">Click trends over the last 30 days</p>
          <div className="min-w-0 pl-2">
            <DailyClicksChart data={dailyClicksData} />
          </div>
        </div>
      </div>
      <div className="mt-4 grid min-w-0 gap-3 md:mt-6 md:grid-cols-2 lg:grid-cols-7">
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
      <div className="mt-4 grid min-w-0 gap-3 md:mt-6 md:grid-cols-2 lg:grid-cols-7">
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
      <div className="mt-4 grid min-w-0 gap-3 md:mt-6 md:grid-cols-2 lg:grid-cols-7">
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
      <div className="mt-4 grid min-w-0 gap-3 md:mt-6 md:grid-cols-2 lg:grid-cols-7">
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
      <div className="mt-4 grid min-w-0 gap-3 md:mt-6">
        <div className={sectionCardClassName}>
          <h2 className="mb-1 text-sm font-semibold text-[#1c1917]">Clicks by Product</h2>
          <p className="mb-4 text-xs text-[#8a94a8]">Click distribution across your products</p>
          <div className="min-w-0 pl-2">
            <ClicksChart data={productClicksData} />
          </div>
        </div>
      </div>
      <div className="mt-4 grid min-w-0 gap-3 md:mt-6">
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
