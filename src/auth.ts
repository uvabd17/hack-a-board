import NextAuth from "next-auth"
import type { Provider } from "next-auth/providers"
import Google from "next-auth/providers/google"
import Credentials from "next-auth/providers/credentials"
import { PrismaAdapter } from "@auth/prisma-adapter"
import { prisma } from "@/lib/prisma"

const providers: Provider[] = [Google]

// Add test credentials provider in development
if (process.env.NODE_ENV === "development") {
    providers.push(
        Credentials({
            name: "Test Account",
            credentials: {
                email: { label: "Email", type: "email", placeholder: "organizer@test.com" }
            },
            async authorize(credentials) {
                if (!credentials?.email) return null
                
                // Find user by email
                const user = await prisma.user.findUnique({
                    where: { email: credentials.email as string }
                })
                
                return user ? {
                    id: user.id,
                    name: user.name,
                    email: user.email,
                    image: user.image
                } : null
            }
        })
    )
}

export const { handlers, auth, signIn, signOut } = NextAuth({
    // Only use adapter for OAuth providers (Google)
    // Credentials provider uses JWT sessions without adapter
    ...(process.env.NODE_ENV === "production" ? { adapter: PrismaAdapter(prisma) } : {}),
    providers,
    // Use JWT sessions for credentials provider compatibility
    session: {
        strategy: "jwt"
    },
    callbacks: {
        async jwt({ token, user, account }) {
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
        }
    },
    pages: {
        signIn: "/signin",
    },
})
