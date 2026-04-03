"use client"

import type { SocketConnectionState } from "@/lib/socket-client"

interface ConnectionStatusProps {
  status: SocketConnectionState
}

const STATUS_CONFIG: Record<SocketConnectionState, { color: string; animation: string; label: string }> = {
  live: { color: "bg-cyan-500", animation: "animate-ping", label: "LIVE" },
  reconnecting: { color: "bg-amber-400", animation: "animate-pulse", label: "RECONNECTING" },
  connecting: { color: "bg-sky-400", animation: "animate-pulse", label: "CONNECTING" },
  offline: { color: "bg-red-500", animation: "", label: "OFFLINE" },
}

export function ConnectionStatus({ status }: ConnectionStatusProps) {
  const config = STATUS_CONFIG[status]

  return (
    <div className="flex items-center gap-2">
      <span className="relative flex h-2 w-2">
        {config.animation && (
          <span className={`absolute inline-flex h-full w-full rounded-full ${config.color} opacity-75 ${config.animation}`} />
        )}
        <span className={`relative inline-flex rounded-full h-2 w-2 ${config.color}`} />
      </span>
      <span className="text-xs font-bold tracking-widest uppercase font-mono text-zinc-400">
        {config.label}
      </span>
    </div>
  )
}
