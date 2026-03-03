export function normalizeEmail(email?: string | null): string {
  return (email || "").trim().toLowerCase()
}

export function parseEmailList(value?: string | null): string[] {
  if (!value) return []
  return Array.from(
    new Set(
      value
        .split(",")
        .map((e) => normalizeEmail(e))
        .filter(Boolean)
    )
  )
}

export function isPrivateBetaEnabled(): boolean {
  return process.env.PRIVATE_BETA_MODE === "true"
}

export function isPrivateBetaAllowed(email?: string | null): boolean {
  if (!isPrivateBetaEnabled()) return true

  const allowlist = parseEmailList(process.env.PRIVATE_BETA_ALLOWED_EMAILS)
  if (allowlist.length === 0) return false

  return allowlist.includes(normalizeEmail(email))
}

export function canManageHackathon(
  hackathon: { userId: string; organizerEmails?: string[] | null },
  user: { id?: string | null; email?: string | null }
): boolean {
  if (!user?.id) return false
  if (hackathon.userId === user.id) return true

  const email = normalizeEmail(user.email)
  if (!email) return false

  return (hackathon.organizerEmails || []).map(normalizeEmail).includes(email)
}

export function isHackathonOwner(
  hackathon: { userId: string },
  user: { id?: string | null }
): boolean {
  return !!user?.id && hackathon.userId === user.id
}

export function canCreateHackathon(user: { email?: string | null }): boolean {
  return isPrivateBetaAllowed(user.email)
}

export type OrganizerPermissionSection =
  | "owner_only"
  | "schedule_manage"
  | "scoring_manage"
  | "participants_manage"
  | "content_manage"
  | "view_analytics"

export function canAccessOrganizerSection(
  hackathon: { userId: string; organizerEmails?: string[] | null },
  user: { id?: string | null; email?: string | null },
  section: OrganizerPermissionSection
): boolean {
  if (section === "owner_only") return isHackathonOwner(hackathon, user)
  return canManageHackathon(hackathon, user)
}
