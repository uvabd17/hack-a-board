import Link from "next/link"
import { auth } from "@/auth"

const CONTACT_EMAIL = "hello@hackaboard.app"

/**
 * Request-access page — shown to users who signed in successfully but
 * aren't on the private-beta allowlist. Replaces the previous "tiny
 * inline notice on /signin" UX which read as a broken error page to
 * new users.
 */
export default async function AccessPage() {
    const session = await auth()
    const userEmail = session?.user?.email ?? null
    const subject = encodeURIComponent("hackaboard access request")
    const body = encodeURIComponent(
        userEmail
            ? `Hi,\n\nI'd like access to hackaboard for my hackathon.\n\nMy email: ${userEmail}\nHackathon name: \nDate(s): \nExpected team count: \n\nThanks!`
            : `Hi,\n\nI'd like access to hackaboard for my hackathon.\n\nMy email: \nHackathon name: \nDate(s): \nExpected team count: \n\nThanks!`,
    )
    const mailto = `mailto:${CONTACT_EMAIL}?subject=${subject}&body=${body}`

    return (
        <div className="min-h-screen bg-background text-foreground flex flex-col items-center justify-center selection:bg-primary/30 relative overflow-hidden">
            {/* Grid + radial background, matches /signin */}
            <div className="fixed inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none" />
            <div className="fixed inset-0 bg-[radial-gradient(circle_600px_at_50%_40%,oklch(0.78_0.15_195_/_0.06),transparent)] pointer-events-none" />

            <div className="relative z-10 w-full max-w-sm px-6">
                {/* Header */}
                <div className="text-center mb-12">
                    <div className="text-[10px] text-muted-foreground/40 tracking-[0.3em] uppercase mb-6">
                        private beta
                    </div>
                    <h1 className="text-3xl md:text-4xl font-black tracking-tighter mb-3 lowercase">
                        <span className="text-foreground">hack</span><span className="text-primary">a</span><span className="text-foreground">board</span>
                    </h1>
                    <p className="text-muted-foreground text-xs tracking-widest uppercase">
                        we&apos;re onboarding organizers manually
                    </p>
                </div>

                {/* Card */}
                <div className="border-2 border-border bg-card/60 backdrop-blur-sm rounded-xl">
                    <div className="border-b border-border px-5 py-3 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-yellow-500 animate-pulse" />
                            <span className="text-[10px] text-muted-foreground tracking-widest uppercase">access pending</span>
                        </div>
                        <span className="text-[9px] text-muted-foreground/40 font-mono">invite-only</span>
                    </div>

                    <div className="p-6 space-y-5">
                        <p className="text-sm text-foreground/85 leading-relaxed">
                            hackaboard is in private beta while we polish the organizer flow.
                            We&apos;re adding teams one hackathon at a time so we can support
                            you properly during your event.
                        </p>

                        {userEmail && (
                            <div className="rounded-md border border-border bg-background/40 p-3">
                                <p className="text-[10px] text-muted-foreground tracking-wider uppercase mb-1">
                                    signed in as
                                </p>
                                <p className="text-sm font-mono text-foreground/90 truncate">
                                    {userEmail}
                                </p>
                            </div>
                        )}

                        <div className="space-y-2 font-mono">
                            <div className="text-[10px] text-muted-foreground tracking-wider uppercase">
                                &gt; tell us about your hackathon
                            </div>
                            <div className="text-[10px] text-muted-foreground tracking-wider uppercase">
                                &gt; we&apos;ll respond within 24 hours
                            </div>
                            <div className="text-[10px] text-primary/60 tracking-wider uppercase">
                                &gt; ready when you are_
                            </div>
                        </div>

                        <a
                            href={mailto}
                            className="block w-full text-center rounded-xl border-2 border-border border-b-[4px] bg-card hover:bg-primary/5 hover:border-primary/40 active:border-b-2 active:mt-[2px] transition-all duration-100 px-6 py-5 font-black text-sm tracking-wide text-foreground/85 hover:text-foreground"
                        >
                            Request access &nbsp;→
                        </a>

                        <p className="text-[10px] text-muted-foreground text-center tracking-wider">
                            or email{" "}
                            <a
                                href={`mailto:${CONTACT_EMAIL}`}
                                className="text-primary/80 hover:text-primary underline-offset-2 hover:underline"
                            >
                                {CONTACT_EMAIL}
                            </a>
                            {" "}directly
                        </p>
                    </div>

                    <div className="border-t border-border px-5 py-3">
                        <p className="text-[9px] text-muted-foreground/40 text-center tracking-wider">
                            ORGANIZERS & MENTORS
                        </p>
                    </div>
                </div>

                {/* Back */}
                <div className="mt-8 text-center">
                    <Link href="/" className="text-[10px] text-muted-foreground hover:text-foreground tracking-widest uppercase transition-colors">
                        &lt;- return to homepage
                    </Link>
                </div>
            </div>
        </div>
    )
}
