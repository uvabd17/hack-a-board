import { prisma } from "@/lib/prisma"
import { notFound } from "next/navigation"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Users, Trophy, ChevronRight, CheckSquare, BarChart2 } from "lucide-react"
import { LifecycleControls } from "./lifecycle-controls"

export default async function ManagePage({ params }: { params: Promise<{ slug: string }> }) {
    const { slug } = await params

    const hackathon = await prisma.hackathon.findUnique({
        where: { slug },
        include: {
            _count: {
                select: {
                    teams: true,
                    participants: true,
                    judges: { where: { isActive: true } },
                    problemStatements: { where: { isReleased: true } },
                    rounds: true,
                }
            },
            teams: {
                select: { isCheckedIn: true, status: true },
            },
            problemStatements: {
                select: { title: true, isReleased: true, icon: true },
                orderBy: { order: 'asc' },
            },
            phases: {
                orderBy: { order: 'asc' },
                select: { name: true, startTime: true, endTime: true },
            },
        }
    })

    if (!hackathon) notFound()

    const approvedTeams = hackathon.teams.filter(t => t.status === "approved").length
    const checkedInTeams = hackathon.teams.filter(t => t.isCheckedIn).length

    return (
        <div className="space-y-8 max-w-5xl">
            {/* Header */}
            <div className="flex items-start justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-primary tracking-tight">SYSTEM_STATUS</h1>
                    <p className="text-muted-foreground text-xs mt-1 uppercase tracking-widest">{hackathon.name}</p>
                </div>
                <Badge
                    variant={hackathon.status === 'live' ? 'default' : hackathon.status === 'ended' ? 'destructive' : 'secondary'}
                    className="uppercase text-xs px-3 py-1"
                >
                    {hackathon.status}
                </Badge>
            </div>

            {/* Lifecycle Controls */}
            <LifecycleControls hackathonId={hackathon.id} status={hackathon.status} />

            {/* Primary Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <StatCard label="TOTAL_TEAMS" value={hackathon._count.teams} sub={`${approvedTeams} approved`} />
                <StatCard label="PARTICIPANTS" value={hackathon._count.participants} />
                <StatCard label="JUDGES_ACTIVE" value={hackathon._count.judges} />
                <StatCard label="PROBLEMS_LIVE" value={hackathon._count.problemStatements} sub={`of ${hackathon.problemStatements.length} total`} />
            </div>

            {/* Check-in Progress */}
            <div className="p-6 border border-border bg-card/50 space-y-3">
                <div className="flex items-center justify-between">
                    <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                        <CheckSquare className="w-4 h-4" /> CHECK-IN PROGRESS
                    </p>
                    <Button asChild variant="outline" size="sm" className="text-xs uppercase">
                        <Link href={`/h/${slug}/manage/check-in`}>Open Check-In <ChevronRight className="w-3 h-3 ml-1" /></Link>
                    </Button>
                </div>
                <div className="flex items-end gap-3">
                    <p className="text-4xl font-bold font-mono">{checkedInTeams}<span className="text-muted-foreground text-2xl">/{hackathon._count.teams}</span></p>
                    <p className="text-muted-foreground text-xs pb-1">teams checked in</p>
                </div>
                {hackathon._count.teams > 0 && (
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <div
                            className="h-full bg-primary transition-all duration-500"
                            style={{ width: `${(checkedInTeams / hackathon._count.teams) * 100}%` }}
                        />
                    </div>
                )}
            </div>

            {/* Quick Links Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <QuickLink href={`/h/${slug}/manage/teams`} icon="👥" label="MANAGE TEAMS" desc="View, approve, and manage all registered teams" />
                <QuickLink href={`/h/${slug}/manage/rounds`} icon="⚖️" label="SCORING ROUNDS" desc={`${hackathon._count.rounds} round(s) configured`} />
                <QuickLink href={`/h/${slug}/manage/display`} icon="📺" label="DISPLAY CONTROL" desc={hackathon.isFrozen ? "⚠ Leaderboard is FROZEN" : "Leaderboard is LIVE"} />
            </div>

            {/* Problem Statements State */}
            {hackathon.problemStatements.length > 0 && (
                <div className="border border-border bg-card/50 p-6 space-y-4">
                    <div className="flex items-center justify-between">
                        <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                            <BarChart2 className="w-4 h-4" /> PROBLEM TRACKS
                        </p>
                        <Button asChild variant="ghost" size="sm" className="text-xs">
                            <Link href={`/h/${slug}/manage/problems`}>Manage →</Link>
                        </Button>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                        {hackathon.problemStatements.map(p => (
                            <div key={p.title} className="flex items-center gap-2 p-2 border border-border/50 rounded text-xs">
                                <span>{p.icon || "📌"}</span>
                                <span className="font-medium truncate">{p.title}</span>
                                <Badge variant={p.isReleased ? "default" : "secondary"} className="ml-auto text-[9px] py-0">
                                    {p.isReleased ? "LIVE" : "HIDDEN"}
                                </Badge>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Phases / Schedule */}
            {hackathon.phases.length > 0 && (
                <div className="border border-border bg-card/50 p-6 space-y-4">
                    <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">EVENT SCHEDULE</p>
                    <div className="space-y-2">
                        {hackathon.phases.map(phase => {
                            const now = new Date()
                            const isActive = now >= phase.startTime && now <= phase.endTime
                            const isPast = now > phase.endTime
                            return (
                                <div key={phase.name} className={`flex items-center justify-between p-3 border text-xs ${isActive ? 'border-primary/50 bg-primary/5' : 'border-border/50'}`}>
                                    <div className="flex items-center gap-3">
                                        {isActive && <span className="w-2 h-2 rounded-full bg-primary animate-ping" />}
                                        {isPast && !isActive && <span className="w-2 h-2 rounded-full bg-muted-foreground" />}
                                        {!isActive && !isPast && <span className="w-2 h-2 rounded-full border border-muted-foreground" />}
                                        <span className={`font-bold uppercase ${isActive ? 'text-primary' : isPast ? 'text-muted-foreground line-through' : ''}`}>{phase.name}</span>
                                    </div>
                                    <div className="text-muted-foreground font-mono">
                                        {phase.startTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} → {phase.endTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                </div>
            )}
        </div>
    )
}

function StatCard({ label, value, sub }: { label: string, value: number, sub?: string }) {
    return (
        <div className="p-5 border border-border bg-card rounded-none space-y-1">
            <p className="text-[10px] text-muted-foreground uppercase tracking-widest">{label}</p>
            <p className="text-4xl font-bold font-mono">{value}</p>
            {sub && <p className="text-[10px] text-muted-foreground">{sub}</p>}
        </div>
    )
}

function QuickLink({ href, icon, label, desc }: { href: string, icon: string, label: string, desc: string }) {
    return (
        <Link href={href} className="p-5 border border-border bg-card/50 hover:border-primary/50 hover:bg-primary/5 transition-all block group">
            <div className="flex items-center gap-2 mb-2">
                <span>{icon}</span>
                <p className="text-xs font-bold uppercase tracking-widest group-hover:text-primary transition-colors">{label}</p>
            </div>
            <p className="text-[11px] text-muted-foreground">{desc}</p>
        </Link>
    )
}
