import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { notFound, redirect } from "next/navigation"
import { JudgeForm, JudgeItem } from "./client-components"
import { canManageHackathon } from "@/lib/access-control"

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

    if (!hackathon || !canManageHackathon(hackathon, session.user)) {
        notFound()
    }

    return (
        <div className="max-w-4xl mx-auto space-y-8">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold tracking-tight">Judges</h1>
                <div className="text-sm text-muted-foreground">
                    {hackathon.judges.filter((j: Judge) => j.isActive).length} active
                </div>
            </div>

            <JudgeForm hackathonId={hackathon.id} />

            <div className="space-y-4">
                {hackathon.judges.length === 0 ? (
                    <div className="p-12 border border-border border-dashed text-center text-muted-foreground rounded-lg space-y-2">
                        <p className="text-2xl">👨‍⚖️</p>
                        <p className="font-bold text-foreground">No judges added yet</p>
                        <p className="text-xs">Create judges above to enable scoring at your hackathon.</p>
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
