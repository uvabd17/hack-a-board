"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import { BrandMark } from "@/components/ui/brand"
import {
  type LucideIcon,
  PanelLeftClose,
  PanelLeftOpen,
  LogOut,
  LayoutDashboard,
  Users,
  ClipboardCheck,
  Lightbulb,
  Trophy,
  CalendarClock,
  Scale,
  MonitorPlay,
  Settings,
  MoreHorizontal,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useState } from "react"

type ManageShellProps = {
  hackathonName: string
  hackathonSlug: string
  children: React.ReactNode
}

type NavItem = {
  label: string
  shortLabel: string
  href: string
  icon: LucideIcon
}

function NavLink({
  item,
  collapsed,
  active,
  onClick,
}: {
  item: NavItem
  collapsed: boolean
  active: boolean
  onClick?: () => void
}) {
  return (
    <Button
      asChild
      variant={active ? "secondary" : "ghost"}
      className={cn("w-full text-left", collapsed ? "justify-center px-2" : "justify-start")}
      onClick={onClick}
    >
      <Link href={item.href} title={collapsed ? item.label : undefined}>
        <span className={cn("inline-flex items-center", collapsed ? "justify-center" : "gap-2")}>
          <item.icon className="h-4 w-4 shrink-0" />
          {!collapsed && <span>{item.label}</span>}
        </span>
      </Link>
    </Button>
  )
}

export function ManageShell({ hackathonName, hackathonSlug, children }: ManageShellProps) {
  const pathname = usePathname()
  const [collapsed, setCollapsed] = useState(false)
  const [mobileMoreOpen, setMobileMoreOpen] = useState(false)

  const navItems: NavItem[] = [
    { label: "DASHBOARD", shortLabel: "Home", href: `/h/${hackathonSlug}/manage`, icon: LayoutDashboard },
    { label: "TEAMS", shortLabel: "Teams", href: `/h/${hackathonSlug}/manage/teams`, icon: Users },
    { label: "CHECK-IN", shortLabel: "Check-in", href: `/h/${hackathonSlug}/manage/check-in`, icon: ClipboardCheck },
    { label: "PROBLEMS", shortLabel: "Tracks", href: `/h/${hackathonSlug}/manage/problems`, icon: Lightbulb },
    { label: "ROUNDS", shortLabel: "Rounds", href: `/h/${hackathonSlug}/manage/rounds`, icon: Trophy },
    { label: "PHASES", shortLabel: "Phases", href: `/h/${hackathonSlug}/manage/phases`, icon: CalendarClock },
    { label: "JUDGES", shortLabel: "Judges", href: `/h/${hackathonSlug}/manage/judges`, icon: Scale },
    { label: "DISPLAY", shortLabel: "Display", href: `/h/${hackathonSlug}/manage/display`, icon: MonitorPlay },
    { label: "SETTINGS", shortLabel: "Settings", href: `/h/${hackathonSlug}/manage/settings`, icon: Settings },
  ]

  // Mobile bottom bar shows 4 most-used items + "More"
  const mobileBottomItems = navItems.slice(0, 4)
  const mobileMoreItems = navItems.slice(4)

  return (
    <div className="flex min-h-screen bg-background" data-role="organizer">
      {/* Desktop Sidebar */}
      <aside
        className={cn(
          "hidden md:flex md:flex-col border-r border-border bg-card/50 transition-all duration-200",
          collapsed ? "w-20" : "w-64"
        )}
      >
        <div className="p-4 border-b border-border flex items-center justify-between gap-2">
          <div className={cn("min-w-0", collapsed && "hidden")}>
            <h2 className="font-bold text-sm truncate" title={hackathonName}>
              {hackathonName}
            </h2>
            <p className="text-[10px] text-[var(--role-accent)] mt-1 font-bold tracking-widest">ORGANIZER PANEL</p>
          </div>
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            onClick={() => setCollapsed((v) => !v)}
          >
            {collapsed ? <PanelLeftOpen /> : <PanelLeftClose />}
          </Button>
        </div>

        <nav className="p-3 space-y-2">
          {navItems.map((item) => (
            <NavLink
              key={item.href}
              item={item}
              collapsed={collapsed}
              active={pathname === item.href}
            />
          ))}
          <div className="pt-4 mt-4 border-t border-border space-y-2">
            <Button asChild variant="outline" className={cn("w-full text-left opacity-70", collapsed ? "justify-center px-2" : "justify-start")}>
              <Link href={`/h/${hackathonSlug}/display`} target="_blank" title={collapsed ? "Live leaderboard" : undefined}>
                {collapsed ? "LB" : "📊 LIVE LEADERBOARD"}
              </Link>
            </Button>
            <Button asChild variant="outline" className={cn("w-full text-left opacity-70", collapsed ? "justify-center px-2" : "justify-start")}>
              <Link href={`/h/${hackathonSlug}`} target="_blank" title={collapsed ? "Public page" : undefined}>
                {collapsed ? "PG" : "↗ VIEW PUBLIC PAGE"}
              </Link>
            </Button>
            <Button asChild variant="ghost" className={cn("w-full text-left text-muted-foreground hover:text-destructive", collapsed ? "justify-center px-2" : "justify-start")}>
              <Link href="/dashboard" title={collapsed ? "Back / Sign Out" : undefined}>
                <span className={cn("inline-flex items-center", collapsed ? "justify-center" : "gap-2")}>
                  <LogOut className="h-4 w-4 shrink-0" />
                  {!collapsed && <span>BACK / SIGN OUT</span>}
                </span>
              </Link>
            </Button>
          </div>
          {/* Branding */}
          {!collapsed && (
            <div className="px-3 py-3 mt-auto border-t border-border">
              <BrandMark size="xs" />
            </div>
          )}
        </nav>
      </aside>

      {/* Main Content */}
      <div className="flex-1 min-w-0 flex flex-col">
        {/* Mobile Header */}
        <header className="md:hidden border-b border-border bg-card/50 px-4 py-3 flex items-center justify-between">
          <div className="min-w-0">
            <p className="text-[10px] text-[var(--role-accent)] font-bold tracking-widest">ORGANIZER</p>
            <h2 className="font-bold text-sm truncate">{hackathonName}</h2>
          </div>
          <div className="flex gap-2">
            <Button asChild variant="ghost" size="icon-xs">
              <Link href={`/h/${hackathonSlug}/display`} target="_blank" aria-label="Leaderboard">
                <MonitorPlay className="h-4 w-4" />
              </Link>
            </Button>
            <Button asChild variant="ghost" size="icon-xs">
              <Link href="/dashboard" aria-label="Back / Sign Out">
                <LogOut className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        </header>

        {/* Page Content — add bottom padding on mobile for bottom nav */}
        <main className="flex-1 p-4 md:p-8 overflow-auto pb-24 md:pb-8">{children}</main>

        {/* Mobile Bottom Tab Bar */}
        <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-card border-t-2 border-border flex items-stretch">
          {mobileBottomItems.map((item) => {
            const isActive = pathname === item.href
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex-1 flex flex-col items-center justify-center py-2 gap-0.5 transition-colors",
                  isActive
                    ? "text-[var(--role-accent)] bg-[var(--role-accent)]/5"
                    : "text-muted-foreground"
                )}
              >
                <item.icon className="h-5 w-5" />
                <span className="text-[9px] font-bold tracking-wider uppercase">{item.shortLabel}</span>
              </Link>
            )
          })}
          {/* More button */}
          <button
            onClick={() => setMobileMoreOpen((v) => !v)}
            className={cn(
              "flex-1 flex flex-col items-center justify-center py-2 gap-0.5 transition-colors",
              mobileMoreOpen || mobileMoreItems.some((i) => pathname === i.href)
                ? "text-[var(--role-accent)]"
                : "text-muted-foreground"
            )}
          >
            <MoreHorizontal className="h-5 w-5" />
            <span className="text-[9px] font-bold tracking-wider uppercase">More</span>
          </button>
        </nav>

        {/* Mobile "More" Panel */}
        {mobileMoreOpen && (
          <div className="md:hidden fixed inset-0 z-50" onClick={() => setMobileMoreOpen(false)}>
            <div className="absolute inset-0 bg-black/60" />
            <div
              className="absolute bottom-16 left-0 right-0 bg-card border-t-2 border-border p-3 grid grid-cols-5 gap-2"
              onClick={(e) => e.stopPropagation()}
            >
              {mobileMoreItems.map((item) => {
                const isActive = pathname === item.href
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileMoreOpen(false)}
                    className={cn(
                      "flex flex-col items-center justify-center py-3 gap-1 transition-colors",
                      isActive ? "text-[var(--role-accent)]" : "text-muted-foreground"
                    )}
                  >
                    <item.icon className="h-5 w-5" />
                    <span className="text-[8px] font-bold tracking-wider uppercase">{item.shortLabel}</span>
                  </Link>
                )
              })}
              <Link
                href="/dashboard"
                onClick={() => setMobileMoreOpen(false)}
                className="flex flex-col items-center justify-center py-3 gap-1 text-muted-foreground hover:text-destructive transition-colors"
              >
                <LogOut className="h-5 w-5" />
                <span className="text-[8px] font-bold tracking-wider uppercase">Sign Out</span>
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
