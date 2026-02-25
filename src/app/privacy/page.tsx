import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Privacy Policy | hack<a>board",
  description: "Privacy Policy for hack<a>board.",
}

export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-background text-foreground font-mono">
      <div className="container mx-auto max-w-3xl px-6 py-16 space-y-8">
        <header className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">Privacy Policy</h1>
          <p className="text-sm text-muted-foreground">Last updated: February 25, 2026</p>
        </header>

        <section className="space-y-3 text-sm leading-7 text-muted-foreground">
          <p>
            hack&lt;a&gt;board processes organizer, judge, and participant information to run hackathon operations.
          </p>
          <p>
            Data collected may include names, email addresses, optional phone/college fields, team and scoring
            records, and operational logs required for platform reliability and fraud prevention.
          </p>
          <p>
            We use this data only for platform functionality, support, and security. We do not sell personal data.
          </p>
          <p>
            Access to sensitive routes is protected through authenticated sessions and role-scoped tokens. Please avoid
            sharing private links or screenshots containing tokens.
          </p>
          <p>
            Organizers are responsible for lawful participant data collection and any event-specific consent notices
            required in their jurisdiction.
          </p>
        </section>
      </div>
    </main>
  )
}
