import { prisma } from "@/lib/prisma"
import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import { Scanner } from "./scanner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import Link from "next/link"

export default async function JudgeDashboard({ params }: { params: Promise<{ slug: string }> }) {
    const { slug } = await params
    const cookieStore = await cookies()
    const token = cookieStore.get("hackaboard_judge_token")?.value

    if (!token) redirect(`/h/${slug}/qr/login`) // Should be handled by layout but safety first

    const judge = await prisma.judge.findUnique({
        where: { token },
        include: {
            scores: {
                distinct: ['teamId'], // Count unique teams scored
                select: { teamId: true }
            }
        }
    })

    if (!judge) redirect("/")

    async function handleManualCode(formData: FormData) {
        "use server"
        const inviteCode = formData.get("code") as string
        if (!inviteCode) return

        const team = await prisma.team.findUnique({
            where: { inviteCode },
            select: { id: true, hackathonId: true }
        })

        if (team && team.hackathonId === judge!.hackathonId) {
            redirect(`/h/${slug}/judge/score/${team.id}`)
        }
    }

    return (
        <div className="max-w-md mx-auto space-y-8">
            <div className="text-center space-y-2">
                <p className="text-zinc-400 text-sm">Teams Evaluated</p>
                <p className="text-5xl font-mono font-bold text-white">{judge.scores.length}</p>
            </div>

            <Scanner slug={slug} />

            <div className="bg-zinc-900 p-6 rounded-lg border border-zinc-800">
                <h3 className="text-zinc-400 text-sm mb-4">or enter manual code</h3>
                <form action={handleManualCode} className="flex gap-2">
                    <Input
                        name="code"
                        placeholder="Team Code (e.g. X7F9K2)"
                        className="bg-black border-zinc-700 text-white font-mono uppercase"
                        maxLength={6}
                        required
                    />
                    <Button type="submit" variant="secondary">GO</Button>
                </form>
            </div>

            <div className="text-center">
                <Link href={`/h/${slug}`} className="text-xs text-zinc-600 hover:text-green-500 underline">
                    Return to Leaderboard
                </Link>
            </div>
        </div>
    )
}
