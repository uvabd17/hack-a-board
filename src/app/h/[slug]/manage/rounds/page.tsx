import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { notFound, redirect } from "next/navigation"
import { RoundForm, RoundItem } from "./client-components"

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

    if (!hackathon || hackathon.userId !== session.user.id) {
        notFound()
    }

    return (
        <div className="max-w-5xl mx-auto space-y-8">
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold text-primary">JUDGING_PROTOCOLS</h1>
                <div className="text-sm text-muted-foreground">
                    ROUNDS_ACTIVE: {hackathon.rounds.length}
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
                            NO_PROTOCOLS_DEFINED
                        </div>
                    ) : (
                        hackathon.rounds.map((round: Round) => (
                            <RoundItem key={round.id} round={round} hackathonId={hackathon.id} />
                        ))
                    )}
                </div>
            </div>
        </div>
    )
}
