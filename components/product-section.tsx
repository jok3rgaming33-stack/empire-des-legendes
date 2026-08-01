"use client"

import { useState, useEffect, type MouseEvent } from "react"
import useSWR from "swr"
import { useCart } from "@/components/cart-provider"
import { Crown, Sparkles, X as CloseIcon, Package } from "lucide-react"
import { ProductBadges } from "@/components/product-badge"
import { resolveBadges } from "@/lib/badges"
import { BlobMedia } from "@/components/blob-media"
import { getProductsBySection, decrementStock } from "@/app/actions/products"
import { requestRestockAlert, hasRestockAlert } from "@/app/actions/restock"
import { BellRing, BellPlus } from "lucide-react"
import type { Product, ProductVariant } from "@/lib/db/schema"

type SectionConfig = {
  section: string
  icon: "flask" | "sparkles" | "crown"
  eyebrow: string
  title: string
  gridCols: string
  imageSize: string
  anchor?: string
}

/**
 * Retrouve le type ("image"|"video") d'une URL dans la liste media d'un produit.
 * Normalise les deux côtés (URL proxy et URL brute) pour éviter les faux négatifs.
 */
function getMediaType(
  url: string | null | undefined,
  media: Array<{ url: string; type: "image" | "video" }> | null | undefined,
): "image" | "video" | undefined {
  if (!url || !media?.length) return undefined
  const normalize = (u: string) => {
    if (u.startsWith("/api/media?")) {
      try {
        return new URLSearchParams(u.slice(u.indexOf("?"))).get("url") ?? u
      } catch {
        return u
      }
    }
    return u
  }
  const rawUrl = normalize(url)
  const match = media.find((m) => normalize(m.url) === rawUrl || m.url === url)
  return match?.type
}

// Prix effectif d'une variante après remise produit éventuelle.
function effectivePrice(price: number, product: Product): number {
  if (product.discountType === "percent" && product.discountValue) {
    return Math.max(0, Math.round(price * (1 - product.discountValue / 100)))
  }
  if (product.discountType === "fixed" && product.discountValue) {
    return Math.max(0, price - product.discountValue)
  }
  return price
}

/** Variantes encore commandables au vu du stock. */
function availableVariants(product: Product): { v: ProductVariant; idx: number }[] {
  return product.variants
    .map((v, idx) => ({ v, idx }))
    .filter(({ v }) => v.qty <= product.stock)
}

export function ProductSection({ config }: { config: SectionConfig }) {
  const { addToCart } = useCart()
  const { data: products, mutate } = useSWR(
    `products:${config.section}`,
    () => getProductsBySection(config.section),
    { revalidateOnFocus: false },
  )

  const [selected, setSelected] = useState<Product | null>(null)
  const [variantIdx, setVariantIdx] = useState(0)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isAnimating, setIsAnimating] = useState(false)
  // Variante choisie par produit (sur la miniature) — clé = product.id
  const [cardVariant, setCardVariant] = useState<Record<number, number>>({})
  const [addingId, setAddingId] = useState<number | null>(null)
  const [alerted, setAlerted] = useState<Record<number, boolean>>({})
  const [alerting, setAlerting] = useState<number | null>(null)

  const requestAlert = async (product: Product) => {
    const token = typeof window !== "undefined" ? localStorage.getItem("authToken") : null
    if (!token) return
    setAlerting(product.id)
    const existing = await hasRestockAlert(product.id, token)
    if (!existing) {
      await requestRestockAlert(product.id, token)
    }
    setAlerted((prev) => ({ ...prev, [product.id]: true }))
    setAlerting(null)
  }

  const openModal = (product: Product, preferIdx?: number) => {
    setSelected(product)
    const avail = availableVariants(product)
    const fallback = avail[0]?.idx ?? 0
    setVariantIdx(
      preferIdx != null && avail.some((a) => a.idx === preferIdx)
        ? preferIdx
        : cardVariant[product.id] ?? fallback,
    )
    setIsModalOpen(true)
    setIsAnimating(true)
  }

  const closeModal = () => {
    setIsModalOpen(false)
    setTimeout(() => {
      setSelected(null)
      setIsAnimating(false)
    }, 300)
  }

  useEffect(() => {
    let timer: NodeJS.Timeout
    if (isModalOpen && isAnimating) {
      timer = setTimeout(() => setIsAnimating(false), 4000)
    }
    return () => clearTimeout(timer)
  }, [isModalOpen, isAnimating])

  const Icon = config.icon === "crown" || config.icon === "flask" ? Crown : Sparkles
  const sectionProps = config.anchor
    ? { id: config.anchor, className: "mx-auto max-w-[1280px] px-4 pb-20 pt-14 scroll-mt-24" }
    : { className: "mx-auto max-w-[1280px] px-4 py-16" }

  const handleAdd = async () => {
    if (!selected) return
    const v = selected.variants[variantIdx]
    if (!v) return
    const price = effectivePrice(v.price, selected)
    addToCart(`${selected.title} ×${v.qty}`, price)
    await decrementStock(selected.id, 1)
    mutate()
    closeModal()
  }

  const handleAddFromCard = async (product: Product, e: MouseEvent) => {
    e.stopPropagation()
    if (product.stock <= 0) return
    const avail = availableVariants(product)
    if (!avail.length) return
    const chosen =
      avail.find((a) => a.idx === cardVariant[product.id]) ?? avail[0]
    setAddingId(product.id)
    try {
      const price = effectivePrice(chosen.v.price, product)
      addToCart(`${product.title} ×${chosen.v.qty}`, price)
      await decrementStock(product.id, 1)
      mutate()
    } finally {
      setAddingId(null)
    }
  }

  return (
    <>
      <section {...sectionProps}>
        <div className="mb-12 text-center">
          <div className="mb-3 flex items-center justify-center gap-3">
            <span className="h-px w-10 bg-primary/40" aria-hidden="true" />
            <Icon className="h-5 w-5 text-primary" strokeWidth={1.5} />
            <span className="h-px w-10 bg-primary/40" aria-hidden="true" />
          </div>
          <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.35em] text-primary/80">
            {config.eyebrow}
          </p>
          <h2 className="section-title-gold">{config.title}</h2>
        </div>

        {!products ? (
          <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="h-80 animate-pulse rounded-2xl border border-primary/15 bg-[#0a0a0a]"
              />
            ))}
          </div>
        ) : products.length === 0 ? (
          <p className="py-10 text-center text-sm text-muted-foreground">
            Aucun produit dans cette section pour le moment.
          </p>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {products.map((product) => {
              const badges = resolveBadges(product.badges, product.stock)
              const out = product.stock <= 0
              const avail = availableVariants(product)
              const activeIdx =
                cardVariant[product.id] ?? avail[0]?.idx ?? 0
              const active =
                avail.find((a) => a.idx === activeIdx) ?? avail[0]
              const mainUrl = product.image || product.media?.[0]?.url || null
              const mainType = mainUrl
                ? (getMediaType(mainUrl, product.media) ??
                  product.media?.find((m) => m.url === mainUrl)?.type)
                : undefined

              return (
                <article
                  key={product.id}
                  className={`group relative flex flex-col overflow-hidden rounded-2xl border bg-gradient-to-b from-[#121212] to-[#080808] transition-all duration-300 ${
                    out
                      ? "border-white/10 opacity-55"
                      : "border-primary/30 hover:-translate-y-1 hover:border-primary/70 hover:shadow-[0_12px_40px_rgba(201,162,39,0.12)]"
                  }`}
                >
                  {/* En-tête image carrée + cadre or */}
                  <div className="relative p-3 pb-0">
                    <div
                      className="relative aspect-square w-full overflow-hidden rounded-xl border border-primary/25 bg-[#0d0d0d] shadow-[inset_0_0_0_1px_rgba(201,162,39,0.08)]"
                      onClick={() => !out && openModal(product, activeIdx)}
                      role={out ? undefined : "button"}
                      tabIndex={out ? undefined : 0}
                      onKeyDown={(e) => {
                        if (!out && (e.key === "Enter" || e.key === " ")) {
                          e.preventDefault()
                          openModal(product, activeIdx)
                        }
                      }}
                    >
                      {mainUrl ? (
                        <BlobMedia
                          src={mainUrl}
                          alt={product.title}
                          mediaType={mainType}
                          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-primary/25">
                          <Package className="h-14 w-14" strokeWidth={1} />
                        </div>
                      )}
                      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-black/20" />
                      <ProductBadges badges={badges} />

                      {/* Pastille stock */}
                      <span
                        className={`absolute bottom-2 left-2 rounded-md px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${
                          out
                            ? "bg-zinc-800 text-zinc-400"
                            : "bg-black/70 text-primary ring-1 ring-primary/40"
                        }`}
                      >
                        {out ? "Rupture" : `Stock ${product.stock}`}
                      </span>
                    </div>
                  </div>

                  {/* Corps : titre + options visibles */}
                  <div className="flex flex-1 flex-col gap-3 p-4 pt-3">
                    <div className="min-h-[3.25rem]">
                      {product.symbol && (
                        <p className="mb-0.5 font-mono text-[10px] uppercase tracking-[0.22em] text-primary/80">
                          {product.symbol}
                          {product.number ? ` · ${product.number}` : ""}
                        </p>
                      )}
                      <h3 className="font-display text-[15px] font-semibold uppercase leading-snug tracking-wide text-white">
                        {product.title}
                      </h3>
                      {product.description && (
                        <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-zinc-500">
                          {product.description}
                        </p>
                      )}
                    </div>

                    {/* Options / variantes sur la miniature */}
                    {!out && avail.length > 0 ? (
                      <div>
                        <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                          Options
                        </p>
                        <div className="flex flex-wrap gap-1.5">
                          {avail.map(({ v, idx }) => {
                            const price = effectivePrice(v.price, product)
                            const isOn = idx === activeIdx
                            const discounted = price !== v.price
                            return (
                              <button
                                key={`${product.id}-${idx}`}
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  setCardVariant((prev) => ({
                                    ...prev,
                                    [product.id]: idx,
                                  }))
                                }}
                                className={`rounded-lg border px-2.5 py-1.5 text-left transition-all ${
                                  isOn
                                    ? "border-primary bg-primary/15 text-primary shadow-[0_0_12px_rgba(201,162,39,0.2)]"
                                    : "border-white/10 bg-black/40 text-white/75 hover:border-primary/40 hover:text-white"
                                }`}
                              >
                                <span className="block text-[11px] font-semibold leading-none">
                                  ×{v.qty}
                                </span>
                                <span className="mt-0.5 block text-[10px] leading-none">
                                  {price}€
                                  {discounted && (
                                    <span className="ml-1 text-zinc-500 line-through">
                                      {v.price}€
                                    </span>
                                  )}
                                </span>
                              </button>
                            )
                          })}
                        </div>
                      </div>
                    ) : out ? (
                      <p className="text-xs text-zinc-500">Aucune option disponible</p>
                    ) : null}

                    {/* Prix sélection + actions */}
                    <div className="mt-auto flex flex-col gap-2 border-t border-white/5 pt-3">
                      {!out && active && (
                        <div className="flex items-baseline justify-between gap-2">
                          <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
                            Sélection
                          </span>
                          <span className="font-display text-lg font-semibold text-primary">
                            {effectivePrice(active.v.price, product)}€
                            <span className="ml-1 text-xs font-normal text-zinc-500">
                              / ×{active.v.qty}
                            </span>
                          </span>
                        </div>
                      )}

                      {out ? (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation()
                            if (!alerted[product.id]) requestAlert(product)
                          }}
                          disabled={alerting === product.id || alerted[product.id]}
                          className="flex w-full items-center justify-center gap-1.5 rounded-xl border border-primary/40 bg-primary/10 py-2.5 text-[11px] font-semibold uppercase tracking-wider text-primary transition-colors hover:bg-primary/20 disabled:opacity-70"
                        >
                          {alerted[product.id] ? (
                            <>
                              <BellRing className="h-3.5 w-3.5" aria-hidden="true" />
                              Alerte activée
                            </>
                          ) : (
                            <>
                              <BellPlus className="h-3.5 w-3.5" aria-hidden="true" />
                              {alerting === product.id ? "…" : "Alerte dispo"}
                            </>
                          )}
                        </button>
                      ) : (
                        <div className="grid grid-cols-[1fr_auto] gap-2">
                          <button
                            type="button"
                            onClick={(e) => handleAddFromCard(product, e)}
                            disabled={addingId === product.id || !avail.length}
                            className="btn-gold rounded-xl py-2.5 text-[10px] disabled:opacity-60"
                          >
                            {addingId === product.id ? "…" : "Ajouter au panier"}
                          </button>
                          <button
                            type="button"
                            onClick={() => openModal(product, activeIdx)}
                            className="rounded-xl border border-white/15 px-3 py-2.5 text-[10px] font-semibold uppercase tracking-wider text-white/70 transition-colors hover:border-primary/40 hover:text-primary"
                          >
                            Détails
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </article>
              )
            })}
          </div>
        )}
      </section>

      {isModalOpen && selected && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 p-4 backdrop-blur-sm"
          onClick={closeModal}
        >
          <div
            className="relative flex max-h-[90dvh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-primary/30 bg-[#0a0a0a] md:flex-row"
            onClick={(e) => e.stopPropagation()}
          >
            <div
              className={`pointer-events-none absolute inset-0 overflow-hidden transition-all duration-1000 ${
                isAnimating ? "z-10 opacity-100" : "z-0 opacity-10"
              }`}
            >
              <video
                src="/images/CSS Smoke Effect/CSS Smoke Effect/smoke.mp4"
                autoPlay
                muted
                loop
                playsInline
                className="h-full w-full object-cover mix-blend-screen"
              />
            </div>

            <button
              onClick={closeModal}
              className="absolute right-4 top-4 z-50 rounded-full bg-black/50 p-2 text-white/50 hover:text-white"
              aria-label="Fermer"
            >
              <CloseIcon className="h-5 w-5" />
            </button>

            <div className="relative z-20 flex w-full items-center justify-center bg-[#050505]/50 p-6 md:w-1/2 md:p-10">
              <div className="relative aspect-square w-full max-w-[280px] overflow-hidden rounded-xl border border-primary/20">
                {selected.image && (
                  <BlobMedia
                    src={selected.image}
                    alt={selected.title}
                    mediaType={getMediaType(selected.image, selected.media)}
                    className="h-full w-full object-cover"
                  />
                )}
              </div>
            </div>

            <div className="relative z-20 flex w-full flex-col justify-center overflow-y-auto p-6 pb-safe md:w-1/2 md:p-10">
              {selected.number && (
                <span className="mb-2 font-mono text-xs uppercase tracking-[0.2em] text-primary">
                  Code {selected.number}
                </span>
              )}
              <h3 className="mb-3 font-display text-2xl font-bold uppercase tracking-wide text-white md:text-3xl">
                {selected.title}
              </h3>
              <p className="mb-5 text-sm leading-relaxed text-zinc-400">
                {selected.fullDescription || selected.description}
              </p>

              <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-primary">
                Options
              </p>
              <div className="mb-5 flex flex-wrap gap-2">
                {selected.variants.map((v: ProductVariant, i: number) => {
                  if (v.qty > selected.stock) return null
                  const price = effectivePrice(v.price, selected)
                  const isOn = i === variantIdx
                  return (
                    <button
                      key={`${v.qty}-${i}`}
                      type="button"
                      onClick={() => setVariantIdx(i)}
                      className={`rounded-xl border px-3 py-2 text-sm transition-all ${
                        isOn
                          ? "border-primary bg-primary/15 text-primary"
                          : "border-white/10 text-white/80 hover:border-primary/40"
                      }`}
                    >
                      ×{v.qty} — {price}€
                      {price !== v.price ? (
                        <span className="ml-1 text-xs text-zinc-500 line-through">
                          {v.price}€
                        </span>
                      ) : null}
                    </button>
                  )
                })}
              </div>

              <div className="mb-5 font-display text-2xl font-semibold text-primary">
                {selected.variants[variantIdx]
                  ? effectivePrice(selected.variants[variantIdx].price, selected)
                  : 0}
                €
              </div>

              <button onClick={handleAdd} className="btn-gold w-full rounded-xl py-4">
                Ajouter au panier
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
