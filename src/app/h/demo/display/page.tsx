"use client"

import { useEffect, useMemo, useState } from "react"
import { ArrowDown, ArrowUp, Minus, Trophy } from "lucide-react"

type DemoTeam = {
  id: string
  name: string
  score: number
  rank: number
  prevRank: number
  change: number
  trend: "up" | "down" | "same"
}

const INITIAL_TEAMS: Array<{ id: string; name: string; score: number }> = [
  { id: "t1", name: "Team Alpha", score: 985.4 },
  { id: "t2", name: "Byte Me", score: 963.1 },
  { id: "t3", name: "Null Pointer", score: 941.7 },
  { id: "t4", name: "Debug Thugs", score: 928.2 },
  { id: "t5", name: "Ctrl Alt Defeat", score: 910.6 },
  { id: "t6", name: "Hackermans", score: 896.3 },
  { id: "t7", name: "Code Red", score: 885.2 },
  { id: "t8", name: "Runtime Terrors", score: 872.5 },
  { id: "t9", name: "Stack Smash", score: 861.9 },
  { id: "t10", name: "Binary Beasts", score: 853.4 },
  { id: "t11", name: "Deep Stack", score: 844.8 },
  { id: "t12", name: "404 Found", score: 835.9 },
  { id: "t13", name: "Cloud Command", score: 828.2 },
  { id: "t14", name: "Token Titans", score: 821.5 },
  { id: "t15", name: "API Avengers", score: 814.1 },
  { id: "t16", name: "Git Gud", score: 807.8 },
  { id: "t17", name: "Latency Lords", score: 801.3 },
  { id: "t18", name: "Refactor Rebels", score: 794.9 },
]

function initializeTeams(): DemoTeam[] {
  return INITIAL_TEAMS.map((t, i) => ({
    ...t,
    rank: i + 1,
    prevRank: i + 1,
    change: 0,
    trend: "same",
  }))
}

function simulateTick(current: DemoTeam[]): DemoTeam[] {
  const boosted = [...current]
  const pickCount = 4
  const picked = new Set<number>()

  while (picked.size < pickCount) {
    picked.add(Math.floor(Math.random() * boosted.length))
  }

  picked.forEach((idx) => {
    const gain = Number((Math.random() * 8 + 1.5).toFixed(1))
    boosted[idx] = { ...boosted[idx], score: Number((boosted[idx].score + gain).toFixed(1)) }
  })

  const prevRanks = new Map(boosted.map((t) => [t.id, t.rank]))
  boosted.sort((a, b) => b.score - a.score)

  return boosted.map((t, i) => {
    const newRank = i + 1
    const oldRank = prevRanks.get(t.id) ?? newRank
    const delta = Math.abs(newRank - oldRank)

    return {
      ...t,
      rank: newRank,
      prevRank: oldRank,
      change: delta,
      trend: newRank < oldRank ? "up" : newRank > oldRank ? "down" : "same",
    }
  })
}

function TeamRow({ team }: { team: DemoTeam }) {
  return (
    <div className="grid grid-cols-12 gap-2 items-center px-3 py-1.5 border rounded-sm border-cyan-500/10 bg-cyan-500/[0.03]">
      <div className="col-span-1 font-bold text-base text-cyan-400">
        {team.rank === 1 ? <Trophy className="w-3.5 h-3.5 inline" /> : team.rank.toString().padStart(2, "0")}
      </div>
      <div className="col-span-6 font-bold truncate tracking-tight text-sm uppercase">{team.name}</div>
      <div className="col-span-3 text-right font-bold text-base tabular-nums">{team.score.toFixed(1)}</div>
      <div className="col-span-2 text-right flex justify-end items-center gap-1">
        {team.trend === "up" && (
          <>
            <span className="text-[9px] font-bold text-cyan-400">+{team.change}</span>
            <ArrowUp className="w-3.5 h-3.5 text-cyan-400" />
          </>
        )}
        {team.trend === "down" && (
          <>
            <span className="text-[9px] font-bold text-red-500">-{team.change}</span>
            <ArrowDown className="w-3.5 h-3.5 text-red-500" />
          </>
        )}
        {team.trend === "same" && <Minus className="w-3.5 h-3.5 text-cyan-500/30" />}
      </div>
    </div>
  )
}

export default function DemoDisplayPage() {
  const [teams, setTeams] = useState<DemoTeam[]>(() => initializeTeams())
  const [page, setPage] = useState(0)
  const [now, setNow] = useState<Date>(new Date())

  const PAGE_SIZE = 12
  const totalPages = Math.max(1, Math.ceil(teams.length / PAGE_SIZE))

  useEffect(() => {
    const scoreTimer = setInterval(() => setTeams((prev) => simulateTick(prev)), 3500)
    const pageTimer = setInterval(() => setPage((p) => (p + 1) % totalPages), 9000)
    const clockTimer = setInterval(() => setNow(new Date()), 1000)

    return () => {
      clearInterval(scoreTimer)
      clearInterval(pageTimer)
      clearInterval(clockTimer)
    }
  }, [totalPages])

  const pageTeams = useMemo(() => {
    const start = page * PAGE_SIZE
    return teams.slice(start, start + PAGE_SIZE)
  }, [teams, page])

  const left = pageTeams.slice(0, 6)
  const right = pageTeams.slice(6, 12)

  return (
    <div className="min-h-screen bg-black text-cyan-100 font-mono overflow-hidden">
      <div className="fixed inset-0 bg-[radial-gradient(circle_800px_at_50%_-20%,#16a34a1a,transparent)] pointer-events-none" />
      <div className="fixed inset-0 bg-[linear-gradient(to_right,#0f766e14_1px,transparent_1px),linear-gradient(to_bottom,#0f766e14_1px,transparent_1px)] bg-[size:38px_38px] pointer-events-none" />

      <main className="relative z-10 p-6 md:p-10">
        <header className="border border-cyan-500/20 bg-cyan-500/[0.04] px-5 py-4 mb-6 flex items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-4xl font-bold tracking-tight text-white">HACK&lt;A&gt;BOARD DEMO DISPLAY</h1>
            <p className="text-cyan-300/70 text-xs md:text-sm mt-1 uppercase tracking-widest">Simulated live leaderboard for preview</p>
          </div>
          <div className="text-right">
            <div className="text-[10px] uppercase tracking-[0.2em] text-cyan-400/70">Demo Mode</div>
            <div className="text-sm md:text-base font-bold tabular-nums text-white">{now.toLocaleTimeString()}</div>
            <div className="text-[10px] uppercase tracking-[0.2em] text-cyan-500/70">Page {page + 1}/{totalPages}</div>
          </div>
        </header>

        <section className="border border-cyan-500/20 bg-black/50 p-4 md:p-5">
          <div className="grid grid-cols-12 gap-2 text-cyan-400/60 uppercase text-[9px] px-3 font-bold tracking-widest border-b border-cyan-500/10 pb-1.5 mb-2">
            <div className="col-span-1">#</div>
            <div className="col-span-6">Team</div>
            <div className="col-span-3 text-right">Score</div>
            <div className="col-span-2 text-right">Trend</div>
          </div>

          <div className="grid md:grid-cols-2 gap-3">
            <div className="space-y-2">{left.map((t) => <TeamRow key={t.id} team={t} />)}</div>
            <div className="space-y-2">{right.map((t) => <TeamRow key={t.id} team={t} />)}</div>
          </div>
        </section>
      </main>
    </div>
  )
}
