/**
 * Environment variable validation — fails fast at startup if required vars are missing.
 * Import this module in layout.tsx or instrumentation.ts to ensure early validation.
 */

function requireEnv(name: string): string {
    const value = process.env[name]
    if (!value) {
        throw new Error(
            `❌ Missing required environment variable: ${name}\n` +
            `   Set it in your .env file or hosting provider.`
        )
    }
    return value
}

function optionalEnv(name: string, fallback: string): string {
    return process.env[name] || fallback
}

// ── Required in all environments ──────────────────────────────────
export const DATABASE_URL = requireEnv("DATABASE_URL")
export const AUTH_SECRET = requireEnv("AUTH_SECRET")

// ── Required in production ────────────────────────────────────────
const isProduction = process.env.NODE_ENV === "production"

export const GOOGLE_CLIENT_ID = isProduction
    ? requireEnv("AUTH_GOOGLE_ID")
    : optionalEnv("AUTH_GOOGLE_ID", "")

export const GOOGLE_CLIENT_SECRET = isProduction
    ? requireEnv("AUTH_GOOGLE_SECRET")
    : optionalEnv("AUTH_GOOGLE_SECRET", "")

export const EMIT_SECRET = isProduction
    ? requireEnv("EMIT_SECRET")
    : optionalEnv("EMIT_SECRET", "dev-secret")

export const SOCKET_SERVER_URL = isProduction
    ? requireEnv("SOCKET_SERVER_URL")
    : optionalEnv("SOCKET_SERVER_URL", "http://localhost:3001")

export const NEXT_PUBLIC_SOCKET_SERVER_URL = isProduction
    ? requireEnv("NEXT_PUBLIC_SOCKET_SERVER_URL")
    : optionalEnv("NEXT_PUBLIC_SOCKET_SERVER_URL", "http://localhost:3001")

export const NEXT_PUBLIC_BASE_URL = isProduction
    ? requireEnv("NEXT_PUBLIC_BASE_URL")
    : optionalEnv("NEXT_PUBLIC_BASE_URL", "http://localhost:3000")

// ── Optional integrations ─────────────────────────────────────────
export const UPSTASH_REDIS_REST_URL = process.env.UPSTASH_REDIS_REST_URL || ""
export const UPSTASH_REDIS_REST_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN || ""
