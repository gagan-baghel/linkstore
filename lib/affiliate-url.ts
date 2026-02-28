function isPrivateIpv4(hostname: string): boolean {
  const parts = hostname.split(".")
  if (parts.length !== 4) return false
  const nums = parts.map((part) => Number(part))
  if (nums.some((n) => !Number.isInteger(n) || n < 0 || n > 255)) return false

  if (nums[0] === 10) return true
  if (nums[0] === 127) return true
  if (nums[0] === 0) return true
  if (nums[0] === 169 && nums[1] === 254) return true
  if (nums[0] === 172 && nums[1] >= 16 && nums[1] <= 31) return true
  if (nums[0] === 192 && nums[1] === 168) return true
  if (nums[0] === 100 && nums[1] >= 64 && nums[1] <= 127) return true
  if (nums[0] >= 224) return true

  return false
}

function isPrivateIpv6(hostname: string): boolean {
  const lower = hostname.toLowerCase()
  return (
    lower === "::1" ||
    lower.startsWith("fc") ||
    lower.startsWith("fd") ||
    lower.startsWith("fe80:") ||
    lower === "::" ||
    lower.startsWith("::ffff:127.")
  )
}

function isDisallowedHostname(hostname: string): boolean {
  const lower = hostname.trim().toLowerCase()
  if (!lower) return true

  if (
    lower === "localhost" ||
    lower === "127.0.0.1" ||
    lower === "::1" ||
    lower.endsWith(".localhost") ||
    lower.endsWith(".local") ||
    lower.endsWith(".internal") ||
    lower.endsWith(".home.arpa") ||
    lower.endsWith(".test") ||
    lower.endsWith(".invalid")
  ) {
    return true
  }

  if (isPrivateIpv4(lower) || isPrivateIpv6(lower)) {
    return true
  }

  return false
}

export function assertSafePublicHttpUrl(parsed: URL): void {
  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    throw new Error("Only http/https URLs are supported.")
  }

  if (parsed.username || parsed.password) {
    throw new Error("URLs with embedded credentials are not allowed.")
  }

  if (isDisallowedHostname(parsed.hostname)) {
    throw new Error("This URL host is not allowed.")
  }
}

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

  assertSafePublicHttpUrl(parsed)

  return parsed.toString()
}

export function tryNormalizeAffiliateUrl(rawUrl: string): string | null {
  try {
    return normalizeAffiliateUrl(rawUrl)
  } catch {
    return null
  }
}
