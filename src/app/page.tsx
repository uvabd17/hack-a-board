import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Tv } from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen bg-[#050505] text-white font-mono selection:bg-green-500/30 overflow-x-hidden">
      {/* Grid Pattern Background */}
      <div className="fixed inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none" />
      <div className="fixed inset-0 bg-[radial-gradient(circle_800px_at_50%_-100px,#16a34a15,transparent)] pointer-events-none" />

      {/* Header */}
      <header className="relative border-b border-white/5 backdrop-blur-sm z-10">
        <div className="container mx-auto px-6 h-16 flex justify-between items-center">
          <div className="text-lg font-bold tracking-tight lowercase">
            hack&lt;a&gt;board
          </div>
          <Link href="/signin" className="text-xs uppercase tracking-widest text-zinc-500 hover:text-green-500 transition-colors">
            [ ORGANIZER_LOGIN ]
          </Link>
        </div>
      </header>

      <main className="relative z-10">
        {/* Hero Section */}
        <section className="container mx-auto px-6 py-32 flex flex-col items-center text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-green-500/20 bg-green-500/5 text-[10px] text-green-500 font-bold uppercase tracking-widest mb-12">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
            </span>
            LIVE_AND_READY
          </div>

          <h1 className="text-6xl md:text-8xl font-bold tracking-tighter mb-8 leading-[0.9] text-transparent bg-clip-text bg-gradient-to-b from-white to-zinc-500">
            hack&lt;a&gt;board
          </h1>

          <p className="text-lg md:text-xl text-zinc-400 max-w-xl mx-auto mb-12 leading-relaxed font-light">
            Real-time scoring infrastructure for modern hackathons.
            <span className="block text-zinc-600 mt-2">Live leaderboards • Judging • Ceremony Reveals</span>
          </p>

          <div className="flex flex-col sm:flex-row gap-6 items-center">
            <Link href="/dashboard">
              <Button size="lg" className="bg-white hover:bg-zinc-200 text-black font-bold h-14 px-10 text-base rounded-none">
                CREATE NEW HACKATHON
              </Button>
            </Link>
            <Link href="/h/demo/display" className="text-xs uppercase tracking-widest text-zinc-500 hover:text-white transition-all group">
              VIEW_DEMO <span className="inline-block transform group-hover:translate-x-1 transition-transform">-&gt;</span>
            </Link>
          </div>
        </section>

        {/* Feature Highlights */}
        <section className="container mx-auto px-6 py-32 border-t border-white/5">
          <div className="grid md:grid-cols-3 gap-12">
            <div className="space-y-2">
              <div className="text-white font-bold tracking-widest uppercase text-xs">01 // TICKER_DISPLAY</div>
              <p className="text-zinc-500 text-sm leading-relaxed">
                Wall Street ticker-style leaderboards that update in real-time.
                Integrated trend tracking and auto-pagination for large groups.
              </p>
            </div>
            <div className="space-y-2">
              <div className="text-white font-bold tracking-widest uppercase text-xs">02 // SCANNER_JUDGING</div>
              <p className="text-zinc-500 text-sm leading-relaxed">
                Fast-track judging using secure QR codes. Evaluators scan,
                score, and sync data instantly without manual data entry.
              </p>
            </div>
            <div className="space-y-2">
              <div className="text-white font-bold tracking-widest uppercase text-xs">03 // SUSPENSE_CEREMONY</div>
              <p className="text-zinc-500 text-sm leading-relaxed">
                One-click leaderboard freeze. Controlled, dramatic winner
                reveals that are deterministic and refresh-safe.
              </p>
            </div>
          </div>
        </section>

        {/* Workflow */}
        <section className="container mx-auto px-6 py-32 border-t border-white/5 bg-gradient-to-b from-transparent to-white/[0.02]">
          <div className="max-w-4xl mx-auto">
            <div className="flex flex-col md:flex-row gap-12 items-start">
              <div className="flex-1 space-y-6">
                <h2 className="text-2xl font-bold tracking-tight">How it works</h2>
                <div className="space-y-8">
                  <WorkflowStep number="01" title="Create" desc="Set up your hackathon and configure challenge tracks" />
                  <WorkflowStep number="02" title="Register" desc="Teams sign up and receive unique identity tokens" />
                  <WorkflowStep number="03" title="Judge" desc="Evaluators scan and score teams in real-time" />
                  <WorkflowStep number="04" title="Reveal" desc="Freeze the board and run the awards ceremony" />
                </div>
              </div>
              <div className="w-full md:w-72 aspect-square border border-white/10 rounded-lg p-6 flex items-center justify-center bg-black/40 relative group overflow-hidden">
                <div className="absolute inset-0 bg-green-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                <Tv className="w-20 h-20 text-white opacity-20 group-hover:opacity-50 transition-all group-hover:scale-110" />
                <div className="absolute bottom-4 left-4 text-[8px] font-mono text-zinc-600">LIVE_PREVIEW</div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-white/5 py-12">
        <div className="container mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-6 text-zinc-600 text-[10px] uppercase tracking-[0.2em]">
          <p>© 2026 HACKABOARD_SYSTEMS</p>
          <div className="flex gap-8">
            <Link href="#" className="hover:text-white transition-colors">TERMS</Link>
            <Link href="#" className="hover:text-white transition-colors">PRIVACY</Link>
            <Link href="#" className="hover:text-white transition-colors">SECURITY</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}

function WorkflowStep({ number, title, desc }: { number: string, title: string, desc: string }) {
  return (
    <div className="flex gap-6 group">
      <div className="text-xs font-bold text-zinc-700 font-mono pt-1 group-hover:text-white transition-colors">{number}</div>
      <div className="space-y-1">
        <div className="text-sm font-bold text-zinc-300 group-hover:text-white transition-colors uppercase tracking-widest">{title}</div>
        <div className="text-xs text-zinc-500 leading-relaxed">{desc}</div>
      </div>
    </div>
  );
}
