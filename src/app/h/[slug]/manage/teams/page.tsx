import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { notFound, redirect } from "next/navigation"
import { TeamsTable } from "./client-components"

export default async function TeamsPage({ params }: { params: Promise<{ slug: string }> }) {
    const session = await auth()
    if (!session?.user?.id) return redirect("/")

    const { slug } = await params

    const hackathon = await prisma.hackathon.findUnique({
        where: { slug },
        select: { id: true, userId: true, requireApproval: true }
    })

    if (!hackathon || hackathon.userId !== session.user.id) notFound()

    const teams = await prisma.team.findMany({
        where: { hackathonId: hackathon.id },
        include: {
            participants: { select: { id: true, name: true, email: true, role: true, phone: true, college: true } },
            problemStatement: { select: { title: true, icon: true } },
            submissions: { select: { roundId: true, submittedAt: true } },
        },
        orderBy: { createdAt: 'asc' }
    })

    return (
        <div className="max-w-5xl mx-auto space-y-8">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-primary">TEAMS</h1>
                    <p className="text-xs text-muted-foreground mt-1 uppercase tracking-widest">
                        {hackathon.requireApproval ? "Manual approval required" : "Auto-approved registrations"}
                    </p>
                </div>
                <div className="text-sm text-muted-foreground font-mono">
                    TOTAL TEAMS: {teams.length}
                </div>
            </div>

            <TeamsTable teams={teams} slug={slug} />
        </div>
    )
}
