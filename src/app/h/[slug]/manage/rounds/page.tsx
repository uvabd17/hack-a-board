import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { notFound, redirect } from "next/navigation"
import { RoundForm, RoundItem } from "./client-components"
import { LiveRefresher } from "@/components/live-refresher"
import { canManageHackathon } from "@/lib/access-control"

interface Criterion {
    id: string;
    name: string;
    weight: number;
}

interface Round {
    id: string;
    hackathonId: string;
    name: string;
    order: number;
    weight: number;
    checkpointTime: Date;
    checkpointPausedAt: Date | null;
    criteria: Criterion[];
}

export default async function RoundsPage({ params }: { params: Promise<{ slug: string }> }) {
    const session = await auth()
    if (!session?.user?.id) return redirect("/")

    const { slug } = await params

    const hackathon = await prisma.hackathon.findUnique({
        where: { slug },
        include: {
            rounds: {
                orderBy: { order: 'asc' },
                include: {
                    criteria: true
                }
            }
        }
    })

    if (!hackathon || !canManageHackathon(hackathon, session.user)) {
        notFound()
    }

    return (
        <div className="max-w-5xl mx-auto space-y-8">
            <LiveRefresher hackathonId={hackathon.id} />
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold tracking-tight">Scoring Rounds</h1>
                <div className="text-sm text-muted-foreground">
                    {hackathon.rounds.length} round{hackathon.rounds.length !== 1 ? "s" : ""} active
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Form Section */}
                <div className="lg:col-span-1">
                    <div className="lg:sticky lg:top-8">
                        <RoundForm hackathonId={hackathon.id} />
                    </div>
                </div>

                {/* List Section */}
                <div className="lg:col-span-2 space-y-6">
                    {hackathon.rounds.length === 0 ? (
                        <div className="p-12 border border-border border-dashed text-center text-muted-foreground">
                            No scoring rounds defined yet
                        </div>
                    ) : (
                        hackathon.rounds.map((round) => (
                            <RoundItem key={round.id} round={{
                                ...round,
                                checkpointTime: round.checkpointTime.toISOString(),
                                checkpointPausedAt: round.checkpointPausedAt?.toISOString() ?? null,
                            }} hackathonId={hackathon.id} />
                        ))
                    )}
                </div>
            </div>
        </div>
    )
}
