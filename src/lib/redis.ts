import { Redis } from "@upstash/redis"

const url = process.env.UPSTASH_REDIS_REST_URL
const token = process.env.UPSTASH_REDIS_REST_TOKEN

export const redis: Redis | null =
    url && token ? new Redis({ url, token }) : null

// ─────────────────────────────────────────────
// LEADERBOARD CACHE
// ─────────────────────────────────────────────

const CACHE_TTL = 10 // seconds

function leaderboardKey(hackathonId: string, problemId?: string | null): string {
    return problemId ? `lb:${hackathonId}:p:${problemId}` : `lb:${hackathonId}`
}

export async function getCachedLeaderboard<T>(
    hackathonId: string,
    problemId?: string | null
): Promise<T | null> {
    if (!redis) return null
    try {
        const data = await redis.get<T>(leaderboardKey(hackathonId, problemId))
        return data ?? null
    } catch {
        return null
    }
}

export async function setCachedLeaderboard(
    hackathonId: string,
    data: unknown,
    problemId?: string | null
): Promise<void> {
    if (!redis) return
    try {
        await redis.set(leaderboardKey(hackathonId, problemId), JSON.stringify(data), { ex: CACHE_TTL })
    } catch {
        // Fire-and-forget — cache write failure shouldn't block responses
    }
}

export async function invalidateLeaderboard(hackathonId: string): Promise<void> {
    if (!redis) return
    try {
        // Delete the global key and scan for problem-specific keys
        const globalKey = `lb:${hackathonId}`
        const patternKey = `lb:${hackathonId}:p:*`

        // Delete global cache immediately
        await redis.del(globalKey)

        // Scan for and delete problem-specific caches
        let cursor = 0
        do {
            const [nextCursor, keys] = await redis.scan(cursor, { match: patternKey, count: 50 })
            cursor = typeof nextCursor === "number" ? nextCursor : parseInt(nextCursor)
            if (keys.length > 0) {
                await redis.del(...keys)
            }
        } while (cursor !== 0)
    } catch {
        // Invalidation failure is non-fatal — TTL will expire the stale cache
    }
}
