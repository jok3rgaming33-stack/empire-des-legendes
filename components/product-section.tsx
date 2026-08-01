"use client"

import { useState, useEffect } from "react"
import useSWR from "swr"
import { useCart } from "@/components/cart-provider"
import Image from "next/image"
import { Crown, Sparkles, X as CloseIcon } from "lucide-react"
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
  // Extrait l'URL brute d'une URL proxy (/api/media?url=...) ou retourne telle quelle.
  const normalize = (u: string) => {
    if (u.startsWith("/api/media?")) {
      try { return new URLSearchParams(u.slice(u.indexOf("?"))).get("url") ?? u } catch { return u }
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

export function ProductSection({ config }: { config: SectionConfig }) {
  const { addToCart } = useCart()
  const { data: products, mutate } = useSWR(`products:${config.section}`, () => getProductsBySection(config.section), {
    revalidateOnFocus: false,
  })

  const [selected, setSelected] = useState<Product | null>(null)
  const [variantIdx, setVariantIdx] = useState(0)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isAnimating, setIsAnimating] = useState(false)
  // Produits pour lesquels le client a activé une alerte de disponibilité.
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

  const openModal = (product: Product) => {
    setSelected(product)
    setVariantIdx(0)
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
    ? { id: config.anchor, className: "mx-auto max-w-[1200px] px-4 pb-20 pt-14 scroll-mt-24" }
    : { className: "mx-auto max-w-[1200px] px-4 py-16" }

  const handleAdd = async () => {
    if (!selected) return
    const v = selected.variants[variantIdx]
    if (!v) return
    const price = effectivePrice(v.price, selected)
    addToCart(`${selected.title} ×${v.qty}`, price)
    // Décrémente le stock en base et rafraîchit l'affichage (temps réel).
    await decrementStock(selected.id, 1)
    mutate()
    closeModal()
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
          <div className={`grid gap-6 ${config.gridCols}`}>
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-72 animate-pulse rounded-sm border border-primary/20 bg-[#0a0a0a]" />
            ))}
          </div>
        ) : products.length === 0 ? (
          <p className="py-10 text-center text-sm text-muted-foreground">
            Aucun produit dans cette section pour le moment.
          </p>
        ) : (
          <div className={`grid gap-6 ${config.gridCols}`}>
            {products.map((product) => {
              const badges = resolveBadges(product.badges, product.stock)
              const out = product.stock <= 0
              const minPrice = product.variants.length
                ? Math.min(...product.variants.map((v) => effectivePrice(v.price, product)))
                : 0
              return (
                <div
                  key={product.id}
                  onClick={() => !out && openModal(product)}
                  className={`card-gold group relative flex flex-col ${
                    out ? "cursor-not-allowed opacity-50" : "cursor-pointer"
                  }`}
                >
                  {/* Zone image/video — couvre tout le haut de la card */}
                  {(() => {
                    // Fallback : si image principale est null, prendre le premier média
                    const mainUrl = product.image || product.media?.[0]?.url || null
                    const mainType = mainUrl
                      ? (getMediaType(mainUrl, product.media) ??
                        product.media?.find((m) => m.url === mainUrl)?.type)
                      : undefined
                    return (
                      <div className="relative aspect-[4/5] w-full overflow-hidden bg-[#111]">
                        {mainUrl ? (
                          <BlobMedia
                            src={mainUrl}
                            alt={product.title}
                            mediaType={mainType}
                            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-primary/30">
                            <Crown className="h-12 w-12" strokeWidth={1} />
                          </div>
                        )}
                        {/* Dégradé bas pour lisibilité du contenu */}
                        <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-[#0a0a0a] to-transparent" />
                        {/* Badges superposés en haut à droite */}
                        <ProductBadges badges={badges} />
                      </div>
                    )
                  })()}

                  {/* Zone contenu */}
                  <div className="flex flex-col gap-2 p-4">
                    {product.symbol && (
                      <span className="font-mono text-[10px] uppercase tracking-[0.25em] text-primary">
                        {product.symbol}
                      </span>
                    )}
                    <h3 className="font-display text-sm font-semibold uppercase leading-tight tracking-wide text-white">
                      {product.title}
                    </h3>
                    <p className="text-sm font-semibold text-primary">
                      {out ? "Rupture de stock" : `${minPrice.toFixed(2)} €`}
                    </p>
                    {!out && (
                      <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
                        Stock {product.stock}
                      </p>
                    )}
                    {out ? (
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          if (!alerted[product.id]) requestAlert(product)
                        }}
                        disabled={alerting === product.id || alerted[product.id]}
                        className="mt-1 flex w-full items-center justify-center gap-1.5 rounded-sm border border-primary/50 bg-primary/10 py-2.5 text-[11px] font-semibold uppercase tracking-wider text-primary transition-colors hover:bg-primary/20 disabled:opacity-70"
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
                      <button className="btn-gold mt-1 w-full py-2.5 text-[10px]">
                        Ajouter au panier
                      </button>
                    )}
                  </div>
                </div>
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
            className="relative flex w-full max-w-2xl max-h-[90dvh] flex-col overflow-hidden rounded-sm border border-primary/30 bg-[#0a0a0a] md:flex-row"
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

            <button onClick={closeModal} className="absolute right-6 top-6 z-50 text-white/50 hover:text-white">
              <CloseIcon className="h-6 w-6" />
            </button>

            <div className="relative z-20 flex w-full items-center justify-center bg-[#050505]/50 p-6 md:w-1/2 md:p-12">
              <div className="relative h-40 w-40 md:h-64 md:w-64">
                {selected.image && (
                  <BlobMedia
                    src={selected.image}
                    alt={selected.title}
                    mediaType={getMediaType(selected.image, selected.media)}
                    className="h-full w-full object-contain"
                  />
                )}
              </div>
            </div>

            <div className="relative z-20 flex w-full flex-col justify-center overflow-y-auto p-8 pb-safe md:w-1/2 md:p-12">
              {selected.number && (
                <span className="mb-2 font-mono text-xs uppercase tracking-[0.2em] text-primary">
                  Code {selected.number}
                </span>
              )}
              <h3 className="mb-4 font-display text-3xl font-bold uppercase tracking-wide text-white md:text-4xl">
                {selected.title}
              </h3>
              <p className="mb-6 leading-relaxed text-zinc-400">
                {selected.fullDescription || selected.description}
              </p>

              <label
                htmlFor="variant-select"
                className="mb-2 block text-xs font-medium uppercase tracking-[0.2em] text-primary"
              >
                Quantité
              </label>
              <select
                id="variant-select"
                value={variantIdx}
                onChange={(e) => setVariantIdx(Number(e.target.value))}
                className="mb-6 w-full rounded-sm border border-primary/25 bg-[#050505] px-4 py-3 text-sm text-white outline-none transition-colors focus:border-primary"
              >
                {selected.variants.map((v: ProductVariant, i: number) => {
                  // On n'affiche que les variantes que le stock peut couvrir.
                  if (v.qty > selected.stock) return null
                  return (
                    <option key={`${v.qty}-${i}`} value={i}>
                      {v.qty} — {effectivePrice(v.price, selected)}€
                      {effectivePrice(v.price, selected) !== v.price
                        ? ` (au lieu de ${v.price}€)`
                        : ""}
                    </option>
                  )
                })}
              </select>

              <div className="mb-6 text-2xl font-semibold text-primary">
                {selected.variants[variantIdx]
                  ? effectivePrice(selected.variants[variantIdx].price, selected)
                  : 0}
                €
              </div>

              <button onClick={handleAdd} className="btn-gold w-full py-4">
                Ajouter au panier
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
