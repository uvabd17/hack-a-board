/**
 * Next.js Instrumentation — runs once at server startup.
 * Used for early environment validation.
 */
export async function register() {
    if (process.env.NEXT_RUNTIME === "nodejs") {
        // Validate required environment variables at startup
        await import("@/lib/env")
    }
}
