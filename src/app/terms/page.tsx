import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Terms of Service | hack<a>board",
  description: "Terms of Service for hack<a>board.",
}

export default function TermsPage() {
  return (
    <main className="min-h-screen bg-background text-foreground font-mono">
      <div className="container mx-auto max-w-3xl px-6 py-16 space-y-8">
        <header className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">Terms of Service</h1>
          <p className="text-sm text-muted-foreground">Last updated: February 25, 2026</p>
        </header>

        <section className="space-y-3 text-sm leading-7 text-muted-foreground">
          <p>By using hack&lt;a&gt;board, you agree to these terms.</p>
          <p>
            You may use the platform to run hackathons, manage teams, evaluate submissions, and display
            leaderboard data. You must not use the service for unlawful activity, abuse, or unauthorized access.
          </p>
          <p>
            You are responsible for safeguarding organizer, judge, and participant access links and tokens. You must
            promptly revoke compromised credentials.
          </p>
          <p>
            The service is provided on an as-is basis without warranties to the maximum extent permitted by law.
            We are not liable for indirect or consequential damages.
          </p>
          <p>
            We may update these terms from time to time. Continued use after updates means you accept the revised
            terms.
          </p>
        </section>
      </div>
    </main>
  )
}
