import { prisma } from "@/lib/prisma"
import { notFound } from "next/navigation"
import { ClientLeaderboard } from "./client-leaderboard"

export default async function PublicHackathonPage({ params }: { params: Promise<{ slug: string }> }) {
    const { slug } = await params

    const hackathon = await prisma.hackathon.findUnique({
        where: { slug },
        select: { id: true, name: true, slug: true }
    })

    if (!hackathon) notFound()

    return (
        <div className="min-h-screen bg-black text-white font-mono p-4 md:p-8">
            <div className="max-w-5xl mx-auto space-y-8">
                {/* Header */}
                <div className="flex flex-col md:flex-row justify-between items-center gap-4 border-b border-zinc-800 pb-6">
                    <div>
                        <h1 className="text-4xl md:text-6xl font-bold tracking-tighter uppercase">{hackathon.name}</h1>
                        <p className="text-green-500 mt-2 flex items-center gap-2">
                            <span className="relative flex h-3 w-3">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
                            </span>
                            LIVE STANDINGS
                        </p>
                    </div>
                </div>

                {/* Leaderboard */}
                <ClientLeaderboard slug={hackathon.slug} />
            </div>
        </div>
    )
}
