// Stable, human-friendly product numbers ("#12") that creators can mention in
// captions and that shoppers can search or open via /{username}/12.

type NumberedProduct = { _id: string; createdAt: number; productNumber?: number }

// Products created before numbering existed fall back to their 1-based
// creation rank. Mutations persist these via backfill, so the fallback only
// matters until a store's first product write.
export function getEffectiveProductNumbers(products: NumberedProduct[]) {
  const ordered = [...products].sort((a, b) => a.createdAt - b.createdAt || String(a._id).localeCompare(String(b._id)))
  const numbers = new Map<string, number>()
  ordered.forEach((product, index) => {
    numbers.set(String(product._id), typeof product.productNumber === "number" ? product.productNumber : index + 1)
  })
  return numbers
}

export function getNextProductNumber(products: NumberedProduct[]) {
  let max = 0
  for (const value of getEffectiveProductNumbers(products).values()) {
    if (value > max) max = value
  }
  return max + 1
}

export function parseProductNumberQuery(query: string) {
  const match = query.trim().match(/^#?\s*(\d{1,6})$/)
  return match ? Number(match[1]) : null
}

export function matchesProductQuery(
  product: { title: string; category?: string; description?: string; productNumber?: number },
  query: string,
) {
  const normalized = query.trim().toLowerCase()
  if (!normalized) return true
  const number = parseProductNumberQuery(normalized)
  if (number !== null && product.productNumber === number) return true
  return [product.title, product.category, product.description].some((field) =>
    (field || "").toLowerCase().includes(normalized),
  )
}
