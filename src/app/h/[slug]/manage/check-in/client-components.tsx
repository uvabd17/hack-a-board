"use client"

import { useState, useTransition, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { checkInTeam } from "@/actions/teams"
import { CheckSquare, Square, Search, Users } from "lucide-react"

type Participant = {
    id: string
    name: string
    email: string
    role: string
}

type Team = {
    id: string
    name: string
    inviteCode: string
    status: string
    isCheckedIn: boolean
    checkedInAt: Date | null
    problemStatement: { title: string; icon: string | null } | null
    participants: Participant[]
}

export function CheckInList({ teams, slug }: { teams: Team[], slug: string }) {
    const [search, setSearch] = useState("")
    const [isPending, startTransition] = useTransition()
    const [loadingId, setLoadingId] = useState<string | null>(null)
    const [filter, setFilter] = useState<"all" | "in" | "out">("all")

    const filtered = useMemo(() => {
        return teams.filter(team => {
            const matchesSearch =
                team.name.toLowerCase().includes(search.toLowerCase()) ||
                team.inviteCode.toLowerCase().includes(search.toLowerCase()) ||
                team.participants.some(p =>
                    p.name.toLowerCase().includes(search.toLowerCase()) ||
                    p.email.toLowerCase().includes(search.toLowerCase())
                )
            const matchesFilter =
                filter === "all" ||
                (filter === "in" && team.isCheckedIn) ||
                (filter === "out" && !team.isCheckedIn)
            return matchesSearch && matchesFilter && team.status === "approved"
        })
    }, [teams, search, filter])

    const handleCheckIn = (teamId: string) => {
        setLoadingId(teamId)
        startTransition(async () => {
            await checkInTeam(teamId, slug)
            setLoadingId(null)
        })
    }

    const checkedIn = teams.filter(t => t.isCheckedIn && t.status === "approved").length
    const approved = teams.filter(t => t.status === "approved").length

    return (
        <div className="space-y-6">
            {/* Progress bar */}
            <div className="p-5 border border-border bg-card/50 space-y-3">
                <div className="flex items-end gap-3">
                    <p className="text-5xl font-bold font-mono">{checkedIn}</p>
                    <p className="text-muted-foreground text-lg font-mono mb-1">/ {approved} teams</p>
                </div>
                {approved > 0 && (
                    <>
                        <div className="h-3 bg-muted rounded-full overflow-hidden">
                            <div
                                className="h-full bg-green-500 transition-all duration-500"
                                style={{ width: `${(checkedIn / approved) * 100}%` }}
                            />
                        </div>
                        <p className="text-xs text-muted-foreground">{Math.round((checkedIn / approved) * 100)}% checked in</p>
                    </>
                )}
            </div>

            {/* Controls */}
            <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                        placeholder="Search by team name, invite code, or member name..."
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        className="pl-9 font-mono"
                        autoFocus
                    />
                </div>
                <div className="flex gap-2">
                    {([["all", "All"], ["out", "Waiting"], ["in", "Checked In"]] as const).map(([f, label]) => (
                        <Button
                            key={f}
                            size="sm"
                            variant={filter === f ? "default" : "outline"}
                            onClick={() => setFilter(f)}
                            className="text-xs uppercase"
                        >
                            {label}
                        </Button>
                    ))}
                </div>
            </div>

            <div className="text-xs text-muted-foreground font-mono">
                {filtered.length} team(s) shown
            </div>

            {/* Teams list */}
            {filtered.length === 0 ? (
                <div className="p-12 border border-dashed border-border text-center text-muted-foreground text-sm">
                    {search ? "No matching teams found" : "No approved teams yet"}
                </div>
            ) : (
                <div className="space-y-2">
                    {filtered.map(team => (
                        <div
                            key={team.id}
                            className={`flex items-center gap-4 p-4 border rounded-sm transition-all
                                ${team.isCheckedIn
                                    ? 'border-green-500/30 bg-green-500/5'
                                    : 'border-border bg-card/50 hover:border-border/80'
                                }`}
                        >
                            <button
                                onClick={() => handleCheckIn(team.id)}
                                disabled={isPending && loadingId === team.id}
                                className="shrink-0 text-muted-foreground hover:text-primary transition-colors disabled:opacity-50"
                            >
                                {team.isCheckedIn
                                    ? <CheckSquare className="w-6 h-6 text-green-500" />
                                    : <Square className="w-6 h-6" />
                                }
                            </button>

                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                    <p className={`font-bold text-sm ${team.isCheckedIn ? 'text-green-400' : ''}`}>
                                        {team.name}
                                    </p>
                                    <code className="text-[10px] bg-muted px-1 py-0.5 rounded font-mono text-muted-foreground">
                                        {team.inviteCode}
                                    </code>
                                    {team.problemStatement && (
                                        <span className="text-[10px] text-muted-foreground">
                                            {team.problemStatement.icon} {team.problemStatement.title}
                                        </span>
                                    )}
                                </div>
                                <div className="flex items-center gap-3 mt-1 text-[11px] text-muted-foreground">
                                    <span className="flex items-center gap-1">
                                        <Users className="w-3 h-3" />
                                        {team.participants.map(p => p.name).join(", ")}
                                    </span>
                                    {team.isCheckedIn && team.checkedInAt && (
                                        <span className="text-green-500/70">
                                            ✓ {new Date(team.checkedInAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </span>
                                    )}
                                </div>
                            </div>

                            <Button
                                size="sm"
                                variant={team.isCheckedIn ? "outline" : "default"}
                                className={`text-xs shrink-0 ${team.isCheckedIn ? 'text-muted-foreground' : ''}`}
                                disabled={isPending && loadingId === team.id}
                                onClick={() => handleCheckIn(team.id)}
                            >
                                {loadingId === team.id ? "..." : team.isCheckedIn ? "UNDO" : "CHECK IN"}
                            </Button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}
