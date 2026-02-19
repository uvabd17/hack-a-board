"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { startCeremony, stopCeremony, revealNext } from "@/actions/ceremony"
import { Trophy, RefreshCcw, Power } from "lucide-react"

export function CeremonyController({
    hackathonId,
    slug
}: {
    hackathonId: string,
    slug: string
}) {
    const [isLoading, setIsLoading] = useState(false)
    const [isActive, setIsActive] = useState(false)
    const [currentIndex, setCurrentIndex] = useState(0)

    const handleStart = async () => {
        setIsLoading(true)
        try {
            await startCeremony(hackathonId, "overall")
            setIsActive(true)
        } catch (error) {
            console.error(error)
        } finally {
            setIsLoading(false)
        }
    }

    const handleReveal = async () => {
        setIsLoading(true)
        try {
            await revealNext(hackathonId)
            setCurrentIndex(prev => prev + 1)
        } catch (error) {
            console.error(error)
        } finally {
            setIsLoading(false)
        }
    }

    const handleStop = async () => {
        setIsLoading(true)
        try {
            await stopCeremony(hackathonId)
            setIsActive(false)
            setCurrentIndex(0)
        } catch (error) {
            console.error(error)
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <Card className="border-border bg-card/50 backdrop-blur-sm mt-6 border-yellow-500/20">
            <CardHeader>
                <CardTitle className="flex items-center justify-between text-yellow-500">
                    <span className="flex items-center gap-2">
                        <Trophy className="w-5 h-5" />
                        Ceremony Control Center
                    </span>
                    {isActive ? (
                        <Badge variant="default" className="bg-yellow-500/10 text-yellow-500 hover:bg-yellow-500/20 border-yellow-500/50 flex gap-1 items-center animate-pulse">
                            ACTIVE
                        </Badge>
                    ) : (
                        <Badge variant="secondary">OFFLINE</Badge>
                    )}
                </CardTitle>
                <CardDescription>
                    Manage the final reveal ceremony. Ensure the projector is set to the Display view.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                {!isActive ? (
                    <div className="flex flex-col gap-4">
                        <div className="bg-yellow-500/5 p-4 rounded-lg text-sm text-yellow-500/80 border border-yellow-500/10">
                            <strong>Note:</strong> Starting the ceremony will take over the projector display.
                            Ensure the leaderboard is frozen first.
                        </div>
                        <Button
                            onClick={handleStart}
                            disabled={isLoading}
                            className="w-full bg-yellow-600 hover:bg-yellow-700 text-black font-bold h-12"
                        >
                            Start Ceremony (Generate Snapshot)
                        </Button>
                    </div>
                ) : (
                    <div className="flex flex-col gap-4">
                        <div className="text-center py-8 bg-black/20 rounded-lg">
                            <div className="text-4xl font-mono font-bold text-yellow-500 mb-2">
                                {currentIndex} / 10
                            </div>
                            <div className="text-xs uppercase tracking-widest text-muted-foreground">Winners Revealed</div>
                        </div>

                        <Button
                            onClick={handleReveal}
                            disabled={isLoading || currentIndex >= 10}
                            size="lg"
                            className="w-full h-16 text-xl font-bold bg-green-600 hover:bg-green-700 text-black shadow-[0_0_20px_rgba(22,163,74,0.3)]"
                        >
                            REVEAL NEXT WINNER
                        </Button>

                        <div className="flex justify-end pt-4 border-t border-border/50">
                            <Button variant="ghost" size="sm" onClick={handleStop} className="text-red-500 hover:text-red-400 hover:bg-red-500/10">
                                <Power className="w-4 h-4 mr-2" />
                                End Ceremony
                            </Button>
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    )
}
