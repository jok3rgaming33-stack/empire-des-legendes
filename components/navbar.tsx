"use client"

import { useState } from "react"
import { useCart } from "@/components/cart-provider"
import { NotificationBell } from "@/components/notification-bell"
import { Menu, ShoppingCart, X, ShieldCheck, LogOut, HelpCircle, Crown } from "lucide-react"

const NAV_ITEMS = [
  { label: "Boutique", action: "featured" as const },
  { label: "Messagerie", action: "messaging" as const },
  { label: "Livraison", action: "delivery" as const },
  { label: "Mes commandes", action: "orders" as const },
  { label: "Fidélité", action: "loyalty" as const },
  { label: "Comment ça marche", action: "howitworks" as const },
]

type NavbarProps = {
  isLoggedIn?: boolean
  onLogout?: () => void
  onOpenDashboard?: () => void
  onOpenLoyalty?: () => void
  onOpenOrders?: () => void
  onOpenDelivery?: () => void
  onOpenMessaging?: () => void
  onOpenHowItWorks?: () => void
  isAdmin?: boolean
  unreadMessaging?: number
  unreadOrders?: number
}

export function Navbar({
  isLoggedIn,
  onLogout,
  onOpenLoyalty,
  onOpenOrders,
  onOpenDelivery,
  onOpenMessaging,
  onOpenHowItWorks,
  isAdmin,
  unreadMessaging = 0,
  unreadOrders = 0,
}: NavbarProps) {
  const { count, openCart } = useCart()
  const [open, setOpen] = useState(false)

  const handleNavClick = (e: React.MouseEvent, item: (typeof NAV_ITEMS)[number]) => {
    if (item.action === "featured") {
      e.preventDefault()
      setOpen(false)
      document.getElementById("featured")?.scrollIntoView({ behavior: "smooth" })
    } else if (item.action === "messaging") {
      e.preventDefault()
      setOpen(false)
      onOpenMessaging?.()
    } else if (item.action === "loyalty") {
      e.preventDefault()
      setOpen(false)
      onOpenLoyalty?.()
    } else if (item.action === "orders") {
      e.preventDefault()
      setOpen(false)
      onOpenOrders?.()
    } else if (item.action === "delivery") {
      e.preventDefault()
      setOpen(false)
      onOpenDelivery?.()
    } else if (item.action === "howitworks") {
      e.preventDefault()
      setOpen(false)
      onOpenHowItWorks?.()
    }
  }

  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-[rgba(201,162,39,0.2)] bg-black/85 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        {/* Logo marque */}
        <a href="#" className="flex shrink-0 items-center gap-2" aria-label="L'Empire des Légendes">
          <Crown
            className="h-6 w-6 text-primary drop-shadow-[0_0_10px_rgba(201,162,39,0.45)]"
            strokeWidth={1.5}
            aria-hidden="true"
          />
          <span className="font-display text-[11px] font-semibold uppercase tracking-[0.16em] text-primary sm:text-xs md:text-sm">
            L&apos;Empire des Légendes
          </span>
        </a>

        {/* Desktop Navigation */}
        <nav className="hidden items-center gap-6 lg:flex">
          {NAV_ITEMS.map((item) => {
            const badge =
              item.action === "messaging"
                ? unreadMessaging
                : item.action === "orders"
                  ? unreadOrders
                  : 0
            return (
              <a
                key={item.label}
                href="#"
                onClick={(e) => handleNavClick(e, item)}
                className={
                  item.action === "howitworks"
                    ? "flex items-center gap-1.5 rounded-sm border border-primary/40 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.15em] text-primary/90 transition-colors hover:border-primary hover:bg-primary/10 hover:text-primary"
                    : "relative flex items-center gap-1 text-[11px] font-medium uppercase tracking-[0.18em] text-white/55 transition-colors hover:text-primary"
                }
              >
                {item.action === "howitworks" && (
                  <HelpCircle className="h-3.5 w-3.5" aria-hidden="true" />
                )}
                {item.label}
                {badge > 0 && (
                  <span
                    className="ml-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-primary px-1 text-[9px] font-bold leading-none text-black"
                    aria-label={`${badge} non lu${badge > 1 ? "s" : ""}`}
                  >
                    {badge > 9 ? "9+" : badge}
                  </span>
                )}
              </a>
            )
          })}
          {isAdmin && (
            <a
              href="/admin"
              className="flex items-center gap-1.5 rounded-sm bg-primary px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.15em] text-primary-foreground transition-opacity hover:opacity-90"
            >
              <ShieldCheck className="h-3.5 w-3.5" aria-hidden="true" />
              Panel Admin
            </a>
          )}
        </nav>

        <div className="flex items-center gap-2 sm:gap-3">
          {isLoggedIn && !isAdmin && <NotificationBell onOpenOrder={onOpenOrders} />}

          <button
            onClick={openCart}
            className="flex items-center gap-2 rounded-sm px-2 py-1.5 text-sm font-medium text-white/80 transition-colors hover:bg-primary/10 hover:text-primary sm:px-3"
            aria-label="Panier"
          >
            <span className="hidden text-[11px] font-semibold uppercase tracking-[0.15em] sm:inline">
              Panier
            </span>
            <div className="relative flex h-8 w-8 items-center justify-center">
              <ShoppingCart className="h-5 w-5" />
              {count > 0 && (
                <span className="absolute -right-1 -top-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold text-black">
                  {count}
                </span>
              )}
            </div>
          </button>

          {isLoggedIn && !isAdmin && (
            <button
              onClick={() => onLogout?.()}
              className="hidden items-center gap-1.5 rounded-sm border border-primary/25 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.15em] text-white/70 transition-colors hover:border-primary/50 hover:text-primary lg:flex"
              aria-label="Se déconnecter"
            >
              <LogOut className="h-3.5 w-3.5" aria-hidden="true" />
              Déconnexion
            </button>
          )}

          <button
            onClick={() => setOpen(!open)}
            className="relative flex h-9 w-9 items-center justify-center rounded-sm text-foreground lg:hidden"
            aria-label={`Menu${unreadMessaging + unreadOrders > 0 ? ` — ${unreadMessaging + unreadOrders} notification${unreadMessaging + unreadOrders > 1 ? "s" : ""}` : ""}`}
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            {!open && unreadMessaging + unreadOrders > 0 && (
              <span
                className="absolute -right-0.5 -top-0.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-primary px-1 text-[9px] font-bold leading-none text-black"
                aria-hidden="true"
              >
                {unreadMessaging + unreadOrders > 9 ? "9+" : unreadMessaging + unreadOrders}
              </span>
            )}
          </button>
        </div>
      </div>

      {open && (
        <nav className="border-t border-primary/20 bg-black/95 px-4 py-4 lg:hidden">
          <div className="flex flex-col gap-1">
            {NAV_ITEMS.map((item) => {
              const badge =
                item.action === "messaging"
                  ? unreadMessaging
                  : item.action === "orders"
                    ? unreadOrders
                    : 0
              return (
                <a
                  key={item.label}
                  href="#"
                  onClick={(e) => handleNavClick(e, item)}
                  className={
                    item.action === "howitworks"
                      ? "mt-1 flex items-center gap-2 rounded-sm border border-primary/40 px-3 py-2 text-sm font-semibold uppercase tracking-wide text-primary transition-colors hover:bg-primary/10"
                      : "flex items-center justify-between rounded-sm px-3 py-2 text-sm font-medium uppercase tracking-wide text-white/60 transition-colors hover:bg-primary/10 hover:text-primary"
                  }
                >
                  <span className="flex items-center gap-2">
                    {item.action === "howitworks" && (
                      <HelpCircle className="h-4 w-4" aria-hidden="true" />
                    )}
                    {item.label}
                  </span>
                  {badge > 0 && (
                    <span
                      className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-primary px-1.5 text-[10px] font-bold text-black"
                      aria-label={`${badge} non lu${badge > 1 ? "s" : ""}`}
                    >
                      {badge > 9 ? "9+" : badge}
                    </span>
                  )}
                </a>
              )
            })}
            {isAdmin && (
              <a
                href="/admin"
                className="mt-1 flex items-center gap-2 rounded-sm bg-primary px-3 py-2 text-sm font-semibold uppercase tracking-wide text-primary-foreground"
              >
                <ShieldCheck className="h-4 w-4" aria-hidden="true" />
                Panel Admin
              </a>
            )}
            {isLoggedIn && !isAdmin && (
              <button
                type="button"
                onClick={() => {
                  setOpen(false)
                  onLogout?.()
                }}
                className="mt-1 flex items-center gap-2 rounded-sm px-3 py-2 text-sm font-medium uppercase tracking-wide text-white/60 transition-colors hover:bg-primary/10 hover:text-primary"
              >
                <LogOut className="h-4 w-4" aria-hidden="true" />
                Déconnexion
              </button>
            )}
          </div>
        </nav>
      )}
    </header>
  )
}
