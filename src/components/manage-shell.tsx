"use client"

import Link from "next/link"
import { useState } from "react"
import { usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Menu, X, PanelLeftClose, PanelLeftOpen } from "lucide-react"
import { cn } from "@/lib/utils"

type ManageShellProps = {
  hackathonName: string
  hackathonSlug: string
  children: React.ReactNode
}

type NavItem = {
  label: string
  href: string
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
        {collapsed ? item.label.slice(0, 2) : item.label}
      </Link>
    </Button>
  )
}

export function ManageShell({ hackathonName, hackathonSlug, children }: ManageShellProps) {
  const pathname = usePathname()
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  const navItems: NavItem[] = [
    { label: ":: DASHBOARD", href: `/h/${hackathonSlug}/manage` },
    { label: ":: TEAMS", href: `/h/${hackathonSlug}/manage/teams` },
    { label: ":: CHECK-IN", href: `/h/${hackathonSlug}/manage/check-in` },
    { label: ":: PROBLEMS", href: `/h/${hackathonSlug}/manage/problems` },
    { label: ":: ROUNDS", href: `/h/${hackathonSlug}/manage/rounds` },
    { label: ":: PHASES", href: `/h/${hackathonSlug}/manage/phases` },
    { label: ":: JUDGES", href: `/h/${hackathonSlug}/manage/judges` },
    { label: ":: DISPLAY", href: `/h/${hackathonSlug}/manage/display` },
    { label: ":: SETTINGS", href: `/h/${hackathonSlug}/manage/settings` },
  ]

  return (
    <div className="flex min-h-screen bg-background font-mono">
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
            <p className="text-[10px] text-muted-foreground mt-1">ORGANIZER PANEL</p>
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
          </div>
        </nav>
      </aside>

      <div className="flex-1 min-w-0">
        <header className="md:hidden border-b border-border bg-card/50 px-4 py-3 flex items-center justify-between">
          <div className="min-w-0">
            <p className="text-xs text-muted-foreground">ORGANIZER PANEL</p>
            <h2 className="font-bold text-sm truncate">{hackathonName}</h2>
          </div>
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label={mobileOpen ? "Close menu" : "Open menu"}
            onClick={() => setMobileOpen((v) => !v)}
          >
            {mobileOpen ? <X /> : <Menu />}
          </Button>
        </header>

        {mobileOpen && (
          <div className="md:hidden fixed inset-0 z-50 bg-black/70" onClick={() => setMobileOpen(false)}>
            <div
              className="absolute top-0 left-0 h-full w-72 bg-card border-r border-border p-4"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold">MENU</h3>
                <Button variant="ghost" size="icon-sm" onClick={() => setMobileOpen(false)} aria-label="Close menu">
                  <X />
                </Button>
              </div>
              <nav className="space-y-2">
                {navItems.map((item) => (
                  <NavLink
                    key={item.href}
                    item={item}
                    collapsed={false}
                    active={pathname === item.href}
                    onClick={() => setMobileOpen(false)}
                  />
                ))}
                <div className="pt-4 mt-4 border-t border-border space-y-2">
                  <Button asChild variant="outline" className="w-full justify-start text-left opacity-70" onClick={() => setMobileOpen(false)}>
                    <Link href={`/h/${hackathonSlug}/display`} target="_blank">
                      📊 LIVE LEADERBOARD
                    </Link>
                  </Button>
                  <Button asChild variant="outline" className="w-full justify-start text-left opacity-70" onClick={() => setMobileOpen(false)}>
                    <Link href={`/h/${hackathonSlug}`} target="_blank">
                      ↗ VIEW PUBLIC PAGE
                    </Link>
                  </Button>
                </div>
              </nav>
            </div>
          </div>
        )}

        <main className="p-4 md:p-8 overflow-auto">{children}</main>
      </div>
    </div>
  )
}
