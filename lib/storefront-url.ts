function getConfiguredAppUrl() {
  const candidate = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
  try {
    return new URL(candidate)
  } catch {
    return new URL("http://localhost:3000")
  }
}

function normalizeBaseHostname(hostname: string) {
  return hostname.replace(/^www\./i, "")
}

type HeaderSource = Pick<Headers, "get">

export function getRequestOrigin(headers: HeaderSource) {
  const hostHeader = headers.get("x-forwarded-host") || headers.get("host")
  const host = hostHeader?.split(",")[0]?.trim()

  if (!host) {
    return getConfiguredAppUrl().origin
  }

  const forwardedProto = headers.get("x-forwarded-proto")?.split(",")[0]?.trim()
  const normalizedHost = host.split(":")[0]?.trim().toLowerCase() || ""
  const protocol =
    forwardedProto || (normalizedHost === "localhost" || normalizedHost === "127.0.0.1" ? "http" : "https")

  try {
    return new URL(`${protocol}://${host}`).origin
  } catch {
    return getConfiguredAppUrl().origin
  }
}

export function buildStorefrontUrl(username: string, baseUrl?: string) {
  const normalizedUsername = username.trim().replace(/^@+/, "").toLowerCase()
  if (!normalizedUsername) return ""

  const appUrl = (() => {
    if (!baseUrl) return getConfiguredAppUrl()
    try {
      return new URL(baseUrl)
    } catch {
      return getConfiguredAppUrl()
    }
  })()

  const storefrontUrl = new URL(appUrl.toString())

  storefrontUrl.search = ""
  storefrontUrl.hash = ""
  storefrontUrl.pathname = `/${encodeURIComponent(normalizedUsername)}`
  return storefrontUrl.toString()
}

export function extractStoreUsernameFromHostname(hostname: string, baseUrl?: string) {
  const incomingHostname = normalizeBaseHostname(hostname.trim().toLowerCase())
  if (!incomingHostname) return null

  const appUrl = (() => {
    if (!baseUrl) return getConfiguredAppUrl()
    try {
      return new URL(baseUrl)
    } catch {
      return getConfiguredAppUrl()
    }
  })()

  const baseHostname = normalizeBaseHostname(appUrl.hostname.toLowerCase())
  if (incomingHostname === baseHostname) return null

  if (baseHostname === "localhost" || baseHostname === "127.0.0.1") {
    if (!incomingHostname.endsWith(".localhost")) return null
    const subdomain = incomingHostname.slice(0, -".localhost".length)
    return subdomain && !subdomain.includes(".") ? subdomain : null
  }

  const suffix = `.${baseHostname}`
  if (!incomingHostname.endsWith(suffix)) return null

  const subdomain = incomingHostname.slice(0, -suffix.length)
  return subdomain && !subdomain.includes(".") ? subdomain : null
}
