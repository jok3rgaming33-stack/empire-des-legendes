# L'Empire des Légendes — Style & Rebrand

## Recommandation A vs B

Pour une **vitrine commerciale** : **hybride A + B** (retenu).

| | Contenu |
|---|---|
| **A** | Même stack & fonctionnalités (panier, commandes, admin, KYC, messagerie, fidélité…) |
| **B** | Rebrand UI + wording vitrine (noir / or, marque, hero, cards) sans réécrire le métier |

- Pas de refonte backend.
- Admin pseudo `Heisenberg` **conservé** en interne (auth) — libellé UI « administrateur ».
- Codes fidélité `BB33-` : logique inchangée (compat données existantes).

## Identité visuelle

| Token | Valeur |
|--------|--------|
| Fond | `#050505` |
| Or principal | `#c9a227` |
| Or clair | `#e0c35a` |
| Or profond | `#8a6d12` |
| Texte | `#f5f0e6` |
| Typo titres | Cinzel (`font-display`) |
| Typo corps | Geist |

## Assets style (maquettes)

- Source : `demo bb/public/acceuil.jpg` + `index.jpg`
- Projet : `public/images/hero-empire.jpg` (hero + login)

## Fichiers UI touchés (principaux)

- `app/globals.css` — design tokens
- `app/layout.tsx` / `app/manifest.ts` — métadonnées
- `components/hero.tsx`, `navbar.tsx`, `bb-logo.tsx`
- `components/product-section.tsx`, `shop-sections.tsx`
- `components/login-page.tsx`
- Remplacements couleur `#3e6757` → `#c9a227` (composants restants)

## Lancer en local

```bash
cd "C:\Users\djedu\Desktop\site\access-main-hero-src"
pnpm install   # ou npm install
pnpm dev       # ou npm run dev
```

Variables d’env (Neon, Blob, Turnstile, etc.) : mêmes que l’ancien projet.
