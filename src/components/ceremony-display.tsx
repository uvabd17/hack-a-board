"use client"

import { useEffect, useState } from "react"
import { getCeremonyState, CeremonyState } from "@/actions/ceremony"
import { Trophy, Star, Sparkles } from "lucide-react"
import { cn } from "@/lib/utils"
import { useRealtime } from "@/lib/realtime-client"

export function CeremonyDisplay({ slug, hackathonId }: { slug: string; hackathonId?: string }) {
    const [state, setState] = useState<CeremonyState | null>(null)

    useEffect(() => {
        const fetchState = async () => {
            const data = await getCeremonyState(slug)
            setState(data)
        }

        // Fetch once on mount - rely on socket events for updates
        fetchState()
    }, [slug])

    // Realtime: instant ceremony reveal events
    useRealtime({
        events: ["displayCeremonyStarted", "displayCeremonyReveal"],
        channels: hackathonId ? [`display:${hackathonId}`] : [],
        enabled: !!hackathonId,
        onData: () => {
            getCeremonyState(slug).then((newState) => {
                if (newState) setState(newState)
            })
        },
    })

    if (!state || !state.isActive) return null

    // Determine what to show
    // If we have a currentWinner, show them prominently.
    // If not (setup phase or just finished), show generic "Ceremony Active" or "Complete".

    return (
        <div className="fixed inset-0 z-50 bg-black text-white flex flex-col items-center justify-center font-mono overflow-hidden">
            {/* Background Effects */}
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-yellow-900/20 via-black to-black animate-pulse" />

            {/* Header */}
            <div className="absolute top-10 left-0 right-0 text-center z-10">
                <div className="inline-flex items-center gap-2 border border-yellow-500/30 bg-yellow-500/10 px-4 py-2 rounded-full text-yellow-500 uppercase tracking-[0.2em] text-sm animate-fade-in-down">
                    <Trophy className="w-4 h-4" />
                    Prize Ceremony
                </div>
            </div>

            {/* Main Content */}
            <div className="z-10 text-center space-y-8 max-w-5xl px-4">
                {state.currentWinner === null ? (
                    <div className="animate-pulse">
                        <h1 className="text-6xl md:text-8xl font-bold tracking-tighter text-transparent bg-clip-text bg-gradient-to-b from-yellow-300 to-yellow-700">
                            Welcome to the<br />Grand Reveal
                        </h1>
                        <p className="mt-8 text-2xl text-yellow-500/60 font-mono">
                            The results are coming...
                        </p>
                    </div>
                ) : (
                    <div key={state.currentRound} className="animate-in zoom-in slide-in-from-bottom-10 fade-in duration-1000 fill-mode-forwards">
                        <div className="text-yellow-500 font-bold tracking-widest text-2xl mb-4 uppercase">
                            {state.currentRound === state.totalWinners ? "🏆 GRAND WINNER 🏆" : `Rank #${state.totalWinners - state.currentRound + 1}`}
                        </div>

                        <div className="relative">
                            <h1 className="text-7xl md:text-9xl font-black tracking-tighter text-white mb-6 drop-shadow-[0_0_50px_rgba(234,179,8,0.5)]">
                                {state.currentWinner.teamName}
                            </h1>
                            <Sparkles className="absolute -top-10 -right-10 w-20 h-20 text-yellow-400 animate-spin-slow opacity-50" />
                            <Sparkles className="absolute -bottom-10 -left-10 w-20 h-20 text-yellow-400 animate-spin-slow opacity-50" />
                        </div>

                        <div className="flex justify-center gap-4 text-xl md:text-2xl text-yellow-500/80 mt-8">
                            <span className="flex items-center gap-2 border border-yellow-500/30 px-6 py-3 rounded-lg bg-yellow-500/5">
                                <Star className="w-5 h-5" />
                                {state.currentWinner.score} PTS
                            </span>
                            <span className="flex items-center gap-2 border border-green-500/30 px-6 py-3 rounded-lg bg-green-500/5 text-green-500">
                                {state.currentWinner.problemStatement}
                            </span>
                        </div>

                        <div className="mt-12 opacity-0 animate-in fade-in slide-in-from-bottom-4 delay-1000 fill-mode-forwards duration-1000">
                            <p className="text-lg text-white/40">
                                {state.currentWinner.members.join(" • ")}
                            </p>
                        </div>
                    </div>
                )}
            </div>

            {/* Footer / Progress */}
            <div className="absolute bottom-10 left-0 right-0 flex justify-center z-10">
                <div className="flex gap-1">
                    {Array.from({ length: state.totalWinners }).map((_, i) => (
                        <div
                            key={i}
                            className={cn(
                                "w-3 h-3 rounded-full transition-all duration-500",
                                i < state.currentRound ? "bg-yellow-500 shadow-[0_0_10px_rgba(234,179,8,0.8)]" : "bg-white/10"
                            )}
                        />
                    ))}
                </div>
            </div>

            {/* Confetti (CSS only implementation for ease) */}
            {state.currentWinner && (
                <div className="absolute inset-0 pointer-events-none overflow-hidden">
                    {/* Simplified visual effects via CSS variables/animations would go here */}
                </div>
            )}
        </div>
    )
}
