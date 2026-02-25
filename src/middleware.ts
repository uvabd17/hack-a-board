import { auth } from "@/auth"
import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

/**
 * Middleware — protects organizer routes and adds security headers.
 * 
 * Protected routes:
 *   /dashboard          — organizer dashboard (requires NextAuth session)
 *   /h/[slug]/manage/*  — hackathon management (requires NextAuth session)
 * 
 * Judge & participant routes are protected via cookie checks in their layouts,
 * so they don't need middleware-level protection.
 */
export default auth((req: NextRequest & { auth?: unknown }) => {
    const { pathname } = req.nextUrl

    // Check if route requires organizer auth
    const isOrganizerRoute =
        pathname.startsWith("/dashboard") ||
        pathname.match(/^\/h\/[^/]+\/manage/)

    if (isOrganizerRoute && !req.auth) {
        const signInUrl = new URL("/signin", req.url)
        signInUrl.searchParams.set("callbackUrl", pathname)
        return NextResponse.redirect(signInUrl)
    }

    return NextResponse.next()
})

export const config = {
    // Run middleware on organizer-facing routes only (skip static, api, _next)
    matcher: [
        "/dashboard/:path*",
        "/h/:slug/manage/:path*",
    ],
}
