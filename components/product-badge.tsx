"use client"

import { badgeMeta } from "@/lib/badges"

// Affiche un ou plusieurs bandeaux empilés en haut à droite d'une vignette produit.
// L'édition des badges se fait désormais depuis le panel admin (formulaire produit).
export function ProductBadges({ badges }: { badges: string[] | null | undefined }) {
  const list = (badges ?? []).map((k) => badgeMeta(k)).filter((m): m is NonNullable<typeof m> => !!m)
  if (list.length === 0) return null

  return (
    <div className="pointer-events-none absolute right-0 top-0 z-20 flex flex-col items-end">
      {list.map((meta) => (
        <span
          key={meta.key}
          className={`px-3 py-1.5 text-[9px] font-medium uppercase tracking-[0.2em] shadow-sm ${meta.className}`}
        >
          {meta.label}
        </span>
      ))}
    </div>
  )
}
