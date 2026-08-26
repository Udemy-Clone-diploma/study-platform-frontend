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
    [locale]/            # every route lives under a locale segment; route groups: (authentication), (authenticated), (public), (errors)
    globals.css          # Tailwind v4 + tokens: @theme (colors/gradients/shadows), :root (font stacks), @theme inline (font bridges)
  entities/              # domain layer: course/, user/ (model/types, api/, lib/) — exported via index.ts
  features/              # behavior: auth/, courses/, users/, app-shell/ (each slice exports a public barrel)
  widgets/               # composed UI: header/, footer/, home/, app-shell/
  shared/                # framework-agnostic: api/, lib/, ui/
  i18n/                  # next-intl: routing.ts (locales), request.ts (message loading), navigation.ts (Link/useRouter)
  proxy.ts               # Next 16 edge proxy (next-intl routing + auth + role gating)
messages/                # en/uk/fr/es/de.json message catalogs, at the repo root
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

`UserRole` (`src/entities/user/model/types.ts`) is `"student" | "teacher" | "moderator" | "administrator"`. Use **`administrator`**, not `admin`, when keying any role map (this trips up `LoginForm` lookups vs. `proxy.ts` constants).

### Two-layer route protection

1. **`src/proxy.ts`** runs at the edge. It runs next-intl's middleware first, then strips the locale prefix via `splitLocale()` and checks `access_token` and `user_role` cookies against `PROTECTED_ROUTES` (`/admin`, `/moderator-dashboard`, `/teacher-dashboard`, `/student-dashboard`, `/profile`, `/learn`), matched against the **locale-stripped** path. Unauthenticated users are redirected to a per-route `loginRedirect`, wrong-role users to the role's `ROLE_HOME`; both are re-prefixed with the current locale. Public paths are listed explicitly (`/`, `/login`, `/register`, `/admin/login`, `/verify`, anything under `/courses/`, anything under `/register/`).
2. **`src/features/auth/ui/withAuth.tsx`** is a client HOC that re-checks `user_role` after hydration and pushes to `/login` or `/403`. Use this on pages that need a client-side guard in addition to the proxy.

Neither layer is a security boundary: `user_role` is not httpOnly (client axios reads it), so it is user-editable. They are routing UX. The real boundary is the backend, which rejects any request whose JWT lacks the permission.

The proxy has two deliberate soft-pass branches: no `access_token` but a `refresh_token` present, and an `access_token` with no `user_role` cookie plus a `refresh_token`. Both call `next()` **without a role check** so an expired 15-minute token does not bounce the user to login. The second one reaches the page with no role verified at all, which is exactly what `withAuth` is for. Put `withAuth` on any page where that matters.

If you add a new authenticated route, update **both** `PROTECTED_ROUTES` in `proxy.ts` and any `withAuth` wrapping at the page level. `ROLE_HOME` is currently duplicated in three places: `proxy.ts`, `LoginForm.tsx`, `UserDropdown.tsx`. Keep them in sync when roles change (and ideally consolidate into `entities/user/` as a single source of truth).

### Internationalization (next-intl)

Five locales: `en` (default), `uk`, `fr`, `es`, `de`, declared in `src/i18n/routing.ts` with `localePrefix: "always"`. Every URL carries a prefix (`/en/admin`, `/uk/catalog`); there are no unprefixed routes, and `src/proxy.ts` redirects to add one.

- **Copy lives in `messages/<locale>.json`** at the repo root, grouped into namespaces. Read it with `useTranslations("Namespace")` in client components or `getTranslations("Namespace")` in Server Components (`getTranslations({ locale, namespace })` in `generateMetadata`, which is why grepping for the string form alone under-reports usage).
- **There is no fallback chain.** `src/i18n/request.ts` loads exactly one locale file per request. A key in `en.json` that is missing from `uk.json` does not fall back to English: next-intl logs the error and renders the literal key path (`Namespace.key`) in the UI. Adding a key means adding it to **all five** files. Keep them at exact parity.
- **Navigate through `@/i18n/navigation`**, never `next/link` or `next/navigation`. Its `Link` and `useRouter` carry the locale prefix; the plain Next equivalents drop it and bounce the user to the default locale.
- **`src/app/[locale]/layout.tsx` ships the whole catalog to the client** via `getMessages()` into `NextIntlClientProvider`, so an unused namespace is real payload on every page. Delete namespaces when their last consumer goes.

### Copy language

- **Admin surfaces are English-only and must not use next-intl.** That covers `/admin/*`, `src/features/*/ui/admin/`, `widgets/dashboard/AdminDashboard.tsx`, and the admin finance panel at `/admin/payment`. Write plain English string literals. It is an internal staff tool; translating it five ways is wasted effort.
- **Everything else is localized**, including moderator surfaces (`ModeratorCoursesTable` and friends) and the user-facing payment pages (teacher payments, student payments, checkout). Only `/admin/payment` is exempt.
- The trap when a component straddles both: a `t(...)` label silently overrides a label passed in from a shared helper. `deriveCourseState` in `entities/course/model/course-state.ts` supplies English labels, and localized call sites deliberately override them with `t(...)` while keeping the derived tone, colour and tooltip.

### API layer

`src/shared/api/base.ts` exports a single `api` axios instance:

- Request interceptor sets `Content-Type: application/json` (when missing) and injects `Authorization: Bearer <access_token>` from the cookie.
- Response interceptor rejects with a normalized `ApiError` shape: `{ message, detail?, fields, status? }`. Backend validation errors land in `fields` (either as `data.errors` or the data object itself), so forms map `error.fields` keys onto form-field error state. See `src/features/auth/ui/forms/LoginForm.tsx` for the canonical pattern.

API modules (`src/features/auth/api/authApi.ts`, `src/entities/course/api/courseApi.ts`, `src/entities/user/api/userApi.ts`) are thin wrappers around `api.get/post/patch` returning typed payloads. New endpoints belong here, not inline in components.

- **Course URLs use slug, not ID.** The detail route is `/courses/{slug}/`; the API function is `getCourseBySlug(slug: string)` in `src/entities/course/api/courseApi.ts`. Always link to `course.slug`, never `course.id`. The list serializer still returns `teacher_name` as a flat field; the detail serializer replaces it with a nested `teacher: { id, name, avatar, bio }` object (type `Teacher`). `CourseDetail` is typed as `Omit<CourseListItem, "teacher_name"> & { teacher: Teacher; modules: CourseModule[]; ... }`.
- **`getCategories` normalizes two response shapes.** The backend may return either a plain `Category[]` or a paginated `{ count, next, previous, results: Category[] }`. The function handles both via `Array.isArray(data) ? data : data.results`. Apply the same guard defensively to any list endpoint that may paginate in future.
- **Profile update endpoints are role-specific.** `PATCH /auth/me/profile/teacher/`, `/student/`, `/moderator/` — one per role. If the token's role doesn't match the endpoint, the backend returns 403. The corresponding functions are `updateTeacherProfile`, `updateStudentProfile`, `updateModeratorProfile` in `src/features/auth/api/authApi.ts`. Each returns the role-specific profile subobject (`TeacherProfile` / `StudentProfile` / `ModeratorProfile`), **not** the full `UserData`. Do not widen the return type to `UserData` to silence a TS error: the runtime payload will lack `email`, `role`, `first_name`, etc. If you need fresh `UserData` after a profile update, merge it manually as `{ ...user, profile: result }` or call `getMe()` again. The old `updateMeProfile` no longer exists.

### Server Actions vs client calls

- File-scoped `"use server"` (e.g. `src/features/auth/actions/logout.ts`, `src/shared/api/authCookies.ts`) for anything that touches `cookies()`.
- Components that need to call the API while logged in (e.g. `dashboard/page.tsx`) call the feature API functions directly because the axios interceptor handles auth from the client cookie.
- Server Components can also call feature API functions; the catalog page does this with `export const dynamic = "force-dynamic"` to avoid build-time fetching.

### UI and styling

Tailwind v4 via `@import "tailwindcss"` in `src/app/globals.css`. No `tailwind.config.*`. Tokens live in three blocks:

- `@theme` for colors, gradients, shadows. Tailwind generates utility classes; `var(--color-*)` also works in components.
- `:root` for font stacks only (`--font-base`, `--font-accent`), which reference next/font runtime vars Tailwind cannot resolve at build time.
- `@theme inline` bridges (`--font-sans`, `--font-mono`) pass the runtime values through. `--card-bg` and `--card-border-color` are set inline per-component and do not belong in these blocks. Fonts come from `src/shared/lib/fonts.ts` and are wired onto `<html>` in `src/app/layout.tsx` as `--font-mulish` and `--font-source-code-pro`.

Rules (apply in order of strictness):

- **Never hardcode colors, sizes, or spacing.** Use tokens via paren shorthand: `text-(--color-text-secondary)`, `bg-(--color-catalog-category-active)`, `border-(--color-blue)`, `font-(family-name:--font-accent)`. The IDE plugin flags v3 `text-[var(--color-x)]` via `suggestCanonicalClasses`. If a needed shade is missing, add a token in `globals.css`, do not paste `text-[#xxx]` in JSX.
- **Inline `style={{ ... }}` only for runtime-computed values** (CSS custom properties like `--card-bg: ${theme.gradient}`). Static positioning, sizing, flex, gap, padding all go in Tailwind classes (`absolute`, `h-9 w-9`, `rotate-180`, `gap-4`).
- **Prefer Tailwind presets to arbitrary values** when they match: `aspect-video` over `aspect-[16/9]`, `text-base` over `text-[1rem]`, `h-10` over `h-[40px]`.
- **Icons.** Use `lucide-react` for UI marks that toggle state or follow text color (Check, ChevronDown, Heart, Star, Search). `next/image` is for real raster brand assets in `/public/`, not for chevron PNGs. Do not ship paired `.png` + `.svg` for the same icon.
- **In-place URL mutations need `{ scroll: false }`.** Sort, filter checkboxes, category buttons, and search all mutate the URL on the same page. Default Next 16 behavior scrolls to top, which destroys list UX. Pass `{ scroll: false }` to `router.push` and `scroll={false}` to `<Link>`. Pagination is the exception: scroll-to-top is correct there.
- **Figma opacity gotcha:** when a Figma layer has its opacity set at the layer level (not the fill level), the Tailwind JSX plugin exports `text-black/20`. The actual design color is always solid `#121212` = `text-(--color-text-primary)`. Do not apply opacity from Figma exports blindly.
- **Reuse before creating.** Place reusable primitives in `src/shared/ui/`, feature-scoped UI in `src/features/<slice>/ui/`. Before creating a new component, grep for an existing one. Prefer composition over large monoliths.
- **Component JSDoc.** Each exported component in `src/shared/ui/` and `src/features/*/ui/` gets one-line JSDoc above it.
- **Shared primitives that already exist:** `Input` (`src/shared/ui/Input.tsx`) is the generic primitive; auth screens use `AuthField` (`src/features/auth/ui/AuthField.tsx`) which adds the password-reveal toggle. `AccentButton` is the solid-black pill (auth, header, hero CTAs); `GradientButton` is the brand-gradient pill (home/marketing). Do not swap them, they carry different semantic weight.
- **Copy language.** Never hardcode user-facing copy outside admin surfaces; pull it from `messages/` via next-intl. See "Copy language" above for the admin exemption.
- **Accessibility.** WCAG: semantic elements, focus rings, `aria-*`, keyboard support, sufficient contrast.
- For Figma-driven tasks, follow `FIGMA.md`.

## Conventions to keep

- Forms validate locally (`src/features/auth/model/validation.ts`) **and** map server-side `ApiError.fields` back into the form. Keep both layers in sync when adding fields. Form submit handlers are typed `React.FormEvent<HTMLFormElement>` (no `React.SubmitEvent`).
- Domain types (Course, User, Category) live in `src/entities/<thing>/model/`; feature-internal types (form state, validation shape) stay in `src/features/<feature>/model/types/`. Split sub-domain types into separate model files (e.g. `entities/course/model/category.ts`, `module.ts`, `teacher.ts`) and barrel-export from the slice's `index.ts`. Never put all types in a single monolithic `types.ts` once there are 3+ distinct concepts.
- **Imports.** Within a slice, relative paths (`../model/types`) are fine and used in `entities/`. Across slices and layers, always go through the slice's `index.ts` barrel (`@/features/courses`), never deep into files. Several `features/*` slices still lack barrels (`auth`, `profile`, `users`, `app-shell`) and app routes deep-import into them: when touching one of those slices, add an `index.ts` and switch consumers.
- Don't introduce `middleware.ts`; this project uses the Next 16 `proxy.ts` convention.
