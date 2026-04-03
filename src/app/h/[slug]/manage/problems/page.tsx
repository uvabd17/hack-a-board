import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { notFound, redirect } from "next/navigation"
import { ProblemForm, ProblemItem, ReleaseAllButton } from "./client-components"
import { canManageHackathon } from "@/lib/access-control"

interface ProblemStatement {
    id: string;
    title: string;
    slug: string;
    description: string;
    icon: string | null;
    isReleased: boolean;
}

export default async function ProblemsPage({ params }: { params: Promise<{ slug: string }> }) {
    const session = await auth()
    if (!session?.user?.id) return redirect("/")

    const { slug } = await params

    const hackathon = await prisma.hackathon.findUnique({
        where: { slug },
        include: {
            problemStatements: {
                orderBy: { order: 'asc' }
            }
        }
    })

    if (!hackathon || !canManageHackathon(hackathon, session.user)) {
        notFound()
    }

    const hiddenCount = hackathon.problemStatements.filter((p: ProblemStatement) => !p.isReleased).length

    return (
        <div className="max-w-5xl mx-auto space-y-8">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold tracking-tight">Challenge Tracks</h1>
                <div className="flex items-center gap-4">
                    <ReleaseAllButton hackathonId={hackathon.id} hiddenCount={hiddenCount} />
                    <div className="text-sm text-muted-foreground">
                        Total: {hackathon.problemStatements.length}
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Form Section */}
                <div className="lg:col-span-1">
                    <div className="lg:sticky lg:top-8">
                        <ProblemForm hackathonId={hackathon.id} />
                    </div>
                </div>

                {/* List Section */}
                <div className="lg:col-span-2 space-y-4">
                    {hackathon.problemStatements.length === 0 ? (
                        <div className="p-12 border border-border border-dashed text-center text-muted-foreground">
                            No challenge tracks yet
                        </div>
                    ) : (
                        hackathon.problemStatements.map((problem: ProblemStatement) => (
                            <ProblemItem key={problem.id} problem={problem} hackathonId={hackathon.id} />
                        ))
                    )}
                </div>
            </div>
        </div>
    )
}
