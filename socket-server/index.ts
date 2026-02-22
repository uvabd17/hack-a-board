import "dotenv/config"
import express from "express"
import { createServer } from "http"
import { Server } from "socket.io"
import cors from "cors"

const app = express()
const httpServer = createServer(app)

const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN || "http://localhost:3000"
const EMIT_SECRET = process.env.EMIT_SECRET
const PORT = process.env.PORT || 3001

if (!EMIT_SECRET) {
    throw new Error("EMIT_SECRET is required for socket-server")
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
})

app.use(cors({ origin: CLIENT_ORIGIN, credentials: true }))
app.use(express.json())

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
app.post("/emit", (req, res) => {
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
    console.log(`[connect] ${socket.id}`)

    // Client joins rooms by sending a "join" event with hackathonId
    socket.on("join:hackathon", (hackathonId: string) => {
        if (!isValidHackathonId(hackathonId)) return
        socket.join(`hackathon:${hackathonId}`)
        console.log(`[join] ${socket.id} → hackathon:${hackathonId}`)
    })

    socket.on("join:display", (hackathonId: string) => {
        if (!isValidHackathonId(hackathonId)) return
        socket.join(`display:${hackathonId}`)
        console.log(`[join] ${socket.id} → display:${hackathonId}`)
    })

    socket.on("disconnect", () => {
        console.log(`[disconnect] ${socket.id}`)
    })
})

httpServer.listen(PORT, () => {
    console.log(`🔌 Hackaboard Socket Server running on port ${PORT}`)
})
