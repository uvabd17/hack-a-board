/**
 * Browser-side Socket.IO client singleton.
 * Import and use in client components only ("use client").
 */

import { io, Socket } from "socket.io-client"

const SOCKET_SERVER_URL =
    process.env.NEXT_PUBLIC_SOCKET_SERVER_URL || "http://localhost:3001"

let socket: Socket | null = null
let currentJoinHandler: (() => void) | null = null
let subscriberCount = 0
let disconnectTimer: ReturnType<typeof setTimeout> | null = null
const activeRooms = new Set<string>()

export type SocketConnectionState = "connecting" | "live" | "reconnecting" | "offline"
const statusListeners = new Set<(state: SocketConnectionState) => void>()
let currentStatus: SocketConnectionState = "offline"

function setStatus(state: SocketConnectionState) {
    currentStatus = state
    statusListeners.forEach((listener) => listener(state))
}

function attachStatusListeners(sock: Socket) {
    sock.on("connect", () => setStatus("live"))
    sock.on("disconnect", () => setStatus("offline"))
    sock.io.on("reconnect_attempt", () => setStatus("reconnecting"))
    sock.io.on("reconnect", () => setStatus("live"))
    sock.io.on("error", () => setStatus("offline"))
}

function ensureSocket() {
    if (!socket) {
        socket = io(SOCKET_SERVER_URL, {
            transports: ["websocket", "polling"],
            autoConnect: false,
        })
        attachStatusListeners(socket)
    }
    return socket
}

function emitJoin(hackathonId: string, rooms: ("hackathon" | "display")[]) {
    if (rooms.includes("hackathon")) activeRooms.add(`hackathon:${hackathonId}`)
    if (rooms.includes("display")) activeRooms.add(`display:${hackathonId}`)
    for (const room of activeRooms) {
        const [scope, id] = room.split(":")
        if (scope === "hackathon") socket!.emit("join:hackathon", id)
        if (scope === "display") socket!.emit("join:display", id)
    }
}

export function connectSocket(hackathonId: string, rooms: ("hackathon" | "display")[]): Socket {
    const sock = ensureSocket()
    if (disconnectTimer) {
        clearTimeout(disconnectTimer)
        disconnectTimer = null
    }
    subscriberCount += 1

    // Remove previous reconnect handler to prevent stacking
    if (currentJoinHandler) {
        sock.off("connect", currentJoinHandler)
    }

    // Re-join rooms on every connect — including auto-reconnects after network drops
    currentJoinHandler = () => {
        emitJoin(hackathonId, rooms)
    }
    sock.on("connect", currentJoinHandler)

    if (!sock.connected) {
        setStatus("connecting")
        sock.connect()
    } else {
        currentJoinHandler()
    }

    return sock
}

export function disconnectSocket() {
    subscriberCount = Math.max(0, subscriberCount - 1)
    if (subscriberCount > 0) return

    if (currentJoinHandler && socket) {
        socket.off("connect", currentJoinHandler)
        currentJoinHandler = null
    }

    // Delay actual disconnect to avoid churn during route/component transitions.
    disconnectTimer = setTimeout(() => {
        if (subscriberCount === 0 && socket?.connected) {
            socket.disconnect()
        }
        socket = null
        activeRooms.clear()
        setStatus("offline")
        disconnectTimer = null
    }, 1500)
}

export function subscribeSocketStatus(listener: (state: SocketConnectionState) => void): () => void {
    statusListeners.add(listener)
    listener(currentStatus)
    return () => {
        statusListeners.delete(listener)
    }
}
