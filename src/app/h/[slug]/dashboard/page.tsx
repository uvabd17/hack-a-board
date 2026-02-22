import { prisma } from "@/lib/prisma"
import { cookies } from "next/headers"
import { notFound, redirect } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import QRCode from "qrcode"
import { Lock } from "lucide-react"
import { unstable_cache } from "next/cache"

import { getLeaderboardData } from "@/actions/leaderboard"
import { ProblemSelection } from "@/components/problem-selection"
import { SubmissionForm } from "@/components/submission-form"
import { LiveJudgingProgress } from "@/components/live-judging-progress"
import { LinkSubmissionForm } from "@/components/link-submission-form"
import { getTeamJudgingProgress } from "@/actions/judging"
import { CheckCircle2 } from "lucide-react"
import { CountdownTimer } from "@/components/countdown-timer"
import { LiveRefresher } from "@/components/live-refresher"

// Revalidate this page every 5 seconds for ISR performance
export const revalidate = 5

// Cache QR code generation - QR codes don't change
const getCachedQRCode = unstable_cache(
    async (token: string, slug: string) => {
        try {
            return await QRCode.toDataURL(`/h/${slug}/qr/${token}`)
        } catch (err) {
            console.error(err)
            return ""
        }
    },
    ["qr-code"],
    { revalidate: 86400 } // 24 hours - QR codes never change
)

async function generateQR(text: string) {
    try {
        return await QRCode.toDataURL(text)
    } catch (err) {
        console.error(err)
        return ""
    }
}

export default async function DashboardPage({
    params
}: {
    params: Promise<{ slug: string }>
}) {
    const { slug } = await params
    const token = (await cookies()).get("hackaboard_participant_token")?.value

    if (!token) {
        redirect(`/h/${slug}/register`)
    }

    const participant = await prisma.participant.findUnique({
        where: { qrToken: token },
        include: {
            team: true,
            hackathon: true
        }
    })

    // Security check: Match slug
    if (!participant || participant.hackathon.slug !== slug) {
        return (
            <div className="flex items-center justify-center min-h-screen text-destructive">
                INVALID ACCESS — Please register again.
            </div>
        )
    }

    const qrCodeDataUrl = await getCachedQRCode(participant.qrToken, slug)

    // Parallelize independent queries for better performance
    const [{ leaderboard, frozen }, problems, rounds, submissions, phases, roundsWithJudgingProgress] = await Promise.all([
        getLeaderboardData(slug),
        prisma.problemStatement.findMany({
            where: { hackathonId: participant.hackathonId, isReleased: true },
            orderBy: { order: 'asc' }
        }),
        prisma.round.findMany({
            where: { hackathonId: participant.hackathonId },
            orderBy: { order: 'asc' }
        }),
        prisma.submission.findMany({
            where: { teamId: participant.teamId }
        }),
        prisma.phase.findMany({
            where: { hackathonId: participant.hackathonId },
            orderBy: { order: 'asc' }
        }),
        // Fetch judging progress for all rounds
        Promise.all(
            (await prisma.round.findMany({
                where: { hackathonId: participant.hackathonId },
                select: { id: true }
            })).map((r: { id: string }) => getTeamJudgingProgress(participant.teamId, r.id))
        )
    ])

    // Find current active phase
    const now = Date.now()
    const currentPhase = phases.find((p: any) => 
        new Date(p.startTime).getTime() <= now && new Date(p.endTime).getTime() > now
    )

    const teamEntry = leaderboard.find((e: any) => e.teamId === participant.teamId)

    const selectedProblem = participant.team.problemStatementId
        ? problems.find((p: any) => p.id === participant.team.problemStatementId)
        : null

    return (
        <div className="min-h-screen bg-background p-4 font-mono text-foreground pb-20">
            <LiveRefresher hackathonId={participant.hackathonId} />
            <header className="mb-8 border-b border-border pb-4 max-w-6xl mx-auto space-y-3">
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-xl font-bold text-primary">{participant.hackathon.name}</h1>
                        <p className="text-xs text-muted-foreground">HACKER_DASHBOARD</p>
                    </div>
                    <div className="flex gap-2 items-center">
                        <a href={`/h/${slug}/display`} target="_blank" className="text-xs text-primary hover:underline uppercase tracking-widest">
                            📊 Leaderboard
                        </a>
                        <Badge variant={participant.team.status === 'approved' ? 'default' : 'secondary'} className="uppercase">
                            STATUS: {participant.team.status}
                        </Badge>
                    </div>
                </div>

                {/* Live timer bar — only shown when event is live */}
                {participant.hackathon.status === "live" && (
                    <div className="flex items-center gap-6 bg-muted/30 border border-border rounded px-4 py-2">
                        {currentPhase && (
                            <CountdownTimer
                                targetMs={new Date(currentPhase.endTime).getTime()}
                                label={`${currentPhase.name} ends in`}
                                size="sm"
                            />
                        )}
                        {rounds.filter((r: any) => new Date(r.checkpointTime).getTime() > Date.now() || r.checkpointPausedAt).map((r: any) => (
                            <CountdownTimer
                                key={r.id}
                                targetMs={new Date(r.checkpointTime).getTime()}
                                pausedRemainingMs={
                                    r.checkpointPausedAt
                                        ? new Date(r.checkpointTime).getTime() - new Date(r.checkpointPausedAt).getTime()
                                        : null
                                }
                                label={`${r.name} closes in`}
                                size="sm"
                            />
                        ))}
                    </div>
                )}
            </header>

            <main className="grid grid-cols-1 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
                {/* Left Column: Identity & Intel */}
                <div className="lg:col-span-1 space-y-6">
                    {/* QR Passport Card */}
                    <div className="relative overflow-hidden border border-primary/30 bg-gradient-to-br from-card via-card to-primary/5 rounded-lg">
                        {/* Decorative corner accents */}
                        <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-primary/40 rounded-tl-lg" />
                        <div className="absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 border-primary/40 rounded-tr-lg" />
                        <div className="absolute bottom-0 left-0 w-8 h-8 border-b-2 border-l-2 border-primary/40 rounded-bl-lg" />
                        <div className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-primary/40 rounded-br-lg" />

                        <div className="px-6 pt-5 pb-2">
                            <p className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground font-bold text-center">Participant Pass</p>
                            <p className="text-[9px] text-center text-muted-foreground/60 mt-0.5">{participant.hackathon.name}</p>
                        </div>

                        {/* Dashed separator */}
                        <div className="mx-4 border-t border-dashed border-primary/20" />

                        {/* QR Code */}
                        <div className="flex justify-center py-5">
                            <div className="relative">
                                <div className="absolute -inset-2 bg-primary/5 rounded-xl blur-sm" />
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img src={qrCodeDataUrl} alt="Participant QR Code"
                                    className="relative w-44 h-44 bg-white p-3 rounded-lg shadow-md" />
                            </div>
                        </div>

                        {/* Dashed separator */}
                        <div className="mx-4 border-t border-dashed border-primary/20" />

                        {/* Identity info */}
                        <div className="px-6 py-4 text-center space-y-1.5">
                            <p className="text-lg font-bold text-foreground tracking-wide">{participant.name}</p>
                            <p className="text-xs text-muted-foreground">{participant.email}</p>
                            {participant.team && (
                                <div className="pt-2">
                                    <Badge variant="outline" className="text-[10px] border-primary/30 text-primary px-3 py-0.5 uppercase tracking-widest">
                                        {participant.team.name}
                                    </Badge>
                                </div>
                            )}
                        </div>

                        {/* Token footer */}
                        <div className="bg-muted/30 px-4 py-2">
                            <p className="text-[8px] text-center text-muted-foreground/40 font-mono">SESSION_ACTIVE</p>
                        </div>
                    </div>

                    {/* Team Intel */}
                    <Card className="bg-card border-border">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm text-muted-foreground uppercase tracking-widest">Team Info</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div>
                                <p className="text-xl font-bold text-foreground">{participant.team.name}</p>
                                <p className="text-[10px] text-muted-foreground">CODE: <span className="text-primary text-sm font-bold ml-1 tracking-widest">{participant.team.inviteCode}</span></p>
                            </div>

                            <div className="pt-4 border-t border-border">
                                <p className="text-xs text-muted-foreground mb-2 uppercase">Current Standing</p>
                                {frozen ? (
                                    <div className="flex items-center gap-2 text-destructive animate-pulse">
                                        <Lock className="w-4 h-4" />
                                        <p className="text-sm font-bold">HIDDEN (FROZEN)</p>
                                    </div>
                                ) : (
                                    <div className="flex items-baseline gap-2">
                                        <p className="text-3xl font-bold text-primary">#{teamEntry?.rank || "--"}</p>
                                        <p className="text-[10px] text-muted-foreground uppercase">SCORE: {teamEntry?.totalScore || 0}</p>
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Right Column: Mission Control */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Problem Statement Selection */}
                    <Card className="bg-card border-border">
                        <CardHeader>
                            <CardTitle className="text-sm text-muted-foreground uppercase tracking-widest">
                                Challenge Track
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            {selectedProblem ? (
                                <div className="p-4 border border-primary/20 bg-primary/5 rounded">
                                    <h3 className="text-lg font-bold text-primary mb-1">{selectedProblem.title}</h3>
                                    <p className="text-xs text-muted-foreground">{selectedProblem.description}</p>
                                    <div className="mt-4 flex items-center gap-2 text-[10px] text-primary/70 uppercase">
                                        <CheckCircle2 className="w-3 h-3" />
                                        Track Locked
                                    </div>
                                </div>
                            ) : problems.length > 0 ? (
                                <ProblemSelection problems={problems} teamId={participant.teamId} slug={slug} />
                            ) : (
                                <p className="text-xs text-muted-foreground italic">Problem statements have not been released by the organizer yet.</p>
                            )}
                        </CardContent>
                    </Card>

                    {/* Submissions / Judging Progress */}
                    {selectedProblem && rounds.length > 0 && (
                        <div className="space-y-4">
                            <h2 className="text-sm text-muted-foreground uppercase tracking-widest pl-1">Round Progress</h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {rounds.map((round: any, idx: number) => {
                                    const submission = submissions.find((s: any) => s.roundId === round.id)
                                    const progressData = roundsWithJudgingProgress[idx]
                                    
                                    // Check if round requires link submission and if links are submitted
                                    if (round.requiresLinkSubmission && !submission?.linksSubmittedAt) {
                                        // Show link submission form
                                        return (
                                            <LinkSubmissionForm
                                                key={round.id}
                                                roundId={round.id}
                                                roundName={round.name}
                                                teamId={participant.teamId}
                                                slug={slug}
                                                checkpointTime={round.checkpointTime}
                                                checkpointPausedAt={round.checkpointPausedAt}
                                            />
                                        )
                                    }
                                    
                                    // Check if this round has judging progress data
                                    if (progressData && 'submitted' in progressData) {
                                        return (
                                            <LiveJudgingProgress
                                                key={round.id}
                                                roundName={round.name}
                                                roundId={round.id}
                                                teamId={participant.teamId}
                                                hackathonId={participant.hackathonId}
                                                checkpointTime={round.checkpointTime}
                                                checkpointPausedAt={round.checkpointPausedAt}
                                                initialRequiredJudges={progressData.requiredJudges}
                                                initialJudgeCount={progressData.judgeCount}
                                                initialSubmitted={progressData.submitted}
                                                initialTimeBonus={progressData.timeBonus}
                                                initialJudges={progressData.judges || []}
                                            />
                                        )
                                    }
                                    
                                    // Fallback to old submission form (for backwards compatibility)
                                    return (
                                        <SubmissionForm
                                            key={round.id}
                                            round={round}
                                            teamId={participant.teamId}
                                            slug={slug}
                                            existingSubmission={submission}
                                        />
                                    )
                                })}
                            </div>
                        </div>
                    )}
                </div>
            </main>
        </div>
    )
}
