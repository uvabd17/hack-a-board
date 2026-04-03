import { cn } from "@/lib/utils"

export function Mono({
  children,
  className,
  ...props
}: React.ComponentProps<"span">) {
  return (
    <span className={cn("font-mono tabular-nums", className)} {...props}>
      {children}
    </span>
  )
}
