import { handle } from "@upstash/realtime"
import { realtime } from "@/lib/realtime"

// Force dynamic rendering — this is a streaming SSE endpoint
export const dynamic = "force-dynamic"
export const runtime = "nodejs"

export const GET = handle({ realtime })
