import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { ROLE_HOME, type UserRole } from "@/entities/user";
import { AUTH_COOKIE_NAMES } from "@/shared/api/config/authCookies";

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
];

const PUBLIC_PATHS = new Set(["/", "/login", "/register", "/admin/login"]);

function isPublicPath(pathname: string): boolean {
  if (PUBLIC_PATHS.has(pathname)) return true;
  if (pathname.startsWith("/courses/") || pathname === "/courses") return true;
  if (pathname.startsWith("/register/")) return true;
  return false;
}

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-current-path", `${pathname}${request.nextUrl.search}`);
  const next = () => NextResponse.next({ request: { headers: requestHeaders } });

  if (pathname === "/health") {
    return NextResponse.json(
      { status: "ok", service: "frontend" },
      {
        headers: {
          "Cache-Control": "no-store",
        },
      },
    );
  }

  if (isPublicPath(pathname)) {
    return next();
  }

  const rule = PROTECTED_ROUTES.find((r) => r.pattern.test(pathname));

  if (!rule) {
    return next();
  }

  const accessToken = request.cookies.get(AUTH_COOKIE_NAMES.access)?.value;
  const refreshToken = request.cookies.get(AUTH_COOKIE_NAMES.refresh)?.value;

  if (!accessToken) {
    if (refreshToken) {
      return next();
    }

    return NextResponse.redirect(new URL(rule.loginRedirect, request.url));
  }

  const role = request.cookies.get(AUTH_COOKIE_NAMES.role)?.value as UserRole | undefined;

  if (!role || !rule.allowedRoles.includes(role)) {
    if (!role && refreshToken) {
      return next();
    }

    const home = role ? ROLE_HOME[role] : "/login";
    return NextResponse.redirect(new URL(home, request.url));
  }

  return next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|api/).*)"],
};
