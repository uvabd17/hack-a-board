import { auth, signIn } from "@/auth"
import { redirect } from "next/navigation"
import Link from "next/link"
import { isPrivateBetaAllowed, isPrivateBetaEnabled } from "@/lib/access-control"

export default async function SignInPage() {
    const session = await auth()
    const hasBetaAccess = isPrivateBetaAllowed(session?.user?.email)
    if (session && hasBetaAccess) redirect("/dashboard")

    return (
        <div className="min-h-screen bg-background text-foreground flex flex-col items-center justify-center selection:bg-primary/30 relative overflow-hidden">
            {/* Grid Pattern Background */}
            <div className="fixed inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none" />
            <div className="fixed inset-0 bg-[radial-gradient(circle_600px_at_50%_40%,oklch(0.78_0.15_195_/_0.06),transparent)] pointer-events-none" />

            <div className="relative z-10 w-full max-w-sm px-6">
                {/* Terminal Header */}
                <div className="text-center mb-12">
                    <div className="text-[10px] text-muted-foreground/40 tracking-[0.3em] uppercase mb-6">
                        organizer portal
                    </div>
                    <h1 className="text-3xl md:text-4xl font-black tracking-tighter mb-3 text-transparent bg-clip-text bg-gradient-to-b from-white to-zinc-500">
                        hack&lt;a&gt;board
                    </h1>
                    <p className="text-muted-foreground text-xs tracking-widest uppercase">
                        sign in to manage your hackathons
                    </p>
                    {session && !hasBetaAccess && isPrivateBetaEnabled() && (
                        <p className="text-destructive text-[11px] mt-4 uppercase tracking-wider">
                            Access is restricted. Ask admin to allow your email.
                        </p>
                    )}
                </div>

                {/* Sign-in Card */}
                <div className="border-2 border-border bg-card/60 backdrop-blur-sm">
                    {/* Card Header Bar */}
                    <div className="border-b border-border px-5 py-3 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                            <span className="text-[10px] text-muted-foreground tracking-widest uppercase">sign in</span>
                        </div>
                        <span className="text-[9px] text-muted-foreground/40 font-mono">secured</span>
                    </div>

                    {/* Card Body */}
                    <div className="p-6 space-y-6">
                        <div className="space-y-2 font-mono">
                            <div className="text-[10px] text-muted-foreground tracking-wider uppercase">
                                &gt; connecting to hackaboard...
                            </div>
                            <div className="text-[10px] text-muted-foreground tracking-wider uppercase">
                                &gt; sign in with your google account
                            </div>
                            <div className="text-[10px] text-primary/60 tracking-wider uppercase">
                                &gt; ready to hack_
                            </div>
                        </div>

                        <form
                            action={async () => {
                                "use server"
                                await signIn("google", { redirectTo: "/dashboard" })
                            }}
                        >
                            <button
                                type="submit"
                                className="w-full group relative overflow-hidden border-2 border-border hover:border-primary/50 bg-card hover:bg-primary/5 transition-all duration-300 px-6 py-4 flex items-center justify-center gap-3 cursor-pointer"
                            >
                                {/* Google Icon */}
                                <svg className="w-4 h-4" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
                                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                                </svg>
                                <span className="text-xs font-bold tracking-widest uppercase text-foreground/70 group-hover:text-foreground transition-colors">
                                    Continue with Google
                                </span>
                            </button>
                        </form>

                        {/* Dev-only test login */}
                        {process.env.NODE_ENV === "development" && (
                            <form
                                action={async () => {
                                    "use server"
                                    await signIn("credentials", { email: "organizer@test.com", redirectTo: "/dashboard" })
                                }}
                            >
                                <button
                                    type="submit"
                                    className="w-full border-2 border-amber-500/30 bg-amber-500/5 hover:bg-amber-500/10 transition-all duration-300 px-6 py-3 flex items-center justify-center gap-2 cursor-pointer"
                                >
                                    <span className="text-[10px] font-bold tracking-widest uppercase text-amber-400">
                                        DEV: Login as Test Organizer
                                    </span>
                                </button>
                            </form>
                        )}
                    </div>

                    {/* Card Footer */}
                    <div className="border-t border-border px-5 py-3">
                        <p className="text-[9px] text-muted-foreground/40 text-center tracking-wider">
                            ORGANIZERS & MENTORS
                        </p>
                    </div>
                </div>

                {/* Back Link */}
                <div className="mt-8 text-center">
                    <Link href="/" className="text-[10px] text-muted-foreground hover:text-foreground tracking-widest uppercase transition-colors">
                        &lt;- return to homepage
                    </Link>
                </div>

                {/* Decorative bottom element */}
                <div className="mt-16 flex justify-center gap-1">
                    {[...Array(5)].map((_, i) => (
                        <div key={i} className="w-1 h-1 rounded-full bg-border" />
                    ))}
                </div>
            </div>
        </div>
    )
}
