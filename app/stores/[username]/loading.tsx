export default function StoreLoading() {
  return (
    <div className="min-h-screen">
      <div className="mx-auto w-full max-w-[430px] px-3 pb-6 pt-5 md:hidden">
        <div className="mx-auto h-20 w-20 animate-pulse rounded-full bg-slate-200" />
        <div className="mx-auto mt-3 h-7 w-44 animate-pulse rounded bg-slate-200" />
        <div className="mx-auto mt-2 h-3 w-72 max-w-[92%] animate-pulse rounded bg-slate-200" />
        <div className="mx-auto mt-5 h-11 w-[265px] animate-pulse rounded-full bg-slate-200" />

        <div className="mt-5 h-12 w-full animate-pulse rounded-full bg-slate-200" />

        <div className="mt-5 grid grid-cols-2 gap-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
              <div className="aspect-square animate-pulse bg-slate-200" />
              <div className="h-10 animate-pulse bg-slate-100" />
            </div>
          ))}
        </div>
      </div>

      <div className="hidden min-h-screen px-4 pb-8 pt-3 md:block">
        <div className="mb-4 flex items-center justify-between">
          <div className="h-9 w-44 animate-pulse rounded bg-slate-200" />
          <div className="flex items-center gap-2">
            <div className="h-9 w-64 animate-pulse rounded-md bg-slate-200" />
            <div className="h-9 w-20 animate-pulse rounded-md bg-slate-200" />
          </div>
        </div>

        <div className="mb-3 h-7 w-36 animate-pulse rounded bg-slate-200" />
        <div className="mb-2 h-4 w-24 animate-pulse rounded bg-slate-200" />
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={i} className="overflow-hidden rounded-xl border border-slate-200 bg-white">
              <div className="aspect-[4/5] animate-pulse bg-slate-200" />
              <div className="h-12 animate-pulse bg-slate-100" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
