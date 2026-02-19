import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Terminal, Trophy, QrCode, Tv } from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen bg-black text-green-500 font-mono selection:bg-green-500/30">
      {/* Navigation */}
      <nav className="border-b border-green-500/20 p-4">
        <div className="container mx-auto flex justify-between items-center">
          <div className="text-xl font-bold tracking-tighter flex items-center gap-2">
            <Terminal className="w-5 h-5" />
            <span>hack&lt;a&gt;board</span>
          </div>
          <div className="space-x-4">
            <Link href="/api/auth/signin" className="hover:text-green-400 underline decoration-green-500/50 underline-offset-4">
              Organizer Login
            </Link>
          </div>
        </div>
      </nav>

      <main className="container mx-auto px-4">
        {/* Hero Section */}
        <section className="py-24 text-center space-y-8">
          <div className="inline-block border border-green-500/30 rounded-full px-3 py-1 text-xs bg-green-500/5 mb-4">
            v1.0.0_STABLE
          </div>
          <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-4">
            Real-time <span className="text-white">Scoring</span> for<br />
            Modern Hackathons.
          </h1>
          <p className="text-xl text-green-500/60 max-w-2xl mx-auto">
            Live leaderboards, QR-based judging, and ceremony reveal systems.
            Designed for high-energy developer events.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-8">
            <Link href="/dashboard">
              <Button size="lg" className="bg-green-600 hover:bg-green-700 text-black font-bold h-12 px-8 text-lg">
                Create New Hackathon ::
              </Button>
            </Link>
            <Link href="/h/demo/display" className="text-green-500 hover:text-green-400 hover:underline underline-offset-4">
              [ View Live Demo ]
            </Link>
          </div>
        </section>

        {/* Features Grid */}
        <section className="py-24 grid md:grid-cols-3 gap-8 border-t border-green-500/20">
          <FeatureCard
            icon={<Tv className="w-8 h-8" />}
            title="Wall Street Leaderboard"
            description="Ticker-style live updates on the big screen. Trend arrows, rank shifts, and high-contrast visibility."
          />
          <FeatureCard
            icon={<QrCode className="w-8 h-8" />}
            title="QR Judging & Auth"
            description="Judges scan participant codes to score instantly. Secure, fast, and completely paperless."
          />
          <FeatureCard
            icon={<Trophy className="w-8 h-8" />}
            title="Ceremony Reveal"
            description="Freeze the board, build suspense, and reveal winners one-by-one with our dedicated ceremony mode."
          />
        </section>

        {/* Workflow Section */}
        <section className="py-24 space-y-12 border-t border-green-500/20">
          <div className="text-center space-y-2">
            <h2 className="text-3xl font-bold">System Workflow</h2>
            <p className="text-green-500/60">How the platform operates during an event.</p>
          </div>

          <div className="grid md:grid-cols-4 gap-4 text-center">
            <Step value="01" title="Register" desc="Teams join & get QR tokens" />
            <Step value="02" title="Scan" desc="Judges scan team QRs" />
            <Step value="03" title="Score" desc="Scores update leaderboard live" />
            <Step value="04" title="Reveal" desc="Freeze & Reveal winners" />
          </div>
        </section>
      </main>

      <footer className="border-t border-green-500/20 py-8 text-center text-green-500/40 text-sm">
        <p>BUILT_FOR_BUILDERS // SYSTEM_READY</p>
      </footer>
    </div>
  );
}

function FeatureCard({ icon, title, description }: { icon: React.ReactNode, title: string, description: string }) {
  return (
    <div className="p-6 border border-green-500/20 bg-green-500/5 hover:bg-green-500/10 transition-colors rounded-lg space-y-4">
      <div className="text-green-400">{icon}</div>
      <h3 className="text-xl font-bold">{title}</h3>
      <p className="text-green-500/60 leading-relaxed">{description}</p>
    </div>
  )
}

function Step({ value, title, desc }: { value: string, title: string, desc: string }) {
  return (
    <div className="p-4 space-y-2">
      <div className="text-4xl font-bold text-green-500/20">{value}</div>
      <div className="font-bold text-lg">{title}</div>
      <div className="text-sm text-green-500/60">{desc}</div>
    </div>
  )
}
