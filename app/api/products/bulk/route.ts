import { NextResponse } from "next/server"
import { revalidateTag } from "next/cache"
import { z } from "zod"

import { getSafeServerSession } from "@/lib/auth"
import { normalizeAffiliateUrl } from "@/lib/affiliate-url"
import { convexMutation, convexQuery } from "@/lib/convex"
import { fetchProductMetadata } from "@/lib/product-metadata"
import { getStoreCacheTag } from "@/lib/store-cache"

const bulkSchema = z.object({
  csv: z.string().min(1),
})

async function revalidateStoreForUser(userId: string) {
  const user = await convexQuery<{ userId: string }, any | null>("users:getById", { userId }).catch(() => null)
  const username = user?.username?.trim().toLowerCase()
  if (!username) return
  revalidateTag(getStoreCacheTag(username), "max")
}

type CsvRow = {
  title: string
  description: string
  affiliateUrl: string
  category: string
  imageUrl: string
  videoUrl: string
}

function splitCsvLine(line: string) {
  const result: string[] = []
  let current = ""
  let inQuotes = false

  for (let i = 0; i < line.length; i += 1) {
    const char = line[i]
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"'
        i += 1
      } else {
        inQuotes = !inQuotes
      }
      continue
    }

    if (char === "," && !inQuotes) {
      result.push(current.trim())
      current = ""
      continue
    }

    current += char
  }

  result.push(current.trim())
  return result
}

function parseCsv(csv: string): CsvRow[] {
  const lines = csv
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)

  if (lines.length < 2) return []

  const headers = splitCsvLine(lines[0]).map((header) => header.toLowerCase())

  const titleIndex = headers.indexOf("title")
  const descriptionIndex = headers.indexOf("description")
  const affiliateUrlIndex = headers.indexOf("affiliateurl")
  const categoryIndex = headers.indexOf("category")
  const imageUrlIndex = headers.indexOf("imageurl")
  const videoUrlIndex = headers.indexOf("videourl")

  if (titleIndex === -1 || descriptionIndex === -1 || affiliateUrlIndex === -1) {
    throw new Error("CSV must include title, description and affiliateUrl columns")
  }

  const rows: CsvRow[] = []
  for (const line of lines.slice(1)) {
    const values = splitCsvLine(line)
    rows.push({
      title: values[titleIndex] || "",
      description: values[descriptionIndex] || "",
      affiliateUrl: values[affiliateUrlIndex] || "",
      category: categoryIndex >= 0 ? values[categoryIndex] || "General" : "General",
      imageUrl: imageUrlIndex >= 0 ? values[imageUrlIndex] || "" : "",
      videoUrl: videoUrlIndex >= 0 ? values[videoUrlIndex] || "" : "",
    })
  }

  return rows
}

export async function POST(req: Request) {
  try {
    const session = await getSafeServerSession()
    if (!session?.user?.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    const body = await req.json()
    const { csv } = bulkSchema.parse(body)
    const rows = parseCsv(csv).slice(0, 200)

    const preparedProducts: Array<{
      title: string
      description: string
      affiliateUrl: string
      category: string
      images: string[]
      videoUrl?: string
    }> = []

    for (const row of rows) {
      if (!row.title || !row.description || !row.affiliateUrl) continue
      let affiliateUrl = ""
      try {
        affiliateUrl = normalizeAffiliateUrl(row.affiliateUrl)
      } catch {
        continue
      }
      let images: string[] = row.imageUrl ? [row.imageUrl] : []

      if (images.length === 0) {
        const metadata = await fetchProductMetadata(affiliateUrl).catch(() => null)
        if (metadata?.image) {
          images = [metadata.image]
        }
      }

      if (images.length === 0) {
        images = ["/placeholder.jpg"]
      }

      preparedProducts.push({
        title: row.title,
        description: row.description,
        affiliateUrl,
        category: row.category || "General",
        images,
        videoUrl: row.videoUrl || "",
      })
    }

    const result = await convexMutation<
      {
        userId: string
        products: Array<{
          title: string
          description: string
          affiliateUrl: string
          category?: string
          images: string[]
          videoUrl?: string
        }>
      },
      { ok: boolean; created: number; message?: string }
    >("products:bulkCreateByUser", {
      userId: session.user.id,
      products: preparedProducts,
    })

    if (!result.ok) {
      return NextResponse.json({ message: result.message || "Bulk import failed" }, { status: 400 })
    }

    await revalidateStoreForUser(session.user.id)

    return NextResponse.json({
      message: "Bulk upload completed",
      processed: rows.length,
      created: result.created,
    })
  } catch (error) {
    console.error("Bulk product upload error:", error)
    if (error instanceof z.ZodError) {
      return NextResponse.json({ message: "Invalid payload", errors: error.errors }, { status: 400 })
    }
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 },
    )
  }
}
