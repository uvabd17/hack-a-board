"use client"

import { useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"

export function JudgeSessionSync({ slug }: { slug: string }) {
    const router = useRouter()

    useEffect(() => {
        const id = setTimeout(() => {
            router.refresh()
        }, 400)
        return () => clearTimeout(id)
    }, [router])

    return (
        <div className="min-h-screen flex items-center justify-center px-4">
            <div className="max-w-md w-full border border-zinc-700 bg-zinc-900 rounded-lg p-5 text-center space-y-3">
                <h2 className="text-sm font-bold uppercase tracking-widest text-primary">Syncing Judge Session</h2>
                <p className="text-xs text-zinc-300">
                    Finishing secure login from QR scan. If this takes more than a second, tap retry.
                </p>
                <button
                    type="button"
                    onClick={() => router.refresh()}
                    className="w-full text-xs uppercase tracking-wider border border-primary/40 bg-primary/10 py-2 rounded hover:bg-primary/20"
                >
                    Retry Session Check
                </button>
                <Link href={`/h/${slug}`} className="block text-[11px] text-zinc-400 underline">
                    Back to event
                </Link>
            </div>
        </div>
    )
}

