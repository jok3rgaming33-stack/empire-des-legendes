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

function CatalogList({
  entries,
  activeId,
  onPick,
  compact,
}: {
  entries: NavEntry[]
  activeId: number | null
  onPick: (id: number) => void
  compact?: boolean
}) {
  return (
    <nav aria-label="Index catalogue" className="flex flex-col">
      <p
        className={`mb-3 px-1 font-medium uppercase tracking-[0.35em] text-primary/70 ${
          compact ? "text-[9px]" : "text-[10px]"
        }`}
      >
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
                className={`group flex min-h-[44px] w-full items-start gap-2 rounded-sm px-2 py-2 text-left transition-colors sm:min-h-0 sm:py-1.5 ${
                  active
                    ? "bg-primary/15 text-primary"
                    : "text-zinc-500 hover:bg-white/[0.03] hover:text-zinc-200"
                }`}
              >
                <span
                  className={`mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full ${
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
                    className={`block truncate leading-snug tracking-wide ${
                      compact ? "text-[11px]" : "text-xs"
                    } ${active ? "font-medium" : "font-normal"}`}
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
}

/**
 * Index catalogue :
 * - Desktop (xl+) : rail dans la colonne droite du layout (sticky), sans décaler le centre
 * - Mobile : FAB + panneau, safe-area Android respectée
 */
export function ProductIndexNav({ mode = "all" }: { mode?: "rail" | "mobile" | "all" }) {
  const { data } = useSWR("catalog-with-products", () => getCategoriesWithProducts(), {
    revalidateOnFocus: false,
  })
  const entries = useMemo(() => buildEntries(data), [data])
  const [activeId, setActiveId] = useState<number | null>(null)
  const [mobileOpen, setMobileOpen] = useState(false)

  useEffect(() => {
    if (!entries.length) return
    const nodes = entries
      .map((e) => document.getElementById(`product-${e.id}`))
      .filter((n): n is HTMLElement => !!n)
    if (!nodes.length) return

    const obs = new IntersectionObserver(
      (records) => {
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
        rootMargin: "-18% 0px -50% 0px",
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

  const showRail = mode === "rail" || mode === "all"
  const showMobile = mode === "mobile" || mode === "all"

  return (
    <>
      {/* Desktop rail — rendu dans la colonne droite du shell (parent sticky) */}
      {showRail && (
        <div className="hidden h-full xl:block">
          <div className="border-l border-primary/20 bg-black/35 py-3 pl-3 backdrop-blur-md">
            <div className="max-h-[calc(100vh-6.5rem-env(safe-area-inset-bottom,0px))] overflow-y-auto overscroll-contain pr-1 [scrollbar-width:thin]">
              <CatalogList entries={entries} activeId={activeId} onPick={onPick} compact />
            </div>
          </div>
        </div>
      )}

      {/* Mobile / tablette */}
      {showMobile && (
        <div className="xl:hidden">
          {/* FAB : au-dessus de la barre système Android + toast panier */}
          <button
            type="button"
            onClick={() => setMobileOpen(true)}
            className="fixed z-40 flex h-12 w-12 items-center justify-center border border-primary/45 bg-black/85 text-primary shadow-lg backdrop-blur-md"
            style={{
              right: "max(1rem, env(safe-area-inset-right, 0px))",
              bottom:
                "max(5.5rem, calc(env(safe-area-inset-bottom, 0px) + 4.75rem))",
            }}
            aria-label="Ouvrir l'index catalogue"
          >
            <List className="h-5 w-5" strokeWidth={1.5} />
          </button>

          {mobileOpen && (
            <div
              className="fixed inset-0 z-50 flex justify-end"
              style={{ paddingTop: "env(safe-area-inset-top, 0px)" }}
            >
              <button
                type="button"
                className="absolute inset-0 bg-black/75"
                aria-label="Fermer"
                onClick={() => setMobileOpen(false)}
              />
              <div
                className="relative flex h-full w-[min(100%,19rem)] flex-col border-l border-primary/25 bg-[#0a0a0a] shadow-2xl"
                style={{
                  paddingLeft: "1rem",
                  paddingRight: "max(1rem, env(safe-area-inset-right, 0px))",
                  paddingTop: "1rem",
                  paddingBottom: "max(1.25rem, env(safe-area-inset-bottom, 0px))",
                }}
              >
                <div className="mb-3 flex items-center justify-between">
                  <span className="font-display text-xs uppercase tracking-[0.25em] text-primary">
                    Catalogue
                  </span>
                  <button
                    type="button"
                    onClick={() => setMobileOpen(false)}
                    className="flex h-11 w-11 items-center justify-center text-zinc-400 hover:text-white"
                    aria-label="Fermer"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
                <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
                  <CatalogList entries={entries} activeId={activeId} onPick={onPick} />
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </>
  )
}

export function productAnchorId(product: Product | { id: number }) {
  return `product-${product.id}`
}
