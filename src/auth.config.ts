/**
 * Edge-compatible NextAuth config — no Prisma, no Node.js-only imports.
 * Used by middleware (Edge runtime) to verify sessions.
 * The full auth.ts (with PrismaAdapter) is used by server components and actions.
 */
import type { NextAuthConfig } from "next-auth"
import Google from "next-auth/providers/google"

export const authConfig: NextAuthConfig = {
    providers: [Google],
    session: { strategy: "jwt" },
    callbacks: {
        async jwt({ token, user }) {
            if (user) {
                token.id = user.id
                token.email = user.email
                token.name = user.name
            }
            return token
        },
        async session({ session, token }) {
            if (session.user) {
                session.user.id = token.id as string
                session.user.email = token.email as string
                session.user.name = token.name as string
            }
            return session
        },
        authorized({ auth }) {
            return !!auth?.user
        },
    },
    pages: {
        signIn: "/signin",
    },
}
