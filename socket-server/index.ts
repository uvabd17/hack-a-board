import express from "express"
import { createServer } from "http"
import { Server } from "socket.io"
import cors from "cors"

const app = express()
const httpServer = createServer(app)

const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN || "http://localhost:3000"
const EMIT_SECRET = process.env.EMIT_SECRET || "dev-secret"
const PORT = process.env.PORT || 3001

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
        socket.join(`hackathon:${hackathonId}`)
        console.log(`[join] ${socket.id} → hackathon:${hackathonId}`)
    })

    socket.on("join:display", (hackathonId: string) => {
        socket.join(`display:${hackathonId}`)
        console.log(`[join] ${socket.id} → display:${hackathonId}`)
    })

    // Display controller → projector relay
    // The organizer's browser emits these; we relay to the display room
    socket.on("display:set-scene", ({ hackathonId, scene }: { hackathonId: string; scene: string }) => {
        socket.to(`display:${hackathonId}`).emit("display:set-scene", { scene })
    })

    socket.on("display:set-filter", ({ hackathonId, filter }: { hackathonId: string; filter: string | null }) => {
        socket.to(`display:${hackathonId}`).emit("display:set-filter", { filter })
    })

    socket.on("disconnect", () => {
        console.log(`[disconnect] ${socket.id}`)
    })
})

httpServer.listen(PORT, () => {
    console.log(`🔌 Hackaboard Socket Server running on port ${PORT}`)
})
