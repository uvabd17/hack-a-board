/**
 * Browser-side Socket.IO client singleton.
 * Import and use in client components only ("use client").
 */

import { io, Socket } from "socket.io-client"

const SOCKET_SERVER_URL =
    process.env.NEXT_PUBLIC_SOCKET_SERVER_URL || "http://localhost:3001"

let socket: Socket | null = null
let currentJoinHandler: (() => void) | null = null

export function connectSocket(hackathonId: string, rooms: ("hackathon" | "display")[]): Socket {
    if (!socket) {
        socket = io(SOCKET_SERVER_URL, {
            transports: ["websocket", "polling"],
            autoConnect: false,
        })
    }

    // Remove previous reconnect handler to prevent stacking
    if (currentJoinHandler) {
        socket.off("connect", currentJoinHandler)
    }

    // Re-join rooms on every connect — including auto-reconnects after network drops
    currentJoinHandler = () => {
        if (rooms.includes("hackathon")) socket!.emit("join:hackathon", hackathonId)
        if (rooms.includes("display")) socket!.emit("join:display", hackathonId)
    }
    socket.on("connect", currentJoinHandler)

    if (!socket.connected) {
        socket.connect()
    } else {
        currentJoinHandler()
    }

    return socket
}

export function disconnectSocket() {
    if (currentJoinHandler && socket) {
        socket.off("connect", currentJoinHandler)
        currentJoinHandler = null
    }
    if (socket?.connected) {
        socket.disconnect()
    }
    socket = null
}
