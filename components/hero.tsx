"use client"

import Image from "next/image"
import { Crown, Shield, Lock, Sparkles } from "lucide-react"

const TRUST = [
  { icon: Shield, label: "Qualité Premium" },
  { icon: Lock, label: "Livraison Discrète" },
  { icon: Crown, label: "Sur place" },
]

export function Hero() {
  const scrollToShop = () => {
    document.getElementById("featured")?.scrollIntoView({ behavior: "smooth" })
  }

  return (
    <section className="relative flex min-h-[78vh] items-center overflow-hidden md:min-h-[88vh]">
      {/* Fond maquette Empire des Légendes */}
      <Image
        src="/images/hero-empire.jpg"
        alt="L'Empire des Légendes — collection premium"
        fill
        className="object-cover object-center"
        priority
        sizes="100vw"
      />

      {/* Voiles pour lisibilité du texte à gauche */}
      <div className="absolute inset-0 z-10 bg-gradient-to-r from-black via-black/85 to-black/25" />
      <div className="absolute inset-0 z-10 bg-gradient-to-t from-[#050505] via-transparent to-black/40" />
      <div className="absolute inset-x-0 bottom-0 z-10 h-32 bg-gradient-to-t from-[#050505] to-transparent" />

      {/* Contenu */}
      <div className="relative z-20 mx-auto w-full max-w-7xl px-5 py-28 sm:px-8 lg:px-10">
        <div className="max-w-xl lg:max-w-2xl">
          <p className="mb-4 text-[11px] font-semibold uppercase tracking-[0.35em] text-primary/90">
            Le Plug des Truands
          </p>

          <h1 className="font-display text-[clamp(2.1rem,5.5vw,3.75rem)] font-bold leading-[1.05] tracking-wide text-primary drop-shadow-[0_2px_24px_rgba(0,0,0,0.8)]">
            <span className="block">Pablo Escobar</span>
            <span className="my-1 flex items-center gap-3 text-[0.72em]">
              <span className="h-px flex-1 max-w-8 bg-primary/50" aria-hidden="true" />
              Totorina
              <span className="h-px flex-1 max-w-8 bg-primary/50" aria-hidden="true" />
            </span>
            <span className="block">El Chapo Guzmán</span>
          </h1>

          <p className="mt-5 text-sm font-medium uppercase tracking-[0.28em] text-white/75 md:text-base">
            Légendaires. Redoutés. Inoubliables.
          </p>

          <div className="mt-8 flex items-center gap-3">
            <Crown className="h-6 w-6 text-primary" strokeWidth={1.5} aria-hidden="true" />
            <div>
              <p className="font-display text-lg font-semibold uppercase tracking-[0.18em] text-primary md:text-xl">
                L&apos;Empire des Légendes
              </p>
              <p className="text-[11px] uppercase tracking-[0.28em] text-white/55">
                Produits de qualité toute l&apos;année
              </p>
            </div>
          </div>

          <div className="mt-10 flex flex-wrap items-center gap-4">
            <button type="button" onClick={scrollToShop} className="btn-gold">
              Découvrir la collection
              <span aria-hidden="true">→</span>
            </button>
            <span className="badge-premium h-16 w-16 text-[8px] font-bold uppercase leading-tight tracking-wider">
              <Sparkles className="mb-0.5 h-3.5 w-3.5" aria-hidden="true" />
              Qualité
              <br />
              Premium
            </span>
          </div>

          <ul className="mt-10 flex flex-wrap gap-x-6 gap-y-3">
            {TRUST.map(({ icon: Icon, label }) => (
              <li
                key={label}
                className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-white/70"
              >
                <Icon className="h-3.5 w-3.5 text-primary" aria-hidden="true" />
                {label}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  )
}
