"use client"

import { useState, useEffect, type MouseEvent } from "react"
import useSWR from "swr"
import { useCart } from "@/components/cart-provider"
import { Crown, Sparkles, X as CloseIcon, Package } from "lucide-react"
import { ProductBadges } from "@/components/product-badge"
import {
  resolveBadges,
  isFeaturedArrivage,
  sortProductsFeaturedFirst,
} from "@/lib/badges"
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

function effectivePrice(price: number, product: Product): number {
  if (product.discountType === "percent" && product.discountValue) {
    return Math.max(0, Math.round(price * (1 - product.discountValue / 100)))
  }
  if (product.discountType === "fixed" && product.discountValue) {
    return Math.max(0, price - product.discountValue)
  }
  return price
}

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
  const [cardVariant, setCardVariant] = useState<Record<number, number>>({})
  const [addingId, setAddingId] = useState<number | null>(null)
  const [alerted, setAlerted] = useState<Record<number, boolean>>({})
  const [alerting, setAlerting] = useState<number | null>(null)

  const requestAlert = async (product: Product) => {
    const token = typeof window !== "undefined" ? localStorage.getItem("authToken") : null
    if (!token) return
    setAlerting(product.id)
    const existing = await hasRestockAlert(product.id, token)
    if (!existing) await requestRestockAlert(product.id, token)
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
  // xl:pr réserve l’espace du rail index catalogue à droite
  const sectionProps = config.anchor
    ? {
        id: config.anchor,
        className:
          "mx-auto max-w-[960px] px-5 pb-20 pt-12 scroll-mt-24 sm:px-8 xl:mr-[9.5rem] 2xl:mr-44",
      }
    : {
        className:
          "mx-auto max-w-[960px] px-5 py-16 sm:px-8 xl:mr-[9.5rem] 2xl:mr-44",
      }

  const orderedProducts = products ? sortProductsFeaturedFirst(products) : null

  const handleAdd = async () => {
    if (!selected) return
    const v = selected.variants[variantIdx]
    if (!v) return
    addToCart(`${selected.title} ×${v.qty}`, effectivePrice(v.price, selected))
    await decrementStock(selected.id, 1)
    mutate()
    closeModal()
  }

  const handleAddFromCard = async (product: Product, e: MouseEvent) => {
    e.stopPropagation()
    if (product.stock <= 0) return
    const avail = availableVariants(product)
    if (!avail.length) return
    const chosen = avail.find((a) => a.idx === cardVariant[product.id]) ?? avail[0]
    setAddingId(product.id)
    try {
      addToCart(`${product.title} ×${chosen.v.qty}`, effectivePrice(chosen.v.price, product))
      await decrementStock(product.id, 1)
      mutate()
    } finally {
      setAddingId(null)
    }
  }

  return (
    <>
      <section {...sectionProps}>
        {/* En-tête catalogue luxe — aéré, filet fin */}
        <header className="mb-12 text-center">
          <div className="mb-4 flex items-center justify-center gap-4">
            <span className="h-px w-10 bg-primary/30" aria-hidden="true" />
            <Icon className="h-4 w-4 text-primary" strokeWidth={1.25} />
            <span className="h-px w-10 bg-primary/30" aria-hidden="true" />
          </div>
          <p className="mb-2 text-[10px] font-medium uppercase tracking-[0.45em] text-primary/75">
            {config.eyebrow}
          </p>
          <h2 className="font-display text-xl font-medium uppercase tracking-[0.28em] text-[#f5f0e6] sm:text-2xl">
            {config.title}
          </h2>
          <div className="mx-auto mt-5 h-px w-14 bg-primary/40" aria-hidden="true" />
        </header>

        {!orderedProducts ? (
          <div className="flex flex-col gap-12">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-56 animate-pulse border border-primary/10 bg-[#0a0a0a]/60" />
            ))}
          </div>
        ) : orderedProducts.length === 0 ? (
          <p className="py-16 text-center text-sm tracking-wide text-muted-foreground">
            Aucun produit dans cette section pour le moment.
          </p>
        ) : (
          <div className="flex flex-col">
            {orderedProducts.map((product, i) => {
              const badges = resolveBadges(product.badges, product.stock)
              const featured = isFeaturedArrivage(product.badges)
              const out = product.stock <= 0
              const avail = availableVariants(product)
              const activeIdx = cardVariant[product.id] ?? avail[0]?.idx ?? 0
              const active = avail.find((a) => a.idx === activeIdx) ?? avail[0]
              const mainUrl = product.image || product.media?.[0]?.url || null
              const mainType = mainUrl
                ? (getMediaType(mainUrl, product.media) ??
                  product.media?.find((m) => m.url === mainUrl)?.type)
                : undefined
              // Alternance image gauche / droite (catalogue lookbook)
              const imageRight = i % 2 === 1

              return (
                <article
                  key={product.id}
                  id={`product-${product.id}`}
                  data-product-id={product.id}
                  className={`group scroll-mt-28 border-t border-primary/15 py-8 last:border-b last:border-primary/15 md:py-10 ${
                    out ? "opacity-55" : ""
                  } ${featured ? "product-featured-arrivage px-3 sm:px-5" : ""}`}
                >
                  {/* Ruban mise en avant Arrivage */}
                  {featured && !out && (
                    <div className="mb-5 flex flex-wrap items-center justify-center gap-3 sm:justify-start">
                      <span className="badge-blink bg-primary px-3 py-1 text-[9px] font-bold uppercase tracking-[0.28em] text-black">
                        Nouveauté
                      </span>
                      <span className="text-[10px] font-medium uppercase tracking-[0.35em] text-primary">
                        À la une · Arrivage
                      </span>
                    </div>
                  )}

                  <div
                    className={`flex flex-col gap-8 md:items-center md:gap-10 ${
                      imageRight ? "md:flex-row-reverse" : "md:flex-row"
                    }`}
                  >
                    {/* Visuel — un peu plus compact ; plus marqué si arrivage */}
                    <div className="relative w-full md:w-[44%] md:shrink-0">
                      <div
                        className={`relative mx-auto aspect-[4/5] w-full overflow-hidden bg-[#0c0c0c] ${
                          featured
                            ? "max-w-sm ring-2 ring-primary/50 shadow-[0_0_40px_rgba(201,162,39,0.2)]"
                            : "max-w-xs ring-1 ring-primary/20 sm:max-w-sm"
                        }`}
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
                            className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.03]"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-primary/20">
                            <Package className="h-16 w-16" strokeWidth={0.9} />
                          </div>
                        )}
                        {/* Voile très léger bas */}
                        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-black/50 to-transparent" />
                        <ProductBadges badges={badges} />
                      </div>
                      {/* Légende discrète sous l’image */}
                      <p className="mt-3 text-center font-mono text-[10px] uppercase tracking-[0.3em] text-primary/50">
                        {product.symbol || product.number
                          ? [product.symbol, product.number].filter(Boolean).join(" · ")
                          : "Édition catalogue"}
                      </p>
                    </div>

                    {/* Fiche produit — typo luxe, options en liste */}
                    <div className="flex w-full flex-1 flex-col justify-center md:max-w-md md:py-4">
                      <p className="mb-3 text-[10px] font-medium uppercase tracking-[0.35em] text-primary/70">
                        {out ? "Indisponible" : `En stock · ${product.stock}`}
                      </p>

                      <h3
                        className={`font-display font-medium uppercase leading-tight tracking-[0.12em] text-[#f5f0e6] ${
                          featured
                            ? "text-xl sm:text-2xl"
                            : "text-lg sm:text-xl"
                        }`}
                      >
                        {product.title}
                      </h3>

                      {product.description && (
                        <p className="mt-4 max-w-sm text-sm leading-relaxed text-zinc-400">
                          {product.description}
                        </p>
                      )}

                      {/* Options — liste élégante type catalogue */}
                      {!out && avail.length > 0 && (
                        <div className="mt-8">
                          <p className="mb-3 text-[10px] font-medium uppercase tracking-[0.35em] text-zinc-500">
                            Choisir une option
                          </p>
                          <ul className="divide-y divide-primary/10 border-y border-primary/15">
                            {avail.map(({ v, idx }) => {
                              const price = effectivePrice(v.price, product)
                              const isOn = idx === activeIdx
                              const discounted = price !== v.price
                              return (
                                <li key={`${product.id}-${idx}`}>
                                  <button
                                    type="button"
                                    onClick={() =>
                                      setCardVariant((prev) => ({
                                        ...prev,
                                        [product.id]: idx,
                                      }))
                                    }
                                    className={`flex w-full items-center justify-between gap-4 py-3.5 text-left transition-colors ${
                                      isOn
                                        ? "bg-primary/[0.06] text-primary"
                                        : "text-zinc-300 hover:bg-white/[0.02] hover:text-white"
                                    }`}
                                  >
                                    <span className="flex items-center gap-3">
                                      <span
                                        className={`flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded-full border ${
                                          isOn
                                            ? "border-primary"
                                            : "border-zinc-600"
                                        }`}
                                        aria-hidden="true"
                                      >
                                        {isOn && (
                                          <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                                        )}
                                      </span>
                                      <span className="text-sm tracking-wide">
                                        Quantité ×{v.qty}
                                      </span>
                                    </span>
                                    <span className="font-display text-sm tracking-wider">
                                      {price.toFixed(2)} €
                                      {discounted && (
                                        <span className="ml-2 text-xs text-zinc-600 line-through">
                                          {v.price.toFixed(2)} €
                                        </span>
                                      )}
                                    </span>
                                  </button>
                                </li>
                              )
                            })}
                          </ul>
                        </div>
                      )}

                      {/* Prix sélection + CTA */}
                      <div className="mt-8 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
                        {!out && active ? (
                          <div>
                            <p className="text-[10px] uppercase tracking-[0.3em] text-zinc-500">
                              Total sélection
                            </p>
                            <p
                              className={`mt-1 font-display font-medium tracking-wide text-primary ${
                                featured ? "text-2xl sm:text-3xl" : "text-2xl"
                              }`}
                            >
                              {effectivePrice(active.v.price, product).toFixed(2)}
                              <span className="ml-1 text-base">€</span>
                            </p>
                          </div>
                        ) : (
                          <div />
                        )}

                        <div className="flex flex-col gap-2 sm:items-end">
                          {out ? (
                            <button
                              type="button"
                              onClick={() => {
                                if (!alerted[product.id]) requestAlert(product)
                              }}
                              disabled={alerting === product.id || alerted[product.id]}
                              className="inline-flex items-center justify-center gap-2 border border-primary/40 px-6 py-3 text-[11px] font-medium uppercase tracking-[0.25em] text-primary transition-colors hover:bg-primary/10 disabled:opacity-60"
                            >
                              {alerted[product.id] ? (
                                <>
                                  <BellRing className="h-3.5 w-3.5" />
                                  Alerte activée
                                </>
                              ) : (
                                <>
                                  <BellPlus className="h-3.5 w-3.5" />
                                  {alerting === product.id ? "…" : "Me prévenir"}
                                </>
                              )}
                            </button>
                          ) : (
                            <>
                              <button
                                type="button"
                                onClick={(e) => handleAddFromCard(product, e)}
                                disabled={addingId === product.id || !avail.length}
                                className="inline-flex min-w-[200px] items-center justify-center bg-primary px-8 py-3.5 text-[11px] font-semibold uppercase tracking-[0.28em] text-black transition-all hover:bg-[var(--gold-soft)] hover:shadow-[0_0_28px_rgba(201,162,39,0.35)] disabled:opacity-50"
                              >
                                {addingId === product.id ? "…" : "Ajouter au panier"}
                              </button>
                              <button
                                type="button"
                                onClick={() => openModal(product, activeIdx)}
                                className="text-[10px] font-medium uppercase tracking-[0.3em] text-zinc-500 underline-offset-4 transition-colors hover:text-primary hover:underline"
                              >
                                Voir les détails
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </article>
              )
            })}
          </div>
        )}
      </section>

      {/* Modal détails — même esprit luxe */}
      {isModalOpen && selected && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/92 p-4 backdrop-blur-md"
          onClick={closeModal}
        >
          <div
            className="relative flex max-h-[90dvh] w-full max-w-3xl flex-col overflow-hidden border border-primary/25 bg-[#0a0a0a] md:flex-row"
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
              className="absolute right-4 top-4 z-50 border border-white/10 bg-black/60 p-2 text-white/50 hover:text-white"
              aria-label="Fermer"
            >
              <CloseIcon className="h-5 w-5" />
            </button>

            <div className="relative z-20 flex w-full items-center justify-center border-b border-primary/10 bg-[#060606] p-8 md:w-1/2 md:border-b-0 md:border-r md:p-12">
              <div className="relative aspect-[4/5] w-full max-w-[280px] overflow-hidden ring-1 ring-primary/20">
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

            <div className="relative z-20 flex w-full flex-col justify-center overflow-y-auto p-8 pb-safe md:w-1/2 md:p-12">
              {selected.number && (
                <span className="mb-3 font-mono text-[10px] uppercase tracking-[0.35em] text-primary/80">
                  Réf. {selected.number}
                </span>
              )}
              <h3 className="font-display text-2xl font-medium uppercase tracking-[0.14em] text-[#f5f0e6] md:text-3xl">
                {selected.title}
              </h3>
              <p className="mt-4 text-sm leading-relaxed text-zinc-400">
                {selected.fullDescription || selected.description}
              </p>

              <p className="mb-2 mt-8 text-[10px] font-medium uppercase tracking-[0.35em] text-zinc-500">
                Options
              </p>
              <ul className="mb-6 divide-y divide-primary/10 border-y border-primary/15">
                {selected.variants.map((v: ProductVariant, i: number) => {
                  if (v.qty > selected.stock) return null
                  const price = effectivePrice(v.price, selected)
                  const isOn = i === variantIdx
                  return (
                    <li key={`${v.qty}-${i}`}>
                      <button
                        type="button"
                        onClick={() => setVariantIdx(i)}
                        className={`flex w-full items-center justify-between py-3 text-left text-sm transition-colors ${
                          isOn ? "text-primary" : "text-zinc-300 hover:text-white"
                        }`}
                      >
                        <span className="flex items-center gap-3">
                          <span
                            className={`h-3.5 w-3.5 rounded-full border ${
                              isOn ? "border-primary bg-primary/30" : "border-zinc-600"
                            }`}
                          />
                          ×{v.qty}
                        </span>
                        <span className="font-display tracking-wider">
                          {price.toFixed(2)} €
                          {price !== v.price && (
                            <span className="ml-2 text-xs text-zinc-600 line-through">
                              {v.price.toFixed(2)} €
                            </span>
                          )}
                        </span>
                      </button>
                    </li>
                  )
                })}
              </ul>

              <p className="mb-6 font-display text-3xl font-medium text-primary">
                {selected.variants[variantIdx]
                  ? effectivePrice(selected.variants[variantIdx].price, selected).toFixed(2)
                  : "0.00"}{" "}
                €
              </p>

              <button
                onClick={handleAdd}
                className="w-full bg-primary py-4 text-[11px] font-semibold uppercase tracking-[0.28em] text-black transition-all hover:bg-[var(--gold-soft)]"
              >
                Ajouter au panier
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
