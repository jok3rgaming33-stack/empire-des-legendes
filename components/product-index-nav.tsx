"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import useSWR from "swr"
import { List, X } from "lucide-react"
import { getCategoriesWithProducts } from "@/app/actions/products"
import { isFeaturedArrivage, sortProductsFeaturedFirst } from "@/lib/badges"
import type { Product } from "@/lib/db/schema"

export type NavEntry = {
  id: number
  title: string
  featured: boolean
  categoryName: string
}

function buildEntries(
  data: Awaited<ReturnType<typeof getCategoriesWithProducts>> | undefined,
): NavEntry[] {
  if (!data?.length) return []
  const out: NavEntry[] = []
  for (const { category, items } of data) {
    const ordered = sortProductsFeaturedFirst(items)
    for (const p of ordered) {
      out.push({
        id: p.id,
        title: p.title,
        featured: isFeaturedArrivage(p.badges),
        categoryName: category.name,
      })
    }
  }
  return out
}

function scrollToProduct(id: number) {
  const el = document.getElementById(`product-${id}`)
  if (!el) return
  el.scrollIntoView({ behavior: "smooth", block: "start" })
}

/**
 * Index catalogue sticky (desktop) + tiroir mobile.
 * Accès rapide par nom de produit, suit le scroll, item actif mis en évidence.
 */
export function ProductIndexNav() {
  const { data } = useSWR("catalog-with-products", () => getCategoriesWithProducts(), {
    revalidateOnFocus: false,
  })
  const entries = useMemo(() => buildEntries(data), [data])
  const [activeId, setActiveId] = useState<number | null>(null)
  const [mobileOpen, setMobileOpen] = useState(false)

  // Observe les fiches produit pour l’item actif
  useEffect(() => {
    if (!entries.length) return
    const nodes = entries
      .map((e) => document.getElementById(`product-${e.id}`))
      .filter((n): n is HTMLElement => !!n)
    if (!nodes.length) return

    const obs = new IntersectionObserver(
      (records) => {
        // Le plus visible près du haut de l’écran
        const visible = records
          .filter((r) => r.isIntersecting)
          .sort(
            (a, b) =>
              Math.abs(a.boundingClientRect.top) - Math.abs(b.boundingClientRect.top),
          )
        const top = visible[0]
        if (top?.target?.id?.startsWith("product-")) {
          const id = Number(top.target.id.replace("product-", ""))
          if (!Number.isNaN(id)) setActiveId(id)
        }
      },
      {
        root: null,
        rootMargin: "-20% 0px -55% 0px",
        threshold: [0, 0.15, 0.4],
      },
    )
    nodes.forEach((n) => obs.observe(n))
    return () => obs.disconnect()
  }, [entries])

  const onPick = useCallback((id: number) => {
    scrollToProduct(id)
    setActiveId(id)
    setMobileOpen(false)
  }, [])

  if (!entries.length) return null

  const list = (
    <nav aria-label="Index catalogue" className="flex flex-col">
      <p className="mb-3 px-1 text-[9px] font-medium uppercase tracking-[0.35em] text-primary/70">
        Catalogue
      </p>
      <ul className="flex flex-col gap-0.5">
        {entries.map((e) => {
          const active = e.id === activeId
          return (
            <li key={e.id}>
              <button
                type="button"
                onClick={() => onPick(e.id)}
                title={e.title}
                className={`group flex w-full items-start gap-2 rounded-sm px-2 py-1.5 text-left transition-colors ${
                  active
                    ? "bg-primary/15 text-primary"
                    : "text-zinc-500 hover:bg-white/[0.03] hover:text-zinc-200"
                }`}
              >
                <span
                  className={`mt-1.5 h-1 w-1 shrink-0 rounded-full ${
                    e.featured
                      ? "bg-primary shadow-[0_0_6px_rgba(201,162,39,0.8)]"
                      : active
                        ? "bg-primary"
                        : "bg-zinc-600 group-hover:bg-zinc-400"
                  }`}
                  aria-hidden="true"
                />
                <span className="min-w-0 flex-1">
                  <span
                    className={`block truncate text-[11px] leading-snug tracking-wide ${
                      active ? "font-medium" : "font-normal"
                    }`}
                  >
                    {e.title}
                  </span>
                  {e.featured && (
                    <span className="mt-0.5 block text-[8px] uppercase tracking-[0.2em] text-primary/80">
                      Arrivage
                    </span>
                  )}
                </span>
              </button>
            </li>
          )
        })}
      </ul>
    </nav>
  )

  return (
    <>
      {/* Desktop : rail sticky à droite */}
      <aside
        className="pointer-events-none fixed bottom-8 right-0 top-24 z-20 hidden w-[9.5rem] pr-3 xl:block 2xl:w-44 2xl:pr-5"
        aria-hidden={false}
      >
        <div className="pointer-events-auto flex h-full max-h-[calc(100vh-7.5rem)] flex-col border-l border-primary/20 bg-black/40 py-3 pl-3 backdrop-blur-md">
          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain pr-1 [scrollbar-width:thin]">
            {list}
          </div>
        </div>
      </aside>

      {/* Mobile / tablette : FAB + panneau */}
      <div className="xl:hidden">
        <button
          type="button"
          onClick={() => setMobileOpen(true)}
          className="fixed bottom-20 right-4 z-40 flex h-11 w-11 items-center justify-center border border-primary/40 bg-black/80 text-primary shadow-lg backdrop-blur-md"
          aria-label="Ouvrir l'index catalogue"
        >
          <List className="h-5 w-5" strokeWidth={1.5} />
        </button>

        {mobileOpen && (
          <div className="fixed inset-0 z-50 flex justify-end">
            <button
              type="button"
              className="absolute inset-0 bg-black/70"
              aria-label="Fermer"
              onClick={() => setMobileOpen(false)}
            />
            <div className="relative flex h-full w-[min(100%,18rem)] flex-col border-l border-primary/25 bg-[#0a0a0a] p-4 shadow-2xl">
              <div className="mb-3 flex items-center justify-between">
                <span className="font-display text-xs uppercase tracking-[0.25em] text-primary">
                  Catalogue
                </span>
                <button
                  type="button"
                  onClick={() => setMobileOpen(false)}
                  className="p-1 text-zinc-400 hover:text-white"
                  aria-label="Fermer"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              <div className="min-h-0 flex-1 overflow-y-auto">{list}</div>
            </div>
          </div>
        )}
      </div>
    </>
  )
}

/** Ancre DOM pour le scroll (utilitaire exporté si besoin). */
export function productAnchorId(product: Product | { id: number }) {
  return `product-${product.id}`
}
