export function normalizeAffiliateUrl(rawUrl: string): string {
  const trimmed = rawUrl.trim()
  if (!trimmed) throw new Error("Please enter an affiliate URL.")

  let candidate = trimmed
  if (candidate.startsWith("//")) {
    candidate = `https:${candidate}`
  } else if (!/^[a-z][a-z0-9+.-]*:\/\//i.test(candidate) && /^[\w.-]+\.[a-z]{2,}(?:[/:?#]|$)/i.test(candidate)) {
    candidate = `https://${candidate}`
  }

  let parsed: URL
  try {
    parsed = new URL(candidate)
  } catch {
    throw new Error("Please enter a valid affiliate URL.")
  }

  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    throw new Error("Only http/https affiliate URLs are supported.")
  }

  return parsed.toString()
}

export function tryNormalizeAffiliateUrl(rawUrl: string): string | null {
  try {
    return normalizeAffiliateUrl(rawUrl)
  } catch {
    return null
  }
}
