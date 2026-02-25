"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Trophy, Users, CheckCircle2, Clock, Timer } from "lucide-react"
import { CountdownTimer } from "@/components/countdown-timer"

interface JudgingProgressProps {
    roundName: string
    roundId: string
    checkpointTime: Date
    checkpointPausedAt: Date | null
    requiredJudges: number
    judgeCount: number
    submitted: boolean
    timeBonus?: number
    judges: Array<{ name: string; timestamp: Date }>
}

export function JudgingProgress({
    roundName,
    checkpointTime,
    checkpointPausedAt,
    requiredJudges,
    judgeCount,
    submitted,
    timeBonus,
    judges
}: JudgingProgressProps) {
    // Calculate time bonus preview if not submitted yet
    const getTimeBonusPreview = () => {
        const effectiveCheckpoint = checkpointPausedAt || checkpointTime
        const now = new Date()
        const diffMinutes = Math.floor((effectiveCheckpoint.getTime() - now.getTime()) / 60000)
        
        if (diffMinutes > 0) {
            return {
                bonus: diffMinutes * 2,
                label: `If submitted now: +${diffMinutes * 2} bonus`,
                color: "text-green-500"
            }
        } else {
            const penalty = Math.abs(diffMinutes)
            return {
                bonus: -penalty,
                label: `If submitted now: -${penalty} penalty`,
                color: "text-red-500"
            }
        }
    }

    const bonusPreview = !submitted ? getTimeBonusPreview() : null

    return (
        <Card className={`border overflow-hidden transition-all ${
            submitted 
                ? 'bg-cyan-950/20 border-cyan-700/30 shadow-[0_0_20px_rgba(34,211,238,0.1)]' 
                : 'bg-card border-border'
        }`}>
            <CardHeader className="bg-muted/30 pb-3">
                <div className="flex items-center justify-between">
                    <div className="flex-1">
                        <CardTitle className="text-sm font-bold uppercase tracking-widest">
                            {roundName}
                        </CardTitle>
                        {!submitted && (
                            <div className="mt-1">
                                <CountdownTimer
                                    targetMs={checkpointTime.getTime()}
                                    pausedRemainingMs={
                                        checkpointPausedAt
                                            ? checkpointTime.getTime() - checkpointPausedAt.getTime()
                                            : null
                                    }
                                    label="Checkpoint"
                                    size="sm"
                                />
                            </div>
                        )}
                    </div>
                    {submitted ? (
                        <Badge className="bg-cyan-600 text-white border-0">
                            <Trophy className="w-3 h-3 mr-1" />
                            SUBMITTED
                        </Badge>
                    ) : (
                        <Badge variant="outline" className="text-yellow-500 border-yellow-500/50">
                            <Clock className="w-3 h-3 mr-1" />
                            IN PROGRESS
                        </Badge>
                    )}
                </div>
            </CardHeader>

            <CardContent className="pt-4 pb-4 space-y-4">
                {/* Judge Progress Bar */}
                <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground flex items-center gap-1">
                            <Users className="w-3 h-3" />
                            Judges Completed
                        </span>
                        <span className={`font-bold ${
                            submitted ? 'text-cyan-400' : 'text-foreground'
                        }`}>
                            {judgeCount}/{requiredJudges}
                        </span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <div 
                            className={`h-full transition-all duration-500 ${
                                submitted ? 'bg-cyan-500' : 'bg-primary'
                            }`}
                            style={{ width: `${Math.min((judgeCount / requiredJudges) * 100, 100)}%` }}
                        />
                    </div>
                </div>

                {/* Time Bonus Display */}
                {submitted && timeBonus !== undefined && (
                    <div className="flex items-center justify-between p-3 bg-cyan-900/30 border border-cyan-700/30 rounded">
                        <span className="text-xs text-cyan-300 font-mono">TIME BONUS</span>
                        <span className={`text-lg font-bold font-mono ${
                            timeBonus >= 0 ? 'text-green-400' : 'text-red-400'
                        }`}>
                            {timeBonus >= 0 ? '+' : ''}{timeBonus}
                        </span>
                    </div>
                )}

                {/* Time Bonus Preview (if not submitted) */}
                {!submitted && bonusPreview && (
                    <div className="flex items-center gap-2 text-xs italic">
                        <Timer className="w-3 h-3 text-muted-foreground" />
                        <span className={bonusPreview.color}>
                            {bonusPreview.label}
                        </span>
                    </div>
                )}

                {/* Judges List */}
                {judges.length > 0 && (
                    <div className="space-y-2 pt-2 border-t border-border">
                        <p className="text-[10px] uppercase text-muted-foreground tracking-widest">
                            Judged By
                        </p>
                        <div className="space-y-1">
                            {judges.map((judge, idx) => (
                                <div key={idx} className="flex items-center justify-between text-xs bg-muted/20 p-2 rounded">
                                    <div className="flex items-center gap-2">
                                        <CheckCircle2 className="w-3 h-3 text-green-500" />
                                        <span className="font-mono">{judge.name}</span>
                                    </div>
                                    <span className="text-[10px] text-muted-foreground font-mono">
                                        {new Date(judge.timestamp).toLocaleTimeString()}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Waiting Message */}
                {!submitted && judgeCount < requiredJudges && (
                    <div className="text-xs text-muted-foreground italic text-center mt-2 py-2 border-t border-border">
                        {judgeCount === 0 
                            ? "Show your QR code to judges to get scored!"
                            : `Waiting for ${requiredJudges - judgeCount} more ${requiredJudges - judgeCount === 1 ? 'judge' : 'judges'}...`
                        }
                    </div>
                )}
            </CardContent>
        </Card>
    )
}
