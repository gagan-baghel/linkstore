"use client"

import { useState } from "react"
import { Pencil } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { ProductForm } from "@/components/product-form"

interface EditProductModalProps {
  product: {
    _id: string
    title: string
    category?: string
    affiliateUrl: string
    images?: string[]
  }
  triggerLabel?: string
  triggerClassName?: string
  triggerVariant?: "default" | "outline" | "ghost" | "secondary"
}

export function EditProductModal({
  product,
  triggerLabel = "Edit",
  triggerClassName,
  triggerVariant = "outline",
}: EditProductModalProps) {
  const [open, setOpen] = useState(false)

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <Button variant={triggerVariant} className={triggerClassName} onClick={() => setOpen(true)}>
        <Pencil className="mr-2 h-4 w-4" />
        {triggerLabel}
      </Button>
      <DialogContent className="max-w-3xl border-slate-200 bg-white text-slate-900">
        <DialogHeader>
          <DialogTitle>Edit product</DialogTitle>
        </DialogHeader>
        <ProductForm
          isEditing
          initialData={{
            id: product._id,
            title: product.title,
            category: product.category,
            affiliateUrl: product.affiliateUrl,
            images: Array.isArray(product.images) ? product.images : [],
          }}
          redirectTo={null}
          onProductsCreated={() => setOpen(false)}
        />
      </DialogContent>
    </Dialog>
  )
}
