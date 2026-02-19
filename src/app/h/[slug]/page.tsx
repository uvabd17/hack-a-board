import { prisma } from "@/lib/prisma"
import { notFound } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { formatDate } from "@/lib/utils"

interface Phase {
    id: string;
    name: string;
    startTime: Date;
    order: number;
}

interface ProblemStatement {
    id: string;
    title: string;
    icon: string | null;
    description: string;
}

export default async function PublicHackathonPage({ params }: { params: { slug: string } }) {
    const hackathon = await prisma.hackathon.findUnique({
        where: { slug: params.slug },
        include: {
            problemStatements: {
                where: { isReleased: true },
                orderBy: { order: 'asc' }
            },
            phases: {
                orderBy: { order: 'asc' }
            }
        }
    })

    if (!hackathon) {
        notFound()
    }

    const isRegistrationOpen = hackathon.registrationDeadline ? new Date() < hackathon.registrationDeadline : true

    return (
        <div className="min-h-screen bg-background text-foreground font-mono">
            {/* Hero Section */}
            <section className="container mx-auto px-4 py-20 text-center">
                <div className="space-y-6">
                    <h1 className="text-4xl md:text-6xl font-bold tracking-tighter text-primary animate-in fade-in slide-in-from-bottom-4 duration-1000">
                        {hackathon.name}
                    </h1>
                    <p className="text-xl md:text-2xl text-muted-foreground max-w-2xl mx-auto">
                        {hackathon.tagline}
                    </p>

                    <div className="flex flex-col items-center gap-2 text-sm text-muted-foreground">
                        <p>{formatDate(hackathon.startDate)} - {formatDate(hackathon.endDate)}</p>
                        <p className="uppercase tracking-widest text-xs border border-border px-2 py-1 rounded">
                            {hackathon.mode} • {hackathon.venue || hackathon.onlineLink || "TBA"}
                        </p>
                    </div>

                    <div className="pt-8">
                        {isRegistrationOpen ? (
                            <Button asChild size="lg" className="text-lg px-8 py-6 rounded-none border-2 border-primary bg-primary/10 text-primary hover:bg-primary hover:text-primary-foreground transition-all">
                                <Link href={`/h/${hackathon.slug}/register`}>
                                    &gt; INITIALIZE_REGISTRATION_SEQUENCE
                                </Link>
                            </Button>
                        ) : (
                            <Button disabled size="lg" variant="outline" className="text-lg px-8 py-6 rounded-none opacity-50 cursor-not-allowed">
                                REGISTRATION_CLOSED
                            </Button>
                        )}
                    </div>
                </div>
            </section>

            {/* About Section */}
            {hackathon.description && (
                <section className="container mx-auto px-4 py-16 border-t border-border">
                    <div className="max-w-3xl mx-auto space-y-8">
                        <h2 className="text-2xl font-bold text-primary flex items-center gap-2">
                            <span className="text-muted-foreground">01.</span> MISSION_BRIEFING
                        </h2>
                        <div className="prose prose-invert max-w-none text-muted-foreground leading-relaxed whitespace-pre-wrap">
                            {hackathon.description}
                        </div>
                    </div>
                </section>
            )}

            {/* Schedule Section */}
            {hackathon.phases.length > 0 && (
                <section className="container mx-auto px-4 py-16 border-t border-border">
                    <div className="max-w-3xl mx-auto space-y-8">
                        <h2 className="text-2xl font-bold text-primary flex items-center gap-2">
                            <span className="text-muted-foreground">02.</span> TIMELINE_PROTOCOL
                        </h2>
                        <div className="space-y-4">
                            {hackathon.phases.map((phase: Phase) => (
                                <div key={phase.id} className="flex flex-col md:flex-row md:items-center justify-between p-4 border border-border bg-card/50 hover:bg-card hover:border-primary/50 transition-colors">
                                    <div>
                                        <h3 className="font-bold text-lg text-foreground">{phase.name}</h3>
                                        <p className="text-sm text-muted-foreground">
                                            {formatDate(phase.startTime)}
                                        </p>
                                    </div>
                                    <div className="mt-2 md:mt-0">
                                        <span className="text-xs uppercase tracking-wider text-muted-foreground border border-border px-2 py-1">
                                            PHASE_{phase.order}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>
            )}

            {/* Problem Statements Section (Conditional) */}
            {hackathon.problemStatements.length > 0 && (
                <section className="container mx-auto px-4 py-16 border-t border-border">
                    <div className="max-w-5xl mx-auto space-y-8">
                        <h2 className="text-2xl font-bold text-primary flex items-center gap-2">
                            <span className="text-muted-foreground">03.</span> ACTIVE_DIRECTIVES
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {hackathon.problemStatements.map((ps: ProblemStatement) => (
                                <Card key={ps.id} className="bg-card border-border hover:border-primary transition-all group">
                                    <CardHeader>
                                        <CardTitle className="flex items-center justify-between text-xl">
                                            <span className="text-primary group-hover:underline decoration-wavy underline-offset-4">
                                                {ps.title}
                                            </span>
                                            {ps.icon && <span className="text-2xl" role="img" aria-label="icon">{ps.icon}</span>}
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <p className="text-muted-foreground line-clamp-3">
                                            {ps.description}
                                        </p>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    </div>
                </section>
            )}

            {/* Footer */}
            <footer className="border-t border-border py-8 text-center text-sm text-muted-foreground">
                <p>SYSTEM_ID: HACKABOARD_v1.0 // END_OF_LINE</p>
            </footer>
        </div>
    )
}
