const textEncoder = new TextEncoder()
const textDecoder = new TextDecoder()

type JwtValue = string | number | boolean | null | JwtValue[] | { [key: string]: JwtValue | undefined }

export type JwtPayload = Record<string, JwtValue | undefined>

function encodeBase64(input: Uint8Array) {
  if (typeof Buffer !== "undefined") {
    return Buffer.from(input).toString("base64")
  }

  let binary = ""
  for (const byte of input) {
    binary += String.fromCharCode(byte)
  }
  return btoa(binary)
}

function decodeBase64(input: string) {
  if (typeof Buffer !== "undefined") {
    return new Uint8Array(Buffer.from(input, "base64"))
  }

  const binary = atob(input)
  const bytes = new Uint8Array(binary.length)
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index)
  }
  return bytes
}

function encodeBase64UrlBytes(input: Uint8Array) {
  return encodeBase64(input).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "")
}

function encodeBase64UrlString(input: string) {
  return encodeBase64UrlBytes(textEncoder.encode(input))
}

function decodeBase64UrlToBytes(input: string) {
  const normalized = input.replace(/-/g, "+").replace(/_/g, "/")
  const padding = normalized.length % 4 === 0 ? "" : "=".repeat(4 - (normalized.length % 4))
  return decodeBase64(`${normalized}${padding}`)
}

function decodeBase64UrlToString(input: string) {
  return textDecoder.decode(decodeBase64UrlToBytes(input))
}

function timingSafeEqual(a: string, b: string) {
  if (a.length !== b.length) return false

  let mismatch = 0
  for (let index = 0; index < a.length; index += 1) {
    mismatch |= a.charCodeAt(index) ^ b.charCodeAt(index)
  }

  return mismatch === 0
}

async function importHmacKey(secret: string) {
  return crypto.subtle.importKey("raw", textEncoder.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, [
    "sign",
  ])
}

async function signValue(value: string, secret: string) {
  const key = await importHmacKey(secret)
  const signature = await crypto.subtle.sign("HMAC", key, textEncoder.encode(value))
  return encodeBase64UrlBytes(new Uint8Array(signature))
}

export async function signJwtToken(payload: JwtPayload, secret: string) {
  const header = encodeBase64UrlString(JSON.stringify({ alg: "HS256", typ: "JWT" }))
  const body = encodeBase64UrlString(JSON.stringify(payload))
  const content = `${header}.${body}`
  const signature = await signValue(content, secret)
  return `${content}.${signature}`
}

export async function verifyJwtToken<TPayload extends JwtPayload>(token: string, secret: string): Promise<TPayload | null> {
  const parts = token.split(".")
  if (parts.length !== 3) return null

  const [headerPart, payloadPart, signaturePart] = parts

  let header: { alg?: string; typ?: string } | null = null
  let payload: TPayload | null = null

  try {
    header = JSON.parse(decodeBase64UrlToString(headerPart))
    payload = JSON.parse(decodeBase64UrlToString(payloadPart))
  } catch {
    return null
  }

  if (header?.alg !== "HS256" || header?.typ !== "JWT") {
    return null
  }

  const expectedSignature = await signValue(`${headerPart}.${payloadPart}`, secret)
  if (!timingSafeEqual(signaturePart, expectedSignature)) {
    return null
  }

  const exp = typeof payload?.exp === "number" ? payload.exp : null
  if (exp !== null && exp <= Math.floor(Date.now() / 1000)) {
    return null
  }

  return payload
}
