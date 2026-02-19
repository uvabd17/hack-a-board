import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { notFound, redirect } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"

export default async function ManageLayout({
    children,
    params,
}: {
    children: React.ReactNode
    params: Promise<{ slug: string }>
}) {
    const session = await auth()
    if (!session?.user?.id) {
        redirect("/signin")
    }

    const { slug } = await params

    const hackathon = await prisma.hackathon.findUnique({
        where: { slug },
        select: { id: true, userId: true, name: true, slug: true }
    })

    if (!hackathon) {
        notFound()
    }

    if (hackathon.userId !== session.user.id) {
        notFound() // Access denied - hide existence
    }

    return (
        <div className="flex min-h-screen bg-background font-mono">
            {/* Sidebar */}
            <aside className="w-64 border-r border-border bg-card/50 hidden md:block">
                <div className="p-6 border-b border-border">
                    <h2 className="font-bold text-lg truncate" title={hackathon.name}>
                        {hackathon.name}
                    </h2>
                    <p className="text-xs text-muted-foreground mt-1">ORGANIZER PANEL</p>
                </div>
                <nav className="p-4 space-y-2">
                    <Button asChild variant="ghost" className="w-full justify-start text-left">
                        <Link href={`/h/${hackathon.slug}/manage`}>
                            :: DASHBOARD
                        </Link>
                    </Button>
                    <Button asChild variant="ghost" className="w-full justify-start text-left">
                        <Link href={`/h/${hackathon.slug}/manage/teams`}>
                            :: TEAMS
                        </Link>
                    </Button>
                    <Button asChild variant="ghost" className="w-full justify-start text-left">
                        <Link href={`/h/${hackathon.slug}/manage/check-in`}>
                            :: CHECK-IN
                        </Link>
                    </Button>
                    <Button asChild variant="ghost" className="w-full justify-start text-left">
                        <Link href={`/h/${hackathon.slug}/manage/problems`}>
                            :: PROBLEMS
                        </Link>
                    </Button>
                    <Button asChild variant="ghost" className="w-full justify-start text-left">
                        <Link href={`/h/${hackathon.slug}/manage/rounds`}>
                            :: ROUNDS
                        </Link>
                    </Button>
                    <Button asChild variant="ghost" className="w-full justify-start text-left">
                        <Link href={`/h/${hackathon.slug}/manage/phases`}>
                            :: PHASES
                        </Link>
                    </Button>
                    <Button asChild variant="ghost" className="w-full justify-start text-left">
                        <Link href={`/h/${hackathon.slug}/manage/judges`}>
                            :: JUDGES
                        </Link>
                    </Button>
                    <Button asChild variant="ghost" className="w-full justify-start text-left">
                        <Link href={`/h/${hackathon.slug}/manage/display`}>
                            :: DISPLAY
                        </Link>
                    </Button>
                    <Button asChild variant="ghost" className="w-full justify-start text-left">
                        <Link href={`/h/${hackathon.slug}/manage/settings`}>
                            :: SETTINGS
                        </Link>
                    </Button>
                    <div className="pt-4 mt-4 border-t border-border space-y-2">
                        <Button asChild variant="outline" className="w-full justify-start text-left opacity-70">
                            <Link href={`/h/${hackathon.slug}/display`} target="_blank">
                                📊 LIVE LEADERBOARD
                            </Link>
                        </Button>
                        <Button asChild variant="outline" className="w-full justify-start text-left opacity-70">
                            <Link href={`/h/${hackathon.slug}`} target="_blank">
                                ↗ VIEW PUBLIC PAGE
                            </Link>
                        </Button>
                    </div>
                </nav>
            </aside>

            {/* Mobile Nav (Simplification) */}
            {/* For MVP, relying on desktop management mostly, but basic structure is here */}

            <main className="flex-1 p-8 overflow-auto">
                {children}
            </main>
        </div>
    )
}
