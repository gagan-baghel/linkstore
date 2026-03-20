import crypto from "crypto"
import { getAuthJwtSecret } from "@/lib/auth-config"

function decodeKeyMaterial(raw: string): Buffer {
  if (!raw) {
    throw new Error("AUTH_JWT_SECRET is required.")
  }

  if (/^[0-9a-fA-F]{64}$/.test(raw)) {
    return Buffer.from(raw, "hex")
  }

  if (/^[A-Za-z0-9+/=]+$/.test(raw) && raw.length >= 44) {
    try {
      const decoded = Buffer.from(raw, "base64")
      if (decoded.length >= 32) return decoded
    } catch {
      // fall through
    }
  }

  return Buffer.from(raw, "utf8")
}

function getKey(): Buffer {
  const raw = getAuthJwtSecret()
  const material = decodeKeyMaterial(raw)
  return crypto.createHash("sha256").update(material).digest()
}

export function hashSensitive(value: string): string {
  const key = getKey()
  return crypto.createHmac("sha256", key).update(value).digest("hex")
}

export function encryptSensitive(value: string): string {
  const key = getKey()
  const iv = crypto.randomBytes(12)
  const cipher = crypto.createCipheriv("aes-256-gcm", key, iv)
  const encrypted = Buffer.concat([cipher.update(value, "utf8"), cipher.final()])
  const tag = cipher.getAuthTag()
  return `${iv.toString("base64")}.${tag.toString("base64")}.${encrypted.toString("base64")}`
}

export function decryptSensitive(payload: string): string {
  const [ivB64, tagB64, dataB64] = payload.split(".")
  if (!ivB64 || !tagB64 || !dataB64) {
    throw new Error("Invalid encrypted payload format.")
  }

  const key = getKey()
  const iv = Buffer.from(ivB64, "base64")
  const tag = Buffer.from(tagB64, "base64")
  const encrypted = Buffer.from(dataB64, "base64")

  const decipher = crypto.createDecipheriv("aes-256-gcm", key, iv)
  decipher.setAuthTag(tag)
  const decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()])
  return decrypted.toString("utf8")
}
