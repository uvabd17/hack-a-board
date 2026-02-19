import { prisma } from "@/lib/prisma"
import { headers, cookies } from "next/headers"
import { redirect } from "next/navigation"

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
        return (
            <div className="flex items-center justify-center min-h-screen text-destructive font-mono">
                ACCESS_DENIED: MISSING_CREDENTIALS
            </div>
        )
    }

    const judge = await prisma.judge.findUnique({
        where: { token },
        include: { hackathon: true }
    })

    if (!judge || judge.hackathon.slug !== slug || !judge.isActive) {
        return (
            <div className="flex items-center justify-center min-h-screen text-destructive font-mono">
                ACCESS_DENIED: INVALID_TOKEN_OR_INACTIVE
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-black text-white font-mono flex flex-col">
            {/* Judge Header */}
            <header className="border-b border-white/20 p-4 flex items-center justify-between bg-zinc-900">
                <div>
                    <h1 className="text-sm font-bold text-green-400">JUDGE_TERMINAL</h1>
                    <p className="text-xs text-zinc-500">{judge.name}</p>
                </div>
                <div className="text-xs text-zinc-600">
                    {judge.hackathon.name}
                </div>
            </header>

            <main className="flex-1 p-4">
                {children}
            </main>
        </div>
    )
}
