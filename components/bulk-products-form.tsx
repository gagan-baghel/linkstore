"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"

import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "@/components/ui/use-toast"
import { Alert, AlertDescription } from "@/components/ui/alert"

const csvTemplate = `title,description,affiliateUrl,category,imageUrl,videoUrl
Noise Cancelling Headphones,Premium sound and long battery life,https://example.com/product-1,Electronics,,
AI Writing Tool,Improve copywriting with AI,https://example.com/product-2,Software,,`

export function BulkProductsForm() {
  const router = useRouter()
  const [csv, setCsv] = useState(csvTemplate)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [result, setResult] = useState<{ processed: number; created: number } | null>(null)

  async function onSubmit() {
    setIsLoading(true)
    setError("")
    setResult(null)

    try {
      const response = await fetch("/api/products/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ csv }),
      })

      const data = await response.json()
      if (!response.ok) {
        throw new Error(data.message || "Bulk upload failed")
      }

      setResult({ processed: data.processed || 0, created: data.created || 0 })
      toast({
        title: "Bulk upload completed",
        description: `Created ${data.created || 0} product(s).`,
      })
      router.refresh()
    } catch (err) {
      console.error(err)
      setError(err instanceof Error ? err.message : "Bulk upload failed")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-3 sm:space-y-4">
      <Alert>
        <AlertDescription>
          Use CSV columns: <code>title</code>, <code>description</code>, <code>affiliateUrl</code>, <code>category</code>,
          <code>imageUrl</code>, <code>videoUrl</code>. Image URL is optional and auto-fetched when missing.
        </AlertDescription>
      </Alert>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {result && (
        <Alert>
          <AlertDescription>
            Processed {result.processed} row(s). Created {result.created} product(s).
          </AlertDescription>
        </Alert>
      )}

      <Textarea
        value={csv}
        onChange={(e) => setCsv(e.target.value)}
        className="min-h-[260px] font-mono text-xs sm:min-h-[360px] sm:text-sm"
        placeholder="Paste CSV here..."
      />

      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <Button onClick={onSubmit} disabled={isLoading} className="h-9 w-full text-xs sm:w-auto sm:text-sm">
          {isLoading ? "Uploading..." : "Upload CSV"}
        </Button>
        <Button variant="outline" className="h-9 w-full text-xs sm:w-auto sm:text-sm" onClick={() => router.push("/dashboard/products")}>
          Back to Products
        </Button>
      </div>
    </div>
  )
}
