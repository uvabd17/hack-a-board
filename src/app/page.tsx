import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen bg-background text-foreground selection:bg-primary/30 overflow-x-hidden">
      {/* Subtle grid background */}
      <div className="fixed inset-0 bg-[linear-gradient(to_right,#80808008_1px,transparent_1px),linear-gradient(to_bottom,#80808008_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none" />

      {/* Header */}
      <header className="relative border-b border-border z-10">
        <div className="max-w-5xl mx-auto px-6 h-14 flex justify-between items-center">
          <div className="text-base font-bold tracking-tight lowercase">
            hack&lt;a&gt;board
          </div>
          <Link href="/signin">
            <Button variant="outline" size="sm" className="font-black uppercase tracking-wider">
              Organizer Login
            </Button>
          </Link>
        </div>
      </header>

      <main className="relative z-10">
        {/* Hero */}
        <section className="max-w-3xl mx-auto px-6 pt-24 pb-12 text-center">
          <h1 className="text-4xl md:text-6xl font-black tracking-tighter leading-[0.95] mb-6">
            Create your<br />
            <span className="text-primary">hackaboard.</span>
          </h1>

          <p className="text-base md:text-lg text-muted-foreground max-w-md mx-auto mb-10 leading-relaxed">
            The live scoring experience your hackathon deserves.
            Set up in minutes, runs on any screen.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 items-center justify-center">
            <Link href="/dashboard">
              <Button variant="brutal" size="xl" className="font-black">
                Get started for free
                <ArrowRight className="w-5 h-5 ml-1" />
              </Button>
            </Link>
            <Link href="/h/demo/display" className="text-sm text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1.5">
              See it live <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
        </section>

        {/* Venue Mockup — the hackaboard projected on screen */}
        <section className="max-w-5xl mx-auto px-6 pb-20">
          <div className="relative">
            {/* Ambient glow behind the "screen" */}
            <div className="absolute inset-x-0 top-8 bottom-0 bg-[radial-gradient(ellipse_at_50%_0%,oklch(0.78_0.15_195_/_0.08),transparent_70%)] pointer-events-none" />

            {/* The projected screen */}
            <div className="relative mx-auto max-w-4xl">
              {/* Screen bezel */}
              <div className="border-2 border-zinc-700 bg-[#0a0a0f] shadow-[0_0_80px_oklch(0.78_0.15_195_/_0.06)] overflow-hidden">
                {/* Ticker bar */}
                <div className="h-6 bg-zinc-900/50 border-b border-zinc-800 flex items-center px-3">
                  <span className="text-[7px] text-zinc-600 uppercase tracking-widest font-mono">LIVE FEED</span>
                  <span className="ml-auto text-[7px] text-emerald-400 font-mono">TEAM ALPHA submitted Round 2 (+2.4)</span>
                </div>

                {/* Timer bar */}
                <div className="border-b border-zinc-800 py-2.5 px-4 grid grid-cols-2 gap-4">
                  <div className="text-center">
                    <div className="text-[7px] text-cyan-500/50 uppercase tracking-[0.2em] font-bold font-mono">Hacking ends in</div>
                    <div className="text-lg md:text-2xl font-mono font-bold tabular-nums text-cyan-400">02:34:17</div>
                  </div>
                  <div className="text-center">
                    <div className="text-[7px] text-cyan-500/50 uppercase tracking-[0.2em] font-bold font-mono">Round 2 closes in</div>
                    <div className="text-lg md:text-2xl font-mono font-bold tabular-nums text-amber-400">00:18:42</div>
                  </div>
                </div>

                {/* Header */}
                <div className="px-4 py-2 border-b border-zinc-800 flex justify-between items-center">
                  <div>
                    <div className="text-sm md:text-base font-black tracking-tighter uppercase text-zinc-200 font-mono">TECHFEST 2026</div>
                    <div className="flex gap-2 mt-0.5">
                      <span className="text-[7px] text-cyan-400 border border-cyan-500/30 px-1.5 py-0.5 font-mono font-bold uppercase">ALL TEAMS</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="relative flex h-1.5 w-1.5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-500 opacity-75" />
                      <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-cyan-500" />
                    </span>
                    <span className="text-[8px] text-zinc-400 font-bold tracking-widest uppercase font-mono">LIVE</span>
                  </div>
                </div>

                {/* Leaderboard rows — 2 columns on desktop */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 px-4 py-2">
                  <div className="flex flex-col font-mono text-[10px]">
                    <div className="grid items-center h-5 text-[8px] text-zinc-500 uppercase tracking-[0.15em] font-bold border-b border-zinc-800 mb-0.5"
                      style={{ gridTemplateColumns: "28px 1fr 50px 36px" }}>
                      <span>#</span><span>TEAM</span><span className="text-right">SCORE</span><span className="text-right">&Delta;</span>
                    </div>
                    <PreviewRow rank="01" team="TEAM ALPHA" score="985.4" trend="up" change={3} medal="gold" />
                    <PreviewRow rank="02" team="BYTE ME" score="963.1" trend="up" change={1} medal="silver" />
                    <PreviewRow rank="03" team="NULL POINTER" score="941.7" trend="same" change={0} medal="bronze" />
                    <PreviewRow rank="04" team="DEBUG THUGS" score="928.2" trend="down" change={2} />
                    <PreviewRow rank="05" team="CTRL ALT DEFEAT" score="910.6" trend="same" change={0} />
                    <PreviewRow rank="06" team="HACKERMANS" score="896.3" trend="up" change={1} />
                  </div>
                  <div className="hidden md:flex flex-col font-mono text-[10px]">
                    <div className="grid items-center h-5 text-[8px] text-zinc-500 uppercase tracking-[0.15em] font-bold border-b border-zinc-800 mb-0.5"
                      style={{ gridTemplateColumns: "28px 1fr 50px 36px" }}>
                      <span>#</span><span>TEAM</span><span className="text-right">SCORE</span><span className="text-right">&Delta;</span>
                    </div>
                    <PreviewRow rank="07" team="CODE RED" score="885.2" trend="same" change={0} />
                    <PreviewRow rank="08" team="RUNTIME TERRORS" score="872.5" trend="down" change={1} />
                    <PreviewRow rank="09" team="STACK SMASH" score="861.9" trend="up" change={2} />
                    <PreviewRow rank="10" team="BINARY BEASTS" score="853.4" trend="same" change={0} />
                    <PreviewRow rank="11" team="DEEP STACK" score="844.8" trend="down" change={1} />
                    <PreviewRow rank="12" team="404 FOUND" score="835.9" trend="up" change={3} />
                  </div>
                </div>

                {/* Footer */}
                <div className="h-5 flex items-center justify-between px-4 border-t border-zinc-800 text-[7px] text-zinc-700 uppercase tracking-widest font-mono">
                  <span>TECHFEST-2026 · MODE: GLOBAL</span>
                  <span>TEAMS: 24 · hack&lt;a&gt;board</span>
                </div>
              </div>

              {/* Screen stand / base */}
              <div className="mx-auto w-24 h-3 bg-zinc-800 rounded-b" />
              <div className="mx-auto w-40 h-1.5 bg-zinc-800/60 rounded-b" />
            </div>

            {/* Caption */}
            <p className="text-center text-xs text-muted-foreground mt-6">
              Projected on a wall. Updated in real-time. Readable from across the room.
            </p>
          </div>
        </section>

        {/* What a hackaboard gives you — grounded, no claims */}
        <section className="max-w-4xl mx-auto px-6 py-16 border-t border-border">
          <h2 className="text-xl md:text-2xl font-bold tracking-tight text-center mb-10">
            What your hackathon gets
          </h2>
          <div className="grid md:grid-cols-3 gap-5">
            <FeatureCard
              title="Live leaderboard"
              desc="Scores update in real-time on any projected screen. Trend arrows, auto-pagination, and countdowns that keep the room engaged."
            />
            <FeatureCard
              title="QR judging"
              desc="Judges scan a team's QR code and score from their phone. No spreadsheets, no forms, no waiting."
            />
            <FeatureCard
              title="Ceremony reveals"
              desc="Freeze the board when judging ends. Reveal winners one by one — rank 5, 4, 3, 2, 1. The room goes quiet."
            />
          </div>
        </section>

        {/* Both: aspirational + grounded */}
        <section className="max-w-3xl mx-auto px-6 py-16 border-t border-border">
          <div className="grid sm:grid-cols-2 gap-8">
            <div className="space-y-3">
              <h3 className="text-sm font-bold uppercase tracking-wider text-primary">For organizers</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex gap-2"><span className="text-primary">-</span> Set up in under 5 minutes</li>
                <li className="flex gap-2"><span className="text-primary">-</span> Manage teams, judges, and rounds from one panel</li>
                <li className="flex gap-2"><span className="text-primary">-</span> Control the leaderboard and ceremony from your phone</li>
                <li className="flex gap-2"><span className="text-primary">-</span> Works on any device with a browser</li>
              </ul>
            </div>
            <div className="space-y-3">
              <h3 className="text-sm font-bold uppercase tracking-wider text-primary">For participants</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex gap-2"><span className="text-primary">-</span> QR code passport for your team</li>
                <li className="flex gap-2"><span className="text-primary">-</span> See your rank and judging progress live</li>
                <li className="flex gap-2"><span className="text-primary">-</span> Countdown timers for every deadline</li>
                <li className="flex gap-2"><span className="text-primary">-</span> Submit links when rounds close</li>
              </ul>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="max-w-3xl mx-auto px-6 py-20 text-center border-t border-border">
          <h2 className="text-2xl md:text-3xl font-bold tracking-tight mb-3">
            Your hackathon deserves a hackaboard.
          </h2>
          <p className="text-muted-foreground text-sm mb-8">
            Free to use. Takes a few minutes to set up.
          </p>
          <Link href="/dashboard">
            <Button variant="brutal" size="xl" className="font-black">
              Create your hackaboard <ArrowRight className="w-5 h-5 ml-1" />
            </Button>
          </Link>
        </section>
      </main>

      <footer className="border-t border-border py-8">
        <div className="max-w-5xl mx-auto px-6 flex flex-col sm:flex-row justify-between items-center gap-4 text-muted-foreground text-[10px] uppercase tracking-[0.15em]">
          <p>hackaboard</p>
          <div className="flex gap-6">
            <Link href="/terms" className="hover:text-foreground transition-colors">Terms</Link>
            <Link href="/privacy" className="hover:text-foreground transition-colors">Privacy</Link>
            <Link href="/security" className="hover:text-foreground transition-colors">Security</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}

function FeatureCard({ title, desc }: { title: string; desc: string }) {
  return (
    <div className="p-5 border-2 border-border bg-card hover:border-primary/30 hover:shadow-[3px_3px_0_var(--brutal-shadow)] hover:-translate-y-0.5 transition-all duration-200">
      <h3 className="text-sm font-bold mb-2">{title}</h3>
      <p className="text-muted-foreground text-sm leading-relaxed">{desc}</p>
    </div>
  );
}

function PreviewRow({ rank, team, score, trend, change, medal }: {
  rank: string; team: string; score: string;
  trend: "up" | "down" | "same"; change: number; medal?: string
}) {
  const borderColor = medal === "gold" ? "border-l-amber-400" : medal === "silver" ? "border-l-zinc-400" : medal === "bronze" ? "border-l-amber-600" : "border-l-transparent";
  const rankColor = medal === "gold" ? "text-amber-400" : medal === "silver" ? "text-zinc-400" : medal === "bronze" ? "text-amber-600" : "text-zinc-500";
  const isEven = parseInt(rank) % 2 === 0;

  return (
    <div className={`grid items-center h-7 px-2 border-l-[3px] ${borderColor} ${isEven ? "bg-white/[0.02]" : ""}`}
      style={{ gridTemplateColumns: "28px 1fr 50px 36px" }}
    >
      <span className={`font-black text-[10px] ${rankColor}`}>{rank}</span>
      <span className="font-bold text-zinc-200 truncate text-[10px]">{team}</span>
      <span className="text-right font-black text-cyan-400 tabular-nums text-[10px]">{score}</span>
      <span className="text-right text-[9px] font-bold tabular-nums">
        {trend === "up" && <span className="text-emerald-400">+{change}</span>}
        {trend === "down" && <span className="text-red-400">-{change}</span>}
        {trend === "same" && <span className="text-zinc-700">-</span>}
      </span>
    </div>
  );
}
