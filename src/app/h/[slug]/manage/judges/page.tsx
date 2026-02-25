import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { notFound, redirect } from "next/navigation"
import { JudgeForm, JudgeItem } from "./client-components"

interface Judge {
    id: string;
    name: string;
    token: string;
    hackathonId: string;
    isActive: boolean;
}

export default async function JudgesPage({ params }: { params: Promise<{ slug: string }> }) {
    const session = await auth()
    if (!session?.user?.id) return redirect("/")

    const { slug } = await params

    const hackathon = await prisma.hackathon.findUnique({
        where: { slug },
        include: {
            judges: {
                orderBy: { createdAt: 'desc' }
            }
        }
    })

    if (!hackathon || hackathon.userId !== session.user.id) {
        notFound()
    }

    return (
        <div className="max-w-4xl mx-auto space-y-8">
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold text-primary">JUDGE_ROSTER</h1>
                <div className="text-sm text-muted-foreground">
                    ACTIVE_UNITS: {hackathon.judges.filter((j: Judge) => j.isActive).length}
                </div>
            </div>

            <JudgeForm hackathonId={hackathon.id} />

            <div className="space-y-4">
                {hackathon.judges.length === 0 ? (
                    <div className="p-12 border border-border border-dashed text-center text-muted-foreground">
                        NO_JUDGES_ASSIGNED
                    </div>
                ) : (
                    hackathon.judges.map((judge: Judge) => (
                            <JudgeItem key={judge.id} judge={judge} hackathonId={hackathon.id} slug={slug} />
                    ))
                )}
            </div>
        </div>
    )
}
