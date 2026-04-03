"use client"

import { useEffect, useState } from "react"
import { getCeremonyState, CeremonyState } from "@/actions/ceremony"
import { Trophy, Star, Sparkles } from "lucide-react"
import { cn } from "@/lib/utils"
import { connectSocket, disconnectSocket } from "@/lib/socket-client"

export function CeremonyDisplay({ slug, hackathonId }: { slug: string; hackathonId?: string }) {
    const [state, setState] = useState<CeremonyState | null>(null)

    useEffect(() => {
        const fetchState = async () => {
            const data = await getCeremonyState(slug)
            setState(data)
        }
        fetchState()
    }, [slug])

    // Socket.IO: instant ceremony reveal events
    useEffect(() => {
        if (!hackathonId) return
        const socket = connectSocket(hackathonId, ["display"])
        const refresh = () => getCeremonyState(slug).then((newState) => { if (newState) setState(newState) })
        socket.on("display:ceremony-started", refresh)
        socket.on("display:ceremony-reveal", refresh)
        return () => {
            socket.off("display:ceremony-started", refresh)
            socket.off("display:ceremony-reveal", refresh)
            disconnectSocket()
        }
    }, [hackathonId, slug])

    if (!state || !state.isActive) return null

    const isGrandWinner = state.currentRound === state.totalWinners
    const revealRank = state.currentWinner ? state.totalWinners - state.currentRound + 1 : null

    return (
        <div className="fixed inset-0 z-50 text-white flex flex-col items-center justify-center font-mono overflow-hidden">
            {/* Background — layered radial gradients */}
            <div className="absolute inset-0 bg-[#0a0a0f]" />
            <div className={cn(
                "absolute inset-0",
                isGrandWinner
                    ? "bg-[radial-gradient(ellipse_at_50%_30%,_rgba(251,191,36,0.15)_0%,_transparent_50%)]"
                    : "bg-[radial-gradient(ellipse_at_50%_30%,_rgba(251,191,36,0.08)_0%,_transparent_60%)]"
            )} />
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-[#0a0a0f]" />

            {/* Header Badge */}
            <div className="absolute top-10 left-0 right-0 text-center z-10">
                <div className="inline-flex items-center gap-2 border-2 border-amber-500/30 bg-amber-500/10 px-5 py-2 text-amber-400 uppercase tracking-[0.2em] text-sm font-bold animate-fade-in-down">
                    <Trophy className="w-4 h-4" />
                    Prize Ceremony
                </div>
            </div>

            {/* Main Content */}
            <div className="z-10 text-center space-y-8 max-w-5xl px-4">
                {state.currentWinner === null ? (
                    /* Setup/waiting state */
                    <div className="animate-pulse">
                        <h1 className="text-6xl md:text-8xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-b from-amber-200 to-amber-600">
                            Grand Reveal
                        </h1>
                        <p className="mt-8 text-2xl text-amber-500/60 font-mono">
                            The results are coming...
                        </p>
                    </div>
                ) : (
                    /* Winner reveal */
                    <div key={state.currentRound}>
                        {/* Rank label — slides down */}
                        <div className="text-amber-400 font-bold tracking-widest text-2xl mb-6 uppercase animate-fade-in-down">
                            {isGrandWinner ? "GRAND WINNER" : `Rank #${revealRank}`}
                        </div>

                        {/* Team name — scales up with glow */}
                        <div className="relative">
                            <h1 className={cn(
                                "font-black tracking-tighter mb-6 animate-name-reveal",
                                isGrandWinner
                                    ? "text-8xl md:text-[10rem] text-transparent bg-clip-text bg-gradient-to-b from-amber-200 via-amber-400 to-amber-600"
                                    : "text-7xl md:text-9xl text-white drop-shadow-[0_0_50px_rgba(251,191,36,0.4)]"
                            )}>
                                {state.currentWinner.teamName}
                            </h1>
                            <Sparkles className="absolute -top-10 -right-10 w-20 h-20 text-amber-400 animate-spin-slow opacity-40" />
                            <Sparkles className="absolute -bottom-10 -left-10 w-20 h-20 text-amber-400 animate-spin-slow opacity-40" />
                        </div>

                        {/* Score + Track badges — fade in after name */}
                        <div className="flex justify-center gap-4 text-xl md:text-2xl mt-8 opacity-0 animate-in fade-in slide-in-from-bottom-4 delay-700 fill-mode-forwards duration-700">
                            <span className="flex items-center gap-2 border-2 border-amber-500/30 px-6 py-3 bg-amber-500/5 text-amber-400 font-bold">
                                <Star className="w-5 h-5" />
                                {state.currentWinner.score} PTS
                            </span>
                            <span className="flex items-center gap-2 border-2 border-emerald-500/30 px-6 py-3 bg-emerald-500/5 text-emerald-400 font-bold">
                                {state.currentWinner.problemStatement}
                            </span>
                        </div>

                        {/* Members — fade in last */}
                        <div className="mt-12 opacity-0 animate-in fade-in slide-in-from-bottom-4 delay-1000 fill-mode-forwards duration-1000">
                            <p className="text-lg text-white/40">
                                {state.currentWinner.members.join(" · ")}
                            </p>
                        </div>
                    </div>
                )}
            </div>

            {/* Progress dots */}
            <div className="absolute bottom-10 left-0 right-0 flex justify-center z-10">
                <div className="flex gap-1.5">
                    {Array.from({ length: state.totalWinners }).map((_, i) => (
                        <div
                            key={i}
                            className={cn(
                                "w-3 h-3 transition-all duration-500",
                                i < state.currentRound
                                    ? "bg-amber-400 shadow-[0_0_10px_rgba(251,191,36,0.8)]"
                                    : "bg-white/10"
                            )}
                        />
                    ))}
                </div>
            </div>
        </div>
    )
}
