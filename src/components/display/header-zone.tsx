"use client"

import { Badge } from "@/components/ui/badge"
import { Lock } from "lucide-react"
import { ConnectionStatus } from "./connection-status"
import { CountdownTimer } from "@/components/countdown-timer"
import type { SocketConnectionState } from "@/lib/socket-client"

interface HeaderZoneProps {
  hackathonName: string
  activeTrackTitle: string
  displayMode: string
  isFrozen: boolean
  socketStatus: SocketConnectionState
  currentPage: number
  totalPages: number
  lastUpdated: Date
  secondsSinceLiveUpdate: number | null
  isLive: boolean
  currentPhase: { name: string; endTime: string } | null
  activeRound: { name: string; checkpointTime: string; checkpointPausedAt?: string | null } | null
}

export function HeaderZone({
  hackathonName,
  activeTrackTitle,
  displayMode,
  isFrozen,
  socketStatus,
  currentPage,
  totalPages,
  lastUpdated,
  secondsSinceLiveUpdate,
  isLive,
  currentPhase,
  activeRound,
}: HeaderZoneProps) {
  return (
    <div className="flex-shrink-0">
      {/* Timer Bar — dedicated full-width row, always visible when live */}
      {isLive && (
        <div className="border-b border-zinc-800 py-4 px-4 grid grid-cols-2 gap-8">
          <div className="flex justify-center">
            {currentPhase ? (
              <CountdownTimer
                targetMs={new Date(currentPhase.endTime).getTime()}
                label={`${currentPhase.name} ends in`}
                size="xl"
              />
            ) : (
              <CountdownTimer targetMs={null} label="No active phase" size="xl" />
            )}
          </div>
          <div className="flex justify-center">
            {activeRound ? (
              <CountdownTimer
                targetMs={new Date(activeRound.checkpointTime).getTime()}
                pausedRemainingMs={
                  activeRound.checkpointPausedAt
                    ? new Date(activeRound.checkpointTime).getTime() - new Date(activeRound.checkpointPausedAt).getTime()
                    : null
                }
                label={`${activeRound.name} closes in`}
                size="xl"
              />
            ) : (
              <CountdownTimer targetMs={null} label="No active round" size="xl" />
            )}
          </div>
        </div>
      )}

      {/* Header — name, badges, status */}
      <header className="flex items-center justify-between px-4 py-3 border-b border-zinc-800">
        <div className="min-w-0 flex-1">
          <h1 className="text-3xl font-black tracking-tighter uppercase leading-none text-zinc-100 truncate">
            {hackathonName}
          </h1>
          <div className="flex items-center gap-3 mt-1">
            <Badge variant="outline" className="text-[11px] border-cyan-500/30 text-cyan-400 px-2.5 font-bold">
              {activeTrackTitle.toUpperCase()}
            </Badge>
            {displayMode === "auto" && (
              <Badge variant="outline" className="text-[11px] border-amber-500/30 text-amber-400 px-2.5 font-bold relative overflow-hidden">
                AUTO-CYCLING
                <span className="absolute bottom-0 left-0 h-[2px] bg-amber-400/40 animate-track-progress" />
              </Badge>
            )}
            <span className="text-[10px] text-zinc-600 tracking-wider font-mono">
              {totalPages > 1 && `PAGE ${currentPage + 1}/${totalPages} · `}
              {lastUpdated.toLocaleTimeString()}
            </span>
          </div>
        </div>

        {/* Connection or Frozen status */}
        <div className="flex-shrink-0">
          {isFrozen ? (
            <div className="flex items-center gap-2 text-blue-400 bg-blue-500/10 px-4 py-2 border border-blue-500/30">
              <Lock className="w-4 h-4" />
              <span className="text-sm font-black uppercase tracking-tighter">FROZEN</span>
            </div>
          ) : (
            <ConnectionStatus status={socketStatus} />
          )}
        </div>
      </header>
    </div>
  )
}
