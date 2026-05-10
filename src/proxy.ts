import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import type { UserRole } from "@/entities/user";
import { AUTH_COOKIE_NAMES } from "@/shared/api/config/authCookies";

type RouteRule = {
  pattern: RegExp;
  allowedRoles: UserRole[];
  loginRedirect: string;
};

const PROTECTED_ROUTES: RouteRule[] = [
  {
    pattern: /^\/admin(\/|$)/,
    allowedRoles: ["administrator", "moderator"],
    loginRedirect: "/admin/login",
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

const ROLE_HOME: Record<UserRole, string> = {
  administrator: "/admin",
  moderator: "/admin",
  teacher: "/teacher-dashboard",
  student: "/student-dashboard",
};

const PUBLIC_PATHS = new Set(["/", "/login", "/register", "/admin/login"]);

function isPublicPath(pathname: string): boolean {
  if (PUBLIC_PATHS.has(pathname)) return true;
  if (pathname.startsWith("/courses/") || pathname === "/courses") return true;
  if (pathname.startsWith("/register/")) return true;
  return false;
}

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

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
    return NextResponse.next();
  }

  const rule = PROTECTED_ROUTES.find((r) => r.pattern.test(pathname));

  if (!rule) {
    return NextResponse.next();
  }

  const accessToken = request.cookies.get(AUTH_COOKIE_NAMES.access)?.value;

  if (!accessToken) {
    return NextResponse.redirect(new URL(rule.loginRedirect, request.url));
  }

  const role = request.cookies.get(AUTH_COOKIE_NAMES.role)?.value as UserRole | undefined;

  if (!role || !rule.allowedRoles.includes(role)) {
    const home = role ? ROLE_HOME[role] : "/login";
    return NextResponse.redirect(new URL(home ?? "/login", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|api/).*)"],
};
