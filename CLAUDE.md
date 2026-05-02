@AGENTS.md

# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Personal rules (non-negotiable)

- Do not use em dashes in normal prose, comments, documentation, or commit messages unless I explicitly ask.
- Do not write tests unless explicitly asked.
- Do not add `Co-authored-by` trailers unless I explicitly ask.
- Never commit or push unless I explicitly ask.
- Correct me if I misuse terms, especially when I question them in parentheses.

## Project

Next.js 16 + React 19 + Tailwind v4 frontend for a Udemy-clone study platform ("Nexo4you"). It talks to a Django REST backend whose base URL is read from `NEXT_PUBLIC_API_URL` (default `http://localhost:8000/api/v1/`, set in `.env.local`). The backend issues JWT access/refresh tokens; this app stores them in cookies and uses them from both Server Actions and a client-side axios instance.

## Commands

```
npm run dev      # start the dev server
npm run build    # production build
npm run start    # serve the production build
npm run lint     # eslint (flat config in eslint.config.mjs)
npm run format   # prettier --write . (printWidth 100, 2 spaces, LF)
```

There are no tests.

## Next.js 16 specifics (read before writing routing code)

This project pins `next@16.2.1`. Anything you "remember" about Next.js may be stale. Two concrete differences that bite:

- **`src/proxy.ts`, not `middleware.ts`.** In Next 16 the middleware file convention was renamed to `proxy`. Export a function named `proxy` (or default) plus a `config` with `matcher`. Authoritative reference: `node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/proxy.md`.
- **`cookies()` is async.** All server code in `src/shared/api/authCookies.ts` does `const jar = await cookies();` and the file is a `"use server"` module so its functions are Server Actions usable from client components.

Per `AGENTS.md`, when in doubt about any Next API, read the relevant page under `node_modules/next/dist/docs/` rather than guessing.

## Architecture

### Layout (feature-sliced)

```
src/
  app/
    (authentication)/    # login, register/(check-email|verify-email), forgot-password, reset-password
    (errors)/            # 403
    (public)/            # /, /catalog, /coming-soon, plus shared (public) layout
    dashboard/           # student/teacher landing
    layout.tsx           # root layout (fonts, metadata)
    globals.css          # Tailwind v4 + brand tokens + keyframes
  features/
    auth/                # api/, model/(types,validation), ui/(forms,AuthField,AuthShell,AuthPanel,DateOfBirthPicker,UserDropdown,withAuth), actions/(logout)
    courses/             # api/, model/types, ui/(CourseCard, CourseSearch, CategoryFilter, SortDropdown, CatalogDropdown)
  shared/
    api/                 # base.ts (axios + ApiError), authCookies.ts (server action cookie jar)
    lib/                 # cookies.ts (client cookie reader), fonts.ts (next/font wiring)
    ui/                  # AccentButton, Input, SearchBar, SectionContainer, GetStartedButton
  widgets/
    header/, footer/, home/{Hero,ValueProposition,PopularCourses,NewCourses,Categories,Stories,Testimonials}Section
  proxy.ts               # Next 16 edge proxy (auth + role gating)
```

The `@/*` import alias maps to `./src/*` (see `tsconfig.json`).

### Auth and cookies

Three cookies define the session:

| Cookie | httpOnly | Lifetime | Purpose |
|---|---|---|---|
| `access_token` | no | 15 min | JWT, read by client axios to set `Authorization` |
| `refresh_token` | yes | 7 days | JWT refresh, server-only |
| `user_role` | no | 7 days | so proxy and `withAuth` can do role gating without an API round-trip |

`access_token` is intentionally **not** httpOnly because the axios request interceptor in `src/shared/api/base.ts` reads it via `document.cookie` (`getClientCookie`) to attach `Authorization: Bearer ...`. Server-side reads/writes go through `src/shared/api/authCookies.ts` (`setAuthCookies`, `setRoleCookie`, `clearAuthCookies`, `getAccessToken`, `getRefreshToken`), which are Server Actions.

`UserRole` (`src/features/auth/model/types/userData.ts`) is `"student" | "teacher" | "moderator" | "administrator"`. Use **`administrator`**, not `admin`, when keying any role map (this trips up `LoginForm` lookups vs. `proxy.ts` constants).

### Two-layer route protection

1. **`src/proxy.ts`** runs at the edge. It checks `access_token` and `user_role` cookies against `PROTECTED_ROUTES` (`/admin`, `/teacher`, `/dashboard`) and redirects unauthenticated users to a per-route `loginRedirect` or, for wrong-role users, to the role's `ROLE_HOME`. Public paths are listed explicitly (`/`, `/login`, `/register`, `/admin/login`, anything under `/courses/`, anything under `/register/`).
2. **`src/features/auth/ui/withAuth.tsx`** is a client HOC that re-checks `user_role` after hydration and pushes to `/login` or `/403`. Use this on pages that need a client-side guard in addition to the proxy.

If you add a new authenticated route, update **both** `PROTECTED_ROUTES` in `proxy.ts` and any `withAuth` wrapping at the page level. `ROLE_HOME` is duplicated in `proxy.ts` and `LoginForm.tsx`; keep them in sync when roles change.

### API layer

`src/shared/api/base.ts` exports a single `api` axios instance:

- Request interceptor sets `Content-Type: application/json` (when missing) and injects `Authorization: Bearer <access_token>` from the cookie.
- Response interceptor rejects with a normalized `ApiError` shape: `{ message, detail?, fields, status? }`. Backend validation errors land in `fields` (either as `data.errors` or the data object itself), so forms map `error.fields` keys onto form-field error state. See `src/features/auth/ui/forms/LoginForm.tsx` for the canonical pattern.

Feature API modules (`src/features/auth/api/authApi.ts`, `src/features/courses/api/coursesApi.ts`) are thin wrappers around `api.get/post/patch` returning typed payloads. New endpoints belong here, not inline in components.

### Server Actions vs client calls

- File-scoped `"use server"` (e.g. `src/features/auth/actions/logout.ts`, `src/shared/api/authCookies.ts`) for anything that touches `cookies()`.
- Components that need to call the API while logged in (e.g. `dashboard/page.tsx`) call the feature API functions directly because the axios interceptor handles auth from the client cookie.
- Server Components can also call feature API functions; the catalog page does this with `export const dynamic = "force-dynamic"` to avoid build-time fetching.

### UI conventions

- Tailwind v4 via `@import "tailwindcss"` in `src/app/globals.css`. There is no `tailwind.config.*`; theme tokens are declared in `:root { ... }` and exposed via `@theme inline { ... }`. Brand palette, accent colors, gradients, shadows, and font families all live in `globals.css`.
- Fonts come from `src/shared/lib/fonts.ts` (next/font) and are wired onto `<html>` in `src/app/layout.tsx` as `--font-mulish` and `--font-source-code-pro`.
- The shared `Input` component (`src/shared/ui/Input.tsx`) is a generic primitive; auth screens use the dedicated `AuthField` (`src/features/auth/ui/AuthField.tsx`) which adds the password-reveal toggle and matches the auth visual language.
- The shared `AccentButton` (`src/shared/ui/AccentButton.tsx`) renders either a `<button>` or a `<Link>` (when `href` is passed) with size variants `sm` and `md`. Reuse it on auth/CTA surfaces; do not hand-roll the same pill button.
- User-facing copy on auth screens is currently English. The 403 page and a few legacy fallbacks are Ukrainian. Match the surrounding language when editing a screen.

## Conventions to keep

- Forms validate locally (`src/features/auth/model/validation.ts`) **and** map server-side `ApiError.fields` back into the form, so both layers must stay in sync when adding fields.
- Types live under `src/features/<feature>/model/types/`; import them via the `@/` alias rather than relative paths.
- Don't introduce `middleware.ts`; this project uses the Next 16 `proxy.ts` convention.
- Form submit handlers are typed `React.FormEvent<HTMLFormElement>`. There is no `React.SubmitEvent`.
