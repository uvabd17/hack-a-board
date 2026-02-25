import "dotenv/config"
import express from "express"
import { createServer } from "http"
import { Server } from "socket.io"
import cors from "cors"
import helmet from "helmet"

const app = express()
const httpServer = createServer(app)

const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN || "http://localhost:3000"
const EMIT_SECRET = process.env.EMIT_SECRET
const PORT = process.env.PORT || 3001
const MAX_CONNECTIONS_PER_IP = 20 // Prevent connection flooding

if (!EMIT_SECRET) {
    console.warn("⚠️  EMIT_SECRET not set — /emit endpoint will reject all requests")
}

function isValidHackathonId(value: unknown): value is string {
    return typeof value === "string" && /^[a-zA-Z0-9_-]{8,64}$/.test(value)
}

const io = new Server(httpServer, {
    cors: {
        origin: CLIENT_ORIGIN,
        methods: ["GET", "POST"],
        credentials: true,
    },
    // Connection hardening
    maxHttpBufferSize: 1e5, // 100KB max message size
    pingTimeout: 20000,
    pingInterval: 25000,
    connectTimeout: 10000,
})

// ── Security middleware ─────────────────────────────────────────
app.use(helmet())
app.use(cors({ origin: CLIENT_ORIGIN, credentials: true }))
app.use(express.json({ limit: "10kb" })) // Limit request body size

// ── Connection tracking for flood protection ────────────────────
const connectionsPerIP = new Map<string, number>()

function getClientIP(socket: { handshake: { headers: Record<string, string | string[] | undefined>; address: string } }): string {
    const forwarded = socket.handshake.headers["x-forwarded-for"]
    if (typeof forwarded === "string") return forwarded.split(",")[0].trim()
    return socket.handshake.address
}

// ──────────────────────────────────────────────
// Root route - Status page
// ──────────────────────────────────────────────
app.get("/", (_req, res) => {
    res.send(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>Hackaboard Socket Server</title>
            <style>
                body { 
                    font-family: monospace; 
                    background: #0a0a0a; 
                    color: #00ff00; 
                    padding: 2rem;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    min-height: 100vh;
                    margin: 0;
                }
                .container {
                    border: 2px solid #00ff00;
                    padding: 2rem;
                    max-width: 600px;
                }
                h1 { color: #00ff00; margin: 0 0 1rem 0; }
                .status { color: #00ff00; font-size: 1.2rem; margin: 1rem 0; }
                .info { color: #888; font-size: 0.9rem; }
                a { color: #00aaff; }
            </style>
        </head>
        <body>
            <div class="container">
                <h1>🔌 Hackaboard Socket Server</h1>
                <div class="status">✅ RUNNING</div>
                <div class="info">
                    <p>Port: ${PORT}</p>
                    <p>Active Connections: ${io.engine.clientsCount}</p>
                    <p>Endpoints:</p>
                    <ul>
                        <li>WebSocket: <code>ws://localhost:${PORT}</code></li>
                        <li>Health Check: <a href="/health">/health</a></li>
                        <li>Internal Emit: POST /emit (requires auth)</li>
                    </ul>
                </div>
            </div>
        </body>
        </html>
    `)
})

// ──────────────────────────────────────────────
// Health check
// ──────────────────────────────────────────────
app.get("/health", (_req, res) => {
    res.json({ status: "ok", connections: io.engine.clientsCount })
})

// ──────────────────────────────────────────────
// Internal HTTP emit API
// Called by Next.js server actions to broadcast events
// POST /emit  { room, event, data }
// ──────────────────────────────────────────────
app.post("/emit", (req, res): void => {
    const secret = req.headers["x-emit-secret"]
    if (secret !== EMIT_SECRET) {
        res.status(401).json({ error: "Unauthorized" })
        return
    }

    const { room, event, data } = req.body as { room: string; event: string; data: unknown }

    if (!room || !event) {
        res.status(400).json({ error: "room and event are required" })
        return
    }

    io.to(room).emit(event, data)
    console.log(`[emit] room=${room} event=${event}`)
    res.json({ ok: true })
})

// ──────────────────────────────────────────────
// Socket.IO connection handling
// ──────────────────────────────────────────────
io.on("connection", (socket) => {
    // ── Flood protection ────────────────────────
    const ip = getClientIP(socket)
    const current = connectionsPerIP.get(ip) || 0
    if (current >= MAX_CONNECTIONS_PER_IP) {
        console.warn(`[flood] Rejecting connection from ${ip} (${current} active)`)
        socket.disconnect(true)
        return
    }
    connectionsPerIP.set(ip, current + 1)

    console.log(`[connect] ${socket.id} (${ip})`)

    // Limit rooms per socket to prevent abuse
    let joinedRooms = 0
    const MAX_ROOMS = 4

    // Client joins rooms by sending a "join" event with hackathonId
    socket.on("join:hackathon", (hackathonId: string) => {
        if (!isValidHackathonId(hackathonId) || joinedRooms >= MAX_ROOMS) return
        socket.join(`hackathon:${hackathonId}`)
        joinedRooms++
        console.log(`[join] ${socket.id} → hackathon:${hackathonId}`)
    })

    socket.on("join:display", (hackathonId: string) => {
        if (!isValidHackathonId(hackathonId) || joinedRooms >= MAX_ROOMS) return
        socket.join(`display:${hackathonId}`)
        joinedRooms++
        console.log(`[join] ${socket.id} → display:${hackathonId}`)
    })

    socket.on("disconnect", () => {
        const remaining = (connectionsPerIP.get(ip) || 1) - 1
        if (remaining <= 0) connectionsPerIP.delete(ip)
        else connectionsPerIP.set(ip, remaining)
        console.log(`[disconnect] ${socket.id}`)
    })
})

const server = httpServer.listen(PORT, () => {
    console.log(`🔌 Hackaboard Socket Server running on port ${PORT}`)
})

// ──────────────────────────────────────────────
// Graceful shutdown — allow in-flight requests to finish
// ──────────────────────────────────────────────
function shutdown(signal: string) {
    console.log(`[shutdown] ${signal} received — closing connections`)
    io.close(() => {
        server.close(() => {
            console.log("[shutdown] Server closed")
            process.exit(0)
        })
    })
    // Force exit if graceful close takes too long
    setTimeout(() => {
        console.error("[shutdown] Timeout — forcing exit")
        process.exit(1)
    }, 10000).unref()
}

process.on("SIGTERM", () => shutdown("SIGTERM"))
process.on("SIGINT", () => shutdown("SIGINT"))
