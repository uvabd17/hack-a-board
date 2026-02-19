import { auth, signIn } from "@/auth"
import { redirect } from "next/navigation"

export default async function SignInPage() {
    const session = await auth()
    if (session) redirect("/dashboard")

    return (
        <div className="min-h-screen bg-[#050505] text-white font-mono flex flex-col items-center justify-center selection:bg-green-500/30 relative overflow-hidden">
            {/* Grid Pattern Background */}
            <div className="fixed inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none" />
            <div className="fixed inset-0 bg-[radial-gradient(circle_600px_at_50%_40%,#16a34a08,transparent)] pointer-events-none" />

            {/* Scanlines */}
            <div className="fixed inset-0 pointer-events-none opacity-[0.03]"
                style={{ backgroundImage: "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255,255,255,0.03) 2px, rgba(255,255,255,0.03) 4px)" }} />

            <div className="relative z-10 w-full max-w-sm px-6">
                {/* Terminal Header */}
                <div className="text-center mb-12">
                    <div className="text-[10px] text-zinc-700 tracking-[0.3em] uppercase mb-6">
                        sys.auth.v1
                    </div>
                    <h1 className="text-4xl font-bold tracking-tighter mb-3 text-transparent bg-clip-text bg-gradient-to-b from-white to-zinc-500">
                        hack&lt;a&gt;board
                    </h1>
                    <p className="text-zinc-600 text-xs tracking-widest uppercase">
                        organizer authentication
                    </p>
                </div>

                {/* Sign-in Card */}
                <div className="border border-white/10 bg-black/60 backdrop-blur-sm">
                    {/* Card Header Bar */}
                    <div className="border-b border-white/5 px-5 py-3 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                            <span className="text-[10px] text-zinc-500 tracking-widest uppercase">secure_login</span>
                        </div>
                        <span className="text-[9px] text-zinc-700 font-mono">TLS_1.3</span>
                    </div>

                    {/* Card Body */}
                    <div className="p-6 space-y-6">
                        <div className="space-y-2">
                            <div className="text-[10px] text-zinc-600 tracking-wider uppercase">
                                &gt; initializing auth handshake...
                            </div>
                            <div className="text-[10px] text-zinc-600 tracking-wider uppercase">
                                &gt; provider: google oauth 2.0
                            </div>
                            <div className="text-[10px] text-green-500/60 tracking-wider uppercase">
                                &gt; ready_
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
                                className="w-full group relative overflow-hidden border border-white/20 hover:border-green-500/50 bg-white/[0.03] hover:bg-green-500/5 transition-all duration-300 px-6 py-4 flex items-center justify-center gap-3 cursor-pointer"
                            >
                                {/* Google Icon */}
                                <svg className="w-4 h-4" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
                                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                                </svg>
                                <span className="text-xs font-bold tracking-widest uppercase text-zinc-300 group-hover:text-white transition-colors">
                                    Continue with Google
                                </span>
                                <div className="absolute inset-0 -translate-x-full group-hover:translate-x-0 bg-gradient-to-r from-transparent via-white/[0.03] to-transparent transition-transform duration-700" />
                            </button>
                        </form>
                    </div>

                    {/* Card Footer */}
                    <div className="border-t border-white/5 px-5 py-3">
                        <p className="text-[9px] text-zinc-700 text-center tracking-wider">
                            AUTHORIZED ORGANIZERS ONLY • DATA ENCRYPTED AT REST
                        </p>
                    </div>
                </div>

                {/* Back Link */}
                <div className="mt-8 text-center">
                    <a href="/" className="text-[10px] text-zinc-600 hover:text-zinc-400 tracking-widest uppercase transition-colors">
                        &lt;- return to homepage
                    </a>
                </div>

                {/* Decorative bottom element */}
                <div className="mt-16 flex justify-center gap-1">
                    {[...Array(5)].map((_, i) => (
                        <div key={i} className="w-1 h-1 rounded-full bg-zinc-800" />
                    ))}
                </div>
            </div>
        </div>
    )
}
