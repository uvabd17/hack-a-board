import { notFound, redirect } from "next/navigation"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { PhaseForm, PhaseItem, ShiftPhasesControl } from "./client-components"

export default async function PhasesPage({
    params,
}: {
    params: Promise<{ slug: string }>
}) {
    const session = await auth()
    if (!session?.user?.email) redirect("/")

    const { slug } = await params

    const hackathon = await prisma.hackathon.findUnique({
        where: { slug },
        include: {
            phases: { orderBy: { order: "asc" } },
        },
    })

    if (!hackathon) notFound()
    if (hackathon.userId !== session.user.id) redirect("/dashboard")

    // Serialize DateTime → ISO string for client components
    const phases = hackathon.phases.map((p) => ({
        id: p.id,
        name: p.name,
        startTime: p.startTime.toISOString(),
        endTime: p.endTime.toISOString(),
        order: p.order,
    }))

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold tracking-tight">PHASES</h1>
                <p className="text-muted-foreground text-sm mt-1">
                    Schedule blocks shown on the event display (Check-in, Hacking, Judging, Ceremony…)
                </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Create Form */}
                <div className="lg:col-span-1 space-y-4">
                    <PhaseForm hackathonId={hackathon.id} />
                    {phases.length > 0 && (
                        <ShiftPhasesControl hackathonId={hackathon.id} />
                    )}
                </div>

                {/* Phase list */}
                <div className="lg:col-span-2 space-y-3">
                    {phases.length === 0 ? (
                        <div className="border border-dashed border-primary/20 p-8 text-center">
                            <p className="text-muted-foreground text-sm font-mono">NO_PHASES_DEFINED</p>
                            <p className="text-muted-foreground text-xs mt-2">
                                Add phases to show a live schedule on the display screen.
                            </p>
                        </div>
                    ) : (
                        <>
                            <div className="text-xs text-muted-foreground font-mono uppercase tracking-wider mb-2">
                                {phases.length} phase{phases.length !== 1 ? "s" : ""} scheduled
                            </div>
                            {phases.map((phase) => (
                                <PhaseItem
                                    key={phase.id}
                                    phase={phase}
                                    hackathonId={hackathon.id}
                                />
                            ))}
                        </>
                    )}
                </div>
            </div>
        </div>
    )
}
