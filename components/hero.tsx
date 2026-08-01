"use client"

import Image from "next/image"

/**
 * Hero = bannière image complète (textes graphiques déjà dans hero-empire.jpg).
 * On n'empile plus de titres HTML par-dessus pour éviter le doublon.
 * Seule la zone CTA reste cliquable (scroll boutique).
 */
export function Hero() {
  const scrollToShop = () => {
    document.getElementById("featured")?.scrollIntoView({ behavior: "smooth" })
  }

  return (
    <section className="relative w-full overflow-hidden border-b border-primary/20">
      {/* Ratio large type bannière (approx 16:9 / maquette) */}
      <div className="relative mx-auto w-full max-w-[1600px]">
        <div className="relative aspect-[16/9] w-full min-h-[280px] sm:min-h-[360px] md:min-h-[420px] lg:min-h-[520px]">
          <Image
            src="/images/hero-empire.jpg"
            alt="L'Empire des Légendes — Le Plug des Truands"
            fill
            className="object-cover object-center"
            priority
            sizes="100vw"
          />

          {/* Zone cliquable discrète sur le bouton "Découvrir" de l'image (bas-gauche) */}
          <button
            type="button"
            onClick={scrollToShop}
            className="absolute bottom-[10%] left-[4%] z-10 h-[12%] w-[28%] max-w-[280px] min-h-[44px] cursor-pointer rounded-sm bg-transparent"
            aria-label="Découvrir la collection"
          />
        </div>
      </div>

      {/* Dégradé bas pour coller au fond boutique */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-[#050505] to-transparent" />
    </section>
  )
}
