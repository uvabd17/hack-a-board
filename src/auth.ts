import NextAuth from "next-auth"
import type { Provider } from "next-auth/providers"
import Credentials from "next-auth/providers/credentials"
import { PrismaAdapter } from "@auth/prisma-adapter"
import { prisma } from "@/lib/prisma"
import { authConfig } from "@/auth.config"

const providers: Provider[] = [...authConfig.providers]

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
    ...authConfig,
    adapter: PrismaAdapter(prisma),
    providers,
})
