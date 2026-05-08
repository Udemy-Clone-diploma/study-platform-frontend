export const AUTH_COOKIE_NAMES = {
  access: "access_token",
  refresh: "refresh_token",
  role: "user_role",
} as const;

export const AUTH_COOKIE_CONFIG = {
  access: {
    name: AUTH_COOKIE_NAMES.access,
    maxAge: 60 * 15,
  },
  refresh: {
    name: AUTH_COOKIE_NAMES.refresh,
    maxAge: 60 * 60 * 24 * 7,
  },
  role: {
    name: AUTH_COOKIE_NAMES.role,
    maxAge: 60 * 60 * 24 * 7,
  },
} as const;

const baseCookieOptions = {
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
};

export const SECURE_COOKIE_OPTIONS = {
  ...baseCookieOptions,
  httpOnly: true,
};

export const PUBLIC_COOKIE_OPTIONS = {
  ...baseCookieOptions,
  httpOnly: false,
};
