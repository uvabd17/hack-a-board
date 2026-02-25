import { prisma } from "@/lib/prisma"
import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import { ScoringForm } from "./scoring-form"
import { recordJudgingAttempt } from "@/actions/judging"

export default async function ScoringPage({
    params
}: {
    params: Promise<{ slug: string; teamId: string }>
}) {
    const { slug, teamId } = await params
    const cookieStore = await cookies()
    const token = cookieStore.get("hackaboard_judge_token")?.value

    if (!token) redirect(`/h/${slug}/qr/login`)

    const judge = await prisma.judge.findUnique({
        where: { token },
        select: { id: true, hackathonId: true, isActive: true }
    })

    if (!judge || !judge.isActive) redirect("/")

    // Fetch Team to verify context
    const team = await prisma.team.findUnique({
        where: { id: teamId },
        include: { problemStatement: true }
    })

    if (!team || team.hackathonId !== judge.hackathonId) redirect(`/h/${slug}/judge`)

    // Fetch Rounds & Criteria
    const rounds = await prisma.round.findMany({
        where: { hackathonId: judge.hackathonId },
        include: { criteria: true },
        orderBy: { order: 'asc' }
    })

    // Record judging attempts for all rounds (for grace period tracking)
    // This marks when the judge started the scoring session
    for (const round of rounds) {
        await recordJudgingAttempt(token, teamId, round.id)
    }

    // Fetch Existing Scores
    const existingScores = await prisma.score.findMany({
        where: {
            judgeId: judge.id,
            teamId: team.id
        },
        select: { criterionId: true, value: true }
    })

    // Convert scores to Map for client
    const scoresMap: Record<string, number> = {}
    existingScores.forEach((s: { criterionId: string; value: number }) => {
        scoresMap[s.criterionId] = s.value
    })

    return (
        <div className="max-w-2xl mx-auto space-y-6 pb-20">
            <div className="space-y-1">
                <h2 className="text-3xl font-bold break-words">{team.name}</h2>
                <div className="flex flex-wrap gap-2 text-sm text-zinc-400 font-mono">
                    <span className="bg-zinc-800 px-2 py-1 rounded border border-zinc-700">
                        {team.problemStatement?.slug || "NO_TRACK"}
                    </span>
                    <span className="bg-zinc-800 px-2 py-1 rounded border border-zinc-700">
                        {team.inviteCode}
                    </span>
                </div>
            </div>

            <ScoringForm
                hackathonId={judge.hackathonId}
                teamId={team.id}
                rounds={rounds}
                initialScores={scoresMap}
            />
        </div>
    )
}
