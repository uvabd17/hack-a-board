import { headers } from "next/headers"
import { redis } from "@/lib/redis"

type RateLimitResult = {
  allowed: boolean
  remaining: number
  retryAfterSec: number
}

type LocalEntry = {
  count: number
  resetAt: number
}

const globalForRateLimit = globalThis as unknown as {
  __rateLimitStore?: Map<string, LocalEntry>
}

const localStore = globalForRateLimit.__rateLimitStore ?? new Map<string, LocalEntry>()
if (!globalForRateLimit.__rateLimitStore) globalForRateLimit.__rateLimitStore = localStore

function sanitizeKeyPart(value: string): string {
  return value.replace(/[^a-zA-Z0-9:_-]/g, "_").slice(0, 128)
}

export async function getRequestIp(): Promise<string> {
  const h = await headers()
  const forwarded = h.get("x-forwarded-for")
  if (forwarded) return forwarded.split(",")[0]?.trim() || "unknown"
  const realIp = h.get("x-real-ip")
  if (realIp) return realIp
  return "unknown"
}

export async function checkRateLimit(opts: {
  namespace: string
  identifier: string
  limit: number
  windowSec: number
}): Promise<RateLimitResult> {
  const namespace = sanitizeKeyPart(opts.namespace)
  const identifier = sanitizeKeyPart(opts.identifier)
  const key = `rl:${namespace}:${identifier}`

  if (redis) {
    try {
      const count = await redis.incr(key)
      if (count === 1) {
        await redis.expire(key, opts.windowSec)
      }
      const remaining = Math.max(0, opts.limit - count)
      return {
        allowed: count <= opts.limit,
        remaining,
        retryAfterSec: count <= opts.limit ? 0 : opts.windowSec,
      }
    } catch {
      console.warn("[rate-limit] redis failed, using local fallback")
    }
  }

  const now = Date.now()
  const windowMs = opts.windowSec * 1000
  const existing = localStore.get(key)
  if (!existing || existing.resetAt <= now) {
    localStore.set(key, { count: 1, resetAt: now + windowMs })
    return { allowed: true, remaining: Math.max(0, opts.limit - 1), retryAfterSec: 0 }
  }

  existing.count += 1
  localStore.set(key, existing)

  const allowed = existing.count <= opts.limit
  const remaining = Math.max(0, opts.limit - existing.count)
  const retryAfterSec = allowed ? 0 : Math.ceil((existing.resetAt - now) / 1000)
  return { allowed, remaining, retryAfterSec }
}
