export default function ManagePage() {
    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold text-primary">SYSTEM_STATUS</h1>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="p-6 border border-border bg-card rounded-none">
                    <p className="text-sm text-muted-foreground">TOTAL_TEAMS</p>
                    <p className="text-4xl font-bold mt-2">--</p>
                </div>
                <div className="p-6 border border-border bg-card rounded-none">
                    <p className="text-sm text-muted-foreground">ACTIVE_PROBLEM_STATEMENTS</p>
                    <p className="text-4xl font-bold mt-2">--</p>
                </div>
                <div className="p-6 border border-border bg-card rounded-none">
                    <p className="text-sm text-muted-foreground">JUDGES_DEPLOYED</p>
                    <p className="text-4xl font-bold mt-2">--</p>
                </div>
            </div>

            <div className="p-12 border border-border border-dashed text-center text-muted-foreground">
                <p>Waiting for data stream...</p>
            </div>
        </div>
    )
}
