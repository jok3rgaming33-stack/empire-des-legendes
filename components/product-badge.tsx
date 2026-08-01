"use client"

import { badgeMeta } from "@/lib/badges"

// Affiche un ou plusieurs bandeaux empilés en haut à droite d'une vignette produit.
// L'édition des badges se fait depuis le panel admin (formulaire produit).
// "nouveau" / Nouveauté : clignotement CSS (classe badge-blink).
export function ProductBadges({ badges }: { badges: string[] | null | undefined }) {
  const list = (badges ?? [])
    .map((k) => badgeMeta(k))
    .filter((m): m is NonNullable<typeof m> => !!m)
  if (list.length === 0) return null

  return (
    <div className="pointer-events-none absolute right-0 top-0 z-20 flex flex-col items-end gap-0.5">
      {list.map((meta) => {
        const blink =
          meta.key === "nouveau" ||
          ("blink" in meta && Boolean((meta as { blink?: boolean }).blink))
        return (
          <span
            key={meta.key}
            className={`px-3 py-1.5 text-[9px] font-semibold uppercase tracking-[0.2em] shadow-md ${meta.className} ${
              blink ? "badge-blink" : ""
            }`}
          >
            {meta.label}
          </span>
        )
      })}
    </div>
  )
}
