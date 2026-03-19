export default function DashboardLoading() {
  return (
    <div className="flex-1 bg-transparent px-2.5 py-2.5 sm:px-4 sm:py-4 md:px-6 md:py-6">
      <div className="mx-auto w-full max-w-[28rem] animate-pulse sm:max-w-none">
        <div className="mb-4">
          <div className="mb-2 h-4 w-32 rounded bg-[#dbe6f8]" />
          <div className="h-3.5 w-52 rounded bg-[#e6eefb]" />
        </div>

        <div className="mb-4 grid grid-cols-2 gap-2.5 md:mb-6 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-24 rounded-[1.25rem] border border-[#d8e2f3] bg-white" />
          ))}
        </div>

        <div className="grid gap-3 lg:grid-cols-[1.55fr_1fr]">
          <div className="h-60 rounded-[1.35rem] border border-[#d8e2f3] bg-white" />
          <div className="h-52 rounded-[1.35rem] border border-[#d8e2f3] bg-white" />
        </div>
      </div>
    </div>
  )
}
