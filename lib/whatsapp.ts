export const DEFAULT_WHATSAPP_MESSAGE = "Hi! I found your store on Linkstore and would like to know more about your recommendations."

export function normalizeWhatsAppNumber(input?: string) {
  const trimmed = (input || "").trim()
  if (!trimmed) return ""

  const compact = trimmed.replace(/[\s().-]/g, "")
  const withoutPlus = compact.startsWith("+") ? compact.slice(1) : compact
  const normalized = withoutPlus.startsWith("00") ? withoutPlus.slice(2) : withoutPlus

  return normalized.replace(/\D/g, "")
}

export function isValidWhatsAppNumber(input?: string) {
  const normalized = normalizeWhatsAppNumber(input)
  return normalized.length >= 8 && normalized.length <= 15
}

export function resolveWhatsAppMessage(input?: string) {
  const trimmed = (input || "").trim()
  return trimmed || DEFAULT_WHATSAPP_MESSAGE
}

export function buildWhatsAppUrl(number?: string, message?: string) {
  const normalized = normalizeWhatsAppNumber(number)
  if (!isValidWhatsAppNumber(normalized)) return ""

  const params = new URLSearchParams({
    text: resolveWhatsAppMessage(message),
  })

  return `https://wa.me/${normalized}?${params.toString()}`
}
