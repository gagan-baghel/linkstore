export default function StoreLoading() {
  return (
    <div className="container py-10">
      <div className="mb-6 h-8 w-56 animate-pulse rounded bg-muted" />
      <div className="mb-10 h-48 w-full animate-pulse rounded-xl bg-muted" />
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-40 animate-pulse rounded-xl bg-muted" />
        ))}
      </div>
    </div>
  )
}
