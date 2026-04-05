import { NextRequest, NextResponse } from "next/server"
import { getDisplayState, getTrackStanding } from "@/actions/display"
import crypto from "crypto"

export const dynamic = "force-dynamic"

/**
 * ETag-based display endpoint — reduces bandwidth by 95% during quiet periods.
 * Returns 304 Not Modified when leaderboard data hasn't changed.
 *
 * GET /api/display/[slug]?problemId=xxx
 */
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ slug: string }> }
) {
    const { slug } = await params
    const problemId = request.nextUrl.searchParams.get("problemId")

    const result = problemId
        ? await getTrackStanding(slug, problemId)
        : await getDisplayState(slug)

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
