"use client"

import { useState, useEffect } from "react"

function formatTime(ms: number): string {
    if (ms < 0) ms = 0
    const h = Math.floor(ms / 3600000)
    const m = Math.floor((ms % 3600000) / 60000)
    const s = Math.floor((ms % 60000) / 1000)
    return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`
}

// ─────────────────────────────────────────────
// CountdownTimer
//   targetMs        — unix ms timestamp of the deadline
//   pausedRemainingMs — if the timer is paused, pass remaining ms here
//   label           — display label above the clock
//   size            — "sm" | "lg" | "xl"
// ─────────────────────────────────────────────
export function CountdownTimer({
    targetMs,
    pausedRemainingMs,
    label,
    size = "sm",
}: {
    targetMs: number | null
    pausedRemainingMs?: number | null
    label: string
    size?: "sm" | "lg" | "xl"
}) {
    const isPaused = pausedRemainingMs != null
    const [remaining, setRemaining] = useState<number | null>(null)

    useEffect(() => {
        if (isPaused) {
            setRemaining(pausedRemainingMs ?? 0)
            return
        }
        if (!targetMs) {
            setRemaining(null)
            return
        }
        const tick = () => setRemaining(targetMs - Date.now())
        tick()
        const id = setInterval(tick, 1000)
        return () => clearInterval(id)
    }, [targetMs, isPaused, pausedRemainingMs])

    const isExpired = !isPaused && remaining !== null && remaining <= 0
    const isDanger  = !isPaused && remaining !== null && remaining <= 10 * 60 * 1000  // < 10 min
    const isWarning = !isPaused && remaining !== null && remaining <= 30 * 60 * 1000  // < 30 min

    const valueColor = isPaused
        ? "text-amber-400"
        : isDanger
        ? "text-red-400 animate-pulse"
        : isWarning
        ? "text-amber-400"
        : "text-cyan-400"

    const sizes = {
        sm: { label: "text-[9px]",  value: "text-lg",  wrap: "gap-0.5" },
        lg: { label: "text-[10px]", value: "text-3xl", wrap: "gap-1"   },
        xl: { label: "text-xs",     value: "text-5xl", wrap: "gap-1.5" },
    }
    const s = sizes[size]

    const display = remaining === null
        ? "--:--:--"
        : isExpired
        ? "00:00:00"
        : formatTime(remaining)

    return (
        <div className={`flex flex-col items-center ${s.wrap}`}>
            <span className={`uppercase tracking-[0.2em] font-bold text-cyan-500/50 ${s.label}`}>
                {label}
            </span>
            <span className={`font-mono font-bold tabular-nums leading-none ${s.value} ${valueColor}`}>
                {display}
            </span>
            {isPaused && (
                <span className="text-[8px] uppercase tracking-widest text-amber-400/70 mt-0.5">⏸ paused</span>
            )}
            {isExpired && !isPaused && (
                <span className="text-[8px] uppercase tracking-widest text-red-400/70 mt-0.5">closed</span>
            )}
        </div>
    )
}
