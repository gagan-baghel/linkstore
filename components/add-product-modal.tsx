"use client"

import { useEffect, useMemo, useState } from "react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { PlusCircle } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { ProductForm } from "@/components/product-form"

interface AddProductModalProps {
  triggerLabel?: string
  triggerClassName?: string
  triggerVariant?: "default" | "outline" | "ghost" | "secondary"
  openOnLoad?: boolean
  onProductsCreated?: (count: number) => void
}

export function AddProductModal({
  triggerLabel = "Add Product",
  triggerClassName,
  triggerVariant = "default",
  openOnLoad = false,
  onProductsCreated,
}: AddProductModalProps) {
  const [open, setOpen] = useState(false)
  const searchParams = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()

  const hasAddParam = useMemo(() => searchParams.get("add") === "1", [searchParams])

  useEffect(() => {
    if (openOnLoad && hasAddParam) {
      setOpen(true)
    }
  }, [openOnLoad, hasAddParam])

  function clearAddParam() {
    if (!hasAddParam) return
    const params = new URLSearchParams(searchParams.toString())
    params.delete("add")
    const next = params.toString()
    router.replace(next ? `${pathname}?${next}` : pathname, { scroll: false })
  }

  function handleOpenChange(nextOpen: boolean) {
    setOpen(nextOpen)
    if (!nextOpen) {
      clearAddParam()
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <Button variant={triggerVariant} className={triggerClassName} onClick={() => setOpen(true)}>
        <PlusCircle className="mr-2 h-4 w-4" />
        {triggerLabel}
      </Button>
      <DialogContent className="max-w-3xl border-slate-200 bg-white text-slate-900">
        <DialogHeader>
          <DialogTitle>Add product</DialogTitle>
        </DialogHeader>
        <ProductForm
          redirectTo={null}
          onProductsCreated={(count) => {
            onProductsCreated?.(count)
            setOpen(false)
            clearAddParam()
          }}
        />
      </DialogContent>
    </Dialog>
  )
}
