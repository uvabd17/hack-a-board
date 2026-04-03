import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { notFound, redirect } from "next/navigation"
import { HackathonSettingsForm } from "./client-components"
import { canManageHackathon, isHackathonOwner } from "@/lib/access-control"
import { formatDateTimeLocal } from "@/lib/datetime"

export default async function SettingsPage({ params }: { params: Promise<{ slug: string }> }) {
    const session = await auth()
    if (!session?.user?.id) return redirect("/")

    const { slug } = await params

    const hackathon = await prisma.hackathon.findUnique({
        where: { slug },
    })

    if (!hackathon || !canManageHackathon(hackathon, session.user)) {
        notFound()
    }

    // Serialize dates to ISO strings for client component
    const serialized = {
        id: hackathon.id,
        name: hackathon.name,
        slug: hackathon.slug,
        tagline: hackathon.tagline,
        description: hackathon.description,
        startDate: formatDateTimeLocal(hackathon.startDate),
        endDate: formatDateTimeLocal(hackathon.endDate),
        timezone: hackathon.timezone,
        mode: hackathon.mode as "in-person" | "online" | "hybrid",
        venue: hackathon.venue,
        onlineLink: hackathon.onlineLink,
        minTeamSize: hackathon.minTeamSize,
        maxTeamSize: hackathon.maxTeamSize,
        maxTeams: hackathon.maxTeams,
        requireApproval: hackathon.requireApproval,
        registrationDeadline: hackathon.registrationDeadline
            ? formatDateTimeLocal(hackathon.registrationDeadline)
            : null,
        timeBonusRate: hackathon.timeBonusRate,
        timePenaltyRate: hackathon.timePenaltyRate,
        status: hackathon.status,
        isArchived: hackathon.isArchived,
        archivedAt: hackathon.archivedAt ? hackathon.archivedAt.toISOString() : null,
        organizerEmails: hackathon.organizerEmails,
        isOwner: isHackathonOwner(hackathon, session.user),
    }

    return (
        <div className="max-w-3xl mx-auto space-y-8">
            <div>
                <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
                <p className="text-muted-foreground text-xs mt-1 uppercase tracking-widest">
                    Configure your hackathon details and rules
                </p>
            </div>

            <HackathonSettingsForm hackathon={serialized} />
        </div>
    )
}
