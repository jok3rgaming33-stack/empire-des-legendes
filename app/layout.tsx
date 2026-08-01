import { Analytics } from '@vercel/analytics/next'
import type { Metadata, Viewport } from 'next'
import { Geist, Geist_Mono, Cinzel } from 'next/font/google'
import './globals.css'

const geistSans = Geist({ variable: '--font-geist-sans', subsets: ['latin'] })
const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
})
const cinzel = Cinzel({
  variable: '--font-cinzel',
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
})

export const metadata: Metadata = {
  title: "L'Empire des Légendes — Collection Premium",
  description:
    "Le Plug des Truands — L'Empire des Légendes. Produits de qualité toute l'année. Qualité premium, livraison discrète, sur place.",
  generator: 'v0.app',
  manifest: '/manifest.webmanifest',
  icons: {
    icon: [{ url: '/images/icon-maskable-512.png', type: 'image/png' }],
    shortcut: '/images/icon-maskable-512.png',
    apple: '/images/icon-maskable-512.png',
  },
}

export const viewport: Viewport = {
  colorScheme: 'dark',
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#050505' },
    { media: '(prefers-color-scheme: dark)', color: '#050505' },
  ],
  // Expose les safe-area-inset-* pour éviter que la barre nav mobile recouvre le contenu.
  viewportFit: 'cover',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="fr"
      className={`${geistSans.variable} ${geistMono.variable} ${cinzel.variable} bg-background`}
    >
      <body className="font-sans antialiased">
        {children}
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}
