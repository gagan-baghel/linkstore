const DEV_AUTH_JWT_SECRET = "linkstore-dev-auth-secret-change-me"

export const AUTH_JWT_ISSUER = "linkstore"
export const AUTH_JWT_AUDIENCE = "linkstore-app"

function parsePositiveInteger(input: string | undefined, fallback: number) {
  const value = Number.parseInt((input || "").trim(), 10)
  return Number.isFinite(value) && value > 0 ? value : fallback
}

export function getAuthCookieName() {
  return process.env.AUTH_COOKIE_NAME?.trim() || "linkstore_session"
}

export function getAuthSessionTtlDays() {
  return parsePositiveInteger(process.env.AUTH_SESSION_TTL_DAYS, 7)
}

export function getAuthSessionTtlSeconds() {
  return getAuthSessionTtlDays() * 24 * 60 * 60
}

export function getAuthJwtSecret() {
  const configured = process.env.AUTH_JWT_SECRET?.trim()
  if (configured) return configured

  if (process.env.NODE_ENV !== "production") {
    return DEV_AUTH_JWT_SECRET
  }

  throw new Error("AUTH_JWT_SECRET is required.")
}

export function hasAuthJwtSecretConfigured() {
  return Boolean(process.env.AUTH_JWT_SECRET?.trim())
}

export function isSecureAuthCookie() {
  return process.env.NODE_ENV === "production"
}
