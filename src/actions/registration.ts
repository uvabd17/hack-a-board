"use server"

import { z } from "zod"
import { prisma } from "@/lib/prisma"
import crypto from "crypto"
import { getRequestIp, checkRateLimit } from "@/lib/rate-limit"
import { setParticipantSessionCookie } from "@/lib/participant-session"

// Zod Schemas
const registerSchema = z.object({
    hackathonSlug: z.string(),
    name: z.string().min(2, "Name must be at least 2 characters"),
    email: z.string().email("Invalid email address"),
    phone: z.string().optional(),
    college: z.string().optional(),
    // mode: "create" | "join" | "solo"
    mode: z.enum(["create", "join", "solo"]),
    teamName: z.string().optional(), // Required if mode === "create"
    inviteCode: z.string().min(3, "Invite code too short").max(10, "Invite code too long").optional(), // Required if mode === "join"
})

export type RegisterState = {
    error?: string
    success?: boolean
    qrToken?: string
    loginPath?: string
}

export async function registerParticipant(prevState: RegisterState, formData: FormData): Promise<RegisterState> {
    const data = Object.fromEntries(formData.entries())

    // Validate basic fields
    const parsed = registerSchema.safeParse(data)

    if (!parsed.success) {
        return { error: parsed.error.issues[0].message }
    }

    const { hackathonSlug, name, email, phone, college, mode, teamName, inviteCode } = parsed.data
    const normalizedEmail = email.toLowerCase().trim()

    try {
        const ip = await getRequestIp()
        const limited = await checkRateLimit({
            namespace: "registration",
            identifier: `${ip}:${hackathonSlug.toLowerCase()}`,
            limit: 20,
            windowSec: 10 * 60,
        })
        if (!limited.allowed) {
            return { error: "Too many registration attempts. Please try again shortly." }
        }

        const hackathon = await prisma.hackathon.findUnique({
            where: { slug: hackathonSlug }
        })

        if (!hackathon) return { error: "Hackathon not found" }
        if (hackathon.isArchived) return { error: "Registration is not available for this hackathon" }

        // Block registration if hackathon is not published or live
        if (hackathon.status !== "published" && hackathon.status !== "live") {
            return { error: "Registration is not available for this hackathon" }
        }

        // Enforce registration deadline
        if (hackathon.registrationDeadline && new Date() > hackathon.registrationDeadline) {
            return { error: "Registration deadline has passed" }
        }

        // Enforce max team capacity
        if (hackathon.maxTeams > 0 && (mode === "create" || mode === "solo")) {
            const teamCount = await prisma.team.count({
                where: { hackathonId: hackathon.id }
            })
            if (teamCount >= hackathon.maxTeams) {
                return { error: "This hackathon has reached its maximum number of teams" }
            }
        }

        // Check if email already registered for this hackathon
        const existingParticipant = await prisma.participant.findUnique({
            where: {
                hackathonId_email: {
                    hackathonId: hackathon.id,
                    email: normalizedEmail
                }
            }
        })

        if (existingParticipant) {
            return {
                error: "Email already registered for this hackathon. Please sign in with your team code.",
                loginPath: `/h/${hackathonSlug}/participant-login`
            }
        }

        // Handle Team Logic
        let teamId: string = ""

        if (mode === "create") {
            if (!teamName || teamName.length < 3) {
                return { error: "Team name must be at least 3 characters" }
            }

            // Generate unique invite code
            const code = crypto.randomBytes(3).toString("hex").toUpperCase()

            const team = await prisma.team.create({
                data: {
                    hackathonId: hackathon.id,
                    name: teamName,
                    inviteCode: code,
                    status: hackathon.requireApproval ? "pending" : "approved"
                }
            })
            teamId = team.id
        } else if (mode === "join") {
            if (!inviteCode) return { error: "Invite code is required" }

            const team = await prisma.team.findUnique({
                where: { inviteCode }
            })

            if (!team) return { error: "Invalid invite code" }

            // Ensure the team belongs to this hackathon (prevent cross-hackathon joins)
            if (team.hackathonId !== hackathon.id) {
                return { error: "Invalid invite code" }
            }

            // Check team size
            const memberCount = await prisma.participant.count({
                where: { teamId: team.id }
            })

            if (memberCount >= hackathon.maxTeamSize) {
                return { error: `Team is full (max ${hackathon.maxTeamSize} members)` }
            }

            teamId = team.id
        } else if (mode === "solo") {
            // Create a team with participant name
            const code = crypto.randomBytes(3).toString("hex").toUpperCase()
            const team = await prisma.team.create({
                data: {
                    hackathonId: hackathon.id,
                    name: `${name}'s Team`,
                    inviteCode: code,
                    status: hackathon.requireApproval ? "pending" : "approved"
                }
            })
            teamId = team.id
        }

        // Generate QR Token
        const qrToken = crypto.randomBytes(32).toString("hex")

        await prisma.participant.create({
            data: {
                hackathonId: hackathon.id,
                teamId,
                name,
                email: normalizedEmail,
                phone,
                college,
                role: mode === "create" || mode === "solo" ? "leader" : "member",
                qrToken,
                status: "approved"
            }
        })

        // Prepare redirect URL
        return { success: true, qrToken: qrToken }

    } catch (e) {
        console.error("Registration error:", e)
        return { error: "Something went wrong. Please try again." }
    }
}

const participantLoginSchema = z.object({
    hackathonSlug: z.string().min(1),
    email: z.string().email("Invalid email address"),
    teamCode: z.string().min(3, "Team code too short").max(10, "Team code too long"),
})

export type ParticipantLoginState = {
    error?: string
    success?: boolean
    redirectTo?: string
}

export async function participantFallbackLogin(
    prevState: ParticipantLoginState,
    formData: FormData
): Promise<ParticipantLoginState> {
    const parsed = participantLoginSchema.safeParse({
        hackathonSlug: formData.get("hackathonSlug"),
        email: formData.get("email"),
        teamCode: String(formData.get("teamCode") || "").toUpperCase().trim(),
    })

    if (!parsed.success) {
        return { error: parsed.error.issues[0].message }
    }

    const { hackathonSlug, email, teamCode } = parsed.data

    try {
        const hackathon = await prisma.hackathon.findUnique({
            where: { slug: hackathonSlug },
            select: { id: true, isArchived: true }
        })
        if (!hackathon) {
            return { error: "Hackathon not found" }
        }
        if (hackathon.isArchived) {
            return { error: "This event is archived" }
        }

        const participant = await prisma.participant.findUnique({
            where: {
                hackathonId_email: {
                    hackathonId: hackathon.id,
                    email: email.toLowerCase().trim()
                }
            },
            include: {
                team: { select: { inviteCode: true } }
            }
        })

        if (!participant) {
            return { error: "Participant not found for this event" }
        }

        if (participant.team.inviteCode !== teamCode) {
            return { error: "Invalid team code" }
        }

        await setParticipantSessionCookie(hackathonSlug, participant.qrToken)
        return { success: true, redirectTo: `/h/${hackathonSlug}/dashboard` }
    } catch (error) {
        console.error("Participant fallback login failed:", error)
        return { error: "Unable to sign in right now. Please try again." }
    }
}
