export default function ManageLoading() {
    return (
        <div className="flex min-h-screen bg-background font-mono">
            {/* Sidebar skeleton */}
            <aside className="w-64 border-r border-border bg-card/50 hidden md:block">
                <div className="p-6 border-b border-border">
                    <div className="h-6 w-40 bg-muted animate-pulse rounded" />
                    <div className="h-3 w-24 bg-muted animate-pulse rounded mt-2" />
                </div>
                <nav className="p-4 space-y-2">
                    {Array.from({ length: 7 }).map((_, i) => (
                        <div key={i} className="h-9 bg-muted/50 animate-pulse rounded" />
                    ))}
                </nav>
            </aside>

            {/* Content skeleton */}
            <main className="flex-1 p-8 space-y-6">
                <div className="h-8 w-60 bg-muted animate-pulse rounded" />
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {Array.from({ length: 4 }).map((_, i) => (
                        <div key={i} className="h-24 bg-muted/30 animate-pulse rounded border border-border" />
                    ))}
                </div>
                <div className="h-32 bg-muted/20 animate-pulse rounded border border-border" />
            </main>
        </div>
    )
}
