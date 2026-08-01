"use client"

import useSWR from "swr"
import { ProductSection } from "@/components/product-section"
import { ProductIndexNav } from "@/components/product-index-nav"
import { listCategories } from "@/app/actions/categories"

// Boutique + index sticky des produits (accès rapide par nom).
export function ShopSections() {
  const { data: categories } = useSWR("shop-categories", () => listCategories(), {
    revalidateOnFocus: false,
  })

  if (!categories) {
    return (
      <div className="mx-auto max-w-[960px] px-5 py-20 sm:px-8 xl:mr-[9.5rem] 2xl:mr-44">
        <div className="flex flex-col gap-12">
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="h-56 animate-pulse border border-primary/10 bg-[#0a0a0a]/50"
            />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="relative">
      {categories.map((cat, idx) => (
        <ProductSection
          key={cat.id}
          config={{
            section: cat.key,
            icon: idx === 0 ? "crown" : "sparkles",
            eyebrow: idx === 0 ? "Collection exclusive" : "Sélection",
            title: cat.name,
            gridCols: "catalog-luxe",
            imageSize: "aspect-[4/5]",
            anchor: idx === 0 ? "featured" : undefined,
          }}
        />
      ))}
      {/* Index sticky — desktop rail + mobile FAB */}
      <ProductIndexNav />
    </div>
  )
}
