"use client"

import { useEffect, useMemo, useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Lock } from "lucide-react"
import { CountdownTimer } from "@/components/countdown-timer"
import { TeamRow } from "@/components/display/team-row"
import { ColumnHeader } from "@/components/display/column-header"
import { ConnectionStatus } from "@/components/display/connection-status"

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
    trend: "same" as const,
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
    boosted[idx] = { ...boosted[idx], totalScore: Number((boosted[idx].totalScore + gain).toFixed(1)) }
  })
  const oldRank = new Map(boosted.map((t) => [t.teamId, t.rank]))
  boosted.sort((a, b) => b.totalScore - a.totalScore)
  return boosted.map((t, index) => {
    const rank = index + 1
    const prev = oldRank.get(t.teamId) ?? rank
    return { ...t, rank, trend: rank < prev ? "up" : rank > prev ? "down" : "same", change: Math.abs(rank - prev) }
  })
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
    <div className="h-screen bg-[#0a0a0f] font-mono overflow-hidden flex flex-col" data-role="display">
      {/* Timer Bar */}
      <div className="border-b border-zinc-800 py-4 px-4 grid grid-cols-2 gap-8 flex-shrink-0">
        <div className="flex justify-center">
          <CountdownTimer targetMs={phaseEndMs} label="Hacking ends in" size="xl" />
        </div>
        <div className="flex justify-center">
          <CountdownTimer targetMs={roundEndMs} label="Round 2 closes in" size="xl" />
        </div>
      </div>

      {/* Header */}
      <header className="flex items-center justify-between px-4 py-3 border-b border-zinc-800 flex-shrink-0">
        <div className="min-w-0 flex-1">
          <h1 className="text-3xl font-black tracking-tighter uppercase leading-none text-zinc-100">DEMO HACKATHON 2026</h1>
          <div className="flex items-center gap-3 mt-1">
            <Badge variant="outline" className="text-[11px] border-cyan-500/30 text-cyan-400 px-2.5 font-bold">
              ALL TEAMS
            </Badge>
            <span className="text-[10px] text-zinc-600 tracking-wider">
              {totalPages > 1 && `PAGE ${currentPage + 1}/${totalPages} · `}
              {lastUpdated.toLocaleTimeString()}
            </span>
          </div>
        </div>
        <ConnectionStatus status="live" />
      </header>

      {/* Leaderboard Body */}
      <div className="flex-1 min-h-0 overflow-hidden px-4 pt-2">
        <div className="grid grid-cols-2 gap-8 h-full">
          <div className="flex flex-col">
            <ColumnHeader />
            <div className="flex flex-col gap-px">
              {leftCol.map((team, i) => (
                <TeamRow
                  key={team.teamId}
                  rank={team.rank}
                  teamName={team.teamName}
                  totalScore={team.totalScore}
                  trend={team.trend}
                  change={team.change}
                  isFrozen={false}
                  isRecentlySubmitted={false}
                  isEven={i % 2 === 0}
                />
              ))}
            </div>
          </div>
          <div className="flex flex-col">
            <ColumnHeader />
            <div className="flex flex-col gap-px">
              {rightCol.map((team, i) => (
                <TeamRow
                  key={team.teamId}
                  rank={team.rank}
                  teamName={team.teamName}
                  totalScore={team.totalScore}
                  trend={team.trend}
                  change={team.change}
                  isFrozen={false}
                  isRecentlySubmitted={false}
                  isEven={i % 2 === 0}
                />
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="h-7 flex-shrink-0 flex items-center justify-between px-4 border-t border-zinc-800 text-[10px] text-zinc-600 uppercase tracking-widest">
        <div className="flex gap-6">
          <span>DEMO</span>
          <span className="hidden md:inline">MODE: GLOBAL</span>
        </div>
        <div className="flex gap-6">
          <span>TEAMS: {leaderboard.length}</span>
          <span className="text-zinc-700 inline-flex items-center gap-1">
            <Lock size={10} /> DEMO DATA
          </span>
        </div>
      </footer>
    </div>
  )
}
