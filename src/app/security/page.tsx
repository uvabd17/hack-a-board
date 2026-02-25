import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Security | hack<a>board",
  description: "Security practices and disclosure policy for hack<a>board.",
}

export default function SecurityPage() {
  return (
    <main className="min-h-screen bg-background text-foreground font-mono">
      <div className="container mx-auto max-w-3xl px-6 py-16 space-y-8">
        <header className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">Security</h1>
          <p className="text-sm text-muted-foreground">Last updated: February 25, 2026</p>
        </header>

        <section className="space-y-3 text-sm leading-7 text-muted-foreground">
          <p>
            We apply role-based access checks, server-side validation, rate limits, secure cookies, and production CSP
            hardening to protect event and participant data.
          </p>
          <p>
            If you identify a vulnerability, please report it privately and include reproduction steps, affected route,
            and potential impact.
          </p>
          <p>
            Do not run denial-of-service tests, social engineering, or destructive testing on production systems.
          </p>
          <p>
            See repository-level reporting details in <code>SECURITY.md</code>.
          </p>
        </section>
      </div>
    </main>
  )
}
