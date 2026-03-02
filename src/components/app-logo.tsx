import Image from "next/image"
import { cn } from "@/lib/utils"

type AppLogoProps = {
  className?: string
  priority?: boolean
  size?: "sm" | "md" | "lg"
  withText?: boolean
}

const SYMBOL_DIMENSIONS = {
  sm: { width: 28, height: 28 },
  md: { width: 40, height: 40 },
  lg: { width: 56, height: 56 },
} as const

const TEXT_CLASS = {
  sm: "text-lg tracking-tight",
  md: "text-3xl tracking-tight",
  lg: "text-6xl md:text-7xl tracking-tighter",
} as const

export function AppLogo({
  className,
  priority = false,
  size = "md",
  withText = true,
}: AppLogoProps) {
  const { width, height } = SYMBOL_DIMENSIONS[size]

  return (
    <div className={cn("inline-flex items-center gap-3", className)}>
      <Image
        src="/hackaboard-symbol.svg"
        alt="hackaboard symbol"
        width={width}
        height={height}
        priority={priority}
        className="h-auto w-auto shrink-0"
      />
      {withText && (
        <span
          className={cn(
            "font-bold lowercase leading-none text-transparent bg-clip-text bg-gradient-to-b from-white to-zinc-500",
            TEXT_CLASS[size]
          )}
        >
          hack&lt;a&gt;board
        </span>
      )}
    </div>
  )
}
