export default function DashboardLoading() {
    return (
        <div className="min-h-screen bg-background text-foreground font-mono p-6">
            <div className="max-w-4xl mx-auto space-y-6">
                {/* Header skeleton */}
                <div className="flex items-center justify-between">
                    <div className="space-y-2">
                        <div className="h-8 w-48 bg-muted animate-pulse rounded" />
                        <div className="h-4 w-32 bg-muted/50 animate-pulse rounded" />
                    </div>
                    <div className="h-10 w-10 bg-muted animate-pulse rounded" />
                </div>

                {/* Stats skeleton */}
                <div className="grid grid-cols-2 gap-4">
                    {Array.from({ length: 4 }).map((_, i) => (
                        <div key={i} className="h-20 bg-muted/30 animate-pulse rounded border border-border" />
                    ))}
                </div>

                {/* Content skeleton */}
                <div className="h-48 bg-muted/20 animate-pulse rounded border border-border" />
            </div>
        </div>
    )
}
