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
  app/                   # Next 16 app router; route groups: (authentication), (authenticated), (public), (errors)
    globals.css          # Tailwind v4 + tokens: @theme (colors/gradients/shadows), :root (font stacks), @theme inline (font bridges)
  entities/              # domain layer: course/, user/ (model/types, api/, lib/) — exported via index.ts
  features/              # behavior: auth/, courses/, users/, app-shell/ (each slice exports a public barrel)
  widgets/               # composed UI: header/, footer/, home/, app-shell/
  shared/                # framework-agnostic: api/, lib/, ui/
  proxy.ts               # Next 16 edge proxy (auth + role gating)
```

FSD layer order: `shared → entities → features → widgets → app`. Imports go upward only; siblings within a layer don't import each other. Domain types/helpers belong in `entities/<thing>/`, not under `features/<x>/model/types/`. Cross-slice consumers should import from a slice's `index.ts` barrel (e.g. `@/features/courses`), not deep into its files.

The `@/*` import alias maps to `./src/*` (see `tsconfig.json`).

### Auth and cookies

Three cookies define the session:

| Cookie          | httpOnly | Lifetime | Purpose                                                              |
| --------------- | -------- | -------- | -------------------------------------------------------------------- |
| `access_token`  | no       | 15 min   | JWT, read by client axios to set `Authorization`                     |
| `refresh_token` | yes      | 7 days   | JWT refresh, server-only                                             |
| `user_role`     | no       | 7 days   | so proxy and `withAuth` can do role gating without an API round-trip |

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

- **Course URLs use slug, not ID.** The detail route is `/courses/{slug}/`; the API function is `getCourseBySlug(slug: string)` in `src/entities/course/api/courseApi.ts`. Always link to `course.slug`, never `course.id`. The list serializer still returns `teacher_name` as a flat field; the detail serializer replaces it with a nested `teacher: { id, name, avatar, bio }` object (type `Teacher`). `CourseDetail` is typed as `Omit<CourseListItem, "teacher_name"> & { teacher: Teacher; modules: CourseModule[]; ... }`.
- **`getCategories` normalizes two response shapes.** The backend may return either a plain `Category[]` or a paginated `{ count, next, previous, results: Category[] }`. The function handles both via `Array.isArray(data) ? data : data.results`. Apply the same guard defensively to any list endpoint that may paginate in future.
- **Profile update endpoints are role-specific.** `PATCH /auth/me/profile/teacher/`, `/student/`, `/moderator/` — one per role. If the token's role doesn't match the endpoint, the backend returns 403. The corresponding functions are `updateTeacherProfile`, `updateStudentProfile`, `updateModeratorProfile` in `src/features/auth/api/authApi.ts`. The old `updateMeProfile` no longer exists.

### Server Actions vs client calls

- File-scoped `"use server"` (e.g. `src/features/auth/actions/logout.ts`, `src/shared/api/authCookies.ts`) for anything that touches `cookies()`.
- Components that need to call the API while logged in (e.g. `dashboard/page.tsx`) call the feature API functions directly because the axios interceptor handles auth from the client cookie.
- Server Components can also call feature API functions; the catalog page does this with `export const dynamic = "force-dynamic"` to avoid build-time fetching.

### Design rules

- Always use components from `src/shared/ui/` and feature barrels such as `@/features/courses` when possible.
- Prioritize Figma fidelity while preserving the project's design-system conventions and accessibility requirements.
- Avoid hardcoded values; use the design tokens declared in `src/app/globals.css` (`--color-*`, `--gradient-*`, `--font-base`, `--font-accent`, etc.) via Tailwind v4 paren shorthand (`text-(--color-text-primary)`, `font-(family-name:--font-accent)`, etc.).
- Follow WCAG requirements for accessibility: semantic elements, focus rings, `aria-*`, keyboard support, and sufficient contrast against the brand palette.
- Add component documentation as a single-line JSDoc above each exported component in `src/shared/ui/` and `src/features/*/ui/`.
- Place reusable UI primitives in `src/shared/ui/`; place feature-scoped UI in `src/features/<slice>/ui/` and export through the slice's `index.ts`.
- Avoid inline `style={{ ... }}` unless the value is runtime-computed, such as CSS custom properties.
- Do not create duplicate UI primitives if a semantically equivalent component already exists in the codebase.
- Before creating new UI components, search the repository for existing implementations.
- Prefer composition of existing components over generating large monolithic components.
- Keep components small and split complex sections into reusable subcomponents.
- Preserve responsive behavior inferred from Figma layouts and auto-layout constraints.

- For Figma-driven tasks, follow the workflow and implementation constraints defined in `FIGMA.md`.

### UI conventions

- Tailwind v4 via `@import "tailwindcss"` in `src/app/globals.css`. There is no `tailwind.config.*`. Design tokens live in three blocks:
  - `@theme` — colors, gradients, shadows. Tailwind generates utility classes from these; `var(--color-*)` still works in components.
  - `:root` — font stack vars only (`--font-base`, `--font-accent`), because they reference next/font runtime vars (`--font-mulish`, `--font-source-code-pro`) that Tailwind cannot resolve at build time.
  - `@theme inline` — font bridges (`--font-sans`, `--font-mono`) that pass the runtime values through as-is.
  - `--card-bg` and `--card-border-color` are set inline per-component (`style={{"--card-bg": ...}}`); they do not belong in any of the three blocks above.
- Fonts come from `src/shared/lib/fonts.ts` (next/font) and are wired onto `<html>` in `src/app/layout.tsx` as `--font-mulish` and `--font-source-code-pro`.
- The shared `Input` component (`src/shared/ui/Input.tsx`) is a generic primitive; auth screens use the dedicated `AuthField` (`src/features/auth/ui/AuthField.tsx`) which adds the password-reveal toggle and matches the auth visual language.
- The shared `AccentButton` (`src/shared/ui/AccentButton.tsx`) renders a solid-black pill — either a `<button>` or a `<Link>` (when `href` is passed) with size variants `sm` and `md`. Use it on auth forms, the header, and hero CTAs.
- The shared `GradientButton` (`src/shared/ui/GradientButton.tsx`) renders a brand-gradient pill. Use it on home/marketing surfaces (e.g. `CategoriesSection`). Do not swap these two — they carry different semantic weight.
- Tailwind v4 paren shorthand for CSS vars: `text-(--color-x)`, `font-(family-name:--font-x)`. The IDE plugin flags v3 `text-[var(--color-x)]` via `suggestCanonicalClasses`.
- Prefer Tailwind preset utilities over arbitrary values when they match (`aspect-video` over `aspect-[16/9]`, `text-base` over `text-[1rem]`, `h-10` over `h-[40px]`).
- Icons: `lucide-react` for UI marks that toggle state or follow text color (Heart, Star, ChevronDown, Search). Use `next/image` for raster brand assets in `/public/`. Do not ship paired `.png` + `.svg` for the same icon.
- Inline `style={{ ... }}` is reserved for runtime-computed values (most often custom CSS variables like `--card-bg`). Static styling stays in classes.
- **Figma plugin gotcha:** when a Figma layer has its opacity set at the layer level (not the fill level), the Tailwind JSX plugin exports `text-black/20`. The actual design color is always solid `#121212` = `text-(--color-text-primary)`. Do not apply opacity from Figma exports blindly.
- User-facing copy on auth screens is currently English. The 403 page and a few legacy fallbacks are Ukrainian. Match the surrounding language when editing a screen.

## Conventions to keep

- Forms validate locally (`src/features/auth/model/validation.ts`) **and** map server-side `ApiError.fields` back into the form, so both layers must stay in sync when adding fields.
- Domain types (Course, User, Category) live in `src/entities/<thing>/model/`; feature-internal types (form state, validation shape) stay in `src/features/<feature>/model/types/`. Always import via the `@/` alias, not relative paths. Within an entity slice, split distinct sub-domain types into separate model files (e.g. `entities/course/model/category.ts`, `module.ts`, `teacher.ts`) and barrel-export them all from the slice's `index.ts`. Never put all types in a single monolithic `types.ts` once there are 3+ distinct concepts.
- FSD siblings within a layer cannot import each other. If a type is needed by multiple entities, it belongs in `shared/`. If it belongs to one entity, keep it in that entity's model files — do not cross-import between entity slices.
- Don't introduce `middleware.ts`; this project uses the Next 16 `proxy.ts` convention.
- Form submit handlers are typed `React.FormEvent<HTMLFormElement>`. There is no `React.SubmitEvent`.
