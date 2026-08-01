"use client"

import Image from "next/image"

/**
 * Atmosphère boutique : hero-empire en fond (fixé), semi-transparent,
 * pour ne plus bloquer la vue sur les produits.
 * Les produits restent au premier plan avec un voile sombre lisible.
 */
export function Hero() {
  return (
    <div
      className="pointer-events-none fixed inset-0 z-0 overflow-hidden"
      aria-hidden="true"
    >
      {/* Image de marque en fond — faible opacité */}
      <Image
        src="/hero-empire.jpg"
        alt=""
        fill
        className="object-cover object-center opacity-[0.22] saturate-[0.85]"
        priority
        sizes="100vw"
      />
      {/* Voile pour lisibilité des produits (catalogue au-dessus) */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/75 via-[#050505]/88 to-[#050505]/95" />
      {/* Halo or très léger en haut */}
      <div className="absolute inset-x-0 top-0 h-[40vh] bg-[radial-gradient(ellipse_at_top,rgba(201,162,39,0.08),transparent_65%)]" />
    </div>
  )
}

/**
 * Bandeau d’intro compact (optionnel) — ne prend presque pas de place.
 * Scroll immédiat vers le catalogue.
 */
export function ShopIntroStrip() {
  const scrollToShop = () => {
    document.getElementById("featured")?.scrollIntoView({ behavior: "smooth" })
  }

  return (
    <section className="relative z-10 border-b border-primary/15 pt-[max(5rem,calc(env(safe-area-inset-top,0px)+4.25rem))] pb-5 sm:pb-6">
      <div className="mx-auto flex max-w-[920px] flex-col items-center gap-2.5 px-4 text-center sm:px-6">
        <p className="text-[10px] font-medium uppercase tracking-[0.4em] text-primary/80">
          Le Plug des Truands
        </p>
        <h1 className="font-display text-base font-medium uppercase tracking-[0.22em] text-[#f5f0e6] sm:text-lg">
          L&apos;Empire des Légendes
        </h1>
        <button
          type="button"
          onClick={scrollToShop}
          className="mt-0.5 min-h-[44px] px-3 text-[10px] font-medium uppercase tracking-[0.3em] text-zinc-500 underline-offset-4 transition-colors hover:text-primary hover:underline"
        >
          Voir la collection
        </button>
      </div>
    </section>
  )
}
