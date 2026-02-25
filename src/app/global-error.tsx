"use client"

import { useEffect } from "react"

export default function GlobalError({
    error,
    reset,
}: {
    error: Error & { digest?: string }
    reset: () => void
}) {
    useEffect(() => {
        // Log to your error reporting service in production
        console.error("Unhandled error:", error)
    }, [error])

    return (
        <html lang="en">
            <body className="bg-[#050505] text-white font-mono flex items-center justify-center min-h-screen">
                <div className="text-center space-y-6 max-w-md px-6">
                    <div className="text-6xl">⚠</div>
                    <h1 className="text-2xl font-bold tracking-tight">Something went wrong</h1>
                    <p className="text-zinc-400 text-sm">
                        An unexpected error occurred. Our team has been notified.
                    </p>
                    {error.digest && (
                        <p className="text-zinc-600 text-xs font-mono">
                            Error ID: {error.digest}
                        </p>
                    )}
                    <button
                        onClick={reset}
                        className="px-6 py-2 bg-white text-black font-bold text-sm hover:bg-zinc-200 transition-colors"
                    >
                        TRY AGAIN
                    </button>
                </div>
            </body>
        </html>
    )
}
