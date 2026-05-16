import Link from "next/link"
import { cn } from "@/lib/utils"

/**
 * Brand wordmark — always lowercase `hackaboard` with the middle `a`
 * tinted brand cyan. No literal `<a>` angle brackets (those vanish at
 * small sizes and the mark read as "hackboard"). Single source of
 * truth used by the footer, signin, /access and other chrome.
 */
export function BrandMark({ className, size = "sm" }: { className?: string; size?: "xs" | "sm" | "md" | "lg" }) {
  const sizes = {
    xs: "text-xs",
    sm: "text-sm",
    md: "text-base",
    lg: "text-lg",
  }
  return (
    <Link
      href="/"
      className={cn(
        "text-muted-foreground hover:text-foreground transition-colors tracking-wide font-bold lowercase",
        sizes[size],
        className,
      )}
    >
      hack<span className="text-primary">a</span>board
    </Link>
  )
}

export function BrandFooter({ className }: { className?: string }) {
  return (
    <div className={cn("flex items-center justify-center gap-2 py-4 text-xs text-muted-foreground/50 tracking-wider", className)}>
      <span>powered by</span>
      <BrandMark size="sm" className="text-muted-foreground/60 hover:text-foreground" />
    </div>
  )
}
