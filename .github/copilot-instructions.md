# Copilot Instructions — Frontend

## Stack

Next.js 16 · React 19 · TypeScript 5 (strict) · Tailwind CSS 4

## Commands (run from repo root)

```bash
npm run dev    # Dev server → http://localhost:3000
npm run build  # Production build
npm run lint   # ESLint check
```

## Project Layout

```
src/app/      # App Router — all routes live here
  layout.tsx  # Root layout
  page.tsx    # Home page
  globals.css # Global styles (Tailwind import here)
public/       # Static assets
```

## Key Conventions

- **App Router only** — do not use the Pages Router (`pages/` directory).
- **Path alias**: `@/` maps to the project root (`./`). Use `@/components/...`, `@/lib/...` etc.
- **Tailwind CSS v4** uses `@import "tailwindcss"` syntax — not `@tailwind base/components/utilities`.
- **TypeScript strict mode is on**. Avoid `any`; use proper types or `unknown`.
- **Environment variables**: prefix with `NEXT_PUBLIC_` for client-accessible vars. Copy `.env.local.example` → `.env.local`.
- **⚠️ Next.js 16 has breaking changes** from earlier versions. Before using any Next.js API (routing, metadata, data fetching, image, etc.), check `node_modules/next/dist/docs/` — do not rely on pre-16 patterns.
- No state management library is installed yet. Use React built-ins (`useState`, `useContext`) until one is added.
