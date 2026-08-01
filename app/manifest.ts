import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "L'Empire des Légendes — Collection Premium",
    short_name: 'Empire',
    description:
      "Le Plug des Truands — L'Empire des Légendes. Produits de qualité toute l'année. Qualité premium, livraison discrète, sur place.",
    start_url: '/',
    display: 'standalone',
    background_color: '#050505',
    theme_color: '#c9a227',
    icons: [
      {
        src: '/images/icon-maskable-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/images/icon-maskable-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
    ],
  }
}
