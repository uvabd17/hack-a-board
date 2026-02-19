"use client"

import { useEffect, useState } from "react"
import { getDisplayState } from "@/actions/display"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ArrowUp, ArrowDown, Minus, Trophy, Terminal } from "lucide-react"
import { CeremonyDisplay } from "@/components/ceremony-display"

export default function ProjectorDisplayPage({ params }: { params: { slug: string } }) {
    const [data, setData] = useState<any>(null)
    const [lastUpdated, setLastUpdated] = useState<Date>(new Date())

    useEffect(() => {
        const fetchData = async () => {
            const result = await getDisplayState(params.slug)
            if (result) {
                // Only update if not frozen or if we don't have data yet
                if (!result.hackathon.isFrozen || !data) {
                    setData(result)
                    setLastUpdated(new Date())
                } else if (result.hackathon.isFrozen && data && !data.hackathon.isFrozen) {
                    // Update the freeze state but keep the old leaderboard data
                    setData((prev: any) => ({
                        ...prev,
                        hackathon: { ...prev.hackathon, isFrozen: true }
                    }))
                }
            }
        }

        // Initial fetch
        fetchData()

        // Poll every 3 seconds
        const interval = setInterval(fetchData, 3000)
        return () => clearInterval(interval)
    }, [params.slug, data?.hackathon?.isFrozen]) // Dependency on frozen state to potentially stop polling or change logic

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
                    <p className="text-green-500/60 text-lg">LIVE LEADERBOARD_</p>
                </div>
                <div className="text-right">
                    {data.hackathon.isFrozen ? (
                        <div className="flex items-center gap-2 text-blue-400 animate-pulse">
                            <span className="text-2xl">❄️</span>
                            <span className="text-xl font-bold">MARKETS FROZEN</span>
                        </div>
                    ) : (
                        <div className="flex items-center gap-2 text-green-500">
                            <span className="w-3 h-3 bg-green-500 rounded-full animate-ping" />
                            <span className="text-xl">LIVE UPDATES</span>
                        </div>
                    )}
                </div>
            </header>

            {/* Leaderboard Grid */}
            <div className="grid gap-4 flex-1 content-start">
                <div className="grid grid-cols-12 gap-4 text-green-500/50 uppercase text-sm mb-2 px-4">
                    <div className="col-span-1">Rank</div>
                    <div className="col-span-5">Team</div>
                    <div className="col-span-3 text-right">Score</div>
                    <div className="col-span-3 text-right">Trend</div>
                </div>

                {data.leaderboard.map((team: any, index: number) => (
                    <div
                        key={team.name}
                        className={`
                            grid grid-cols-12 gap-4 items-center p-4 border border-green-500/20 rounded-md bg-green-500/5
                            transition-all duration-500
                            ${index === 0 ? 'bg-green-500/10 border-green-500/50 shadow-[0_0_15px_rgba(34,197,94,0.2)]' : ''}
                        `}
                    >
                        <div className="col-span-1 font-bold text-2xl flex items-center gap-2">
                            {index === 0 && <Trophy className="w-5 h-5 text-yellow-500" />}
                            #{team.rank}
                        </div>
                        <div className="col-span-5 text-xl tracking-tight">
                            {team.name}
                        </div>
                        <div className="col-span-3 text-right font-mono text-2xl">
                            {team.score.toLocaleString()}
                        </div>
                        <div className="col-span-3 text-right flex justify-end items-center gap-2">
                            {team.change > 0 && (
                                <span className="text-green-400 text-sm">+{team.change}</span>
                            )}
                            {team.trend === 'up' && <ArrowUp className="w-5 h-5 text-green-400" />}
                            {team.trend === 'down' && <ArrowDown className="w-5 h-5 text-red-500" />}
                            {team.trend === 'same' && <Minus className="w-5 h-5 text-gray-500" />}
                        </div>
                    </div>
                ))}
            </div>

            {/* Footer */}
            <footer className="mt-auto pt-6 text-center text-green-500/30 text-sm">
                SYSTEM_ID: {params.slug.toUpperCase()} // LAST_SYNC: {lastUpdated.toLocaleTimeString()}
            </footer>

            <CeremonyDisplay slug={params.slug} />
        </div>
    )
}
