"use client"

import { useEffect } from "react"

export default function ErrorBoundary({
    error,
    reset,
}: {
    error: Error & { digest?: string }
    reset: () => void
}) {
    useEffect(() => {
        console.error("Page error:", error)
    }, [error])

    return (
        <div className="min-h-screen bg-background text-foreground font-mono flex items-center justify-center">
            <div className="text-center space-y-6 max-w-md px-6">
                <div className="text-5xl">⚠</div>
                <h2 className="text-xl font-bold tracking-tight">Something went wrong</h2>
                <p className="text-muted-foreground text-sm">
                    An error occurred while loading this page.
                </p>
                {error.digest && (
                    <p className="text-muted-foreground/50 text-xs font-mono">
                        Error ID: {error.digest}
                    </p>
                )}
                <button
                    onClick={reset}
                    className="px-6 py-2 border border-border bg-card text-sm hover:bg-accent transition-colors"
                >
                    Try Again
                </button>
            </div>
        </div>
    )
}
