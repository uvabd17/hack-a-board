import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { notFound, redirect } from "next/navigation"
import { CheckInList } from "./client-components"
import { canManageHackathon } from "@/lib/access-control"
import { LiveRefresher } from "@/components/live-refresher"

export default async function CheckInPage({ params }: { params: Promise<{ slug: string }> }) {
    const session = await auth()
    if (!session?.user?.id) return redirect("/")

    const { slug } = await params

    const hackathon = await prisma.hackathon.findUnique({
        where: { slug },
        select: { id: true, userId: true, organizerEmails: true }
    })

    if (!hackathon || !canManageHackathon(hackathon, session.user)) notFound()

    const teams = await prisma.team.findMany({
        where: { hackathonId: hackathon.id },
        include: {
            participants: { select: { id: true, name: true, email: true, role: true } },
            problemStatement: { select: { title: true, icon: true } },
        },
        orderBy: [{ isCheckedIn: 'asc' }, { name: 'asc' }]
    })

    const checkedIn = teams.filter(t => t.isCheckedIn && t.status === "approved").length
    const approved = teams.filter(t => t.status === "approved").length

    return (
        <div className="max-w-3xl mx-auto space-y-8">
            <LiveRefresher hackathonId={hackathon.id} />
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Check-in</h1>
                    <p className="text-xs text-muted-foreground mt-1 uppercase tracking-widest">
                        Mark teams as present on arrival
                    </p>
                </div>
                <div className="text-right">
                    <p className="text-2xl font-bold">{checkedIn}/{approved}</p>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-widest">PRESENT</p>
                </div>
            </div>

            <CheckInList teams={teams} slug={slug} />
        </div>
    )
}
