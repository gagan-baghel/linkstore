"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"

import { toast } from "@/components/ui/use-toast"

interface ProductVisibilityToggleProps {
  productId: string
  isArchived?: boolean
}

export function ProductVisibilityToggle({ productId, isArchived }: ProductVisibilityToggleProps) {
  const router = useRouter()
  const [isUpdating, setIsUpdating] = useState(false)
  const isVisible = !(isArchived === true)

  async function handleToggle(nextVisible: boolean) {
    try {
      setIsUpdating(true)
      const response = await fetch(`/api/products/${productId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isArchived: !nextVisible }),
      })
      if (!response.ok) throw new Error("Failed to update visibility")
      toast({
        title: nextVisible ? "Visible" : "Hidden",
        description: nextVisible ? "Product is now visible in the storefront." : "Product is hidden from the storefront.",
      })
      router.refresh()
    } catch (error) {
      console.error(error)
      toast({ title: "Error", description: "Failed to update product visibility", variant: "destructive" })
    } finally {
      setIsUpdating(false)
    }
  }

  return (
    <label className="flex items-center gap-2 text-xs font-semibold text-slate-600">
      <input
        type="checkbox"
        className="h-4 w-4 rounded border-slate-300 text-slate-900"
        checked={isVisible}
        disabled={isUpdating}
        onChange={(event) => handleToggle(event.target.checked)}
      />
      Show on store
    </label>
  )
}
