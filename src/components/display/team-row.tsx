"use client"

import { memo } from "react"
import { ChevronUp, ChevronDown, Minus, Lock } from "lucide-react"

interface TeamRowProps {
  rank: number
  teamName: string
  totalScore: number
  trend: "up" | "down" | "same"
  change: number
  isFrozen: boolean
  isRecentlySubmitted: boolean
  isEven: boolean
}

const MEDAL_COLORS: Record<number, { border: string; bg: string; text: string }> = {
  1: { border: "border-l-amber-400", bg: "bg-amber-400/[0.06]", text: "text-amber-400" },
  2: { border: "border-l-zinc-400", bg: "bg-zinc-400/[0.04]", text: "text-zinc-400" },
  3: { border: "border-l-amber-600", bg: "bg-amber-600/[0.04]", text: "text-amber-600" },
}

export const TeamRow = memo(function TeamRow({
  rank,
  teamName,
  totalScore,
  trend,
  change,
  isFrozen,
  isRecentlySubmitted,
  isEven,
}: TeamRowProps) {
  const medal = !isFrozen ? MEDAL_COLORS[rank] : undefined

  return (
    <div
      className={[
        "grid h-11 items-center px-4 border-l-[3px] transition-colors duration-700",
        // Row stripe
        isEven ? "bg-white/[0.02]" : "bg-transparent",
        // Medal or default border
        medal ? `${medal.border} ${medal.bg}` : "border-l-transparent",
        // Submission flash
        isRecentlySubmitted ? "animate-submission-flash" : "",
      ].join(" ")}
      style={{ gridTemplateColumns: "56px 1fr 100px 64px" }}
    >
      {/* Rank */}
      <div className={`font-mono font-black text-lg ${medal?.text || "text-zinc-500"}`}>
        {isFrozen ? "--" : rank.toString().padStart(2, "0")}
      </div>

      {/* Team Name */}
      <div className="font-mono font-bold text-base tracking-tight truncate text-zinc-100">
        {teamName.toUpperCase()}
      </div>

      {/* Score */}
      <div className="text-right font-mono font-black text-xl tabular-nums">
        {isFrozen ? (
          <span className="text-blue-500/60 text-xs tracking-widest inline-flex items-center justify-end gap-1">
            <Lock size={10} /> ---
          </span>
        ) : (
          <span className="text-cyan-400">{totalScore.toFixed(1)}</span>
        )}
      </div>

      {/* Trend */}
      <div className="flex items-center justify-end gap-0.5">
        {!isFrozen && trend === "up" && (
          <>
            <span className="text-xs font-bold tabular-nums text-emerald-400">+{change}</span>
            <ChevronUp className="w-4 h-4 text-emerald-400" />
          </>
        )}
        {!isFrozen && trend === "down" && (
          <>
            <span className="text-xs font-bold tabular-nums text-red-400">-{change}</span>
            <ChevronDown className="w-4 h-4 text-red-400" />
          </>
        )}
        {(isFrozen || trend === "same") && (
          <Minus className="w-4 h-4 text-zinc-700" />
        )}
      </div>
    </div>
  )
}, (prev, next) =>
  prev.rank === next.rank &&
  prev.totalScore === next.totalScore &&
  prev.trend === next.trend &&
  prev.change === next.change &&
  prev.isFrozen === next.isFrozen &&
  prev.isRecentlySubmitted === next.isRecentlySubmitted &&
  prev.isEven === next.isEven
)
