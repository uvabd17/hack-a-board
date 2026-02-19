import { prisma } from "@/lib/prisma"

export async function calculateTeamScore(teamId: string) {
    // Fetch all necessary data
    const team = await prisma.team.findUnique({
        where: { id: teamId },
        include: {
            submissions: true,
            scores: {
                include: {
                    criterion: true
                }
            },
            hackathon: {
                include: {
                    rounds: {
                        include: {
                            criteria: true
                        }
                    }
                }
            }
        }
    })

    if (!team) return null

    let totalScore = 0
    interface RoundBreakdown {
        roundId: string;
        name?: string;
        avgJudgeScore?: number;
        timeBonus?: number;
        weightedRoundScore?: number;
        score?: number;
    }
    const roundBreakdown: RoundBreakdown[] = []

    for (const round of team.hackathon.rounds) {
        // 1. Get all scores for this round
        const roundScores = team.scores.filter(s => s.roundId === round.id)

        // 2. Group by Judge
        // Define Score type based on Prisma include
        type ScoreWithCriterion = typeof team.scores[0]
        const scoresByJudge: Record<string, ScoreWithCriterion[]> = {}

        roundScores.forEach((s: ScoreWithCriterion) => {
            if (!scoresByJudge[s.judgeId]) scoresByJudge[s.judgeId] = []
            scoresByJudge[s.judgeId].push(s)
        })

        const judgeIds = Object.keys(scoresByJudge)
        if (judgeIds.length === 0) {
            roundBreakdown.push({ roundId: round.id, score: 0 })
            continue
        }

        // 3. Calculate Score per Judge
        let sumJudgeScores = 0
        judgeIds.forEach(judgeId => {
            const jScores = scoresByJudge[judgeId]
            let judgeRoundScore = 0

            // For each criterion in this round
            round.criteria.forEach((crit: typeof round.criteria[0]) => {
                const s = jScores.find((qs: ScoreWithCriterion) => qs.criterionId === crit.id)
                const val = s ? s.value : 0
                // Weighted Criterion Score
                judgeRoundScore += (val * (crit.weight / 100))
            })

            sumJudgeScores += judgeRoundScore
        })

        // 4. Average Judge Score
        const avgJudgeScore = sumJudgeScores / judgeIds.length

        // 5. Time Bonus (from Submission)
        const submission = team.submissions.find((sub: typeof team.submissions[0]) => sub.roundId === round.id)
        const timeBonus = submission ? submission.timeBonus : 0

        // 6. Final Round Score
        // Formula: (AvgJudgeScore + TimeBonus) * (RoundWeight / 100)
        // Note: AvgJudgeScore is roughly 1-10 range if criteria weights sum to 100.
        // TimeBonus is additive.
        const rawRoundScore = avgJudgeScore + timeBonus
        const weightedRoundScore = rawRoundScore * (round.weight / 100)

        totalScore += weightedRoundScore

        roundBreakdown.push({
            roundId: round.id,
            name: round.name,
            avgJudgeScore,
            timeBonus,
            weightedRoundScore
        })
    }

    return {
        teamId: team.id,
        teamName: team.name,
        totalScore: parseFloat(totalScore.toFixed(2)), // 2 decimal precision
        breakdown: roundBreakdown
    }
}
