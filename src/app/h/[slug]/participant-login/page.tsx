import { notFound } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { ParticipantLoginForm } from "@/components/participant-login-form"
import { BrandFooter } from "@/components/ui/brand"

export default async function ParticipantLoginPage({ params }: { params: Promise<{ slug: string }> }) {
    const { slug } = await params
    const hackathon = await prisma.hackathon.findUnique({
        where: { slug },
        select: { name: true, isArchived: true, status: true }
    })

    if (!hackathon || hackathon.isArchived) {
        notFound()
    }

    return (
        <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4 gap-6">
            <div className="text-center">
                <h1 className="text-2xl font-bold tracking-tight">{hackathon.name}</h1>
                <p className="text-xs text-muted-foreground uppercase tracking-wider mt-1">Participant Re-Entry</p>
            </div>
            <ParticipantLoginForm slug={slug} />
            <BrandFooter />
        </div>
    )
}

