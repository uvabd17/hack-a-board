/**
 * Browser-side Socket.IO client singleton.
 * Import and use in client components only ("use client").
 */

import { io, Socket } from "socket.io-client"

const SOCKET_SERVER_URL =
    process.env.NEXT_PUBLIC_SOCKET_SERVER_URL || "http://localhost:3001"

let socket: Socket | null = null
let currentJoinHandler: (() => void) | null = null

export function getSocket(): Socket {
    if (!socket) {
        socket = io(SOCKET_SERVER_URL, {
            transports: ["websocket", "polling"],
            autoConnect: false,
        })
    }
    return socket
}

export function connectSocket(hackathonId: string, rooms: ("hackathon" | "display")[]) {
    const s = getSocket()

    // Remove previous reconnect handler if any (prevent stacking)
    if (currentJoinHandler) {
        s.off("connect", currentJoinHandler)
    }

    // Re-join rooms on every connect — including auto-reconnects after network drops
    currentJoinHandler = () => {
        if (rooms.includes("hackathon")) s.emit("join:hackathon", hackathonId)
        if (rooms.includes("display")) s.emit("join:display", hackathonId)
    }
    s.on("connect", currentJoinHandler)

    if (!s.connected) {
        s.connect()
    } else {
        // Already connected — join immediately
        currentJoinHandler()
    }

    return s
}

export function disconnectSocket() {
    if (currentJoinHandler && socket) {
        socket.off("connect", currentJoinHandler)
        currentJoinHandler = null
    }
    if (socket?.connected) {
        socket.disconnect()
    }
}
