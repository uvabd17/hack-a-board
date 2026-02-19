"use client"

import { useState, useTransition, useMemo } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { updateTeamStatus, checkInTeam, exportTeamsCSV } from "@/actions/teams"
import { CheckSquare, Square, UserCheck, UserX, Download, ChevronDown, ChevronUp, Search } from "lucide-react"

type Participant = {
    id: string
    name: string
    email: string
    role: string
    phone: string | null
    college: string | null
}

type Team = {
    id: string
    name: string
    inviteCode: string
    status: string
    isCheckedIn: boolean
    problemStatement: { title: string; icon: string | null } | null
    participants: Participant[]
    submissions: { roundId: string; submittedAt: Date }[]
}

export function TeamsTable({ teams, slug }: { teams: Team[], slug: string }) {
    const [search, setSearch] = useState("")
    const [filter, setFilter] = useState<"all" | "approved" | "pending" | "rejected">("all")
    const [expandedId, setExpandedId] = useState<string | null>(null)
    const [isPending, startTransition] = useTransition()
    const [loadingId, setLoadingId] = useState<string | null>(null)

    const filtered = useMemo(() => {
        return teams.filter(team => {
            const matchesSearch =
                team.name.toLowerCase().includes(search.toLowerCase()) ||
                team.inviteCode.toLowerCase().includes(search.toLowerCase()) ||
                team.participants.some(p => p.name.toLowerCase().includes(search.toLowerCase()) || p.email.toLowerCase().includes(search.toLowerCase()))
            const matchesFilter = filter === "all" || team.status === filter
            return matchesSearch && matchesFilter
        })
    }, [teams, search, filter])

    const handleStatusChange = (teamId: string, status: "approved" | "rejected") => {
        setLoadingId(teamId)
        startTransition(async () => {
            await updateTeamStatus(teamId, status, slug)
            setLoadingId(null)
        })
    }

    const handleExport = async () => {
        const result = await exportTeamsCSV(slug)
        if ("csv" in result) {
            const blob = new Blob([result.csv], { type: "text/csv" })
            const url = URL.createObjectURL(blob)
            const a = document.createElement("a")
            a.href = url
            a.download = `teams-${slug}.csv`
            a.click()
            URL.revokeObjectURL(url)
        }
    }

    return (
        <div className="space-y-4">
            {/* Controls */}
            <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                        placeholder="Search teams, members, emails..."
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        className="pl-9 font-mono"
                    />
                </div>
                <div className="flex gap-2">
                    {(["all", "pending", "approved", "rejected"] as const).map(f => (
                        <Button
                            key={f}
                            size="sm"
                            variant={filter === f ? "default" : "outline"}
                            onClick={() => setFilter(f)}
                            className="text-xs uppercase"
                        >
                            {f}
                        </Button>
                    ))}
                </div>
                <Button size="sm" variant="outline" onClick={handleExport} className="text-xs uppercase gap-1">
                    <Download className="w-3 h-3" /> CSV
                </Button>
            </div>

            {/* Stats row */}
            <div className="text-xs text-muted-foreground font-mono">
                Showing {filtered.length} of {teams.length} teams &nbsp;·&nbsp;
                {teams.filter(t => t.status === "approved").length} approved &nbsp;·&nbsp;
                {teams.filter(t => t.status === "pending").length} pending &nbsp;·&nbsp;
                {teams.filter(t => t.isCheckedIn).length} checked in
            </div>

            {/* Table */}
            {filtered.length === 0 ? (
                <div className="p-12 border border-border border-dashed text-center text-muted-foreground text-sm">
                    NO_TEAMS_MATCH_FILTER
                </div>
            ) : (
                <div className="space-y-2">
                    {filtered.map(team => (
                        <div key={team.id} className="border border-border bg-card/50 rounded-sm overflow-hidden">
                            {/* Row */}
                            <div className="flex items-center gap-3 p-3 text-sm">
                                <button
                                    onClick={() => setExpandedId(expandedId === team.id ? null : team.id)}
                                    className="text-muted-foreground hover:text-foreground transition-colors"
                                >
                                    {expandedId === team.id ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                                </button>

                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 flex-wrap">
                                        <p className="font-bold truncate">{team.name}</p>
                                        <code className="text-[10px] bg-muted px-1 py-0.5 rounded font-mono">{team.inviteCode}</code>
                                        {team.isCheckedIn && (
                                            <Badge variant="outline" className="text-[9px] border-green-500/50 text-green-500 py-0">CHECKED IN</Badge>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-2 text-[11px] text-muted-foreground mt-0.5 flex-wrap">
                                        <span>{team.participants.length} member(s)</span>
                                        {team.problemStatement && (
                                            <span className="flex items-center gap-1">
                                                · {team.problemStatement.icon} {team.problemStatement.title}
                                            </span>
                                        )}
                                        {team.submissions.length > 0 && (
                                            <span>· {team.submissions.length} submission(s)</span>
                                        )}
                                    </div>
                                </div>

                                <Badge
                                    variant={team.status === "approved" ? "default" : team.status === "rejected" ? "destructive" : "secondary"}
                                    className="text-[9px] uppercase ml-auto shrink-0"
                                >
                                    {team.status}
                                </Badge>

                                {team.status === "pending" && (
                                    <div className="flex gap-1 shrink-0">
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            className="h-7 text-[10px] text-green-500 border-green-500/50 hover:bg-green-500/10"
                                            disabled={isPending && loadingId === team.id}
                                            onClick={() => handleStatusChange(team.id, "approved")}
                                        >
                                            <UserCheck className="w-3 h-3" />
                                        </Button>
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            className="h-7 text-[10px] text-red-500 border-red-500/50 hover:bg-red-500/10"
                                            disabled={isPending && loadingId === team.id}
                                            onClick={() => handleStatusChange(team.id, "rejected")}
                                        >
                                            <UserX className="w-3 h-3" />
                                        </Button>
                                    </div>
                                )}
                            </div>

                            {/* Expanded Members */}
                            {expandedId === team.id && (
                                <div className="border-t border-border bg-black/20 p-4 space-y-3">
                                    <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Team Members</p>
                                    <div className="divide-y divide-border/50">
                                        {team.participants.map(p => (
                                            <div key={p.id} className="py-2 flex items-center gap-3 text-xs">
                                                <div className="flex-1 grid grid-cols-2 md:grid-cols-4 gap-2">
                                                    <span className="font-medium">{p.name}</span>
                                                    <span className="text-muted-foreground">{p.email}</span>
                                                    <span className="text-muted-foreground">{p.college || "—"}</span>
                                                    <span className="text-muted-foreground">{p.phone || "—"}</span>
                                                </div>
                                                <Badge variant="outline" className="text-[9px] uppercase py-0 shrink-0">
                                                    {p.role}
                                                </Badge>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}
