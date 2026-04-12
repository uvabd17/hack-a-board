import { NextRequest, NextResponse } from "next/server"
import { getDisplayState } from "@/actions/display"
import { checkRateLimit, getRequestIp } from "@/lib/rate-limit"
import crypto from "crypto"

export const dynamic = "force-dynamic"

/**
 * ETag-based display endpoint — always returns global leaderboard.
 * Client filters by track. Returns 304 Not Modified when data unchanged.
 */
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ slug: string }> }
) {
    const { slug } = await params

    const ip = await getRequestIp()
    const rl = await checkRateLimit({
        namespace: "display-poll",
        identifier: `${ip}:${slug}`,
        limit: 120,
        windowSec: 60,
    })
    if (!rl.allowed) {
        return NextResponse.json(
            { error: "Rate limit exceeded" },
            { status: 429, headers: { "Retry-After": String(rl.retryAfterSec) } }
        )
    }

    const result = await getDisplayState(slug)

    if (!result) {
        return NextResponse.json({ error: "Not found" }, { status: 404 })
    }

    // Compute ETag from response content
    const body = JSON.stringify(result)
    const etag = `"${crypto.createHash("md5").update(body).digest("hex")}"`

    // Check If-None-Match — return 304 if client has current data
    const clientEtag = request.headers.get("if-none-match")
    if (clientEtag === etag) {
        return new NextResponse(null, { status: 304, headers: { ETag: etag } })
    }

    return new NextResponse(body, {
        status: 200,
        headers: {
            "Content-Type": "application/json",
            "ETag": etag,
            "Cache-Control": "no-cache", // Must revalidate, but client can use ETag
        }
    })
}
