import { prisma } from "@/lib/prisma"
import { cookies } from "next/headers"
import { JudgeSessionSync } from "./session-sync"
import { BrandFooter } from "@/components/ui/brand"

export const dynamic = "force-dynamic"

export default async function JudgeLayout({
    children,
    params,
}: {
    children: React.ReactNode
    params: Promise<{ slug: string }>
}) {
    const { slug } = await params
    const cookieStore = await cookies()
    const token = cookieStore.get("hackaboard_judge_token")?.value

    if (!token) {
        return <JudgeSessionSync slug={slug} />
    }

    const judge = await prisma.judge.findUnique({
        where: { token },
        include: { hackathon: true }
    })

    if (!judge || judge.hackathon.slug !== slug || !judge.isActive) {
        return (
            <div className="flex items-center justify-center min-h-screen text-destructive font-mono">
                ACCESS DENIED — Invalid or inactive judge token
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-background text-foreground flex flex-col" data-role="judge">
            {/* Judge Header */}
            <header className="border-b-2 border-[var(--role-border)] p-4 flex items-center justify-between bg-card">
                <div>
                    <h1 className="text-sm font-bold text-[var(--role-accent)] uppercase tracking-wider">JUDGE PANEL</h1>
                    <p className="text-xs text-muted-foreground">{judge.name}</p>
                </div>
                <div className="text-xs text-muted-foreground font-mono">
                    {judge.hackathon.name}
                </div>
            </header>

            <main className="flex-1 p-4">
                {children}
            </main>
            <BrandFooter />
        </div>
    )
}
