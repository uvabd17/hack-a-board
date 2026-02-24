"use client"

import { useEffect, useState, useMemo, useRef, use } from "react"
import { getDisplayState, getTrackStanding } from "@/actions/display"
import { Badge } from "@/components/ui/badge"
import { ArrowUp, ArrowDown, Minus, Trophy, Terminal, Lock } from "lucide-react"
import { CeremonyDisplay } from "@/components/ceremony-display"
import { connectSocket, disconnectSocket } from "@/lib/socket-client"
import { CountdownTimer } from "@/components/countdown-timer"

// ── Leaderboard Row (extracted for reuse in both columns) ──────────
function TeamRow({ team, isFrozen, isRecentlySubmitted }: { 
    team: any
    isFrozen: boolean
    isRecentlySubmitted?: boolean
}) {
    return (
        <div
            className={`
                grid grid-cols-12 gap-2 items-center px-3 py-1.5 border rounded-sm
                transition-all duration-700 ease-in-out
                ${isRecentlySubmitted
                    ? 'bg-cyan-400/20 border-cyan-400/60 shadow-[0_0_20px_rgba(34,211,238,0.3)] animate-pulse'
                    : team.rank <= 3
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
    const [pendingData, setPendingData] = useState<any>(null)
    const [prevData, setPrevData] = useState<any>(null)
    const [lastUpdated, setLastUpdated] = useState<Date>(new Date())
    const [currentPage, setCurrentPage] = useState(0)
    const [autoTrackIndex, setAutoTrackIndex] = useState(-1)
    const [isTransitioning, setIsTransitioning] = useState(false)
    const [lastAutoTrackIndex, setLastAutoTrackIndex] = useState(-1)
    const [recentlySubmittedTeams, setRecentlySubmittedTeams] = useState<Set<string>>(new Set())
    const [submissionNotification, setSubmissionNotification] = useState<{
        teamName: string
        roundName: string
        timeBonus: number
    } | null>(null)
    
    // Refs to prevent useEffect dependency thrashing
    const autoTrackIndexRef = useRef(-1)
    const debounceTimerRef = useRef<NodeJS.Timeout | null>(null)
    const fetchRef = useRef<(() => Promise<void>) | null>(null)
    const problemsRef = useRef<any[]>([])
    const displayModeRef = useRef<string>("global")

    // Sync refs with state
    useEffect(() => {
        autoTrackIndexRef.current = autoTrackIndex
    }, [autoTrackIndex])
    
    useEffect(() => {
        if (data?.problems) problemsRef.current = data.problems
        if (data?.displayConfig?.mode) displayModeRef.current = data.displayConfig.mode
    }, [data?.problems, data?.displayConfig?.mode])

    // Handle pending data with smooth crossfade transition
    useEffect(() => {
        if (!pendingData) return
        
        // Start fade out
        setIsTransitioning(true)
        
        // After fade out completes, update data and fade in
        const timeout = setTimeout(() => {
            if (data) setPrevData(data)
            setData(pendingData)
            setPendingData(null)
            setLastUpdated(new Date())
            
            // Start fade in immediately
            requestAnimationFrame(() => {
                setIsTransitioning(false)
            })
        }, 250) // Shortened fade out duration
        
        return () => clearTimeout(timeout)
    }, [pendingData])

    // Global mode shows 20 teams (2 cols × 10), problem mode shows 12
    const isGlobalMode = data?.displayConfig?.mode === "global" ||
        (data?.displayConfig?.mode === "auto" && autoTrackIndex === -1)
    const TEAMS_PER_PAGE = isGlobalMode ? 20 : 12

    // ── Data fetching ─────────────────────────────────────────────
    useEffect(() => {
        const fetchData = async () => {
            // Skip fetch if transition is in progress
            if (isTransitioning || pendingData) return
            
            let problemId = null
            
            // Use refs to get current values (avoid stale closures)
            if (displayModeRef.current === "auto") {
                if (autoTrackIndexRef.current >= 0 && problemsRef.current[autoTrackIndexRef.current]) {
                    problemId = problemsRef.current[autoTrackIndexRef.current].id
                }
            }

            // Fetch either track-specific or global display state
            const result = problemId 
                ? await getTrackStanding(slug, problemId)
                : await getDisplayState(slug)

            if (result) {
                if (!result.hackathon.isFrozen || !data) {
                    if (data) {
                        // Check if this is an auto-track change (needs transition)
                        const isAutoTrackChange = displayModeRef.current === "auto" && autoTrackIndex !== lastAutoTrackIndex
                        
                        if (isAutoTrackChange) {
                            // Queue update with crossfade transition for track changes
                            setPendingData(result)
                            setLastAutoTrackIndex(autoTrackIndex)
                        } else {
                            // Instant update for timer/score/freeze changes
                            if (data) setPrevData(data)
                            setData(result)
                            setLastUpdated(new Date())
                        }
                    } else {
                        // First load, no transition
                        setData(result)
                        setLastUpdated(new Date())
                    }
                } else if (result.hackathon.isFrozen && data && !data.hackathon.isFrozen) {
                    // Just update freeze flag immediately
                    setData((prev: any) => ({
                        ...prev,
                        hackathon: { ...prev.hackathon, isFrozen: true }
                    }))
                }
            }
        }

        fetchRef.current = fetchData
        fetchData()
        const interval = setInterval(fetchData, 1000) // Poll every 1s for timer accuracy
        return () => clearInterval(interval)
    }, [slug]) // Keep stable dependency array

    // Trigger fetch when auto-cycle track changes
    useEffect(() => {
        if (displayModeRef.current === "auto" && autoTrackIndex >= -1) {
            fetchRef.current?.()
        }
    }, [autoTrackIndex])

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
            }, 100) // Reduced from 500ms to 100ms for near-instant updates
        }

        // Instant fetch with no debounce for critical display changes
        const instantFetch = () => {
            if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current)
            fetchRef.current?.()
        }

        socket.on("score-updated", debouncedFetch)
        socket.on("checkpoint-updated", instantFetch) // Use instant fetch for timer updates
        socket.on("team-submitted", (payload: {
            teamId: string
            teamName: string
            roundName: string
            timeBonus: number
        }) => {
            // Show notification toast
            setSubmissionNotification({
                teamName: payload.teamName,
                roundName: payload.roundName,
                timeBonus: payload.timeBonus
            })
            
            // Add team to recently submitted set for visual highlight
            setRecentlySubmittedTeams(prev => new Set(prev).add(payload.teamId))
            
            // Remove from highlight after 5 seconds
            setTimeout(() => {
                setRecentlySubmittedTeams(prev => {
                    const newSet = new Set(prev)
                    newSet.delete(payload.teamId)
                    return newSet
                })
            }, 5000)
            
            // Remove notification after 8 seconds
            setTimeout(() => {
                setSubmissionNotification(null)
            }, 8000)
            
            // Instant fetch to update leaderboard
            instantFetch()
        })
        socket.on("display:freeze", () => {
            setData((prev: any) => prev ? { ...prev, hackathon: { ...prev.hackathon, isFrozen: true } } : prev)
            instantFetch() // Fetch immediately to sync leaderboard
        })
        socket.on("display:unfreeze", () => {
            setData((prev: any) => prev ? { ...prev, hackathon: { ...prev.hackathon, isFrozen: false } } : prev)
            instantFetch() // Fetch immediately to show updated scores
        })
        socket.on("display:set-scene", (payload) => {
            // Handle display mode change immediately
            if (payload?.mode) {
                setData((prev: any) => prev ? {
                    ...prev,
                    displayConfig: {
                        mode: payload.mode,
                        problemId: payload.problemId || null
                    }
                } : prev)
            }
            instantFetch() // Fetch immediately for mode changes
        })
        socket.on("problem-statements-released", debouncedFetch)

        return () => {
            if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current)
            socket.off("score-updated")
            socket.off("checkpoint-updated")
            socket.off("team-submitted")
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

        // Initialize first track immediately
        setAutoTrackIndex(0)

        const cycleInterval = setInterval(() => {
            setAutoTrackIndex(prev => {
                const totalOptions = (data.problems?.length || 0) + 1
                return (prev + 2) % totalOptions - 1
            })
            setCurrentPage(0)
        }, 15000) // Cycle tracks every 15s

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
        }, 5000) // Page every 5s

        return () => clearInterval(pageInterval)
    }, [data, TEAMS_PER_PAGE])

    // ── Processed leaderboard with trend data ─────────────────────
    const processedLeaderboard = useMemo(() => {
        if (!data) return []
        
        let teams = data.leaderboard.map((team: any) => {
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
        
        // Shuffle teams when frozen to hide rankings
        if (data.hackathon.isFrozen) {
            // Create seeded random number generator
            const seed = data.hackathon.id.split('').reduce((acc: number, char) => acc + char.charCodeAt(0), 0)
            const seededRandom = (index: number) => {
                const x = Math.sin(seed + index) * 10000
                return x - Math.floor(x)
            }
            
            // Fisher-Yates shuffle with seeded random
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

    // Find current active phase
    const currentPhase = useMemo(() => {
        if (!data?.phases?.length) return null
        const now = Date.now()
        return data.phases.find((p: any) => 
            new Date(p.startTime).getTime() <= now && new Date(p.endTime).getTime() > now
        )
    }, [data?.phases])

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
            {/* Submission Notification Toast */}
            {submissionNotification && (
                <div className="fixed top-6 right-6 z-50 animate-in fade-in slide-in-from-right-5 duration-500">
                    <div className="bg-cyan-500/10 border-2 border-cyan-400 p-4 rounded shadow-2xl shadow-cyan-500/20 backdrop-blur-sm">
                        <p className="text-cyan-200 font-bold text-lg mb-1">
                            🎉 {submissionNotification.teamName.toUpperCase()} SUBMITTED!
                        </p>
                        <p className="text-cyan-300 text-sm">
                            {submissionNotification.roundName} • {" "}
                            <span className={submissionNotification.timeBonus >= 0 ? "text-green-400" : "text-red-400"}>
                                {submissionNotification.timeBonus >= 0 ? "+" : ""}
                                {submissionNotification.timeBonus.toFixed(1)} bonus
                            </span>
                        </p>
                    </div>
                </div>
            )}

            {/* Timer Bar — both timers always visible */}
            {data.hackathon.status === "live" && (
                <div className="border-b border-cyan-500/20 pb-4 mb-4 grid grid-cols-2 gap-8">
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

            {/* Header */}
            <header className="border-b border-cyan-500/30 pb-4 mb-4 flex justify-between items-end">
                <div className="space-y-1">
                    <h1 className="text-4xl font-bold tracking-tighter uppercase leading-none">{data.hackathon.name}</h1>
                    <div className="flex items-center gap-3">
                        <Badge variant="outline" className="text-xs border-cyan-500/50 text-cyan-500 px-2 rounded-none font-bold">
                            {activeTrackTitle.toUpperCase()}
                        </Badge>
                        {data.displayConfig.mode === "auto" && (
                            <Badge variant="outline" className="text-xs border-yellow-500/50 text-yellow-500 px-2 rounded-none font-bold animate-pulse">
                                AUTO-CYCLING
                            </Badge>
                        )}
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
            <div className={`flex-1 overflow-hidden transition-all duration-200 ${isTransitioning ? 'opacity-0 scale-95' : 'opacity-100 scale-100'}`}>
                {isGlobalMode ? (
                    /* ── 2-column layout for Global / overall ──────────── */
                    <div className="grid grid-cols-2 gap-6 h-full">
                        <div className="flex flex-col">
                            <ColumnHeader />
                            <div className="space-y-0.5">
                                {leftCol.map((team: any) => (
                                    <TeamRow 
                                        key={team.teamId} 
                                        team={team} 
                                        isFrozen={data.hackathon.isFrozen}
                                        isRecentlySubmitted={recentlySubmittedTeams.has(team.teamId)}
                                    />
                                ))}
                            </div>
                        </div>
                        <div className="flex flex-col">
                            <ColumnHeader />
                            <div className="space-y-0.5">
                                {rightCol.map((team: any) => (
                                    <TeamRow 
                                        key={team.teamId} 
                                        team={team} 
                                        isFrozen={data.hackathon.isFrozen}
                                        isRecentlySubmitted={recentlySubmittedTeams.has(team.teamId)}
                                    />
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
                                <TeamRow 
                                    key={team.teamId} 
                                    team={team} 
                                    isFrozen={data.hackathon.isFrozen}
                                    isRecentlySubmitted={recentlySubmittedTeams.has(team.teamId)}
                                />
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
