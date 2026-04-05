"use client"

import { useEffect, useState, useMemo, useRef, use } from "react"
import { CeremonyDisplay } from "@/components/ceremony-display"
import { connectSocket, disconnectSocket, subscribeSocketStatus } from "@/lib/socket-client"
import type { SocketConnectionState } from "@/lib/socket-client"
import { TeamRow } from "@/components/display/team-row"
import { ColumnHeader } from "@/components/display/column-header"
import { HeaderZone } from "@/components/display/header-zone"
import { ConnectionStatus } from "@/components/display/connection-status"
import { Terminal } from "lucide-react"
import { AdaptivePollController } from "@/lib/adaptive-poll"

// ══════════════════════════════════════════════════════════════════
//  LEADERBOARD DISPLAY — Broadcast-quality projector page
// ══════════════════════════════════════════════════════════════════

export default function ProjectorDisplayPage({ params }: { params: Promise<{ slug: string }> }) {
    const { slug } = use(params)
    const [data, setData] = useState<any>(null)
    const [pendingData, setPendingData] = useState<any>(null)
    const [prevData, setPrevData] = useState<any>(null)
    const [lastUpdated, setLastUpdated] = useState<Date>(new Date())
    const [currentPage, setCurrentPage] = useState(0)
    const [autoTrackIndex, setAutoTrackIndex] = useState(-1)
    const [isTransitioning, setIsTransitioning] = useState(false)
    const [lastAutoTrackIndex, setLastAutoTrackIndex] = useState(-1)
    const [recentlySubmittedTeams, setRecentlySubmittedTeams] = useState<Set<string>>(new Set())
    const [socketStatus, setSocketStatus] = useState<SocketConnectionState>("connecting")
    const [lastSocketEventAt, setLastSocketEventAt] = useState<Date | null>(null)
    const [submissionNotifications, setSubmissionNotifications] = useState<Array<{
        id: string
        teamName: string
        roundName: string
        timeBonus: number
        timestamp: number
    }>>([])

    // Refs for socket handlers (avoid stale closures)
    const fetchRef = useRef<(() => Promise<void>) | null>(null)
    const pollControllerRef = useRef<AdaptivePollController | null>(null)
    const displayModeRef = useRef<string>("global")
    const activeProblemIdRef = useRef<string | null>(null)

    // Sync refs with state
    useEffect(() => {
        if (data?.displayConfig?.mode) displayModeRef.current = data.displayConfig.mode
        if (data?.displayConfig) activeProblemIdRef.current = data.displayConfig.problemId || null
    }, [data?.displayConfig?.mode, data?.displayConfig?.problemId])

    // Handle pending data with smooth crossfade transition
    useEffect(() => {
        if (!pendingData) return
        setIsTransitioning(true)
        const timeout = setTimeout(() => {
            if (data) setPrevData(data)
            setData(pendingData)
            setPendingData(null)
            setLastUpdated(new Date())
            requestAnimationFrame(() => setIsTransitioning(false))
        }, 250)
        return () => clearTimeout(timeout)
    }, [pendingData])

    // Clean up old ticker notifications
    useEffect(() => {
        const interval = setInterval(() => {
            setSubmissionNotifications(prev => prev.filter(n => Date.now() - n.timestamp < 12000))
        }, 2000)
        return () => clearInterval(interval)
    }, [])

    // ── Derived display state ──────────────────────────────────────
    // Determine which track to show based on mode + auto-cycle index
    const activeTrackProblemId = useMemo(() => {
        if (!data) return null
        if (data.displayConfig?.mode === "problem") return data.displayConfig.problemId || null
        if (data.displayConfig?.mode === "auto") {
            if (autoTrackIndex === -1) return null // global
            return data.problems?.[autoTrackIndex]?.id || null
        }
        return null // global mode
    }, [data?.displayConfig?.mode, data?.displayConfig?.problemId, autoTrackIndex, data?.problems])

    const isGlobalMode = activeTrackProblemId === null
    const TEAMS_PER_PAGE = isGlobalMode ? 20 : 12

    // ── Data fetching — always global, filter client-side ────────
    const etagRef = useRef<string | null>(null)

    useEffect(() => {
        const fetchData = async () => {
            if (pendingData) return

            // Always fetch global — client filters by track
            const url = `/api/display/${slug}`

            try {
                const headers: HeadersInit = {}
                if (etagRef.current) headers["If-None-Match"] = etagRef.current

                const res = await fetch(url, { headers })
                if (res.status === 304) return
                if (!res.ok) return

                const result = await res.json()
                etagRef.current = res.headers.get("etag")

                if (result) {
                    if (!result.hackathon.isFrozen || !data) {
                        if (data) setPrevData(data)
                        setData(result)
                        setLastUpdated(new Date())
                    } else if (result.hackathon.isFrozen && data && !data.hackathon.isFrozen) {
                        setData((prev: any) => ({
                            ...prev,
                            hackathon: { ...prev.hackathon, isFrozen: true }
                        }))
                    }
                }
            } catch {
                // Network error — keep stale data, polling will retry
            }
        }

        fetchRef.current = fetchData

        // Safety-net polling at longer intervals — socket is primary now
        const controller = new AdaptivePollController()
        pollControllerRef.current = controller
        controller.start(fetchData)
        return () => controller.stop()
    }, [slug])

    // ── Socket.IO — primary data channel ─────────────────────────
    useEffect(() => {
        const hackathonId = data?.hackathon?.id
        if (!hackathonId) return

        const unsubscribeStatus = subscribeSocketStatus(setSocketStatus)
        const socket = connectSocket(hackathonId, ["display", "hackathon"])
        const markLiveUpdate = () => setLastSocketEventAt(new Date())

        const triggerFetch = () => {
            markLiveUpdate()
            pollControllerRef.current?.forceNow()
        }

        // Leaderboard push — server sends fresh data directly, no fetch needed
        socket.on("leaderboard-data", (payload: { leaderboard: any[] }) => {
            markLiveUpdate()
            if (payload?.leaderboard && !data?.hackathon?.isFrozen) {
                setData((prev: any) => {
                    if (!prev) return prev
                    setPrevData(prev)
                    return { ...prev, leaderboard: payload.leaderboard }
                })
                setLastUpdated(new Date())
                // Update ETag so polling doesn't re-fetch same data
                etagRef.current = null
            }
        })

        // Fallback: score-updated without leaderboard payload → fetch
        socket.on("score-updated", triggerFetch)
        socket.on("checkpoint-updated", triggerFetch)

        socket.on("team-submitted", (payload: {
            teamId: string
            teamName: string
            roundName: string
            timeBonus: number
        }) => {
            setSubmissionNotifications(prev => [
                ...prev.slice(-2),
                {
                    id: `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
                    teamName: payload.teamName,
                    roundName: payload.roundName,
                    timeBonus: payload.timeBonus,
                    timestamp: Date.now(),
                }
            ])
            setRecentlySubmittedTeams(prev => new Set(prev).add(payload.teamId))
            setTimeout(() => {
                setRecentlySubmittedTeams(prev => {
                    const newSet = new Set(prev)
                    newSet.delete(payload.teamId)
                    return newSet
                })
            }, 5000)
            // Don't triggerFetch — leaderboard-data event handles the data update
            markLiveUpdate()
        })

        // Display control events — instant, no fetch needed
        socket.on("display:freeze", () => {
            markLiveUpdate()
            setData((prev: any) => prev ? { ...prev, hackathon: { ...prev.hackathon, isFrozen: true } } : prev)
        })
        socket.on("display:unfreeze", () => {
            markLiveUpdate()
            setData((prev: any) => prev ? { ...prev, hackathon: { ...prev.hackathon, isFrozen: false } } : prev)
            etagRef.current = null
            triggerFetch() // Need fresh unfrozen data
        })
        socket.on("display:set-scene", (payload: { mode: string; problemId?: string | null }) => {
            markLiveUpdate()
            if (payload?.mode) {
                displayModeRef.current = payload.mode
                activeProblemIdRef.current = payload.problemId || null
                setData((prev: any) => prev ? {
                    ...prev,
                    displayConfig: { mode: payload.mode, problemId: payload.problemId || null }
                } : prev)
                // No fetch needed — client-side filtering handles the view change instantly
                setCurrentPage(0)
            }
        })
        socket.on("problem-statements-released", triggerFetch)

        return () => {
            socket.off("leaderboard-data")
            socket.off("score-updated")
            socket.off("checkpoint-updated")
            socket.off("team-submitted")
            socket.off("display:freeze")
            socket.off("display:unfreeze")
            socket.off("display:set-scene")
            socket.off("problem-statements-released")
            unsubscribeStatus()
            disconnectSocket()
        }
    }, [data?.hackathon?.id])

    // ── Auto-cycle tracks ─────────────────────────────────────────
    useEffect(() => {
        if (data?.displayConfig?.mode !== "auto") {
            setAutoTrackIndex(-1)
            return
        }
        setAutoTrackIndex(0)
        const cycleInterval = setInterval(() => {
            setAutoTrackIndex(prev => {
                const totalOptions = (data.problems?.length || 0) + 1
                return (prev + 2) % totalOptions - 1
            })
            setCurrentPage(0)
        }, 15000)
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
        }, 5000)
        return () => clearInterval(pageInterval)
    }, [data, TEAMS_PER_PAGE])

    // ── Processed leaderboard with client-side track filtering ─────
    const processedLeaderboard = useMemo(() => {
        if (!data) return []

        // Client-side filter: if showing a track, filter by problemStatementId and re-rank
        let source = data.leaderboard
        if (activeTrackProblemId) {
            source = data.leaderboard
                .filter((t: any) => t.problemStatementId === activeTrackProblemId)
                .map((t: any, i: number) => ({ ...t, rank: i + 1 }))
        }

        let teams = source.map((team: any) => {
            const prevTeam = prevData?.leaderboard?.find((pt: any) => pt.teamId === team.teamId)
            let trend: "up" | "down" | "same" = "same"
            let change = 0
            if (prevTeam) {
                if (team.rank < prevTeam.rank) { trend = "up"; change = prevTeam.rank - team.rank }
                else if (team.rank > prevTeam.rank) { trend = "down"; change = team.rank - prevTeam.rank }
            }
            return { ...team, trend, change }
        })

        // Shuffle teams when frozen
        if (data.hackathon.isFrozen) {
            const seed = data.hackathon.id.split("").reduce((acc: number, char: string) => acc + char.charCodeAt(0), 0)
            const seededRandom = (index: number) => {
                const x = Math.sin(seed + index) * 10000
                return x - Math.floor(x)
            }
            const shuffled = [...teams]
            for (let i = shuffled.length - 1; i > 0; i--) {
                const j = Math.floor(seededRandom(i) * (i + 1))
                ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
            }
            teams = shuffled
        }
        return teams
    }, [data, prevData])

    const paginatedTeams = useMemo(() => {
        const start = currentPage * TEAMS_PER_PAGE
        return processedLeaderboard.slice(start, start + TEAMS_PER_PAGE)
    }, [processedLeaderboard, currentPage, TEAMS_PER_PAGE])

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

    const activeRound = useMemo(() => {
        if (!data?.rounds?.length) return null
        const now = Date.now()
        const sortedByOrder = data.rounds.slice().sort((a: any, b: any) => a.order - b.order)
        const current = sortedByOrder.find((r: any) => {
            const checkpointMs = new Date(r.checkpointTime).getTime()
            return !!r.checkpointPausedAt || checkpointMs > now
        })
        return current || sortedByOrder[sortedByOrder.length - 1]
    }, [data?.rounds])

    const currentPhase = useMemo(() => {
        if (!data?.phases?.length) return null
        const now = Date.now()
        return data.phases.find((p: any) =>
            new Date(p.startTime).getTime() <= now && new Date(p.endTime).getTime() > now
        )
    }, [data?.phases])

    const totalPages = processedLeaderboard.length > 0 ? Math.ceil(processedLeaderboard.length / TEAMS_PER_PAGE) : 1
    const secondsSinceLiveUpdate = lastSocketEventAt
        ? Math.max(0, Math.floor((Date.now() - lastSocketEventAt.getTime()) / 1000))
        : null
    const showOfflineWarning = socketStatus === "offline" && (secondsSinceLiveUpdate === null || secondsSinceLiveUpdate >= 10)

    // ── Loading state ─────────────────────────────────────────────
    if (!data) return (
        <div className="h-screen bg-[#0a0a0f] text-cyan-500 font-mono flex items-center justify-center" data-role="display">
            <div className="flex flex-col items-center gap-4 animate-pulse">
                <Terminal className="w-16 h-16" />
                <h1 className="text-2xl font-black tracking-tight">LOADING LEADERBOARD...</h1>
            </div>
        </div>
    )

    // ── Render ────────────────────────────────────────────────────
    return (
        <div className="h-screen bg-[#0a0a0f] font-mono overflow-hidden flex flex-col" data-role="display">
            {/* Offline Warning */}
            {showOfflineWarning && (
                <div className="flex-shrink-0 border-b border-amber-400/40 bg-amber-500/10 text-amber-200 px-4 py-1.5 text-[10px] uppercase tracking-wider font-bold">
                    Live sync delayed — reconnecting to socket...
                </div>
            )}

            {/* Ticker Bar — scrolling submission feed */}
            <div className="h-8 flex-shrink-0 bg-zinc-900/50 border-b border-zinc-800 overflow-hidden flex items-center px-4">
                {submissionNotifications.length === 0 ? (
                    <span className="text-[10px] text-zinc-600 uppercase tracking-[0.2em]">
                        LIVE FEED
                    </span>
                ) : (
                    <div className="flex items-center gap-8 whitespace-nowrap">
                        {submissionNotifications.map(n => (
                            <span key={n.id} className="text-xs text-cyan-300 animate-page-enter">
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

            {/* Header Zone — name, badges, timers, status */}
            <HeaderZone
                hackathonName={data.hackathon.name}
                activeTrackTitle={activeTrackTitle}
                displayMode={data.displayConfig.mode}
                isFrozen={data.hackathon.isFrozen}
                socketStatus={socketStatus}
                currentPage={currentPage}
                totalPages={totalPages}
                lastUpdated={lastUpdated}
                secondsSinceLiveUpdate={secondsSinceLiveUpdate}
                isLive={data.hackathon.status === "live"}
                currentPhase={currentPhase}
                activeRound={activeRound}
            />

            {/* Leaderboard Body */}
            <div className={`flex-1 min-h-0 overflow-hidden px-4 pt-2 relative ${
                isTransitioning ? "animate-page-exit" : "animate-page-enter"
            }`}>
                {/* Frozen overlay */}
                {data.hackathon.isFrozen && (
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
                        <span className="text-6xl font-black text-blue-500/15 uppercase tracking-[0.3em] select-none">
                            FROZEN
                        </span>
                    </div>
                )}

                <div className={data.hackathon.isFrozen ? "animate-freeze" : ""}>
                    {isGlobalMode ? (
                        /* 2-column layout for Global / overall */
                        <div className="grid grid-cols-2 gap-8 h-full">
                            <div className="flex flex-col">
                                <ColumnHeader />
                                <div className="flex flex-col gap-px">
                                    {leftCol.map((team: any, i: number) => (
                                        <TeamRow
                                            key={team.teamId}
                                            rank={team.rank}
                                            teamName={team.teamName}
                                            totalScore={team.totalScore}
                                            trend={team.trend}
                                            change={team.change}
                                            isFrozen={data.hackathon.isFrozen}
                                            isRecentlySubmitted={recentlySubmittedTeams.has(team.teamId)}
                                            isEven={i % 2 === 0}
                                        />
                                    ))}
                                </div>
                            </div>
                            <div className="flex flex-col">
                                <ColumnHeader />
                                <div className="flex flex-col gap-px">
                                    {rightCol.map((team: any, i: number) => (
                                        <TeamRow
                                            key={team.teamId}
                                            rank={team.rank}
                                            teamName={team.teamName}
                                            totalScore={team.totalScore}
                                            trend={team.trend}
                                            change={team.change}
                                            isFrozen={data.hackathon.isFrozen}
                                            isRecentlySubmitted={recentlySubmittedTeams.has(team.teamId)}
                                            isEven={i % 2 === 0}
                                        />
                                    ))}
                                </div>
                            </div>
                        </div>
                    ) : (
                        /* Single-column for problem-specific view */
                        <div>
                            <ColumnHeader />
                            <div className="flex flex-col gap-px">
                                {paginatedTeams.map((team: any, i: number) => (
                                    <TeamRow
                                        key={team.teamId}
                                        rank={team.rank}
                                        teamName={team.teamName}
                                        totalScore={team.totalScore}
                                        trend={team.trend}
                                        change={team.change}
                                        isFrozen={data.hackathon.isFrozen}
                                        isRecentlySubmitted={recentlySubmittedTeams.has(team.teamId)}
                                        isEven={i % 2 === 0}
                                    />
                                ))}
                            </div>
                        </div>
                    )}

                    {processedLeaderboard.length === 0 && (
                        <div className="h-64 flex items-center justify-center border border-dashed border-zinc-800 text-zinc-600 text-xs tracking-widest uppercase">
                            WAITING FOR SCORES...
                        </div>
                    )}
                </div>
            </div>

            {/* Footer Chrome */}
            <footer className="h-7 flex-shrink-0 flex items-center justify-between px-4 border-t border-zinc-800 text-[10px] text-zinc-600 uppercase tracking-widest font-mono">
                <div className="flex gap-6">
                    <span>{slug.toUpperCase()}</span>
                    <span className="hidden md:inline">MODE: {data.displayConfig.mode}</span>
                </div>
                <div className="flex gap-6">
                    <span>TEAMS: {processedLeaderboard.length}</span>
                    <span className="text-zinc-500">hack<span className="text-cyan-500/60">&lt;a&gt;</span>board</span>
                </div>
            </footer>

            <CeremonyDisplay slug={slug} hackathonId={data?.hackathon?.id} />
        </div>
    )
}
