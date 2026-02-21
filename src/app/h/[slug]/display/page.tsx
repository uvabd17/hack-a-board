"use client"

import { useEffect, useState, useMemo, useRef, use } from "react"
import { getDisplayState, getTrackStanding } from "@/actions/display"
import { Badge } from "@/components/ui/badge"
import { ArrowUp, ArrowDown, Minus, Trophy, Terminal, Lock } from "lucide-react"
import { CeremonyDisplay } from "@/components/ceremony-display"
import { connectSocket, disconnectSocket } from "@/lib/socket-client"
import { CountdownTimer } from "@/components/countdown-timer"

// ── Leaderboard Row (extracted for reuse in both columns) ──────────
function TeamRow({ team, isFrozen }: { team: any; isFrozen: boolean }) {
    return (
        <div
            className={`
                grid grid-cols-12 gap-2 items-center px-3 py-1.5 border rounded-sm
                transition-all duration-700 ease-in-out
                ${team.rank <= 3
                    ? 'bg-cyan-500/10 border-cyan-500/20 shadow-[0_0_10px_rgba(6,182,212,0.06)]'
                    : 'border-cyan-500/5 bg-cyan-500/[0.02]'}
            `}
        >
            {/* Rank */}
            <div className="col-span-1 font-bold text-base flex items-center">
                <span className={team.rank <= 3 && !isFrozen ? "text-yellow-500" : "text-cyan-500/50"}>
                    {team.rank === 1 && !isFrozen && <Trophy className="w-3.5 h-3.5 inline mr-1" />}
                    {isFrozen ? "--" : team.rank.toString().padStart(2, '0')}
                </span>
            </div>

            {/* Team name */}
            <div className="col-span-7 font-bold truncate tracking-tight text-sm">
                {team.teamName.toUpperCase()}
            </div>

            {/* Score */}
            <div className="col-span-2 text-right font-bold text-base tabular-nums">
                {isFrozen ? (
                    <span className="text-zinc-600 text-[10px] tracking-widest inline-flex items-center justify-end gap-1">
                        <Lock size={10} /> LOCKED
                    </span>
                ) : (
                    team.totalScore.toFixed(1)
                )}
            </div>

            {/* Trend */}
            <div className="col-span-2 text-right flex justify-end items-center gap-1">
                {!isFrozen && team.change > 0 && (
                    <span className={`text-[9px] font-bold ${team.trend === 'up' ? 'text-cyan-400' : 'text-red-500'}`}>
                        {team.trend === 'up' ? '+' : '-'}{team.change}
                    </span>
                )}
                {!isFrozen && team.trend === 'up' && <ArrowUp className="w-3.5 h-3.5 text-cyan-400" />}
                {!isFrozen && team.trend === 'down' && <ArrowDown className="w-3.5 h-3.5 text-red-500" />}
                {(isFrozen || team.trend === 'same') && <Minus className="w-3.5 h-3.5 text-cyan-500/10" />}
            </div>
        </div>
    )
}

// ── Column Header ──────────────────────────────────────────────────
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

// ══════════════════════════════════════════════════════════════════
//  MAIN DISPLAY PAGE
// ══════════════════════════════════════════════════════════════════

export default function ProjectorDisplayPage({ params }: { params: Promise<{ slug: string }> }) {
    const { slug } = use(params)
    const [data, setData] = useState<any>(null)
    const [prevData, setPrevData] = useState<any>(null)
    const [lastUpdated, setLastUpdated] = useState<Date>(new Date())
    const [currentPage, setCurrentPage] = useState(0)
    const [autoTrackIndex, setAutoTrackIndex] = useState(-1)
    
    // Refs to prevent useEffect dependency thrashing
    const autoTrackIndexRef = useRef(-1)
    const debounceTimerRef = useRef<NodeJS.Timeout | null>(null)
    const fetchRef = useRef<(() => Promise<void>) | null>(null)

    // Sync ref with state
    useEffect(() => {
        autoTrackIndexRef.current = autoTrackIndex
    }, [autoTrackIndex])

    // Global mode shows 20 teams (2 cols × 10), problem mode shows 12
    const isGlobalMode = data?.displayConfig?.mode === "global" ||
        (data?.displayConfig?.mode === "auto" && autoTrackIndex === -1)
    const TEAMS_PER_PAGE = isGlobalMode ? 20 : 12

    // ── Data fetching ─────────────────────────────────────────────
    useEffect(() => {
        const fetchData = async () => {
            let problemId = null
            const currentData = data
            if (currentData?.displayConfig?.mode === "auto") {
                if (autoTrackIndexRef.current >= 0 && currentData.problems[autoTrackIndexRef.current]) {
                    problemId = currentData.problems[autoTrackIndexRef.current].id
                }
            }

            const result = await getDisplayStateWithOverride(slug, problemId)

            if (result) {
                if (!result.hackathon.isFrozen || !currentData) {
                    setData((current: any) => {
                        if (current) setPrevData(current)
                        return result
                    })
                    setLastUpdated(new Date())
                } else if (result.hackathon.isFrozen && currentData && !currentData.hackathon.isFrozen) {
                    // Just update freeze flag without clearing prevData
                    setData((prev: any) => ({
                        ...prev,
                        hackathon: { ...prev.hackathon, isFrozen: true }
                    }))
                }
            }
        }

        fetchRef.current = fetchData
        fetchData()
        const interval = setInterval(fetchData, 30000) // Reduced from 15s to 30s
        return () => clearInterval(interval)
    }, [slug]) // Only depend on slug to prevent effect churn

    // ── Socket.IO real-time with debouncing ───────────────────────
    useEffect(() => {
        const hackathonId = data?.hackathon?.id
        if (!hackathonId) return

        const socket = connectSocket(hackathonId, ["display", "hackathon"])

        // Debounced fetch to prevent server hammering during scoring bursts
        const debouncedFetch = () => {
            if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current)
            debounceTimerRef.current = setTimeout(() => {
                fetchRef.current?.()
            }, 500)
        }

        socket.on("score-updated", debouncedFetch)
        socket.on("checkpoint-updated", debouncedFetch)
        socket.on("display:freeze", () => {
            setData((prev: any) => prev ? { ...prev, hackathon: { ...prev.hackathon, isFrozen: true } } : prev)
        })
        socket.on("display:unfreeze", () => {
            setData((prev: any) => prev ? { ...prev, hackathon: { ...prev.hackathon, isFrozen: false } } : prev)
            debouncedFetch()
        })
        socket.on("display:set-scene", debouncedFetch)
        socket.on("problem-statements-released", debouncedFetch)

        return () => {
            if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current)
            socket.off("score-updated")
            socket.off("checkpoint-updated")
            socket.off("display:freeze")
            socket.off("display:unfreeze")
            socket.off("display:set-scene")
            socket.off("problem-statements-released")
            disconnectSocket()
        }
    }, [data?.hackathon?.id])

    // ── Auto-cycle tracks ─────────────────────────────────────────
    useEffect(() => {
        if (data?.displayConfig?.mode !== "auto") {
            setAutoTrackIndex(-1)
            return
        }

        const cycleInterval = setInterval(() => {
            setAutoTrackIndex(prev => {
                const totalOptions = (data.problems?.length || 0) + 1
                return (prev + 2) % totalOptions - 1
            })
            setCurrentPage(0)
        }, 30000) // Changed from 15s to 30s per spec

        return () => clearInterval(cycleInterval)
    }, [data?.displayConfig?.mode, data?.problems?.length])

    // ── Auto-pagination ───────────────────────────────────────────
    useEffect(() => {
        if (!data || data.leaderboard.length <= TEAMS_PER_PAGE) return

        const pageInterval = setInterval(() => {
            setCurrentPage(prev => {
                const totalPages = Math.ceil(data.leaderboard.length / TEAMS_PER_PAGE)
                return (prev + 1) % totalPages
            })
        }, 10000) // Changed from 8s to 10s per spec

        return () => clearInterval(pageInterval)
    }, [data, TEAMS_PER_PAGE])

    // ── Processed leaderboard with trend data ─────────────────────
    const processedLeaderboard = useMemo(() => {
        if (!data) return []
        return data.leaderboard.map((team: any) => {
            const prevTeam = prevData?.leaderboard?.find((pt: any) => pt.teamId === team.teamId)
            let trend: 'up' | 'down' | 'same' = 'same'
            let change = 0
            let prevRank = 0
            if (prevTeam) {
                prevRank = prevTeam.rank
                if (team.rank < prevTeam.rank) { trend = 'up'; change = prevTeam.rank - team.rank }
                else if (team.rank > prevTeam.rank) { trend = 'down'; change = team.rank - prevTeam.rank }
            }
            return { ...team, trend, change, prevRank }
        })
    }, [data, prevData])

    const paginatedTeams = useMemo(() => {
        const start = currentPage * TEAMS_PER_PAGE
        return processedLeaderboard.slice(start, start + TEAMS_PER_PAGE)
    }, [processedLeaderboard, currentPage, TEAMS_PER_PAGE])

    // Split into left/right columns for 2-col global layout
    const leftCol = useMemo(() => isGlobalMode ? paginatedTeams.slice(0, Math.ceil(paginatedTeams.length / 2)) : paginatedTeams, [paginatedTeams, isGlobalMode])
    const rightCol = useMemo(() => isGlobalMode ? paginatedTeams.slice(Math.ceil(paginatedTeams.length / 2)) : [], [paginatedTeams, isGlobalMode])

    const activeTrackTitle = useMemo(() => {
        if (!data) return "LOADING..."
        if (data.displayConfig.mode === "problem") {
            return data.problems.find((p: any) => p.id === data.displayConfig.problemId)?.title || "Track"
        }
        if (data.displayConfig.mode === "auto") {
            return autoTrackIndex === -1 ? "ALL TEAMS" : data.problems[autoTrackIndex]?.title || "Track"
        }
        return "ALL TEAMS"
    }, [data, autoTrackIndex])

    // ── Active round checkpoint (nearest future deadline, or paused) ────
    const activeRound = useMemo(() => {
        if (!data?.rounds?.length) return null
        const now = Date.now()
        // Paused round takes priority
        const paused = data.rounds.find((r: any) => r.checkpointPausedAt)
        if (paused) return paused
        // Nearest future (or most recently expired)
        return data.rounds
            .slice()
            .sort((a: any, b: any) => new Date(a.checkpointTime).getTime() - new Date(b.checkpointTime).getTime())
            .find((r: any) => new Date(r.checkpointTime).getTime() > now)
            || data.rounds[data.rounds.length - 1]
    }, [data?.rounds])

    // ── Loading state ─────────────────────────────────────────────
    if (!data) return (
        <div className="min-h-screen bg-black text-cyan-500 font-mono flex items-center justify-center">
            <div className="flex flex-col items-center gap-4 animate-pulse">
                <Terminal className="w-16 h-16" />
                <h1 className="text-2xl">LOADING LEADERBOARD...</h1>
            </div>
        </div>
    )

    // ── Render ────────────────────────────────────────────────────
    return (
        <div className="min-h-screen bg-black text-cyan-500 font-mono p-6 overflow-hidden flex flex-col">
            {/* Timer Bar — both timers always visible */}
            {data.hackathon.status === "live" && (
                <div className="border-b border-cyan-500/20 pb-4 mb-4 grid grid-cols-2 gap-8">
                    <div className="flex justify-center">
                        <CountdownTimer
                            targetMs={data.hackathon.endDate ? new Date(data.hackathon.endDate).getTime() : null}
                            label="Event ends in"
                            size="xl"
                        />
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

            {/* Header */}
            <header className="border-b border-cyan-500/30 pb-4 mb-4 flex justify-between items-end">
                <div className="space-y-1">
                    <h1 className="text-4xl font-bold tracking-tighter uppercase leading-none">{data.hackathon.name}</h1>
                    <div className="flex items-center gap-3">
                        <Badge variant="outline" className="text-xs border-cyan-500/50 text-cyan-500 px-2 rounded-none font-bold">
                            {activeTrackTitle.toUpperCase()}
                        </Badge>
                        <p className="text-cyan-500/40 text-xs">
                            {data.leaderboard.length > TEAMS_PER_PAGE && `PAGE ${currentPage + 1} · `}
                            {lastUpdated.toLocaleTimeString()}
                        </p>
                    </div>
                </div>
                <div className="text-right">
                    {data.hackathon.isFrozen ? (
                        <div className="flex items-center gap-2 text-blue-400 animate-pulse bg-blue-500/10 px-4 py-2 border border-blue-500/30">
                            <Lock className="w-5 h-5" />
                            <span className="text-2xl font-bold uppercase tracking-tighter">BOARD FROZEN</span>
                        </div>
                    ) : (
                        <div className="flex items-center gap-2 text-cyan-500">
                            <span className="w-2 h-2 bg-cyan-500 rounded-full animate-ping" />
                            <span className="text-sm font-bold tracking-widest uppercase">LIVE</span>
                        </div>
                    )}
                </div>
            </header>

            {/* Leaderboard */}
            <div className="flex-1 overflow-hidden">
                {isGlobalMode ? (
                    /* ── 2-column layout for Global / overall ──────────── */
                    <div className="grid grid-cols-2 gap-6 h-full">
                        <div className="flex flex-col">
                            <ColumnHeader />
                            <div className="space-y-0.5">
                                {leftCol.map((team: any) => (
                                    <TeamRow key={team.teamId} team={team} isFrozen={data.hackathon.isFrozen} />
                                ))}
                            </div>
                        </div>
                        <div className="flex flex-col">
                            <ColumnHeader />
                            <div className="space-y-0.5">
                                {rightCol.map((team: any) => (
                                    <TeamRow key={team.teamId} team={team} isFrozen={data.hackathon.isFrozen} />
                                ))}
                            </div>
                        </div>
                    </div>
                ) : (
                    /* ── Single-column for problem-specific view ───────── */
                    <div>
                        <ColumnHeader />
                        <div className="space-y-0.5">
                            {paginatedTeams.map((team: any) => (
                                <TeamRow key={team.teamId} team={team} isFrozen={data.hackathon.isFrozen} />
                            ))}
                        </div>
                    </div>
                )}

                {data.leaderboard.length === 0 && (
                    <div className="h-64 flex items-center justify-center border border-dashed border-cyan-500/10 text-cyan-500/20 text-xs tracking-widest uppercase">
                        WAITING FOR SCORES...
                    </div>
                )}
            </div>

            {/* Footer */}
            <footer className="mt-4 pt-3 border-t border-cyan-500/20 flex justify-between text-[10px] text-cyan-500/40 uppercase tracking-widest font-mono">
                <div className="flex gap-6">
                    <div>{slug.toUpperCase()}</div>
                    <div className="hidden md:block">MODE: {data.displayConfig.mode}</div>
                </div>
                <div className="flex gap-6">
                    <div>TEAMS: {data.leaderboard.length}</div>
                    <div className="text-cyan-500/20">hack&lt;a&gt;board</div>
                </div>
            </footer>

            <CeremonyDisplay slug={slug} hackathonId={data?.hackathon?.id} />
        </div>
    )
}

// Helper to handle local overrides for auto-cycling
async function getDisplayStateWithOverride(slug: string, problemId?: string | null) {
    if (problemId) {
        return await getTrackStanding(slug, problemId)
    }
    return await getDisplayState(slug)
}
