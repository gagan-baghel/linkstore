export const USERNAME_MIN_LENGTH = 3
export const USERNAME_MAX_LENGTH = 30
export const USERNAME_PATTERN = /^[a-z0-9](?:[a-z0-9-]{1,28}[a-z0-9])?$/

// Route segments and infrastructure names a storefront username must not shadow.
export const RESERVED_USERNAMES = new Set([
  "api",
  "auth",
  "admin",
  "contact",
  "dashboard",
  "login",
  "logout",
  "onboarding",
  "privacy",
  "refunds",
  "register",
  "robots",
  "sitemap",
  "store",
  "stores",
  "support",
  "terms",
  "www",
])

export function normalizeUsernameInput(input: string) {
  return input.trim().replace(/^@+/, "").toLowerCase()
}

export function isValidUsername(input: string) {
  const normalized = normalizeUsernameInput(input)
  return (
    normalized.length >= USERNAME_MIN_LENGTH &&
    normalized.length <= USERNAME_MAX_LENGTH &&
    USERNAME_PATTERN.test(normalized) &&
    !RESERVED_USERNAMES.has(normalized)
  )
}

export function getUsernameValidationMessage(input: string) {
  const normalized = normalizeUsernameInput(input)

  if (normalized.length < USERNAME_MIN_LENGTH) {
    return `Username must be at least ${USERNAME_MIN_LENGTH} characters.`
  }

  if (normalized.length > USERNAME_MAX_LENGTH) {
    return `Username must be at most ${USERNAME_MAX_LENGTH} characters.`
  }

  if (!USERNAME_PATTERN.test(normalized)) {
    return "Use lowercase letters, numbers, or hyphens. Hyphens cannot start or end the username."
  }

  if (RESERVED_USERNAMES.has(normalized)) {
    return "This username is reserved. Please choose another."
  }

  return ""
}

export function toUsernameBase(name: string) {
  const normalized = normalizeUsernameInput(name).replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "")
  if (!normalized) return "store"
  return normalized.slice(0, 18)
}
