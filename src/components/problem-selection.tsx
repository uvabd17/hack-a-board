"use client"

import { useState } from "react"
import { ProblemStatement } from "@prisma/client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { selectTeamProblem } from "@/actions/problems"

export function ProblemSelection({
    problems,
    teamId,
    slug
}: {
    problems: ProblemStatement[],
    teamId: string,
    slug: string
}) {
    const [loading, setLoading] = useState<string | null>(null)
    async function handleSelect(problemId: string) {
        setLoading(problemId)
        const res = await selectTeamProblem(teamId, problemId, slug)
        if (res.success) {
            alert("TRACK_LOCKED: Your mission track has been set.")
        } else {
            alert("ERROR: " + res.error)
        }
        setLoading(null)
    }

    return (
        <div className="grid grid-cols-1 gap-4">
            {problems.map(problem => (
                <Card key={problem.id} className="bg-card border-border hover:border-primary/50 transition-colors">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-base font-bold">{problem.title}</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-xs text-muted-foreground mb-4 line-clamp-2">{problem.description}</p>
                        <Button
                            variant="outline"
                            size="sm"
                            className="w-full text-xs uppercase"
                            onClick={() => handleSelect(problem.id)}
                            disabled={loading !== null}
                        >
                            {loading === problem.id ? "SELECTING..." : "CHOOSE TRACK"}
                        </Button>
                    </CardContent>
                </Card>
            ))}
        </div>
    )
}
