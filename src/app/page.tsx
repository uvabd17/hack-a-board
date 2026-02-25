import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Activity, QrCode, Trophy } from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen bg-[#050505] text-white font-mono selection:bg-green-500/30 overflow-x-hidden">
      {/* Custom Styles for Leaderboard Animation */}
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes scrollTicker {
          0% { transform: translateY(0); }
          100% { transform: translateY(-50%); }
        }
        .animate-ticker {
          animation: scrollTicker 15s linear infinite;
        }
      `}} />

      {/* Grid Pattern Background */}
      <div className="fixed inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none" />
      <div className="fixed inset-0 bg-[radial-gradient(circle_800px_at_50%_-100px,#16a34a15,transparent)] pointer-events-none" />

      {/* Header */}
      <header className="relative border-b border-white/5 backdrop-blur-sm z-10">
        <div className="container mx-auto px-6 h-16 flex justify-between items-center">
          <div className="text-lg font-bold tracking-tight lowercase">
            hack&lt;a&gt;board
          </div>
          <Link href="/signin" className="text-xs uppercase tracking-widest text-zinc-500 hover:text-green-400 transition-colors">
            [ ORGANIZER LOGIN ]
          </Link>
        </div>
      </header>

      <main className="relative z-10">
        {/* Hero Section */}
        <section className="container mx-auto px-6 py-32 flex flex-col items-center text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-green-500/30 bg-green-500/10 text-[10px] text-green-400 font-bold uppercase tracking-widest mb-12 shadow-[0_0_15px_rgba(34,197,94,0.15)] ring-1 ring-green-500/20 duration-300">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.8)]"></span>
            </span>
            LIVE AND READY
          </div>

          <h1 className="text-6xl md:text-8xl font-bold tracking-tighter mb-8 leading-[0.9] text-transparent bg-clip-text bg-gradient-to-b from-white to-zinc-500">
            hack&lt;a&gt;board
          </h1>

          <p className="text-lg md:text-xl text-zinc-400 max-w-xl mx-auto mb-12 leading-relaxed font-light">
            Real-time scoring infrastructure for modern hackathons.
            <span className="block text-zinc-500 mt-3 text-sm">Live leaderboards • Judging • Ceremony Reveals</span>
          </p>

          <div className="flex flex-col sm:flex-row gap-6 items-center">
            <Link href="/dashboard">
              <Button size="lg" className="bg-white hover:bg-green-400 hover:text-black text-black font-bold h-14 px-10 text-base rounded-none transition-all duration-300 hover:shadow-[0_0_20px_rgba(74,222,128,0.3)] border border-transparent hover:border-green-300">
                CREATE NEW HACKATHON
              </Button>
            </Link>
            <Link href="/h/demo/display" className="text-xs uppercase tracking-widest text-zinc-500 hover:text-white transition-all group flex items-center gap-2">
              VIEW DEMO <span className="transform group-hover:translate-x-1 transition-transform">-&gt;</span>
            </Link>
          </div>
        </section>

        {/* Feature Highlights */}
        <section className="container mx-auto px-6 py-32 border-t border-white/5 relative">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-3xl h-[1px] bg-gradient-to-r from-transparent via-green-500/20 to-transparent" />
          <div className="grid md:grid-cols-3 gap-8">
            <div className="space-y-4 p-6 border border-white/5 bg-white/[0.01] hover:bg-green-500/5 hover:border-green-500/20 transition-all duration-500 group rounded-sm relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-100 group-hover:text-green-500 transition-all duration-500 transform group-hover:scale-110">
                <Activity className="w-12 h-12" />
              </div>
              <div className="text-green-500 font-bold tracking-widest uppercase text-xs z-10 relative">01 // TICKER DISPLAY</div>
              <p className="text-zinc-400 text-sm leading-relaxed z-10 relative group-hover:text-zinc-300 transition-colors">
                Wall Street ticker-style leaderboards that update in real-time.
                Integrated trend tracking and auto-pagination for large groups.
              </p>
            </div>
            <div className="space-y-4 p-6 border border-white/5 bg-white/[0.01] hover:bg-green-500/5 hover:border-green-500/20 transition-all duration-500 group rounded-sm relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-100 group-hover:text-green-500 transition-all duration-500 transform group-hover:scale-110">
                <QrCode className="w-12 h-12" />
              </div>
              <div className="text-green-500 font-bold tracking-widest uppercase text-xs z-10 relative">02 // SCANNER JUDGING</div>
              <p className="text-zinc-400 text-sm leading-relaxed z-10 relative group-hover:text-zinc-300 transition-colors">
                Fast-track judging using secure QR codes. Evaluators scan,
                score, and sync data instantly without manual data entry.
              </p>
            </div>
            <div className="space-y-4 p-6 border border-white/5 bg-white/[0.01] hover:bg-green-500/5 hover:border-green-500/20 transition-all duration-500 group rounded-sm relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-100 group-hover:text-green-500 transition-all duration-500 transform group-hover:scale-110">
                <Trophy className="w-12 h-12" />
              </div>
              <div className="text-green-500 font-bold tracking-widest uppercase text-xs z-10 relative">03 // SUSPENSE CEREMONY</div>
              <p className="text-zinc-400 text-sm leading-relaxed z-10 relative group-hover:text-zinc-300 transition-colors">
                One-click leaderboard freeze. Controlled, dramatic winner
                reveals that are deterministic and refresh-safe.
              </p>
            </div>
          </div>
        </section>

        {/* Workflow */}
        <section className="container mx-auto px-6 py-32 border-t border-white/5 bg-gradient-to-b from-transparent to-white/[0.02]">
          <div className="max-w-5xl mx-auto">
            <div className="flex flex-col md:flex-row gap-16 items-start">
              <div className="flex-1 space-y-6 relative">
                {/* Connecting Line */}
                <div className="absolute left-[9px] top-8 bottom-4 w-px bg-gradient-to-b from-green-500/50 via-green-500/20 to-transparent" />
                
                <h2 className="text-2xl font-bold tracking-tight text-white mb-10 pl-8">How it works</h2>
                <div className="space-y-8">
                  <WorkflowStep number="01" title="Create" desc="Set up your hackathon and configure challenge tracks" />
                  <WorkflowStep number="02" title="Register" desc="Teams sign up and receive unique identity tokens" />
                  <WorkflowStep number="03" title="Judge" desc="Evaluators scan and score teams in real-time" />
                  <WorkflowStep number="04" title="Reveal" desc="Freeze the board and run the awards ceremony" />
                </div>
              </div>
              
              {/* Live Preview Display block */}
              <div className="w-full md:w-[400px] h-[320px] border border-white/10 rounded-sm p-1 bg-black/80 relative overflow-hidden flex flex-col shadow-2xl">
                {/* Window Header */}
                <div className="h-6 w-full bg-white/5 border-b border-white/10 flex items-center px-3 gap-1.5 shrink-0 z-20">
                  <div className="w-2 h-2 rounded-full bg-red-500/50" />
                  <div className="w-2 h-2 rounded-full bg-yellow-500/50" />
                  <div className="w-2 h-2 rounded-full bg-green-500/50" />
                  <div className="ml-2 text-[8px] text-zinc-500 tracking-widest uppercase">LIVE PREVIEW</div>
                </div>
                {/* Ticker Content container */}
                <div className="flex-1 relative overflow-hidden w-full bg-[#0a0a0a]">
                  {/* Fade overlays */}
                  <div className="absolute top-0 left-0 right-0 h-10 bg-gradient-to-b from-[#0a0a0a] to-transparent z-10 pointer-events-none" />
                  <div className="absolute bottom-0 left-0 right-0 h-10 bg-gradient-to-t from-[#0a0a0a] to-transparent z-10 pointer-events-none" />
                  
                  {/* Scrolling List */}
                  <div className="absolute top-0 left-0 right-0 animate-ticker pt-4">
                    {/* Repeated twice for seamless loop */}
                    {[1, 2].map((loopIndex) => (
                      <div key={loopIndex} className="flex flex-col gap-2 px-4 pb-2">
                        <TickerRow rank="1" team="TEAM ALPHA" score="985" />
                        <TickerRow rank="2" team="BYTE ME" score="942" />
                        <TickerRow rank="3" team="NULL POINTER" score="910" />
                        <TickerRow rank="4" team="DEBUG THUGS" score="885" />
                        <TickerRow rank="5" team="CTRL ALT DEFEAT" score="860" />
                        <TickerRow rank="6" team="HACKERMANS" score="845" />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-white/5 py-12">
        <div className="container mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-6 text-zinc-600 text-[10px] uppercase tracking-[0.2em]">
          <p>© 2026 HACKABOARD</p>
          <div className="flex gap-8">
            <Link href="/terms" className="hover:text-white transition-colors">TERMS</Link>
            <Link href="/privacy" className="hover:text-white transition-colors">PRIVACY</Link>
            <Link href="/security" className="hover:text-white transition-colors">SECURITY</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}

function WorkflowStep({ number, title, desc }: { number: string, title: string, desc: string }) {
  return (
    <div className="flex gap-6 group relative pl-8">
      {/* Node on the connecting line */}
      <div className="absolute left-[5px] top-1.5 w-2 h-2 rounded-full bg-zinc-800 border border-green-500/50 group-hover:bg-green-500 group-hover:shadow-[0_0_10px_rgba(34,197,94,0.5)] transition-all duration-300" />
      
      <div className="text-xs font-bold text-green-500/50 font-mono pt-0.5 group-hover:text-green-400 transition-colors uppercase">[{number}]</div>
      <div className="space-y-1.5">
        <div className="text-sm font-bold text-zinc-300 group-hover:text-white transition-colors uppercase tracking-widest">{title}</div>
        <div className="text-xs text-zinc-500 leading-relaxed max-w-sm group-hover:text-zinc-400 transition-colors">{desc}</div>
      </div>
    </div>
  );
}

function TickerRow({ rank, team, score }: { rank: string, team: string, score: string }) {
  return (
    <div className="flex items-center justify-between p-2 rounded bg-white/[0.02] border border-white/[0.02] font-mono text-[10px] tabular-nums">
      <div className="flex items-center gap-3">
        <span className="text-zinc-500 w-4 text-right">#{rank}</span>
        <span className="text-green-400 font-bold tracking-wider">{team}</span>
      </div>
      <span className="text-white font-bold">{score} pts</span>
    </div>
  );
}
