export default function DashboardLoading() {
  return (
    <div className="flex-1 bg-[#eef3fb] px-6 py-6">
      <div className="mb-5 animate-pulse">
        <div className="mb-2 h-5 w-40 rounded bg-[#dbe6f8]" />
        <div className="h-4 w-72 rounded bg-[#e6eefb]" />
      </div>

      <div className="mb-6 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-28 animate-pulse rounded-xl border border-[#d8e2f3] bg-white" />
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.55fr_1fr]">
        <div className="h-64 animate-pulse rounded-xl border border-[#d8e2f3] bg-white" />
        <div className="h-64 animate-pulse rounded-xl border border-[#d8e2f3] bg-white" />
      </div>
    </div>
  )
}
