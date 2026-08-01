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
      <div className="mx-auto max-w-[1200px] px-4 py-20">
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-72 animate-pulse rounded-sm border border-primary/20 bg-[#0a0a0a]" />
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
            gridCols: "md:grid-cols-2 lg:grid-cols-4",
            imageSize: "h-32 w-32",
            anchor: idx === 0 ? "featured" : undefined,
          }}
        />
      ))}
    </>
  )
}
