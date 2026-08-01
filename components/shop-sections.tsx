"use client"

import useSWR from "swr"
import { ProductSection } from "@/components/product-section"
import { listCategories } from "@/app/actions/categories"

// Rend dynamiquement une section de boutique par catégorie (ordre géré par l'admin).
// La première catégorie hérite du style "vedette", les suivantes du style "nouveautés".
export function ShopSections() {
  const { data: categories } = useSWR("shop-categories", () => listCategories(), { revalidateOnFocus: false })

  if (!categories) {
    return (
      <div className="mx-auto max-w-[1280px] px-4 py-20">
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="h-80 animate-pulse rounded-2xl border border-primary/15 bg-[#0a0a0a]"
            />
          ))}
        </div>
      </div>
    )
  }

  return (
    <>
      {categories.map((cat, idx) => (
        <ProductSection
          key={cat.id}
          config={{
            section: cat.key,
            icon: idx === 0 ? "crown" : "sparkles",
            eyebrow: idx === 0 ? "Collection exclusive" : "Sélection",
            title: cat.name,
            // La grille est fixée dans ProductSection (2 / 3 colonnes + cartes larges).
            gridCols: "sm:grid-cols-2 xl:grid-cols-3",
            imageSize: "aspect-square",
            anchor: idx === 0 ? "featured" : undefined,
          }}
        />
      ))}
    </>
  )
}
