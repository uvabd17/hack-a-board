"use client"

import { useEffect, useState, useMemo } from "react"
import { getDisplayState } from "@/actions/display"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ArrowUp, ArrowDown, Minus, Trophy, Terminal } from "lucide-react"
import { CeremonyDisplay } from "@/components/ceremony-display"

export default function ProjectorDisplayPage({ params }: { params: { slug: string } }) {
    const [data, setData] = useState<any>(null)
    const [prevData, setPrevData] = useState<any>(null)
    const [lastUpdated, setLastUpdated] = useState<Date>(new Date())
    const [currentPage, setCurrentPage] = useState(0)
    const TEAMS_PER_PAGE = 20

    useEffect(() => {
        const fetchData = async () => {
            const result = await getDisplayState(params.slug)
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

        fetchData()
        const interval = setInterval(fetchData, 5000) // Poll every 5s
        return () => clearInterval(interval)
    }, [params.slug, data?.hackathon?.isFrozen])

    // Auto-pagination logic
    useEffect(() => {
        if (!data || data.leaderboard.length <= TEAMS_PER_PAGE) return

        const pageInterval = setInterval(() => {
            setCurrentPage(prev => {
                const totalPages = Math.ceil(data.leaderboard.length / TEAMS_PER_PAGE)
                return (prev + 1) % totalPages
            })
        }, 10000) // Switch page every 10s

        return () => clearInterval(pageInterval)
    }, [data])

    const processedLeaderboard = useMemo(() => {
        if (!data) return []

        return data.leaderboard.map((team: any) => {
            const prevTeam = prevData?.leaderboard?.find((pt: any) => pt.teamId === team.teamId)

            let trend: 'up' | 'down' | 'same' = 'same'
            let change = 0

            if (prevTeam) {
                if (team.rank < prevTeam.rank) {
                    trend = 'up'
                    change = prevTeam.rank - team.rank
                } else if (team.rank > prevTeam.rank) {
                    trend = 'down'
                    change = team.rank - prevTeam.rank
                }
            }

            return { ...team, trend, change }
        })
    }, [data, prevData])

    const paginatedTeams = useMemo(() => {
        const start = currentPage * TEAMS_PER_PAGE
        return processedLeaderboard.slice(start, start + TEAMS_PER_PAGE)
    }, [processedLeaderboard, currentPage])

    if (!data) return (
        <div className="min-h-screen bg-black text-green-500 font-mono flex items-center justify-center">
            <div className="flex flex-col items-center gap-4 animate-pulse">
                <Terminal className="w-16 h-16" />
                <h1 className="text-2xl">INITIALIZING DISPLAY...</h1>
            </div>
        </div>
    )

    return (
        <div className="min-h-screen bg-black text-green-500 font-mono p-6 overflow-hidden flex flex-col">
            {/* Header */}
            <header className="border-b border-green-500/30 pb-4 mb-6 flex justify-between items-end">
                <div>
                    <h1 className="text-4xl font-bold tracking-tighter uppercase">{data.hackathon.name}</h1>
                    <p className="text-green-500/60 text-lg">LIVE STANDINGS / PAGE_{currentPage + 1}</p>
                </div>
                <div className="text-right">
                    {data.hackathon.isFrozen ? (
                        <div className="flex items-center gap-2 text-blue-400 animate-pulse">
                            <span className="text-2xl font-bold uppercase">MARKETS_FROZEN</span>
                        </div>
                    ) : (
                        <div className="flex items-center gap-2 text-green-500">
                            <span className="w-3 h-3 bg-green-500 rounded-full animate-ping" />
                            <span className="text-xl">LIVE_INTEL_STREAM</span>
                        </div>
                    )}
                </div>
            </header>

            {/* Leaderboard Table Container */}
            <div className="flex-1 overflow-hidden">
                <div className="grid grid-cols-12 gap-4 text-green-500/40 uppercase text-xs mb-4 px-4 font-bold tracking-widest">
                    <div className="col-span-1">RNK</div>
                    <div className="col-span-6">OPERATIVE_NAME</div>
                    <div className="col-span-3 text-right">TOTAL_SCORE</div>
                    <div className="col-span-2 text-right">TREND</div>
                </div>

                <div className="space-y-2">
                    {paginatedTeams.map((team: any) => (
                        <div
                            key={team.teamId}
                            className={`
                                grid grid-cols-12 gap-4 items-center p-3 border border-green-500/10 rounded bg-green-500/5
                                transition-all duration-700 ease-in-out
                                ${team.rank <= 3 ? 'bg-green-500/10 border-green-500/30' : ''}
                            `}
                        >
                            <div className="col-span-1 font-bold text-xl flex items-center gap-2">
                                {team.rank === 1 && <Trophy className="w-4 h-4 text-yellow-500" />}
                                <span className={team.rank <= 3 ? "text-primary" : "text-green-500/70"}>
                                    {team.rank.toString().padStart(2, '0')}
                                </span>
                            </div>
                            <div className="col-span-6 text-lg font-bold truncate">
                                {team.teamName.toUpperCase()}
                            </div>
                            <div className="col-span-3 text-right font-bold text-xl">
                                {team.totalScore.toFixed(2)}
                            </div>
                            <div className="col-span-2 text-right flex justify-end items-center gap-2">
                                {team.change > 0 && (
                                    <span className={`text-[10px] ${team.trend === 'up' ? 'text-green-400' : 'text-red-400'}`}>
                                        {team.change}
                                    </span>
                                )}
                                {team.trend === 'up' && <ArrowUp className="w-4 h-4 text-green-400 animate-bounce" />}
                                {team.trend === 'down' && <ArrowDown className="w-4 h-4 text-red-500 animate-bounce" />}
                                {team.trend === 'same' && <Minus className="w-4 h-4 text-green-500/20" />}
                            </div>
                        </div>
                    ))}
                </div>

                {data.leaderboard.length === 0 && (
                    <div className="h-64 flex items-center justify-center border border-dashed border-green-500/20 text-green-500/30">
                        WAITING_FOR_SCORING_INPUT...
                    </div>
                )}
            </div>

            {/* Terminal Info Footer */}
            <footer className="mt-6 pt-4 border-t border-green-500/10 flex justify-between text-[10px] text-green-500/40 uppercase tracking-widest">
                <div>NODE: {params.slug.toUpperCase()} // LATENCY: 24ms (MOCK)</div>
                <div>LAST_RECON: {lastUpdated.toLocaleTimeString()} // TOTAL_OPERATIVES: {data.leaderboard.length}</div>
            </footer>

            <CeremonyDisplay slug={params.slug} />
        </div>
    )
}
