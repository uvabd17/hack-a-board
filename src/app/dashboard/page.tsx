import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { getUserHackathons } from "@/actions/organizer"
import { CreateHackathonButton } from "@/components/create-hackathon-button"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import { Calendar, Users, ArrowRight, Terminal } from "lucide-react"

export default async function DashboardPage() {
    const session = await auth()
    if (!session) redirect("/signin")

    const { hackathons } = await getUserHackathons()

    return (
        <div className="min-h-screen bg-background p-8">
            <header className="flex justify-between items-center mb-12 border-b pb-4">
                <div className="flex items-center gap-3">
                    <div className="bg-primary/10 p-2 rounded">
                        <Terminal className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">Organizer Dashboard</h1>
                        <p className="text-muted-foreground text-sm">Welcome back, {session.user?.name}</p>
                    </div>
                </div>
                <div className="flex gap-4">
                    <CreateHackathonButton />
                    <form action={async () => {
                        "use server"
                        await import("@/auth").then(m => m.signOut({ redirectTo: "/" }))
                    }}>
                        <Button variant="outline">Sign Out</Button>
                    </form>
                </div>
            </header>

            <main className="max-w-5xl mx-auto space-y-8">
                {hackathons.length === 0 ? (
                    <div className="text-center py-20 border-2 border-dashed rounded-lg bg-card/50">
                        <Terminal className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                        <h2 className="text-xl font-bold mb-2">No Hackathons Found</h2>
                        <p className="text-muted-foreground mb-6">Create your first hackathon to get started.</p>
                        <CreateHackathonButton />
                    </div>
                ) : (
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {hackathons.map((h) => (
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
            </main>
        </div>
    )
}
