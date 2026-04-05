import Link from "next/link"
import { cn } from "@/lib/utils"

export function BrandMark({ className, size = "sm" }: { className?: string; size?: "xs" | "sm" | "md" | "lg" }) {
  const sizes = {
    xs: "text-xs",
    sm: "text-sm",
    md: "text-base",
    lg: "text-lg",
  }
  return (
    <Link href="/" className={cn("text-muted-foreground hover:text-foreground transition-colors tracking-wide font-bold", sizes[size], className)}>
      hack<span className="text-primary">&lt;a&gt;</span>board
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
