import { prisma } from "@/lib/prisma"
import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import { Scanner } from "./scanner"
import { ManualCodeEntry } from "./manual-code-entry"
import Link from "next/link"

export const dynamic = "force-dynamic"

export default async function JudgeDashboard({ params }: { params: Promise<{ slug: string }> }) {
    const { slug } = await params
    const cookieStore = await cookies()
    const token = cookieStore.get("hackaboard_judge_token")?.value

    if (!token) redirect(`/h/${slug}/qr/login`)

    const judge = await prisma.judge.findUnique({
        where: { token },
        include: {
            scores: {
                distinct: ['teamId'],
                select: { teamId: true }
            }
        }
    })

    if (!judge) redirect("/")

    return (
        <div className="max-w-md mx-auto space-y-6 pb-8">
            {/* Stats */}
            <div className="text-center py-4">
                <p className="text-muted-foreground text-xs uppercase tracking-widest font-bold">Teams evaluated</p>
                <p className="text-6xl font-mono font-black text-[var(--role-accent)] tabular-nums mt-1">{judge.scores.length}</p>
            </div>

            {/* Primary: Manual code entry */}
            <ManualCodeEntry slug={slug} />

            {/* Secondary: QR Scanner */}
            <div className="space-y-2">
                <p className="text-xs text-muted-foreground uppercase tracking-widest font-bold px-1">Or scan their QR</p>
                <Scanner slug={slug} />
            </div>

            {/* Footer link */}
            <div className="text-center pt-2">
                <Link href={`/h/${slug}/display`} className="text-xs text-muted-foreground hover:text-primary underline underline-offset-4">
                    View leaderboard
                </Link>
            </div>
        </div>
    )
}
