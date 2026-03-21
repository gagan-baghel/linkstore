type DeviceType = "desktop" | "mobile" | "tablet"

export function getDeviceTypeFromUserAgent(userAgent: string): DeviceType {
  const ua = userAgent.toLowerCase()
  if (ua.includes("ipad") || ua.includes("tablet")) return "tablet"
  if (ua.includes("mobi") || ua.includes("android")) return "mobile"
  return "desktop"
}

function detectBrowser(userAgent: string) {
  const ua = userAgent.toLowerCase()
  if (!ua) return "Unknown"
  if (ua.includes("edg/")) return "Edge"
  if (ua.includes("opr/") || ua.includes("opera")) return "Opera"
  if (ua.includes("samsungbrowser/")) return "Samsung Internet"
  if (ua.includes("firefox/") || ua.includes("fxios/")) return "Firefox"
  if (ua.includes("instagram")) return "Instagram"
  if (ua.includes("crios/") || ua.includes("chrome/")) return "Chrome"
  if (ua.includes("safari/") && !ua.includes("chrome/") && !ua.includes("crios/")) return "Safari"
  return "Unknown"
}

function detectOs(userAgent: string) {
  const ua = userAgent.toLowerCase()
  if (!ua) return "Unknown"
  if (ua.includes("iphone") || ua.includes("ipad") || ua.includes("ios")) return "iOS"
  if (ua.includes("android")) return "Android"
  if (ua.includes("cros")) return "ChromeOS"
  if (ua.includes("windows")) return "Windows"
  if (ua.includes("mac os x") || ua.includes("macintosh")) return "macOS"
  if (ua.includes("linux")) return "Linux"
  return "Unknown"
}

function detectDeviceName(userAgent: string) {
  const ua = userAgent.toLowerCase()
  if (!ua) return "Unknown"
  if (ua.includes("iphone")) return "iPhone"
  if (ua.includes("ipad")) return "iPad"
  if (ua.includes("android") && ua.includes("mobile")) return "Android Phone"
  if (ua.includes("android")) return "Android Tablet"
  if (ua.includes("windows")) return "Windows PC"
  if (ua.includes("macintosh") || ua.includes("mac os x")) return "Mac"
  if (ua.includes("cros")) return "Chromebook"
  if (ua.includes("linux")) return "Linux PC"
  return "Unknown"
}

export function getLocationFromHeaders(headers: Headers) {
  const country =
    headers.get("x-vercel-ip-country") ||
    headers.get("cf-ipcountry") ||
    headers.get("x-country-code") ||
    ""
  const region =
    headers.get("x-vercel-ip-country-region") ||
    headers.get("x-region") ||
    ""
  const city =
    headers.get("x-vercel-ip-city") ||
    headers.get("x-city") ||
    ""

  return {
    country: country.trim().slice(0, 80),
    region: region.trim().slice(0, 120),
    city: city.trim().slice(0, 120),
  }
}

export function getRequestInsights(headers: Headers, userAgent: string, fallbackDevice?: string) {
  return {
    device: (fallbackDevice || getDeviceTypeFromUserAgent(userAgent)).trim().slice(0, 40),
    browser: detectBrowser(userAgent).slice(0, 80),
    os: detectOs(userAgent).slice(0, 80),
    deviceName: detectDeviceName(userAgent).slice(0, 80),
    ...getLocationFromHeaders(headers),
  }
}
