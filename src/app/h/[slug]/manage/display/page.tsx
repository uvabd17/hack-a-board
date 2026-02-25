import { prisma } from "@/lib/prisma"
import { notFound } from "next/navigation"
import { DisplayController } from "@/components/display-controller"
import { CeremonyController } from "@/components/ceremony-controller"

export default async function ManageDisplayPage({ params }: { params: Promise<{ slug: string }> }) {
    const { slug } = await params
    const hackathon = await prisma.hackathon.findUnique({
        where: { slug },
        include: { problemStatements: true }
    })

    if (!hackathon) {
        notFound()
    }

    return (
        <div className="container max-w-4xl py-10">
            <div className="mb-8">
                <h1 className="text-3xl font-bold tracking-tight mb-2">Display Controller</h1>
                <p className="text-muted-foreground">Manage the big screen, leaderboard state, and ceremony from here.</p>
            </div>

            <DisplayController
                hackathonId={hackathon.id}
                initialIsFrozen={hackathon.isFrozen}
                slug={slug}
                problemStatements={hackathon.problemStatements}
                initialMode={hackathon.displayMode as "global" | "problem" | "auto"}
                initialProblemId={hackathon.displayProblemId}
            />

            <CeremonyController
                hackathonId={hackathon.id}
                slug={slug}
            />
        </div>
    )
}
