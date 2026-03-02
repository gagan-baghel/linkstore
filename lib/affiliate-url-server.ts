import "server-only"

import dns from "node:dns/promises"
import net from "node:net"

import { assertSafePublicHttpUrl } from "@/lib/affiliate-url"

function isPrivateIpv4(address: string): boolean {
  const parts = address.split(".")
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

function isPrivateIpv6(address: string): boolean {
  const lower = address.toLowerCase()

  if (lower === "::1" || lower === "::") return true
  if (lower.startsWith("fc") || lower.startsWith("fd")) return true
  if (/^fe[89ab]/.test(lower)) return true
  if (lower.startsWith("ff")) return true
  if (lower.startsWith("2001:db8")) return true

  if (lower.startsWith("::ffff:")) {
    const mapped = lower.slice("::ffff:".length)
    if (net.isIP(mapped) === 4 && isPrivateIpv4(mapped)) return true
  }

  return false
}

function isDisallowedResolvedAddress(address: string): boolean {
  const type = net.isIP(address)
  if (type === 4) return isPrivateIpv4(address)
  if (type === 6) return isPrivateIpv6(address)
  return true
}

async function lookupAll(hostname: string) {
  let timer: ReturnType<typeof setTimeout> | undefined
  try {
    return await Promise.race([
      dns.lookup(hostname, { all: true, verbatim: true }),
      new Promise<never>((_, reject) => {
        timer = setTimeout(() => reject(new Error("DNS lookup timed out.")), 3000)
      }),
    ])
  } finally {
    if (timer) clearTimeout(timer)
  }
}

export async function assertSafePublicHttpUrlForServerFetch(input: string | URL): Promise<void> {
  const parsed = typeof input === "string" ? new URL(input) : input
  assertSafePublicHttpUrl(parsed)

  const hostname = parsed.hostname.trim()
  const hostType = net.isIP(hostname)

  if (hostType === 4 && isPrivateIpv4(hostname)) {
    throw new Error("This URL host is not allowed.")
  }
  if (hostType === 6 && isPrivateIpv6(hostname)) {
    throw new Error("This URL host is not allowed.")
  }
  if (hostType !== 0) {
    return
  }

  const records = await lookupAll(hostname)
  if (!records.length) {
    throw new Error("Unable to resolve URL host.")
  }

  for (const record of records) {
    if (isDisallowedResolvedAddress(record.address)) {
      throw new Error("This URL host is not allowed.")
    }
  }
}
