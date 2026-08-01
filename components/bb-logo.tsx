import { cn } from "@/lib/utils"
import { Crown } from "lucide-react"

/**
 * Logo marque — L'Empire des Légendes
 * (export BbLogo conservé pour ne pas casser les imports existants)
 */
export function BbLogo({
  className,
  size = "md",
}: {
  className?: string
  size?: "sm" | "md" | "lg"
}) {
  const crown =
    size === "lg" ? "h-10 w-10" : size === "sm" ? "h-4 w-4" : "h-6 w-6"

  const word =
    size === "lg"
      ? "text-2xl md:text-3xl tracking-[0.18em]"
      : size === "sm"
        ? "text-[11px] tracking-[0.14em]"
        : "text-sm md:text-base tracking-[0.16em]"

  return (
    <div className={cn("flex items-center gap-2.5", className)}>
      <Crown
        className={cn("shrink-0 text-primary drop-shadow-[0_0_12px_rgba(201,162,39,0.5)]", crown)}
        strokeWidth={1.5}
        aria-hidden="true"
      />
      <div className="flex flex-col leading-none">
        <span
          className={cn(
            "font-display font-semibold uppercase text-primary",
            word,
          )}
        >
          L&apos;Empire des Légendes
        </span>
        {size === "lg" && (
          <span className="mt-1 text-[10px] font-medium uppercase tracking-[0.35em] text-muted-foreground">
            Produits de qualité toute l&apos;année
          </span>
        )}
      </div>
    </div>
  )
}

export function BrandMark({ className }: { className?: string }) {
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <Crown className="h-5 w-5 text-primary" strokeWidth={1.5} aria-hidden="true" />
      <span className="font-display text-xs font-semibold uppercase tracking-[0.2em] text-primary sm:text-sm">
        L&apos;Empire des Légendes
      </span>
    </div>
  )
}
