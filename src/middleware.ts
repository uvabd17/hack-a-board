import NextAuth from "next-auth"
import { authConfig } from "@/auth.config"

// Initialise NextAuth with the Edge-safe config (no Prisma, no Node.js-only imports)
const { auth } = NextAuth(authConfig)

/**
 * Middleware — protects organizer routes.
 *
 * Protected routes:
 *   /dashboard          — organizer dashboard (requires NextAuth session)
 *   /h/[slug]/manage/*  — hackathon management (requires NextAuth session)
 *
 * Judge & participant routes are protected via cookie checks in their layouts.
 */
export default auth

export const config = {
    matcher: [
        "/dashboard/:path*",
        "/h/:slug/manage/:path*",
    ],
}
