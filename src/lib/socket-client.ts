/**
 * Browser-side Socket.IO client singleton.
 * Import and use in client components only ("use client").
 */

import { io, Socket } from "socket.io-client"

const SOCKET_SERVER_URL =
    process.env.NEXT_PUBLIC_SOCKET_SERVER_URL || "http://localhost:3001"

let socket: Socket | null = null

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

    if (!s.connected) {
        s.connect()
    }

    s.once("connect", () => {
        if (rooms.includes("hackathon")) {
            s.emit("join:hackathon", hackathonId)
        }
        if (rooms.includes("display")) {
            s.emit("join:display", hackathonId)
        }
    })

    // If already connected, join immediately
    if (s.connected) {
        if (rooms.includes("hackathon")) {
            s.emit("join:hackathon", hackathonId)
        }
        if (rooms.includes("display")) {
            s.emit("join:display", hackathonId)
        }
    }

    return s
}

export function disconnectSocket() {
    if (socket?.connected) {
        socket.disconnect()
    }
}
