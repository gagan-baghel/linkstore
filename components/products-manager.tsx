"use client"

import { useMemo, useState } from "react"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { Copy, Eye, EyeOff, Link2, MoreHorizontal, Pin, PinOff, Search, Trash } from "lucide-react"

import { EditProductModal } from "@/components/edit-product-modal"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { toast } from "@/components/ui/use-toast"
import { matchesProductQuery } from "@/lib/product-number"
import { cn } from "@/lib/utils"

export interface ManagedProduct {
  _id: string
  title: string
  affiliateUrl: string
  category: string
  images: string[]
  price?: string
  description?: string
  productNumber?: number
  isPinned: boolean
  clicks30d: number
  isArchived: boolean
  isLinkHealthy: boolean
  updatedAt?: number
  createdAt: number
}

const FILTERS = [
  { id: "all", label: "All", test: () => true },
  { id: "live", label: "Live", test: (p: ManagedProduct) => !p.isArchived && p.isLinkHealthy },
  { id: "pinned", label: "Pinned", test: (p: ManagedProduct) => p.isPinned },
  { id: "hidden", label: "Hidden", test: (p: ManagedProduct) => p.isArchived },
  { id: "broken", label: "Broken", test: (p: ManagedProduct) => !p.isLinkHealthy },
] as const

type FilterId = (typeof FILTERS)[number]["id"]

export function ProductsManager({ products, storeUrl }: { products: ManagedProduct[]; storeUrl: string }) {
  const router = useRouter()
  const [query, setQuery] = useState("")
  const [filter, setFilter] = useState<FilterId>("all")
  const [sortBy, setSortBy] = useState<"newest" | "clicks">("newest")
  const [busyId, setBusyId] = useState<string | null>(null)
  const [pendingDelete, setPendingDelete] = useState<ManagedProduct | null>(null)

  const counts = useMemo(
    () => Object.fromEntries(FILTERS.map((f) => [f.id, products.filter(f.test).length])) as Record<FilterId, number>,
    [products],
  )
  const visible = useMemo(() => {
    const activeFilter = FILTERS.find((f) => f.id === filter) ?? FILTERS[0]
    return products
      .filter((product) => activeFilter.test(product) && matchesProductQuery(product, query))
      .sort((a, b) =>
        sortBy === "clicks"
          ? b.clicks30d - a.clicks30d || b.createdAt - a.createdAt
          : Number(b.isPinned) - Number(a.isPinned) || b.createdAt - a.createdAt,
      )
  }, [products, filter, query, sortBy])

  async function run(product: ManagedProduct, request: () => Promise<Response>, success: string) {
    setBusyId(product._id)
    try {
      const response = await request()
      if (!response.ok) {
        const data = await response.json().catch(() => ({}))
        throw new Error(data.message || "Something went wrong")
      }
      toast({ title: success })
      router.refresh()
    } catch (error) {
      toast({
        title: "Couldn't update product",
        description: error instanceof Error ? error.message : undefined,
        variant: "destructive",
      })
    } finally {
      setBusyId(null)
    }
  }

  const patch = (product: ManagedProduct, body: Record<string, boolean>, success: string) =>
    run(
      product,
      () =>
        fetch(`/api/products/${product._id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        }),
      success,
    )

  async function copyShortLink(product: ManagedProduct) {
    if (!storeUrl || !product.productNumber) return
    const link = `${storeUrl.replace(/\/$/, "")}/${product.productNumber}`
    try {
      await navigator.clipboard.writeText(link)
      toast({ title: "Short link copied", description: link })
    } catch {
      toast({ title: "Copy this link", description: link })
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full sm:max-w-xs">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search by name, #number, category"
            aria-label="Search products"
            className="h-10 rounded-md border-slate-200 bg-white pl-9 text-sm sm:h-10 sm:pl-9"
          />
        </div>
        <div className="-mx-1 flex items-center gap-5 overflow-x-auto px-1" role="tablist" aria-label="Filter products">
          {FILTERS.map((f) => (
            <button
              key={f.id}
              type="button"
              role="tab"
              aria-selected={filter === f.id}
              onClick={() => setFilter(f.id)}
              className={cn(
                "shrink-0 border-b-2 py-2 text-sm font-medium transition-colors",
                filter === f.id ? "border-slate-900 text-slate-900" : "border-transparent text-slate-500 hover:text-slate-800",
              )}
            >
              {f.label} <span className="text-xs text-slate-400">{counts[f.id]}</span>
            </button>
          ))}
          <select
            value={sortBy}
            onChange={(event) => setSortBy(event.target.value as "newest" | "clicks")}
            aria-label="Sort products"
            className="shrink-0 border-0 bg-transparent py-2 text-sm font-medium text-slate-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-300"
          >
            <option value="newest">Newest</option>
            <option value="clicks">Top clicks</option>
          </select>
        </div>
      </div>

      {counts.broken > 0 && filter !== "broken" ? (
        <button
          type="button"
          onClick={() => setFilter("broken")}
          className="w-full border-l-2 border-rose-500 bg-rose-50/60 px-4 py-2.5 text-left text-sm text-rose-700"
        >
          {counts.broken} product link{counts.broken === 1 ? " is" : "s are"} broken and hidden from your store. Review now →
        </button>
      ) : null}

      {visible.length === 0 ? (
        <div className="border-t border-slate-200 px-6 py-12 text-center">
          <p className="text-sm font-semibold text-slate-900">No products match</p>
          <p className="mt-1 text-xs text-slate-500">Try a different search or filter.</p>
        </div>
      ) : (
        <ul className="divide-y divide-slate-200/80 border-y border-slate-200/80">
          {visible.map((product) => (
            <li
              key={product._id}
              className={cn(
                "flex gap-4 py-4 transition-colors",
                product.isArchived && "opacity-70",
                busyId === product._id && "pointer-events-none opacity-50",
              )}
            >
              <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-md bg-slate-100 sm:h-16 sm:w-16">
                <Image
                  src={product.images?.[0] || "/placeholder.jpg"}
                  alt=""
                  fill
                  unoptimized
                  sizes="96px"
                  className={cn("object-cover", product.isArchived && "opacity-60 grayscale")}
                />
                {product.productNumber ? (
                  <span className="absolute left-0 top-0 rounded-br-md bg-black/75 px-1.5 py-0.5 text-[10px] font-bold text-white">
                    #{product.productNumber}
                  </span>
                ) : null}
              </div>
              <div className="flex min-w-0 flex-1 flex-col justify-center gap-1 sm:flex-row sm:items-center sm:gap-6">
                <div className="min-w-0 flex-1">
                  <p className="line-clamp-2 text-sm font-semibold leading-snug text-slate-900 sm:line-clamp-1">{product.title}</p>
                  <p className="mt-0.5 flex flex-wrap items-center gap-x-2 text-xs text-slate-500">
                    <span className="inline-flex items-center gap-1.5">
                      <span
                        className={cn(
                          "h-1.5 w-1.5 rounded-full",
                          !product.isLinkHealthy ? "bg-rose-500" : product.isArchived ? "bg-slate-300" : "bg-emerald-500",
                        )}
                      />
                      {!product.isLinkHealthy ? "Broken link" : product.isArchived ? "Hidden" : "Live"}
                    </span>
                    <span className="text-slate-300">/</span>
                    <span>{product.category}</span>
                    {product.price ? (
                      <>
                        <span className="text-slate-300">/</span>
                        <span className="font-medium text-slate-700">{product.price}</span>
                      </>
                    ) : null}
                    {product.isPinned ? (
                      <span className="inline-flex items-center gap-0.5 font-medium text-amber-600">
                        <Pin className="h-3 w-3" /> Pinned
                      </span>
                    ) : null}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-4">
                  <div className="text-left sm:w-20 sm:text-right" title="Clicks to the retailer in the last 30 days">
                    <span className="text-base font-semibold tabular-nums text-slate-900">{product.clicks30d}</span>
                    <span className="ml-1 text-[11px] text-slate-500 sm:ml-0 sm:block">clicks · 30d</span>
                  </div>
                  <div className="ml-auto flex items-center gap-1 sm:ml-0">
                    <EditProductModal
                      product={product}
                      triggerLabel="Edit"
                      triggerVariant="ghost"
                      triggerClassName="h-8 px-2.5 text-xs text-slate-700 hover:bg-slate-100"
                    />
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0 text-slate-500 hover:text-slate-900" aria-label={`Actions for ${product.title}`}>
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-52">
                      <DropdownMenuItem
                        onSelect={() => patch(product, { isPinned: !product.isPinned }, product.isPinned ? "Unpinned" : "Pinned to the top")}
                      >
                        {product.isPinned ? <PinOff className="mr-2 h-4 w-4" /> : <Pin className="mr-2 h-4 w-4" />}
                        {product.isPinned ? "Unpin" : "Pin to top"}
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onSelect={() =>
                          patch(product, { isArchived: !product.isArchived }, product.isArchived ? "Now live on your store" : "Hidden from your store")
                        }
                      >
                        {product.isArchived ? <Eye className="mr-2 h-4 w-4" /> : <EyeOff className="mr-2 h-4 w-4" />}
                        {product.isArchived ? "Show on store" : "Hide from store"}
                      </DropdownMenuItem>
                      {storeUrl && product.productNumber ? (
                        <DropdownMenuItem onSelect={() => copyShortLink(product)}>
                          <Link2 className="mr-2 h-4 w-4" />
                          Copy short link
                        </DropdownMenuItem>
                      ) : null}
                      <DropdownMenuItem
                        onSelect={() =>
                          run(product, () => fetch(`/api/products/${product._id}/duplicate`, { method: "POST" }), "Duplicated as a hidden draft")
                        }
                      >
                        <Copy className="mr-2 h-4 w-4" />
                        Duplicate
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem className="text-rose-600 focus:text-rose-600" onSelect={() => setPendingDelete(product)}>
                        <Trash className="mr-2 h-4 w-4" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                  </div>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}

      <AlertDialog open={pendingDelete !== null} onOpenChange={(open) => !open && setPendingDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this product?</AlertDialogTitle>
            <AlertDialogDescription>
              &ldquo;{pendingDelete?.title}&rdquo; and its click history will be permanently removed. To keep the stats, hide it
              instead.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-rose-600 hover:bg-rose-700"
              onClick={() => {
                const product = pendingDelete
                setPendingDelete(null)
                if (product) void run(product, () => fetch(`/api/products/${product._id}`, { method: "DELETE" }), "Product deleted")
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
