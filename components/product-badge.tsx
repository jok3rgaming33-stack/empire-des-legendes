"use client"

import { badgeMeta } from "@/lib/badges"

// Affiche un ou plusieurs bandeaux empilés en haut à droite d'une vignette produit.
// L'édition des badges se fait désormais depuis le panel admin (formulaire produit).
export function ProductBadges({ badges }: { badges: string[] | null | undefined }) {
  const list = (badges ?? []).map((k) => badgeMeta(k)).filter((m): m is NonNullable<typeof m> => !!m)
  if (list.length === 0) return null

  return (
    <div className="pointer-events-none absolute right-2 top-2 z-20 flex flex-col items-end gap-1">
      {list.map((meta) => (
        <span
          key={meta.key}
          className={`rounded-md px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider shadow-md ring-1 ring-black/20 ${meta.className}`}
        >
          {meta.label}
        </span>
      ))}
    </div>
  )
}
