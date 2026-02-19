"use client"

import { useEffect, useState, useMemo, useRef, use } from "react"
import { getDisplayState, getTrackStanding } from "@/actions/display"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ArrowUp, ArrowDown, Minus, Trophy, Terminal, Lock } from "lucide-react"
import { CeremonyDisplay } from "@/components/ceremony-display"
import { connectSocket, disconnectSocket } from "@/lib/socket-client"

export default function ProjectorDisplayPage({ params }: { params: Promise<{ slug: string }> }) {
    const { slug } = use(params)
    const [data, setData] = useState<any>(null)
    const [prevData, setPrevData] = useState<any>(null)
    const [lastUpdated, setLastUpdated] = useState<Date>(new Date())
    const [currentPage, setCurrentPage] = useState(0)
    const [autoTrackIndex, setAutoTrackIndex] = useState(-1) // -1 = Global, 0...N = Problems
    const fetchRef = useRef<(() => Promise<void>) | null>(null)
    const TEAMS_PER_PAGE = 20

    useEffect(() => {
        const fetchData = async () => {
            let problemId = null
            if (data?.displayConfig?.mode === "auto") {
                if (autoTrackIndex >= 0 && data.problems[autoTrackIndex]) {
                    problemId = data.problems[autoTrackIndex].id
                }
            }

            const result = await getDisplayStateWithOverride(slug, problemId)

            if (result) {
                if (!result.hackathon.isFrozen || !data) {
                    setData((current: any) => {
                        if (current) setPrevData(current)
                        return result
                    })
                    setLastUpdated(new Date())
                } else if (result.hackathon.isFrozen && data && !data.hackathon.isFrozen) {
                    setData((prev: any) => ({
                        ...prev,
                        hackathon: { ...prev.hackathon, isFrozen: true }
                    }))
                }
            }
        }

        // Store latest fetchData so socket handler can call it
        fetchRef.current = fetchData

        fetchData()
        const interval = setInterval(fetchData, 15000) // 15s fallback; socket handles real-time
        return () => clearInterval(interval)
    }, [slug, data?.hackathon?.isFrozen, autoTrackIndex, data?.displayConfig?.mode])

    // Socket.IO real-time connection
    useEffect(() => {
        const hackathonId = data?.hackathon?.id
        if (!hackathonId) return

        const socket = connectSocket(hackathonId, ["display", "hackathon"])

        socket.on("score-updated", () => {
            fetchRef.current?.()
        })

        socket.on("display:freeze", () => {
            setData((prev: any) => prev ? { ...prev, hackathon: { ...prev.hackathon, isFrozen: true } } : prev)
        })

        socket.on("display:unfreeze", () => {
            setData((prev: any) => prev ? { ...prev, hackathon: { ...prev.hackathon, isFrozen: false } } : prev)
            // Re-fetch to get live data after unfreeze
            fetchRef.current?.()
        })

        socket.on("display:set-scene", () => {
            // Config changed by organizer — re-fetch to pick up new mode/problemId
            fetchRef.current?.()
        })

        socket.on("problem-statements-released", () => {
            fetchRef.current?.()
        })

        return () => {
            socket.off("score-updated")
            socket.off("display:freeze")
            socket.off("display:unfreeze")
            socket.off("display:set-scene")
            socket.off("problem-statements-released")
            disconnectSocket()
        }
    }, [data?.hackathon?.id])

    // Auto-cycle tracks logic
    useEffect(() => {
        if (data?.displayConfig?.mode !== "auto") {
            setAutoTrackIndex(-1)
            return
        }

        const cycleInterval = setInterval(() => {
            setAutoTrackIndex(prev => {
                const totalOptions = (data.problems?.length || 0) + 1 // +1 for Global
                return (prev + 2) % totalOptions - 1 // Cycles -1, 0, 1...
            })
            setCurrentPage(0) // Reset page on track change
        }, 15000) // 15s per track

        return () => clearInterval(cycleInterval)
    }, [data?.displayConfig?.mode, data?.problems?.length])

    // Auto-pagination logic
    useEffect(() => {
        if (!data || data.leaderboard.length <= TEAMS_PER_PAGE) return

        const pageInterval = setInterval(() => {
            setCurrentPage(prev => {
                const totalPages = Math.ceil(data.leaderboard.length / TEAMS_PER_PAGE)
                return (prev + 1) % totalPages
            })
        }, 8000)

        return () => clearInterval(pageInterval)
    }, [data])

    const processedLeaderboard = useMemo(() => {
        if (!data) return []

        return data.leaderboard.map((team: any) => {
            const prevTeam = prevData?.leaderboard?.find((pt: any) => pt.teamId === team.teamId)

            let trend: 'up' | 'down' | 'same' = 'same'
            let change = 0
            let prevRank = 0

            if (prevTeam) {
                prevRank = prevTeam.rank
                if (team.rank < prevTeam.rank) {
                    trend = 'up'
                    change = prevTeam.rank - team.rank
                } else if (team.rank > prevTeam.rank) {
                    trend = 'down'
                    change = team.rank - prevTeam.rank
                }
            }

            return { ...team, trend, change, prevRank }
        })
    }, [data, prevData])

    const paginatedTeams = useMemo(() => {
        const start = currentPage * TEAMS_PER_PAGE
        return processedLeaderboard.slice(start, start + TEAMS_PER_PAGE)
    }, [processedLeaderboard, currentPage])

    const activeTrackTitle = useMemo(() => {
        if (!data) return "INITIALIZING..."
        if (data.displayConfig.mode === "problem") {
            return data.problems.find((p: any) => p.id === data.displayConfig.problemId)?.title || "SPECIFIC_TRACK"
        }
        if (data.displayConfig.mode === "auto") {
            return autoTrackIndex === -1 ? "GLOBAL_RANKINGS" : data.problems[autoTrackIndex]?.title || "TRACK_VIEW"
        }
        return "GLOBAL_RANKINGS"
    }, [data, autoTrackIndex])

    if (!data) return (
        <div className="min-h-screen bg-black text-green-500 font-mono flex items-center justify-center">
            <div className="flex flex-col items-center gap-4 animate-pulse">
                <Terminal className="w-16 h-16" />
                <h1 className="text-2xl">ESTABLISHING_UPLINK...</h1>
            </div>
        </div>
    )

    return (
        <div className="min-h-screen bg-black text-green-500 font-mono p-6 overflow-hidden flex flex-col">
            {/* Header */}
            <header className="border-b border-green-500/30 pb-4 mb-6 flex justify-between items-end">
                <div className="space-y-1">
                    <h1 className="text-4xl font-bold tracking-tighter uppercase leading-none">{data.hackathon.name}</h1>
                    <div className="flex items-center gap-3">
                        <Badge variant="outline" className="text-xs border-green-500/50 text-green-500 px-2 rounded-none font-bold">
                            {activeTrackTitle.toUpperCase()}
                        </Badge>
                        <p className="text-green-500/40 text-xs">PAGE_{currentPage + 1} // SYNC_{lastUpdated.toLocaleTimeString()}</p>
                    </div>
                </div>
                <div className="text-right">
                    {data.hackathon.isFrozen ? (
                        <div className="flex items-center gap-2 text-blue-400 animate-pulse bg-blue-500/10 px-4 py-2 border border-blue-500/30">
                            <Lock className="w-5 h-5" />
                            <span className="text-2xl font-bold uppercase tracking-tighter">MARKETS_FROZEN</span>
                        </div>
                    ) : (
                        <div className="flex items-center gap-2 text-green-500">
                            <span className="w-2 h-2 bg-green-500 rounded-full animate-ping" />
                            <span className="text-sm font-bold tracking-widest uppercase">LIVE_DATA_STREAM</span>
                        </div>
                    )}
                </div>
            </header>

            {/* Leaderboard Table Container */}
            <div className="flex-1 overflow-hidden">
                <div className="grid grid-cols-12 gap-4 text-green-500/40 uppercase text-[10px] mb-4 px-4 font-bold tracking-widest border-b border-green-500/10 pb-2">
                    <div className="col-span-1">RNK</div>
                    <div className="col-span-6">OPERATIVE_NAME</div>
                    <div className="col-span-3 text-right">TOTAL_SCORE</div>
                    <div className="col-span-2 text-right">TREND_DELTA</div>
                </div>

                <div className="space-y-1">
                    {paginatedTeams.map((team: any) => (
                        <div
                            key={team.teamId}
                            className={`
                                grid grid-cols-12 gap-4 items-center p-2 border border-green-500/5 rounded-sm bg-green-500/[0.02]
                                transition-all duration-700 ease-in-out
                                ${team.rank <= 3 ? 'bg-green-500/10 border-green-500/20 shadow-[0_0_10px_rgba(34,197,94,0.05)]' : ''}
                            `}
                        >
                            <div className="col-span-1 font-bold text-xl flex items-center gap-2">
                                <span className={team.rank <= 3 && !data.hackathon.isFrozen ? "text-yellow-500" : "text-green-500/50"}>
                                    {team.rank === 1 && !data.hackathon.isFrozen && <Trophy className="w-4 h-4" />}
                                    {data.hackathon.isFrozen ? "--" : team.rank.toString().padStart(2, '0')}
                                </span>
                            </div>
                            <div className="col-span-6 text-lg font-bold truncate tracking-tight">
                                {team.teamName.toUpperCase()}
                            </div>
                            <div className="col-span-3 text-right font-bold text-xl tabular-nums">
                                {data.hackathon.isFrozen ? (
                                    <span className="text-zinc-600 text-sm tracking-widest flex items-center justify-end gap-1">
                                        <Lock size={12} /> LOCKED
                                    </span>
                                ) : (
                                    team.totalScore.toFixed(1)
                                )}
                            </div>
                            <div className="col-span-2 text-right flex justify-end items-center gap-2">
                                {!data.hackathon.isFrozen && team.change > 0 && (
                                    <div className="flex flex-col items-end leading-none">
                                        <span className={`text-[9px] font-bold ${team.trend === 'up' ? 'text-green-400' : 'text-red-500'}`}>
                                            {team.trend === 'up' ? '+' : '-'}{team.change}
                                        </span>
                                        <span className="text-[8px] text-zinc-600 font-mono">
                                            #{team.prevRank}→#{team.rank}
                                        </span>
                                    </div>
                                )}
                                {!data.hackathon.isFrozen && team.trend === 'up' && <ArrowUp className="w-4 h-4 text-green-400 animate-bounce" />}
                                {!data.hackathon.isFrozen && team.trend === 'down' && <ArrowDown className="w-4 h-4 text-red-500 animate-bounce" />}
                                {(data.hackathon.isFrozen || team.trend === 'same') && <Minus className="w-4 h-4 text-green-500/10" />}
                            </div>
                        </div>
                    ))}
                </div>

                {data.leaderboard.length === 0 && (
                    <div className="h-64 flex items-center justify-center border border-dashed border-green-500/10 text-green-500/20 text-xs tracking-widest uppercase">
                        WAITING_FOR_INBOUND_SCORING_DATA...
                    </div>
                )}
            </div>

            {/* Terminal Info Footer */}
            <footer className="mt-6 pt-4 border-t border-green-500/20 flex justify-between text-[10px] text-green-500/40 uppercase tracking-widest font-mono">
                <div className="flex gap-6">
                    <div>NODE: {slug.toUpperCase()}</div>
                    <div className="hidden sm:block">KERNEL: 14.2.0-HACKA</div>
                    <div className="hidden md:block">MODE: {data.displayConfig.mode}</div>
                </div>
                <div className="flex gap-6">
                    <div>TOTAL_OPERATIVES: {data.leaderboard.length}</div>
                    <div className="text-green-500/20">[ UPTIME: 04:12:09 ]</div>
                </div>
            </footer>

            <CeremonyDisplay slug={slug} hackathonId={data?.hackathon?.id} />
        </div>
    )
}

// Helper to handle local overrides for auto-cycling
async function getDisplayStateWithOverride(slug: string, problemId?: string | null) {
    if (problemId) {
        // We need a server action that allows fetching specific problem leaderboard 
        // regardless of the DB's displayMode (for auto-cycling)
        return await getTrackStanding(slug, problemId)
    }
    return await getDisplayState(slug)
}
