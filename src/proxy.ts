import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import createMiddleware from "next-intl/middleware";
import { routing } from "@/i18n/routing";
import { ROLE_HOME, type UserRole } from "@/entities/user";
import { AUTH_COOKIE_NAMES } from "@/shared/api/config/authCookies";

const handleI18nRouting = createMiddleware(routing);

type RouteRule = {
  pattern: RegExp;
  allowedRoles: UserRole[];
  loginRedirect: string;
};

const PROTECTED_ROUTES: RouteRule[] = [
  {
    pattern: /^\/admin(\/|$)/,
    allowedRoles: ["administrator"],
    loginRedirect: "/admin/login",
  },
  {
    pattern: /^\/moderator-dashboard(\/|$)/,
    allowedRoles: ["moderator"],
    loginRedirect: "/login",
  },
  {
    pattern: /^\/teacher-dashboard(\/|$)/,
    allowedRoles: ["teacher"],
    loginRedirect: "/login",
  },
  {
    pattern: /^\/student-dashboard(\/|$)/,
    allowedRoles: ["student", "teacher"],
    loginRedirect: "/login",
  },
  {
    pattern: /^\/profile(\/|$)/,
    allowedRoles: ["student", "teacher", "moderator", "administrator"],
    loginRedirect: "/login",
  },
  {
    pattern: /^\/learn(\/|$)/,
    allowedRoles: ["student", "teacher", "moderator", "administrator"],
    loginRedirect: "/login",
  },
];

const PUBLIC_PATHS = new Set(["/", "/login", "/register", "/admin/login", "/verify"]);

function isPublicPath(pathname: string): boolean {
  if (PUBLIC_PATHS.has(pathname)) return true;
  if (pathname.startsWith("/courses/") || pathname === "/courses") return true;
  if (pathname.startsWith("/register/")) return true;
  return false;
}

/** Strips a recognized locale prefix (e.g. "/en/profile" -> { locale: "en", path: "/profile" }). */
function splitLocale(pathname: string): { locale: string; path: string } {
  const [, maybeLocale, ...rest] = pathname.split("/");
  if ((routing.locales as readonly string[]).includes(maybeLocale)) {
    return { locale: maybeLocale, path: `/${rest.join("/")}` || "/" };
  }
  return { locale: routing.defaultLocale, path: pathname };
}

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname === "/health") {
    return NextResponse.json(
      { status: "ok", service: "frontend" },
      { headers: { "Cache-Control": "no-store" } },
    );
  }

  // Set before delegating to next-intl so its internal `new Headers(request.headers)`
  // clone (used for the NextResponse.next({ request: { headers } }) override) carries it too.
  request.headers.set("x-current-path", `${pathname}${request.nextUrl.search}`);

  const intlResponse = handleI18nRouting(request);

  // A pure locale redirect (missing/wrong prefix): let the browser follow it,
  // auth/role checks run again on the follow-up request that carries the locale.
  if (intlResponse.headers.get("location")) {
    return intlResponse;
  }

  const { locale, path: normalizedPath } = splitLocale(pathname);

  if (isPublicPath(normalizedPath)) {
    return intlResponse;
  }

  const rule = PROTECTED_ROUTES.find((r) => r.pattern.test(normalizedPath));

  if (!rule) {
    return intlResponse;
  }

  const accessToken = request.cookies.get(AUTH_COOKIE_NAMES.access)?.value;
  const refreshToken = request.cookies.get(AUTH_COOKIE_NAMES.refresh)?.value;

  if (!accessToken) {
    if (refreshToken) {
      return intlResponse;
    }

    return NextResponse.redirect(new URL(`/${locale}${rule.loginRedirect}`, request.url));
  }

  const role = request.cookies.get(AUTH_COOKIE_NAMES.role)?.value as UserRole | undefined;

  if (!role || !rule.allowedRoles.includes(role)) {
    if (!role && refreshToken) {
      return intlResponse;
    }

    const home = role ? ROLE_HOME[role] : "/login";
    return NextResponse.redirect(new URL(`/${locale}${home}`, request.url));
  }

  return intlResponse;
}

export const config = {
  // Excludes API routes, Next internals, and any path with a file extension
  // (static assets under /public — logos, icons, images, fonts, etc.) so
  // next-intl's locale routing doesn't try to prefix them with a locale.
  matcher: ["/((?!api/|_next/static|_next/image|.*\\..*).*)"],
};
