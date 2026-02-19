import { Lock } from "lucide-react"

export function TickerRow({
    rank,
    teamName,
    score,
    isFrozen
}: {
    rank: number,
    teamName: string,
    score: number,
    isFrozen: boolean
}) {
    return (
        <div className="grid grid-cols-12 gap-4 py-4 border-b border-zinc-800 items-center font-mono text-lg hover:bg-zinc-900 transition-colors">
            {/* Rank */}
            <div className="col-span-2 md:col-span-1 text-center font-bold text-zinc-500">
                {isFrozen ? <Lock size={16} className="mx-auto text-yellow-500" /> : `#${rank}`}
            </div>

            {/* Team Name */}
            <div className="col-span-8 md:col-span-9 font-bold text-white uppercase tracking-wider truncate">
                {teamName}
            </div>

            {/* Score */}
            <div className="col-span-2 text-right font-bold text-green-400">
                {isFrozen ? (
                    <span className="text-yellow-500 flex justify-end gap-1 items-center">
                        <span className="hidden md:inline">HIDDEN</span> <Lock size={16} />
                    </span>
                ) : (
                    score.toFixed(2)
                )}
            </div>
        </div>
    )
}
