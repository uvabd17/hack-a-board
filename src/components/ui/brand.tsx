import Link from "next/link"
import { cn } from "@/lib/utils"

export function BrandMark({ className, size = "sm" }: { className?: string; size?: "xs" | "sm" | "md" }) {
  const sizes = {
    xs: "text-[9px]",
    sm: "text-[10px]",
    md: "text-xs",
  }
  return (
    <Link href="/" className={cn("text-muted-foreground/40 hover:text-muted-foreground transition-colors tracking-wider font-mono", sizes[size], className)}>
      hack&lt;a&gt;board
    </Link>
  )
}

export function BrandFooter({ className }: { className?: string }) {
  return (
    <div className={cn("flex items-center justify-center gap-1.5 py-3 text-[9px] text-muted-foreground/30 tracking-wider font-mono", className)}>
      <span>powered by</span>
      <BrandMark size="xs" />
    </div>
  )
}
