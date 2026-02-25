export default function Loading() {
    return (
        <div className="min-h-screen bg-background flex items-center justify-center font-mono">
            <div className="text-center space-y-4">
                <div className="inline-flex items-center gap-2 text-muted-foreground text-sm">
                    <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-primary" />
                    </span>
                    LOADING...
                </div>
            </div>
        </div>
    )
}
