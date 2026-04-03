"use client"

import { useEffect, useRef, useState } from "react"

interface TickerNotification {
  id: string
  teamName: string
  roundName: string
  timeBonus: number
  timestamp: number
}

const MAX_VISIBLE = 3
const NOTIFICATION_TTL_MS = 12000

export function TickerBar() {
  const [notifications, setNotifications] = useState<TickerNotification[]>([])
  const containerRef = useRef<HTMLDivElement>(null)

  // Clean up expired notifications
  useEffect(() => {
    const interval = setInterval(() => {
      setNotifications(prev =>
        prev.filter(n => Date.now() - n.timestamp < NOTIFICATION_TTL_MS)
      )
    }, 2000)
    return () => clearInterval(interval)
  }, [])

  // Expose a method to add notifications via ref or callback
  return (
    <div
      ref={containerRef}
      className="h-8 flex-shrink-0 bg-zinc-900/50 border-b border-zinc-800 overflow-hidden flex items-center px-4"
      data-ticker-bar
    >
      {notifications.length === 0 ? (
        <span className="text-[10px] text-zinc-600 uppercase tracking-[0.2em] font-mono">
          LIVE FEED
        </span>
      ) : (
        <div className="flex items-center gap-8 animate-ticker-scroll whitespace-nowrap">
          {notifications.slice(-MAX_VISIBLE).map(n => (
            <span key={n.id} className="text-xs font-mono text-cyan-300">
              <span className="font-bold">{n.teamName.toUpperCase()}</span>
              {" submitted "}
              <span className="text-zinc-400">{n.roundName}</span>
              {" "}
              <span className={n.timeBonus >= 0 ? "text-emerald-400" : "text-red-400"}>
                ({n.timeBonus >= 0 ? "+" : ""}{n.timeBonus.toFixed(1)})
              </span>
            </span>
          ))}
        </div>
      )}
    </div>
  )
}

// Helper to create a notification entry
export function createTickerNotification(
  teamName: string,
  roundName: string,
  timeBonus: number
): TickerNotification {
  return {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    teamName,
    roundName,
    timeBonus,
    timestamp: Date.now(),
  }
}
