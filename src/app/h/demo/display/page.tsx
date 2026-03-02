"use client"

import { useEffect, useMemo, useState } from "react"
import { Badge } from "@/components/ui/badge"
import { ArrowDown, ArrowUp, Lock, Minus, Trophy } from "lucide-react"
import { CountdownTimer } from "@/components/countdown-timer"

type Team = {
  teamId: string
  teamName: string
  totalScore: number
  rank: number
  trend: "up" | "down" | "same"
  change: number
}

const BASE_TEAMS = [
  { teamId: "t1", teamName: "Team Alpha", totalScore: 985.4 },
  { teamId: "t2", teamName: "Byte Me", totalScore: 963.1 },
  { teamId: "t3", teamName: "Null Pointer", totalScore: 941.7 },
  { teamId: "t4", teamName: "Debug Thugs", totalScore: 928.2 },
  { teamId: "t5", teamName: "Ctrl Alt Defeat", totalScore: 910.6 },
  { teamId: "t6", teamName: "Hackermans", totalScore: 896.3 },
  { teamId: "t7", teamName: "Code Red", totalScore: 885.2 },
  { teamId: "t8", teamName: "Runtime Terrors", totalScore: 872.5 },
  { teamId: "t9", teamName: "Stack Smash", totalScore: 861.9 },
  { teamId: "t10", teamName: "Binary Beasts", totalScore: 853.4 },
  { teamId: "t11", teamName: "Deep Stack", totalScore: 844.8 },
  { teamId: "t12", teamName: "404 Found", totalScore: 835.9 },
  { teamId: "t13", teamName: "Cloud Command", totalScore: 828.2 },
  { teamId: "t14", teamName: "Token Titans", totalScore: 821.5 },
  { teamId: "t15", teamName: "API Avengers", totalScore: 814.1 },
  { teamId: "t16", teamName: "Git Gud", totalScore: 807.8 },
  { teamId: "t17", teamName: "Latency Lords", totalScore: 801.3 },
  { teamId: "t18", teamName: "Refactor Rebels", totalScore: 794.9 },
  { teamId: "t19", teamName: "Build Breakers", totalScore: 787.4 },
  { teamId: "t20", teamName: "Neon Ninjas", totalScore: 780.8 },
  { teamId: "t21", teamName: "Hackstreet Boys", totalScore: 772.6 },
  { teamId: "t22", teamName: "Quantum Queue", totalScore: 767.1 },
  { teamId: "t23", teamName: "Merge Masters", totalScore: 760.4 },
  { teamId: "t24", teamName: "Pixel Pirates", totalScore: 753.9 },
]

function seedTeams(): Team[] {
  return BASE_TEAMS.map((t, i) => ({
    ...t,
    rank: i + 1,
    trend: "same",
    change: 0,
  }))
}

function tickLeaderboard(current: Team[]): Team[] {
  const boosted = [...current]
  const picked = new Set<number>()

  while (picked.size < 5) {
    picked.add(Math.floor(Math.random() * boosted.length))
  }

  picked.forEach((idx) => {
    const gain = Number((Math.random() * 8 + 1.2).toFixed(1))
    boosted[idx] = {
      ...boosted[idx],
      totalScore: Number((boosted[idx].totalScore + gain).toFixed(1)),
    }
  })

  const oldRank = new Map(boosted.map((t) => [t.teamId, t.rank]))
  boosted.sort((a, b) => b.totalScore - a.totalScore)

  return boosted.map((t, index) => {
    const rank = index + 1
    const prev = oldRank.get(t.teamId) ?? rank
    return {
      ...t,
      rank,
      trend: rank < prev ? "up" : rank > prev ? "down" : "same",
      change: Math.abs(rank - prev),
    }
  })
}

function TeamRow({ team }: { team: Team }) {
  return (
    <div
      className={`
        grid grid-cols-12 gap-2 items-center px-3 py-1.5 border rounded-sm
        ${team.rank <= 3
          ? "bg-cyan-500/10 border-cyan-500/20 shadow-[0_0_10px_rgba(6,182,212,0.06)]"
          : "border-cyan-500/5 bg-cyan-500/[0.02]"}
      `}
    >
      <div className="col-span-1 font-bold text-base flex items-center">
        <span className={team.rank <= 3 ? "text-yellow-500" : "text-cyan-500/50"}>
          {team.rank === 1 && <Trophy className="w-3.5 h-3.5 inline mr-1" />}
          {team.rank.toString().padStart(2, "0")}
        </span>
      </div>

      <div className="col-span-7 font-bold truncate tracking-tight text-sm">{team.teamName.toUpperCase()}</div>

      <div className="col-span-2 text-right font-bold text-base tabular-nums">{team.totalScore.toFixed(1)}</div>

      <div className="col-span-2 text-right flex justify-end items-center gap-1">
        {team.change > 0 && (
          <span className={`text-[9px] font-bold ${team.trend === "up" ? "text-cyan-400" : "text-red-500"}`}>
            {team.trend === "up" ? "+" : "-"}
            {team.change}
          </span>
        )}
        {team.trend === "up" && <ArrowUp className="w-3.5 h-3.5 text-cyan-400" />}
        {team.trend === "down" && <ArrowDown className="w-3.5 h-3.5 text-red-500" />}
        {team.trend === "same" && <Minus className="w-3.5 h-3.5 text-cyan-500/10" />}
      </div>
    </div>
  )
}

function ColumnHeader() {
  return (
    <div className="grid grid-cols-12 gap-2 text-cyan-500/40 uppercase text-[9px] px-3 font-bold tracking-widest border-b border-cyan-500/10 pb-1.5 mb-1">
      <div className="col-span-1">#</div>
      <div className="col-span-7">TEAM</div>
      <div className="col-span-2 text-right">SCORE</div>
      <div className="col-span-2 text-right">Δ</div>
    </div>
  )
}

export default function DemoDisplayPage() {
  const [leaderboard, setLeaderboard] = useState<Team[]>(() => seedTeams())
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date())
  const [currentPage, setCurrentPage] = useState(0)

  const TEAMS_PER_PAGE = 20
  const totalPages = Math.ceil(leaderboard.length / TEAMS_PER_PAGE)

  useEffect(() => {
    const scoreInterval = setInterval(() => {
      setLeaderboard((prev) => tickLeaderboard(prev))
      setLastUpdated(new Date())
    }, 3500)

    return () => clearInterval(scoreInterval)
  }, [])

  useEffect(() => {
    if (leaderboard.length <= TEAMS_PER_PAGE) return

    const pageInterval = setInterval(() => {
      setCurrentPage((prev) => (prev + 1) % Math.ceil(leaderboard.length / TEAMS_PER_PAGE))
    }, 5000)

    return () => clearInterval(pageInterval)
  }, [leaderboard.length])

  const paginatedTeams = useMemo(() => {
    const start = currentPage * TEAMS_PER_PAGE
    return leaderboard.slice(start, start + TEAMS_PER_PAGE)
  }, [leaderboard, currentPage])

  const leftCol = paginatedTeams.slice(0, Math.ceil(paginatedTeams.length / 2))
  const rightCol = paginatedTeams.slice(Math.ceil(paginatedTeams.length / 2))

  const phaseEndMs = Date.now() + 1000 * 60 * 52
  const roundEndMs = Date.now() + 1000 * 60 * 19

  return (
    <div className="min-h-screen bg-black text-cyan-500 font-mono p-6 overflow-hidden flex flex-col">
      <div className="fixed inset-0 bg-[radial-gradient(circle_800px_at_50%_-100px,#16a34a15,transparent)] pointer-events-none" />

      <div className="border-b border-cyan-500/20 pb-4 mb-4 grid grid-cols-2 gap-8 relative z-10">
        <div className="flex justify-center">
          <CountdownTimer targetMs={phaseEndMs} label="Hacking ends in" size="xl" />
        </div>
        <div className="flex justify-center">
          <CountdownTimer targetMs={roundEndMs} label="Round 2 closes in" size="xl" />
        </div>
      </div>

      <header className="border-b border-cyan-500/30 pb-4 mb-4 flex justify-between items-end relative z-10">
        <div className="space-y-1">
          <h1 className="text-4xl font-bold tracking-tighter uppercase leading-none">DEMO HACKATHON 2026</h1>
          <div className="flex items-center gap-3">
            <Badge variant="outline" className="text-xs border-cyan-500/50 text-cyan-500 px-2 rounded-none font-bold">
              ALL TEAMS
            </Badge>
            <p className="text-cyan-500/40 text-xs">
              {totalPages > 1 && `PAGE ${currentPage + 1} · `}
              {lastUpdated.toLocaleTimeString()}
            </p>
          </div>
        </div>
        <div className="text-right">
          <div className="flex items-center gap-2 text-cyan-500">
            <span className="w-2 h-2 bg-cyan-500 rounded-full animate-ping" />
            <span className="text-sm font-bold tracking-widest uppercase">LIVE</span>
          </div>
        </div>
      </header>

      <div className="flex-1 overflow-hidden relative z-10">
        <div className="grid grid-cols-2 gap-6 h-full">
          <div className="flex flex-col">
            <ColumnHeader />
            <div className="space-y-0.5">
              {leftCol.map((team) => (
                <TeamRow key={team.teamId} team={team} />
              ))}
            </div>
          </div>
          <div className="flex flex-col">
            <ColumnHeader />
            <div className="space-y-0.5">
              {rightCol.map((team) => (
                <TeamRow key={team.teamId} team={team} />
              ))}
            </div>
          </div>
        </div>
      </div>

      <footer className="mt-4 pt-3 border-t border-cyan-500/20 flex justify-between text-[10px] text-cyan-500/40 uppercase tracking-widest font-mono relative z-10">
        <div className="flex gap-6">
          <div>DEMO</div>
          <div className="hidden md:block">MODE: GLOBAL</div>
        </div>
        <div className="flex gap-6">
          <div>TEAMS: {leaderboard.length}</div>
          <div className="text-cyan-500/20 inline-flex items-center gap-1">
            <Lock size={10} /> NON-PRODUCTION DATA
          </div>
        </div>
      </footer>
    </div>
  )
}
