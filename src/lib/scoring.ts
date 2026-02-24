import {
    Team,
    Round,
    Score,
    Submission,
    Criterion
} from "@prisma/client"

// Types for the data structure we need efficiently
// We define these here to match what we will fetch in the server action
export type TeamWithRelations = Team & {
    scores: (Score & { criterion: Criterion })[];
    submissions: Submission[];
    participants: { id: string }[];
}

export type RoundWithCriteria = Round & {
    criteria: Criterion[];
}

export interface LeaderboardEntry {
    rank: number;
    teamId: string;
    teamName: string;
    slug: string; // Team invite code or slug
    problemStatementId?: string | null;
    totalScore: number;
    roundBreakdown: Record<string, number>; // roundId -> score
    trend: 'up' | 'down' | 'same';
    change: number; // Rank change
}

/**
 * CORE SCORING FORMULA (Per Spec v1.1)
 * 
 * 1. Judge Score = Sum(CriterionScore * Weight%)
 * 2. Round Base = Average(Judge Scores)
 * 3. Round Final = (Round Base * RoundWeight%) + TimeBonus
 * 4. Total = Sum(Round Finals)
 */
export function calculateTeamScore(
    team: TeamWithRelations,
    rounds: RoundWithCriteria[]
): { total: number; breakdown: Record<string, number> } {

    let totalScore = 0;
    const breakdown: Record<string, number> = {};

    for (const round of rounds) {
        // 1. Get all scores for this round
        const roundScores = team.scores.filter(s => s.roundId === round.id);

        // 2. Group by Judge
        const scoresByJudge: Record<string, number> = {};
        const judgesSeen = new Set<string>();

        // If no scores for this round, score is 0 (or just time bonus? Spec implies participation needed for bonus?)
        // Let's assume Time Bonus applies if submission exists, even if 0 score.

        for (const score of roundScores) {
            if (!judgesSeen.has(score.judgeId)) {
                judgesSeen.add(score.judgeId);
                scoresByJudge[score.judgeId] = 0;
            }
            // Add weighted criterion score
            // Formula: Value * (CriterionWeight / 100)
            scoresByJudge[score.judgeId] += score.value * (score.criterion.weight / 100);
        }

        // 3. Calculate Judge Average
        const judgeIds = Object.keys(scoresByJudge);
        let roundBase = 0;

        if (judgeIds.length > 0) {
            const sumJudgeScores = judgeIds.reduce((sum: number, jId: string) => sum + scoresByJudge[jId], 0);
            roundBase = sumJudgeScores / judgeIds.length;
        }

        // 4. Time Bonus
        // Find submission for this round
        const submission = team.submissions.find(s => s.roundId === round.id);
        const timeBonus = submission ? submission.timeBonus : 0;

        // 5. Round Final
        // Formula: (RoundBase * RoundWeight / 100) + TimeBonus
        // If there are NO judges yet but there is a submission, the score is just the time bonus.
        const roundFinal = (roundBase * (round.weight / 100)) + timeBonus;

        breakdown[round.id] = parseFloat(roundFinal.toFixed(2));
        totalScore += roundFinal;
    }

    return {
        total: parseFloat(totalScore.toFixed(2)),
        breakdown
    };
}

/**
 * TIE BREAKER LOGIC
 * Returns negative if A wins, positive if B wins, 0 if equal.
 * 1. Earliest First Round Submission
 * 2. Earliest Team Creation
 */
export function breakTie(a: TeamWithRelations, b: TeamWithRelations, allRounds: Round[]): number {
    // 1. Find the first round (by order)
    const firstRound = [...allRounds].sort((x, y) => x.order - y.order)[0];

    if (firstRound) {
        const subA = a.submissions.find(s => s.roundId === firstRound.id);
        const subB = b.submissions.find(s => s.roundId === firstRound.id);

        if (subA && subB) {
            // Both submitted: Earlier wins (Smaller timestamp is earlier)
            if (subA.submittedAt.getTime() !== subB.submittedAt.getTime()) {
                return subA.submittedAt.getTime() - subB.submittedAt.getTime();
            }
        } else if (subA && !subB) {
            return -1; // A submitted, B didn't -> A wins
        } else if (!subA && subB) {
            return 1; // B submitted, A didn't -> B wins
        }
    }

    // 2. Fallback: Team Creation Time
    return a.createdAt.getTime() - b.createdAt.getTime();
}
