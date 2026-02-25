import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { notFound, redirect } from "next/navigation"
import { HackathonSettingsForm } from "./client-components"

export default async function SettingsPage({ params }: { params: Promise<{ slug: string }> }) {
    const session = await auth()
    if (!session?.user?.id) return redirect("/")

    const { slug } = await params

    const hackathon = await prisma.hackathon.findUnique({
        where: { slug },
    })

    if (!hackathon || hackathon.userId !== session.user.id) {
        notFound()
    }

    // Serialize dates to ISO strings for client component
    const serialized = {
        id: hackathon.id,
        name: hackathon.name,
        slug: hackathon.slug,
        tagline: hackathon.tagline,
        description: hackathon.description,
        startDate: hackathon.startDate.toISOString().slice(0, 16),
        endDate: hackathon.endDate.toISOString().slice(0, 16),
        timezone: hackathon.timezone,
        mode: hackathon.mode as "in-person" | "online" | "hybrid",
        venue: hackathon.venue,
        onlineLink: hackathon.onlineLink,
        minTeamSize: hackathon.minTeamSize,
        maxTeamSize: hackathon.maxTeamSize,
        maxTeams: hackathon.maxTeams,
        requireApproval: hackathon.requireApproval,
        registrationDeadline: hackathon.registrationDeadline
            ? hackathon.registrationDeadline.toISOString().slice(0, 16)
            : null,
        timeBonusRate: hackathon.timeBonusRate,
        timePenaltyRate: hackathon.timePenaltyRate,
        status: hackathon.status,
    }

    return (
        <div className="max-w-3xl mx-auto space-y-8">
            <div>
                <h1 className="text-3xl font-bold text-primary tracking-tight">SETTINGS</h1>
                <p className="text-muted-foreground text-xs mt-1 uppercase tracking-widest">
                    Configure your hackathon details and rules
                </p>
            </div>

            <HackathonSettingsForm hackathon={serialized} />
        </div>
    )
}
