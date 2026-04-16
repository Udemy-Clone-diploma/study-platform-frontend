import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import type { UserRole } from "@/features/auth/model/types/userData";

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
    pattern: /^\/teacher(\/|$)/,
    allowedRoles: ["teacher"],
    loginRedirect: "/login",
  },
  {
    pattern: /^\/dashboard(\/|$)/,
    allowedRoles: ["student", "teacher"],
    loginRedirect: "/login",
  },
];

const ROLE_HOME: Record<UserRole, string> = {
  administrator: "/admin",
  moderator: "/admin",
  teacher: "/teacher",
  student: "/dashboard",
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

  if (isPublicPath(pathname)) {
    return NextResponse.next();
  }

  const rule = PROTECTED_ROUTES.find((r) => r.pattern.test(pathname));

  if (!rule) {
    return NextResponse.next();
  }

  const accessToken = request.cookies.get("access_token")?.value;

  if (!accessToken) {
    return NextResponse.redirect(new URL(rule.loginRedirect, request.url));
  }

  const role = request.cookies.get("user_role")?.value as UserRole | undefined;

  if (!role || !rule.allowedRoles.includes(role)) {
    const home = role ? ROLE_HOME[role] : "/login";
    return NextResponse.redirect(new URL(home ?? "/login", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|api/).*)",
  ],
};
