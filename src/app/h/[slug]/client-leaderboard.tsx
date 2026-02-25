"use client"

import { useState, useEffect } from "react"
import { getLeaderboardData } from "@/actions/leaderboard"
import { TickerRow } from "./components/ticker-row"
import { Loader2 } from "lucide-react"

interface LeaderboardData {
    isFrozen: boolean;
    teams: {
        rank: number;
        teamId: string;
        teamName: string;
        totalScore: number;
    }[];
}

export function ClientLeaderboard({ slug }: { slug: string }) {
    const [data, setData] = useState<LeaderboardData | null>(null)
    const [loading, setLoading] = useState(true)

    const fetchData = async () => {
        try {
            const res = await getLeaderboardData(slug)
            if (res) {
                setData({
                    isFrozen: res.frozen,
                    teams: res.leaderboard
                })
            }
        } catch (e) {
            console.error(e)
        }
        setLoading(false)
    }

    useEffect(() => {
        fetchData()
        const interval = setInterval(fetchData, 5000) // Poll every 5s
        return () => clearInterval(interval)
    }, [slug])

    if (loading && !data) {
        return (
            <div className="flex justify-center py-20">
                <Loader2 className="animate-spin text-green-500 w-8 h-8" />
            </div>
        )
    }

    if (!data || data.teams.length === 0) {
        return (
            <div className="text-center py-20 border border-dashed border-zinc-800 text-zinc-600 font-mono">
                WAITING_FOR_TEAMS...
            </div>
        )
    }

    return (
        <div className="space-y-0">
            <div className="grid grid-cols-12 gap-4 pb-2 border-b-2 border-zinc-800 text-xs text-zinc-500 font-mono uppercase tracking-widest mb-2">
                <div className="col-span-2 md:col-span-1 text-center">Rank</div>
                <div className="col-span-8 md:col-span-9">Team</div>
                <div className="col-span-2 text-right">Score</div>
            </div>

            {data.teams.map((team) => (
                <TickerRow
                    key={team.teamId}
                    rank={team.rank}
                    teamName={team.teamName}
                    score={team.totalScore}
                    isFrozen={data.isFrozen}
                />
            ))}

            {data.isFrozen && (
                <div className="fixed bottom-8 left-1/2 -translate-x-1/2 bg-yellow-500/10 border border-yellow-500/50 text-yellow-500 px-6 py-2 rounded-full font-mono text-sm animate-pulse flex items-center gap-2">
                    LEADERBOARD_FROZEN_FOR_CEREMONY
                </div>
            )}
        </div>
    )
}
