"use server"

import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { emitParticipantCheckedIn } from "@/lib/socket-emit"

export async function getTeamsForHackathon(slug: string) {
    const session = await auth()
    if (!session?.user?.id) return { error: "Unauthorized", teams: [] }

    const hackathon = await prisma.hackathon.findUnique({
        where: { slug, userId: session.user.id },
        select: { id: true }
    })
    if (!hackathon) return { error: "Not found", teams: [] }

    const teams = await prisma.team.findMany({
        where: { hackathonId: hackathon.id },
        include: {
            participants: { select: { id: true, name: true, email: true, role: true, phone: true, college: true } },
            problemStatement: { select: { title: true, icon: true } },
            submissions: { select: { roundId: true, submittedAt: true } },
        },
        orderBy: { createdAt: 'asc' }
    })

    return { teams, error: null }
}

export async function updateTeamStatus(teamId: string, status: "approved" | "rejected", slug: string) {
    const session = await auth()
    if (!session?.user?.id) return { error: "Unauthorized" }

    const hackathon = await prisma.hackathon.findUnique({
        where: { slug, userId: session.user.id },
        select: { id: true }
    })
    if (!hackathon) return { error: "Not found" }

    const team = await prisma.team.findFirst({ where: { id: teamId, hackathonId: hackathon.id } })
    if (!team) return { error: "Team not found" }

    await prisma.team.update({ where: { id: teamId }, data: { status } })
    revalidatePath(`/h/${slug}/manage/teams`)
    return { success: true }
}

export async function checkInTeam(teamId: string, slug: string) {
    const session = await auth()
    if (!session?.user?.id) return { error: "Unauthorized" }

    const hackathon = await prisma.hackathon.findUnique({
        where: { slug, userId: session.user.id },
        select: { id: true }
    })
    if (!hackathon) return { error: "Not found" }

    const team = await prisma.team.findFirst({ where: { id: teamId, hackathonId: hackathon.id } })
    if (!team) return { error: "Team not found" }

    await prisma.team.update({
        where: { id: teamId },
        data: {
            isCheckedIn: !team.isCheckedIn,
            checkedInAt: !team.isCheckedIn ? new Date() : null,
            checkedInBy: !team.isCheckedIn ? session.user.id : null,
        }
    })

    if (!team.isCheckedIn) {
        // Team is now checked in — emit event
        await emitParticipantCheckedIn(hackathon.id, teamId, team.name)
    }

    revalidatePath(`/h/${slug}/manage/check-in`)
    revalidatePath(`/h/${slug}/manage/teams`)
    revalidatePath(`/h/${slug}/manage`)
    return { success: true }
}

export async function exportTeamsCSV(slug: string): Promise<{ csv: string } | { error: string }> {
    const session = await auth()
    if (!session?.user?.id) return { error: "Unauthorized" }

    const hackathon = await prisma.hackathon.findUnique({
        where: { slug, userId: session.user.id },
        select: { id: true }
    })
    if (!hackathon) return { error: "Not found" }

    const teams = await prisma.team.findMany({
        where: { hackathonId: hackathon.id },
        include: {
            participants: true,
            problemStatement: { select: { title: true } },
        },
        orderBy: { createdAt: 'asc' }
    })

    const rows: string[] = [
        "Team Name,Invite Code,Status,Checked In,Problem Statement,Members,Emails"
    ]

    for (const team of teams) {
        rows.push([
            `"${team.name}"`,
            team.inviteCode,
            team.status,
            team.isCheckedIn ? "Yes" : "No",
            `"${team.problemStatement?.title || 'None'}"`,
            `"${team.participants.map(p => p.name).join(', ')}"`,
            `"${team.participants.map(p => p.email).join(', ')}"`,
        ].join(","))
    }

    return { csv: rows.join("\n") }
}
