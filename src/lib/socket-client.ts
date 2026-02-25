/**
 * Browser-side Socket.IO client singleton.
 * Import and use in client components only ("use client").
 */

import { io, Socket } from "socket.io-client"

const SOCKET_SERVER_URL =
    process.env.NEXT_PUBLIC_SOCKET_SERVER_URL || "http://localhost:3001"
const UPSTASH_WS_URL = process.env.NEXT_PUBLIC_UPSTASH_WS_URL
const UPSTASH_WS_TOKEN = process.env.NEXT_PUBLIC_UPSTASH_TOKEN

type AnyHandler = (...args: any[]) => void

// Adapter that provides a minimal Socket.IO-like API on top of a raw WebSocket.
class UpstashSocketAdapter {
    ws: WebSocket | null = null
    url: string
    handlers: Map<string, Set<AnyHandler>> = new Map()
    connected = false

    constructor(url: string) {
        this.url = url
    }

    connect() {
        if (this.ws) return
        this.ws = new WebSocket(this.url)
        this.ws.onopen = () => {
            this.connected = true
            this.emitEventToHandlers("connect")
        }
        this.ws.onmessage = (ev) => {
            try {
                const payload = JSON.parse(ev.data)
                // Expect payload shape: { event: string, data: any, channel?: string }
                if (payload && payload.event) {
                    this.emitEventToHandlers(payload.event, payload.data)
                } else if (payload && payload.type === "message" && payload.payload) {
                    // Generic Upstash message wrapper
                    const msg = typeof payload.payload === "string" ? JSON.parse(payload.payload) : payload.payload
                    if (msg.event) this.emitEventToHandlers(msg.event, msg.data)
                }
            } catch (err) {
                console.warn("[UpstashSocketAdapter] failed to parse message", err)
            }
        }
        this.ws.onclose = () => {
            this.connected = false
            this.emitEventToHandlers("disconnect")
            this.ws = null
        }
        this.ws.onerror = (e) => {
            console.warn("[UpstashSocketAdapter] ws error", e)
        }
    }

    disconnect() {
        this.ws?.close()
        this.ws = null
        this.connected = false
    }

    on(event: string, handler: AnyHandler) {
        const s = this.handlers.get(event) || new Set()
        s.add(handler)
        this.handlers.set(event, s)
    }

    off(event: string, handler?: AnyHandler) {
        const s = this.handlers.get(event)
        if (!s) return
        if (handler) s.delete(handler)
        else s.clear()
    }

    emit(event: string, payload?: any) {
        // Special-case join events to subscribe to Upstash channels
        if (event === "join:hackathon") {
            const channel = `hackathon:${payload}`
            this.send({ action: "subscribe", channels: [channel] })
            return
        }
        if (event === "join:display") {
            const channel = `display:${payload}`
            this.send({ action: "subscribe", channels: [channel] })
            return
        }
        // Default: send application event to server (not usually used by clients)
        this.send({ action: "publish", event, data: payload })
    }

    private send(msg: unknown) {
        if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return
        try {
            this.ws.send(JSON.stringify(msg))
        } catch (err) {
            console.warn("[UpstashSocketAdapter] failed to send", err)
        }
    }

    private emitEventToHandlers(event: string, ...args: any[]) {
        const s = this.handlers.get(event)
        if (!s) return
        for (const h of s) {
            try {
                h(...args)
            } catch (err) {
                console.warn("[UpstashSocketAdapter] handler error", err)
            }
        }
    }
}

let socket: Socket | UpstashSocketAdapter | null = null
let currentJoinHandler: (() => void) | null = null

export function getSocket(): Socket | UpstashSocketAdapter {
    if (!socket) {
        if (UPSTASH_WS_URL) {
            const url = UPSTASH_WS_TOKEN ? `${UPSTASH_WS_URL}?token=${UPSTASH_WS_TOKEN}` : UPSTASH_WS_URL
            socket = new UpstashSocketAdapter(url)
        } else {
            socket = io(SOCKET_SERVER_URL, {
                transports: ["websocket", "polling"],
                autoConnect: false,
            })
        }
    }
    return socket
}

export function connectSocket(hackathonId: string, rooms: ("hackathon" | "display")[]) {
    const s = getSocket()

    // Remove previous reconnect handler if any (prevent stacking)
    if (currentJoinHandler) {
        // socket.io has 'off', our adapter also supports 'off'
        ;(s as any).off("connect", currentJoinHandler)
    }

    // Re-join rooms on every connect — including auto-reconnects after network drops
    currentJoinHandler = () => {
        if (rooms.includes("hackathon")) (s as any).emit("join:hackathon", hackathonId)
        if (rooms.includes("display")) (s as any).emit("join:display", hackathonId)
    }
    ;(s as any).on("connect", currentJoinHandler)

    if (!(s as any).connected) {
        ;(s as any).connect()
    } else {
        // Already connected — join immediately
        currentJoinHandler()
    }

    return s
}

export function disconnectSocket() {
    if (currentJoinHandler && socket) {
        ;(socket as any).off("connect", currentJoinHandler)
        currentJoinHandler = null
    }
    if ((socket as any)?.connected) {
        ;(socket as any).disconnect()
    }
}
