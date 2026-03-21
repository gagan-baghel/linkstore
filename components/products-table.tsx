"use client"

import { useEffect, useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Archive, Copy, Edit, ExternalLink, MoreVertical, Trash, Undo2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "@/components/ui/use-toast"
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

interface Product {
  _id: string
  title: string
  affiliateUrl: string
  category?: string
  images: string[]
  createdAt: string | number
  updatedAt?: string | number
  isArchived?: boolean
  isLinkHealthy?: boolean
  lastLinkStatus?: number
}

interface ProductsTableProps {
  products: Product[]
}

export function ProductsTable({ products }: ProductsTableProps) {
  const router = useRouter()
  const [localProducts, setLocalProducts] = useState(products)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [isQuickEditOpen, setIsQuickEditOpen] = useState(false)
  const [productToDelete, setProductToDelete] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [isUpdating, setIsUpdating] = useState(false)
  const [activeProductId, setActiveProductId] = useState<string | null>(null)
  const [quickTitle, setQuickTitle] = useState("")
  const [quickCategory, setQuickCategory] = useState("General")
  const [quickAffiliateUrl, setQuickAffiliateUrl] = useState("")

  useEffect(() => {
    setLocalProducts(products)
  }, [products])

  function openQuickEdit(product: Product) {
    setActiveProductId(product._id)
    setQuickTitle(product.title)
    setQuickCategory(product.category || "General")
    setQuickAffiliateUrl(product.affiliateUrl)
    setIsQuickEditOpen(true)
  }

  async function refreshWithSuccess(title: string, description: string) {
    toast({ title, description })
    router.refresh()
  }

  async function handleDuplicate(productId: string) {
    try {
      setIsUpdating(true)
      const response = await fetch(`/api/products/${productId}/duplicate`, { method: "POST" })
      if (!response.ok) throw new Error("Failed to duplicate product")
      await refreshWithSuccess("Duplicated", "A copy was created and saved as archived draft.")
    } catch (error) {
      console.error(error)
      toast({ title: "Error", description: "Failed to duplicate product", variant: "destructive" })
    } finally {
      setIsUpdating(false)
    }
  }

  async function handleArchiveToggle(product: Product) {
    try {
      setIsUpdating(true)
      const response = await fetch(`/api/products/${product._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isArchived: !(product.isArchived === true) }),
      })
      if (!response.ok) throw new Error("Failed to update archive state")
      await refreshWithSuccess(
        product.isArchived ? "Unarchived" : "Archived",
        product.isArchived ? "Product is now visible in the storefront." : "Product is hidden from the storefront.",
      )
    } catch (error) {
      console.error(error)
      toast({ title: "Error", description: "Failed to update product", variant: "destructive" })
    } finally {
      setIsUpdating(false)
    }
  }

  async function handleQuickEditSave() {
    if (!activeProductId) return
    try {
      setIsUpdating(true)
      const response = await fetch(`/api/products/${activeProductId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: quickTitle,
          category: quickCategory,
          affiliateUrl: quickAffiliateUrl,
        }),
      })

      if (!response.ok) throw new Error("Failed to update product")

      await refreshWithSuccess("Saved", "Product details updated.")
      setIsQuickEditOpen(false)
      setActiveProductId(null)
    } catch (error) {
      console.error(error)
      toast({ title: "Error", description: "Failed to save quick edits", variant: "destructive" })
    } finally {
      setIsUpdating(false)
    }
  }

  const handleDelete = async () => {
    if (!productToDelete) return

    setIsDeleting(true)

    try {
      const response = await fetch(`/api/products/${productToDelete}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        const errorPayload = await response.json().catch(() => ({}))
        throw new Error(errorPayload.message || "Failed to delete product")
      }

      setLocalProducts((prev) => prev.filter((item) => item._id !== productToDelete))

      toast({
        title: "Deleted",
        description: "Product deleted successfully.",
      })

      router.refresh()
    } catch (error) {
      console.error(error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to delete product",
        variant: "destructive",
      })
    } finally {
      setIsDeleting(false)
      setIsDeleteDialogOpen(false)
      setProductToDelete(null)
    }
  }

  return (
    <>
      <div className="grid gap-3 md:hidden">
        {localProducts.map((product, index) => {
          const isArchived = product.isArchived === true
          const isHealthy = product.isLinkHealthy !== false
          const showBroken = !isArchived && !isHealthy
          const productImage = product.images?.[0] || "/placeholder.svg?height=96&width=96"

          return (
            <div
              key={product._id.toString()}
              className="app-reveal app-surface content-auto rounded-[1.2rem] border border-slate-200 bg-white p-3 shadow-[0_10px_24px_rgba(87,107,149,0.08)]"
              style={{ animationDelay: `${Math.min(index, 7) * 40}ms` }}
            >
              <div className="flex items-start gap-3">
                <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-xl border border-slate-200 bg-slate-100">
                  <Image src={productImage} alt={product.title} fill className="object-cover" sizes="56px" unoptimized />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-start gap-2">
                    <div className="min-w-0 flex-1">
                      <p className="line-clamp-2 text-[13px] font-semibold leading-5 text-slate-900">{product.title}</p>
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        <span className="inline-flex items-center rounded-full border border-slate-200 bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-700">
                          {product.category || "General"}
                        </span>
                        {isArchived ? (
                          <span className="inline-flex items-center rounded-full border border-slate-200 bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-600">
                            Archived
                          </span>
                        ) : showBroken ? (
                          <span className="inline-flex items-center rounded-full border border-rose-200 bg-rose-50 px-2 py-0.5 text-[10px] font-medium text-rose-700">
                            {product.lastLinkStatus ? `Broken ${product.lastLinkStatus}` : "Broken"}
                          </span>
                        ) : (
                          <span className="inline-flex items-center rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[10px] font-medium text-emerald-700">
                            Active
                          </span>
                        )}
                      </div>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          className="h-8 w-8 shrink-0 rounded-full border border-slate-200 bg-white p-0 text-slate-700 shadow-none hover:bg-slate-100 hover:text-slate-900"
                          disabled={isUpdating}
                        >
                          <span className="sr-only">Open menu</span>
                          <MoreVertical className="h-4 w-4 text-slate-700" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem asChild>
                          <Link href={`/dashboard/products/${product._id.toString()}/edit`} className="flex items-center">
                            <Edit className="mr-2 h-4 w-4" /> Full Edit
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => openQuickEdit(product)} className="flex items-center">
                          <Edit className="mr-2 h-4 w-4" /> Quick Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleDuplicate(product._id)} className="flex items-center">
                          <Copy className="mr-2 h-4 w-4" /> Duplicate
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleArchiveToggle(product)} className="flex items-center">
                          {isArchived ? (
                            <>
                              <Undo2 className="mr-2 h-4 w-4" /> Unarchive
                            </>
                          ) : (
                            <>
                              <Archive className="mr-2 h-4 w-4" /> Archive
                            </>
                          )}
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => {
                            setProductToDelete(product._id.toString())
                            setIsDeleteDialogOpen(true)
                          }}
                          className="flex items-center text-destructive focus:text-destructive"
                        >
                          <Trash className="mr-2 h-4 w-4" /> Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                  <a
                    href={product.affiliateUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-3 flex items-center gap-1 text-[11px] text-slate-600 hover:text-slate-900 hover:underline"
                  >
                    <span className="truncate">{product.affiliateUrl}</span>
                    <ExternalLink className="h-3.5 w-3.5 shrink-0" />
                  </a>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      <div className="app-reveal content-auto hidden overflow-hidden rounded-lg border border-slate-200 bg-white md:block">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50">
                <th className="w-64 px-3 py-2.5 text-left text-[10px] font-semibold uppercase tracking-wide text-slate-500 sm:px-4 sm:py-3 sm:text-[11px]">Title</th>
                <th className="w-36 px-3 py-2.5 text-left text-[10px] font-semibold uppercase tracking-wide text-slate-500 sm:px-4 sm:py-3 sm:text-[11px]">Category</th>
                <th className="w-56 px-3 py-2.5 text-left text-[10px] font-semibold uppercase tracking-wide text-slate-500 sm:px-4 sm:py-3 sm:text-[11px]">Affiliate URL</th>
                <th className="w-36 px-3 py-2.5 text-left text-[10px] font-semibold uppercase tracking-wide text-slate-500 sm:px-4 sm:py-3 sm:text-[11px]">Status</th>
                <th className="w-32 px-3 py-2.5 text-right text-[10px] font-semibold uppercase tracking-wide text-slate-500 sm:px-4 sm:py-3 sm:text-[11px]">Actions</th>
              </tr>
            </thead>
            <tbody>
            {localProducts.map((product) => {
              const isArchived = product.isArchived === true
              const isHealthy = product.isLinkHealthy !== false
              const showBroken = !isArchived && !isHealthy
              const productImage = product.images?.[0] || "/placeholder.svg?height=96&width=96"

              return (
                <tr key={product._id.toString()} className="border-b border-slate-100 hover:bg-slate-50/70 last:border-0">
                  <td className="px-3 py-2.5 align-middle sm:px-4 sm:py-3">
                    <div className="flex items-center gap-3">
                      <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-lg border border-slate-200 bg-slate-100">
                        <Image src={productImage} alt={product.title} fill className="object-cover" sizes="48px" unoptimized />
                      </div>
                      <div className="min-w-0">
                        <div className="line-clamp-1 text-xs font-medium text-slate-900 sm:text-sm">{product.title}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-3 py-2.5 align-middle sm:px-4 sm:py-3">
                    <span className="inline-flex items-center rounded-md border border-slate-200 bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-700 sm:text-xs">
                      {product.category || "General"}
                    </span>
                  </td>
                  <td className="max-w-56 truncate px-3 py-2.5 align-middle text-xs sm:px-4 sm:py-3">
                    <a
                      href={product.affiliateUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center text-slate-700 hover:text-slate-900 hover:underline"
                    >
                      <span className="truncate">{product.affiliateUrl}</span>
                      <ExternalLink className="ml-1 h-3 w-3" />
                    </a>
                  </td>
                  <td className="px-3 py-2.5 align-middle sm:px-4 sm:py-3">
                    {isArchived ? (
                      <span className="inline-flex items-center rounded-md border border-slate-200 bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-600 sm:text-xs">
                        Archived
                      </span>
                    ) : showBroken ? (
                      <span className="inline-flex items-center rounded-md border border-rose-200 bg-rose-50 px-2 py-0.5 text-[11px] font-medium text-rose-700 sm:text-xs">
                        {product.lastLinkStatus ? `Broken (${product.lastLinkStatus})` : "Broken"}
                      </span>
                    ) : (
                      <span className="inline-flex items-center rounded-md border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-700 sm:text-xs">
                        Active
                      </span>
                    )}
                  </td>
                  <td className="px-3 py-2.5 text-right align-middle sm:px-4 sm:py-3">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          className="h-8 w-8 rounded-md border border-slate-200 bg-white p-0 text-slate-700 shadow-none hover:bg-slate-100 hover:text-slate-900"
                          disabled={isUpdating}
                        >
                          <span className="sr-only">Open menu</span>
                          <MoreVertical className="h-4 w-4 text-slate-700" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem asChild>
                          <Link href={`/dashboard/products/${product._id.toString()}/edit`} className="flex items-center">
                            <Edit className="mr-2 h-4 w-4" /> Full Edit
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => openQuickEdit(product)} className="flex items-center">
                          <Edit className="mr-2 h-4 w-4" /> Quick Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleDuplicate(product._id)} className="flex items-center">
                          <Copy className="mr-2 h-4 w-4" /> Duplicate
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleArchiveToggle(product)} className="flex items-center">
                          {isArchived ? (
                            <>
                              <Undo2 className="mr-2 h-4 w-4" /> Unarchive
                            </>
                          ) : (
                            <>
                              <Archive className="mr-2 h-4 w-4" /> Archive
                            </>
                          )}
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => {
                            setProductToDelete(product._id.toString())
                            setIsDeleteDialogOpen(true)
                          }}
                          className="flex items-center text-destructive focus:text-destructive"
                        >
                          <Trash className="mr-2 h-4 w-4" /> Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </td>
                </tr>
              )
            })}
            </tbody>
          </table>
        </div>
      </div>

      <Dialog open={isQuickEditOpen} onOpenChange={setIsQuickEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Quick Edit Product</DialogTitle>
            <DialogDescription>Update essential fields without leaving the table.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-1">
            <div className="space-y-1.5">
              <Label htmlFor="quick-title">Title</Label>
              <Input id="quick-title" value={quickTitle} onChange={(e) => setQuickTitle(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="quick-category">Category</Label>
              <Input id="quick-category" value={quickCategory} onChange={(e) => setQuickCategory(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="quick-affiliate-url">Affiliate URL</Label>
              <Input
                id="quick-affiliate-url"
                value={quickAffiliateUrl}
                onChange={(e) => setQuickAffiliateUrl(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsQuickEditOpen(false)} disabled={isUpdating}>
              Cancel
            </Button>
            <Button onClick={handleQuickEditSave} disabled={isUpdating}>
              {isUpdating ? "Saving..." : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this product?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This product will be removed permanently.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground"
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
