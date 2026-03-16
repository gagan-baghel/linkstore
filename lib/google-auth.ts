import crypto from "crypto"

const GOOGLE_AUTH_BASE_URL = "https://accounts.google.com/o/oauth2/v2/auth"
const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token"
const GOOGLE_USERINFO_URL = "https://openidconnect.googleapis.com/v1/userinfo"

const GOOGLE_STATE_COOKIE = "linkstore_google_oauth_state"
const GOOGLE_PKCE_COOKIE = "linkstore_google_oauth_pkce"
const GOOGLE_NEXT_COOKIE = "linkstore_google_oauth_next"

const OAUTH_COOKIE_TTL_SECONDS = 10 * 60
const GOOGLE_AUTH_SCOPES = ["openid", "email", "profile"].join(" ")

function readEnv(name: string) {
  return process.env[name]?.trim() || ""
}

function getCookieSecureFlag() {
  return process.env.NODE_ENV === "production"
}

export type GoogleUserInfo = {
  sub: string
  email: string
  email_verified?: boolean
  name?: string
  given_name?: string
  family_name?: string
  picture?: string
}

export function isGoogleAuthConfigured() {
  return Boolean(readEnv("GOOGLE_CLIENT_ID") && readEnv("GOOGLE_CLIENT_SECRET"))
}

export function getGoogleClientId() {
  const clientId = readEnv("GOOGLE_CLIENT_ID")
  if (!clientId) {
    throw new Error("GOOGLE_CLIENT_ID is required.")
  }
  return clientId
}

export function getGoogleClientSecret() {
  const clientSecret = readEnv("GOOGLE_CLIENT_SECRET")
  if (!clientSecret) {
    throw new Error("GOOGLE_CLIENT_SECRET is required.")
  }
  return clientSecret
}

export function getGoogleAuthCookies() {
  return {
    state: GOOGLE_STATE_COOKIE,
    pkce: GOOGLE_PKCE_COOKIE,
    next: GOOGLE_NEXT_COOKIE,
    maxAge: OAUTH_COOKIE_TTL_SECONDS,
    options: {
      httpOnly: true,
      sameSite: "lax" as const,
      secure: getCookieSecureFlag(),
      path: "/",
      maxAge: OAUTH_COOKIE_TTL_SECONDS,
    },
  }
}

export function getGoogleCallbackUrl(req: Request) {
  const configuredAppUrl = readEnv("NEXT_PUBLIC_APP_URL")
  const base = configuredAppUrl || new URL(req.url).origin
  return new URL("/api/auth/google/callback", base).toString()
}

export function createOAuthState() {
  return crypto.randomBytes(24).toString("base64url")
}

export function createPkceVerifier() {
  return crypto.randomBytes(48).toString("base64url")
}

export function createPkceChallenge(verifier: string) {
  return crypto.createHash("sha256").update(verifier).digest("base64url")
}

export function sanitizePostAuthPath(input: string | null | undefined) {
  if (!input) return "/dashboard"
  const trimmed = input.trim()
  if (!trimmed.startsWith("/") || trimmed.startsWith("//")) {
    return "/dashboard"
  }
  return trimmed
}

export function buildGoogleAuthorizationUrl(input: {
  clientId: string
  redirectUri: string
  state: string
  codeChallenge: string
}) {
  const url = new URL(GOOGLE_AUTH_BASE_URL)
  url.searchParams.set("client_id", input.clientId)
  url.searchParams.set("redirect_uri", input.redirectUri)
  url.searchParams.set("response_type", "code")
  url.searchParams.set("scope", GOOGLE_AUTH_SCOPES)
  url.searchParams.set("state", input.state)
  url.searchParams.set("code_challenge", input.codeChallenge)
  url.searchParams.set("code_challenge_method", "S256")
  url.searchParams.set("access_type", "online")
  url.searchParams.set("include_granted_scopes", "true")
  url.searchParams.set("prompt", "select_account")
  return url.toString()
}

export async function exchangeGoogleCode(input: {
  code: string
  codeVerifier: string
  redirectUri: string
}) {
  const body = new URLSearchParams({
    code: input.code,
    client_id: getGoogleClientId(),
    client_secret: getGoogleClientSecret(),
    redirect_uri: input.redirectUri,
    grant_type: "authorization_code",
    code_verifier: input.codeVerifier,
  })

  const response = await fetch(GOOGLE_TOKEN_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body,
    cache: "no-store",
  })

  const data = await response.json().catch(() => null)
  if (!response.ok || !data?.access_token) {
    throw new Error(
      (data && typeof data === "object" && "error_description" in data && typeof data.error_description === "string"
        ? data.error_description
        : "") || "Google token exchange failed.",
    )
  }

  return data as { access_token: string; expires_in?: number; scope?: string; token_type?: string; id_token?: string }
}

export async function fetchGoogleUserInfo(accessToken: string): Promise<GoogleUserInfo> {
  const response = await fetch(GOOGLE_USERINFO_URL, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
    cache: "no-store",
  })

  const data = await response.json().catch(() => null)
  if (!response.ok || !data?.sub || !data?.email) {
    throw new Error("Unable to fetch Google account profile.")
  }

  return data as GoogleUserInfo
}

export function getGoogleAuthErrorMessage(error: string | null | undefined) {
  switch (error) {
    case "google_not_configured":
      return "Google sign-in is not configured yet. Add GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET, then retry."
    case "access_denied":
      return "Google sign-in was cancelled."
    case "invalid_state":
      return "This Google sign-in attempt expired. Please try again."
    case "token_exchange_failed":
      return "Google sign-in could not be completed. Please retry."
    case "userinfo_failed":
      return "Your Google profile could not be loaded. Please retry."
    case "email_not_verified":
      return "Use a Google account with a verified email address."
    case "account_link_failed":
      return "Your account could not be linked right now. Please retry."
    case "dev_login_failed":
      return "Temporary dev login failed. Please retry."
    default:
      return null
  }
}
