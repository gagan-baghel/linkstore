import crypto from "crypto"

import { PASSWORD_MAX_LENGTH, PASSWORD_MIN_LENGTH } from "@/lib/auth-config"

const SCRYPT_PREFIX = "scrypt"
const SCRYPT_KEY_LENGTH = 64
const SCRYPT_COST = 16384
const SCRYPT_BLOCK_SIZE = 8
const SCRYPT_PARALLELIZATION = 1
const SCRYPT_MAX_MEMORY = 64 * 1024 * 1024

function normalizePassword(password: string) {
  return password.normalize("NFKC")
}

function deriveKey(password: string, salt: Buffer) {
  const normalized = normalizePassword(password)

  return new Promise<Buffer>((resolve, reject) => {
    crypto.scrypt(
      normalized,
      salt,
      SCRYPT_KEY_LENGTH,
      {
        N: SCRYPT_COST,
        r: SCRYPT_BLOCK_SIZE,
        p: SCRYPT_PARALLELIZATION,
        maxmem: SCRYPT_MAX_MEMORY,
      },
      (error, derivedKey) => {
        if (error) {
          reject(error)
          return
        }

        resolve(derivedKey as Buffer)
      },
    )
  })
}

export function validatePasswordPolicy(password: string) {
  const normalized = normalizePassword(password)

  if (normalized.length < PASSWORD_MIN_LENGTH) {
    return `Password must be at least ${PASSWORD_MIN_LENGTH} characters.`
  }

  if (normalized.length > PASSWORD_MAX_LENGTH) {
    return `Password must be no more than ${PASSWORD_MAX_LENGTH} characters.`
  }

  return null
}

export async function hashPassword(password: string) {
  const salt = crypto.randomBytes(16)
  const derivedKey = await deriveKey(password, salt)

  return [
    SCRYPT_PREFIX,
    String(SCRYPT_COST),
    String(SCRYPT_BLOCK_SIZE),
    String(SCRYPT_PARALLELIZATION),
    salt.toString("base64"),
    derivedKey.toString("base64"),
  ].join("$")
}

export async function verifyPassword(password: string, storedHash: string) {
  const [prefix, cost, blockSize, parallelization, saltValue, hashValue] = storedHash.split("$")

  if (
    prefix !== SCRYPT_PREFIX ||
    !cost ||
    !blockSize ||
    !parallelization ||
    !saltValue ||
    !hashValue ||
    Number.parseInt(cost, 10) !== SCRYPT_COST ||
    Number.parseInt(blockSize, 10) !== SCRYPT_BLOCK_SIZE ||
    Number.parseInt(parallelization, 10) !== SCRYPT_PARALLELIZATION
  ) {
    return false
  }

  const salt = Buffer.from(saltValue, "base64")
  const expectedHash = Buffer.from(hashValue, "base64")
  const actualHash = await deriveKey(password, salt)

  if (expectedHash.length !== actualHash.length) {
    return false
  }

  return crypto.timingSafeEqual(expectedHash, actualHash)
}
