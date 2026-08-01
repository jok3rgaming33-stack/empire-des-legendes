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
      <div className="mx-auto max-w-[1100px] px-5 py-20 sm:px-8">
        <div className="flex flex-col gap-16">
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="h-72 animate-pulse border border-primary/10 bg-[#0a0a0a]/50"
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
            // Layout catalogue luxe géré dans ProductSection (lookbook vertical).
            gridCols: "catalog-luxe",
            imageSize: "aspect-[4/5]",
            anchor: idx === 0 ? "featured" : undefined,
          }}
        />
      ))}
    </>
  )
}
