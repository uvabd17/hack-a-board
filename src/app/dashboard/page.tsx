import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { getUserHackathons, restoreHackathon } from "@/actions/organizer"
import { CreateHackathonButton } from "@/components/create-hackathon-button"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import { Calendar, ArrowRight, Terminal, ArchiveRestore } from "lucide-react"
import { canCreateHackathon, isPrivateBetaEnabled } from "@/lib/access-control"
import { BrandFooter } from "@/components/ui/brand"

export default async function DashboardPage() {
    const session = await auth()
    if (!session) redirect("/signin")
    const canCreate = canCreateHackathon(session.user)

    const { activeHackathons, archivedHackathons } = await getUserHackathons()

    return (
        <div className="min-h-screen bg-background p-4 md:p-8">
            <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8 md:mb-12 border-b pb-4">
                <div className="flex items-center gap-3 min-w-0">
                    <div className="bg-primary/10 p-2 rounded flex-shrink-0">
                        <Terminal className="w-6 h-6 text-primary" />
                    </div>
                    <div className="min-w-0">
                        <h1 className="text-2xl font-bold tracking-tight truncate">Organizer Dashboard</h1>
                        <p className="text-muted-foreground text-sm truncate">Welcome back, {session.user?.name}</p>
                    </div>
                </div>
                <div className="flex gap-2 sm:gap-4 flex-shrink-0">
                    {canCreate && <CreateHackathonButton />}
                    <form action={async () => {
                        "use server"
                        await import("@/auth").then(m => m.signOut({ redirectTo: "/" }))
                    }}>
                        <Button variant="outline">Sign Out</Button>
                    </form>
                </div>
            </header>

            <main className="max-w-5xl mx-auto space-y-8">
                {!canCreate && isPrivateBetaEnabled() && (
                    <div className="rounded-md border border-yellow-500/30 bg-yellow-500/10 p-3 text-xs text-yellow-200">
                        Limited collaborator access enabled. Ask an owner to create events, or request allowlist access.
                    </div>
                )}
                {activeHackathons.length === 0 ? (
                    <div className="text-center py-20 border-2 border-dashed bg-card/50">
                        <Terminal className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                        <h2 className="text-xl font-bold mb-2">No Active Hackathons</h2>
                        <p className="text-muted-foreground mb-6">
                            {canCreate
                                ? "Create a new hackathon or restore one from archives."
                                : "Ask an owner to add you as an organizer for an event."}
                        </p>
                        {canCreate && <CreateHackathonButton />}
                    </div>
                ) : (
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {activeHackathons.map((h) => (
                            <Link key={h.id} href={`/h/${h.slug}/manage`} className="block group">
                                <Card className="h-full transition-all hover:border-primary/50 hover:bg-primary/5">
                                    <CardHeader>
                                        <div className="flex justify-between items-start mb-2">
                                            <Badge variant={h.status === 'live' ? 'default' : 'secondary'} className="uppercase text-xs">
                                                {h.status}
                                            </Badge>
                                            <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-transform group-hover:translate-x-1" />
                                        </div>
                                        <CardTitle className="truncate">{h.name}</CardTitle>
                                        <CardDescription className="font-mono text-xs">{h.slug}</CardDescription>
                                    </CardHeader>
                                    <CardContent className="space-y-2 text-sm text-muted-foreground">
                                        <div className="flex items-center gap-2">
                                            <Calendar className="w-4 h-4" />
                                            <span>{new Date(h.startDate).toLocaleDateString()}</span>
                                        </div>
                                    </CardContent>
                                </Card>
                            </Link>
                        ))}
                    </div>
                )}

                {archivedHackathons.length > 0 && (
                    <section className="space-y-4 border-t border-border pt-6">
                        <div className="flex items-center gap-2">
                            <ArchiveRestore className="w-4 h-4 text-muted-foreground" />
                            <h2 className="text-sm font-bold uppercase tracking-widest text-muted-foreground">
                                Archived Events
                            </h2>
                        </div>
                        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {archivedHackathons.map((h) => (
                                <Card key={h.id} className="h-full border-dashed opacity-90">
                                    <CardHeader>
                                        <div className="flex justify-between items-start mb-2">
                                            <Badge variant="secondary" className="uppercase text-xs">
                                                archived
                                            </Badge>
                                            <span className="text-xs text-muted-foreground">
                                                {h.archivedAt ? new Date(h.archivedAt).toLocaleDateString() : "unknown"}
                                            </span>
                                        </div>
                                        <CardTitle className="truncate">{h.name}</CardTitle>
                                        <CardDescription className="font-mono text-xs">{h.slug}</CardDescription>
                                    </CardHeader>
                                    <CardContent className="space-y-3">
                                        <form
                                            action={async () => {
                                                "use server"
                                                await restoreHackathon(h.id)
                                            }}
                                        >
                                            <Button type="submit" size="sm" className="w-full uppercase text-xs">
                                                Restore
                                            </Button>
                                        </form>
                                        <Button asChild size="sm" variant="outline" className="w-full uppercase text-xs">
                                            <Link href={`/h/${h.slug}/manage`}>Manage</Link>
                                        </Button>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    </section>
                )}
            </main>
            <BrandFooter />
        </div>
    )
}
