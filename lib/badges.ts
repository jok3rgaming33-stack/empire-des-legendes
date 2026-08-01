// Définition des bandeaux produits (partagée client + serveur).
// Un produit peut porter plusieurs bandeaux simultanément.

export const BADGE_OPTIONS = [
  { key: "best_seller", label: "Best-seller", className: "bg-[#c9a227] text-black" },
  { key: "bépuisé", label: "Bientôt Épuisé", className: "bg-indigo-600 text-white" },
  { key: "promo", label: "Promo", className: "bg-red-600 text-white" },
  // Nouveauté : clignotement géré côté ProductBadges (badge-blink)
  {
    key: "nouveau",
    label: "Nouveauté",
    className: "bg-primary text-black badge-blink",
    blink: true,
  },
  {
    key: "arrivage",
    label: "Arrivage",
    className: "bg-[#e0c35a] text-black",
    featured: true,
  },
  { key: "reappro", label: "En réappro", className: "bg-amber-500 text-black" },
  { key: "rupture", label: "Rupture", className: "bg-zinc-600 text-white" },
  { key: "bientot_dispo", label: "Bientôt dispo", className: "bg-teal-600 text-white" },
  { key: "fin_de_stock", label: "Fin de stock", className: "bg-orange-600 text-white" },
] as const

export type BadgeKey = (typeof BADGE_OPTIONS)[number]["key"]

// Seuil de stock à partir duquel le badge "En réappro" est suggéré/auto-appliqué.
export const LOW_STOCK_THRESHOLD = 5

export function badgeMeta(key: string | null | undefined) {
  return BADGE_OPTIONS.find((b) => b.key === key) ?? null
}

// Calcule la liste de badges à afficher : badges manuels + "En réappro" auto si stock bas.
// Si le produit est flagué "arrivage", on force aussi "nouveau" (badge Nouveauté clignotant).
export function resolveBadges(manual: string[] | null | undefined, stock: number): string[] {
  const list = Array.isArray(manual) ? [...manual] : []
  if (stock <= LOW_STOCK_THRESHOLD && !list.includes("reappro")) {
    list.push("reappro")
  }
  if (list.includes("arrivage") && !list.includes("nouveau")) {
    // Nouveauté en premier pour le rendu visuel (badge clignotant en tête)
    list.unshift("nouveau")
  }
  return list
}

/** Produit mis en avant (flag admin « Arrivage »). */
export function isFeaturedArrivage(badges: string[] | null | undefined): boolean {
  return Array.isArray(badges) && badges.includes("arrivage")
}

/** Trie : arrivages en tête, reste dans l’ordre d’origine. */
export function sortProductsFeaturedFirst<T extends { badges?: string[] | null }>(
  products: T[],
): T[] {
  return [...products].sort((a, b) => {
    const fa = isFeaturedArrivage(a.badges) ? 0 : 1
    const fb = isFeaturedArrivage(b.badges) ? 0 : 1
    return fa - fb
  })
}
