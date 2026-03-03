import { cookies } from "next/headers"

export const PARTICIPANT_COOKIE_NAME = "hackaboard_participant_token"

export async function setParticipantSessionCookie(slug: string, token: string) {
    ;(await cookies()).set(PARTICIPANT_COOKIE_NAME, token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        path: `/h/${slug}`,
        maxAge: 60 * 60 * 24 * 3, // 3 days
    })
}

